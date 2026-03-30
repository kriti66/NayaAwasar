/**
 * All assistant copy (English). Nepali provided only for selected intents.
 * Max 2–3 short sentences. Only real product features.
 */

const SUPPORT_EMAIL = 'support@nayaawasar.com';

export const EN = {
    greeting:
        'Namaste! 🙏 I’m the Naya Awasar Assistant. Are you a Job Seeker or Recruiter?',
    pick_role_hint: 'Tap a button below to get tailored tips.',
    role_jobseeker: 'Thanks! I’ll focus on job seeker topics. What do you need help with?',
    role_recruiter: 'Thanks! I’ll focus on recruiter topics. What do you need help with?',
    role_help: `No problem. Ask about jobs, KYC, interviews, or your account. You can also email us at ${SUPPORT_EMAIL} or use Contact on the website.`,

    how_to_apply:
        'Browse jobs (Find Jobs / job listings), open a role, and use Apply. You need an approved KYC before applying. Keep your profile and CV updated first.',
    how_to_apply_recruiter:
        'Recruiters don’t apply to jobs—you post roles and review applicants from your dashboard. Open Jobs → your listing → Applicants.',

    update_profile:
        'Go to your Profile from the dashboard. Update your details and upload your CV (PDF/DOC) where shown. A stronger profile helps with applications and AI recommendations.',
    update_profile_recruiter:
        'Use Recruiter Profile and Company sections from your dashboard to keep company and contact details accurate.',

    application_status:
        'Open My Applications from your dashboard to see each status (e.g. pending, in review, interview). Notifications also alert you to updates.',
    saved_jobs:
        'Saved jobs live under your seeker dashboard flow (saved / bookmarked roles). Open a saved job from there when you’re ready to apply.',

    kyc_how_it_works:
        'KYC checks identity for safety. You can use the dashboard before it’s approved, but job seekers must be KYC-approved to apply, and recruiters need required verification before posting jobs. Check KYC status and any reason in Notifications or the KYC section.',
    kyc_status:
        'Open KYC / verification from your sidebar or dashboard. Status and rejection reasons (if any) show there and in Notifications.',
    kyc_rejected:
        'If KYC was rejected, read the reason in Notifications or the KYC screen. Fix the issue and submit again with correct documents.',
    kyc_resubmit:
        'Open the same KYC flow, upload corrected documents, and submit again. Watch Notifications for the admin decision.',
    kyc_timeline:
        'There’s no fixed public SLA—admins review in turn. Watch Notifications and your KYC page for updates.',
    kyc_recruiter:
        'Recruiters complete recruiter/company verification from the KYC flow. Posting jobs requires the required approvals—check Notifications and the KYC panel for status.',

    forgot_password:
        'On Login, choose Forgot password. Enter your email to receive an OTP, then set a new password. Use the same email you registered with.',
    login_issue:
        'Try Forgot password first. Clear typos, check caps lock, and try another browser. If it still fails, contact support with your email (no password in the message).',

    post_job:
        'From the recruiter dashboard use Post Job: fill title, description, requirements, then submit. You need the required verification approved before posting.',
    post_job_seeker:
        'Only recruiter accounts post jobs. Sign in as a recruiter (or register as one) to create listings.',

    manage_applications:
        'Open Recruiter → Jobs, pick a job, then review Applicants. You can move stages, schedule interviews, and use notifications to stay updated.',
    manage_applications_seeker:
        'As a job seeker you track your own applications under My Applications—not recruiter applicant lists.',

    interview_schedule:
        'From a candidate in interview stage, use your interview tools to propose or update time. Job seekers accept or decline reschedule proposals in Interviews / notifications.',
    contact_candidate:
        'Use applicant details shown on the application card (email/phone when provided). Keep communication professional and inside the platform where possible.',

    interview_info:
        'Upcoming interviews appear on your Interviews page and dashboard widgets. Online interviews include a join link when it’s time; check notifications for changes.',
    interview_info_recruiter:
        'Use the interview link from the application when it’s time to join. The same slot appears to the candidate—check notifications if they reschedule.',

    ai_recommendation:
        'AI recommendations appear in your seeker job discovery flow when enabled. Update your profile and CV so matches stay relevant.',

    notifications:
        'Open Notifications from the bell/menu. KYC results, interviews, and application updates arrive there—check regularly.',

    profile_visibility:
        'Your profile is used when you apply and for recommendations. Recruiters see what you submit on applications; keep sensitive data out of public fields.',
    delete_account:
        'We don’t offer self-delete in the app yet. Email support@nayaawasar.com from your registered email and we’ll guide you.',

    report_issue:
        'Use the Contact page to describe the issue (job link, screenshots if safe). For suspicious jobs, report details so the team can review.',

    contact_support: `For direct help, email ${SUPPORT_EMAIL} or open Contact on the site. Include your role and a short description—no passwords.`,
    handoff: `Let me help you connect with support.\n\nEmail: ${SUPPORT_EMAIL}\n\nYou can also open the Contact page to send a message to our team.`,

    fallback:
        'I’m not sure about that. I can help with jobs, KYC, interviews, profile updates, and account issues.',
    thanks: 'You’re welcome! Ask anytime if something else comes up.',
    hello: 'Namaste! Use the quick buttons or type a short question about jobs, KYC, or interviews.',

    repeat_handoff:
        'I’m still not able to answer that. Please email support@nayaawasar.com or use the Contact page so our team can help.'
};

export const NE = {
    how_to_apply:
        'जागिरहरू हेर्नुहोस्, एउटा खोल्नुहोस्, र Apply थिच्नुहोस्। आवेदन गर्न KYC स्वीकृत हुनुपर्छ। पहिले प्रोफाइल र CV अपडेट राख्नुहोस्।',
    update_profile:
        'ड्यासबोर्डबाट प्रोफाइल खोल्नुहोस्। विवरण अपडेट गर्नुहोस् र CV (PDF/DOC) अपलोड गर्नुहोस्।',
    kyc_how_it_works:
        'KYC पहिचान जाँच हो। स्वीकृत नभए पनि ड्यासबोर्ड चलाउन सकिन्छ, तर जागिर आवेदन र भर्तीकर्ताले पोस्ट गर्न प्रमाणीकरण चाहिन्छ। स्थिति सूचना र KYC मा हेर्नुहोस्।',
    kyc_status:
        'KYC स्थिति साइडबार/ड्यासबोर्डको KYC बाट हेर्नुहोस्। अस्वीकृति कारण सूचनामा पनि आउँछ।',
    forgot_password:
        'लगइनमा Forgot password छान्नुहोस्। इमेलमा OTP आउँछ, नयाँ पासवर्ड सेट गर्नुहोस्।',
    post_job:
        'भर्तीकर्ता ड्यासबोर्डबाट Post Job प्रयोग गर्नुहोस्। आवश्यक प्रमाणीकरण स्वीकृत पछि मात्र पोस्ट हुन्छ।',
    application_status:
        'My Applications मा प्रत्येक आवेदनको स्थिति हेर्नुहोस्। सूचनाले पनि अपडेट दिन्छ।',
    contact_support: `सहयोग: ${SUPPORT_EMAIL} वा वेबसाइटको Contact प्रयोग गर्नुहोस्। पासवर्ड नपठाउनुहोस्।`,
    report_issue: 'समस्या Contact पृष्ठबाट विवरणसहित पठाउनुहोस्। शंकास्पद जागिरको लिंक उल्लेख गर्नुहोस्।',
    interview_info:
        'आगामी अन्तर्वार्ता Interviews र ड्यासबोर्डमा देखिन्छ। अनलाइनको लागि समयमा जडान लिंक आउँछ।'
};

export function getSupportEmail() {
    return SUPPORT_EMAIL;
}

/**
 * @param {string} intent
 * @param {'en'|'ne'} lang
 * @param {'jobseeker'|'recruiter'|'unknown'} userType
 */
export function getResponseText(intent, lang, userType) {
    const useNe = lang === 'ne';

    if (intent === 'handoff' || intent === 'repeat_handoff') {
        return EN[intent] || EN.handoff;
    }

    if (intent === 'how_to_apply' && userType === 'recruiter') {
        return pickLang('how_to_apply_recruiter', useNe);
    }
    if (intent === 'post_job' && userType === 'jobseeker') {
        return pickLang('post_job_seeker', useNe);
    }
    if (intent === 'manage_applications' && userType === 'jobseeker') {
        return pickLang('manage_applications_seeker', useNe);
    }
    if (intent === 'interview_info' && userType === 'recruiter') {
        return pickLang('interview_info_recruiter', useNe);
    }
    if (intent === 'update_profile' && userType === 'recruiter') {
        return pickLang('update_profile_recruiter', useNe);
    }

    return pickLang(intent, useNe);
}

function pickLang(key, useNe) {
    if (useNe && NE[key]) return NE[key];
    if (EN[key]) return EN[key];
    return EN.fallback;
}
