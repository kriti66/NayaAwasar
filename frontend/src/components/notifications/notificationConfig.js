import {
    Briefcase,
    UserCheck,
    Calendar,
    XCircle,
    ShieldCheck,
    Megaphone,
    Bell,
    Wallet,
    MessageSquare,
    Building2,
} from 'lucide-react';

export const NOTIFICATION_TYPE_CONFIG = {
    // Promotion
    promotion_request_submitted: { icon: Megaphone, bg: 'bg-indigo-100', color: 'text-indigo-600' },
    promotion_approved: { icon: Megaphone, bg: 'bg-indigo-100', color: 'text-indigo-600' },
    promotion_rejected: { icon: Megaphone, bg: 'bg-indigo-100', color: 'text-indigo-600' },
    promotion_activated: { icon: Megaphone, bg: 'bg-indigo-100', color: 'text-indigo-600' },
    promotion_expiring_soon: { icon: Megaphone, bg: 'bg-amber-100', color: 'text-amber-600' },
    promotion_expired: { icon: Megaphone, bg: 'bg-slate-100', color: 'text-slate-600' },
    promotion: { icon: Megaphone, bg: 'bg-indigo-100', color: 'text-indigo-600' },
    promotion_update: { icon: Megaphone, bg: 'bg-indigo-100', color: 'text-indigo-600' },
    // Payment
    payment_required: { icon: Wallet, bg: 'bg-amber-100', color: 'text-amber-600' },
    payment_submitted: { icon: Wallet, bg: 'bg-blue-100', color: 'text-blue-600' },
    payment_approved: { icon: Wallet, bg: 'bg-emerald-100', color: 'text-emerald-600' },
    payment_rejected: { icon: Wallet, bg: 'bg-red-100', color: 'text-red-600' },
    // Job
    job_post: { icon: Briefcase, bg: 'bg-teal-100', color: 'text-teal-600' },
    job_posted: { icon: Briefcase, bg: 'bg-teal-100', color: 'text-teal-600' },
    job_approved: { icon: Briefcase, bg: 'bg-emerald-100', color: 'text-emerald-600' },
    job_rejected: { icon: Briefcase, bg: 'bg-red-100', color: 'text-red-600' },
    job_expired: { icon: Briefcase, bg: 'bg-slate-100', color: 'text-slate-600' },
    job_updated: { icon: Briefcase, bg: 'bg-teal-100', color: 'text-teal-600' },
    new_application: { icon: UserCheck, bg: 'bg-blue-100', color: 'text-blue-600' },
    // Application / Interview
    application_submitted: { icon: UserCheck, bg: 'bg-blue-100', color: 'text-blue-600' },
    application_update: { icon: UserCheck, bg: 'bg-blue-100', color: 'text-blue-600' },
    application_shortlisted: { icon: UserCheck, bg: 'bg-emerald-100', color: 'text-emerald-600' },
    application_rejected: { icon: XCircle, bg: 'bg-red-100', color: 'text-red-600' },
    application_status_updated: { icon: UserCheck, bg: 'bg-blue-100', color: 'text-blue-600' },
    offer: { icon: UserCheck, bg: 'bg-emerald-100', color: 'text-emerald-600' },
    interview_scheduled: { icon: Calendar, bg: 'bg-amber-100', color: 'text-amber-600' },
    interview_rescheduled: { icon: Calendar, bg: 'bg-amber-100', color: 'text-amber-600' },
    interview_update: { icon: Calendar, bg: 'bg-amber-100', color: 'text-amber-600' },
    reschedule_approved: { icon: Calendar, bg: 'bg-emerald-100', color: 'text-emerald-600' },
    reschedule_declined: { icon: XCircle, bg: 'bg-red-100', color: 'text-red-600' },
    // Company / Recruiter
    recruiter_approved: { icon: ShieldCheck, bg: 'bg-emerald-100', color: 'text-emerald-600' },
    recruiter_rejected: { icon: XCircle, bg: 'bg-red-100', color: 'text-red-600' },
    recruiter_kyc_submitted: { icon: ShieldCheck, bg: 'bg-violet-100', color: 'text-violet-600' },
    company_verification_submitted: { icon: Building2, bg: 'bg-violet-100', color: 'text-violet-600' },
    company_verification_approved: { icon: Building2, bg: 'bg-emerald-100', color: 'text-emerald-600' },
    company_verification_rejected: { icon: Building2, bg: 'bg-red-100', color: 'text-red-600' },
    company_profile_updated: { icon: Building2, bg: 'bg-violet-100', color: 'text-violet-600' },
    kyc_update: { icon: ShieldCheck, bg: 'bg-violet-100', color: 'text-violet-600' },
    kyc_approved: { icon: ShieldCheck, bg: 'bg-emerald-100', color: 'text-emerald-600' },
    kyc_rejected: { icon: XCircle, bg: 'bg-red-100', color: 'text-red-600' },
    verification_update: { icon: ShieldCheck, bg: 'bg-violet-100', color: 'text-violet-600' },
    // Contact / System
    new_contact_message: { icon: MessageSquare, bg: 'bg-cyan-100', color: 'text-cyan-600' },
    admin_reply_sent: { icon: MessageSquare, bg: 'bg-cyan-100', color: 'text-cyan-600' },
    password_reset_requested: { icon: Bell, bg: 'bg-slate-100', color: 'text-slate-600' },
    system_announcement: { icon: Bell, bg: 'bg-slate-100', color: 'text-slate-600' },
    kyc_submitted: { icon: ShieldCheck, bg: 'bg-violet-100', color: 'text-violet-600' },
    system: { icon: Bell, bg: 'bg-slate-100', color: 'text-slate-600' },
};

const CATEGORY_ICONS = {
    promotion: { icon: Megaphone, bg: 'bg-indigo-100', color: 'text-indigo-600' },
    payment: { icon: Wallet, bg: 'bg-amber-100', color: 'text-amber-600' },
    job: { icon: Briefcase, bg: 'bg-teal-100', color: 'text-teal-600' },
    application: { icon: UserCheck, bg: 'bg-blue-100', color: 'text-blue-600' },
    interview: { icon: Calendar, bg: 'bg-amber-100', color: 'text-amber-600' },
    company: { icon: Building2, bg: 'bg-violet-100', color: 'text-violet-600' },
    recruiter: { icon: ShieldCheck, bg: 'bg-violet-100', color: 'text-violet-600' },
    contact: { icon: MessageSquare, bg: 'bg-cyan-100', color: 'text-cyan-600' },
    system: { icon: Bell, bg: 'bg-slate-100', color: 'text-slate-600' },
};

export function getNotificationConfig(type, category) {
    return (
        NOTIFICATION_TYPE_CONFIG[type] ||
        (category && CATEGORY_ICONS[category]) ||
        NOTIFICATION_TYPE_CONFIG.system
    );
}
