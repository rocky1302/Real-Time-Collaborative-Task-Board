import { query } from '../config/db.js';

export class ListRepository {
    static async create({ boardId, title, position }) {
        let pos = position;
        if (pos === undefined || pos === null) {
            const maxRes = await query('SELECT COALESCE(MAX(position), -1) + 1 as next_pos FROM lists WHERE board_id = $1', [boardId]);
            pos = maxRes.rows[0].next_pos;
        }

        const sql = `
            INSERT INTO lists (board_id, title, position)
            VALUES ($1, $2, $3)
            RETURNING id, board_id, title, position, created_at, updated_at
        `;
        const res = await query(sql, [boardId, title, pos]);
        return res.rows[0];
    }

    static async getListsByBoard(boardId) {
        const sql = `
            SELECT id, board_id, title, position, created_at, updated_at
            FROM lists
            WHERE board_id = $1
            ORDER BY position ASC
        `;
        const res = await query(sql, [boardId]);
        return res.rows;
    }

    static async findById(listId) {
        const sql = 'SELECT * FROM lists WHERE id = $1';
        const res = await query(sql, [listId]);
        return res.rows[0] || null;
    }

    static async update(listId, { title, position }) {
        const sql = `
            UPDATE lists
            SET title = COALESCE($1, title),
                position = COALESCE($2, position),
                updated_at = CURRENT_TIMESTAMP
            WHERE id = $3
            RETURNING *
        `;
        const res = await query(sql, [title, position, listId]);
        return res.rows[0];
    }

    static async delete(listId) {
        const sql = 'DELETE FROM lists WHERE id = $1 RETURNING id, board_id, title';
        const res = await query(sql, [listId]);
        return res.rows[0];
    }
}
