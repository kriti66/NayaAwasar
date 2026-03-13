import React from 'react';

const AboutSection = ({ isEditing, profile, formData, handleInputChange }) => {
    if (isEditing) {
        return (
            <div className="space-y-4">
                <div className="space-y-2">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest pl-1">Professional Summary</label>
                    <textarea
                        name="bio"
                        value={formData.bio || ''}
                        onChange={handleInputChange}
                        rows="6"
                        className="w-full px-5 py-4 bg-gray-50 border border-gray-100 rounded-[24px] focus:ring-4 focus:ring-[#29a08e]/10 focus:border-[#29a08e] outline-none transition-all font-medium text-gray-700 resize-none leading-relaxed"
                        placeholder="Share your professional journey, key achievements, and what makes you unique..."
                    ></textarea>
                </div>
                <div className="flex items-start gap-2 p-3 bg-amber-50 rounded-xl border border-amber-100/50">
                    <div className="w-4 h-4 rounded-full bg-amber-400 flex items-center justify-center shrink-0 mt-0.5">
                        <span className="text-[10px] font-black text-white">!</span>
                    </div>
                    <p className="text-[10px] font-bold text-amber-700 leading-tight">
                        A well-written summary helps recruiters find you through keyword searches.
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <p className="text-gray-600 leading-relaxed font-medium text-justify">
                {profile?.bio || 'No professional summary added yet. Click edit to share your story and attract top recruiters.'}
            </p>

            <div className="flex items-start gap-2 p-3 bg-gray-50 rounded-xl border border-gray-100/50">
                <div className="w-5 h-5 rounded-lg bg-white shadow-sm flex items-center justify-center shrink-0 mt-0.5">
                    <svg className="w-3 h-3 text-yellow-500" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z" />
                    </svg>
                </div>
                <p className="text-[10px] font-bold text-gray-400 leading-tight mt-0.5">
                    This summary is visible to recruiters and helps them understand your professional background.
                </p>
            </div>
        </div>
    );
};

export default AboutSection;
