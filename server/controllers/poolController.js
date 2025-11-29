import Pool from '../models/poolModel.js';
import User from '../models/userModel.js';
import AppError from '../utils/appError.js';
import * as notification from '../utils/notification.js';

// Configuration
const LOW_RELIABILITY_THRESHOLD = process.env.LOW_RELIABILITY_THRESHOLD || 70;

// --- CRUD Operations ---

export const createPool = async (req, res, next) => {
  try {
    const { origin, destination, departureTime, maxSeats, genderPref } = req.body;

    // 1. Basic Validation
    if (new Date(departureTime) <= Date.now()) {
      return next(new AppError('Departure time must be in the future.', 400));
    }

    // 2. Create Pool
    // The creator is automatically the first member 
    const newPool = await Pool.create({
      createdBy: req.user._id,
      origin,
      destination,
      departureTime,
      maxSeats,
      genderPref,
      members: [req.user._id], 
    });

    res.status(201).json({
      status: 'success',
      data: { pool: newPool },
    });
  } catch (error) {
    next(error);
  }
};

export const getPools = async (req, res, next) => {
  try {
    const { origin, destination, date, genderFilter } = req.query;

    // 1. Build Query
    const query = {
      status: 'active',
      departureTime: { $gt: new Date() }, // Only future trips
    };

    if (origin) query.origin = origin;
    if (destination) query.destination = destination;
    
    // Date Filter (Specific Day)
    if (date) {
      const startOfDay = new Date(date);
      const endOfDay = new Date(date);
      endOfDay.setDate(endOfDay.getDate() + 1);
      query.departureTime = { $gte: startOfDay, $lt: endOfDay };
    }

    // 2. Gender Filtering Logic
    // If user wants "Same Gender Only":
    if (genderFilter === 'same') {
      // If I am female, I only see pools marked 'female'. 
      // I do NOT see 'all' gender pools
      query.genderPref = req.user.gender; 
    } 
    // If filter is 'all' (default), we usually show 'all' pools.
    // However, we must EXCLUDE pools that are restricted to the opposite gender.
    else {
      // Show pools that are 'all' OR match my gender
      query.genderPref = { $in: ['all', req.user.gender] };
    }

    const pools = await Pool.find(query)
      .populate('createdBy', 'name reliabilityScore gender')
      .populate('members', 'name gender')
      .sort({ departureTime: 1 });

    res.status(200).json({
      status: 'success',
      results: pools.length,
      data: { pools },
    });
  } catch (error) {
    next(error);
  }
};

export const getPool = async (req, res, next) => {
  try {
    const pool = await Pool.findById(req.params.id)
      .populate('members', 'name reliabilityScore gender')
      .populate('joinRequests.userId', 'name reliabilityScore gender');

    if (!pool) return next(new AppError('No pool found with that ID', 404));

    res.status(200).json({
      status: 'success',
      data: { pool },
    });
  } catch (error) {
    next(error);
  }
};

export const getMyPools = async (req, res, next) => {
  try {
    // Find pools where I am a member
    const pools = await Pool.find({ members: req.user._id })
      .populate('createdBy', 'name')
      .sort({ departureTime: -1 });

    res.status(200).json({
      status: 'success',
      results: pools.length,
      data: { pools },
    });
  } catch (error) {
    next(error);
  }
};

// --- Join & Request Logic ---

export const joinPool = async (req, res, next) => {
  try {
    const pool = await Pool.findById(req.params.id).populate('createdBy', 'fcmToken');
    const user = req.user;

    if (!pool) return next(new AppError('Pool not found', 404));

    // 1. Checks
    if (pool.status !== 'active') return next(new AppError('This pool is no longer active', 400));
    
    // Check if already a member
    if (pool.members.includes(user._id)) {
      return next(new AppError('You are already in this pool', 400));
    }
    
    // Check if pending request exists
    const existingRequest = pool.joinRequests.find(r => r.userId.equals(user._id));
    if (existingRequest && existingRequest.status === 'pending') {
      return next(new AppError('You already have a pending request for this pool', 400));
    }

    // Capacity Check
    if (pool.members.length >= pool.maxSeats) {
      return next(new AppError('This pool is full', 400));
    }

    // Gender Check
    if (pool.genderPref !== 'all' && pool.genderPref !== user.gender) {
      return next(new AppError(`This pool is for ${pool.genderPref}s only.`, 403));
    }

    // 2. Reliability Check
    // If score is low, create Request. If high, Join directly.
    if (user.reliabilityScore < LOW_RELIABILITY_THRESHOLD) {
      // -- Path A: Low Reliability (Request) --
      pool.joinRequests.push({ userId: user._id });
      await pool.save();

      // Notify Creator
      await notification.notifyUser(pool.createdBy, 'New Join Request', `${user.name} wants to join your pool.`);

      return res.status(202).json({
        status: 'success',
        message: 'Request sent! Waiting for approval due to reliability score.',
        data: { state: 'pending' }
      });
    } else {
      // -- Path B: High Reliability (Direct Join) --
      pool.members.push(user._id);
      await pool.save();

      // Notify Creator
      await notification.notifyUser(pool.createdBy, 'New Member', `${user.name} joined your pool!`);

      return res.status(200).json({
        status: 'success',
        message: 'Successfully joined the pool!',
        data: { state: 'joined' }
      });
    }
  } catch (error) {
    next(error);
  }
};

// --- Approval Logic ---

export const approveRequest = async (req, res, next) => {
  try {
    const { poolId, requestId } = req.params;

    const pool = await Pool.findById(poolId);
    if (!pool) return next(new AppError('Pool not found', 404));

    // Only creator can approve [cite: 217]
    if (!pool.createdBy.equals(req.user._id)) {
      return next(new AppError('Only the pool creator can approve requests', 403));
    }

    // Find request
    const request = pool.joinRequests.id(requestId);
    if (!request) return next(new AppError('Request not found', 404));

    // Move to members [cite: 219]
    if (pool.members.length >= pool.maxSeats) {
      return next(new AppError('Pool is now full, cannot approve.', 400));
    }

    pool.members.push(request.userId);
    // Remove from requests (or mark approved)
    request.deleteOne(); 

    await pool.save();

    // Notify the user who was approved 
    const approvedUser = await User.findById(request.userId);
    await notification.notifyUser(approvedUser, 'Request Approved', 'You have been accepted into the pool!');

    res.status(200).json({
      status: 'success',
      message: 'User approved and added to pool.',
    });
  } catch (error) {
    next(error);
  }
};

export const rejectRequest = async (req, res, next) => {
  try {
    const { poolId, requestId } = req.params;

    const pool = await Pool.findById(poolId);
    if (!pool) return next(new AppError('Pool not found', 404));

    if (!pool.createdBy.equals(req.user._id)) {
      return next(new AppError('Only the pool creator can reject requests', 403));
    }

    const request = pool.joinRequests.id(requestId);
    if (!request) return next(new AppError('Request not found', 404));

    // Remove request
    const rejectedUserId = request.userId;
    request.deleteOne();
    await pool.save();

    // Notify rejected user
    const rejectedUser = await User.findById(rejectedUserId);
    await notification.notifyUser(rejectedUser, 'Request Declined', 'Your request to join was declined.');

    res.status(200).json({
      status: 'success',
      message: 'Join request rejected.',
    });
  } catch (error) {
    next(error);
  }
};