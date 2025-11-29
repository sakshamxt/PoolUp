import express from 'express';
import * as locationController from '../controllers/locationController.js';
import * as authController from '../controllers/authController.js';

const router = express.Router();

// Protect all routes
router.use(authController.protect);

// User Routes
router.get('/', locationController.getAllLocations);

// Admin Routes
// All routes after this point are restricted to 'admin'
router.use(authController.restrictTo('admin'));

router.post('/', locationController.createLocation);
router.delete('/:id', locationController.deleteLocation);

export default router;