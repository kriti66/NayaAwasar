import React from 'react';
import { Download, Upload, RefreshCw, FileText, LayoutTemplate } from 'lucide-react';
import { getCvTemplateLabel } from '../../constants/cvTemplates';

const ResumeManagementCard = ({
    profile,
    onDownloadPDF,
    onUploadClick,
    onAutoGenerate,
    onChangeTemplate,
    onRegenerateSameTemplate,
    isGenerating
}) => {
    const fileName = profile?.resume?.fileName || profile?.resume_url?.split('/').pop() || 'No resume uploaded';
    const lastUpdated = profile?.resume?.uploadedAt
        ? new Date(profile.resume.uploadedAt).toLocaleDateString('en-US', {
              month: 'short',
              day: 'numeric',
              year: 'numeric'
          })
        : 'Never';
    const hasResume = !!profile?.resume?.fileUrl;
    const isGenerated = profile?.resume?.source === 'generated';

    return (
        <div className="bg-white rounded-[32px] border border-gray-100 shadow-sm overflow-hidden mb-6">
            <div className="p-6 border-b border-gray-50">
                <h3 className="text-lg font-bold text-gray-900">Resume Management</h3>
            </div>

            <div className="p-6">
                {/* Auto Generate — opens template picker */}
                <button
                    type="button"
                    onClick={onAutoGenerate}
                    disabled={isGenerating}
                    className="w-full py-4 bg-[#F0FDF4] border border-[#29a08e]/20 text-[#29a08e] rounded-2xl flex items-center justify-center gap-3 hover:bg-[#29a08e] hover:text-white transition-all group shadow-sm disabled:opacity-70 disabled:cursor-not-allowed mb-2"
                >
                    {isGenerating ? (
                        <div className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin"></div>
                    ) : (
                        <RefreshCw size={20} className="group-hover:rotate-180 transition-transform duration-500" />
                    )}
                    <span className="font-bold text-sm">Auto-Generate CV from Profile</span>
                </button>
                <p className="text-center text-[10px] text-gray-400 font-semibold mb-4">Choose a template in the next step</p>

                <div className="relative py-4 text-center">
                    <div className="absolute inset-0 flex items-center">
                        <div className="w-full border-t border-gray-100"></div>
                    </div>
                    <span className="relative px-3 text-xs font-bold text-gray-400 bg-white uppercase tracking-widest">OR</span>
                </div>

                {/* Upload Section */}
                <label className="w-full py-8 border-2 border-dashed border-gray-200 rounded-2xl flex flex-col items-center justify-center cursor-pointer hover:border-[#29a08e]/50 hover:bg-gray-50 transition-all group mb-6">
                    <div className="w-12 h-12 bg-gray-50 rounded-xl flex items-center justify-center text-gray-400 group-hover:text-[#29a08e] group-hover:scale-110 transition-all mb-3">
                        <Upload size={24} />
                    </div>
                    <span className="text-sm font-bold text-gray-700 group-hover:text-[#29a08e] transition-colors">Upload Custom Resume</span>
                    <span className="text-[10px] font-semibold text-gray-400 mt-1">PDF, DOC, DOCX up to 5MB</span>
                    <input type="file" className="hidden" accept=".pdf,.doc,.docx" onChange={onUploadClick} />
                </label>

                {/* Current Resume Display */}
                {hasResume && (
                    <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
                        <div className="flex items-center gap-3 mb-3">
                            <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center text-[#29a08e] shadow-sm">
                                <FileText size={20} />
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-xs font-bold text-gray-900 truncate">{fileName}</p>
                                <p className="text-[10px] font-semibold text-gray-400">Last updated: {lastUpdated}</p>
                                {isGenerated && profile.resume.cvTemplate && (
                                    <p className="text-[10px] font-bold text-gray-600 mt-1 flex items-center gap-1">
                                        <LayoutTemplate size={12} className="text-[#29a08e]" />
                                        Template:{' '}
                                        <span className="text-[#29a08e]">{getCvTemplateLabel(profile.resume.cvTemplate)}</span>
                                    </p>
                                )}
                            </div>
                        </div>
                        {isGenerated && onChangeTemplate && (
                            <button
                                type="button"
                                onClick={onChangeTemplate}
                                disabled={isGenerating}
                                className="w-full py-2.5 mb-2 bg-white border border-gray-200 text-gray-700 text-xs font-bold rounded-lg flex items-center justify-center gap-2 hover:border-[#29a08e]/40 hover:bg-[#29a08e]/5 transition-all disabled:opacity-50"
                            >
                                <LayoutTemplate size={14} />
                                Change template
                            </button>
                        )}
                        {isGenerated && onRegenerateSameTemplate && (
                            <button
                                type="button"
                                onClick={onRegenerateSameTemplate}
                                disabled={isGenerating}
                                className="w-full py-2.5 mb-2 bg-white border border-[#29a08e]/20 text-[#29a08e] text-xs font-bold rounded-lg flex items-center justify-center gap-2 hover:bg-[#29a08e]/5 transition-all disabled:opacity-50"
                            >
                                <RefreshCw size={14} className={isGenerating ? 'animate-spin' : ''} />
                                {isGenerating ? 'Updating…' : 'Update PDF (same template)'}
                            </button>
                        )}
                        <button
                            type="button"
                            onClick={onDownloadPDF}
                            className="w-full py-2.5 bg-white border border-gray-200 text-gray-600 text-xs font-bold rounded-lg flex items-center justify-center gap-2 hover:bg-[#29a08e] hover:text-white hover:border-[#29a08e] transition-all shadow-sm"
                        >
                            <Download size={14} />
                            Download Current Resume
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ResumeManagementCard;
