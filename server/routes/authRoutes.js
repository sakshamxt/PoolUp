import express from 'express';
import * as authController from '../controllers/authController.js';

const router = express.Router();

router.post('/google', authController.googleAuth);
router.post('/register', authController.register);
router.get('/verify/:token', authController.verifyEmail);
router.post('/login', authController.login);

export default router;