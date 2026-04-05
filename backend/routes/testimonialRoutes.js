import express from 'express';
import mongoose from 'mongoose';
import multer from 'multer';
import cloudinary from '../config/cloudinary.js';
import Testimonial from '../models/Testimonial.js';
import { requireAuth, requireAdmin } from '../middleware/auth.js';

const router = express.Router();

const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 5 * 1024 * 1024 },
    fileFilter: (req, file, cb) => {
        const allowed = ['image/jpeg', 'image/png', 'image/jpg', 'image/webp'];
        if (allowed.includes(file.mimetype)) cb(null, true);
        else cb(new Error('Photo must be JPEG, PNG, or WebP'), false);
    }
});

const allowedImageMime = ['image/jpeg', 'image/png', 'image/jpg', 'image/webp'];

async function uploadPhotoBuffer(buffer, mimetype) {
    const b64 = buffer.toString('base64');
    const dataUri = `data:${mimetype};base64,${b64}`;
    const result = await cloudinary.uploader.upload(dataUri, {
        folder: 'naya-awasar/testimonials',
        resource_type: 'image'
    });
    return result.secure_url;
}

/** Derive Cloudinary public_id from a secure_url for destroy(). */
function publicIdFromCloudinaryUrl(url) {
    if (!url || typeof url !== 'string') return null;
    if (!url.includes('res.cloudinary.com')) return null;
    const m = url.match(/\/upload\/(?:v\d+\/)?([^?]+)$/);
    if (!m) return null;
    return m[1].replace(/\.[^.]+$/, '');
}

async function deleteCloudinaryAssetIfOurs(url) {
    const publicId = publicIdFromCloudinaryUrl(url);
    if (!publicId || !publicId.startsWith('naya-awasar/testimonials')) return;
    try {
        await cloudinary.uploader.destroy(publicId);
    } catch (err) {
        console.warn('[testimonials] Cloudinary destroy skipped:', err?.message || err);
    }
}

// @route   GET /api/testimonials
// @desc    Public list (active only)
router.get('/', async (req, res) => {
    try {
        const list = await Testimonial.find({ isActive: true })
            .sort({ createdAt: -1 })
            .lean();
        res.json(list);
    } catch (error) {
        console.error('GET /testimonials error:', error);
        res.status(500).json({ message: 'Error fetching testimonials' });
    }
});

// @route   GET /api/testimonials/admin/all
// @desc    All testimonials (admin)
router.get('/admin/all', requireAuth, requireAdmin, async (req, res) => {
    try {
        const list = await Testimonial.find({}).sort({ createdAt: -1 }).lean();
        res.json(list);
    } catch (error) {
        console.error('GET /testimonials/admin/all error:', error);
        res.status(500).json({ message: 'Error fetching testimonials' });
    }
});

// @route   POST /api/testimonials
// @desc    Create (admin, multipart)
router.post('/', requireAuth, requireAdmin, (req, res, next) => {
    upload.single('photo')(req, res, (err) => {
        if (err) {
            return res.status(400).json({ message: err.message || 'Upload failed' });
        }
        next();
    });
}, async (req, res) => {
    try {
        const name = String(req.body.name || '').trim();
        const role = String(req.body.role || '').trim();
        const review = String(req.body.review || '').trim();
        const ratingRaw = req.body.rating;
        const isActiveRaw = req.body.isActive;

        if (!name || !review) {
            return res.status(400).json({ message: 'name and review are required' });
        }

        if (!req.file || !req.file.buffer) {
            return res.status(400).json({ message: 'photo is required' });
        }
        if (!allowedImageMime.includes(req.file.mimetype)) {
            return res.status(400).json({ message: 'Invalid image type' });
        }

        const photoUrl = await uploadPhotoBuffer(req.file.buffer, req.file.mimetype);

        let rating = 5;
        if (ratingRaw !== undefined && ratingRaw !== '') {
            const n = Number(ratingRaw);
            if (Number.isFinite(n) && n >= 1 && n <= 5) rating = n;
        }

        let isActive = true;
        if (isActiveRaw === 'false' || isActiveRaw === false) isActive = false;
        if (isActiveRaw === 'true' || isActiveRaw === true) isActive = true;

        const doc = await Testimonial.create({
            name,
            role,
            review,
            photo: photoUrl,
            rating,
            isActive
        });

        res.status(201).json(doc);
    } catch (error) {
        console.error('POST /testimonials error:', error);
        res.status(500).json({ message: 'Error creating testimonial' });
    }
});

// @route   PUT /api/testimonials/:id
// @desc    Update (admin, optional new photo)
router.put('/:id', requireAuth, requireAdmin, (req, res, next) => {
    upload.single('photo')(req, res, (err) => {
        if (err) {
            return res.status(400).json({ message: err.message || 'Upload failed' });
        }
        next();
    });
}, async (req, res) => {
    try {
        if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
            return res.status(400).json({ message: 'Invalid testimonial id' });
        }
        const testimonial = await Testimonial.findById(req.params.id);
        if (!testimonial) {
            return res.status(404).json({ message: 'Testimonial not found' });
        }

        const prevPhoto = testimonial.photo;

        if (req.body.name !== undefined) testimonial.name = String(req.body.name).trim();
        if (req.body.role !== undefined) testimonial.role = String(req.body.role || '').trim();
        if (req.body.review !== undefined) testimonial.review = String(req.body.review).trim();

        if (req.body.rating !== undefined && req.body.rating !== '') {
            const n = Number(req.body.rating);
            if (Number.isFinite(n) && n >= 1 && n <= 5) testimonial.rating = n;
        }

        if (req.body.isActive !== undefined) {
            const v = req.body.isActive;
            if (v === 'false' || v === false) testimonial.isActive = false;
            else if (v === 'true' || v === true) testimonial.isActive = true;
        }

        if (req.file?.buffer && allowedImageMime.includes(req.file.mimetype)) {
            const newUrl = await uploadPhotoBuffer(req.file.buffer, req.file.mimetype);
            testimonial.photo = newUrl;
            if (prevPhoto && prevPhoto !== newUrl) {
                await deleteCloudinaryAssetIfOurs(prevPhoto);
            }
        }

        await testimonial.save();
        res.json(testimonial);
    } catch (error) {
        if (error.name === 'CastError') {
            return res.status(400).json({ message: 'Invalid testimonial id' });
        }
        console.error('PUT /testimonials/:id error:', error);
        res.status(500).json({ message: 'Error updating testimonial' });
    }
});

// @route   DELETE /api/testimonials/:id
// @desc    Remove from DB (admin). Image left on Cloudinary to avoid accidental loss; optional destroy:
router.delete('/:id', requireAuth, requireAdmin, async (req, res) => {
    try {
        if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
            return res.status(400).json({ message: 'Invalid testimonial id' });
        }
        const testimonial = await Testimonial.findById(req.params.id);
        if (!testimonial) {
            return res.status(404).json({ message: 'Testimonial not found' });
        }

        await Testimonial.deleteOne({ _id: testimonial._id });

        res.json({ success: true, message: 'Testimonial deleted' });
    } catch (error) {
        if (error.name === 'CastError') {
            return res.status(400).json({ message: 'Invalid testimonial id' });
        }
        console.error('DELETE /testimonials/:id error:', error);
        res.status(500).json({ message: 'Error deleting testimonial' });
    }
});

export default router;
