import logger from '../config/logger.js';

export const registerBoardSocketHandlers = (io, socket) => {
    // Join board room
    socket.on('board:join', ({ boardId, user }) => {
        const roomName = `board:${boardId}`;
        socket.join(roomName);
        socket.currentBoard = boardId;
        socket.user = user;

        logger.info(`Socket ${socket.id} (User: ${user?.username || 'Guest'}) joined ${roomName}`);

        // Broadcast user joined event to room
        socket.to(roomName).emit('user:joined', {
            user,
            timestamp: new Date().toISOString(),
        });
    });

    // Leave board room
    socket.on('board:leave', ({ boardId }) => {
        const roomName = `board:${boardId}`;
        socket.leave(roomName);
        logger.info(`Socket ${socket.id} left ${roomName}`);

        if (socket.user) {
            socket.to(roomName).emit('user:left', {
                user: socket.user,
                timestamp: new Date().toISOString(),
            });
        }
    });

    // Board update event broadcast
    socket.on('board:update', ({ boardId, updateData }) => {
        socket.to(`board:${boardId}`).emit('board:updated', updateData);
    });

    // List creation / update / delete broadcast
    socket.on('list:update', ({ boardId, listData, action }) => {
        socket.to(`board:${boardId}`).emit('list:updated', { listData, action });
    });

    // Typing indicator
    socket.on('user:typing', ({ boardId, user, isTyping, cardId }) => {
        socket.to(`board:${boardId}`).emit('user:typing', { user, isTyping, cardId });
    });
};
