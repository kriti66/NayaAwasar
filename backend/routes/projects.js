import express from 'express';
import {
    getMyProjects,
    addProject,
    updateProject,
    deleteProject
} from '../controllers/projectController.js';

const router = express.Router();

router.get('/me', getMyProjects);
router.post('/me', addProject);
router.patch('/me/:id', updateProject);
router.delete('/me/:id', deleteProject);

export default router;
