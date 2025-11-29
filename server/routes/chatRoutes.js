import express from 'express';
import * as chatController from '../controllers/chatController.js';
import * as authController from '../controllers/authController.js';

const router = express.Router();
router.use(authController.protect);

router.get('/:poolId/messages', chatController.getPoolMessages);

export default router;