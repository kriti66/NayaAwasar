import api from './api';

const projectService = {
    getMyProjects: async () => {
        const response = await api.get('/projects/me');
        return response.data;
    },
    addProject: async (data) => {
        const response = await api.post('/projects/me', data);
        return response.data;
    },
    updateProject: async (id, data) => {
        const response = await api.patch(`/projects/me/${id}`, data);
        return response.data;
    },
    deleteProject: async (id) => {
        const response = await api.delete(`/projects/me/${id}`);
        return response.data;
    }
};

export default projectService;
