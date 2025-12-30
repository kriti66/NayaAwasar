import express from 'express';

const router = express.Router();

// Middleware to verify token (simplified for now, ideally moved to middleware/auth.js)
const authenticateToken = (req, res, next) => {
    // Implementation needed, checking header
    // For now assuming req.user is set by a middleware we'll ADD to server.js
    next();
};

// Get all jobs
router.get('/', async (req, res) => {
    const db = req.app.locals.db;
    try {
        const jobs = await db.all('SELECT * FROM jobs ORDER BY posted_at DESC');
        res.json(jobs);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching jobs' });
    }
});

// Get recommended jobs (placeholder logic)
router.get('/recommended', async (req, res) => {
    const db = req.app.locals.db;
    try {
        const jobs = await db.all('SELECT * FROM jobs ORDER BY RANDOM() LIMIT 5');
        res.json(jobs);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching recommended jobs' });
    }
});

// Post a job
router.post('/', async (req, res) => {
    const { title, company_name, type, description, location, salary_range, requirements, recruiter_id } = req.body;
    const db = req.app.locals.db;

    try {
        const result = await db.run(
            `INSERT INTO jobs (recruiter_id, title, company_name, type, description, location, salary_range, requirements)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
            [recruiter_id, title, company_name, type, description, location, salary_range, requirements]
        );
        res.status(201).json({ success: true, id: result.lastID });
    } catch (error) {
        res.status(500).json({ message: 'Error creating job', error: error.message });
    }
});

// Get specific job
router.get('/:id', async (req, res) => {
    const { id } = req.params;
    const db = req.app.locals.db;
    try {
        const job = await db.get('SELECT * FROM jobs WHERE id = ?', [id]);
        if (!job) return res.status(404).json({ message: 'Job not found' });
        res.json(job);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching job' });
    }
});

// Update specific job
router.put('/:id', async (req, res) => {
    const { id } = req.params;
    // recuiter_id check needed? ideally yes.

    const { title, company_name, type, description, location, salary_range, requirements } = req.body;
    const db = req.app.locals.db;

    try {
        await db.run(
            `UPDATE jobs 
             SET title=?, company_name=?, type=?, description=?, location=?, salary_range=?, requirements=? 
             WHERE id = ?`,
            [title, company_name, type, description, location, salary_range, requirements, id]
        );
        res.json({ success: true, message: 'Job updated' });
    } catch (error) {
        res.status(500).json({ message: 'Error updating job' });
    }
});

export default router;
