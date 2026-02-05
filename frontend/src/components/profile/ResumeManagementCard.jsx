import React from 'react';
import { Download, Upload, RefreshCw, FileText } from 'lucide-react';

const ResumeManagementCard = ({ profile, onDownloadPDF, onUploadClick }) => {
    const fileName = profile?.resume_url?.split('/').pop() || 'No resume uploaded';
    const lastUpdated = profile?.updatedAt ? new Date(profile.updatedAt).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
    }) : 'Never';

    return (
        <div className="bg-white rounded-[32px] border border-gray-100 shadow-sm overflow-hidden mb-6">
            <div className="p-6 border-b border-gray-50">
                <h3 className="text-lg font-bold text-gray-900">Resume Management</h3>
            </div>

            <div className="p-6">
                {/* Resume Thumbnail Mockup */}
                <div className="relative group mb-6">
                    <div className="aspect-[3/4] bg-gray-50 rounded-2xl border-2 border-dashed border-gray-100 flex flex-col items-center justify-center p-8 transition-all group-hover:border-[#2D9B82]/20 group-hover:bg-[#F0FDF4]/30">
                        <div className="w-16 h-16 bg-white rounded-2xl shadow-sm border border-gray-50 flex items-center justify-center text-[#2D9B82] mb-4">
                            <FileText size={32} />
                        </div>
                        <p className="text-sm font-bold text-gray-900 text-center mb-1 truncate w-full px-4">
                            {profile?.fullName}_Resume.pdf
                        </p>
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                            {profile?.resume_url ? 'PDF Document' : 'Required'}
                        </p>
                    </div>
                </div>

                <div className="mb-6">
                    <p className="text-xs font-semibold text-gray-400 mb-1">Last updated: {lastUpdated}</p>
                </div>

                <div className="space-y-3">
                    <button
                        onClick={onDownloadPDF}
                        disabled={!profile?.resume_url}
                        className="w-full py-3.5 bg-[#2D9B82] text-white text-xs font-bold rounded-xl flex items-center justify-center gap-2 hover:bg-[#25836d] transition-all shadow-lg shadow-[#2D9B82]/10 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        <Download size={16} />
                        Download PDF
                    </button>

                    <label className="w-full py-3.5 bg-white border border-gray-100 text-gray-600 text-xs font-bold rounded-xl flex items-center justify-center gap-2 hover:bg-gray-50 transition-all cursor-pointer shadow-sm">
                        <Upload size={16} />
                        Upload New Resume
                        <input type="file" className="hidden" accept=".pdf,.doc,.docx" onChange={onUploadClick} />
                    </label>

                    <button
                        className="w-full py-3.5 bg-white border border-gray-100 text-gray-600 text-xs font-bold rounded-xl flex items-center justify-center gap-2 hover:bg-gray-50 transition-all shadow-sm"
                    >
                        <RefreshCw size={16} />
                        Regenerate Resume
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ResumeManagementCard;
