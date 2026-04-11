/**
 * Validates job application payload shape (no DB).
 * @param {{ jobId?: unknown, resumeUrl?: unknown, cvUrl?: unknown }} input
 * @param {{ requireResume?: boolean }} [options]
 */
export default function validateJobApplication(input, options = {}) {
    const requireResume = options.requireResume === true;
    if (!input || typeof input !== 'object') {
        return { valid: false, message: 'Invalid application data.' };
    }
    const jobId = input.jobId;
    if (jobId == null || jobId === '') {
        return { valid: false, message: 'Job ID is required.' };
    }
    if (typeof jobId === 'string' && jobId.trim() === '') {
        return { valid: false, message: 'Job ID is required.' };
    }
    if (requireResume) {
        const resume = input.resumeUrl ?? input.cvUrl;
        if (resume == null || resume === '') {
            return { valid: false, message: 'Resume or CV is required.' };
        }
        if (typeof resume === 'string' && resume.trim() === '') {
            return { valid: false, message: 'Resume or CV is required.' };
        }
    }
    return { valid: true, message: 'OK' };
}
