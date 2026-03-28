import { useState, useEffect } from 'react';
import { X, Check, LayoutTemplate } from 'lucide-react';
import { CV_TEMPLATE_OPTIONS } from '../../constants/cvTemplates';

/**
 * Modal to pick a CV PDF template before generation / when changing template.
 */
const CvTemplatePickerModal = ({
    open,
    onClose,
    initialTemplateId = 'professional',
    onConfirm,
    isGenerating = false,
    title = 'Choose a resume template',
    subtitle = 'Pick a design for your PDF. You can change it anytime—your profile data stays the same.'
}) => {
    const [selectedId, setSelectedId] = useState(initialTemplateId);

    useEffect(() => {
        if (open) setSelectedId(initialTemplateId || 'professional');
    }, [open, initialTemplateId]);

    if (!open) return null;

    const handleConfirm = () => {
        onConfirm(selectedId);
    };

    return (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl w-full max-w-3xl max-h-[90vh] overflow-hidden shadow-2xl border border-gray-100 flex flex-col">
                <div className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-[#0d2f2b] to-slate-900 px-5 py-4 sm:px-6 sm:py-5 shrink-0">
                    <div className="absolute inset-0 opacity-10">
                        <div className="absolute top-0 right-0 w-40 h-40 bg-[#29a08e] rounded-full blur-3xl" />
                    </div>
                    <div className="relative flex justify-between items-start gap-3">
                        <div className="flex items-start gap-3">
                            <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center text-[#29a08e] border border-white/10">
                                <LayoutTemplate size={20} />
                            </div>
                            <div>
                                <h3 className="text-base sm:text-lg font-black text-white tracking-tight">{title}</h3>
                                <p className="text-xs sm:text-sm text-gray-300 mt-1 max-w-xl leading-snug">{subtitle}</p>
                            </div>
                        </div>
                        <button
                            type="button"
                            onClick={onClose}
                            disabled={isGenerating}
                            className="p-2 hover:bg-white/10 rounded-xl text-gray-300 hover:text-white transition-colors disabled:opacity-50"
                            aria-label="Close"
                        >
                            <X size={20} />
                        </button>
                    </div>
                </div>

                <div className="p-4 sm:p-6 overflow-y-auto flex-1 bg-[#f8fafc]">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                        {CV_TEMPLATE_OPTIONS.map((opt) => {
                            const selected = selectedId === opt.id;
                            return (
                                <button
                                    key={opt.id}
                                    type="button"
                                    onClick={() => setSelectedId(opt.id)}
                                    className={`text-left rounded-xl border-2 p-4 transition-all relative group ${
                                        selected
                                            ? 'border-[#29a08e] ring-2 ring-[#29a08e]/25 shadow-md'
                                            : 'border-gray-200 hover:border-[#29a08e]/40 hover:shadow-sm'
                                    } ${opt.cardClass}`}
                                >
                                    {selected && (
                                        <span className="absolute top-3 right-3 w-7 h-7 rounded-full bg-[#29a08e] text-white flex items-center justify-center shadow-md">
                                            <Check size={14} strokeWidth={3} />
                                        </span>
                                    )}
                                    <p className={`text-sm font-black mb-1 pr-8 ${opt.dark ? 'text-white' : 'text-gray-900'}`}>
                                        {opt.label}
                                    </p>
                                    <p className={`text-xs leading-relaxed ${opt.dark ? 'text-slate-300' : 'text-gray-600'}`}>
                                        {opt.description}
                                    </p>
                                    <div
                                        className={`mt-3 h-14 rounded-lg border ${
                                            opt.dark ? 'bg-slate-800/50 border-slate-600' : 'bg-white/60 border-gray-200/80'
                                        } flex items-end gap-1 p-2`}
                                        aria-hidden
                                    >
                                        <div className={`w-1/3 h-full rounded ${opt.dark ? 'bg-teal-500/40' : 'bg-[#29a08e]/20'}`} />
                                        <div className="flex-1 space-y-1">
                                            <div className={`h-1.5 rounded ${opt.dark ? 'bg-slate-500' : 'bg-gray-200'}`} />
                                            <div className={`h-1.5 rounded w-4/5 ${opt.dark ? 'bg-slate-600' : 'bg-gray-100'}`} />
                                            <div className={`h-1.5 rounded w-3/5 ${opt.dark ? 'bg-slate-600' : 'bg-gray-100'}`} />
                                        </div>
                                    </div>
                                </button>
                            );
                        })}
                    </div>
                </div>

                <div className="px-4 sm:px-6 py-4 border-t border-gray-100 bg-white flex flex-col-reverse sm:flex-row justify-end gap-2 shrink-0">
                    <button
                        type="button"
                        onClick={onClose}
                        disabled={isGenerating}
                        className="px-5 py-2.5 text-gray-600 hover:bg-gray-100 rounded-xl font-bold text-sm transition-colors disabled:opacity-50"
                    >
                        Cancel
                    </button>
                    <button
                        type="button"
                        onClick={handleConfirm}
                        disabled={isGenerating}
                        className="px-6 py-2.5 bg-[#29a08e] text-white rounded-xl font-bold text-sm hover:bg-[#228377] shadow-lg shadow-[#29a08e]/20 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                        {isGenerating ? (
                            <>
                                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                Generating…
                            </>
                        ) : (
                            'Generate PDF'
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default CvTemplatePickerModal;
