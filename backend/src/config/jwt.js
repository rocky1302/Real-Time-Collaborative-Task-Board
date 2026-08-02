import dotenv from 'dotenv';
dotenv.config();

export const jwtConfig = {
    accessSecret: process.env.JWT_SECRET || 'super-secret-access-token-key-change-in-production',
    refreshSecret: process.env.JWT_REFRESH_SECRET || 'super-secret-refresh-token-key-change-in-production',
    accessExpiresIn: process.env.JWT_EXPIRES_IN || '15m',
    refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
};
