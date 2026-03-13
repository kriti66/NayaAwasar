import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ZegoUIKitPrebuilt } from '@zegocloud/zego-uikit-prebuilt';
import { AlertCircle, Loader2, ArrowLeft } from 'lucide-react';

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
                // Get token from localStorage - check multiple potential keys
                const token = localStorage.getItem('token') ||
                    (JSON.parse(localStorage.getItem('user') || '{}')?.token);

                if (!token) {
                    throw new Error('You must be logged in to join the interview.');
                }

                // API call to backend - MUST BE POST because backend route is router.post(...)
                const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5001';
                const response = await fetch(`${apiUrl}/api/interviews/${id}/zego-token`, {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    }
                });

                const responseText = await response.text();
                let data;
                try {
                    data = JSON.parse(responseText);
                } catch (e) {
                    console.error("Failed to parse backend response:", responseText);
                    throw new Error('Invalid server response. Please try again.');
                }

                if (!response.ok) {
                    throw new Error(data.message || 'Failed to join interview');
                }

                // If ZegoUIkit expects { appId, token, ... } at root, ensure data structure is correct.
                // Our controller returns { appId, token, roomId, userId, userName } directly.
                setTokenData(data);
            } catch (err) {
                console.error("Failed to load interview token:", err);
                setError(err.message || 'Failed to connect to interview service');
            }
        };

        fetchToken();
    }, [id]);

    useEffect(() => {
        if (tokenData && containerRef.current && !zpRef.current) {
            const { appId, token, roomId, userId, userName } = tokenData;

            console.log("[InterviewCall] Generating Kit Token with params:", {
                appId: parseInt(appId),
                roomId,
                userId,
                userName,
                tokenLength: token ? token.length : 0
            });

            // Generate Kit Token using the server-generated token
            // Note: appId must be a number
            const kitToken = ZegoUIKitPrebuilt.generateKitTokenForProduction(
                parseInt(appId),
                token,
                roomId,
                userId,
                userName
            );

            // Create instance
            const zp = ZegoUIKitPrebuilt.create(kitToken);
            zpRef.current = zp;

            // Join room
            zp.joinRoom({
                container: containerRef.current,
                scenario: {
                    mode: ZegoUIKitPrebuilt.OneONoneCall,
                },
                showPreJoinView: false, // Jump straight to call? Or true used better? User didn't specify. False is smoother.
                onLeaveRoom: () => {
                    navigate(-1); // Go back on leave
                },
                onUserLeave: () => {
                    // Optional handling
                }
            });
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
