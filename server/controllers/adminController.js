import User from '../models/userModel.js';
import Pool from '../models/poolModel.js';
import Report from '../models/reportModel.js';
import AppError from '../utils/appError.js';

// --- Dashboard ---

/**
 * GET /api/admin/dashboard
 * Returns high-level statistics for the admin dashboard.
 */
export const getDashboardStats = async (req, res, next) => {
  try {
    const [userCount, poolCount, pendingReportsCount] = await Promise.all([
      User.countDocuments(),
      Pool.countDocuments({ status: 'active' }),
      Report.countDocuments({ status: 'pending' }),
    ]);

    res.status(200).json({
      status: 'success',
      data: {
        stats: {
          totalUsers: userCount,
          activePools: poolCount,
          pendingReports: pendingReportsCount,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

// --- User Management ---

/**
 * GET /api/admin/users
 * Returns a list of all users.
 */
export const getAllUsers = async (req, res, next) => {
  try {
    const users = await User.find().select('-__v');

    res.status(200).json({
      status: 'success',
      results: users.length,
      data: { users },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * PUT /api/admin/users/:userId/ban
 * Bans or Unbans a user.
 */
export const banUser = async (req, res, next) => {
  try {
    const { isBanned } = req.body;
    
    const user = await User.findByIdAndUpdate(
      req.params.userId,
      { isBanned: isBanned },
      { new: true, runValidators: true }
    );

    if (!user) return next(new AppError('User not found', 404));

    res.status(200).json({
      status: 'success',
      message: `User ${isBanned ? 'banned' : 'unbanned'} successfully.`,
      data: { user },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * PUT /api/admin/users/:userId/reliability
 * Manually updates a user's reliability score.
 */
export const updateUserReliability = async (req, res, next) => {
  try {
    const { score } = req.body;

    const user = await User.findByIdAndUpdate(
      req.params.userId,
      { reliabilityScore: score },
      { new: true, runValidators: true }
    );

    if (!user) return next(new AppError('User not found', 404));

    res.status(200).json({
      status: 'success',
      data: { user },
    });
  } catch (error) {
    next(error);
  }
};

// --- Report Management ---

/**
 * GET /api/admin/reports
 * Fetches all reports with reporter and reported user details.
 */
export const getAllReports = async (req, res, next) => {
  try {
    const reports = await Report.find()
      .populate('reporter', 'name email')
      .populate('reportedUser', 'name email reliabilityScore')
      .sort({ createdAt: -1 });

    res.status(200).json({
      status: 'success',
      results: reports.length,
      data: { reports },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * PUT /api/admin/reports/:reportId
 * Updates the status of a report
 */
export const updateReportStatus = async (req, res, next) => {
  try {
    const { status } = req.body; // 'resolved', 'dismissed'

    const report = await Report.findByIdAndUpdate(
      req.params.reportId,
      { status: status },
      { new: true, runValidators: true }
    );

    if (!report) return next(new AppError('Report not found', 404));

    res.status(200).json({
      status: 'success',
      data: { report },
    });
  } catch (error) {
    next(error);
  }
};

// --- Pool Management ---

/**
 * DELETE /api/admin/pools/:poolId
 * Allows admin to delete any pool
 */
export const deletePool = async (req, res, next) => {
  try {
    const pool = await Pool.findByIdAndDelete(req.params.poolId);

    if (!pool) return next(new AppError('Pool not found', 404));

    res.status(204).json({
      status: 'success',
      data: null,
    });
  } catch (error) {
    next(error);
  }
};