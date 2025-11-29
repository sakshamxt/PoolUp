import express from 'express';
import * as poolController from '../controllers/poolController.js';
import * as authController from '../controllers/authController.js';

const router = express.Router();

// Protect all pool routes
router.use(authController.protect);

// My Pools
router.get('/mypools', poolController.getMyPools);

// General Pool Routes
router
  .route('/')
  .get(poolController.getPools)   // Find pools
  .post(poolController.createPool); // Create pool

// Single Pool Routes
router.get('/:id', poolController.getPool);
router.post('/:id/join', poolController.joinPool);

// Request Management Routes
router.post('/:poolId/requests/:requestId/approve', poolController.approveRequest);
router.post('/:poolId/requests/:requestId/reject', poolController.rejectRequest);

export default router;