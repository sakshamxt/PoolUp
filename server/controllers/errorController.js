import logger from '../config/logger';
import AppError from '../utils/appError';

const sendErrorDev = (err, res) => {
  res.status(err.statusCode).json({
    status: err.status,
    error: err,
    message: err.message,
    stack: err.stack,
  });
};


const sendErrorProd = (err, res) => {
  //Operational, trusted error: send message to client
  if (err.isOperational) {
    res.status(err.statusCode).json({
      status: err.status,
      message: err.message,
    });
  } 
  // Programming or other unknown error: don't leak error details
  else {
    // 1) Log error
    logger.error('ERROR 💥', err);

    // 2) Send generic message
    res.status(500).json({
      status: 'error',
      message: 'Something went very wrong!',
    });
  }
};

/**
 * Handle Mongoose CastError (e.g., invalid ObjectId).
 */
const handleCastErrorDB = (err) => {
  const message = `Invalid ${err.path}: ${err.value}.`;
  return new AppError(message, 400); // 400 Bad Request
};

/**
 * Handle Mongoose duplicate key error.
 */
const handleDuplicateFieldsDB = (err) => {
  // Extract the duplicate value from the error message
  const value = err.errmsg.match(/(["'])(\\?.)*?\1/)[0];
  const message = `Duplicate field value: ${value}. Please use another value!`;
  return new AppError(message, 400); // 400 Bad Request
};

/**
 * Handle Mongoose validation error.
 */
const handleValidationErrorDB = (err) => {
  const errors = Object.values(err.errors).map((el) => el.message);
  const message = `Invalid input data. ${errors.join('. ')}`;
  return new AppError(message, 400); // 400 Bad Request
};

/**
 * Handle invalid JWT error.
 */
const handleJWTError = () =>
  new AppError('Invalid token. Please log in again!', 401); // 401 Unauthorized

/**
 * Handle expired JWT error.
 */
const handleJWTExpiredError = () =>
  new AppError('Your token has expired! Please log in again.', 401); // 401 Unauthorized

/**
 * Global Error Handling Middleware.
 */
module.exports = (err, req, res, next) => {
  // Default status code and status
  err.statusCode = err.statusCode || 500;
  err.status = err.status || 'error';

  if (process.env.NODE_ENV === 'development') {
    sendErrorDev(err, res);
  } else if (process.env.NODE_ENV === 'production') {
    let error = { ...err, message: err.message, name: err.name };

    // Handle specific Mongoose/JWT errors to make them operational
    if (error.name === 'CastError') error = handleCastErrorDB(error);
    if (error.code === 11000) error = handleDuplicateFieldsDB(error);
    if (error.name === 'ValidationError') error = handleValidationErrorDB(error);
    if (error.name === 'JsonWebTokenError') error = handleJWTError();
    if (error.name === 'TokenExpiredError') error = handleJWTExpiredError();

    sendErrorProd(error, res);
  }
};