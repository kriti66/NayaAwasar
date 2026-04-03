import { combineDateAndTimeNepal } from './interviewDateTime';

/** Subtle highlight for notification deep-link focus (matches app teal). */
export const INTERVIEW_CARD_DEEP_LINK_HIGHLIGHT =
    'ring-2 ring-[#29a08e] shadow-[0_0_0_3px_rgba(41,160,142,0.15)]';

/**
 * Parse ?date=YYYY-MM-DD from calendar deep links. Returns null if invalid.
 */
export function parseCalendarDateQuery(yyyyMmDd) {
    if (!yyyyMmDd || typeof yyyyMmDd !== 'string') return null;
    const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(yyyyMmDd.trim());
    if (!m) return null;
    const y = Number(m[1]);
    const mo = Number(m[2]);
    const d = Number(m[3]);
    if (mo < 1 || mo > 12 || d < 1 || d > 31) return null;
    const dt = new Date(Date.UTC(y, mo - 1, d));
    if (dt.getUTCFullYear() !== y || dt.getUTCMonth() !== mo - 1 || dt.getUTCDate() !== d) return null;
    return {
        year: y,
        monthIndex: mo - 1,
        dayKey: `${y}-${m[2]}-${m[3]}`
    };
}

/** Calendar day key aligned with backend date storage (UTC calendar day). */
export function interviewUtcDayKey(isoOrDate) {
    const d = new Date(isoOrDate);
    if (Number.isNaN(d.getTime())) return null;
    const y = d.getUTCFullYear();
    const m = String(d.getUTCMonth() + 1).padStart(2, '0');
    const day = String(d.getUTCDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
}

export function groupInterviewsByUtcDay(interviews) {
    const map = new Map();
    for (const inv of interviews || []) {
        const key = interviewUtcDayKey(inv.date);
        if (!key) continue;
        if (!map.has(key)) map.set(key, []);
        map.get(key).push(inv);
    }
    return map;
}

export function statusBadgeClasses(status) {
    switch (status) {
        case 'pending_acceptance':
            return 'bg-amber-100 text-amber-900 ring-amber-200';
        case 'scheduled':
            return 'bg-yellow-100 text-yellow-900 ring-yellow-200';
        case 'completed':
            return 'bg-emerald-100 text-emerald-900 ring-emerald-200';
        case 'reschedule_requested':
            return 'bg-sky-100 text-sky-900 ring-sky-200';
        case 'cancelled':
            return 'bg-red-100 text-red-900 ring-red-200';
        default:
            return 'bg-slate-100 text-slate-800 ring-slate-200';
    }
}

export function statusDotClass(status) {
    switch (status) {
        case 'pending_acceptance':
            return 'bg-amber-500';
        case 'scheduled':
            return 'bg-yellow-500';
        case 'completed':
            return 'bg-emerald-500';
        case 'reschedule_requested':
            return 'bg-sky-500';
        case 'cancelled':
            return 'bg-red-500';
        default:
            return 'bg-slate-400';
    }
}

/** Effective start for "upcoming" checks (current slot, not proposed reschedule). */
export function getCalendarInterviewStart(inv) {
    return combineDateAndTimeNepal(inv.date, inv.time);
}

export function isInterviewUpcoming(inv) {
    const start = getCalendarInterviewStart(inv);
    if (!start) return false;
    return start.getTime() > Date.now();
}

export function formatDisplayDayKey(dayKey) {
    if (!dayKey) return '';
    const [y, m, d] = dayKey.split('-').map(Number);
    const dt = new Date(Date.UTC(y, m - 1, d));
    return dt.toLocaleDateString(undefined, {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        timeZone: 'UTC'
    });
}

export function buildMonthGrid(year, monthIndex) {
    const first = new Date(Date.UTC(year, monthIndex, 1));
    const last = new Date(Date.UTC(year, monthIndex + 1, 0));
    const daysInMonth = last.getUTCDate();
    const startDow = first.getUTCDay();
    const cells = [];
    for (let i = 0; i < startDow; i++) cells.push({ type: 'pad' });
    for (let day = 1; day <= daysInMonth; day++) {
        const key = `${year}-${String(monthIndex + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        cells.push({ type: 'day', day, key });
    }
    return cells;
}
