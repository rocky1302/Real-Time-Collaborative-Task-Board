import { verifyAccessToken } from '../utils/jwtUtils.js';
import { UnauthorizedError } from '../utils/AppError.js';

export const authenticate = (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            throw new UnauthorizedError('Authentication token missing or invalid');
        }

        const token = authHeader.split(' ')[1];
        const decoded = verifyAccessToken(token);

        req.user = {
            id: decoded.id,
            username: decoded.username,
            email: decoded.email,
        };

        next();
    } catch (err) {
        if (err.name === 'TokenExpiredError') {
            return next(new UnauthorizedError('Access token expired'));
        }
        if (err.name === 'JsonWebTokenError') {
            return next(new UnauthorizedError('Invalid access token'));
        }
        next(err);
    }
};
