import { query } from '../config/db.js';

export class BoardRepository {
    static async create({ title, description, ownerId }) {
        const sql = `
            INSERT INTO boards (title, description, owner_id)
            VALUES ($1, $2, $3)
            RETURNING id, title, description, owner_id, created_at, updated_at
        `;
        const res = await query(sql, [title, description, ownerId]);
        const board = res.rows[0];

        // Automatically insert owner into board_members
        await query(
            'INSERT INTO board_members (board_id, user_id, role) VALUES ($1, $2, $3) ON CONFLICT DO NOTHING',
            [board.id, ownerId, 'owner']
        );

        return board;
    }

    static async getUserBoards(userId) {
        const sql = `
            SELECT b.id, b.title, b.description, b.owner_id, b.created_at, b.updated_at,
                   bm.role, u.username as owner_username
            FROM boards b
            JOIN board_members bm ON b.id = bm.board_id
            JOIN users u ON b.owner_id = u.id
            WHERE bm.user_id = $1
            ORDER BY b.updated_at DESC
        `;
        const res = await query(sql, [userId]);
        return res.rows;
    }

    static async getBoardDetails(boardId) {
        const sql = `
            SELECT b.id, b.title, b.description, b.owner_id, b.created_at, b.updated_at,
                   u.username as owner_username, u.email as owner_email
            FROM boards b
            JOIN users u ON b.owner_id = u.id
            WHERE b.id = $1
        `;
        const res = await query(sql, [boardId]);
        return res.rows[0] || null;
    }

    static async update(boardId, { title, description }) {
        const sql = `
            UPDATE boards
            SET title = COALESCE($1, title),
                description = COALESCE($2, description),
                updated_at = CURRENT_TIMESTAMP
            WHERE id = $3
            RETURNING *
        `;
        const res = await query(sql, [title, description, boardId]);
        return res.rows[0];
    }

    static async delete(boardId) {
        const sql = 'DELETE FROM boards WHERE id = $1 RETURNING id';
        const res = await query(sql, [boardId]);
        return res.rows[0];
    }

    static async getMembers(boardId) {
        const sql = `
            SELECT bm.id, bm.user_id, bm.role, bm.created_at, u.username, u.email
            FROM board_members bm
            JOIN users u ON bm.user_id = u.id
            WHERE bm.board_id = $1
            ORDER BY bm.created_at ASC
        `;
        const res = await query(sql, [boardId]);
        return res.rows;
    }

    static async addMember(boardId, userId, role = 'editor') {
        const sql = `
            INSERT INTO board_members (board_id, user_id, role)
            VALUES ($1, $2, $3)
            ON CONFLICT (board_id, user_id) DO UPDATE SET role = EXCLUDED.role
            RETURNING *
        `;
        const res = await query(sql, [boardId, userId, role]);
        return res.rows[0];
    }

    static async removeMember(boardId, userId) {
        const sql = 'DELETE FROM board_members WHERE board_id = $1 AND user_id = $2 RETURNING *';
        const res = await query(sql, [boardId, userId]);
        return res.rows[0];
    }
}
