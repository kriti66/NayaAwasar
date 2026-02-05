import express from 'express';
import Company from '../models/Company.js';
import Job from '../models/Job.js';
import KYC from '../models/KYC.js';
import Application from '../models/Application.js';
import { requireAuth, requireAdmin, getJwtSecret } from '../middleware/auth.js';
import jwt from 'jsonwebtoken';
import multer from 'multer';
import path from 'path';
import fs from 'fs';

const router = express.Router();

// MULTER SETUP
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const dir = 'uploads/company';
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }
        cb(null, dir);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, 'company-' + uniqueSuffix + path.extname(file.originalname));
    }
});

const upload = multer({
    storage: storage,
    fileFilter: (req, file, cb) => {
        const filetypes = /jpeg|jpg|png|webp/;
        const mifimetype = filetypes.test(file.mimetype);
        const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
        if (mifimetype && extname) {
            return cb(null, true);
        }
        cb(new Error('Only images are allowed'));
    }
});

// @route   POST /api/companies
// @desc    Create a new company (Recruiter Only)
// @access  Private
router.post('/', requireAuth, async (req, res) => {
    try {
        if (req.user.role !== 'recruiter' && req.user.role !== 'admin') {
            return res.status(403).json({ message: 'Only recruiters can create companies' });
        }

        const { name, industry, size, headquarters, contact, website } = req.body;

        const newCompany = new Company({
            name,
            industry,
            size,
            headquarters,
            contact,
            website,
            recruiters: [req.user.id] // Link the creator
        });

        await newCompany.save();
        res.status(201).json(newCompany);
    } catch (error) {
        console.error("Error creating company:", error);
        res.status(500).json({ message: 'Server error' });
    }
});

// @route   GET /api/companies/my
// @desc    Get recruiter's company profile (with auto-prefill from KYC)
// @access  Private
router.get('/my', requireAuth, async (req, res) => {
    try {
        let company = await Company.findOne({ recruiters: req.user.id }).populate('recruiters', 'fullName email');

        if (!company) {
            // Check if user has a recruiter KYC (only if recruiter)
            if (req.user.role === 'recruiter') {
                const kyc = await KYC.findOne({ userId: req.user.id, role: 'recruiter' });

                if (kyc) {
                    // Create company from KYC data (non-sensitive fields only)
                    company = new Company({
                        name: kyc.companyName,
                        industry: kyc.industry || 'Not Specified',
                        website: kyc.website,
                        headquarters: kyc.companyAddress || 'Not Specified',
                        logo: kyc.companyLogo,
                        contact: {
                            email: kyc.officialEmail || req.user.email,
                            address: kyc.companyAddress || 'Not Specified'
                        },
                        size: '1-10 employees', // Default required field
                        recruiters: [req.user.id],
                        status: 'draft'
                    });

                    await company.save();
                    company = await Company.findById(company._id).populate('recruiters', 'fullName email');
                }
            }
        }

        if (!company) {
            return res.status(404).json({ message: 'No company found and no KYC data available to prefill.' });
        }

        // Calculate Statistics for "my" company as well
        const totalJobs = await Job.countDocuments({ company_id: company._id });
        const activeOpenings = await Job.countDocuments({ company_id: company._id, status: 'Active' });
        const companyJobIds = await Job.find({ company_id: company._id }).select('_id');
        const successfulHires = await Application.countDocuments({
            job_id: { $in: companyJobIds.map(j => j._id) },
            status: 'Offer Extended'
        });

        const companyObj = company.toObject();
        companyObj.stats = {
            totalJobs,
            activeOpenings,
            successfulHires
        };

        res.json(companyObj);
    } catch (error) {
        console.error("Error fetching my company:", error);
        res.status(500).json({ message: 'Server error' });
    }
});

// @route   GET /api/companies/me/jobs
// @desc    Get recruiter's own company recent jobs
// @access  Private
router.get('/me/jobs', requireAuth, async (req, res) => {
    try {
        const company = await Company.findOne({ recruiters: req.user.id });
        if (!company) {
            return res.status(404).json({ message: 'Company not found' });
        }

        const limit = parseInt(req.query.limit) || 3;
        const jobs = await Job.find({
            company_id: company._id,
            status: 'Active'
        })
            .sort({ createdAt: -1 })
            .limit(limit)
            .populate('company_id', 'name logo headquarters')
            .lean();

        // Attach applicant counts
        const jobsWithStats = await Promise.all(jobs.map(async (job) => {
            const applicantCount = await Application.countDocuments({ job_id: job._id });
            return {
                ...job,
                applicantCount,
                company: job.company_id // Map company_id to company for cleaner frontend field access if desired, or just use company_id
            };
        }));

        res.json(jobsWithStats);
    } catch (error) {
        console.error("Error fetching own company jobs:", error);
        res.status(500).json({ message: 'Server error' });
    }
});

// @route   GET /api/companies/:id
// @desc    Get company profile by ID (Public)
// @access  Public
router.get('/:id', async (req, res) => {
    try {
        const company = await Company.findById(req.params.id).populate('recruiters', 'fullName email');
        if (!company) {
            return res.status(404).json({ message: 'Company not found' });
        }

        // View Counting Logic
        const authHeader = req.headers['authorization'];
        if (authHeader) {
            const token = authHeader.split(' ')[1];
            if (token) {
                try {
                    const decoded = jwt.verify(token, getJwtSecret());
                    // Only count views from jobseekers
                    if (decoded.role === 'jobseeker' || decoded.role === 'job_seeker') {
                        // Ensure profileViews exists (for legacy records)
                        if (!company.profileViews) {
                            company.profileViews = { total: 0, viewedBy: [] };
                        }

                        const hasViewed = company.profileViews.viewedBy.some(
                            v => v.user.toString() === decoded.id
                        );

                        if (!hasViewed) {
                            company.profileViews.viewedBy.push({ user: decoded.id });
                            company.profileViews.total = (company.profileViews.total || 0) + 1;
                            await company.save();
                        }
                    }
                } catch (err) {
                    // Ignore counting if token is invalid, just proceed to return data
                    console.error("View count error (ignored):", err.message);
                }
            }
        }

        // Calculate Statistics
        const totalJobs = await Job.countDocuments({ company_id: company._id });
        const activeOpenings = await Job.countDocuments({ company_id: company._id, status: 'Active' });

        // Count Successful Hires (Applications with status 'Offer Extended' for any job of this company)
        const companyJobIds = await Job.find({ company_id: company._id }).select('_id');
        const successfulHires = await Application.countDocuments({
            job_id: { $in: companyJobIds.map(j => j._id) },
            status: 'Offer Extended'
        });

        const companyObj = company.toObject();
        companyObj.stats = {
            totalJobs,
            activeOpenings,
            successfulHires
        };

        res.json(companyObj);
    } catch (error) {
        console.error("Error fetching company:", error);
        res.status(500).json({ message: 'Server error' });
    }
});

// @route   GET /api/companies/me/stats
// @desc    Get recruiter's company stats (Jobs, Openings, Hires)
// @access  Private
router.get('/me/stats', requireAuth, async (req, res) => {
    try {
        const company = await Company.findOne({ recruiters: req.user.id });
        if (!company) {
            return res.status(404).json({ message: 'Company not found' });
        }

        const stats = {
            totalJobs: await Job.countDocuments({ company_id: company._id }),
            activeOpenings: await Job.countDocuments({ company_id: company._id, status: 'Active' }),
            successfulHires: await Application.countDocuments({
                job_id: { $in: await Job.find({ company_id: company._id }).distinct('_id') },
                status: 'Offer Extended'
            })
        };

        res.json(stats);
    } catch (error) {
        console.error("Error fetching company stats:", error);
        res.status(500).json({ message: 'Server error' });
    }
});

// @route   GET /api/companies/:id/jobs
// @desc    Get recent jobs for a specific company
// @access  Public
router.get('/:id/jobs', async (req, res) => {
    try {
        const limit = parseInt(req.query.limit) || 3;
        const jobs = await Job.find({
            company_id: req.params.id,
            status: 'Active',
            moderationStatus: 'Approved'
        })
            .sort({ createdAt: -1 })
            .limit(limit);

        res.json(jobs);
    } catch (error) {
        console.error("Error fetching company jobs:", error);
        res.status(500).json({ message: 'Server error' });
    }
});

// @route   PUT /api/companies/:id
// @desc    Update company profile (Linked Recruiters Only)
// @access  Private
router.put('/:id', requireAuth, async (req, res) => {
    try {
        const company = await Company.findById(req.params.id);
        if (!company) {
            return res.status(404).json({ message: 'Company not found' });
        }

        // Check if user is linked to this company
        const isLinked = company.recruiters.some(rId => rId.toString() === req.user.id);
        if (!isLinked && req.user.role !== 'admin') {
            return res.status(403).json({ message: 'Unauthorized to edit this company' });
        }

        // Update fields (excluding KYC-protected, status, and adminFields)
        const updates = req.body;
        delete updates.status;
        delete updates.adminFields;
        delete updates.recruiters;

        // Prevent editing KYC-derived fields if user is not admin
        if (req.user.role !== 'admin') {
            delete updates.name;
            delete updates.industry;
        }

        Object.assign(company, updates);

        // If not admin, any update resets status to pending for review
        if (req.user.role !== 'admin') {
            company.status = 'pending';
        }

        await company.save();

        res.json(company);
    } catch (error) {
        console.error("Error updating company:", error);
        res.status(500).json({ message: 'Server error' });
    }
});

// @route   PUT /api/companies/:id/logo
// @desc    Upload company logo
// @access  Private
router.put('/:id/logo', requireAuth, upload.single('logo'), async (req, res) => {
    try {
        const company = await Company.findById(req.params.id);
        if (!company) return res.status(404).json({ message: 'Company not found' });

        // Check ownership
        const isLinked = company.recruiters.some(rId => rId.toString() === req.user.id);
        if (!isLinked && req.user.role !== 'admin') {
            return res.status(403).json({ message: 'Unauthorized' });
        }

        if (!req.file) return res.status(400).json({ message: 'No file uploaded' });

        company.logo = `/uploads/company/${req.file.filename}`;

        // Reset status to pending on change if not admin
        if (req.user.role !== 'admin') {
            company.status = 'pending';
        }

        await company.save();
        res.json(company);
    } catch (error) {
        console.error("Error uploading logo:", error);
        res.status(500).json({ message: 'Server error' });
    }
});

// @route   PUT /api/companies/:id/photos
// @desc    Upload company photos
// @access  Private
router.put('/:id/photos', requireAuth, upload.array('photos', 5), async (req, res) => {
    try {
        const company = await Company.findById(req.params.id);
        if (!company) return res.status(404).json({ message: 'Company not found' });

        // Check ownership
        const isLinked = company.recruiters.some(rId => rId.toString() === req.user.id);
        if (!isLinked && req.user.role !== 'admin') {
            return res.status(403).json({ message: 'Unauthorized' });
        }

        if (!req.files || req.files.length === 0) return res.status(400).json({ message: 'No files uploaded' });

        const newPhotos = req.files.map(file => `/uploads/company/${file.filename}`);

        // Append new photos
        company.photos = [...(company.photos || []), ...newPhotos];

        // Reset status to pending on change if not admin
        if (req.user.role !== 'admin') {
            company.status = 'pending';
        }

        await company.save();
        res.json(company);
    } catch (error) {
        console.error("Error uploading photos:", error);
        res.status(500).json({ message: 'Server error' });
    }
});

// @route   PATCH /api/companies/:id/status
// @desc    Update company status (Admin Only)
// @access  Private/Admin
router.patch('/:id/status', requireAuth, requireAdmin, async (req, res) => {
    try {
        const { status, comment } = req.body;
        const company = await Company.findById(req.params.id);

        if (!company) {
            return res.status(404).json({ message: 'Company not found' });
        }

        const validStatuses = ['draft', 'pending', 'approved', 'rejected'];
        if (!validStatuses.includes(status)) {
            return res.status(400).json({ message: 'Invalid status' });
        }

        company.status = status;
        if (status === 'rejected') {
            company.adminFeedback = comment || 'No feedback provided';
        }

        company.adminFields.moderationStatus = status === 'approved' ? 'approved' : status === 'rejected' ? 'rejected' : 'under_review';
        company.adminFields.reviewHistory.push({
            action: status,
            adminId: req.user.id,
            comment: comment || `Status updated to ${status}`
        });

        await company.save();
        res.json({ message: `Company status updated to ${status}`, company });
    } catch (error) {
        console.error("Error updating company status:", error);
        res.status(500).json({ message: 'Server error' });
    }
});

export default router;
