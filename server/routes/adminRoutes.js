import express from 'express';
import * as adminController from '../controllers/adminController.js';
import * as locationController from '../controllers/locationController.js'; // Reuse location logic
import * as authController from '../controllers/authController.js';

const router = express.Router();

// --- GLOBAL PROTECTION ---
// All routes below require login AND 'admin' role
router.use(authController.protect);
router.use(authController.restrictTo('admin'));

// Dashboard
router.get('/dashboard', adminController.getDashboardStats);

// User Management
router.get('/users', adminController.getAllUsers);
router.put('/users/:userId/ban', adminController.banUser);
router.put('/users/:userId/reliability', adminController.updateUserReliability);

// Report Management
router.get('/reports', adminController.getAllReports);
router.put('/reports/:reportId', adminController.updateReportStatus);

// Pool Management
router.delete('/pools/:poolId', adminController.deletePool);

// Location Management
router.post('/locations', locationController.createLocation);
router.delete('/locations/:id', locationController.deleteLocation);

export default router;