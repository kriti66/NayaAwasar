import ContactMessage from '../models/ContactMessage.js';
import sendEmail from '../utils/sendEmail.js';

/**
 * @desc    Submit a contact message (public route - no auth)
 * @route   POST /api/contact
 */
export const submitContactMessage = async (req, res) => {
    try {
        const { fullName, email, subject, message } = req.body;

        // Validation
        if (!fullName?.trim()) return res.status(400).json({ message: 'Full name is required.' });
        if (!email?.trim()) return res.status(400).json({ message: 'Email is required.' });
        if (!/^\S+@\S+\.\S+$/.test(email)) return res.status(400).json({ message: 'Please provide a valid email address.' });
        if (!subject?.trim()) return res.status(400).json({ message: 'Subject is required.' });
        if (!message?.trim()) return res.status(400).json({ message: 'Message is required.' });

        // Save the contact message
        const contactMsg = await ContactMessage.create({
            fullName: fullName.trim(),
            email: email.trim(),
            subject: subject.trim(),
            message: message.trim()
        });

        // Send automatic confirmation email to user
        try {
            await sendEmail({
                to: email.trim(),
                subject: `We received your message — ${subject.trim()}`,
                text: `
                    <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 0;">
                        <div style="background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%); padding: 32px 24px; border-radius: 12px 12px 0 0;">
                            <h1 style="color: #29a08e; margin: 0; font-size: 24px;">Naya Awasar</h1>
                            <p style="color: #94a3b8; margin-top: 4px; font-size: 14px;">Thank you for reaching out</p>
                        </div>
                        <div style="background: #ffffff; padding: 32px 24px; border: 1px solid #e2e8f0; border-top: none;">
                            <p style="color: #334155; font-size: 15px; line-height: 1.6;">Hi <strong>${fullName.trim()}</strong>,</p>
                            <p style="color: #475569; font-size: 14px; line-height: 1.7;">
                                Thank you for contacting Naya Awasar. Your message has been received successfully. 
                                Our support team will review your inquiry and respond within <strong>24 hours</strong>.
                            </p>
                            <div style="background: #f8fafc; border-left: 3px solid #29a08e; padding: 12px 16px; margin: 20px 0; border-radius: 0 8px 8px 0;">
                                <p style="color: #64748b; font-size: 12px; margin: 0 0 4px; text-transform: uppercase; letter-spacing: 0.5px;">Your Subject</p>
                                <p style="color: #1e293b; font-size: 14px; margin: 0; font-weight: 600;">${subject.trim()}</p>
                            </div>
                            <p style="color: #475569; font-size: 14px; line-height: 1.7;">
                                If you have any additional information to share, feel free to reply to this email.
                            </p>
                        </div>
                        <div style="background: #f8fafc; padding: 20px 24px; border: 1px solid #e2e8f0; border-top: none; border-radius: 0 0 12px 12px; text-align: center;">
                            <p style="color: #94a3b8; font-size: 12px; margin: 0;">Warm regards,<br/><strong style="color: #29a08e;">Naya Awasar Team</strong></p>
                        </div>
                    </div>
                `
            });
        } catch (emailErr) {
            // Don't fail the submission if confirmation email fails
            console.error('Failed to send confirmation email:', emailErr.message);
        }

        res.status(201).json({
            message: 'Thank you for contacting us. We have received your message and will get back to you within 24 hours.',
            id: contactMsg._id
        });

    } catch (error) {
        console.error('Contact submission error:', error);
        res.status(500).json({ message: 'Failed to submit your message. Please try again.' });
    }
};

/**
 * @desc    Get all contact messages (admin only)
 * @route   GET /api/contact
 */
export const getAllContactMessages = async (req, res) => {
    try {
        const { status } = req.query;
        const filter = {};
        if (status && ['NEW', 'READ', 'REPLIED', 'RESOLVED'].includes(status)) {
            filter.status = status;
        }

        const messages = await ContactMessage.find(filter)
            .sort({ createdAt: -1 })
            .populate('repliedBy', 'fullName')
            .lean();

        res.json(messages);
    } catch (error) {
        console.error('Fetch contact messages error:', error);
        res.status(500).json({ message: 'Failed to load contact messages.' });
    }
};

/**
 * @desc    Get a single contact message by ID (admin only)
 * @route   GET /api/contact/:id
 */
export const getContactMessageById = async (req, res) => {
    try {
        const message = await ContactMessage.findById(req.params.id)
            .populate('repliedBy', 'fullName')
            .lean();

        if (!message) {
            return res.status(404).json({ message: 'Contact message not found.' });
        }

        res.json(message);
    } catch (error) {
        console.error('Fetch contact message error:', error);
        res.status(500).json({ message: 'Failed to load contact message.' });
    }
};

/**
 * @desc    Update contact message status (admin only)
 * @route   PATCH /api/contact/:id/status
 */
export const updateContactStatus = async (req, res) => {
    try {
        const { status } = req.body;
        if (!status || !['NEW', 'READ', 'REPLIED', 'RESOLVED'].includes(status)) {
            return res.status(400).json({ message: 'Invalid status value.' });
        }

        const message = await ContactMessage.findByIdAndUpdate(
            req.params.id,
            { status },
            { new: true }
        );

        if (!message) {
            return res.status(404).json({ message: 'Contact message not found.' });
        }

        res.json({ message: `Status updated to ${status}`, contact: message });
    } catch (error) {
        console.error('Update status error:', error);
        res.status(500).json({ message: 'Failed to update status.' });
    }
};

/**
 * @desc    Send admin reply to a contact message (admin only)
 * @route   POST /api/contact/:id/reply
 */
export const replyToContactMessage = async (req, res) => {
    try {
        const { reply } = req.body;

        if (!reply?.trim()) {
            return res.status(400).json({ message: 'Reply message cannot be empty.' });
        }

        const contactMsg = await ContactMessage.findById(req.params.id);
        if (!contactMsg) {
            return res.status(404).json({ message: 'Contact message not found.' });
        }

        // Send the reply email to the user
        await sendEmail({
            to: contactMsg.email,
            subject: `Reply: ${contactMsg.subject}`,
            text: `
                <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 0;">
                    <div style="background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%); padding: 32px 24px; border-radius: 12px 12px 0 0;">
                        <h1 style="color: #29a08e; margin: 0; font-size: 24px;">Naya Awasar</h1>
                        <p style="color: #94a3b8; margin-top: 4px; font-size: 14px;">Support Reply</p>
                    </div>
                    <div style="background: #ffffff; padding: 32px 24px; border: 1px solid #e2e8f0; border-top: none;">
                        <p style="color: #334155; font-size: 15px; line-height: 1.6;">Hi <strong>${contactMsg.fullName}</strong>,</p>
                        <p style="color: #475569; font-size: 14px; line-height: 1.7;">
                            Thank you for contacting us. Here is our response to your inquiry:
                        </p>
                        <div style="background: #f0fdf9; border-left: 3px solid #29a08e; padding: 16px; margin: 20px 0; border-radius: 0 8px 8px 0;">
                            <p style="color: #1e293b; font-size: 14px; margin: 0; line-height: 1.7; white-space: pre-line;">${reply.trim()}</p>
                        </div>
                        <div style="background: #f8fafc; padding: 12px 16px; margin: 20px 0; border-radius: 8px; border: 1px solid #e2e8f0;">
                            <p style="color: #64748b; font-size: 12px; margin: 0 0 4px; text-transform: uppercase; letter-spacing: 0.5px;">Your Original Message</p>
                            <p style="color: #64748b; font-size: 13px; margin: 0; font-style: italic;">"${contactMsg.message}"</p>
                        </div>
                        <p style="color: #475569; font-size: 14px; line-height: 1.7;">
                            If you need further assistance, please don't hesitate to reach out again.
                        </p>
                    </div>
                    <div style="background: #f8fafc; padding: 20px 24px; border: 1px solid #e2e8f0; border-top: none; border-radius: 0 0 12px 12px; text-align: center;">
                        <p style="color: #94a3b8; font-size: 12px; margin: 0;">Warm regards,<br/><strong style="color: #29a08e;">Naya Awasar Team</strong></p>
                    </div>
                </div>
            `
        });

        // Update the contact message
        contactMsg.adminReply = reply.trim();
        contactMsg.repliedAt = new Date();
        contactMsg.repliedBy = req.user.id;
        contactMsg.status = 'REPLIED';
        await contactMsg.save();

        const populated = await ContactMessage.findById(contactMsg._id)
            .populate('repliedBy', 'fullName')
            .lean();

        res.json({ message: 'Reply sent successfully.', contact: populated });

    } catch (error) {
        console.error('Reply error:', error);
        if (error.code === 'EAUTH' || error.code === 'ECONNREFUSED') {
            return res.status(500).json({ message: 'Email service error. Please check email configuration.' });
        }
        res.status(500).json({ message: 'Failed to send reply. Please try again.' });
    }
};
