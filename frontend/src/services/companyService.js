import api from './api';

const companyService = {
    // Get currently logged-in recruiter's company
    getMyCompany: async () => {
        try {
            const response = await api.get('/companies/my');
            return response.data;
        } catch (error) {
            throw error;
        }
    },

    // Get company by ID
    getCompanyById: async (id) => {
        try {
            const response = await api.get(`/companies/${id}`);
            return response.data;
        } catch (error) {
            throw error;
        }
    },

    // Create company
    createCompany: async (companyData) => {
        try {
            const response = await api.post('/companies', companyData);
            return response.data;
        } catch (error) {
            throw error;
        }
    },

    // Update company
    updateCompany: async (id, companyData) => {
        try {
            const response = await api.put(`/companies/${id}`, companyData);
            return response.data;
        } catch (error) {
            throw error;
        }
    },

    // Get company statistics
    getCompanyStats: async () => {
        try {
            const response = await api.get('/companies/me/stats');
            return response.data;
        } catch (error) {
            throw error;
        }
    },

    // Get my company jobs
    getMyJobs: async (limit = 3) => {
        try {
            const response = await api.get(`/companies/me/jobs?limit=${limit}`);
            return response.data;
        } catch (error) {
            throw error;
        }
    },

    // Get recent jobs for a specific company
    getCompanyRecentJobs: async (id, limit = 3) => {
        try {
            const response = await api.get(`/companies/${id}/jobs?limit=${limit}`);
            return response.data;
        } catch (error) {
            throw error;
        }
    },

    // Admin: List all companies
    adminListCompanies: async () => {
        try {
            const response = await api.get('/admin/companies');
            return response.data;
        } catch (error) {
            throw error;
        }
    },

    // Admin: Get company details with summary
    adminGetCompanyDetails: async (id) => {
        try {
            const response = await api.get(`/admin/companies/${id}`);
            return response.data;
        } catch (error) {
            throw error;
        }
    },

    // Admin: Update company status
    adminUpdateCompanyStatus: async (id, status, comment) => {
        try {
            const response = await api.patch(`/admin/companies/${id}/status`, { status, comment });
            return response.data;
        } catch (error) {
            throw error;
        }
    },

    // Resubmit company for review after rejection
    resubmitForReview: async (id) => {
        try {
            const response = await api.post(`/companies/${id}/resubmit`);
            return response.data;
        } catch (error) {
            throw error;
        }
    },

    // Legacy/Shared Verify (can keep or redirect to new)
    verifyCompany: async (id, status, comment) => {
        try {
            const response = await api.patch(`/companies/${id}/status`, { status, comment });
            return response.data;
        } catch (error) {
            throw error;
        }
    },

    uploadLogo: async (id, file) => {
        const formData = new FormData();
        formData.append('logo', file);
        const response = await api.put(`/companies/${id}/logo`, formData, {
            headers: { 'Content-Type': 'multipart/form-data' }
        });
        return response.data;
    },

    uploadPhotos: async (id, files) => {
        const formData = new FormData();
        Array.from(files).forEach(file => formData.append('photos', file));
        const response = await api.put(`/companies/${id}/photos`, formData, {
            headers: { 'Content-Type': 'multipart/form-data' }
        });
        return response.data;
    }
};

export default companyService;
