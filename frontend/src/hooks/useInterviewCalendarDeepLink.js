import { useCallback, useEffect, useRef, useState } from 'react';
import { useSearchParams, useNavigate, useLocation } from 'react-router-dom';
import {
    interviewUtcDayKey,
    parseCalendarDateQuery,
    INTERVIEW_CARD_DEEP_LINK_HIGHLIGHT
} from '../utils/interviewCalendarUi';

const SCROLL_ATTEMPTS = 10;
const SCROLL_RETRY_MS = 100;
const INITIAL_DELAY_MS = 200;

/**
 * Reads ?date=YYYY-MM-DD&interviewId= from URL, focuses calendar + panel, highlights card, strips query.
 */
export function useInterviewCalendarDeepLink({
    loading,
    interviews,
    setYear,
    setMonthIndex,
    setSelectedDayKey
}) {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const { pathname } = useLocation();
    const [highlightedInterviewId, setHighlightedInterviewId] = useState(null);
    const cardRefs = useRef({});
    const highlightTimerRef = useRef(null);
    const pendingTimeoutsRef = useRef([]);
    const effectSessionRef = useRef(0);

    const registerInterviewCardRef = useCallback((id, el) => {
        const key = id != null ? String(id) : '';
        if (!key) return;
        if (el) cardRefs.current[key] = el;
        else delete cardRefs.current[key];
    }, []);

    useEffect(() => {
        return () => {
            if (highlightTimerRef.current) clearTimeout(highlightTimerRef.current);
            pendingTimeoutsRef.current.forEach(clearTimeout);
            pendingTimeoutsRef.current = [];
        };
    }, []);

    useEffect(() => {
        if (loading) return;

        const idQ = searchParams.get('interviewId')?.trim() || '';
        const dateQ = searchParams.get('date')?.trim() || '';
        if (!idQ && !dateQ) return;

        const session = ++effectSessionRef.current;
        const isStale = () => session !== effectSessionRef.current;

        const parsedDate = dateQ ? parseCalendarDateQuery(dateQ) : null;
        if (dateQ && !parsedDate && !idQ) {
            navigate({ pathname, search: '' }, { replace: true });
            return;
        }
        if (isStale()) return;

        let inv = null;
        if (idQ) {
            inv = interviews.find((i) => String(i.id) === idQ) || null;
        }

        let dayKey = parsedDate?.dayKey ?? null;
        if (!dayKey && inv) {
            dayKey = interviewUtcDayKey(inv.date);
        }

        if (dayKey) {
            const [y, mo] = dayKey.split('-').map(Number);
            setYear(y);
            setMonthIndex(mo - 1);
            setSelectedDayKey(dayKey);
        } else if (parsedDate) {
            setYear(parsedDate.year);
            setMonthIndex(parsedDate.monthIndex);
            setSelectedDayKey(parsedDate.dayKey);
        }

        const targetId = inv
            ? String(inv.id)
            : idQ && interviews.some((i) => String(i.id) === idQ)
              ? idQ
              : '';
        const finalDayKey = dayKey || parsedDate?.dayKey || null;

        const stripQuery = () => navigate({ pathname, search: '' }, { replace: true });

        const tryScroll = (attempt) => {
            if (isStale()) return;
            if (!targetId || !finalDayKey) {
                stripQuery();
                return;
            }
            const onDay = interviews.filter((i) => interviewUtcDayKey(i.date) === finalDayKey);
            const match = onDay.some((i) => String(i.id) === targetId);
            if (!match) {
                stripQuery();
                return;
            }

            const el = cardRefs.current[targetId];
            if (el) {
                requestAnimationFrame(() => {
                    requestAnimationFrame(() => {
                        if (isStale()) return;
                        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    });
                });
                if (!isStale()) {
                    setHighlightedInterviewId(targetId);
                    if (highlightTimerRef.current) clearTimeout(highlightTimerRef.current);
                    highlightTimerRef.current = setTimeout(() => setHighlightedInterviewId(null), 3000);
                }
                stripQuery();
                return;
            }

            if (attempt < SCROLL_ATTEMPTS) {
                const tid = setTimeout(() => tryScroll(attempt + 1), SCROLL_RETRY_MS);
                pendingTimeoutsRef.current.push(tid);
            } else {
                stripQuery();
            }
        };

        const initialTid = setTimeout(() => tryScroll(0), INITIAL_DELAY_MS);
        pendingTimeoutsRef.current.push(initialTid);

        return () => {
            effectSessionRef.current += 1;
            pendingTimeoutsRef.current.forEach(clearTimeout);
            pendingTimeoutsRef.current = [];
        };
    }, [
        loading,
        interviews,
        searchParams,
        navigate,
        pathname,
        setYear,
        setMonthIndex,
        setSelectedDayKey
    ]);

    return {
        highlightedInterviewId,
        registerInterviewCardRef,
        interviewCardHighlightClass: INTERVIEW_CARD_DEEP_LINK_HIGHLIGHT
    };
}
