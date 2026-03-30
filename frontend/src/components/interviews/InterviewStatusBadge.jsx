const STYLES = {
    SCHEDULED: 'bg-slate-100 text-slate-700 border-slate-200',
    /** Upcoming list: green “Scheduled” per product spec */
    SCHEDULED_UPCOMING: 'bg-emerald-50 text-emerald-800 border-emerald-200',
    COMPLETED: 'bg-teal-50 text-teal-900 border-teal-200',
    LIVE: 'bg-emerald-500 text-white border-emerald-600 shadow-md shadow-emerald-500/20',
    MISSED: 'bg-gray-200 text-gray-700 border-gray-300',
    PENDING_RESULT: 'bg-violet-50 text-violet-800 border-violet-200',
    COMPLETED_PASSED: 'bg-green-50 text-green-800 border-green-200',
    COMPLETED_REJECTED: 'bg-red-50 text-red-800 border-red-200',
    RESCHEDULE_REQUESTED: 'bg-amber-100 text-amber-900 border-amber-200',
    CANCELLED: 'bg-gray-100 text-gray-500 border-gray-200'
};

const LABELS = {
    SCHEDULED: 'Scheduled',
    SCHEDULED_UPCOMING: 'Scheduled',
    COMPLETED: 'Completed',
    LIVE: 'Live now',
    MISSED: 'Missed',
    PENDING_RESULT: 'Awaiting result',
    COMPLETED_PASSED: 'Passed',
    COMPLETED_REJECTED: 'Not selected',
    RESCHEDULE_REQUESTED: 'Reschedule',
    CANCELLED: 'Cancelled'
};

export default function InterviewStatusBadge({ status }) {
    const key = status && STYLES[status] ? status : 'SCHEDULED';
    return (
        <span
            className={`px-4 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-widest border ${STYLES[key]}`}
        >
            {LABELS[key] || status}
        </span>
    );
}
