import React from 'react';
import { Download, FileText, Upload, ChevronUp } from 'lucide-react';

const ResumePreview = ({ profile, onDownloadPDF, onDownloadOriginal, onUploadClick }) => {
    return (
        <div className="bg-white rounded-3xl border border-gray-100 shadow-sm sticky top-24 overflow-hidden">
            <div className="p-6 pb-4 flex justify-between items-center border-b border-gray-50 bg-gray-50/30">
                <h3 className="text-sm font-black text-gray-900 uppercase tracking-widest leading-none">Resume Preview</h3>
                <ChevronUp size={16} className="text-gray-300" />
            </div>

            <div className="p-6">
                {/* Visual Resume Card mockup */}
                <div className="rounded-2xl overflow-hidden border border-gray-100 shadow-sm bg-white mb-8 group transition-transform hover:scale-[1.01]">
                    <div className="bg-[#29a08e] p-6 text-white relative overflow-hidden">
                        <div className="relative z-10">
                            <div className="w-12 h-12 rounded-xl bg-white/20 backdrop-blur-md flex items-center justify-center font-black text-lg mb-4 shadow-inner ring-1 ring-white/30">
                                {profile?.fullName?.charAt(0) || 'U'}
                            </div>
                            <h4 className="text-lg font-black uppercase tracking-tight leading-loose -mt-2">
                                {profile.fullName || 'Member Name'}
                            </h4>
                            <p className="text-[10px] font-bold text-white/90 uppercase tracking-widest opacity-80">
                                {profile.professionalHeadline || 'Global Professional'}
                            </p>
                        </div>
                        {/* Decorative circle */}
                        <div className="absolute top-[-20px] right-[-20px] w-32 h-32 bg-white/10 rounded-full blur-2xl"></div>
                    </div>

                    <div className="p-5 space-y-6">
                        <div className="space-y-3">
                            <p className="text-[9px] font-black text-blue-600 uppercase tracking-widest border-l-2 border-[#29a08e] pl-2">Contact</p>
                            <div className="space-y-2">
                                <p className="text-[10px] font-bold text-gray-600 flex items-center gap-2">
                                    <span className="w-1 h-1 bg-gray-300 rounded-full"></span>
                                    {profile.phoneNumber || '+977-XXXXXXXXXX'}
                                </p>
                                <p className="text-[10px] font-bold text-gray-600 flex items-center gap-2 truncate">
                                    <span className="w-1 h-1 bg-gray-300 rounded-full"></span>
                                    {profile.email}
                                </p>
                                <p className="text-[10px] font-bold text-gray-600 flex items-center gap-2">
                                    <span className="w-1 h-1 bg-gray-300 rounded-full"></span>
                                    {profile.location || 'Nepal'}
                                </p>
                            </div>
                        </div>

                        <div className="space-y-3">
                            <p className="text-[9px] font-black text-blue-600 uppercase tracking-widest border-l-2 border-[#29a08e] pl-2">Top Skills</p>
                            <div className="flex flex-wrap gap-1.5">
                                {profile.skills ? profile.skills.split(',').slice(0, 5).map((s, i) => (
                                    <span key={i} className="px-2 py-1 bg-gray-50 text-[8px] font-black text-gray-400 rounded-md border border-gray-100 uppercase tracking-tighter group-hover:bg-[#29a08e]/10 group-hover:text-[#29a08e] transition-colors">
                                        {s.trim()}
                                    </span>
                                )) : <span className="text-[9px] font-bold text-gray-300 italic pl-1">No skills added</span>}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Actions */}
                <div className="space-y-3">
                    <button
                        onClick={onDownloadPDF}
                        className="w-full py-3.5 bg-[#29a08e] text-white text-[10px] font-black uppercase tracking-widest rounded-xl flex items-center justify-center gap-2 hover:bg-[#228377] transition-all shadow-lg shadow-[#29a08e]/10 active:scale-[0.98]"
                    >
                        <Download size={14} />
                        Download as PDF
                    </button>

                    <button
                        onClick={onDownloadOriginal}
                        disabled={!profile.resume_url}
                        className={`w-full py-3.5 border ${profile.resume_url ? 'border-gray-200 text-gray-600 hover:bg-gray-50' : 'border-gray-100 text-gray-300 cursor-not-allowed'} text-[10px] font-black uppercase tracking-widest rounded-xl flex items-center justify-center gap-2 transition-all shadow-sm active:scale-[0.98]`}
                    >
                        <FileText size={14} />
                        Download Original
                    </button>

                    <label className="w-full py-3.5 border border-dashed border-gray-100 text-gray-400 hover:border-[#29a08e] hover:text-[#29a08e] hover:bg-[#29a08e]/5 text-[10px] font-black uppercase tracking-widest rounded-xl flex items-center justify-center gap-2 transition-all cursor-pointer bg-gray-50/30 group">
                        <Upload size={14} className="group-hover:translate-y-[-1px] transition-transform" />
                        Upload Resume
                        <input type="file" className="hidden" accept=".pdf,.doc,.docx" onChange={onUploadClick} />
                    </label>
                </div>
            </div>
        </div>
    );
};

export default ResumePreview;
