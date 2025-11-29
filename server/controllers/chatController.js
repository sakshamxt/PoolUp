import Message from '../models/messageModel.js';
import Pool from '../models/poolModel.js';
import AppError from '../utils/appError.js';

/**
 * GET /api/chat/:poolId/messages
 * Fetches chat history for a specific pool.
 */
export const getPoolMessages = async (req, res, next) => {
  try {
    const { poolId } = req.params;

    // 1. Verify User Access
    const pool = await Pool.findById(poolId);
    if (!pool) return next(new AppError('Pool not found.', 404));

    // Check if user is a member or the creator
    const isMember = pool.members.some(memberId => memberId.equals(req.user._id));
    const isCreator = pool.createdBy.equals(req.user._id);

    if (!isMember && !isCreator) {
      return next(new AppError('You are not a member of this pool chat.', 403));
    }

    // 2. Fetch Messages
    // Sort by timestamp ascending (oldest first)
    const messages = await Message.find({ poolId })
      .populate('senderId', 'name _id')
      .sort({ timestamp: 1 });

    res.status(200).json({
      status: 'success',
      results: messages.length,
      data: {
        messages,
      },
    });
  } catch (error) {
    next(error);
  }
};