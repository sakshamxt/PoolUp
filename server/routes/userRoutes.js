import express from 'express';
import * as userController from '../controllers/userController.js';
import * as authController from '../controllers/authController.js';

const router = express.Router();

// Protect all routes
router.use(authController.protect);

// Current User Routes
router.get('/me', userController.getMe);
router.put('/gender', userController.updateGender);
router.put('/fcm-token', userController.updateFCMToken);

export default router;