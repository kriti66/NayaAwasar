import express from 'express';

const router = express.Router();

// Get applications for a job (Recruiter view)
router.get('/job/:jobId', async (req, res) => {
    const { jobId } = req.params;
    const db = req.app.locals.db;
    try {
        const applications = await db.all(
            `SELECT a.*, u.name as seeker_name, u.email as seeker_email, p.resume_url 
             FROM applications a 
             JOIN users u ON a.seeker_id = u.id 
             LEFT JOIN profiles p ON u.id = p.user_id
             WHERE a.job_id = ?`,
            [jobId]
        );
        res.json(applications);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching applications' });
    }
});

// Get my applications (Seeker view)
router.get('/my', async (req, res) => {
    // Assuming middleware populates req.user
    const seekerId = req.user?.id; // Needed from middleware

    // For now, if no auth middleware active in this turn, return error or mock
    if (!seekerId) return res.status(401).json({ message: 'Unauthorized' });

    const db = req.app.locals.db;
    try {
        const applications = await db.all(
            `SELECT a.*, j.title, j.company_name, j.location
             FROM applications a 
             JOIN jobs j ON a.job_id = j.id 
             WHERE a.seeker_id = ?`,
            [seekerId]
        );
        res.json(applications);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching applications' });
    }
});

// Apply for a job
router.post('/apply', async (req, res) => {
    const { job_id } = req.body;
    const seekerId = req.user?.id;

    if (!seekerId) return res.status(401).json({ message: 'Unauthorized' });

    const db = req.app.locals.db;
    try {
        const existing = await db.get(
            `SELECT id FROM applications WHERE job_id = ? AND seeker_id = ?`,
            [job_id, seekerId]
        );

        if (existing) {
            return res.status(400).json({ message: 'You have already applied for this job' });
        }

        await db.run(
            `INSERT INTO applications (job_id, seeker_id, status) VALUES (?, ?, 'pending')`,
            [job_id, seekerId]
        );
        res.status(201).json({ success: true, message: 'Applied successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Error applying for job' });
    }
});

// Update application status
router.put('/:id/status', async (req, res) => {
    const { id } = req.params;
    const { status } = req.body; // 'shortlisted', 'rejected', 'accepted'
    // Verification that job belongs to recruiter is skipped for MVP but important for production

    const db = req.app.locals.db;
    try {
        await db.run('UPDATE applications SET status = ? WHERE id = ?', [status, id]);
        res.json({ success: true, message: 'Status updated' });
    } catch (error) {
        res.status(500).json({ message: 'Error updating status' });
    }
});

export default router;
