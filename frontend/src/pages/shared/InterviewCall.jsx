import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ZegoUIKitPrebuilt } from '@zegocloud/zego-uikit-prebuilt';
import { AlertCircle, Loader2, ArrowLeft } from 'lucide-react';
import api from '../../services/api';

const InterviewCall = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [tokenData, setTokenData] = useState(null);
    const [error, setError] = useState(null);
    const containerRef = useRef(null);
    const zpRef = useRef(null);

    useEffect(() => {
        const fetchToken = async () => {
            try {
                const token = localStorage.getItem('token') || (JSON.parse(localStorage.getItem('user') || '{}')?.token);
                if (!token) {
                    throw new Error('You must be logged in to join the interview.');
                }

                // Fetch token from backend (POST /api/zego/token)
                const { data } = await api.post('/zego/token', { roomID: id });

                if (!data?.token || !data?.appId || !data?.roomId || !data?.userId) {
                    throw new Error('Invalid token response from server.');
                }

                if (import.meta.env?.DEV) {
                    console.log('[InterviewCall] Token received – appId:', data.appId, 'roomId:', data.roomId, 'userId:', data.userId);
                }

                setTokenData(data);
            } catch (err) {
                console.error('[InterviewCall] Token fetch failed:', err);
                const msg = err.response?.data?.message || err.message || 'Failed to connect to interview service';
                setError(msg);
            }
        };

        fetchToken();
    }, [id]);

    useEffect(() => {
        if (!tokenData || !containerRef.current || zpRef.current) return;

        const { appId, token, roomId, userId, userName } = tokenData;
        const appIdNum = typeof appId === 'number' ? appId : parseInt(appId, 10);

        if (import.meta.env?.DEV) {
            console.log('[InterviewCall] Joining room – appId:', appIdNum, 'roomId:', roomId, 'userId:', userId);
        }

        try {
            const kitToken = ZegoUIKitPrebuilt.generateKitTokenForProduction(
                appIdNum,
                token,
                roomId,
                userId,
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
                    if (import.meta.env?.DEV) console.log('[InterviewCall] Successfully joined room');
                },
                onJoinRoomFailed: (err) => {
                    console.error('[InterviewCall] Zego login/join failed:', err);
                    setError(err?.message || 'Video call connection failed (code 20021). Please try again.');
                    zpRef.current?.destroy();
                    zpRef.current = null;
                }
            });
        } catch (err) {
            console.error('[InterviewCall] Zego init error:', err);
            setError(err?.message || 'Failed to initialize video call. Please try again.');
        }

        return () => {
            if (zpRef.current) {
                zpRef.current.destroy();
                zpRef.current = null;
            }
        };
    }, [tokenData, navigate]);

    if (error) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-gray-50 px-4">
                <div className="max-w-md w-full bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-100">
                    <div className="bg-red-50 p-6 flex flex-col items-center border-b border-red-100">
                        <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4 text-red-500 shadow-sm animate-pulse">
                            <AlertCircle size={32} />
                        </div>
                        <h2 className="text-2xl font-bold text-red-800 text-center">Connection Failed</h2>
                    </div>
                    <div className="p-8 flex flex-col items-center bg-white">
                        <p className="text-gray-600 text-center text-lg mb-8">{error}</p>
                        <button
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

    if (!tokenData) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-gray-50 px-4">
                <div className="flex flex-col items-center p-10 bg-white rounded-3xl shadow-xl border border-gray-100 max-w-sm w-full">
                    <div className="relative mb-8">
                        <div className="absolute inset-0 bg-[#2D9B82] opacity-20 rounded-full blur-xl"></div>
                        <Loader2 className="relative animate-spin text-[#2D9B82]" size={56} />
                    </div>
                    <h2 className="text-xl font-bold text-gray-800 mb-2">Preparing Interview</h2>
                    <p className="text-gray-500 text-center text-sm">Connecting to secure environment...</p>
                </div>
            </div>
        );
    }

    return (
        <div
            ref={containerRef}
            className="w-full h-screen bg-gray-900"
        />
    );
};

export default InterviewCall;
