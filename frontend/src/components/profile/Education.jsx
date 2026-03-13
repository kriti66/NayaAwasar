import React from 'react';
import { Plus, X, GraduationCap, Calendar } from 'lucide-react';

const Education = ({ isEditing, profile, formData, onItemsChange }) => {
    const handleAdd = () => {
        const newItems = [{ degree: '', institution: '', year: '' }, ...(formData.education || [])];
        onItemsChange('education', newItems);
    };

    const handleRemove = (idx) => {
        const newItems = formData.education.filter((_, i) => i !== idx);
        onItemsChange('education', newItems);
    };

    const updateItem = (idx, field, value) => {
        const newItems = [...formData.education];
        newItems[idx] = { ...newItems[idx], [field]: value };
        onItemsChange('education', newItems);
    };

    if (isEditing) {
        return (
            <div className="space-y-6">
                <button
                    onClick={handleAdd}
                    className="w-full py-4 border-2 border-dashed border-gray-100 rounded-[24px] text-gray-400 hover:border-[#29a08e]/30 hover:text-[#29a08e] hover:bg-[#F0FDF4]/50 transition-all font-bold text-xs uppercase tracking-widest flex items-center justify-center gap-2"
                >
                    <Plus size={16} />
                    Add Education
                </button>

                {(formData.education || []).map((edu, idx) => (
                    <div key={idx} className="p-8 bg-gray-50 rounded-[32px] space-y-6 relative border border-gray-100/50 group transition-all hover:bg-white hover:shadow-xl hover:shadow-gray-100/50">
                        <button
                            onClick={() => handleRemove(idx)}
                            className="absolute top-6 right-6 w-8 h-8 rounded-xl bg-white border border-gray-100 text-gray-300 hover:text-red-500 flex items-center justify-center transition-all shadow-sm opacity-0 group-hover:opacity-100"
                        >
                            <X size={16} />
                        </button>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="md:col-span-2 space-y-2">
                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] pl-1">Degree / Course</label>
                                <input
                                    type="text"
                                    placeholder="e.g. B.Tech in Computer Science"
                                    value={edu.degree}
                                    onChange={(e) => updateItem(idx, 'degree', e.target.value)}
                                    className="w-full px-5 py-3.5 bg-white border border-gray-200 rounded-2xl outline-none focus:ring-4 focus:ring-[#29a08e]/10 focus:border-[#29a08e] text-sm font-bold text-gray-800 transition-all"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] pl-1">Institution</label>
                                <input
                                    type="text"
                                    placeholder="e.g. Kathmandu University"
                                    value={edu.institution}
                                    onChange={(e) => updateItem(idx, 'institution', e.target.value)}
                                    className="w-full px-5 py-3.5 bg-white border border-gray-200 rounded-2xl outline-none focus:ring-4 focus:ring-[#29a08e]/10 focus:border-[#29a08e] text-sm font-bold text-gray-800 transition-all"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] pl-1">Year</label>
                                <input
                                    type="text"
                                    placeholder="e.g. 2018 - 2022"
                                    value={edu.year}
                                    onChange={(e) => updateItem(idx, 'year', e.target.value)}
                                    className="w-full px-5 py-3.5 bg-white border border-gray-200 rounded-2xl outline-none focus:ring-4 focus:ring-[#29a08e]/10 focus:border-[#29a08e] text-sm font-bold text-gray-800 transition-all"
                                />
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        );
    }

    return (
        <div className="space-y-8">
            {profile.education?.length > 0 ? profile.education.map((edu, idx) => (
                <div key={idx} className="flex gap-6 group">
                    <div className="w-12 h-12 rounded-2xl bg-gray-50 text-gray-400 group-hover:text-[#29a08e] group-hover:border-[#29a08e]/20 border border-gray-100 flex items-center justify-center shrink-0 transition-all shadow-sm">
                        <GraduationCap size={22} />
                    </div>
                    <div>
                        <h4 className="text-lg font-bold text-gray-900 group-hover:text-[#29a08e] transition-colors">{edu.degree}</h4>
                        <p className="text-sm font-semibold text-gray-500 mb-2">{edu.institution}</p>
                        <div className="flex items-center gap-2 text-gray-400">
                            <Calendar size={12} />
                            <span className="text-[10px] font-black uppercase tracking-wider">{edu.year}</span>
                        </div>
                    </div>
                </div>
            )) : (
                <div className="text-center py-10 bg-gray-50 rounded-[32px] border border-dashed border-gray-200">
                    <p className="text-sm text-gray-400 font-bold uppercase tracking-widest">Education Details Missing</p>
                </div>
            )}
        </div>
    );
};

export default Education;
