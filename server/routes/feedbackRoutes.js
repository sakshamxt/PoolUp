import express from 'express';
import * as feedbackController from '../controllers/feedbackController.js';
import * as authController from '../controllers/authController.js';

const router = express.Router();
router.use(authController.protect);

router.post('/', feedbackController.submitFeedback);

export default router;