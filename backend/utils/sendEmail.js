import nodemailer from 'nodemailer';

const sendEmail = async (options) => {
    try {
        console.log("📨 Attempting to send email to:", options.to);

        // Gmail SMTP configuration using App Password
        const emailPass = process.env.EMAIL_PASS ? process.env.EMAIL_PASS.replace(/\s/g, '') : '';

        if (!process.env.EMAIL_USER || !emailPass) {
            throw new Error("Missing EMAIL_USER or EMAIL_PASS in environment variables");
        }

        const transporter = nodemailer.createTransport({
            host: 'smtp.gmail.com',
            port: 465,
            secure: true, // use SSL
            auth: {
                user: process.env.EMAIL_USER,
                pass: emailPass,
            },
        });

        const mailOptions = {
            from: `"Naya Awasar" <${process.env.EMAIL_USER}>`,
            to: options.to,
            subject: options.subject,
            html: options.text, // Treating text as HTML for formatting
        };

        const info = await transporter.sendMail(mailOptions);
        console.log("✅ Email sent successfully! Message ID:", info.messageId);
        return info;

    } catch (error) {
        console.error("❌ Nodemailer error detail:", {
            message: error.message,
            code: error.code,
            command: error.command,
            response: error.response
        });
        throw error;
    }
};

export default sendEmail;
