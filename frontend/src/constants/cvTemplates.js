/** Must match backend `cvTemplateConfig.CV_TEMPLATE_IDS` */
export const CV_TEMPLATE_OPTIONS = [
    {
        id: 'classic',
        label: 'Classic',
        description: 'Traditional serif layout with a centered header and clear section dividers.',
        cardClass: 'bg-gradient-to-br from-amber-50 to-stone-100 border-amber-200/80',
        accent: 'text-amber-800'
    },
    {
        id: 'modern',
        label: 'Modern',
        description: 'Two-column design with a bold sidebar for identity and skills.',
        cardClass: 'bg-gradient-to-br from-slate-700 to-slate-900 border-slate-600',
        accent: 'text-teal-300',
        dark: true
    },
    {
        id: 'professional',
        label: 'Professional',
        description: 'Clean corporate style with teal accents—great for most industries.',
        cardClass: 'bg-gradient-to-br from-[#29a08e]/10 to-teal-50 border-[#29a08e]/25',
        accent: 'text-[#29a08e]'
    },
    {
        id: 'minimal',
        label: 'Minimal',
        description: 'Lots of white space, light typography, subtle left accents.',
        cardClass: 'bg-gradient-to-br from-gray-50 to-white border-gray-200',
        accent: 'text-gray-600'
    },
    {
        id: 'creative',
        label: 'Creative',
        description: 'Strong teal stripe and highlighted name—stands out while staying readable.',
        cardClass: 'bg-gradient-to-br from-emerald-50 to-white border-[#29a08e]/30',
        accent: 'text-[#29a08e]'
    }
];

export function getCvTemplateLabel(id) {
    const opt = CV_TEMPLATE_OPTIONS.find((t) => t.id === id);
    return opt?.label || 'Professional';
}
