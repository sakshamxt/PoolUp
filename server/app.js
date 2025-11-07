import express from "express"
import cors from "cors"
import globalErrorHandler from './controllers/errorController'
import AppError from './utils/appError'
import logger from './config/logger'

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