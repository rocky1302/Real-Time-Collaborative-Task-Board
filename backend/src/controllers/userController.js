import { UserService } from '../services/userService.js';
import { sendSuccess } from '../utils/responseFormatter.js';

export class UserController {
    static async getMe(req, res, next) {
        try {
            const user = await UserService.getProfile(req.user.id);
            return sendSuccess(res, user, 'Profile retrieved successfully');
        } catch (err) {
            next(err);
        }
    }

    static async search(req, res, next) {
        try {
            const { query } = req.query;
            const users = await UserService.searchUsers(query);
            return sendSuccess(res, users, 'Users retrieved successfully');
        } catch (err) {
            next(err);
        }
    }
}
