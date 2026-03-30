import express from 'express';
import { logInteraction, updateFeedback } from '../controllers/chatbotController.js';

const router = express.Router();

router.post('/interaction', logInteraction);
router.patch('/interaction/:turnId/feedback', updateFeedback);

export default router;
