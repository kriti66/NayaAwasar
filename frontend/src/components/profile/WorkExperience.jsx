import React from 'react';
import { Plus, X, Briefcase, Calendar, ChevronDown, ChevronUp } from 'lucide-react';

const WorkExperience = ({ isEditing, profile, formData, onItemsChange }) => {
    const handleAdd = () => {
        const newItems = [{ title: '', company: '', duration: '', description: '' }, ...(formData.workExperience || [])];
        onItemsChange('workExperience', newItems);
    };

    const handleRemove = (idx) => {
        const newItems = formData.workExperience.filter((_, i) => i !== idx);
        onItemsChange('workExperience', newItems);
    };

    const updateItem = (idx, field, value) => {
        const newItems = [...formData.workExperience];
        newItems[idx] = { ...newItems[idx], [field]: value };
        onItemsChange('workExperience', newItems);
    };

    if (isEditing) {
        return (
            <div className="space-y-6">
                <button
                    onClick={handleAdd}
                    className="w-full py-4 border-2 border-dashed border-gray-100 rounded-[24px] text-gray-400 hover:border-[#29a08e]/30 hover:text-[#29a08e] hover:bg-[#F0FDF4]/50 transition-all font-bold text-xs uppercase tracking-widest flex items-center justify-center gap-2"
                >
                    <Plus size={16} />
                    Add Work Experience
                </button>

                {(formData.workExperience || []).map((exp, idx) => (
                    <div key={idx} className="p-8 bg-gray-50 rounded-[32px] space-y-6 relative border border-gray-100/50 group transition-all hover:bg-white hover:shadow-xl hover:shadow-gray-100/50">
                        <button
                            onClick={() => handleRemove(idx)}
                            className="absolute top-6 right-6 w-8 h-8 rounded-xl bg-white border border-gray-100 text-gray-300 hover:text-red-500 flex items-center justify-center transition-all shadow-sm opacity-0 group-hover:opacity-100"
                        >
                            <X size={16} />
                        </button>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] pl-1">Job Title</label>
                                <input
                                    type="text"
                                    placeholder="e.g. Senior Product Designer"
                                    value={exp.title}
                                    onChange={(e) => updateItem(idx, 'title', e.target.value)}
                                    className="w-full px-5 py-3.5 bg-white border border-gray-200 rounded-2xl outline-none focus:ring-4 focus:ring-[#29a08e]/10 focus:border-[#29a08e] text-sm font-bold text-gray-800 transition-all"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] pl-1">Company</label>
                                <input
                                    type="text"
                                    placeholder="e.g. Google India"
                                    value={exp.company}
                                    onChange={(e) => updateItem(idx, 'company', e.target.value)}
                                    className="w-full px-5 py-3.5 bg-white border border-gray-200 rounded-2xl outline-none focus:ring-4 focus:ring-[#29a08e]/10 focus:border-[#29a08e] text-sm font-bold text-gray-800 transition-all"
                                />
                            </div>
                            <div className="md:col-span-2 space-y-2">
                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] pl-1">Duration</label>
                                <input
                                    type="text"
                                    placeholder="e.g. Jan 2022 - Present"
                                    value={exp.duration}
                                    onChange={(e) => updateItem(idx, 'duration', e.target.value)}
                                    className="w-full px-5 py-3.5 bg-white border border-gray-200 rounded-2xl outline-none focus:ring-4 focus:ring-[#29a08e]/10 focus:border-[#29a08e] text-sm font-bold text-gray-800 transition-all"
                                />
                            </div>
                            <div className="md:col-span-2 space-y-2">
                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] pl-1">Description</label>
                                <textarea
                                    placeholder="Highlight your key achievements and responsibilities..."
                                    value={exp.description}
                                    onChange={(e) => updateItem(idx, 'description', e.target.value)}
                                    className="w-full px-5 py-4 bg-white border border-gray-200 rounded-2xl outline-none focus:ring-4 focus:ring-[#29a08e]/10 focus:border-[#29a08e] text-sm font-medium text-gray-700 resize-none leading-relaxed transition-all"
                                    rows="4"
                                ></textarea>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        );
    }

    return (
        <div className="space-y-12 relative before:absolute before:inset-0 before:left-[19px] before:top-2 before:w-px before:bg-gray-100 pb-2">
            {profile.workExperience?.length > 0 ? profile.workExperience.map((exp, idx) => (
                <div key={idx} className="relative pl-14 group">
                    {/* Timeline Dot */}
                    <div className="absolute left-0 top-1.5 w-10 h-10 rounded-xl bg-white border border-gray-100 flex items-center justify-center text-gray-400 group-hover:text-[#29a08e] group-hover:border-[#29a08e]/20 transition-all shadow-sm z-10">
                        <Briefcase size={18} />
                    </div>

                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 mb-3">
                        <div>
                            <h4 className="text-lg font-bold text-gray-900 group-hover:text-[#29a08e] transition-colors">{exp.title}</h4>
                            <p className="text-sm font-semibold text-[#29a08e] tracking-tight">{exp.company}</p>
                        </div>
                        <div className="flex items-center gap-2 px-3 py-1 bg-gray-50 rounded-lg text-gray-400 border border-gray-100">
                            <Calendar size={12} />
                            <span className="text-[10px] font-black uppercase tracking-wider">{exp.duration}</span>
                        </div>
                    </div>

                    <div className="text-sm text-gray-500 font-medium leading-relaxed max-w-3xl space-y-2">
                        {exp.description?.split('\n').map((line, i) => (
                            <p key={i} className="flex gap-2">
                                <span className="mt-1.5 w-1 h-1 rounded-full bg-gray-300 shrink-0"></span>
                                {line}
                            </p>
                        ))}
                    </div>
                </div>
            )) : (
                <div className="text-center py-12 bg-gray-50 rounded-[32px] border border-dashed border-gray-200">
                    <p className="text-sm text-gray-400 font-bold uppercase tracking-widest">No Experience Listed</p>
                    <p className="text-xs text-gray-400 mt-2 font-medium">Add your work history to show your professional progress.</p>
                </div>
            )}
        </div>
    );
};

export default WorkExperience;
