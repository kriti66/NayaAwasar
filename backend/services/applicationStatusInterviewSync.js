import Interview from '../models/Interview.js';

/**
 * Active (non-cancelled) interview for an application — prefer embedded interviewId, else latest doc.
 */
export async function resolveActiveInterviewForApplication(application) {
    const refId = application.interview?.interviewId;
    if (refId) {
        const doc = await Interview.findById(refId);
        if (doc && doc.status !== 'Cancelled') return doc;
    }
    return Interview.findOne({
        applicationId: application._id,
        status: { $ne: 'Cancelled' }
    })
        .sort({ createdAt: -1 })
        .exec();
}

/**
 * When pipeline moves to "interview" without slot details (e.g. direct API): create a placeholder
 * Interview so the recruiter calendar shows pending acceptance (orange) until a real slot is set.
 */
export async function ensurePlaceholderInterviewForPipeline(application, recruiterId) {
    const existing = await resolveActiveInterviewForApplication(application);
    if (existing) return existing;

    const jobId = application.job_id?._id || application.job_id;
    const seekerId = application.seeker_id?._id || application.seeker_id;
    if (!jobId || !seekerId) return null;

    const placeholderDate = new Date();
    placeholderDate.setUTCDate(placeholderDate.getUTCDate() + 1);
    placeholderDate.setUTCHours(12, 0, 0, 0);

    const roomId = `interview_${application._id}_${Date.now()}`;

    const inv = await Interview.create({
        applicationId: application._id,
        jobId,
        recruiterId,
        seekerId,
        date: placeholderDate,
        time: '12:00',
        mode: 'Online',
        roomId,
        status: 'Scheduled',
        interviewStatus: 'pending_acceptance',
        calendarStatus: 'pending_acceptance',
        acceptedBySeeker: false,
        acceptedByRecruiter: true,
        duration: 30,
        notes: 'Awaiting confirmed interview time'
    });

    application.interview = {
        date: inv.date,
        time: inv.time,
        mode: inv.mode,
        roomId: inv.roomId,
        scheduledAt: new Date(),
        interviewId: inv._id
    };
    if (!Array.isArray(application.interviewHistory)) {
        application.interviewHistory = [];
    }
    application.interviewHistory.push({
        action: 'Scheduled',
        details: { placeholder: true, interviewId: inv._id },
        timestamp: new Date()
    });

    return inv;
}

/**
 * Keep Interview / calendar row in sync with application pipeline after status is saved.
 * Interview model: top-level `status` enum Scheduled | Completed | Cancelled | Missed;
 * calendar UI uses `calendarStatus` + deriveCalendarStatus().
 */
export async function syncInterviewDocumentAfterApplicationStatusChange(application, normalizedStatus, recruiterId) {
    if (normalizedStatus === 'interview') {
        return;
    }

    const inv = await resolveActiveInterviewForApplication(application);

    if (normalizedStatus === 'offered' || normalizedStatus === 'hired') {
        if (!inv || inv.status === 'Completed' || inv.status === 'Cancelled') return;
        inv.status = 'Completed';
        inv.calendarStatus = 'completed';
        inv.interviewStatus = 'confirmed';
        inv.completedAt = new Date();
        await inv.save();
        return;
    }

    if (normalizedStatus === 'rejected') {
        if (!inv || inv.status === 'Cancelled') return;
        inv.status = 'Cancelled';
        inv.calendarStatus = 'cancelled';
        inv.cancelReason = application.cancelReason || 'Application rejected';
        inv.cancelledAt = new Date();
        inv.cancelledBy = recruiterId;
        await inv.save();
        return;
    }

    if (normalizedStatus === 'applied' || normalizedStatus === 'in-review') {
        if (!inv || inv.status === 'Cancelled') return;
        inv.status = 'Cancelled';
        inv.calendarStatus = 'cancelled';
        inv.cancelReason = 'Application moved back in pipeline';
        inv.cancelledAt = new Date();
        inv.cancelledBy = recruiterId;
        await inv.save();
    }
}
