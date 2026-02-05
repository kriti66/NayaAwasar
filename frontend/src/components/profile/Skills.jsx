import React, { useState } from 'react';
import { Plus, X, Award } from 'lucide-react';

const Skills = ({ isEditing, profile, formData, handleInputChange }) => {
    const [newSkill, setNewSkill] = useState('');
    const [proficiency, setProficiency] = useState('Intermediate');

    const handleAddSkill = () => {
        if (!newSkill.trim()) return;
        const currentSkills = formData.skills ? formData.skills.split(',').map(s => s.trim()) : [];
        const skillWithProficiency = `${newSkill.trim()} - ${proficiency}`;
        if (!currentSkills.includes(skillWithProficiency)) {
            const updatedSkills = [...currentSkills, skillWithProficiency].join(', ');
            handleInputChange({ target: { name: 'skills', value: updatedSkills } });
        }
        setNewSkill('');
    };

    const handleRemoveSkill = (skillToRemove) => {
        const updatedSkills = formData.skills
            .split(',')
            .map(s => s.trim())
            .filter(s => s !== skillToRemove)
            .join(', ');
        handleInputChange({ target: { name: 'skills', value: updatedSkills } });
    };

    const skillsList = profile.skills ? profile.skills.split(',').filter(s => s.trim() !== '') : [];

    if (isEditing) {
        return (
            <div className="space-y-8">
                <div className="flex flex-col md:flex-row gap-4">
                    <div className="flex-1 space-y-2">
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest pl-1">Add New Skill</label>
                        <input
                            type="text"
                            value={newSkill}
                            onChange={(e) => setNewSkill(e.target.value)}
                            className="w-full px-5 py-3.5 bg-gray-50 border border-gray-200 rounded-2xl outline-none focus:ring-4 focus:ring-[#2D9B82]/10 focus:border-[#2D9B82] text-sm font-bold text-gray-800 transition-all"
                            placeholder="e.g. React, Node.js, UI/UX"
                            onKeyPress={(e) => e.key === 'Enter' && handleAddSkill()}
                        />
                    </div>
                    <div className="w-full md:w-48 space-y-2">
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest pl-1">Proficiency</label>
                        <select
                            value={proficiency}
                            onChange={(e) => setProficiency(e.target.value)}
                            className="w-full px-5 py-3.5 bg-gray-50 border border-gray-200 rounded-2xl outline-none focus:ring-4 focus:ring-[#2D9B82]/10 focus:border-[#2D9B82] text-sm font-bold text-gray-800 transition-all appearance-none cursor-pointer"
                        >
                            <option>Beginner</option>
                            <option>Intermediate</option>
                            <option>Advanced</option>
                            <option>Expert</option>
                        </select>
                    </div>
                    <div className="flex items-end">
                        <button
                            onClick={handleAddSkill}
                            className="w-full md:w-auto px-8 py-3.5 bg-[#2D9B82] text-white rounded-2xl font-bold hover:bg-[#25836d] transition-all shadow-lg shadow-[#2D9B82]/10 flex items-center justify-center gap-2 mb-[1px]"
                        >
                            <Plus size={18} />
                            <span>Add</span>
                        </button>
                    </div>
                </div>

                <div className="flex flex-wrap gap-3">
                    {(formData.skills ? formData.skills.split(',').filter(s => s.trim() !== '') : []).map((skill, idx) => {
                        const [name, level] = skill.includes(' - ') ? skill.split(' - ') : [skill, ''];
                        return (
                            <div key={idx} className="group relative flex items-center gap-2 px-4 py-2 bg-white border border-gray-100 rounded-2xl hover:border-[#2D9B82]/20 transition-all shadow-sm">
                                <span className="text-xs font-bold text-gray-900">{name.trim()}</span>
                                {level && (
                                    <span className="px-2 py-0.5 bg-[#2D9B82]/10 text-[#2D9B82] text-[9px] font-black uppercase rounded-lg">
                                        {level.trim()}
                                    </span>
                                )}
                                <button
                                    onClick={() => handleRemoveSkill(skill)}
                                    className="p-1 text-gray-300 hover:text-red-500 transition-colors"
                                >
                                    <X size={14} />
                                </button>
                            </div>
                        );
                    })}
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-8">
            <div>
                <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-6">Technical Skills</h4>
                <div className="flex flex-wrap gap-3">
                    {skillsList.length > 0 ? skillsList.map((skill, idx) => {
                        const [name, level] = skill.includes(' - ') ? skill.split(' - ') : [skill, ''];
                        return (
                            <div
                                key={idx}
                                className="flex items-center gap-3 px-4 py-2 bg-gray-50 border border-gray-100 rounded-2xl hover:border-[#2D9B82]/20 hover:bg-white hover:shadow-md hover:shadow-[#2D9B82]/5 transition-all cursor-default group"
                            >
                                <Award size={14} className="text-[#2D9B82] opacity-50 group-hover:opacity-100 transition-opacity" />
                                <span className="text-[11px] font-bold text-gray-900 uppercase tracking-tight">{name.trim()}</span>
                                {level && (
                                    <span className="px-2 py-0.5 bg-[#2D9B82]/10 text-[#2D9B82] text-[9px] font-black uppercase rounded-lg">
                                        {level.trim()}
                                    </span>
                                )}
                            </div>
                        );
                    }) : (
                        <div className="w-full text-center py-10 bg-gray-50 border border-dashed border-gray-200 rounded-[32px]">
                            <p className="text-sm text-gray-400 font-bold uppercase tracking-widest">No Technical Skills Listed</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Skills;
