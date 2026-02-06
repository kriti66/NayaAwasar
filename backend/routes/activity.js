import express from 'express';
import { getMyActivity } from '../controllers/activityController.js';

const router = express.Router();

router.get('/me', getMyActivity);

export default router;
