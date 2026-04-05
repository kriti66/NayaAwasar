import express from 'express';
import mongoose from 'mongoose';
import multer from 'multer';
import cloudinary from '../config/cloudinary.js';
import TeamMember from '../models/TeamMember.js';
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
        folder: 'naya-awasar/team',
        resource_type: 'image'
    });
    return result.secure_url;
}

function publicIdFromCloudinaryUrl(url) {
    if (!url || typeof url !== 'string') return null;
    if (!url.includes('res.cloudinary.com')) return null;
    const m = url.match(/\/upload\/(?:v\d+\/)?([^?]+)$/);
    if (!m) return null;
    return m[1].replace(/\.[^.]+$/, '');
}

async function deleteCloudinaryAssetIfOurs(url) {
    const publicId = publicIdFromCloudinaryUrl(url);
    if (!publicId || !publicId.startsWith('naya-awasar/team')) return;
    try {
        await cloudinary.uploader.destroy(publicId);
    } catch (err) {
        console.warn('[team] Cloudinary destroy skipped:', err?.message || err);
    }
}

function parseOrder(raw) {
    if (raw === undefined || raw === '') return 0;
    const n = Number(raw);
    return Number.isFinite(n) ? n : 0;
}

function parseIsActive(raw) {
    if (raw === 'false' || raw === false) return false;
    if (raw === 'true' || raw === true) return true;
    return true;
}

// @route   GET /api/team
router.get('/', async (req, res) => {
    try {
        const list = await TeamMember.find({ isActive: true })
            .sort({ order: 1, createdAt: 1 })
            .lean();
        res.json(list);
    } catch (error) {
        console.error('GET /team error:', error);
        res.status(500).json({ message: 'Error fetching team members' });
    }
});

// @route   GET /api/team/admin/all
router.get('/admin/all', requireAuth, requireAdmin, async (req, res) => {
    try {
        const list = await TeamMember.find({}).sort({ order: 1, createdAt: 1 }).lean();
        res.json(list);
    } catch (error) {
        console.error('GET /team/admin/all error:', error);
        res.status(500).json({ message: 'Error fetching team members' });
    }
});

// @route   POST /api/team
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
        const bio = String(req.body.bio || '').trim();

        if (!name || !role) {
            return res.status(400).json({ message: 'name and role are required' });
        }

        if (!req.file || !req.file.buffer) {
            return res.status(400).json({ message: 'photo is required' });
        }
        if (!allowedImageMime.includes(req.file.mimetype)) {
            return res.status(400).json({ message: 'Invalid image type' });
        }

        const photoUrl = await uploadPhotoBuffer(req.file.buffer, req.file.mimetype);
        const order = parseOrder(req.body.order);
        const isActive = parseIsActive(req.body.isActive);

        const doc = await TeamMember.create({
            name,
            role,
            bio,
            photo: photoUrl,
            order,
            isActive
        });

        res.status(201).json(doc);
    } catch (error) {
        console.error('POST /team error:', error);
        res.status(500).json({ message: 'Error creating team member' });
    }
});

// @route   PUT /api/team/:id
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
            return res.status(400).json({ message: 'Invalid team member id' });
        }
        const member = await TeamMember.findById(req.params.id);
        if (!member) {
            return res.status(404).json({ message: 'Team member not found' });
        }

        const prevPhoto = member.photo;

        if (req.body.name !== undefined) member.name = String(req.body.name).trim();
        if (req.body.role !== undefined) member.role = String(req.body.role).trim();
        if (req.body.bio !== undefined) member.bio = String(req.body.bio || '').trim();

        if (req.body.order !== undefined && req.body.order !== '') {
            member.order = parseOrder(req.body.order);
        }

        if (req.body.isActive !== undefined) {
            const v = req.body.isActive;
            if (v === 'false' || v === false) member.isActive = false;
            else if (v === 'true' || v === true) member.isActive = true;
        }

        if (req.file?.buffer && allowedImageMime.includes(req.file.mimetype)) {
            const newUrl = await uploadPhotoBuffer(req.file.buffer, req.file.mimetype);
            member.photo = newUrl;
            if (prevPhoto && prevPhoto !== newUrl) {
                await deleteCloudinaryAssetIfOurs(prevPhoto);
            }
        }

        await member.save();
        res.json(member);
    } catch (error) {
        if (error.name === 'CastError') {
            return res.status(400).json({ message: 'Invalid team member id' });
        }
        console.error('PUT /team/:id error:', error);
        res.status(500).json({ message: 'Error updating team member' });
    }
});

// @route   DELETE /api/team/:id
router.delete('/:id', requireAuth, requireAdmin, async (req, res) => {
    try {
        if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
            return res.status(400).json({ message: 'Invalid team member id' });
        }
        const member = await TeamMember.findById(req.params.id);
        if (!member) {
            return res.status(404).json({ message: 'Team member not found' });
        }

        await TeamMember.deleteOne({ _id: member._id });

        res.json({ success: true, message: 'Team member deleted' });
    } catch (error) {
        if (error.name === 'CastError') {
            return res.status(400).json({ message: 'Invalid team member id' });
        }
        console.error('DELETE /team/:id error:', error);
        res.status(500).json({ message: 'Error deleting team member' });
    }
});

export default router;
