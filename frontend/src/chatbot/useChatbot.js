import { useState, useEffect, useCallback, useRef } from 'react';
import { detectIntent, shouldForceHandoff } from './intentDetector';
import { getResponseText } from './responses';
import { getRelatedIntents, labelForIntent } from './relatedQuestions';
import api from '../services/api';

const STORAGE_KEY = 'naya_chatbot_state_v2';
const SESSION_KEY = 'naya_chat_session_id';

function newId() {
    return globalThis.crypto?.randomUUID?.() || `m_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}

function loadPersisted() {
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (!raw) return null;
        return JSON.parse(raw);
    } catch {
        return null;
    }
}

function getSessionId() {
    try {
        let s = sessionStorage.getItem(SESSION_KEY);
        if (!s) {
            s = newId();
            sessionStorage.setItem(SESSION_KEY, s);
        }
        return s;
    } catch {
        return newId();
    }
}

function typingDelayMs() {
    return 700 + Math.random() * 200;
}

export function useChatbot({ authUser } = {}) {
    const persisted = loadPersisted();
    const [messages, setMessages] = useState(() => {
        if (persisted?.messages?.length) return persisted.messages;
        return [
            {
                id: newId(),
                sender: 'bot',
                text:
                    'Namaste! 🙏 I’m the Naya Awasar Assistant. Are you a Job Seeker or Recruiter?',
                ts: Date.now(),
                intent: 'onboarding',
                showRolePicker: true
            }
        ];
    });
    const [userType, setUserType] = useState(persisted?.userType || 'unknown');
    const [lang, setLang] = useState(persisted?.lang || 'en');
    const [typing, setTyping] = useState(false);
    const lastNormalizedRef = useRef('');
    const fallbackStreakRef = useRef(0);

    useEffect(() => {
        try {
            localStorage.setItem(
                STORAGE_KEY,
                JSON.stringify({ messages, userType, lang })
            );
        } catch (e) {
            console.warn('[chatbot] persist failed', e);
        }
    }, [messages, userType, lang]);

    const logInteraction = useCallback(
        async ({ turnId, userMessage, detectedIntent, botResponse }) => {
            try {
                await api.post('/chatbot/interaction', {
                    sessionId: getSessionId(),
                    turnId,
                    userId: authUser?.id || authUser?._id || undefined,
                    userType,
                    userMessage,
                    detectedIntent,
                    botResponse,
                    language: lang
                });
            } catch (e) {
                console.warn('[chatbot] analytics log failed', e?.message || e);
            }
        },
        [authUser, userType, lang]
    );

    const submitFeedback = useCallback(async (turnId, sentiment) => {
        if (!turnId || !['up', 'down'].includes(sentiment)) return;
        try {
            await api.patch(`/chatbot/interaction/${turnId}/feedback`, {
                feedback: sentiment
            });
        } catch (e) {
            console.warn('[chatbot] feedback failed', e?.message || e);
        }
        setMessages((prev) =>
            prev.map((m) => (m.turnId === turnId ? { ...m, feedback: sentiment } : m))
        );
    }, []);

    const resolveIntentAndText = useCallback(
        (rawText) => {
            const normalized = String(rawText || '')
                .toLowerCase()
                .trim()
                .replace(/\s+/g, ' ');

            if (shouldForceHandoff(rawText)) {
                return { intent: 'handoff', text: getResponseText('handoff', lang, userType) };
            }

            let { intent } = detectIntent(rawText);

            if (intent === 'fallback') {
                if (normalized && normalized === lastNormalizedRef.current) {
                    fallbackStreakRef.current += 1;
                } else {
                    fallbackStreakRef.current = 1;
                }
                lastNormalizedRef.current = normalized;
                if (fallbackStreakRef.current >= 2) {
                    intent = 'repeat_handoff';
                    fallbackStreakRef.current = 0;
                }
            } else {
                fallbackStreakRef.current = 0;
                lastNormalizedRef.current = normalized;
            }

            if (intent === 'empty') {
                return { intent: 'empty', text: '' };
            }

            const text = getResponseText(intent, lang, userType);
            return { intent, text };
        },
        [lang, userType]
    );

    const fetchRecommendationJobs = useCallback(async () => {
        const res = await api.get('/recommendations', { params: { limit: 3 } });
        const list = res.data?.jobs;
        return Array.isArray(list) ? list.slice(0, 3) : [];
    }, []);

    const getAiRecommendationPayload = useCallback(async () => {
        const isSeeker =
            authUser &&
            (authUser.role === 'jobseeker' || authUser.role === 'job_seeker');
        if (!isSeeker) {
            return {
                text: getResponseText('ai_recommendation', lang, userType),
                jobRecommendations: null
            };
        }
        try {
            const jobs = await fetchRecommendationJobs();
            const intro =
                jobs.length > 0
                    ? lang === 'ne'
                        ? 'तपाईंको प्रोफाइलमा आधारित केही सिफारिस जागिरहरू:'
                        : 'Here are a few roles picked to match your profile:'
                    : getResponseText('ai_recommendation', lang, userType);
            return { text: intro, jobRecommendations: jobs.length ? jobs : null };
        } catch {
            return {
                text: getResponseText('ai_recommendation', lang, userType),
                jobRecommendations: null
            };
        }
    }, [authUser, fetchRecommendationJobs, lang, userType]);

    const pushBotReply = useCallback(
        (userText, intent, botText, extras = {}) => {
            const turnId = newId();
            const relatedKey =
                intent === 'repeat_handoff' || intent === 'fallback'
                    ? 'fallback'
                    : intent === 'handoff'
                      ? 'contact_support'
                      : intent;
            const related = getRelatedIntents(relatedKey);

            const jobRecommendations = extras.jobRecommendations || null;
            const logPayload =
                botText +
                (jobRecommendations?.length
                    ? ` [jobs:${jobRecommendations.map((j) => j.title).join(';')}]`
                    : '');

            setMessages((prev) => [
                ...prev,
                {
                    id: newId(),
                    sender: 'bot',
                    text: botText,
                    ts: Date.now(),
                    intent,
                    turnId,
                    related,
                    feedback: null,
                    jobRecommendations
                }
            ]);

            logInteraction({
                turnId,
                userMessage: userText,
                detectedIntent: intent,
                botResponse: logPayload
            });
        },
        [logInteraction]
    );

    const sendUserText = useCallback(
        (rawText) => {
            const text = String(rawText || '').trim();
            if (!text) return;

            setMessages((prev) => [
                ...prev,
                { id: newId(), sender: 'user', text, ts: Date.now() }
            ]);

            setTyping(true);
            window.setTimeout(async () => {
                const { intent, text: initialBotText } = resolveIntentAndText(text);
                let botText = initialBotText;
                let extras = {};
                if (intent === 'ai_recommendation') {
                    const payload = await getAiRecommendationPayload();
                    botText = payload.text;
                    extras.jobRecommendations = payload.jobRecommendations;
                }
                setTyping(false);
                if (intent === 'empty' || !botText) return;
                pushBotReply(text, intent, botText, extras);
            }, typingDelayMs());
        },
        [getAiRecommendationPayload, pushBotReply, resolveIntentAndText]
    );

    /** Quick intent chip (skips keyword detection). */
    const sendIntentChip = useCallback(
        (intentId) => {
            const text = getResponseText(intentId, lang, userType);
            const display = labelForIntent(intentId, lang);

            setMessages((prev) => [
                ...prev,
                { id: newId(), sender: 'user', text: display, ts: Date.now() }
            ]);

            setTyping(true);
            window.setTimeout(async () => {
                let botText = text;
                let extras = {};
                if (intentId === 'ai_recommendation') {
                    const payload = await getAiRecommendationPayload();
                    botText = payload.text;
                    extras.jobRecommendations = payload.jobRecommendations;
                }
                setTyping(false);
                pushBotReply(display, intentId, botText, extras);
            }, typingDelayMs());
        },
        [getAiRecommendationPayload, lang, userType, pushBotReply]
    );

    const setRole = useCallback(
        (role) => {
            const r = role === 'recruiter' ? 'recruiter' : role === 'jobseeker' ? 'jobseeker' : 'unknown';
            setUserType(r);

            let ack = '';
            if (r === 'jobseeker') ack = getResponseText('role_jobseeker', lang, r);
            else if (r === 'recruiter') ack = getResponseText('role_recruiter', lang, r);
            else ack = getResponseText('role_help', lang, r);

            setMessages((prev) => [
                ...prev.map((m) => (m.showRolePicker ? { ...m, showRolePicker: false } : m)),
                {
                    id: newId(),
                    sender: 'user',
                    text:
                        r === 'jobseeker'
                            ? 'I’m a Job Seeker'
                            : r === 'recruiter'
                              ? 'I’m a Recruiter'
                              : 'I need Help',
                    ts: Date.now()
                },
                {
                    id: newId(),
                    sender: 'bot',
                    text: ack,
                    ts: Date.now(),
                    intent: 'role_ack',
                    related: getRelatedIntents(
                        r === 'recruiter' ? 'post_job' : 'how_to_apply'
                    )
                }
            ]);
        },
        [lang]
    );

    const clearChat = useCallback(() => {
        lastNormalizedRef.current = '';
        fallbackStreakRef.current = 0;
        setUserType('unknown');
        setMessages([
            {
                id: newId(),
                sender: 'bot',
                text:
                    'Namaste! 🙏 I’m the Naya Awasar Assistant. Are you a Job Seeker or Recruiter?',
                ts: Date.now(),
                intent: 'onboarding',
                showRolePicker: true
            }
        ]);
        localStorage.removeItem(STORAGE_KEY);
    }, []);

    return {
        messages,
        typing,
        userType,
        lang,
        setLang,
        setRole,
        sendUserText,
        sendIntentChip,
        submitFeedback,
        clearChat
    };
}
