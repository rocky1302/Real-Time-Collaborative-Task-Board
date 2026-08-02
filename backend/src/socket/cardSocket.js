import logger from '../config/logger.js';

export const registerCardSocketHandlers = (io, socket) => {
    // Real-time card creation broadcast
    socket.on('card:create', ({ boardId, card }) => {
        logger.info(`Socket broadcasting card:created in board ${boardId}`);
        socket.to(`board:${boardId}`).emit('card:created', card);
    });

    // Real-time card movement broadcast
    socket.on('card:move', ({ boardId, cardId, targetListId, newPosition, card }) => {
        logger.info(`Socket broadcasting card:moved in board ${boardId}`);
        socket.to(`board:${boardId}`).emit('card:moved', { cardId, targetListId, newPosition, card });
    });

    // Real-time card update broadcast
    socket.on('card:update', ({ boardId, card }) => {
        socket.to(`board:${boardId}`).emit('card:updated', card);
    });

    // Real-time card deletion broadcast
    socket.on('card:delete', ({ boardId, cardId }) => {
        socket.to(`board:${boardId}`).emit('card:deleted', { cardId });
    });
};
