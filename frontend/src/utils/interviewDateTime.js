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
