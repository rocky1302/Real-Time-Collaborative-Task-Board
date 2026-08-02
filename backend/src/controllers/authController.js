import { UserService } from '../services/userService.js';
import { sendSuccess } from '../utils/responseFormatter.js';

export class AuthController {
    static async register(req, res, next) {
        try {
            const result = await UserService.register(req.body);
            return sendSuccess(res, result, 'User registered successfully', 201);
        } catch (err) {
            next(err);
        }
    }

    static async login(req, res, next) {
        try {
            const result = await UserService.login(req.body);
            return sendSuccess(res, result, 'Login successful');
        } catch (err) {
            next(err);
        }
    }

    static async refreshToken(req, res, next) {
        try {
            const { refreshToken } = req.body;
            const result = await UserService.refreshAccessToken(refreshToken);
            return sendSuccess(res, result, 'Token refreshed successfully');
        } catch (err) {
            next(err);
        }
    }

    static async logout(req, res, next) {
        try {
            await UserService.logout(req.user.id);
            return sendSuccess(res, null, 'Logged out successfully');
        } catch (err) {
            next(err);
        }
    }
}
