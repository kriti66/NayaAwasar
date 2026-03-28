import puppeteer from 'puppeteer';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { normalizeCvTemplate } from '../constants/cvTemplateConfig.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/** Args required for Chromium in Docker / Render and other locked-down Linux hosts */
const PUPPETEER_LAUNCH_ARGS = [
    '--no-sandbox',
    '--disable-setuid-sandbox',
    '--disable-dev-shm-usage',
    '--disable-gpu'
];

/** Prefer PUPPETEER_EXECUTABLE_PATH on hosts where Chrome is installed system-wide; else Puppeteer’s downloaded Chrome (postinstall). */
function resolveChromeExecutablePath() {
    if (process.env.PUPPETEER_EXECUTABLE_PATH) {
        return process.env.PUPPETEER_EXECUTABLE_PATH;
    }
    try {
        return puppeteer.executablePath();
    } catch {
        return undefined;
    }
}

const getBaseUrl = () => {
    const base = process.env.BASE_URL || process.env.API_URL;
    if (base) return base.replace(/\/api\/?$/, '').replace(/\/$/, '');
    const port = process.env.PORT || 5001;
    return `http://localhost:${port}`;
};

const getDefaultAvatarSvg = (initial) => {
    const letter = encodeURIComponent((initial || 'J').toUpperCase().charAt(0));
    return `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Crect fill='%23e5e7eb' width='100' height='100' rx='50'/%3E%3Ctext x='50' y='58' font-size='40' font-weight='600' fill='%236b7280' text-anchor='middle' font-family='Helvetica,Arial,sans-serif'%3E${letter}%3C/text%3E%3C/svg%3E`;
};

const esc = (s) => {
    if (s == null) return '';
    return String(s)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
};

const yearOf = (d) => {
    if (!d) return '';
    const y = new Date(d).getFullYear();
    return Number.isFinite(y) ? String(y) : '';
};

const expDateRange = (exp) => {
    const start = yearOf(exp.startDate);
    const end = exp.current ? 'Present' : yearOf(exp.endDate);
    if (start && end) return `${start} – ${end}`;
    return start || end || '';
};

const resolveAvatarSrc = (profile) => {
    const user = profile?.user || {};
    const fullNameForAvatar = typeof user?.fullName === 'string' ? user.fullName : '';
    const avatarInitial = fullNameForAvatar ? fullNameForAvatar.charAt(0) : 'J';
    let avatarSrc = getDefaultAvatarSvg(avatarInitial);

    const profileImage = user?.profileImage;
    if (typeof profileImage === 'string') {
        const trimmed = profileImage.trim();
        if (trimmed) {
            if (/^https?:\/\//i.test(trimmed)) {
                avatarSrc = trimmed;
            } else {
                const baseUrl = getBaseUrl();
                const normalized = trimmed.startsWith('/') ? trimmed : `/${trimmed}`;
                avatarSrc = `${baseUrl}${normalized}`;
            }
        }
    }
    return avatarSrc;
};

/** Shared middle sections (summary, skills, experience, education, projects). */
function buildSectionsHtml(profile) {
    const p = profile || {};
    let html = '';

    if (p.summary) {
        html += `
            <div class="section-title">Professional Summary</div>
            <div class="content-block summary">${esc(p.summary)}</div>`;
    }

    if (Array.isArray(p.skills) && p.skills.length > 0) {
        html += `
            <div class="section-title">Core Skills</div>
            <div class="content-block skills-container">
                ${p.skills.map((skill) => `<span class="skill-tag">${esc(skill)}</span>`).join('')}
            </div>`;
    }

    if (Array.isArray(p.experience) && p.experience.length > 0) {
        html += `<div class="section-title">Work Experience</div>`;
        html += p.experience
            .map(
                (exp) => `
                <div class="content-block">
                    <div class="job-title">${esc(exp.role)}</div>
                    <div class="company-row">
                        <span>${esc(exp.company)}</span>
                        <span>${esc(expDateRange(exp))}</span>
                    </div>
                    ${exp.description ? `<div class="job-desc">${esc(exp.description)}</div>` : ''}
                </div>`
            )
            .join('');
    }

    if (Array.isArray(p.education) && p.education.length > 0) {
        html += `<div class="section-title">Education</div>`;
        html += p.education
            .map(
                (edu) => `
                <div class="content-block education-item">
                    <div class="job-title">${esc(edu.degree)}</div>
                    <div class="company-row">
                        <span>${esc(edu.institute)}</span>
                        <span>${esc(edu.startYear)}${edu.current ? ' – Present' : edu.endYear ? ` – ${esc(edu.endYear)}` : ''}</span>
                    </div>
                </div>`
            )
            .join('');
    }

    if (Array.isArray(p.projects) && p.projects.length > 0) {
        html += `<div class="section-title">Key Projects</div>`;
        html += p.projects
            .map(
                (proj) => `
                <div class="content-block project-item">
                    <div class="project-title">${esc(proj.title)}
                        ${proj.liveDemoUrl ? `<a href="${esc(proj.liveDemoUrl)}" class="project-link" target="_blank">[View Live]</a>` : ''}
                    </div>
                    ${proj.description ? `<div class="job-desc">${esc(proj.description)}</div>` : ''}
                    ${Array.isArray(proj.techStack) && proj.techStack.length > 0
                        ? `<div class="tech-line">Tech: ${proj.techStack.map((t) => esc(t)).join(', ')}</div>`
                        : ''}
                </div>`
            )
            .join('');
    }

    return html;
}

function buildSkillsOnlyHtml(profile) {
    const p = profile || {};
    if (!Array.isArray(p.skills) || p.skills.length === 0) return '<p class="sidebar-muted">—</p>';
    return `<div class="skills-sidebar">${p.skills.map((skill) => `<span class="skill-pill">${esc(skill)}</span>`).join('')}</div>`;
}

function metaLine(profile) {
    const p = profile || {};
    const u = p.user || {};
    return [p.location, u.email, u.phoneNumber].filter(Boolean).map(esc).join(' • ');
}

function documentShell(styles, bodyInner) {
    return `<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <style>
        @page { margin: 0; size: A4; }
        ${styles}
    </style>
</head>
<body>
${bodyInner}
</body>
</html>`;
}

function htmlProfessional(profile, avatarSrc) {
    const u = profile?.user || {};
    const styles = `
        body { font-family: Helvetica, Arial, sans-serif; color: #333; line-height: 1.5; margin: 0; padding: 40px; background: #fff; -webkit-font-smoothing: antialiased; }
        .header { display: flex; align-items: center; gap: 18px; border-bottom: 2px solid #2D9B82; padding-bottom: 16px; margin-bottom: 24px; }
        .header-avatar { width: 60px; height: 60px; min-width: 60px; border-radius: 50%; object-fit: cover; border: 2px solid #2D9B82; background: #f3f4f6; }
        .header-content { flex: 1; min-width: 0; }
        .name { font-size: 22px; font-weight: 700; color: #111827; text-transform: uppercase; letter-spacing: 0.5px; margin: 0 0 2px 0; }
        .headline { font-size: 13px; color: #2D9B82; font-weight: 600; margin: 0 0 4px 0; }
        .meta { font-size: 11px; color: #666; line-height: 1.5; }
        .section-title { font-size: 14px; font-weight: 700; color: #2D9B82; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 15px; border-bottom: 1px solid #e5e7eb; padding-bottom: 5px; margin-top: 25px; }
        .content-block { margin-bottom: 20px; }
        .summary { font-size: 14px; color: #4b5563; text-align: justify; white-space: pre-wrap; }
        .job-title { font-weight: 700; font-size: 15px; color: #1f2937; }
        .company-row { display: flex; justify-content: space-between; font-size: 13px; color: #6b7280; margin-bottom: 5px; }
        .job-desc { font-size: 13px; color: #4b5563; white-space: pre-wrap; }
        .skills-container { display: flex; flex-wrap: wrap; gap: 8px; }
        .skill-tag { background: #f3f4f6; color: #374151; padding: 4px 10px; border-radius: 4px; font-size: 12px; font-weight: 500; }
        .project-item { margin-bottom: 15px; }
        .project-title { font-weight: 700; font-size: 14px; color: #111827; }
        .project-link { font-size: 12px; color: #2D9B82; text-decoration: none; }
        .education-item { margin-bottom: 15px; }
        .tech-line { font-size: 11px; color: #6b7280; margin-top: 2px; }
    `;
    const header = `
        <div class="header">
            <img class="header-avatar" src="${avatarSrc}" alt="" />
            <div class="header-content">
                <h1 class="name">${esc(u.fullName || 'Job Seeker')}</h1>
                <div class="headline">${esc(profile.headline || u.professionalHeadline || 'Professional')}</div>
                <div class="meta">${metaLine(profile)}</div>
            </div>
        </div>`;
    return documentShell(styles, header + buildSectionsHtml(profile));
}

function htmlClassic(profile, avatarSrc) {
    const u = profile?.user || {};
    const styles = `
        body { font-family: Georgia, 'Times New Roman', serif; color: #1a1a1a; line-height: 1.55; margin: 0; padding: 36px 44px; background: #fff; }
        .top { text-align: center; margin-bottom: 28px; border-bottom: 3px double #333; padding-bottom: 18px; }
        .avatar { width: 72px; height: 72px; border-radius: 4px; object-fit: cover; margin: 0 auto 12px; display: block; border: 1px solid #333; }
        .name { font-size: 26px; font-weight: 700; margin: 0; letter-spacing: 0.02em; }
        .headline { font-size: 14px; margin: 10px 0 0; font-style: italic; color: #444; }
        .meta { font-size: 11px; color: #555; margin-top: 8px; }
        .section-title { font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: 3px; margin: 22px 0 10px; border-bottom: 1px solid #999; padding-bottom: 4px; }
        .content-block { margin-bottom: 16px; }
        .summary { font-size: 13px; color: #333; text-align: justify; white-space: pre-wrap; }
        .job-title { font-weight: 700; font-size: 14px; }
        .company-row { display: flex; justify-content: space-between; font-size: 12px; color: #555; margin-bottom: 4px; }
        .job-desc { font-size: 12px; color: #444; white-space: pre-wrap; }
        .skills-container { display: flex; flex-wrap: wrap; gap: 6px; }
        .skill-tag { border: 1px solid #333; padding: 3px 8px; font-size: 11px; }
        .project-title { font-weight: 700; font-size: 13px; }
        .project-link { font-size: 11px; color: #0d5c4d; }
        .tech-line { font-size: 10px; color: #666; margin-top: 2px; }
    `;
    const header = `
        <div class="top">
            <img class="avatar" src="${avatarSrc}" alt="" />
            <h1 class="name">${esc(u.fullName || 'Job Seeker')}</h1>
            <p class="headline">${esc(profile.headline || u.professionalHeadline || 'Professional')}</p>
            <div class="meta">${metaLine(profile)}</div>
        </div>`;
    return documentShell(styles, header + buildSectionsHtml(profile));
}

function htmlModern(profile, avatarSrc) {
    const u = profile?.user || {};
    const styles = `
        body { font-family: 'Segoe UI', Helvetica, Arial, sans-serif; margin: 0; padding: 0; background: #fff; color: #1e293b; font-size: 12px; line-height: 1.45; }
        .layout { display: flex; min-height: 100%; }
        .sidebar { width: 32%; background: #1e293b; color: #e2e8f0; padding: 28px 20px; box-sizing: border-box; }
        .main { flex: 1; padding: 28px 26px; box-sizing: border-box; }
        .sb-avatar { width: 72px; height: 72px; border-radius: 50%; object-fit: cover; border: 3px solid #2dd4bf; margin-bottom: 14px; display: block; }
        .sb-name { font-size: 18px; font-weight: 800; margin: 0 0 6px; line-height: 1.2; }
        .sb-headline { font-size: 11px; color: #94a3b8; margin-bottom: 14px; line-height: 1.4; }
        .sb-meta { font-size: 10px; color: #cbd5e1; line-height: 1.6; margin-bottom: 18px; word-break: break-word; }
        .sb-label { font-size: 9px; font-weight: 800; letter-spacing: 2px; text-transform: uppercase; color: #2dd4bf; margin: 16px 0 8px; }
        .skills-sidebar { display: flex; flex-wrap: wrap; gap: 6px; }
        .skill-pill { background: rgba(45,212,191,0.15); color: #5eead4; padding: 4px 8px; border-radius: 4px; font-size: 10px; font-weight: 600; }
        .sidebar-muted { color: #64748b; font-size: 11px; margin: 0; }
        .main .section-title { font-size: 11px; font-weight: 800; color: #0f766e; text-transform: uppercase; letter-spacing: 2px; margin: 18px 0 10px; border-left: 3px solid #14b8a6; padding-left: 10px; }
        .main .section-title:first-of-type { margin-top: 0; }
        .content-block { margin-bottom: 14px; }
        .summary { font-size: 12px; color: #475569; white-space: pre-wrap; }
        .job-title { font-weight: 700; font-size: 13px; color: #0f172a; }
        .company-row { display: flex; justify-content: space-between; font-size: 11px; color: #64748b; margin-bottom: 4px; }
        .job-desc { font-size: 11px; color: #475569; white-space: pre-wrap; }
        .skills-container { display: flex; flex-wrap: wrap; gap: 6px; }
        .skill-tag { background: #f1f5f9; color: #334155; padding: 3px 8px; border-radius: 4px; font-size: 10px; font-weight: 600; }
        .project-title { font-weight: 700; font-size: 12px; }
        .project-link { font-size: 10px; color: #0d9488; }
        .tech-line { font-size: 10px; color: #64748b; margin-top: 2px; }
    `;

    let mainSections = '';
    if (profile.summary) {
        mainSections += `<div class="section-title">Professional Summary</div><div class="content-block summary">${esc(profile.summary)}</div>`;
    }
    if (Array.isArray(profile.experience) && profile.experience.length > 0) {
        mainSections += `<div class="section-title">Work Experience</div>`;
        mainSections += profile.experience
            .map(
                (exp) => `
            <div class="content-block">
                <div class="job-title">${esc(exp.role)}</div>
                <div class="company-row"><span>${esc(exp.company)}</span><span>${esc(expDateRange(exp))}</span></div>
                ${exp.description ? `<div class="job-desc">${esc(exp.description)}</div>` : ''}
            </div>`
            )
            .join('');
    }
    if (Array.isArray(profile.education) && profile.education.length > 0) {
        mainSections += `<div class="section-title">Education</div>`;
        mainSections += profile.education
            .map(
                (edu) => `
            <div class="content-block">
                <div class="job-title">${esc(edu.degree)}</div>
                <div class="company-row"><span>${esc(edu.institute)}</span><span>${esc(edu.startYear)}${edu.current ? ' – Present' : edu.endYear ? ` – ${esc(edu.endYear)}` : ''}</span></div>
            </div>`
            )
            .join('');
    }
    if (Array.isArray(profile.projects) && profile.projects.length > 0) {
        mainSections += `<div class="section-title">Key Projects</div>`;
        mainSections += profile.projects
            .map(
                (proj) => `
            <div class="content-block">
                <div class="project-title">${esc(proj.title)}${proj.liveDemoUrl ? ` <a href="${esc(proj.liveDemoUrl)}" class="project-link" target="_blank">[Live]</a>` : ''}</div>
                ${proj.description ? `<div class="job-desc">${esc(proj.description)}</div>` : ''}
                ${Array.isArray(proj.techStack) && proj.techStack.length > 0 ? `<div class="tech-line">${proj.techStack.map((t) => esc(t)).join(', ')}</div>` : ''}
            </div>`
            )
            .join('');
    }

    const sidebar = `
        <div class="sidebar">
            <img class="sb-avatar" src="${avatarSrc}" alt="" />
            <div class="sb-name">${esc(u.fullName || 'Job Seeker')}</div>
            <div class="sb-headline">${esc(profile.headline || u.professionalHeadline || '')}</div>
            <div class="sb-meta">${metaLine(profile)}</div>
            <div class="sb-label">Skills</div>
            ${buildSkillsOnlyHtml(profile)}
        </div>`;
    const main = `<div class="main">${mainSections}</div>`;
    return documentShell(styles, `<div class="layout">${sidebar}${main}</div>`);
}

function htmlMinimal(profile, avatarSrc) {
    const u = profile?.user || {};
    const styles = `
        body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; margin: 0; padding: 48px 52px; background: #fff; color: #374151; font-size: 12px; line-height: 1.6; font-weight: 300; }
        .header { margin-bottom: 32px; padding-left: 12px; border-left: 1px solid #d1d5db; }
        .header-row { display: flex; align-items: flex-start; gap: 20px; }
        .header-avatar { width: 56px; height: 56px; border-radius: 50%; object-fit: cover; }
        .name { font-size: 28px; font-weight: 200; letter-spacing: 0.08em; color: #111827; margin: 0 0 6px; text-transform: uppercase; }
        .headline { font-size: 12px; color: #6b7280; font-weight: 400; margin-bottom: 8px; }
        .meta { font-size: 10px; color: #9ca3af; letter-spacing: 0.04em; }
        .section-title { font-size: 10px; font-weight: 600; letter-spacing: 0.25em; text-transform: uppercase; color: #9ca3af; margin: 28px 0 12px; padding-left: 12px; border-left: 2px solid #e5e7eb; }
        .content-block { margin-bottom: 18px; padding-left: 12px; border-left: 1px solid #f3f4f6; }
        .summary { font-size: 12px; color: #4b5563; white-space: pre-wrap; }
        .job-title { font-weight: 500; font-size: 13px; color: #111827; }
        .company-row { display: flex; justify-content: space-between; font-size: 11px; color: #9ca3af; margin-bottom: 4px; }
        .job-desc { font-size: 11px; color: #6b7280; white-space: pre-wrap; }
        .skills-container { display: flex; flex-wrap: wrap; gap: 6px; }
        .skill-tag { border: 1px solid #e5e7eb; padding: 3px 10px; font-size: 10px; color: #6b7280; border-radius: 2px; }
        .project-title { font-weight: 500; font-size: 12px; color: #111827; }
        .project-link { font-size: 10px; color: #6b7280; }
        .tech-line { font-size: 10px; color: #9ca3af; margin-top: 2px; }
    `;
    const header = `
        <div class="header">
            <div class="header-row">
                <img class="header-avatar" src="${avatarSrc}" alt="" />
                <div>
                    <h1 class="name">${esc(u.fullName || 'Job Seeker')}</h1>
                    <div class="headline">${esc(profile.headline || u.professionalHeadline || 'Professional')}</div>
                    <div class="meta">${metaLine(profile)}</div>
                </div>
            </div>
        </div>`;
    return documentShell(styles, header + buildSectionsHtml(profile));
}

function htmlCreative(profile, avatarSrc) {
    const u = profile?.user || {};
    const styles = `
        body { font-family: Helvetica, Arial, sans-serif; margin: 0; padding: 0; background: #fafafa; }
        .wrap { border-left: 10px solid #29a08e; min-height: 100%; padding: 36px 40px 40px 32px; background: #fff; box-sizing: border-box; }
        .header { display: flex; gap: 20px; margin-bottom: 26px; }
        .header-avatar { width: 68px; height: 68px; border-radius: 16px; object-fit: cover; border: 3px solid #29a08e; }
        .name { font-size: 30px; font-weight: 900; margin: 0; color: #111; line-height: 1.1; }
        .name span { color: #29a08e; }
        .headline { font-size: 13px; font-weight: 600; color: #29a08e; margin: 8px 0 6px; }
        .meta { font-size: 11px; color: #6b7280; }
        .section-title { font-size: 12px; font-weight: 800; color: #fff; background: #29a08e; display: inline-block; padding: 6px 14px; border-radius: 6px; margin: 22px 0 12px; text-transform: uppercase; letter-spacing: 1px; }
        .content-block { margin-bottom: 16px; }
        .summary { font-size: 12px; color: #4b5563; white-space: pre-wrap; }
        .job-title { font-weight: 800; font-size: 14px; color: #111827; }
        .company-row { display: flex; justify-content: space-between; font-size: 12px; color: #29a08e; font-weight: 600; margin-bottom: 4px; }
        .job-desc { font-size: 12px; color: #4b5563; white-space: pre-wrap; }
        .skills-container { display: flex; flex-wrap: wrap; gap: 8px; }
        .skill-tag { background: #fff; color: #29a08e; padding: 5px 12px; border-radius: 20px; font-size: 11px; font-weight: 700; border: 2px solid #29a08e; }
        .project-title { font-weight: 800; font-size: 13px; }
        .project-link { font-size: 11px; color: #29a08e; font-weight: 700; }
        .tech-line { font-size: 10px; color: #6b7280; margin-top: 2px; }
    `;
    const rawName = u.fullName || 'Job Seeker';
    const first = rawName.charAt(0);
    const rest = esc(rawName.slice(1));
    const header = `
        <div class="header">
            <img class="header-avatar" src="${avatarSrc}" alt="" />
            <div>
                <h1 class="name"><span>${esc(first)}</span>${rest}</h1>
                <div class="headline">${esc(profile.headline || u.professionalHeadline || 'Professional')}</div>
                <div class="meta">${metaLine(profile)}</div>
            </div>
        </div>`;
    return documentShell(styles, `<div class="wrap">${header}${buildSectionsHtml(profile)}</div>`);
}

const TEMPLATE_BUILDERS = {
    professional: htmlProfessional,
    classic: htmlClassic,
    modern: htmlModern,
    minimal: htmlMinimal,
    creative: htmlCreative
};

function buildCvHtml(profile, templateId) {
    const t = normalizeCvTemplate(templateId);
    const builder = TEMPLATE_BUILDERS[t] || TEMPLATE_BUILDERS.professional;
    const avatarSrc = resolveAvatarSrc(profile);
    return builder(profile, avatarSrc);
}

/**
 * Generate CV PDF from profile (+ populated user & projects).
 * @param {object} profile - Profile data with user and projects
 * @param {string} [templateId] - classic | modern | professional | minimal | creative
 */
export const generateCV_PDF = async (profile, templateId = 'professional') => {
    try {
        const uploadDir = path.join(__dirname, '../uploads/cvs');
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
        }

        const htmlContent = buildCvHtml(profile, templateId);

        const executablePath = resolveChromeExecutablePath();
        const launchOptions = {
            headless: true,
            args: PUPPETEER_LAUNCH_ARGS
        };
        if (executablePath) {
            launchOptions.executablePath = executablePath;
        }

        const browser = await puppeteer.launch(launchOptions);
        const page = await browser.newPage();
        await page.setUserAgent(
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
        );

        try {
            await page.setContent(htmlContent, { waitUntil: 'networkidle0' });
        } catch {
            await page.setContent(htmlContent, { waitUntil: 'domcontentloaded' });
        }
        await new Promise((resolve) => setTimeout(resolve, 400));

        const fileName = `resume_${profile.user?._id}_${Date.now()}.pdf`;
        const filePath = path.join(uploadDir, fileName);

        await page.pdf({
            path: filePath,
            format: 'A4',
            printBackground: true,
            margin: { top: '0', right: '0', bottom: '0', left: '0' }
        });

        await browser.close();

        return `/uploads/cvs/${fileName}`;
    } catch (error) {
        console.error('PDF Generation Error:', error);
        const msg = error?.message || error?.toString?.() || 'Unknown PDF generation failure';
        throw new Error(`PDF_GENERATION_FAILED: ${msg}`);
    }
};
