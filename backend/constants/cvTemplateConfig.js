/** Allowed CV PDF templates (job seeker generated resume). */
export const CV_TEMPLATE_IDS = ['classic', 'modern', 'professional', 'minimal', 'creative'];

export const DEFAULT_CV_TEMPLATE = 'professional';

export function normalizeCvTemplate(value) {
    const v = typeof value === 'string' ? value.trim().toLowerCase() : '';
    if (CV_TEMPLATE_IDS.includes(v)) return v;
    return DEFAULT_CV_TEMPLATE;
}
