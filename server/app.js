import express from "express"
import cors from "cors"
import helmet from 'helmet';
import mongoSanitize from 'express-mongo-sanitize';
import rateLimit from 'express-rate-limit';
import hpp from 'hpp';

import globalErrorHandler from './controllers/errorController'
import AppError from './utils/appError'
import logger from './config/logger'

import authRouter from './routes/authRoutes.js';
import locationRouter from './routes/locationRoutes.js';
import userRouter from './routes/userRoutes.js';
import poolRouter from './routes/poolRoutes.js';
import feedbackRouter from './routes/feedbackRoutes.js';
import chatRouter from './routes/chatRoutes.js';
import adminRouter from './routes/adminRoutes.js';
import reportRouter from './routes/reportRoutes.js';

const app = express();

//middlewares
app.use(helmet());
app.use(cors());
app.options('*', cors());

const limiter = rateLimit({
  max: 100,
  windowMs: 60 * 60 * 1000,
  message: 'Too many requests from this IP, please try again in an hour!',
  standardHeaders: true,
  legacyHeaders: false,
});
app.use('/api', limiter);

app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true, limit: '10kb' }));

app.use(mongoSanitize());
app.use(hpp({
  whitelist: [
    'maxSeats',
    'ratingsQuantity',
    'ratingsAverage',
    'maxGroupSize',
    'difficulty',
    'price'
  ]
}));

if(process.env.NODE_ENV === 'development') {
    app.use((req, res, next) => {
        logger.info(`${req.method} ${req.originalUrl}`);
        next();
    });
}

app.use('/api/auth', authRouter);
app.use('/api/locations', locationRouter);
app.use('/api/user', userRouter);
app.use('/api/pools', poolRouter);
app.use('/api/feedback', feedbackRouter);
app.use('/api/chat', chatRouter);
app.use('/api/admin', adminRouter);
app.use('/api/report', reportRouter);

//routes
app.get('/api/health', (req, res) => {
    res.status(200).json({
        status: 'success',
        message: 'PoolUp API is running'
    });
});

app.all('*', (req, res, next) => {
    next(new AppError(`Can't find ${req.originalUrl} on this server`, 404));
});

app.use(globalErrorHandler);

export default app;