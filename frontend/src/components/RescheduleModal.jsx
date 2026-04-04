import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../services/api';
import { getApiErrorMessage } from '../utils/apiErrorMessage';

/**
 * @param {'request'|'counter'} mode — POST .../request vs .../counter
 */
export default function RescheduleModal({ open, mode = 'request', interviewId, onClose, onSuccess }) {
    const [newDate, setNewDate] = useState('');
    const [newTime, setNewTime] = useState('');
    const [note, setNote] = useState('');
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        if (!open) {
            setNewDate('');
            setNewTime('');
            setNote('');
            setSubmitting(false);
        }
    }, [open]);

    if (!open) return null;

    const isCounter = mode === 'counter';
    const title = isCounter ? 'Propose another time' : 'Request reschedule';

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!newDate || !newTime) {
            toast.error('Please choose a new date and time');
            return;
        }
        setSubmitting(true);
        try {
            const path = isCounter ? 'counter' : 'request';
            await api.post(`/interviews/reschedule/${interviewId}/${path}`, {
                new_date: newDate,
                new_time: newTime,
                note: note.trim()
            });
            toast.success(isCounter ? 'Counter proposal sent' : 'Reschedule request sent');
            onSuccess?.();
            onClose();
        } catch (err) {
            toast.error(getApiErrorMessage(err, 'Could not submit reschedule'));
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-0 sm:p-4">
            <button
                type="button"
                className="absolute inset-0 bg-slate-900/50"
                aria-label="Close modal"
                onClick={onClose}
            />
            <div
                className="relative w-full sm:max-w-md bg-white rounded-t-2xl sm:rounded-2xl shadow-xl border border-slate-200 max-h-[90vh] overflow-y-auto"
                role="dialog"
                aria-modal="true"
            >
                <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100">
                    <h3 className="text-lg font-semibold text-slate-900">{title}</h3>
                    <button
                        type="button"
                        onClick={onClose}
                        className="p-2 rounded-lg text-slate-500 hover:bg-slate-100"
                        aria-label="Close"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>
                <form onSubmit={handleSubmit} className="p-4 space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">New date</label>
                        <input
                            type="date"
                            value={newDate}
                            onChange={(e) => setNewDate(e.target.value)}
                            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-900 focus:ring-2 focus:ring-[#29a08e] focus:border-[#29a08e]"
                            required
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">New time</label>
                        <input
                            type="time"
                            value={newTime}
                            onChange={(e) => setNewTime(e.target.value)}
                            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-900 focus:ring-2 focus:ring-[#29a08e] focus:border-[#29a08e]"
                            required
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">
                            Note <span className="text-slate-400 font-normal">(optional)</span>
                        </label>
                        <textarea
                            value={note}
                            onChange={(e) => setNote(e.target.value)}
                            rows={3}
                            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-900 focus:ring-2 focus:ring-[#29a08e] focus:border-[#29a08e]"
                            placeholder="Optional message for the other party"
                        />
                    </div>
                    <div className="flex flex-col-reverse sm:flex-row gap-2 sm:justify-end pt-2">
                        <button
                            type="button"
                            onClick={onClose}
                            className="w-full sm:w-auto px-4 py-2.5 rounded-lg border border-slate-300 text-slate-700 font-medium hover:bg-slate-50"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={submitting}
                            className="w-full sm:w-auto px-4 py-2.5 rounded-lg bg-[#29a08e] text-white font-semibold hover:bg-[#238276] disabled:opacity-60"
                        >
                            {submitting ? 'Submitting…' : isCounter ? 'Send proposal' : 'Submit reschedule'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
