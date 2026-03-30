import { useState, useEffect, useRef } from 'react';

export default function InterviewCountdown({ joinAllowedFrom, onReady }) {
    const [secondsLeft, setSecondsLeft] = useState(0);
    const firedRef = useRef(false);

    useEffect(() => {
        firedRef.current = false;
    }, [joinAllowedFrom]);

    useEffect(() => {
        const tick = () => {
            const target = new Date(joinAllowedFrom).getTime();
            const diff = Math.max(0, Math.floor((target - Date.now()) / 1000));
            setSecondsLeft(diff);
            if (diff === 0 && !firedRef.current) {
                firedRef.current = true;
                onReady();
            }
        };
        tick();
        const interval = setInterval(tick, 1000);
        return () => clearInterval(interval);
    }, [joinAllowedFrom, onReady]);

    const mm = String(Math.floor(secondsLeft / 60)).padStart(2, '0');
    const ss = String(secondsLeft % 60).padStart(2, '0');

    return (
        <div style={{ textAlign: 'center', padding: '2rem' }}>
            <h2>Interview not started yet</h2>
            <p>You can join in:</p>
            <div style={{ fontSize: '3rem', fontWeight: 'bold', color: '#0f6e56' }}>
                {mm}:{ss}
            </div>
            <p style={{ color: '#888', marginTop: '1rem' }}>
                Join button activates automatically when ready
            </p>
            <button
                type="button"
                disabled
                style={{ opacity: 0.5, marginTop: '1rem', padding: '0.75rem 2rem', borderRadius: '8px' }}
            >
                Waiting...
            </button>
        </div>
    );
}
