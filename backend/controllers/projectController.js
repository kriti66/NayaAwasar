import Project from '../models/Project.js';

export const getMyProjects = async (req, res) => {
    try {
        const projects = await Project.find({ userId: req.user.id }).sort({ createdAt: -1 });
        res.json(projects);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching projects' });
    }
};

export const addProject = async (req, res) => {
    try {
        const { title, description, techStack, githubUrl, liveDemoUrl } = req.body;
        const project = await Project.create({
            userId: req.user.id,
            title,
            description,
            techStack,
            githubUrl,
            liveDemoUrl
        });
        res.status(201).json(project);
    } catch (error) {
        res.status(500).json({ message: 'Error adding project' });
    }
};

export const updateProject = async (req, res) => {
    try {
        const { id } = req.params;
        const project = await Project.findOneAndUpdate(
            { _id: id, userId: req.user.id },
            req.body,
            { new: true }
        );
        if (!project) return res.status(404).json({ message: 'Project not found' });
        res.json(project);
    } catch (error) {
        res.status(500).json({ message: 'Error updating project' });
    }
};

export const deleteProject = async (req, res) => {
    try {
        const { id } = req.params;
        const project = await Project.findOneAndDelete({ _id: id, userId: req.user.id });
        if (!project) return res.status(404).json({ message: 'Project not found' });
        res.json({ message: 'Project deleted' });
    } catch (error) {
        res.status(500).json({ message: 'Error deleting project' });
    }
};
