import api from './api';

const applicationService = {
    apply: async (applicationData) => {
        try {
            const response = await api.post('/applications/apply', applicationData);
            return response.data;
        } catch (error) {
            throw error.response?.data || { message: 'Failed to submit application' };
        }
    },
    getMyApplications: async () => {
        try {
            const response = await api.get('/applications/my');
            return response.data;
        } catch (error) {
            throw error.response?.data || { message: 'Failed to fetch applications' };
        }
    },
    getMyInterviews: async () => {
        try {
            const response = await api.get('/applications/my-interviews');
            return response.data;
        } catch (error) {
            throw error.response?.data || { message: 'Failed to fetch upcoming interviews' };
        }
    },
    scheduleInterview: async (id, interviewData) => {
        try {
            const response = await api.put(`/applications/${id}/schedule-interview`, interviewData);
            return response.data;
        } catch (error) {
            throw error.response?.data || { message: 'Failed to schedule interview' };
        }
    },
    rescheduleInterview: async (id, interviewData) => {
        try {
            const response = await api.put(`/applications/${id}/reschedule-interview`, interviewData);
            return response.data;
        } catch (error) {
            throw error.response?.data || { message: 'Failed to reschedule interview' };
        }
    },
    cancelInterview: async (id, reason) => {
        try {
            const response = await api.delete(`/applications/${id}/cancel-interview`, { data: { reason } });
            return response.data;
        } catch (error) {
            throw error.response?.data || { message: 'Failed to cancel interview' };
        }
    },
    requestReschedule: async (id, requestData) => {
        try {
            const response = await api.post(`/applications/${id}/request-reschedule`, requestData);
            return response.data;
        } catch (error) {
            throw error.response?.data || { message: 'Failed to submit reschedule request' };
        }
    },
    approveRescheduleRequest: async (id, interviewData) => {
        try {
            const response = await api.put(`/applications/${id}/approve-reschedule-request`, interviewData);
            return response.data;
        } catch (error) {
            throw error.response?.data || { message: 'Failed to approve reschedule request' };
        }
    },
    rejectRescheduleRequest: async (id, feedback) => {
        try {
            const response = await api.put(`/applications/${id}/reject-reschedule-request`, { feedback });
            return response.data;
        } catch (error) {
            throw error.response?.data || { message: 'Failed to reject reschedule request' };
        }
    }
};

export default applicationService;
