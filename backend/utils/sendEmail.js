import nodemailer from 'nodemailer';

const RESEND_API_BASE = 'https://api.resend.com/emails';
const resendApiKey = String(process.env.RESEND_API_KEY || '').trim();
const resendFrom =
    String(process.env.EMAIL_FROM || '').trim() ||
    String(process.env.RESEND_FROM || '').trim() ||
    (process.env.EMAIL_USER ? `Naya Awasar <${String(process.env.EMAIL_USER).trim()}>` : '');

const emailPass = process.env.EMAIL_PASS ? process.env.EMAIL_PASS.replace(/\s/g, '') : '';

const smtpTransporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 465,
    secure: true,
    auth: {
        user: process.env.EMAIL_USER,
        pass: emailPass,
    },
    connectionTimeout: 20000,
    greetingTimeout: 15000,
    socketTimeout: 30000,
});

let hasVerifiedSmtp = false;
const verifySmtpTransporter = async () => {
    if (hasVerifiedSmtp) return;
    await smtpTransporter.verify();
    hasVerifiedSmtp = true;
    console.log('✅ SMTP transporter verified successfully');
};

const sendWithResend = async ({ to, subject, html, plainText }) => {
    if (!resendApiKey) {
        throw new Error('RESEND_API_KEY is missing');
    }
    if (!resendFrom) {
        throw new Error('Sender identity missing. Set EMAIL_FROM (or RESEND_FROM) for Resend.');
    }

    const response = await fetch(RESEND_API_BASE, {
        method: 'POST',
        headers: {
            Authorization: `Bearer ${resendApiKey}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            from: resendFrom,
            to: Array.isArray(to) ? to : [to],
            subject,
            html,
            text: plainText
        })
    });

    const payload = await response.json().catch(() => ({}));
    if (!response.ok) {
        const msg = payload?.message || payload?.error || `Resend API error (${response.status})`;
        const err = new Error(msg);
        err.code = 'RESEND_API_ERROR';
        err.responseStatus = response.status;
        err.responseBody = payload;
        throw err;
    }

    return payload;
};

const sendEmail = async (options) => {
    const html = options.html || options.text;
    const plainText =
        options.plainText ||
        (typeof options.text === 'string' ? options.text.replace(/<[^>]*>/g, ' ') : undefined);

    try {
        console.log("📨 Attempting to send email to:", options.to);

        // Primary provider for production-safe delivery (no SMTP timeout dependency).
        if (resendApiKey) {
            const info = await sendWithResend({
                to: options.to,
                subject: options.subject,
                html,
                plainText
            });
            console.log('✅ Email sent via Resend:', info?.id || 'ok');
            return info;
        }

        // Fallback for local/dev when Resend is not configured.
        if (!process.env.EMAIL_USER || !emailPass) {
            throw new Error("Missing email provider credentials. Set RESEND_API_KEY + EMAIL_FROM (preferred) or EMAIL_USER + EMAIL_PASS.");
        }
        await verifySmtpTransporter();

        const mailOptions = {
            from: `"Naya Awasar" <${process.env.EMAIL_USER}>`,
            to: options.to,
            subject: options.subject,
            html,
            text: plainText,
        };

        const info = await smtpTransporter.sendMail(mailOptions);
        console.log("✅ Email sent via SMTP. Message ID:", info.messageId);
        return info;

    } catch (error) {
        console.error("❌ Email send error detail:", {
            message: error.message,
            code: error.code,
            command: error.command,
            response: error.response,
            responseStatus: error.responseStatus,
            responseBody: error.responseBody
        });
        throw error;
    }
};

export default sendEmail;
