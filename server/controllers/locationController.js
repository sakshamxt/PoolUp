import Location from '../models/locationModel.js';
import AppError from '../utils/appError.js';

// --- Public / User Methods ---

/**
 * GET /api/locations
 * Returns all pre-defined locations (Hubs & Campus).
 */
export const getAllLocations = async (req, res, next) => {
  try {
    const locations = await Location.find().sort({ name: 1 });

    res.status(200).json({
      status: 'success',
      results: locations.length,
      data: {
        locations,
      },
    });
  } catch (error) {
    next(error);
  }
};

// --- Admin Methods ---

/**
 * POST /api/admin/locations
 * Creates a new pre-defined location.
 */
export const createLocation = async (req, res, next) => {
  try {
    const { name, type } = req.body;

    const newLocation = await Location.create({ name, type });

    res.status(201).json({
      status: 'success',
      data: {
        location: newLocation,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * DELETE /api/admin/locations/:id
 * Deletes a location by ID.
 */
export const deleteLocation = async (req, res, next) => {
  try {
    const location = await Location.findByIdAndDelete(req.params.id);

    if (!location) {
      return next(new AppError('No location found with that ID', 404));
    }

    res.status(204).json({
      status: 'success',
      data: null,
    });
  } catch (error) {
    next(error);
  }
};