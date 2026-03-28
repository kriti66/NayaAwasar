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
    },

    // Recruiter-initiated reschedule proposal (jobseeker accepts/rejects)
    proposeRecruiterReschedule: async (id, payload) => {
        try {
            const response = await api.put(`/applications/${id}/recruiter-propose-reschedule`, payload);
            return response.data;
        } catch (error) {
            throw error.response?.data || { message: 'Failed to send reschedule request' };
        }
    },
    acceptRecruiterReschedule: async (id) => {
        try {
            const response = await api.put(`/applications/${id}/recruiter-reschedule/accept`);
            return response.data;
        } catch (error) {
            const msg =
                (typeof error.response?.data?.message === 'string' && error.response.data.message) ||
                'Failed to accept reschedule request';
            const err = new Error(msg);
            err.response = error.response;
            throw err;
        }
    },
    rejectRecruiterReschedule: async (id, payload = {}) => {
        try {
            const response = await api.put(`/applications/${id}/recruiter-reschedule/reject`, payload);
            return response.data;
        } catch (error) {
            const msg =
                (typeof error.response?.data?.message === 'string' && error.response.data.message) ||
                'Failed to reject reschedule request';
            const err = new Error(msg);
            err.response = error.response;
            throw err;
        }
    }
};

export default applicationService;
