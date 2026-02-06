import React, { useState } from 'react';
import { X, Calendar, Clock, MapPin, Link as LinkIcon, FileText } from 'lucide-react';

const ScheduleInterviewModal = ({ isOpen, onClose, onSubmit, isSubmitting }) => {
    const [formData, setFormData] = useState({
        date: '',
        time: '',
        mode: 'Online',
        location: '',
        meetLink: '',
        notes: ''
    });

    if (!isOpen) return null;

    const handleSubmit = (e) => {
        e.preventDefault();
        onSubmit(formData);
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/50 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden scale-100 animate-in zoom-in-95 duration-200">
                <div className="flex justify-between items-center p-6 border-b border-gray-100">
                    <div>
                        <h3 className="text-lg font-bold text-gray-900">Schedule Interview</h3>
                        <p className="text-xs text-gray-500 font-medium mt-1">Set up the details for the candidate</p>
                    </div>
                    <button onClick={onClose} className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-50 rounded-lg transition-colors">
                        <X size={20} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-5">
                    <div className="grid grid-cols-2 gap-5">
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-gray-500 uppercase tracking-wider flex items-center gap-1.5">
                                <Calendar size={12} /> Date
                            </label>
                            <input
                                type="date"
                                required
                                min={new Date().toISOString().split('T')[0]}
                                value={formData.date}
                                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm font-bold focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-gray-500 uppercase tracking-wider flex items-center gap-1.5">
                                <Clock size={12} /> Time
                            </label>
                            <input
                                type="time"
                                required
                                value={formData.time}
                                onChange={(e) => setFormData({ ...formData, time: e.target.value })}
                                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm font-bold focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                            />
                        </div>
                    </div>

                    <div className="space-y-3">
                        <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Interview Mode</label>
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
                                    <div className="flex items-center justify-center gap-2 py-3 px-4 rounded-xl border-2 border-gray-100 text-gray-500 font-bold text-sm transition-all peer-checked:border-blue-500 peer-checked:bg-blue-50 peer-checked:text-blue-600 hover:bg-gray-50">
                                        {mode === 'Online' ? <LinkIcon size={16} /> : <MapPin size={16} />}
                                        {mode}
                                    </div>
                                </label>
                            ))}
                        </div>
                    </div>

                    {formData.mode === 'Online' ? (
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-gray-500 uppercase tracking-wider flex items-center gap-1.5">
                                <LinkIcon size={12} /> Meeting Link (Google Meet / Zoom)
                            </label>
                            <input
                                type="url"
                                required
                                placeholder="https://meet.google.com/..."
                                value={formData.meetLink}
                                onChange={(e) => setFormData({ ...formData, meetLink: e.target.value })}
                                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all placeholder:text-gray-300"
                            />
                        </div>
                    ) : (
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-gray-500 uppercase tracking-wider flex items-center gap-1.5">
                                <MapPin size={12} /> Office Address / Location
                            </label>
                            <input
                                type="text"
                                required
                                placeholder="e.g. Building 4, Conference Room A"
                                value={formData.location}
                                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all placeholder:text-gray-300"
                            />
                        </div>
                    )}

                    <div className="space-y-2">
                        <label className="text-xs font-bold text-gray-500 uppercase tracking-wider flex items-center gap-1.5">
                            <FileText size={12} /> Notes for Candidate (Optional)
                        </label>
                        <textarea
                            rows="2"
                            placeholder="e.g. Please bring your portfolio..."
                            value={formData.notes}
                            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                            className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all placeholder:text-gray-300"
                        />
                    </div>

                    <div className="pt-4 flex justify-end gap-3">
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
                            className="px-6 py-3 bg-blue-600 text-white rounded-xl text-xs font-bold uppercase tracking-wider hover:bg-blue-700 transition-colors shadow-lg shadow-blue-500/20 disabled:opacity-70 disabled:cursor-not-allowed flex items-center gap-2"
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
