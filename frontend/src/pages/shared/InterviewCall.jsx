import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ZegoUIKitPrebuilt } from '@zegocloud/zego-uikit-prebuilt';
import { AlertCircle, Loader2, ArrowLeft } from 'lucide-react';
import api from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
import { getApiErrorMessage } from '../../utils/apiErrorMessage';

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
    const { user, loading: authLoading } = useAuth();
    const [tokenData, setTokenData] = useState(null);
    const [error, setError] = useState(null);
    const [joining, setJoining] = useState(false);
    const containerRef = useRef(null);
    const zpRef = useRef(null);

    useEffect(() => {
        if (authLoading) return;

        const fetchToken = async () => {
            try {
                const token = localStorage.getItem('token');
                if (!token) {
                    throw new Error('You must be logged in to join the interview.');
                }

                const effectiveUser = user || JSON.parse(localStorage.getItem('user') || 'null');
                if (!effectiveUser) {
                    throw new Error('Your session could not be loaded. Please sign in again.');
                }

                const userID = buildZegoUserId(effectiveUser);
                const roomID = String(id || '').trim();

                console.log('userID:', userID);
                console.log('roomID:', roomID);

                if (!userID || !roomID) {
                    throw new Error('Missing interview or account information. Open the interview again from your schedule.');
                }

                const { data } = await api.post('/zego/token', {
                    roomID,
                    userID,
                    roomId: roomID,
                    userId: userID
                });

                if (!data?.token || !data?.appId || !data?.roomId || !data?.userId) {
                    throw new Error('Invalid response from the video service. Please try again.');
                }

                setTokenData(data);
            } catch (err) {
                console.error('[InterviewCall] Token fetch failed:', err);
                const msg = getApiErrorMessage(err, 'Unable to start interview. Please try again.');
                setError(msg);
            }
        };

        fetchToken();
    }, [id, user, authLoading]);

    useEffect(() => {
        if (!tokenData || !containerRef.current || zpRef.current) return;

        const { appId, token, roomId, userId, userName } = tokenData;
        const appIdNum = typeof appId === 'number' ? appId : parseInt(appId, 10);
        const roomIdString = String(roomId || '').trim();
        const userIdString = String(userId || '').trim();

        if (!Number.isFinite(appIdNum) || !roomIdString || !userIdString) {
            setError('Unable to start interview. Please try again.');
            return;
        }

        setJoining(true);

        try {
            const kitToken = ZegoUIKitPrebuilt.generateKitTokenForProduction(
                appIdNum,
                token,
                roomIdString,
                userIdString,
                userName || 'User'
            );

            const zp = ZegoUIKitPrebuilt.create(kitToken);
            zpRef.current = zp;

            zp.joinRoom({
                container: containerRef.current,
                scenario: { mode: ZegoUIKitPrebuilt.OneONoneCall },
                showPreJoinView: false,
                onLeaveRoom: () => navigate(-1),
                onJoinRoomSuccess: () => {
                    setJoining(false);
                },
                onJoinRoomFailed: (err) => {
                    console.error('[InterviewCall] Zego login/join failed:', err);
                    const detail = err?.message ? ` ${err.message}` : '';
                    setError(
                        `Unable to start interview.${detail} Please try again, or return and re-open the meeting link.`
                    );
                    setJoining(false);
                    zpRef.current?.destroy();
                    zpRef.current = null;
                }
            });
        } catch (err) {
            console.error('[InterviewCall] Zego init error:', err);
            setError(getApiErrorMessage(err, 'Unable to start interview. Please try again.'));
            setJoining(false);
        }

        return () => {
            if (zpRef.current) {
                zpRef.current.destroy();
                zpRef.current = null;
            }
        };
    }, [tokenData, navigate]);

    if (authLoading || (!error && !tokenData)) {
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

    if (error) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-gray-50 px-4">
                <div className="max-w-md w-full bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-100">
                    <div className="bg-red-50 p-6 flex flex-col items-center border-b border-red-100">
                        <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4 text-red-500 shadow-sm animate-pulse">
                            <AlertCircle size={32} />
                        </div>
                        <h2 className="text-2xl font-bold text-red-800 text-center">
                            Unable to start interview
                        </h2>
                    </div>
                    <div className="p-8 flex flex-col items-center bg-white">
                        <p className="text-gray-600 text-center text-lg mb-8">{error}</p>
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
