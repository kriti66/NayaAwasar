import api from './api';

const profileService = {
    // Get full profile with computed strength
    getMyProfile: async () => {
        const response = await api.get('/profile/me');
        return response.data;
    },

    // Update basic info (headline, summary, location, preferences)
    updateProfile: async (data) => {
        const response = await api.patch('/profile/me', data);
        return response.data;
    },

    // Visibility
    updateVisibility: async (visible) => {
        const response = await api.patch('/profile/me/visibility', { visible });
        return response.data;
    },

    // Skills
    updateSkills: async (skills) => {
        const response = await api.post('/profile/me/skills', { skills });
        return response.data;
    },

    // Experience
    addExperience: async (data) => {
        const response = await api.post('/profile/me/experience', data);
        return response.data;
    },
    updateExperience: async (id, data) => {
        const response = await api.patch(`/profile/me/experience/${id}`, data);
        return response.data;
    },
    deleteExperience: async (id) => {
        const response = await api.delete(`/profile/me/experience/${id}`);
        return response.data;
    },

    // Education
    addEducation: async (data) => {
        const response = await api.post('/profile/me/education', data);
        return response.data;
    },
    updateEducation: async (id, data) => {
        const response = await api.patch(`/profile/me/education/${id}`, data);
        return response.data;
    },
    deleteEducation: async (id) => {
        const response = await api.delete(`/profile/me/education/${id}`);
        return response.data;
    },

    // Resume
    uploadResume: async (formData) => {
        const response = await api.post('/profile/me/resume', formData, {
            headers: { 'Content-Type': 'multipart/form-data' }
        });
        return response.data;
    },
    getResume: async () => {
        const response = await api.get('/profile/me/resume');
        return response.data;
    },
    deleteResume: async () => {
        const response = await api.delete('/profile/me/resume');
        return response.data;
    },

    // CV Methods
    generateCV: async () => {
        const response = await api.post('/profile/generate-cv');
        return response.data;
    },

    downloadGeneratedCV: async (fileName = 'resume.pdf') => {
        try {
            const response = await api.get('/profile/cv/download', {
                responseType: 'blob'
            });

            // Create blob link to download
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', fileName);
            document.body.appendChild(link);
            link.click();
            link.remove();
            window.URL.revokeObjectURL(url);
        } catch (error) {
            console.error('Download CV error:', error);
            throw error;
        }
    },

    viewGeneratedCV: async () => {
        try {
            const response = await api.get('/profile/cv/view', {
                responseType: 'blob'
            });
            const file = new Blob([response.data], { type: 'application/pdf' });
            const fileURL = URL.createObjectURL(file);
            window.open(fileURL, '_blank');
        } catch (error) {
            console.error('View CV error:', error);
            throw error;
        }
    },

    downloadResume: async () => {
        // Usually handled by window.open or direct link, but API call allows blob handling
        const response = await api.get('/profile/me/resume/download', { responseType: 'blob' });
        return response.data;
    },

    // Profile Image
    uploadProfileImage: async (formData) => {
        const response = await api.patch('/users/upload-profile-image', formData, {
            headers: { 'Content-Type': 'multipart/form-data' }
        });
        return response.data;
    }
};

export default profileService;
