import Report from '../models/reportModel.js';
import User from '../models/userModel.js';
import AppError from '../utils/appError.js';

export const createReport = async (req, res, next) => {
  try {
    const { reportedUserId, reason, comment } = req.body;

    // Validation
    if (req.user._id.equals(reportedUserId)) {
      return next(new AppError('You cannot report yourself.', 400));
    }

    // Check if user exists
    const reportedUser = await User.findById(reportedUserId);
    if (!reportedUser) return next(new AppError('User not found.', 404));

    const newReport = await Report.create({
      reporter: req.user._id,
      reportedUser: reportedUserId,
      reason,
      comment,
    });

    res.status(201).json({
      status: 'success',
      message: 'Report submitted successfully.',
      data: { report: newReport },
    });
  } catch (error) {
    next(error);
  }
};