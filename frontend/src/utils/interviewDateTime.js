/** Match backend/utils/interviewDateTime.js (Nepal wall clock for date + time). */

export const NEPAL_OFFSET_MS = (5 * 60 + 45) * 60 * 1000;

export function parseWallTimeToHoursMinutes(timeStr) {
    const raw = String(timeStr || '').trim();
    if (!raw) return { hours: 0, minutes: 0 };
    const upper = raw.toUpperCase();
    if (upper.includes('AM') || upper.includes('PM')) {
        const isPm = upper.includes('PM');
        const withoutMeridian = raw.replace(/\s*(AM|PM)\s*/gi, '').trim();
        const [hPart, mPart = '0'] = withoutMeridian.split(':');
        let h = parseInt(hPart, 10);
        const mi = parseInt(String(mPart).replace(/\D/g, ''), 10);
        const minutes = Number.isFinite(mi) ? mi : 0;
        if (!Number.isFinite(h)) h = 0;
        if (isPm && h !== 12) h += 12;
        if (!isPm && h === 12) h = 0;
        return { hours: h, minutes };
    }
    const parts = raw.split(':');
    const h = parseInt(parts[0], 10);
    const mi = parseInt(parts[1], 10);
    const sec = parseInt(parts[2], 10);
    const hours = Number.isFinite(h) ? h : 0;
    const minutes = Number.isFinite(mi) ? mi : 0;
    const seconds = Number.isFinite(sec) ? sec : 0;
    return { hours, minutes: minutes + seconds / 60 };
}

export function combineDateAndTimeNepal(dateValue, timeStr) {
    const d = new Date(dateValue);
    if (Number.isNaN(d.getTime())) return null;
    const { hours, minutes } = parseWallTimeToHoursMinutes(timeStr);
    const wholeMin = Math.floor(minutes);
    const sec = Math.round((minutes - wholeMin) * 60);
    const y = d.getUTCFullYear();
    const mo = d.getUTCMonth();
    const day = d.getUTCDate();
    const utcMs = Date.UTC(y, mo, day, hours, wholeMin, sec, 0) - NEPAL_OFFSET_MS;
    const out = new Date(utcMs);
    return Number.isNaN(out.getTime()) ? null : out;
}

/** Plain object shaped like Interview doc fields used on the server */
export function getEffectiveInterviewStart(interview) {
    if (!interview) return null;
    if (interview.startTime) {
        const st = new Date(interview.startTime);
        if (!Number.isNaN(st.getTime())) return st;
    }
    const rs = String(interview.rescheduleStatus || '').toUpperCase();
    const reschedulePending =
        interview.interviewStatus === 'reschedule_pending' &&
        interview.proposedDate &&
        interview.proposedTime &&
        ['PROPOSED', 'PENDING'].includes(rs);
    if (reschedulePending) {
        const slot = combineDateAndTimeNepal(interview.proposedDate, interview.proposedTime);
        if (slot) return slot;
    }
    return combineDateAndTimeNepal(interview.date, interview.time);
}

export function toInterviewPlainFromSeekerCard(app) {
    const inv = app?.interview || {};
    const doc = inv.interviewId || {};
    return {
        date: inv.date,
        time: inv.time,
        startTime: doc.startTime || inv.startTime,
        interviewStatus: doc.interviewStatus,
        rescheduleStatus: doc.rescheduleStatus,
        proposedDate: doc.proposedDate,
        proposedTime: doc.proposedTime,
        rescheduleRequestedBy: doc.rescheduleRequestedBy,
        joined: doc.joined,
        result: doc.result,
        status: doc.mongoStatus || 'Scheduled',
        duration: inv.duration
    };
}

export function msUntilInterviewStart(app) {
    const start = getEffectiveInterviewStart(toInterviewPlainFromSeekerCard(app));
    if (!start) return null;
    return start.getTime() - Date.now();
}

const DEFAULT_OFFSET_LABEL = '(GMT +5:45)';

/** 12-hour en-US time from an instant (ISO string, Date, or timestamp). */
export function formatTime(dateStr) {
    const d = new Date(dateStr);
    if (Number.isNaN(d.getTime())) return '—';
    return d.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
    });
}

function wrapTimezoneLabel(raw) {
    const s = String(raw || '').trim();
    if (!s) return DEFAULT_OFFSET_LABEL;
    if (s.startsWith('(')) return s;
    return `(${s})`;
}

/** Space + timezone label for interview rows (defaults to Nepal offset). */
export function formatInterviewTimezoneSuffix(src) {
    return ` ${wrapTimezoneLabel(src?.timezone)}`;
}

/**
 * Calendar API interview row (snake_case): effective_start, start_time, date, time.
 * Time only, no timezone suffix.
 */
export function formatCalendarInterviewCardTime(inv) {
    if (!inv) return '—';
    if (inv.effective_start) {
        const d = new Date(inv.effective_start);
        if (!Number.isNaN(d.getTime())) return formatTime(inv.effective_start);
    }
    if (inv.start_time) {
        const d2 = new Date(inv.start_time);
        if (!Number.isNaN(d2.getTime())) return formatTime(inv.start_time);
    }
    const slot = combineDateAndTimeNepal(inv.date, inv.time);
    if (slot && !Number.isNaN(slot.getTime())) return formatTime(slot.toISOString());
    return inv.time || '—';
}

/** Same as {@link formatCalendarInterviewCardTime} plus ` (GMT +5:45)` or ` (${inv.timezone})`. */
export function formatCalendarInterviewCardTimeWithZone(inv) {
    const t = formatCalendarInterviewCardTime(inv);
    const suffix = formatInterviewTimezoneSuffix(inv);
    if (t === '—') return `—${suffix}`;
    return `${t}${suffix}`;
}

/**
 * Embedded `app.interview` (jobseeker application card): date/time or nested Interview.startTime.
 */
export function formatApplicationInterviewTimeWithZone(app) {
    const inv = app?.interview;
    if (!inv) return `—${formatInterviewTimezoneSuffix(null)}`;
    const doc = inv.interviewId;
    const tzSrc = {
        timezone:
            inv.timezone != null && String(inv.timezone).trim()
                ? inv.timezone
                : typeof doc === 'object' && doc != null && doc.timezone != null
                  ? doc.timezone
                  : undefined
    };
    const st = doc?.startTime || inv.startTime;
    if (st) {
        const d = new Date(st);
        if (!Number.isNaN(d.getTime())) return `${formatTime(st)}${formatInterviewTimezoneSuffix(tzSrc)}`;
    }
    const slot = combineDateAndTimeNepal(inv.date, inv.time);
    if (slot && !Number.isNaN(slot.getTime()))
        return `${formatTime(slot.toISOString())}${formatInterviewTimezoneSuffix(tzSrc)}`;
    const rawTime = String(inv.time || '').trim();
    if (rawTime) return `${rawTime}${formatInterviewTimezoneSuffix(tzSrc)}`;
    return `—${formatInterviewTimezoneSuffix(tzSrc)}`;
}

/** Nepal wall date + time string → 12-hour display, or trimmed raw time if unparseable. */
export function formatNepalWallTimeAmPm(dateValue, timeStr) {
    const slot = combineDateAndTimeNepal(dateValue, timeStr);
    if (slot && !Number.isNaN(slot.getTime())) return formatTime(slot.toISOString());
    const t = String(timeStr || '').trim();
    return t || '—';
}
