import puppeteer from 'puppeteer';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/** Build full backend base URL for images (Puppeteer needs absolute URLs) */
const getBaseUrl = () => {
    const base = process.env.BASE_URL || process.env.API_URL;
    if (base) return base.replace(/\/api\/?$/, '').replace(/\/$/, '');
    const port = process.env.PORT || 5001;
    return `http://localhost:${port}`;
};

/** Default avatar SVG (initials in circle) as data URI when no profile image */
const getDefaultAvatarSvg = (initial) => {
    const letter = encodeURIComponent((initial || 'J').toUpperCase().charAt(0));
    return `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Crect fill='%23e5e7eb' width='100' height='100' rx='50'/%3E%3Ctext x='50' y='58' font-size='40' font-weight='600' fill='%236b7280' text-anchor='middle' font-family='Helvetica,Arial,sans-serif'%3E${letter}%3C/text%3E%3C/svg%3E`;
};

export const generateCV_PDF = async (profile) => {
    try {
        // Ensure directory exists
        const uploadDir = path.join(__dirname, '../uploads/cvs');
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
        }

        const browser = await puppeteer.launch({
            headers: { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/58.0.3029.110 Safari/537.36" },
            args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage', '--disable-gpu']
        });
        const page = await browser.newPage();

        // Template HTML (Professional, Clean, Printable)
        const htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="utf-8">
            <style>
                @page { margin: 0; size: A4; }
                body {
                    font-family: 'Helvetica', 'Arial', sans-serif;
                    color: #333;
                    line-height: 1.5;
                    margin: 0;
                    padding: 40px;
                    background: #fff;
                    -webkit-font-smoothing: antialiased;
                }
                .header {
                    display: flex;
                    align-items: center;
                    gap: 18px;
                    border-bottom: 2px solid #2D9B82;
                    padding-bottom: 16px;
                    margin-bottom: 24px;
                }
                .header-avatar {
                    width: 60px;
                    height: 60px;
                    min-width: 60px;
                    min-height: 60px;
                    border-radius: 50%;
                    object-fit: cover;
                    border: 2px solid #2D9B82;
                    background: #f3f4f6;
                }
                .header-content {
                    flex: 1;
                    min-width: 0;
                }
                .name {
                    font-size: 22px;
                    font-weight: 700;
                    color: #111827;
                    text-transform: uppercase;
                    letter-spacing: 0.5px;
                    margin: 0 0 2px 0;
                }
                .headline {
                    font-size: 13px;
                    color: #2D9B82;
                    font-weight: 600;
                    margin: 0 0 4px 0;
                }
                .meta {
                    font-size: 11px;
                    color: #666;
                    line-height: 1.5;
                }
                .section-title {
                    font-size: 14px;
                    font-weight: 700;
                    color: #2D9B82;
                    text-transform: uppercase;
                    letter-spacing: 1px;
                    margin-bottom: 15px;
                    border-bottom: 1px solid #e5e7eb;
                    padding-bottom: 5px;
                    margin-top: 25px;
                }
                .content-block {
                    margin-bottom: 20px;
                }
                .summary {
                    font-size: 14px;
                    color: #4b5563;
                    text-align: justify;
                }
                .job-title {
                    font-weight: 700;
                    font-size: 15px;
                    color: #1f2937;
                }
                .company-row {
                    display: flex;
                    justify-content: space-between;
                    font-size: 13px;
                    color: #6b7280;
                    margin-bottom: 5px;
                }
                .job-desc {
                    font-size: 13px;
                    color: #4b5563;
                }
                .skills-container {
                    display: flex;
                    flex-wrap: wrap;
                    gap: 8px;
                }
                .skill-tag {
                    background: #f3f4f6;
                    color: #374151;
                    padding: 4px 10px;
                    border-radius: 4px;
                    font-size: 12px;
                    font-weight: 500;
                }
                .project-item {
                    margin-bottom: 15px;
                }
                .project-title {
                    font-weight: 700;
                    font-size: 14px;
                    color: #111827;
                }
                .project-link {
                    font-size: 12px;
                    color: #2D9B82;
                    text-decoration: none;
                }
                .education-item {
                    margin-bottom: 15px;
                }
            </style>
        </head>
        <body>
            <div class="header">
                <img
                    class="header-avatar"
                    src="${(profile.user?.profileImage && profile.user.profileImage.trim())
                        ? (profile.user.profileImage.startsWith('http') ? profile.user.profileImage : getBaseUrl() + (profile.user.profileImage.startsWith('/') ? '' : '/') + profile.user.profileImage)
                        : getDefaultAvatarSvg(profile.user?.fullName?.charAt(0))}"
                    alt="${profile.user?.fullName || 'Profile'} photo"
                />
                <div class="header-content">
                    <h1 class="name">${profile.user?.fullName || 'Job Seeker'}</h1>
                    <div class="headline">${profile.headline || profile.user?.professionalHeadline || 'Professional'}</div>
                    <div class="meta">
                        ${[profile.location, profile.user?.email, profile.user?.phoneNumber].filter(Boolean).join(' \u2022 ')}
                    </div>
                </div>
            </div>

            ${profile.summary ? `
            <div class="section-title">Professional Summary</div>
            <div class="content-block summary">
                ${profile.summary}
            </div>
            ` : ''}

            ${profile.skills && profile.skills.length > 0 ? `
            <div class="section-title">Core Skills</div>
            <div class="content-block skills-container">
                ${profile.skills.map(skill => `<span class="skill-tag">${skill}</span>`).join('')}
            </div>
            ` : ''}

            ${profile.experience && profile.experience.length > 0 ? `
            <div class="section-title">Work Experience</div>
            ${profile.experience.map(exp => `
                <div class="content-block">
                    <div class="job-title">${exp.role}</div>
                    <div class="company-row">
                        <span>${exp.company}</span>
                        <span>${new Date(exp.startDate).getFullYear()} - ${exp.current ? 'Present' : new Date(exp.endDate).getFullYear()}</span>
                    </div>
                    ${exp.description ? `<div class="job-desc">${exp.description}</div>` : ''}
                </div>
            `).join('')}
            ` : ''}

            ${profile.education && profile.education.length > 0 ? `
            <div class="section-title">Education</div>
            ${profile.education.map(edu => `
                <div class="content-block education-item">
                    <div class="job-title">${edu.degree}</div>
                    <div class="company-row">
                        <span>${edu.institute}</span>
                        <span>${edu.startYear} - ${edu.current ? 'Present' : edu.endYear}</span>
                    </div>
                </div>
            `).join('')}
            ` : ''}

            ${profile.projects && profile.projects.length > 0 ? `
            <div class="section-title">Key Projects</div>
            ${profile.projects.map(proj => `
                <div class="content-block project-item">
                    <div class="project-title">${proj.title}
                        ${proj.liveDemoUrl ? `<a href="${proj.liveDemoUrl}" class="project-link" target="_blank">[View Live]</a>` : ''}
                    </div>
                    ${proj.description ? `<div class="job-desc">${proj.description}</div>` : ''}
                    ${proj.techStack && proj.techStack.length > 0 ? `
                        <div style="font-size:11px; color:#6b7280; margin-top:2px;">Tech: ${proj.techStack.join(', ')}</div>
                    ` : ''}
                </div>
            `).join('')}
            ` : ''}

        </body>
        </html>
        `;

        await page.setContent(htmlContent, { waitUntil: 'networkidle0' });

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
        console.error("PDF Generation Error:", error);
        throw error;
    }
};
