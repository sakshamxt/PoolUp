import User from '../models/userModel.js';
import Pool from '../models/poolModel.js';
import AppError from '../utils/appError.js';

/**
 * POST /api/feedback
 * Submit a rating for a co-traveler and update their reliability score.
 */
export const submitFeedback = async (req, res, next) => {
  try {
    const { poolId, targetUserId, rating } = req.body; // rating: 'show' or 'no-show'

    // 1. Validation
    if (!['show', 'no-show'].includes(rating)) {
      return next(new AppError('Rating must be either "show" or "no-show".', 400));
    }

    if (req.user._id.equals(targetUserId)) {
      return next(new AppError('You cannot rate yourself.', 400));
    }

    // 2. Verify Pool Membership
    const pool = await Pool.findById(poolId);
    if (!pool) return next(new AppError('Pool not found.', 404));

    // Ensure both users were in the pool
    const isReporterMember = pool.members.includes(req.user._id) || pool.createdBy.equals(req.user._id);
    const isTargetMember = pool.members.includes(targetUserId) || pool.createdBy.equals(targetUserId);

    if (!isReporterMember || !isTargetMember) {
      return next(new AppError('Both users must be members of the pool to submit feedback.', 403));
    }

    // 3. Update Target User
    const targetUser = await User.findById(targetUserId);
    
    // Add new rating
    targetUser.ratings.push({
      byUser: req.user._id,
      rating: rating,
    });

    // 4. Recalculate Reliability Score
    // Formula: (Total "Shows" / Total Ratings) * 100
    const totalRatings = targetUser.ratings.length;
    const showRatings = targetUser.ratings.filter(r => r.rating === 'show').length;
    
    // Default to 100 if no ratings, otherwise calculate percentage
    targetUser.reliabilityScore = totalRatings === 0 ? 100 : Math.round((showRatings / totalRatings) * 100);

    await targetUser.save({ validateBeforeSave: false });

    res.status(200).json({
      status: 'success',
      data: {
        newScore: targetUser.reliabilityScore,
      },
    });
  } catch (error) {
    next(error);
  }
};