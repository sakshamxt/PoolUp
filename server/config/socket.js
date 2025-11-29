import { Server } from 'socket.io';
import jwt from 'jsonwebtoken';
import User from '../models/userModel.js';
import Pool from '../models/poolModel.js';
import Message from '../models/messageModel.js';
import logger from './logger.js';

const setupSocket = (server) => {
  const io = new Server(server, {
    cors: {
      origin: "*",
      methods: ["GET", "POST"]
    }
  });

  // --- Middleware: Authentication ---
  io.use(async (socket, next) => {
    try {
      // 1. Get token from handshake auth or query
      const token = socket.handshake.auth.token || socket.handshake.query.token;
      
      if (!token) {
        return next(new Error('Authentication error: Token missing'));
      }

      // 2. Verify Token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      
      // 3. Attach user to socket
      const user = await User.findById(decoded.id);
      if (!user) {
        return next(new Error('Authentication error: User not found'));
      }
      
      socket.user = user;
      next();
    } catch (err) {
      logger.error('Socket Auth Error:', err.message);
      next(new Error('Authentication error'));
    }
  });

  // --- Connection Handler ---
  io.on('connection', (socket) => {
    logger.info(`User connected: ${socket.user.name} (${socket.user._id})`);

    // Event: joinPoolRoom
    socket.on('joinPoolRoom', async ({ poolId }) => {
      try {
        // Double-check membership for security
        const pool = await Pool.findById(poolId);
        
        if (!pool) {
          return socket.emit('error', { message: 'Pool not found' });
        }

        const isMember = 
          pool.members.some(id => id.equals(socket.user._id)) || 
          pool.createdBy.equals(socket.user._id);

        if (isMember) {
          socket.join(poolId); // Join the "Room"
          logger.info(`User ${socket.user.name} joined room: ${poolId}`);
        } else {
          socket.emit('error', { message: 'Not authorized for this pool' });
        }
      } catch (err) {
        logger.error('Socket Join Error', err);
      }
    });

    // Event: sendMessage
    socket.on('sendMessage', async ({ poolId, text }) => {
      try {
        if (!text || !poolId) return;

        // 1. Save to DB
        const newMessage = await Message.create({
          poolId,
          senderId: socket.user._id,
          text
        });

        // 2. Populate sender info for the frontend
        await newMessage.populate('senderId', 'name _id');

        // 3. Broadcast to Room
        // We emit 'newMessage' event to everyone in the room (including sender)
        io.to(poolId).emit('newMessage', newMessage);
        
      } catch (err) {
        logger.error('Socket Message Error', err);
        socket.emit('error', { message: 'Failed to send message' });
      }
    });

    socket.on('disconnect', () => {
      // logger.debug('User disconnected');
    });
  });

  return io;
};

export default setupSocket;