import logger from '../config/logger.js';
import { sendError } from '../utils/responseFormatter.js';

export const errorHandler = (err, req, res, next) => {
    const statusCode = err.statusCode || 500;
    const message = err.message || 'Internal Server Error';

    if (statusCode >= 500) {
        logger.error(`[500 Server Error] ${req.method} ${req.originalUrl}: ${err.stack || message}`);
    } else {
        logger.warn(`[${statusCode} Client Error] ${req.method} ${req.originalUrl}: ${message}`);
    }

    return sendError(res, message, statusCode, err.details || null);
};

export const notFoundHandler = (req, res, next) => {
    return sendError(res, `Route ${req.originalUrl} not found`, 404);
};
