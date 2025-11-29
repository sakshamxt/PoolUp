import express from 'express';
import * as reportController from '../controllers/reportController.js';
import * as authController from '../controllers/authController.js';

const router = express.Router();

router.use(authController.protect);

router.post('/', reportController.createReport);

export default router;