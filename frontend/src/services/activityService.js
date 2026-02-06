import api from './api';

const activityService = {
    getMyActivity: async (limit = 5) => {
        const response = await api.get(`/activity/me?limit=${limit}`);
        return response.data;
    }
};

export default activityService;
