import React, { useEffect, useLayoutEffect, useState, useRef, useCallback } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { ZegoUIKitPrebuilt } from '@zegocloud/zego-uikit-prebuilt';
import { AlertCircle, Loader2, ArrowLeft } from 'lucide-react';
import api from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
import { getApiErrorMessage } from '../../utils/apiErrorMessage';
import InterviewCountdown from '../../components/InterviewCountdown';
import { markInterviewJoined } from '../../services/applicationService';

function buildZegoUserId(user) {
    if (!user) return '';
    const rawId = String(user.id || user._id || '').trim();
    const roleRaw = String(user.role || '').trim() || 'user';
    const roleSuffix = roleRaw === 'job_seeker' ? 'jobseeker' : roleRaw;
    return rawId ? `${rawId}_${roleSuffix}` : '';
}

const InterviewCall = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const applicationIdForJoined = String(searchParams.get('applicationId') || '').trim();
    const { user, loading: authLoading } = useAuth();
    const [tokenData, setTokenData] = useState(null);
    const [tokenLoading, setTokenLoading] = useState(true);
    const [errorCode, setErrorCode] = useState(null);
    const [errorMessage, setErrorMessage] = useState('');
    const [joinAllowedFrom, setJoinAllowedFrom] = useState(null);
    const [joining, setJoining] = useState(false);
    const containerRef = useRef(null);
    const zpRef = useRef(null);

    const fetchToken = useCallback(async () => {
        setTokenLoading(true);
        setErrorCode(null);
        setErrorMessage('');
        setJoinAllowedFrom(null);
        setTokenData(null);

        try {
            const token = localStorage.getItem('token');
            if (!token) {
                setErrorCode('ERROR');
                setErrorMessage('You must be logged in to join the interview.');
                return;
            }

            const effectiveUser = user || JSON.parse(localStorage.getItem('user') || 'null');
            if (!effectiveUser) {
                setErrorCode('ERROR');
                setErrorMessage('Your session could not be loaded. Please sign in again.');
                return;
            }

            const userID = buildZegoUserId(effectiveUser);
            const roomID = String(id || '').trim();

            if (!userID || !roomID) {
                setErrorCode('ERROR');
                setErrorMessage(
                    'Missing interview or account information. Open the interview again from your schedule.'
                );
                return;
            }

            const { data } = await api.post('/zego/token', {
                roomID,
                userID,
                roomId: roomID,
                userId: userID
            });

            if (!data?.token || !data?.appId || !data?.roomId || !data?.userId) {
                setErrorCode('ERROR');
                setErrorMessage('Invalid response from the video service. Please try again.');
                return;
            }

            setTokenData(data);
        } catch (error) {
            const status = error.response?.status;
            const code = error.response?.data?.code;
            const message = error.response?.data?.message;
            const joinFrom = error.response?.data?.joinAllowedFrom;

            if (code === 'TOO_EARLY') {
                setErrorCode('TOO_EARLY');
                setJoinAllowedFrom(joinFrom || null);
            } else if (code === 'EXPIRED') {
                setErrorCode('ERROR');
                setErrorMessage('This interview session has expired.');
            } else if (status === 404) {
                setErrorCode('ERROR');
                setErrorMessage('Interview not found. Please check your link.');
            } else if (status === 401) {
                setErrorCode('ERROR');
                setErrorMessage('Session expired. Please log in again.');
            } else if (status === 500) {
                setErrorCode('ERROR');
                setErrorMessage('Server error. Please try again later.');
            } else {
                setErrorCode('ERROR');
                setErrorMessage(
                    message || getApiErrorMessage(error, 'Unable to join. Please try again.')
                );
            }
        } finally {
            setTokenLoading(false);
        }
    }, [id, user]);

    useEffect(() => {
        if (authLoading) return;
        fetchToken();
    }, [authLoading, fetchToken]);

    const handleCountdownReady = useCallback(() => {
        setErrorCode(null);
        setJoinAllowedFrom(null);
        fetchToken();
    }, [fetchToken]);

    useLayoutEffect(() => {
        if (!tokenData) return undefined;

        let cancelled = false;
        let rafOuter = 0;
        let rafInner = 0;
        let joinWatchdog = null;

        const destroyZp = () => {
            const zp = zpRef.current;
            if (zp) {
                try {
                    zp.destroy();
                } catch (e) {
                    console.error('[InterviewCall] Zego destroy failed:', e);
                }
                zpRef.current = null;
            }
        };

        const fail = (message, logCtx) => {
            if (cancelled) return;
            console.error('[InterviewCall] Zego init/join failed:', message, logCtx ?? '');
            setJoining(false);
            setErrorCode('ERROR');
            setErrorMessage(message);
            destroyZp();
        };

        const runJoin = () => {
            if (cancelled) return;
            if (zpRef.current) {
                console.error('[InterviewCall] Duplicate Zego init skipped (instance already exists)');
                return;
            }

            const container = containerRef.current;
            if (!container) {
                fail('Unable to start interview. Please try again.', 'containerRef.current is null');
                return;
            }

            const { appId, token, roomId, userId, userName } = tokenData;
            const interviewId = tokenData?.interviewId ? String(tokenData.interviewId).trim() : '';
            const roomID = String(roomId || '').trim();
            const userID = String(userId || '').trim();
            const name = String(userName != null ? userName : 'User').trim();

            if (!roomID || !userID || !name) {
                fail('Unable to start interview. Please try again.', {
                    roomID: Boolean(roomID),
                    userID: Boolean(userID),
                    userName: Boolean(name)
                });
                return;
            }

            const appIdNum = typeof appId === 'number' ? appId : parseInt(String(appId), 10);
            if (!Number.isFinite(appIdNum) || appIdNum <= 0) {
                fail('Unable to start interview. Please try again.', { appId });
                return;
            }

            if (!token || typeof token !== 'string' || !token.trim()) {
                fail('Unable to start interview. Please try again.', 'missing or empty token');
                return;
            }

            let kitToken;
            try {
                kitToken = ZegoUIKitPrebuilt.generateKitTokenForProduction(
                    appIdNum,
                    token.trim(),
                    roomID,
                    userID,
                    name
                );
            } catch (e) {
                console.error('[InterviewCall] generateKitTokenForProduction failed:', e);
                fail(getApiErrorMessage(e, 'Unable to start interview. Please try again.'));
                return;
            }

            if (!kitToken || typeof kitToken !== 'string' || !kitToken.trim()) {
                fail('Unable to start interview. Please try again.', 'invalid kit token from SDK');
                return;
            }

            setJoining(true);

            let zp;
            try {
                zp = ZegoUIKitPrebuilt.create(kitToken.trim());
            } catch (e) {
                console.error('[InterviewCall] ZegoUIKitPrebuilt.create failed:', e);
                fail(getApiErrorMessage(e, 'Unable to start interview. Please try again.'));
                return;
            }

            if (!zp) {
                fail('Unable to start interview. Please try again.', 'ZegoUIKitPrebuilt.create returned null');
                return;
            }

            zpRef.current = zp;

            joinWatchdog = window.setTimeout(() => {
                if (cancelled) return;
                console.error('[InterviewCall] Join watchdog: no success callback within 90s');
                fail(
                    'Unable to connect to the video room. Check your network and try again.',
                    'join watchdog timeout'
                );
            }, 90000);

            const clearWatchdog = () => {
                if (joinWatchdog != null) {
                    clearTimeout(joinWatchdog);
                    joinWatchdog = null;
                }
            };

            const postCallEvent = async (evt) => {
                if (!interviewId) return;
                try {
                    await api.post(`/interviews/${encodeURIComponent(interviewId)}/call-event`, {
                        event: evt
                    });
                } catch (e) {
                    console.warn('[InterviewCall] call-event failed:', e?.message || e);
                }
            };

            try {
                zp.joinRoom({
                    container,
                    scenario: { mode: ZegoUIKitPrebuilt.OneONoneCall },
                    showPreJoinView: false,
                    onLeaveRoom: () => {
                        postCallEvent('left').finally(() => navigate(-1));
                    },
                    // SDK 2.17.x only documents onJoinRoom (not onJoinRoomSuccess / onJoinRoomFailed).
                    onJoinRoom: () => {
                        if (cancelled) return;
                        clearWatchdog();
                        setJoining(false);
                        postCallEvent('joined');
                        const role = String(user?.role || '').trim();
                        if (role === 'job_seeker' && applicationIdForJoined) {
                            markInterviewJoined(applicationIdForJoined).catch((e) =>
                                console.warn('[InterviewCall] markInterviewJoined:', e?.message || e)
                            );
                        }
                    },
                    onYouRemovedFromRoom: () => {
                        if (cancelled) return;
                        clearWatchdog();
                        console.error('[InterviewCall] onYouRemovedFromRoom');
                        postCallEvent('left');
                        setErrorCode('ERROR');
                        setErrorMessage(
                            'You were removed from this interview. Please contact the host if this was unexpected.'
                        );
                        setJoining(false);
                        destroyZp();
                    }
                });
            } catch (err) {
                clearWatchdog();
                console.error('[InterviewCall] joinRoom threw:', err);
                fail(getApiErrorMessage(err, 'Unable to start interview. Please try again.'));
            }
        };

        rafOuter = requestAnimationFrame(() => {
            rafInner = requestAnimationFrame(runJoin);
        });

        return () => {
            cancelled = true;
            if (rafOuter) cancelAnimationFrame(rafOuter);
            if (rafInner) cancelAnimationFrame(rafInner);
            if (joinWatchdog != null) {
                clearTimeout(joinWatchdog);
                joinWatchdog = null;
            }
            setJoining(false);
            destroyZp();
        };
    }, [tokenData, navigate, user, applicationIdForJoined]);

    if (authLoading || (tokenLoading && !errorCode && !tokenData)) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-gray-50 px-4">
                <div className="flex flex-col items-center p-10 bg-white rounded-3xl shadow-xl border border-gray-100 max-w-sm w-full">
                    <div className="relative mb-8">
                        <div className="absolute inset-0 bg-[#2D9B82] opacity-20 rounded-full blur-xl"></div>
                        <Loader2 className="relative animate-spin text-[#2D9B82]" size={56} />
                    </div>
                    <h2 className="text-xl font-bold text-gray-800 mb-2">Preparing Interview</h2>
                    <p className="text-gray-500 text-center text-sm">
                        {authLoading ? 'Loading your account…' : 'Connecting to secure environment…'}
                    </p>
                </div>
            </div>
        );
    }

    if (errorCode === 'TOO_EARLY' && joinAllowedFrom) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-gray-50 px-4">
                <div className="max-w-md w-full bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
                    <InterviewCountdown
                        joinAllowedFrom={joinAllowedFrom}
                        onReady={handleCountdownReady}
                    />
                </div>
            </div>
        );
    }

    if (errorCode === 'ERROR') {
        return (
            <div className="flex items-center justify-center min-h-screen bg-gray-50 px-4">
                <div className="max-w-md w-full bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-100">
                    <div className="bg-red-50 p-6 flex flex-col items-center border-b border-red-100">
                        <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4 text-red-500 shadow-sm">
                            <AlertCircle size={32} />
                        </div>
                        <h2 className="text-2xl font-bold text-red-800 text-center">
                            Unable to start interview
                        </h2>
                    </div>
                    <div className="p-8 flex flex-col items-center bg-white error-card">
                        <p className="text-gray-600 text-center text-lg mb-8">{errorMessage}</p>
                        <button
                            type="button"
                            onClick={() => navigate(-1)}
                            className="flex items-center gap-2 px-8 py-3 bg-gray-900 text-white rounded-xl hover:bg-gray-800 transition-all shadow-md hover:shadow-lg font-medium w-full justify-center active:scale-[0.98]"
                        >
                            <ArrowLeft size={20} />
                            Return to Previous Page
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="relative w-full h-screen bg-gray-900">
            {joining && (
                <div className="absolute inset-0 z-10 flex items-center justify-center bg-black/40">
                    <div className="flex flex-col items-center gap-3 rounded-2xl bg-white/95 px-8 py-6 shadow-xl">
                        <Loader2 className="animate-spin text-[#29a08e]" size={36} />
                        <p className="text-sm font-semibold text-gray-800">Joining room…</p>
                    </div>
                </div>
            )}
            <div ref={containerRef} className="w-full h-full" />
        </div>
    );
};

export default InterviewCall;
