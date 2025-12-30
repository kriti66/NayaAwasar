import express from 'express';

const router = express.Router();

router.get('/seeker/stats', async (req, res) => {
    const seekerId = req.user?.id;
    if (!seekerId) return res.status(401).json({ message: 'Unauthorized' });

    const db = req.app.locals.db;
    try {
        const appliedStats = await db.get(
            `SELECT COUNT(*) as count FROM applications WHERE seeker_id = ?`,
            [seekerId]
        );
        const interviewStats = await db.get(
            `SELECT COUNT(*) as count FROM applications WHERE seeker_id = ? AND status = 'shortlisted'`,
            [seekerId]
        );

        res.json({ applied: appliedStats.count, saved: 0, interviews: interviewStats.count });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error fetching stats' });
    }
});

router.get('/recruiter/stats', async (req, res) => {
    const recruiterId = req.user?.id;
    if (!recruiterId) return res.status(401).json({ message: 'Unauthorized' });

    const db = req.app.locals.db;
    try {
        const jobStats = await db.get(
            `SELECT COUNT(*) as count FROM jobs WHERE recruiter_id = ?`,
            [recruiterId]
        );

        const applicantStats = await db.get(
            `SELECT COUNT(a.id) as count 
             FROM applications a 
             JOIN jobs j ON a.job_id = j.id 
             WHERE j.recruiter_id = ?`,
            [recruiterId]
        );

        res.json({ posted_jobs: jobStats.count, applicants: applicantStats.count });
    } catch (error) {
        res.status(500).json({ message: 'Error fetching stats' });
    }
});

router.get('/admin/stats', async (req, res) => {
    // Check admin role
    if (req.user?.role !== 'admin') return res.status(403).json({ message: 'Forbidden' });

    const db = req.app.locals.db;
    try {
        const stats = await db.get(
            `SELECT 
                (SELECT COUNT(*) FROM users) as totalUsers,
                (SELECT COUNT(*) FROM jobs) as totalJobs,
                (SELECT COUNT(*) FROM users WHERE role = 'recruiter') as activeRecruiters,
                0 as pendingApprovals`
        );
        res.json(stats);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching admin stats' });
    }
});

export default router;
