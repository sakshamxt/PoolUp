import User from '../models/userModel.js';
import AppError from '../utils/appError.js';

/**
 * GET /api/user/me
 * Returns the current logged-in user's profile.
 */
export const getMe = (req, res, next) => {
  // req.user is already set by the 'protect' middleware
  res.status(200).json({
    status: 'success',
    data: {
      user: req.user,
    },
  });
};

/**
 * PUT /api/user/gender
 * Updates the user's gender.
 */
export const updateGender = async (req, res, next) => {
  try {
    const { gender } = req.body;

    // 1. Validation
    if (!['male', 'female', 'other'].includes(gender)) {
      return next(new AppError('Gender must be male, female, or other.', 400));
    }

    // 2. Update user
    // We use findByIdAndUpdate to avoid running the password hashing pre-save hook
    const updatedUser = await User.findByIdAndUpdate(
      req.user.id,
      { gender: gender },
      {
        new: true, // Return the new document
        runValidators: true,
      }
    );

    res.status(200).json({
      status: 'success',
      data: {
        user: updatedUser,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * PUT /api/user/fcm-token
 * Updates the Firebase Cloud Messaging token for push notifications.
 */
export const updateFCMToken = async (req, res, next) => {
  try {
    const { fcmToken } = req.body;

    if (!fcmToken) {
      return next(new AppError('Please provide an FCM token.', 400));
    }

    const updatedUser = await User.findByIdAndUpdate(
      req.user.id,
      { fcmToken: fcmToken },
      {
        new: true,
        runValidators: true,
      }
    );

    res.status(200).json({
      status: 'success',
      message: 'FCM Token updated successfully',
    });
  } catch (error) {
    next(error);
  }
};