import pg from 'pg';
import dotenv from 'dotenv';
import logger from './logger.js';

dotenv.config();

const { Pool } = pg;

const connectionString = process.env.DATABASE_URL || 'postgres://postgres:postgres@localhost:5432/trello_kanban';

export const pool = new Pool({
    connectionString,
    max: 10,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 2000,
});

let isPostgresAvailable = null;

// In-Memory Database Store Fallback when local PostgreSQL daemon is unavailable
const inMemoryStore = {
    users: [],
    boards: [],
    board_members: [],
    lists: [],
    cards: [],
    comments: [],
    activity_logs: [],
    labels: [
        { id: 1, name: 'Bug', color: '#ef4444' },
        { id: 2, name: 'Feature', color: '#3b82f6' },
        { id: 3, name: 'Urgent', color: '#f97316' },
        { id: 4, name: 'Research', color: '#a855f7' },
        { id: 5, name: 'Documentation', color: '#10b981' },
    ],
    card_labels: [],
    counters: {
        users: 1,
        boards: 1,
        board_members: 1,
        lists: 1,
        cards: 1,
        comments: 1,
        activity_logs: 1,
    },
};

// Check if PostgreSQL server is responding
const checkPostgres = async () => {
    try {
        const client = await pool.connect();
        client.release();
        isPostgresAvailable = true;
        logger.info('Connected to PostgreSQL database');
    } catch (err) {
        isPostgresAvailable = false;
        logger.warn(`PostgreSQL server connection failed (${err.message}). Seamlessly switching to local in-memory storage engine for instant preview.`);
    }
};

checkPostgres();

export const query = async (text, params = []) => {
    if (isPostgresAvailable === null) {
        await checkPostgres();
    }

    if (isPostgresAvailable) {
        try {
            return await pool.query(text, params);
        } catch (err) {
            logger.warn(`Postgres query failed, falling back to local memory store: ${err.message}`);
        }
    }

    // In-memory Query Interpreter Fallback
    return executeInMemoryQuery(text, params);
};

function executeInMemoryQuery(text, params) {
    const cleanText = text.trim();
    const lower = cleanText.toLowerCase();

    // 1. Users Queries
    if (lower.startsWith('insert into users')) {
        const id = inMemoryStore.counters.users++;
        const user = {
            id,
            username: params[0],
            email: params[1],
            password_hash: params[2],
            refresh_token: null,
            created_at: new Date().toISOString(),
        };
        inMemoryStore.users.push(user);
        return { rows: [user], rowCount: 1 };
    }

    if (lower.includes('from users') && lower.includes('where email =')) {
        const user = inMemoryStore.users.find((u) => u.email.toLowerCase() === (params[0] || '').toLowerCase());
        return { rows: user ? [user] : [], rowCount: user ? 1 : 0 };
    }

    if (lower.includes('from users') && lower.includes('where id =')) {
        const user = inMemoryStore.users.find((u) => u.id === parseInt(params[0], 10));
        return { rows: user ? [user] : [], rowCount: user ? 1 : 0 };
    }

    if (lower.includes('from users') && lower.includes('where refresh_token =')) {
        const user = inMemoryStore.users.find((u) => u.refresh_token === params[0]);
        return { rows: user ? [user] : [], rowCount: user ? 1 : 0 };
    }

    if (lower.startsWith('update users set refresh_token')) {
        const user = inMemoryStore.users.find((u) => u.id === parseInt(params[1], 10));
        if (user) user.refresh_token = params[0];
        return { rows: user ? [user] : [], rowCount: user ? 1 : 0 };
    }

    // 2. Boards Queries
    if (lower.startsWith('insert into boards')) {
        const id = inMemoryStore.counters.boards++;
        const board = {
            id,
            title: params[0],
            description: params[1],
            owner_id: parseInt(params[2], 10),
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
        };
        inMemoryStore.boards.push(board);
        return { rows: [board], rowCount: 1 };
    }

    if (lower.includes('from boards') && lower.includes('where bm.user_id =')) {
        const userId = parseInt(params[0], 10);
        const memberBoardIds = inMemoryStore.board_members.filter((m) => m.user_id === userId).map((m) => m.board_id);
        const ownerBoardIds = inMemoryStore.boards.filter((b) => b.owner_id === userId).map((b) => b.id);
        const allIds = Array.from(new Set([...memberBoardIds, ...ownerBoardIds]));

        const res = inMemoryStore.boards
            .filter((b) => allIds.includes(b.id))
            .map((b) => {
                const owner = inMemoryStore.users.find((u) => u.id === b.owner_id);
                return { ...b, owner_username: owner ? owner.username : 'User', role: b.owner_id === userId ? 'owner' : 'editor' };
            });
        return { rows: res, rowCount: res.length };
    }

    if (lower.includes('from boards') && lower.includes('where b.id =')) {
        const boardId = parseInt(params[0], 10);
        const board = inMemoryStore.boards.find((b) => b.id === boardId);
        if (board) {
            const owner = inMemoryStore.users.find((u) => u.id === board.owner_id);
            return { rows: [{ ...board, owner_username: owner ? owner.username : 'Owner', owner_email: owner ? owner.email : '' }], rowCount: 1 };
        }
        return { rows: [], rowCount: 0 };
    }

    if (lower.startsWith('update boards')) {
        const boardId = parseInt(params[2], 10);
        const board = inMemoryStore.boards.find((b) => b.id === boardId);
        if (board) {
            if (params[0]) board.title = params[0];
            if (params[1] !== undefined) board.description = params[1];
        }
        return { rows: board ? [board] : [], rowCount: board ? 1 : 0 };
    }

    if (lower.startsWith('delete from boards')) {
        const boardId = parseInt(params[0], 10);
        inMemoryStore.boards = inMemoryStore.boards.filter((b) => b.id !== boardId);
        return { rows: [{ id: boardId }], rowCount: 1 };
    }

    // 3. Board Members Queries
    if (lower.startsWith('insert into board_members')) {
        const id = inMemoryStore.counters.board_members++;
        const member = {
            id,
            board_id: parseInt(params[0], 10),
            user_id: parseInt(params[1], 10),
            role: params[2] || 'editor',
            created_at: new Date().toISOString(),
        };
        inMemoryStore.board_members.push(member);
        return { rows: [member], rowCount: 1 };
    }

    if (lower.includes('from board_members') && lower.includes('union')) {
        const boardId = parseInt(params[0], 10);
        const userId = parseInt(params[1], 10);
        const board = inMemoryStore.boards.find((b) => b.id === boardId);
        if (board && board.owner_id === userId) {
            return { rows: [{ role: 'owner' }], rowCount: 1 };
        }
        const member = inMemoryStore.board_members.find((m) => m.board_id === boardId && m.user_id === userId);
        return { rows: member ? [{ role: member.role }] : [], rowCount: member ? 1 : 0 };
    }

    if (lower.includes('from board_members') && lower.includes('where bm.board_id =')) {
        const boardId = parseInt(params[0], 10);
        const members = inMemoryStore.board_members.filter((m) => m.board_id === boardId).map((m) => {
            const u = inMemoryStore.users.find((user) => user.id === m.user_id);
            return { ...m, username: u ? u.username : 'User', email: u ? u.email : '' };
        });
        return { rows: members, rowCount: members.length };
    }

    // 4. Lists Queries
    if (lower.startsWith('select coalesce(max(position)')) {
        const boardId = parseInt(params[0], 10);
        const boardLists = inMemoryStore.lists.filter((l) => l.board_id === boardId);
        const maxPos = boardLists.reduce((max, l) => Math.max(max, l.position), -1);
        return { rows: [{ next_pos: maxPos + 1 }], rowCount: 1 };
    }

    if (lower.startsWith('insert into lists')) {
        const id = inMemoryStore.counters.lists++;
        const list = {
            id,
            board_id: parseInt(params[0], 10),
            title: params[1],
            position: parseInt(params[2], 10),
            created_at: new Date().toISOString(),
        };
        inMemoryStore.lists.push(list);
        return { rows: [list], rowCount: 1 };
    }

    if (lower.includes('from lists') && lower.includes('where board_id =')) {
        const boardId = parseInt(params[0], 10);
        const lists = inMemoryStore.lists.filter((l) => l.board_id === boardId).sort((a, b) => a.position - b.position);
        return { rows: lists, rowCount: lists.length };
    }

    if (lower.includes('from lists') && lower.includes('where id =')) {
        const listId = parseInt(params[0], 10);
        const list = inMemoryStore.lists.find((l) => l.id === listId);
        return { rows: list ? [list] : [], rowCount: list ? 1 : 0 };
    }

    if (lower.startsWith('update lists')) {
        const listId = parseInt(params[2], 10);
        const list = inMemoryStore.lists.find((l) => l.id === listId);
        if (list) {
            if (params[0]) list.title = params[0];
            if (params[1] !== undefined) list.position = params[1];
        }
        return { rows: list ? [list] : [], rowCount: list ? 1 : 0 };
    }

    if (lower.startsWith('delete from lists')) {
        const listId = parseInt(params[0], 10);
        const list = inMemoryStore.lists.find((l) => l.id === listId);
        inMemoryStore.lists = inMemoryStore.lists.filter((l) => l.id !== listId);
        return { rows: list ? [list] : [], rowCount: list ? 1 : 0 };
    }

    // 5. Cards Queries
    if (lower.startsWith('insert into cards')) {
        const id = inMemoryStore.counters.cards++;
        const card = {
            id,
            list_id: parseInt(params[0], 10),
            title: params[1],
            description: params[2] || null,
            due_date: params[3] || null,
            completed_at: null,
            is_archived: false,
            position: parseInt(params[4], 10),
            created_at: new Date().toISOString(),
        };
        inMemoryStore.cards.push(card);
        return { rows: [card], rowCount: 1 };
    }

    if (lower.includes('from cards') && lower.includes('where c.id =')) {
        const cardId = parseInt(params[0], 10);
        const card = inMemoryStore.cards.find((c) => c.id === cardId);
        if (card) {
            const list = inMemoryStore.lists.find((l) => l.id === card.list_id);
            return { rows: [{ ...card, board_id: list ? list.board_id : 1, list_title: list ? list.title : '' }], rowCount: 1 };
        }
        return { rows: [], rowCount: 0 };
    }

    if (lower.includes('from cards') && lower.includes('where c.list_id =')) {
        const listId = parseInt(params[0], 10);
        const cards = inMemoryStore.cards.filter((c) => c.list_id === listId && !c.is_archived).map((c) => {
            const labelIds = inMemoryStore.card_labels.filter((cl) => cl.card_id === c.id).map((cl) => cl.label_id);
            const labels = inMemoryStore.labels.filter((lbl) => labelIds.includes(lbl.id));
            const comments = inMemoryStore.comments.filter((cmt) => cmt.card_id === c.id);
            return { ...c, labels, comment_count: comments.length };
        });
        return { rows: cards, rowCount: cards.length };
    }

    if (lower.startsWith('update cards')) {
        const cardId = parseInt(params[params.length - 1], 10);
        const card = inMemoryStore.cards.find((c) => c.id === cardId);
        if (card) {
            if (lower.includes('list_id =') && params[0]) card.list_id = parseInt(params[0], 10);
            if (lower.includes('position =') && params[1] !== undefined) card.position = parseInt(params[1], 10);
            if (lower.includes('title =')) card.title = params[0];
            if (lower.includes('is_archived =')) card.is_archived = params[0];
            if (lower.includes('completed_at =')) card.completed_at = params[0];
        }
        return { rows: card ? [card] : [], rowCount: card ? 1 : 0 };
    }

    // 6. Comments & Labels Queries
    if (lower.startsWith('insert into comments')) {
        const id = inMemoryStore.counters.comments++;
        const comment = {
            id,
            card_id: parseInt(params[0], 10),
            user_id: parseInt(params[1], 10),
            content: params[2],
            created_at: new Date().toISOString(),
        };
        inMemoryStore.comments.push(comment);
        return { rows: [comment], rowCount: 1 };
    }

    if (lower.includes('from comments') && lower.includes('where c.card_id =')) {
        const cardId = parseInt(params[0], 10);
        const comments = inMemoryStore.comments.filter((c) => c.card_id === cardId).map((c) => {
            const u = inMemoryStore.users.find((user) => user.id === c.user_id);
            return { ...c, username: u ? u.username : 'User', email: u ? u.email : '' };
        });
        return { rows: comments, rowCount: comments.length };
    }

    if (lower.includes('from labels')) {
        return { rows: inMemoryStore.labels, rowCount: inMemoryStore.labels.length };
    }

    if (lower.startsWith('insert into activity_logs')) {
        const id = inMemoryStore.counters.activity_logs++;
        const log = {
            id,
            board_id: parseInt(params[0], 10),
            card_id: params[1] ? parseInt(params[1], 10) : null,
            user_id: parseInt(params[2], 10),
            action: params[3],
            details: params[4],
            created_at: new Date().toISOString(),
        };
        inMemoryStore.activity_logs.push(log);
        return { rows: [log], rowCount: 1 };
    }

    if (lower.includes('from activity_logs')) {
        const boardId = parseInt(params[0], 10);
        const logs = inMemoryStore.activity_logs.filter((al) => al.board_id === boardId).map((al) => {
            const u = inMemoryStore.users.find((user) => user.id === al.user_id);
            return { ...al, username: u ? u.username : 'User', email: u ? u.email : '' };
        });
        return { rows: logs, rowCount: logs.length };
    }

    return { rows: [], rowCount: 0 };
}

export default {
    pool,
    query,
};
