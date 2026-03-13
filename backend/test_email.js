import 'dotenv/config';
import nodemailer from 'nodemailer';

const emailPass = process.env.EMAIL_PASS ? process.env.EMAIL_PASS.replace(/\s/g, '') : '';

console.log("USER:", process.env.EMAIL_USER);
console.log("PASS:", emailPass.substring(0, 4) + '...');

const transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 465,
    secure: true, // use SSL
    auth: {
        user: process.env.EMAIL_USER,
        pass: emailPass,
    },
});

transporter.sendMail({
    from: process.env.EMAIL_USER,
    to: 'kritibista66@gmail.com',
    subject: 'Test',
    text: 'Test content'
}).then(info => {
    console.log("SUCCESS:", info.messageId);
    process.exit(0);
}).catch(err => {
    console.error("FAILED:", err.message);
    process.exit(1);
});
