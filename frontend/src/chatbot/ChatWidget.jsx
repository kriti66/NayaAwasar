import React, { useEffect, useRef, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
    MessageCircle,
    X,
    Trash2,
    ThumbsUp,
    ThumbsDown,
    ExternalLink
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useChatbot } from './useChatbot';
import { labelForIntent } from './relatedQuestions';
import { getSupportEmail } from './responses';
import './chatbot.css';

function formatTime(ts) {
    try {
        return new Date(ts).toLocaleTimeString(undefined, {
            hour: '2-digit',
            minute: '2-digit'
        });
    } catch {
        return '';
    }
}

export default function ChatWidget() {
    const [open, setOpen] = useState(false);
    const [input, setInput] = useState('');
    const endRef = useRef(null);
    const { user } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();

    const {
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
    } = useChatbot({ authUser: user });

    const isAdminRoute = location.pathname.startsWith('/admin');

    useEffect(() => {
        endRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages, typing, open]);

    if (isAdminRoute) return null;

    const onSend = () => {
        sendUserText(input);
        setInput('');
    };

    const onKey = (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            onSend();
        }
    };

    const supportEmail = getSupportEmail();

    return (
        <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end font-sans">
            <div
                className={`transition-all duration-300 ease-out origin-bottom-right mb-4 bg-white rounded-2xl shadow-2xl border border-gray-100 w-[350px] sm:w-[390px] max-h-[min(600px,calc(100vh-6rem))] flex flex-col overflow-hidden ${
                    open
                        ? 'scale-100 opacity-100 pointer-events-auto'
                        : 'scale-95 opacity-0 pointer-events-none absolute'
                }`}
                style={{ height: 'min(560px, calc(100vh - 7rem))' }}
            >
                {/* Header */}
                <div className="bg-gradient-to-r from-[#29a08e] to-[#228377] px-4 py-3 flex justify-between items-center text-white shrink-0 gap-2">
                    <div className="flex items-center gap-2.5 min-w-0">
                        <div className="bg-white/20 p-2 rounded-full shrink-0">
                            <MessageCircle className="w-5 h-5 text-white" strokeWidth={2} />
                        </div>
                        <div className="min-w-0">
                            <h3 className="font-bold text-sm tracking-wide truncate">
                                Naya Awasar Assistant
                            </h3>
                            <div className="flex items-center gap-1.5 mt-0.5">
                                <span className="w-2 h-2 rounded-full bg-emerald-300 animate-pulse shrink-0" />
                                <span className="text-[11px] text-white/85 font-medium truncate">
                                    Nepal job portal help
                                </span>
                            </div>
                        </div>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                        <div className="flex rounded-lg bg-white/15 p-0.5 text-[10px] font-bold">
                            <button
                                type="button"
                                onClick={() => setLang('en')}
                                className={`px-2 py-1 rounded-md transition-colors ${
                                    lang === 'en' ? 'bg-white/25 text-white' : 'text-white/75 hover:text-white'
                                }`}
                            >
                                EN
                            </button>
                            <button
                                type="button"
                                onClick={() => setLang('ne')}
                                className={`px-2 py-1 rounded-md transition-colors ${
                                    lang === 'ne' ? 'bg-white/25 text-white' : 'text-white/75 hover:text-white'
                                }`}
                            >
                                नेपाली
                            </button>
                        </div>
                        <button
                            type="button"
                            onClick={clearChat}
                            className="p-2 text-white/85 hover:text-white rounded-lg hover:bg-white/10"
                            title="Clear chat"
                        >
                            <Trash2 className="w-4 h-4" />
                        </button>
                        <button
                            type="button"
                            onClick={() => setOpen(false)}
                            className="p-2 text-white/85 hover:text-white rounded-lg hover:bg-white/10"
                            aria-label="Close chat"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>
                </div>

                {/* Messages */}
                <div className="flex-1 overflow-y-auto p-4 bg-gray-50/90 flex flex-col gap-3">
                    {messages.map((msg) => (
                        <div key={msg.id} className="space-y-1.5">
                            <div
                                className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                            >
                                <div
                                    className={`max-w-[88%] rounded-2xl px-3.5 py-2.5 text-sm shadow-sm chatbot-msg-text ${
                                        msg.sender === 'user'
                                            ? 'bg-[#29a08e] text-white rounded-tr-md'
                                            : 'bg-white text-gray-800 border border-gray-100 rounded-tl-md'
                                    }`}
                                >
                                    <div className="whitespace-pre-wrap">{msg.text}</div>
                                    {msg.sender === 'bot' &&
                                        Array.isArray(msg.jobRecommendations) &&
                                        msg.jobRecommendations.length > 0 && (
                                            <div className="mt-3 pt-3 border-t border-gray-100 space-y-2">
                                                {msg.jobRecommendations.map((job) => {
                                                    const jid = job._id || job.job_id;
                                                    const score =
                                                        typeof job.matchScore === 'number'
                                                            ? job.matchScore
                                                            : Number(job.matchScore);
                                                    const pct = Number.isFinite(score)
                                                        ? `${Math.min(100, Math.max(0, score))}%`
                                                        : null;
                                                    return (
                                                        <Link
                                                            key={jid}
                                                            to={`/jobs/${jid}`}
                                                            onClick={() => setOpen(false)}
                                                            className="block rounded-xl border border-gray-100 bg-gray-50/80 px-3 py-2 hover:border-[#29a08e]/40 hover:bg-[#29a08e]/5 transition-colors"
                                                        >
                                                            <div className="flex items-start justify-between gap-2">
                                                                <div className="min-w-0">
                                                                    <p className="text-xs font-bold text-gray-900 line-clamp-2">
                                                                        {job.title}
                                                                    </p>
                                                                    <p className="text-[10px] text-gray-500 font-medium truncate mt-0.5">
                                                                        {job.company_name || 'Company'} ·{' '}
                                                                        {job.location || '—'}
                                                                    </p>
                                                                </div>
                                                                {pct && (
                                                                    <span className="shrink-0 text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-teal-50 text-teal-700 border border-teal-200">
                                                                        {pct} match
                                                                    </span>
                                                                )}
                                                            </div>
                                                        </Link>
                                                    );
                                                })}
                                            </div>
                                        )}
                                </div>
                            </div>
                            <div
                                className={`flex items-center gap-2 px-1 ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                            >
                                <span className="text-[10px] text-gray-400 font-medium">
                                    {formatTime(msg.ts)}
                                </span>
                                {msg.sender === 'bot' && msg.turnId && (
                                    <div className="flex items-center gap-0.5">
                                        <button
                                            type="button"
                                            disabled={msg.feedback === 'up'}
                                            onClick={() => submitFeedback(msg.turnId, 'up')}
                                            className="p-1 rounded-md text-gray-400 hover:text-[#29a08e] hover:bg-[#29a08e]/10 disabled:opacity-40"
                                            aria-label="Helpful"
                                        >
                                            <ThumbsUp className="w-3.5 h-3.5" />
                                        </button>
                                        <button
                                            type="button"
                                            disabled={msg.feedback === 'down'}
                                            onClick={() => submitFeedback(msg.turnId, 'down')}
                                            className="p-1 rounded-md text-gray-400 hover:text-amber-600 hover:bg-amber-50 disabled:opacity-40"
                                            aria-label="Not helpful"
                                        >
                                            <ThumbsDown className="w-3.5 h-3.5" />
                                        </button>
                                    </div>
                                )}
                            </div>

                            {msg.showRolePicker && userType === 'unknown' && (
                                <div className="flex flex-wrap gap-2 pl-0 pt-1">
                                    <button
                                        type="button"
                                        onClick={() => setRole('jobseeker')}
                                        className="text-xs font-semibold bg-white border border-[#29a08e]/40 text-[#228377] px-3 py-2 rounded-xl hover:bg-[#29a08e]/5"
                                    >
                                        I’m a Job Seeker
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setRole('recruiter')}
                                        className="text-xs font-semibold bg-white border border-[#29a08e]/40 text-[#228377] px-3 py-2 rounded-xl hover:bg-[#29a08e]/5"
                                    >
                                        I’m a Recruiter
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setRole('help')}
                                        className="text-xs font-semibold bg-white border border-amber-200 text-amber-800 px-3 py-2 rounded-xl hover:bg-amber-50"
                                    >
                                        I need Help
                                    </button>
                                </div>
                            )}

                            {msg.sender === 'bot' && msg.related?.length > 0 && (
                                <div className="flex flex-wrap gap-1.5 pl-0 pt-1">
                                    {msg.related.map((rid) => (
                                        <button
                                            key={rid}
                                            type="button"
                                            onClick={() => sendIntentChip(rid)}
                                            className="text-[11px] font-semibold bg-white border border-gray-200 text-gray-700 px-2.5 py-1.5 rounded-lg hover:border-[#29a08e]/50 hover:text-[#228377] transition-colors"
                                        >
                                            {labelForIntent(rid, lang)}
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                    ))}

                    {typing && (
                        <div className="flex justify-start">
                            <div className="bg-white border border-gray-100 rounded-2xl rounded-tl-md px-4 py-3 flex gap-1.5 items-center shadow-sm">
                                <span className="chatbot-typing-dot" />
                                <span className="chatbot-typing-dot" />
                                <span className="chatbot-typing-dot" />
                            </div>
                        </div>
                    )}

                    {(() => {
                        const lastBot = [...messages].reverse().find((m) => m.sender === 'bot');
                        const showHandoffCta =
                            lastBot &&
                            (lastBot.intent === 'handoff' || lastBot.intent === 'repeat_handoff');
                        return showHandoffCta ? (
                            <div className="flex justify-center pt-1">
                                <button
                                    type="button"
                                    onClick={() => {
                                        navigate('/contact');
                                        setOpen(false);
                                    }}
                                    className="inline-flex items-center gap-1.5 text-xs font-bold text-[#29a08e] hover:text-[#228377] bg-white border border-[#29a08e]/30 px-3 py-2 rounded-xl shadow-sm"
                                >
                                    Open Contact page
                                    <ExternalLink className="w-3.5 h-3.5" />
                                </button>
                            </div>
                        ) : null;
                    })()}

                    <div ref={endRef} />
                </div>

                <div className="p-3 bg-white border-t border-gray-100 shrink-0 space-y-2">
                    <p className="text-[10px] text-center text-gray-500">
                        Email:{' '}
                        <a className="text-[#29a08e] font-semibold" href={`mailto:${supportEmail}`}>
                            {supportEmail}
                        </a>
                    </p>
                    <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-full pr-1.5 pl-4 py-1.5 focus-within:ring-2 focus-within:ring-[#29a08e]/20 focus-within:border-[#29a08e]">
                        <input
                            type="text"
                            className="flex-1 bg-transparent border-none focus:outline-none text-sm py-1 placeholder-gray-400"
                            placeholder={
                                lang === 'ne'
                                    ? 'प्रश्न टाइप गर्नुहोस्…'
                                    : 'Type your question…'
                            }
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            onKeyDown={onKey}
                        />
                        <button
                            type="button"
                            onClick={onSend}
                            disabled={!input.trim()}
                            className="bg-[#29a08e] text-white p-2 rounded-full hover:bg-[#228377] disabled:opacity-45 disabled:cursor-not-allowed shadow-md shadow-[#29a08e]/20"
                            aria-label="Send"
                        >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
                                />
                            </svg>
                        </button>
                    </div>
                    <p className="text-[10px] text-center text-gray-400 font-medium">
                        Naya Awasar · assistant tips only
                    </p>
                </div>
            </div>

            <button
                type="button"
                onClick={() => setOpen((o) => !o)}
                className={`bg-[#29a08e] text-white p-4 rounded-full shadow-xl shadow-[#29a08e]/30 hover:bg-[#228377] transition-all duration-300 flex items-center justify-center ${
                    open ? 'scale-90 opacity-90' : 'scale-100 opacity-100 hover:scale-105'
                }`}
                aria-label={open ? 'Close chat' : 'Open assistant'}
            >
                {open ? <X className="w-7 h-7" /> : <MessageCircle className="w-7 h-7" strokeWidth={2} />}
            </button>
        </div>
    );
}
