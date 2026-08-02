import { query } from '../config/db.js';

export class CardRepository {
    static async create({ listId, title, description, dueDate, position }) {
        let pos = position;
        if (pos === undefined || pos === null) {
            const maxRes = await query('SELECT COALESCE(MAX(position), -1) + 1 as next_pos FROM cards WHERE list_id = $1', [listId]);
            pos = maxRes.rows[0].next_pos;
        }

        const sql = `
            INSERT INTO cards (list_id, title, description, due_date, position)
            VALUES ($1, $2, $3, $4, $5)
            RETURNING id, list_id, title, description, due_date, completed_at, is_archived, position, created_at, updated_at
        `;
        const res = await query(sql, [listId, title, description || null, dueDate || null, pos]);
        return res.rows[0];
    }

    static async findById(cardId) {
        const sql = `
            SELECT c.*, l.board_id, l.title as list_title
            FROM cards c
            JOIN lists l ON c.list_id = l.id
            WHERE c.id = $1
        `;
        const res = await query(sql, [cardId]);
        return res.rows[0] || null;
    }

    static async getCardsByList(listId, includeArchived = false) {
        const sql = `
            SELECT c.*,
                   COALESCE(
                       json_agg(
                           json_build_object('id', lbl.id, 'name', lbl.name, 'color', lbl.color)
                       ) FILTER (WHERE lbl.id IS NOT NULL), '[]'
                   ) as labels
            FROM cards c
            LEFT JOIN card_labels cl ON c.id = cl.card_id
            LEFT JOIN labels lbl ON cl.label_id = lbl.id
            WHERE c.list_id = $1 AND (c.is_archived = FALSE OR $2 = TRUE)
            GROUP BY c.id
            ORDER BY c.position ASC
        `;
        const res = await query(sql, [listId, includeArchived]);
        return res.rows;
    }

    static async getCardsByBoard(boardId, includeArchived = false) {
        const sql = `
            SELECT c.*, l.title as list_title,
                   COALESCE(
                       json_agg(
                           json_build_object('id', lbl.id, 'name', lbl.name, 'color', lbl.color)
                       ) FILTER (WHERE lbl.id IS NOT NULL), '[]'
                   ) as labels
            FROM cards c
            JOIN lists l ON c.list_id = l.id
            LEFT JOIN card_labels cl ON c.id = cl.card_id
            LEFT JOIN labels lbl ON cl.label_id = lbl.id
            WHERE l.board_id = $1 AND (c.is_archived = FALSE OR $2 = TRUE)
            GROUP BY c.id, l.title
            ORDER BY l.position ASC, c.position ASC
        `;
        const res = await query(sql, [boardId, includeArchived]);
        return res.rows;
    }

    static async update(cardId, updates) {
        const fields = [];
        const values = [];
        let index = 1;

        if (updates.title !== undefined) {
            fields.push(`title = $${index++}`);
            values.push(updates.title);
        }
        if (updates.description !== undefined) {
            fields.push(`description = $${index++}`);
            values.push(updates.description);
        }
        if (updates.listId !== undefined) {
            fields.push(`list_id = $${index++}`);
            values.push(updates.listId);
        }
        if (updates.position !== undefined) {
            fields.push(`position = $${index++}`);
            values.push(updates.position);
        }
        if (updates.dueDate !== undefined) {
            fields.push(`due_date = $${index++}`);
            values.push(updates.dueDate);
        }
        if (updates.isCompleted !== undefined) {
            const completedAt = updates.isCompleted ? new Date().toISOString() : null;
            fields.push(`completed_at = $${index++}`);
            values.push(completedAt);
        }
        if (updates.isArchived !== undefined) {
            fields.push(`is_archived = $${index++}`);
            values.push(updates.isArchived);
        }

        fields.push(`updated_at = CURRENT_TIMESTAMP`);
        values.push(cardId);

        const sql = `
            UPDATE cards
            SET ${fields.join(', ')}
            WHERE id = $${index}
            RETURNING *
        `;

        const res = await query(sql, values);
        return res.rows[0];
    }

    static async moveCard(cardId, targetListId, newPosition) {
        const sql = `
            UPDATE cards
            SET list_id = $1,
                position = $2,
                updated_at = CURRENT_TIMESTAMP
            WHERE id = $3
            RETURNING *
        `;
        const res = await query(sql, [targetListId, newPosition, cardId]);
        return res.rows[0];
    }

    static async searchCards(boardId, searchTerm) {
        const sql = `
            SELECT DISTINCT c.*, l.title as list_title,
                   COALESCE(
                       json_agg(
                           json_build_object('id', lbl.id, 'name', lbl.name, 'color', lbl.color)
                       ) FILTER (WHERE lbl.id IS NOT NULL), '[]'
                   ) as labels
            FROM cards c
            JOIN lists l ON c.list_id = l.id
            LEFT JOIN card_labels cl ON c.id = cl.card_id
            LEFT JOIN labels lbl ON cl.label_id = lbl.id
            WHERE l.board_id = $1
              AND (
                  c.title ILIKE $2
                  OR c.description ILIKE $2
                  OR lbl.name ILIKE $2
              )
            GROUP BY c.id, l.title
            ORDER BY c.updated_at DESC
        `;
        const res = await query(sql, [boardId, `%${searchTerm}%`]);
        return res.rows;
    }

    static async deletePermanently(cardId) {
        const sql = 'DELETE FROM cards WHERE id = $1 RETURNING id';
        const res = await query(sql, [cardId]);
        return res.rows[0];
    }
}
