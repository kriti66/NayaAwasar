import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ZegoUIKitPrebuilt } from '@zegocloud/zego-uikit-prebuilt';

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
                // Determine token key based on user role or generic token
                // Trying common keys: 'token', 'user' (might be object), etc.
                // Assuming bearer token is stored in localStorage as 'token'
                const authToken = localStorage.getItem('token');

                if (!authToken) {
                    throw new Error('You must be logged in to join the interview.');
                }

                // API call to backend
                // Adjust base URL if needed, assuming relative path works with proxy
                // or use import.meta.env.VITE_API_URL if defined
                const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5001';
                const response = await fetch(`${apiUrl}/api/interviews/${id}/zego-token`, {
                    headers: {
                        'Authorization': `Bearer ${authToken}`,
                        'Content-Type': 'application/json'
                    }
                });

                if (!response.ok) {
                    const data = await response.json();
                    throw new Error(data.message || 'Failed to join interview');
                }

                const data = await response.json();
                setTokenData(data);
            } catch (err) {
                console.error("Failed to load interview token:", err);
                setError(err.message);
            }
        };

        fetchToken();
    }, [id]);

    useEffect(() => {
        if (tokenData && containerRef.current && !zpRef.current) {
            const { appId, token, roomId, userId, userName } = tokenData;

            // Generate Kit Token using the server-generated token
            const kitToken = ZegoUIKitPrebuilt.generateKitTokenForProduction(
                appId,
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
            <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 text-red-600">
                <h2 className="text-2xl font-bold mb-4">Unable to Join Interview</h2>
                <p className="mb-6">{error}</p>
                <button
                    onClick={() => navigate(-1)}
                    className="px-4 py-2 bg-gray-800 text-white rounded hover:bg-gray-700 transition"
                >
                    Go Back
                </button>
            </div>
        );
    }

    if (!tokenData) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-gray-50">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
                <span className="ml-4 text-gray-600">Connecting to secure interview room...</span>
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
