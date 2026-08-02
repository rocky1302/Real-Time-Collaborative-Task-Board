import { Server } from 'socket.io';
import { registerBoardSocketHandlers } from './boardSocket.js';
import { registerCardSocketHandlers } from './cardSocket.js';
import { verifyAccessToken } from '../utils/jwtUtils.js';
import logger from '../config/logger.js';

export const initSocket = (server) => {
    const io = new Server(server, {
        cors: {
            origin: process.env.CORS_ORIGIN || '*',
            methods: ['GET', 'POST', 'PUT', 'DELETE'],
        },
    });

    // Optional Socket.io authentication middleware
    io.use((socket, next) => {
        const token = socket.handshake.auth?.token || socket.handshake.headers?.authorization?.split(' ')[1];
        if (token) {
            try {
                const decoded = verifyAccessToken(token);
                socket.user = decoded;
            } catch (err) {
                logger.warn(`Socket connection with unverified token: ${err.message}`);
            }
        }
        next();
    });

    io.on('connection', (socket) => {
        logger.info(`Socket client connected: ${socket.id}`);

        registerBoardSocketHandlers(io, socket);
        registerCardSocketHandlers(io, socket);

        socket.on('disconnect', () => {
            logger.info(`Socket client disconnected: ${socket.id}`);
            if (socket.currentBoard && socket.user) {
                socket.to(`board:${socket.currentBoard}`).emit('user:left', {
                    user: socket.user,
                    timestamp: new Date().toISOString(),
                });
            }
        });
    });

    return io;
};
