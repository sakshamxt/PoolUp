import express from "express"
import cors from "cors"
import globalErrorHandler from './controllers/errorController'
import AppError from './utils/appError'
import logger from './config/logger'
import authRouter from './routes/authRoutes.js';
import locationRouter from './routes/locationRoutes.js';
import userRouter from './routes/userRoutes.js';
import poolRouter from './routes/poolRoutes.js';
import feedbackRouter from './routes/feedbackRoutes.js';
import chatRouter from './routes/chatRoutes.js';

const app = express();

//middlewares
app.use(cors());
app.options('*', cors());
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true, limit: '10kb' }));

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