/**
 * After a bot answer, suggest 2–3 follow-up intents (ids must exist in responses / intentDetector).
 */

export const RELATED_BY_INTENT = {
    how_to_apply: ['application_status', 'kyc_how_it_works', 'saved_jobs'],
    update_profile: ['how_to_apply', 'application_status', 'ai_recommendation'],
    application_status: ['interview_info', 'saved_jobs', 'notifications'],
    saved_jobs: ['how_to_apply', 'application_status', 'ai_recommendation'],
    kyc_how_it_works: ['kyc_status', 'kyc_rejected', 'kyc_resubmit'],
    kyc_status: ['kyc_rejected', 'kyc_resubmit', 'notifications'],
    kyc_rejected: ['kyc_resubmit', 'kyc_how_it_works', 'contact_support'],
    kyc_resubmit: ['kyc_status', 'notifications', 'contact_support'],
    kyc_timeline: ['kyc_status', 'notifications', 'contact_support'],
    kyc_recruiter: ['kyc_status', 'post_job', 'contact_support'],
    forgot_password: ['login_issue', 'contact_support'],
    login_issue: ['forgot_password', 'contact_support'],
    post_job: ['manage_applications', 'kyc_recruiter', 'interview_schedule'],
    manage_applications: ['interview_schedule', 'contact_candidate', 'notifications'],
    interview_schedule: ['interview_info', 'manage_applications', 'notifications'],
    contact_candidate: ['manage_applications', 'interview_schedule', 'notifications'],
    interview_info: ['application_status', 'notifications', 'ai_recommendation'],
    ai_recommendation: ['saved_jobs', 'how_to_apply', 'update_profile'],
    notifications: ['application_status', 'interview_info', 'kyc_status'],
    profile_visibility: ['update_profile', 'contact_support'],
    delete_account: ['contact_support', 'report_issue'],
    report_issue: ['contact_support', 'delete_account'],
    contact_support: ['report_issue', 'forgot_password'],
    fallback: [
        'how_to_apply',
        'kyc_how_it_works',
        'interview_info',
        'forgot_password',
        'contact_support',
        'notifications'
    ]
};

/** Short labels for chips (EN / NE) */
export const INTENT_LABELS = {
    how_to_apply: { en: 'How to apply', ne: 'कसरी आवेदन गर्ने' },
    update_profile: { en: 'Update profile / CV', ne: 'प्रोफाइल / CV अपडेट' },
    application_status: { en: 'Track application', ne: 'आवेदन स्थिति' },
    saved_jobs: { en: 'Saved jobs', ne: 'बचत गरिएका जागिरहरू' },
    kyc_how_it_works: { en: 'How KYC works', ne: 'KYC कसरी काम गर्छ' },
    kyc_status: { en: 'Check KYC status', ne: 'KYC स्थिति' },
    kyc_rejected: { en: 'KYC rejected', ne: 'KYC अस्वीकृत' },
    kyc_resubmit: { en: 'Resubmit KYC', ne: 'KYC पुनः पेश गर्नुहोस्' },
    kyc_timeline: { en: 'KYC timing', ne: 'KYC समय' },
    kyc_recruiter: { en: 'Recruiter KYC', ne: 'भर्तीकर्ता KYC' },
    forgot_password: { en: 'Forgot password', ne: 'पासवर्ड बिर्सनुभयो' },
    login_issue: { en: 'Login issues', ne: 'लगइन समस्या' },
    post_job: { en: 'Post a job', ne: 'जागिर पोस्ट गर्नुहोस्' },
    manage_applications: { en: 'Manage applicants', ne: 'आवेदक व्यवस्थापन' },
    interview_schedule: { en: 'Schedule interview', ne: 'अन्तर्वार्ता तालिका' },
    contact_candidate: { en: 'Contact candidate', ne: 'आवेदकलाई सम्पर्क' },
    interview_info: { en: 'Upcoming interview', ne: 'आगामी अन्तर्वार्ता' },
    ai_recommendation: { en: 'AI job matches', ne: 'AI सिफारिस जागिर' },
    notifications: { en: 'Notifications', ne: 'सूचनाहरू' },
    profile_visibility: { en: 'Profile visibility', ne: 'प्रोफाइल दृश्यता' },
    delete_account: { en: 'Delete account', ne: 'खाता मेटाउनुहोस्' },
    report_issue: { en: 'Report an issue', ne: 'समस्या रिपोर्ट' },
    contact_support: { en: 'Contact support', ne: 'सहयोग सम्पर्क' }
};

export function getRelatedIntents(intent) {
    const list = RELATED_BY_INTENT[intent] || RELATED_BY_INTENT.fallback;
    const max = intent === 'fallback' ? 6 : 3;
    return list.slice(0, max);
}

export function labelForIntent(intentId, lang) {
    const row = INTENT_LABELS[intentId];
    if (!row) return String(intentId || '').replace(/_/g, ' ');
    return lang === 'ne' ? row.ne : row.en;
}
