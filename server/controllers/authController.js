import crypto from 'crypto';
import { promisify } from 'util';
import jwt from 'jsonwebtoken';
import { OAuth2Client } from 'google-auth-library';
import User from '../models/userModel.js';
import AppError from '../utils/appError.js';
import sendEmail from '../utils/email.js';

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

// --- Helper Functions ---

const signToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '90d',
  });
};

const createSendToken = (user, statusCode, res) => {
  const token = signToken(user._id);

  // Remove sensitive data from output
  user.passwordHash = undefined;
  user.verificationToken = undefined;

  res.status(statusCode).json({
    status: 'success',
    token,
    data: {
      user,
    },
  });
};

// --- Controllers ---

/**
 * PATH A: Google OAuth Sign-In
 * POST /api/auth/google
 */
export const googleAuth = async (req, res, next) => {
  try {
    const { idToken } = req.body;

    // 1. Verify Google Token
    const ticket = await client.verifyIdToken({
      idToken,
      audience: process.env.GOOGLE_CLIENT_ID,
    });
    const payload = ticket.getPayload();
    const { email, name, sub: googleId } = payload;

    // 2. Domain Validation
    const requiredDomain = process.env.UNIVERSITY_DOMAIN;
    if (!email.endsWith(requiredDomain)) {
      return next(new AppError(`Access restricted to ${requiredDomain} emails only.`, 403));
    }

    // 3. Check if user exists
    let user = await User.findOne({ email });

    if (user) {
      // 3a. If user exists, update googleId if missing
      if (!user.googleId) {
        user.googleId = googleId;
        await user.save({ validateBeforeSave: false });
      }
    } else {
      // 3b. If new user, create account (Auto-verified)
      user = await User.create({
        name,
        email,
        googleId,
        isVerified: true, // Trusted source
        gender: 'other', // Default
      });
    }

    // 4. Check Banned Status
    if (user.isBanned) {
      return next(new AppError('Your account has been banned. Please contact admin.', 403));
    }

    // 5. Send JWT
    createSendToken(user, 200, res);
  } catch (error) {
    next(error);
  }
};

/**
 * PATH B: Manual Registration
 * POST /api/auth/register
 */
export const register = async (req, res, next) => {
  try {
    const { name, email, password, gender } = req.body;

    // 1. Domain Validation
    const requiredDomain = process.env.UNIVERSITY_DOMAIN;
    if (!email || !email.endsWith(requiredDomain)) {
      return next(new AppError(`Registration restricted to ${requiredDomain} emails only.`, 403));
    }

    // 2. Create verification token
    const verificationToken = crypto.randomBytes(32).toString('hex');
    
    // 3. Create User (Unverified)
    const newUser = await User.create({
      name,
      email,
      passwordHash: password, // Pre-save hook will hash this
      gender,
      verificationToken,
      isVerified: false,
    });

    // 4. Send Verification Email
    const verifyUrl = `${req.protocol}://${req.get('host')}/api/auth/verify/${verificationToken}`;
    const message = `Welcome to PoolUp! Please verify your university email by clicking this link: ${verifyUrl}`;

    try {
      await sendEmail({
        email: newUser.email,
        subject: 'PoolUp Email Verification',
        message,
      });

      res.status(201).json({
        status: 'success',
        message: 'Token sent to email!',
      });
    } catch (err) {
      await User.findByIdAndDelete(newUser._id);
      return next(new AppError('There was an error sending the email. Try again later!', 500));
    }
  } catch (error) {
    next(error);
  }
};

/**
 * Manual Email Verification
 * GET /api/auth/verify/:token
 */
export const verifyEmail = async (req, res, next) => {
  try {
    const { token } = req.params;

    const user = await User.findOne({ verificationToken: token });

    if (!user) {
      return next(new AppError('Token is invalid or has expired.', 400));
    }

    user.isVerified = true;
    user.verificationToken = undefined;
    await user.save({ validateBeforeSave: false });

    res.status(200).json({
      status: 'success',
      message: 'Email successfully verified! You can now log in.',
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Manual Login
 * POST /api/auth/login
 */
export const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return next(new AppError('Please provide email and password!', 400));
    }

    const user = await User.findOne({ email }).select('+passwordHash');

    if (!user || !(await user.comparePassword(password))) {
      return next(new AppError('Incorrect email or password', 401));
    }

    if (!user.isVerified) {
      return next(new AppError('Please verify your email to log in.', 401));
    }

    if (user.isBanned) {
      return next(new AppError('Your account has been banned. Please contact admin.', 403));
    }

    createSendToken(user, 200, res);
  } catch (error) {
    next(error);
  }
};

/**
 * Protect Routes Middleware
 */
export const protect = async (req, res, next) => {
  try {
    let token;
    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith('Bearer')
    ) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      return next(new AppError('You are not logged in! Please log in to get access.', 401));
    }

    const decoded = await promisify(jwt.verify)(token, process.env.JWT_SECRET);

    const currentUser = await User.findById(decoded.id);
    if (!currentUser) {
      return next(new AppError('The user belonging to this token does no longer exist.', 401));
    }

    if (currentUser.isBanned) {
        return next(new AppError('User is banned from this platform.', 403));
    }

    req.user = currentUser;
    next();
  } catch (error) {
    next(new AppError('Invalid token. Please log in again!', 401));
  }
};

/**
 * Restrict To Middleware
 */
export const restrictTo = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return next(new AppError('You do not have permission to perform this action', 403));
    }
    next();
  };
};