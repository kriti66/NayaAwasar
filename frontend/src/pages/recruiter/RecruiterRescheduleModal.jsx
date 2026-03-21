import React, { useEffect, useState } from 'react';
import { X, Calendar, Clock, AlertCircle, MessageSquare } from 'lucide-react';

const RecruiterRescheduleModal = ({ isOpen, onClose, onSubmit, isSubmitting, initialData }) => {
    const [formData, setFormData] = useState({
        proposedDate: '',
        proposedTime: '',
        reason: ''
    });

    useEffect(() => {
        if (!isOpen) return;

        const proposedDateValue = initialData?.proposedDate
            ? (typeof initialData.proposedDate === 'string'
                ? initialData.proposedDate
                : new Date(initialData.proposedDate).toISOString().split('T')[0])
            : '';

        setFormData({
            proposedDate: proposedDateValue,
            proposedTime: initialData?.proposedTime || '',
            reason: initialData?.reason || ''
        });
    }, [isOpen, initialData]);

    if (!isOpen) return null;

    const handleSubmit = (e) => {
        e.preventDefault();
        onSubmit(formData);
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden scale-100 animate-in zoom-in-95 duration-200 border border-gray-100">
                <div className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-[#0d2f2b] to-slate-900 px-6 py-6">
                    <div className="absolute inset-0 opacity-10">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-[#29a08e] rounded-full blur-3xl" />
                    </div>
                    <div className="absolute inset-0" style={{ backgroundImage: 'radial-gradient(rgba(255,255,255,0.04) 1px, transparent 1px)', backgroundSize: '20px 20px' }} />

                    <div className="relative z-10 flex justify-between items-start">
                        <div>
                            <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/10 border border-white/20 rounded-full text-[10px] font-black text-gray-200 backdrop-blur-sm uppercase tracking-widest mb-3">
                                <AlertCircle size={12} />
                                Reschedule Interview
                            </div>
                            <h3 className="text-xl font-black text-white tracking-tight">Send Reschedule Proposal</h3>
                            <p className="text-xs text-gray-300 font-medium mt-1">Candidate will accept or reject your proposal.</p>
                        </div>

                        <button onClick={onClose} type="button" className="p-2 text-gray-400 hover:text-white hover:bg-white/10 rounded-xl transition-colors">
                            <X size={20} />
                        </button>
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-5">
                    <div className="grid grid-cols-2 gap-5">
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-1.5">
                                <Calendar size={12} className="text-[#29a08e]" />
                                New Date
                            </label>
                            <input
                                type="date"
                                required
                                min={new Date().toISOString().split('T')[0]}
                                value={formData.proposedDate}
                                onChange={(e) => setFormData({ ...formData, proposedDate: e.target.value })}
                                className="w-full px-4 py-3 bg-gray-50/50 border border-gray-200 rounded-xl text-sm font-bold focus:outline-none focus:ring-2 focus:ring-[#29a08e]/20 focus:border-[#29a08e] transition-all hover:bg-white"
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-1.5">
                                <Clock size={12} className="text-[#29a08e]" />
                                New Time
                            </label>
                            <input
                                type="time"
                                required
                                value={formData.proposedTime}
                                onChange={(e) => setFormData({ ...formData, proposedTime: e.target.value })}
                                className="w-full px-4 py-3 bg-gray-50/50 border border-gray-200 rounded-xl text-sm font-bold focus:outline-none focus:ring-2 focus:ring-[#29a08e]/20 focus:border-[#29a08e] transition-all hover:bg-white"
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-1.5">
                            <MessageSquare size={12} className="text-[#29a08e]" />
                            Reason for Reschedule *
                        </label>
                        <textarea
                            required
                            rows={4}
                            placeholder="Explain why you are requesting this reschedule..."
                            value={formData.reason}
                            onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                            className="w-full px-4 py-3 bg-gray-50/50 border border-gray-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[#29a08e]/20 focus:border-[#29a08e] transition-all placeholder:text-gray-300 hover:bg-white resize-none"
                        />
                    </div>

                    <div className="pt-4 flex justify-end gap-3 border-t border-gray-100">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-6 py-3 bg-white border border-gray-200 rounded-xl text-xs font-bold text-gray-600 uppercase tracking-wider hover:bg-gray-50 transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className="px-6 py-3 bg-[#29a08e] text-white rounded-xl text-xs font-bold uppercase tracking-wider hover:bg-[#228377] transition-all shadow-lg shadow-[#29a08e]/20 disabled:opacity-70 disabled:cursor-not-allowed flex items-center gap-2 active:scale-95"
                        >
                            {isSubmitting ? (
                                <>
                                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                    Sending...
                                </>
                            ) : (
                                'Send Proposal'
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default RecruiterRescheduleModal;

