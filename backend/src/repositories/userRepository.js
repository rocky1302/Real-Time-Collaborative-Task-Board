import { query } from '../config/db.js';

export class UserRepository {
    static async create({ username, email, passwordHash }) {
        const sql = `
            INSERT INTO users (username, email, password_hash)
            VALUES ($1, $2, $3)
            RETURNING id, username, email, created_at
        `;
        const res = await query(sql, [username, email, passwordHash]);
        return res.rows[0];
    }

    static async findByEmail(email) {
        const sql = 'SELECT * FROM users WHERE email = $1';
        const res = await query(sql, [email]);
        return res.rows[0] || null;
    }

    static async findById(id) {
        const sql = 'SELECT id, username, email, created_at FROM users WHERE id = $1';
        const res = await query(sql, [id]);
        return res.rows[0] || null;
    }

    static async updateRefreshToken(userId, refreshToken) {
        const sql = 'UPDATE users SET refresh_token = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2';
        await query(sql, [refreshToken, userId]);
    }

    static async findByRefreshToken(refreshToken) {
        const sql = 'SELECT id, username, email FROM users WHERE refresh_token = $1';
        const res = await query(sql, [refreshToken]);
        return res.rows[0] || null;
    }

    static async searchUsers(searchQuery) {
        const sql = `
            SELECT id, username, email
            FROM users
            WHERE username ILIKE $1 OR email ILIKE $1
            LIMIT 10
        `;
        const res = await query(sql, [`%${searchQuery}%`]);
        return res.rows;
    }
}
