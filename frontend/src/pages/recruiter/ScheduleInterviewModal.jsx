import React, { useState } from 'react';
import { X, Calendar, Clock, MapPin, Link as LinkIcon, FileText, Video } from 'lucide-react';

const ScheduleInterviewModal = ({ isOpen, onClose, onSubmit, isSubmitting, initialData }) => {
    const [formData, setFormData] = useState({
        date: '',
        time: '',
        mode: 'Online',
        location: '',
        notes: ''
    });

    React.useEffect(() => {
        if (isOpen) {
            setFormData({
                date: initialData?.date ? new Date(initialData.date).toISOString().split('T')[0] : '',
                time: initialData?.time || '',
                mode: initialData?.mode || 'Online',
                location: initialData?.location || '',
                notes: initialData?.notes || ''
            });
        }
    }, [isOpen, initialData]);

    if (!isOpen) return null;

    const handleSubmit = (e) => {
        e.preventDefault();
        onSubmit(formData);
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden scale-100 animate-in zoom-in-95 duration-200 border border-gray-100">
                {/* Header with gradient */}
                <div className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-[#0d2f2b] to-slate-900 px-6 py-6">
                    <div className="absolute inset-0 opacity-10">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-[#29a08e] rounded-full blur-3xl"></div>
                    </div>
                    <div className="absolute inset-0" style={{ backgroundImage: 'radial-gradient(rgba(255,255,255,0.04) 1px, transparent 1px)', backgroundSize: '20px 20px' }}></div>
                    <div className="relative z-10 flex justify-between items-start">
                        <div>
                            <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/10 border border-white/20 rounded-full text-[10px] font-black text-gray-200 backdrop-blur-sm uppercase tracking-widest mb-3">
                                <Video size={12} />
                                Interview Setup
                            </div>
                            <h3 className="text-xl font-black text-white tracking-tight">Schedule Interview</h3>
                            <p className="text-xs text-gray-300 font-medium mt-1">Set up the details for the candidate</p>
                        </div>
                        <button onClick={onClose} className="p-2 text-gray-400 hover:text-white hover:bg-white/10 rounded-xl transition-colors">
                            <X size={20} />
                        </button>
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-5">
                    <div className="grid grid-cols-2 gap-5">
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-1.5">
                                <Calendar size={12} className="text-[#29a08e]" /> Date
                            </label>
                            <input
                                type="date"
                                required
                                min={new Date().toISOString().split('T')[0]}
                                value={formData.date}
                                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                                className="w-full px-4 py-3 bg-gray-50/50 border border-gray-200 rounded-xl text-sm font-bold focus:outline-none focus:ring-2 focus:ring-[#29a08e]/20 focus:border-[#29a08e] transition-all hover:bg-white"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-1.5">
                                <Clock size={12} className="text-[#29a08e]" /> Time
                            </label>
                            <input
                                type="time"
                                required
                                value={formData.time}
                                onChange={(e) => setFormData({ ...formData, time: e.target.value })}
                                className="w-full px-4 py-3 bg-gray-50/50 border border-gray-200 rounded-xl text-sm font-bold focus:outline-none focus:ring-2 focus:ring-[#29a08e]/20 focus:border-[#29a08e] transition-all hover:bg-white"
                            />
                        </div>
                    </div>

                    <div className="space-y-3">
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Interview Mode</label>
                        <div className="flex gap-4">
                            {['Online', 'Onsite'].map((mode) => (
                                <label key={mode} className="flex-1 cursor-pointer">
                                    <input
                                        type="radio"
                                        name="mode"
                                        value={mode}
                                        checked={formData.mode === mode}
                                        onChange={(e) => setFormData({ ...formData, mode: e.target.value })}
                                        className="sr-only peer"
                                    />
                                    <div className="flex items-center justify-center gap-2.5 py-3.5 px-4 rounded-xl border-2 border-gray-100 text-gray-500 font-bold text-sm transition-all peer-checked:border-[#29a08e] peer-checked:bg-[#29a08e]/10 peer-checked:text-[#29a08e] hover:bg-gray-50 peer-checked:shadow-lg peer-checked:shadow-[#29a08e]/5">
                                        {mode === 'Online' ? <LinkIcon size={16} /> : <MapPin size={16} />}
                                        {mode}
                                    </div>
                                </label>
                            ))}
                        </div>
                    </div>

                    {formData.mode === 'Online' ? (
                        <div className="p-4 bg-gradient-to-r from-[#29a08e]/5 to-teal-50 border border-[#29a08e]/10 rounded-2xl flex items-start gap-3">
                            <div className="p-2.5 bg-[#29a08e]/10 rounded-xl text-[#29a08e] shrink-0">
                                <Video size={18} />
                            </div>
                            <div>
                                <h4 className="text-sm font-black text-gray-900 tracking-tight">In-App Video Call</h4>
                                <p className="text-xs text-gray-500 mt-1 leading-relaxed font-medium">
                                    A secure video call room ID will be automatically generated. Both parties can join from the dashboard.
                                </p>
                            </div>
                        </div>
                    ) : (
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-1.5">
                                <MapPin size={12} className="text-[#29a08e]" /> Office Address / Location
                            </label>
                            <input
                                type="text"
                                required
                                placeholder="e.g. Building 4, Conference Room A"
                                value={formData.location}
                                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                                className="w-full px-4 py-3 bg-gray-50/50 border border-gray-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[#29a08e]/20 focus:border-[#29a08e] transition-all placeholder:text-gray-300 hover:bg-white"
                            />
                        </div>
                    )}

                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-1.5">
                            <FileText size={12} className="text-[#29a08e]" /> Notes for Candidate (Optional)
                        </label>
                        <textarea
                            rows="2"
                            placeholder="e.g. Please bring your portfolio..."
                            value={formData.notes}
                            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                            className="w-full px-4 py-3 bg-gray-50/50 border border-gray-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[#29a08e]/20 focus:border-[#29a08e] transition-all placeholder:text-gray-300 hover:bg-white"
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
                                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                    Scheduling...
                                </>
                            ) : (
                                'Confirm & Schedule'
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default ScheduleInterviewModal;
