/**
 * Display labels for recruiter KYC (User.recruiterKycStatus / kycStatus) on admin company views.
 */
export function getRecruiterKycVerificationDisplay(recruiter) {
    if (!recruiter) {
        return {
            label: 'Pending Verification',
            tone: 'pending',
            detail: 'No owner linked'
        };
    }
    const s = String(recruiter.recruiterKycStatus || recruiter.kycStatus || 'not_submitted').toLowerCase();
    if (s === 'approved') {
        return { label: 'Verified', tone: 'verified', detail: 'Recruiter KYC complete' };
    }
    if (s === 'rejected' || s === 'resubmission_locked') {
        return { label: 'Rejected', tone: 'rejected', detail: 'Handled in KYC panel' };
    }
    return { label: 'Pending Verification', tone: 'pending', detail: 'Awaiting KYC review' };
}
