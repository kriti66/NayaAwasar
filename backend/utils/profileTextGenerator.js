import User from '../models/User.js';
import Profile from '../models/Profile.js';

export const generateUserProfileText = async (userId) => {
    try {
        const user = await User.findById(userId);
        const profile = await Profile.findOne({ userId });

        if (!user) return;

        let profileText = '';

        // Add User fields
        if (user.bio) profileText += `${user.bio} `;
        if (user.professionalHeadline) profileText += `${user.professionalHeadline} `;
        if (user.cvText) profileText += `${user.cvText} `;

        // Add Profile fields
        if (profile) {
            if (profile.headline) profileText += `${profile.headline} `;
            if (profile.summary) profileText += `${profile.summary} `;

            if (profile.skills && Array.isArray(profile.skills)) {
                profileText += `${profile.skills.join(' ')} `;
            }

            if (profile.experience && Array.isArray(profile.experience)) {
                profile.experience.forEach(exp => {
                    profileText += `${exp.role || ''} ${exp.company || ''} ${exp.description || ''} `;
                });
            }

            if (profile.education && Array.isArray(profile.education)) {
                profile.education.forEach(edu => {
                    profileText += `${edu.degree || ''} ${edu.institute || ''} `;
                });
            }
        }

        // Clean up text
        profileText = profileText.replace(/\s+/g, ' ').trim();

        // Update User
        user.userProfileText = profileText;
        await user.save();

        console.log(`Updated userProfileText for user ${userId}`);

    } catch (error) {
        console.error('Error generating user profile text:', error);
    }
};
