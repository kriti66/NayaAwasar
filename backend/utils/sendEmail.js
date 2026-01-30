import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config();

const sendEmail = async (options) => {
    try {
        const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASS,
            },
        });

        await transporter.sendMail({
            from: `Naya Awasar <${process.env.EMAIL_USER}>`,
            to: options.to,
            subject: options.subject,
            html: options.text,
        });

        console.log("✅ Email sent successfully");

    } catch (error) {
        console.error("❌ Nodemailer error:", error);
        throw error;
    }
};
export default sendEmail;
