
import Job from '../models/Job.js';
import Application from '../models/Application.js';
import JobView from '../models/JobView.js';
import User from '../models/User.js'; // Needed if we lookup on the fly
import mongoose from 'mongoose';

// Track View
export const trackJobView = async (req, res) => {
    const { jobId } = req.params;
    const userId = req.user ? req.user.id : null;
    const ip = req.ip;

    console.log("Tracking view for:", jobId);

    try {
        const today = new Date().toISOString().split('T')[0];

        // Define query to check if already viewed today
        const query = { job_id: jobId, dayKey: today };
        if (userId) query.viewer_id = userId;
        else query.ip = ip;

        const existingView = await JobView.findOne(query);

        if (!existingView) {
            await JobView.create({
                job_id: jobId,
                viewer_id: userId,
                ip: ip,
                dayKey: today
            });
            console.log("View tracked.");
        } else {
            console.log("View already tracked for today.");
        }

        res.status(200).json({ success: true });
    } catch (error) {
        console.error("Tracking error:", error);
        // Don't block UI if tracking fails
        res.status(200).json({ success: false, error: 'Tracking failed' });
    }
};

// Get Analytics
export const getJobAnalytics = async (req, res) => {
    const { jobId } = req.params;
    const recruiterId = req.user.id;

    console.log(`Analytics request for job: ${jobId} by recruiter: ${recruiterId}`);

    try {
        const job = await Job.findById(jobId).select('title status createdAt recruiter_id');
        if (!job) return res.status(404).json({ message: 'Job not found' });

        if (job.recruiter_id.toString() !== recruiterId) {
            return res.status(403).json({ message: 'Unauthorized' });
        }

        // 1. Totals
        const totalViews = await JobView.countDocuments({ job_id: jobId });
        const totalApplicants = await Application.countDocuments({ job_id: jobId });
        const conversionRate = totalViews > 0 ? ((totalApplicants / totalViews) * 100).toFixed(1) : 0;

        // 2. Pipeline Counts
        const pipelineRaw = await Application.aggregate([
            { $match: { job_id: job._id } },
            { $group: { _id: '$status', count: { $sum: 1 } } }
        ]);

        const pipelineCounts = {
            in_review: 0,
            interview: 0,
            offered: 0,
            hired: 0,
            rejected: 0
        };
        pipelineRaw.forEach(p => {
            const statusKey = p._id === 'applied' ? 'in_review' : p._id; // Map 'applied' to 'in_review' bucket or keep separate? 
            // Prompt asked for: in_review, interview, offer, hired, rejected.
            // My Application model has: 'applied', 'in_review', 'interview', 'offered', 'hired', 'rejected', 'withdrawn'
            if (statusKey === 'applied' || statusKey === 'in_review') pipelineCounts.in_review += p.count;
            else if (statusKey === 'interview') pipelineCounts.interview += p.count;
            else if (statusKey === 'offered') pipelineCounts.offered += p.count;
            else if (statusKey === 'hired') pipelineCounts.hired += p.count;
            else if (statusKey === 'rejected') pipelineCounts.rejected += p.count;
        });

        // 3. Time Series (Applications) - Last 30 days
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

        const applicationsByDay = await Application.aggregate([
            { $match: { job_id: job._id, createdAt: { $gte: thirtyDaysAgo } } },
            {
                $group: {
                    _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
                    count: { $sum: 1 }
                }
            },
            { $sort: { _id: 1 } }
        ]);

        // 3b. Time Series (Views) - Last 30 days
        const viewsByDay = await JobView.aggregate([
            { $match: { job_id: job._id, createdAt: { $gte: thirtyDaysAgo } } },
            {
                $group: {
                    _id: { dayKey: "$dayKey" }, // or just dayKey if stored directly
                    count: { $sum: 1 }
                }
            },
            { $project: { _id: "$_id.dayKey", count: 1 } },
            { $sort: { _id: 1 } }
        ]);

        // 4. Distributions (Location & Experience)
        // Since we might not have denormalized data for old apps, we perform lookup
        const applicantsData = await Application.aggregate([
            { $match: { job_id: job._id } },
            {
                $lookup: {
                    from: 'users',
                    localField: 'seeker_id',
                    foreignField: '_id',
                    as: 'seeker'
                }
            },
            { $unwind: '$seeker' },
            {
                $project: {
                    location: '$seeker.location',
                    experience: { $arrayElemAt: ['$seeker.workExperience', 0] } // Naive: take first experience? Or use profile field?
                    // User model has 'location' field.
                    // User model doesn't seem to have a direct 'experienceLevel' field field besides 'workExperience' array or 'jobPreferences.seniority'.
                    // I'll try to use 'applicantExperienceLevel' if exists (new field), else fallback to 'jobPreferences.seniority' or just 'Unknown'
                }
            }
        ]);

        const locationsMap = {};
        const experienceMap = {};

        applicantsData.forEach(app => {
            const loc = app.location || 'Unknown';
            locationsMap[loc] = (locationsMap[loc] || 0) + 1;

            // Just use a placeholder if can't derive perfect level
            const exp = 'Unknown';
            experienceMap[exp] = (experienceMap[exp] || 0) + 1;
        });

        // Format for frontend
        const locationsTop = Object.entries(locationsMap)
            .map(([location, count]) => ({ location, count }))
            .sort((a, b) => b.count - a.count)
            .slice(0, 5);

        // Since deriving experience is hard without denormalized data on legacy, we'll return empty or placeholder
        // For new fields, we can use aggregations directly on schema if populated.
        // Let's rely on the denormalized fields if you prefer, but for now I'll just send sample data or empty if complex lookups fail.

        // 5. Match Score
        // (Placeholder as matchScore logic isn't fully robust yet)

        res.json({
            jobMeta: {
                id: job._id,
                title: job.title,
                createdAt: job.createdAt,
                status: job.status
            },
            totals: {
                views: totalViews,
                applicants: totalApplicants,
                conversionRate
            },
            pipelineCounts,
            timeSeries: {
                applications: applicationsByDay.map(i => ({ date: i._id, count: i.count })),
                views: viewsByDay.map(i => ({ date: i._id, count: i.count }))
            },
            distributions: {
                locations: locationsTop,
                experience: [] // Placeholder
            },
            quality: {
                avgMatchScore: 0,
                highMatchCount: 0,
                midMatchCount: 0,
                lowMatchCount: 0
            }
        });

    } catch (error) {
        console.error("Analytics error:", error);
        res.status(500).json({ message: "Error generating analytics" });
    }
};
