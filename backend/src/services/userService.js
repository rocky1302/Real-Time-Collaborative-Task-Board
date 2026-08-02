import bcrypt from 'bcryptjs';
import { UserRepository } from '../repositories/userRepository.js';
import { generateAccessToken, generateRefreshToken, verifyRefreshToken } from '../utils/jwtUtils.js';
import { BadRequestError, UnauthorizedError, ConflictError, NotFoundError } from '../utils/AppError.js';

export class UserService {
    static async register({ username, email, password }) {
        const existingEmail = await UserRepository.findByEmail(email);
        if (existingEmail) {
            throw new ConflictError('User with this email already exists');
        }

        const passwordHash = await bcrypt.hash(password, 10);
        const user = await UserRepository.create({ username, email, passwordHash });

        const payload = { id: user.id, username: user.username, email: user.email };
        const accessToken = generateAccessToken(payload);
        const refreshToken = generateRefreshToken(payload);

        await UserRepository.updateRefreshToken(user.id, refreshToken);

        return {
            user: { id: user.id, username: user.username, email: user.email },
            accessToken,
            refreshToken,
        };
    }

    static async login({ email, password }) {
        const user = await UserRepository.findByEmail(email);
        if (!user) {
            throw new UnauthorizedError('Invalid email or password');
        }

        const isValidPassword = await bcrypt.compare(password, user.password_hash);
        if (!isValidPassword) {
            throw new UnauthorizedError('Invalid email or password');
        }

        const payload = { id: user.id, username: user.username, email: user.email };
        const accessToken = generateAccessToken(payload);
        const refreshToken = generateRefreshToken(payload);

        await UserRepository.updateRefreshToken(user.id, refreshToken);

        return {
            user: { id: user.id, username: user.username, email: user.email },
            accessToken,
            refreshToken,
        };
    }

    static async refreshAccessToken(refreshToken) {
        if (!refreshToken) {
            throw new BadRequestError('Refresh token is required');
        }

        let decoded;
        try {
            decoded = verifyRefreshToken(refreshToken);
        } catch (err) {
            throw new UnauthorizedError('Invalid or expired refresh token');
        }

        const user = await UserRepository.findByRefreshToken(refreshToken);
        if (!user || user.id !== decoded.id) {
            throw new UnauthorizedError('Invalid refresh token');
        }

        const payload = { id: user.id, username: user.username, email: user.email };
        const newAccessToken = generateAccessToken(payload);
        const newRefreshToken = generateRefreshToken(payload);

        await UserRepository.updateRefreshToken(user.id, newRefreshToken);

        return {
            accessToken: newAccessToken,
            refreshToken: newRefreshToken,
        };
    }

    static async logout(userId) {
        await UserRepository.updateRefreshToken(userId, null);
    }

    static async getProfile(userId) {
        const user = await UserRepository.findById(userId);
        if (!user) {
            throw new NotFoundError('User not found');
        }
        return user;
    }

    static async searchUsers(query) {
        if (!query || query.trim().length === 0) return [];
        return await UserRepository.searchUsers(query.trim());
    }
}
