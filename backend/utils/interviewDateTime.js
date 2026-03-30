/**
 * Interview scheduling uses Mongo `date` + string `time`, optional `startTime` Date,
 * and recruiter reschedule `proposedDate`/`proposedTime` when pending (aligned with zegoController).
 * Wall clock is interpreted as Nepal (NPT, UTC+5:45) when combining calendar date + time string.
 */

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

/**
 * Same effective instant used for ZEGO join window: startTime, else pending recruiter proposal, else date+time.
 * @param {object} interview Mongoose doc or plain object
 * @returns {Date|null}
 */
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

/**
 * End of the scheduled slot (start + duration minutes). Default duration 30.
 */
export function buildInterviewEndDateTime(interview) {
    const start = getEffectiveInterviewStart(interview);
    if (!start) return null;
    const raw = interview.duration;
    const minutes = Number.isFinite(Number(raw)) && Number(raw) > 0 ? Number(raw) : 30;
    return new Date(start.getTime() + minutes * 60 * 1000);
}

/**
 * Join window for video (early join + late join), same rules as ZEGO route.
 */
export function getInterviewJoinWindow(interview) {
    const scheduledStart = getEffectiveInterviewStart(interview);
    if (!scheduledStart || Number.isNaN(scheduledStart.getTime())) return null;

    const earlyMin = parseInt(process.env.ZEGO_EARLY_JOIN_MINUTES || '10', 10);
    const lateMin = parseInt(process.env.ZEGO_LATE_JOIN_MINUTES || '60', 10);
    const earlyMs = (Number.isFinite(earlyMin) ? earlyMin : 10) * 60 * 1000;
    const lateMs = (Number.isFinite(lateMin) ? lateMin : 60) * 60 * 1000;

    return {
        scheduledStart,
        joinAllowedFrom: new Date(scheduledStart.getTime() - earlyMs),
        joinAllowedUntil: new Date(scheduledStart.getTime() + lateMs)
    };
}
