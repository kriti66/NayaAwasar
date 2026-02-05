import api from './api';

const profileService = {
    getProfile: async () => {
        const response = await api.get('/profile');
        return response.data;
    },

    updateProfile: async (data) => {
        const response = await api.put('/profile', data);
        return response.data;
    },

    uploadAvatar: async (formData) => {
        const response = await api.post('/upload/avatar', formData, {
            headers: { 'Content-Type': 'multipart/form-data' }
        });
        return response.data;
    },

    uploadResume: async (formData) => {
        const response = await api.post('/upload/cv', formData, {
            headers: { 'Content-Type': 'multipart/form-data' }
        });
        return response.data;
    }
};

export default profileService;
