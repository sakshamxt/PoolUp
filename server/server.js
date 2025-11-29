import dotenv from "dotenv"
dotenv.config()
import http from "http"
import app from "./app.js"
import connectDB from "./config/db.js"
import logger from "./config/logger.js"
import setupSocket from './config/socket.js';

connectDB();

const PORT = process.env.PORT || 5000;
const server = http.createServer(app);

const io = setupSocket(server);

app.set('io', io);

server.listen(PORT, () => {
    logger.info(`Server running in ${process.env.NODE_ENV} mode on port ${PORT}`);
});


process.on('unhandledRejection', (err) => {
  logger.error('UNHANDLED REJECTION! Shutting down');
  logger.error(err.name, err.message);
  server.close(() => {
    process.exit(1);
  });
});

process.on('SIGTERM', () => {
  logger.info('SIGTERM RECEIVED. Shutting down gracefully');
  server.close(() => {
    logger.info('Process terminated');
  });
});