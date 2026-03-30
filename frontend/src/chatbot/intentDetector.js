/**
 * Keyword → intent mapping (existing Naya Awasar features only).
 * Intents are checked in INTENT_PRIORITY order; within each intent, longer phrases match first.
 */

export const INTENT_KEYWORDS = {
    application_status: [
        'application status',
        'track application',
        'applied jobs',
        'my applications',
        'status of application',
        'my application'
    ],
    saved_jobs: ['saved jobs', 'bookmark', 'save job', 'saved job'],
    how_to_apply: ['apply for job', 'how to apply', 'job apply', 'apply for a job', 'apply'],
    update_profile: [
        'update profile',
        'upload cv',
        'upload resume',
        'edit profile',
        'complete profile',
        'resume',
        'profile',
        'cv'
    ],
    kyc_status: ['kyc status', 'check kyc', 'verification status', 'kyc check'],
    kyc_rejected: ['kyc rejected', 'rejected verification', 'verification rejected'],
    kyc_resubmit: ['resubmit kyc', 'submit again', 'upload again', 'redo kyc'],
    kyc_timeline: ['how long kyc', 'kyc time', 'when kyc', 'kyc timeline'],
    kyc_how_it_works: [
        'how does kyc',
        'what is kyc',
        'identity verification',
        'verification',
        'verify identity',
        'kyc'
    ],
    kyc_recruiter: ['recruiter kyc', 'company verification', 'business verification', 'recruiter verification'],
    forgot_password: [
        'forgot password',
        'reset password',
        "can't login",
        'cant login',
        'cannot login',
        'lost password',
        'password reset'
    ],
    login_issue: ['login issue', 'signin problem', 'sign in problem', 'login problem', 'cannot sign in'],
    post_job: ['post job', 'create job', 'add job', 'publish job', 'new job listing'],
    manage_applications: [
        'manage applicants',
        'manage applications',
        'shortlist',
        'applicants',
        'candidate pipeline',
        'applications'
    ],
    interview_schedule: [
        'schedule interview',
        'reschedule interview',
        'interview setup',
        'set up interview',
        'propose interview'
    ],
    contact_candidate: ['contact candidate', 'message candidate', 'reach applicant', 'email candidate'],
    interview_info: [
        'upcoming interview',
        'video interview',
        'interview link',
        'join interview',
        'interview time',
        'interview'
    ],
    ai_recommendation: [
        'suggest jobs',
        'best jobs for me',
        'matching jobs',
        'jobs for me',
        'recommended jobs',
        'recommendation',
        'recommend',
        'ai jobs',
        'job match'
    ],
    notifications: ['notifications', 'alerts', 'in app notice'],
    profile_visibility: ['who sees profile', 'profile visible', 'profile privacy', 'visibility'],
    delete_account: ['delete account', 'close account', 'remove account'],
    report_issue: ['report', 'fake job', 'scam', 'bug', 'problem with'],
    contact_support: [
        'talk to human',
        'human support',
        'live agent',
        'contact support',
        'speak to someone',
        'real person',
        'help me directly',
        'customer support',
        'agent'
    ]
};

/** Higher in list = checked first (avoid broad keywords stealing specific intents). */
const INTENT_PRIORITY = [
    'contact_support',
    'application_status',
    'saved_jobs',
    'how_to_apply',
    'update_profile',
    'kyc_status',
    'kyc_rejected',
    'kyc_resubmit',
    'kyc_timeline',
    'kyc_how_it_works',
    'kyc_recruiter',
    'forgot_password',
    'login_issue',
    'post_job',
    'manage_applications',
    'interview_schedule',
    'contact_candidate',
    'interview_info',
    'ai_recommendation',
    'notifications',
    'profile_visibility',
    'delete_account',
    'report_issue'
];

export const HANDOFF_PHRASES = [
    'talk to human',
    'human support',
    'live agent',
    'contact support',
    'speak to someone',
    'real person',
    'help me directly',
    'customer support'
];

export function detectIntent(rawText) {
    const text = String(rawText || '')
        .toLowerCase()
        .trim()
        .replace(/\s+/g, ' ');

    if (!text) return { intent: 'empty', matched: null };

    for (const intent of INTENT_PRIORITY) {
        const phrases = [...(INTENT_KEYWORDS[intent] || [])].sort((a, b) => b.length - a.length);
        for (const phrase of phrases) {
            if (text.includes(phrase)) {
                return { intent, matched: phrase };
            }
        }
    }

    if (text === 'help' || text.startsWith('help ')) {
        return { intent: 'contact_support', matched: 'help' };
    }
    if (text.includes('password')) {
        return { intent: 'forgot_password', matched: 'password' };
    }

    return { intent: 'fallback', matched: null };
}

export function shouldForceHandoff(text) {
    const t = String(text || '').toLowerCase().trim();
    return HANDOFF_PHRASES.some((p) => t.includes(p));
}
