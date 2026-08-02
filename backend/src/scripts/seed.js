import bcrypt from 'bcryptjs';
import { query, pool } from '../config/db.js';
import logger from '../config/logger.js';

async function seed() {
    logger.info('🌱 Starting Database Seeding...');

    try {
        // 1. Ensure Schema Tables Exist
        await query(`
            CREATE TABLE IF NOT EXISTS users (
                id SERIAL PRIMARY KEY,
                username VARCHAR(50) UNIQUE NOT NULL,
                email VARCHAR(255) UNIQUE NOT NULL,
                password_hash VARCHAR(255) NOT NULL,
                refresh_token TEXT,
                created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
            );
            CREATE TABLE IF NOT EXISTS boards (
                id SERIAL PRIMARY KEY,
                title VARCHAR(100) NOT NULL,
                description TEXT,
                owner_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
            );
            CREATE TABLE IF NOT EXISTS board_members (
                id SERIAL PRIMARY KEY,
                board_id INT NOT NULL REFERENCES boards(id) ON DELETE CASCADE,
                user_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                role VARCHAR(20) NOT NULL CHECK (role IN ('owner', 'editor', 'viewer')),
                created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
                UNIQUE(board_id, user_id)
            );
            CREATE TABLE IF NOT EXISTS lists (
                id SERIAL PRIMARY KEY,
                board_id INT NOT NULL REFERENCES boards(id) ON DELETE CASCADE,
                title VARCHAR(100) NOT NULL,
                position INT NOT NULL DEFAULT 0,
                created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
            );
            CREATE TABLE IF NOT EXISTS cards (
                id SERIAL PRIMARY KEY,
                list_id INT NOT NULL REFERENCES lists(id) ON DELETE CASCADE,
                title VARCHAR(255) NOT NULL,
                description TEXT,
                position INT NOT NULL DEFAULT 0,
                due_date TIMESTAMP WITH TIME ZONE,
                completed_at TIMESTAMP WITH TIME ZONE,
                is_archived BOOLEAN NOT NULL DEFAULT FALSE,
                created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
            );
            CREATE TABLE IF NOT EXISTS comments (
                id SERIAL PRIMARY KEY,
                card_id INT NOT NULL REFERENCES cards(id) ON DELETE CASCADE,
                user_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                content TEXT NOT NULL,
                created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
            );
            CREATE TABLE IF NOT EXISTS activity_logs (
                id SERIAL PRIMARY KEY,
                board_id INT NOT NULL REFERENCES boards(id) ON DELETE CASCADE,
                card_id INT REFERENCES cards(id) ON DELETE SET NULL,
                user_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                action VARCHAR(100) NOT NULL,
                details JSONB,
                created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
            );
            CREATE TABLE IF NOT EXISTS labels (
                id SERIAL PRIMARY KEY,
                name VARCHAR(50) NOT NULL UNIQUE,
                color VARCHAR(20) NOT NULL
            );
            CREATE TABLE IF NOT EXISTS card_labels (
                card_id INT NOT NULL REFERENCES cards(id) ON DELETE CASCADE,
                label_id INT NOT NULL REFERENCES labels(id) ON DELETE CASCADE,
                PRIMARY KEY (card_id, label_id)
            );
        `);

        // 2. Create Users
        const passwordHash = await bcrypt.hash('Password123!', 10);
        
        const resUser1 = await query(
            `INSERT INTO users (username, email, password_hash) 
             VALUES ($1, $2, $3) 
             ON CONFLICT (email) DO UPDATE SET username = EXCLUDED.username 
             RETURNING id, username, email`,
            ['alex_dev', 'demo@example.com', passwordHash]
        );
        const user1 = resUser1.rows[0];

        const resUser2 = await query(
            `INSERT INTO users (username, email, password_hash) 
             VALUES ($1, $2, $3) 
             ON CONFLICT (email) DO UPDATE SET username = EXCLUDED.username 
             RETURNING id, username, email`,
            ['sarah_pm', 'sarah@example.com', passwordHash]
        );
        const user2 = resUser2.rows[0];

        logger.info(`✅ Seeded Users: ${user1.email} (alex_dev), ${user2.email} (sarah_pm)`);

        // 3. Create Boards
        let board1Id = 1;
        const resBoard1 = await query(
            `INSERT INTO boards (title, description, owner_id) 
             VALUES ($1, $2, $3) RETURNING id, title`,
            ['🚀 Q3 Engineering Sprint', 'Main sprint board for full-stack feature delivery & API polish', user1.id]
        );
        if (resBoard1.rows.length > 0) board1Id = resBoard1.rows[0].id;

        await query(
            `INSERT INTO board_members (board_id, user_id, role) VALUES ($1, $2, $3) ON CONFLICT DO NOTHING`,
            [board1Id, user2.id, 'editor']
        );

        logger.info(`✅ Seeded Board: "🚀 Q3 Engineering Sprint" (ID: ${board1Id})`);

        // 4. Create Lists
        const listsData = [
            { title: 'To Do', position: 0 },
            { title: 'In Progress', position: 1 },
            { title: 'Review', position: 2 },
            { title: 'Done', position: 3 },
        ];

        const createdLists = [];
        for (const l of listsData) {
            const res = await query(
                `INSERT INTO lists (board_id, title, position) VALUES ($1, $2, $3) RETURNING id, title`,
                [board1Id, l.title, l.position]
            );
            if (res.rows.length > 0) createdLists.push(res.rows[0]);
        }

        logger.info(`✅ Seeded ${createdLists.length} Board Lists`);

        // 5. Create Cards
        if (createdLists.length >= 4) {
            const listBacklog = createdLists[0].id;
            const listInProgress = createdLists[1].id;
            const listReview = createdLists[2].id;
            const listDone = createdLists[3].id;

            const cardsData = [
                {
                    list_id: listInProgress,
                    title: '⚡ Implement Socket.io Room Sync',
                    description: 'Broadcast card creation, movements, and comments in real-time across connected clients.',
                    position: 0,
                    due_date: new Date(Date.now() + 86400000 * 2).toISOString(),
                },
                {
                    list_id: listInProgress,
                    title: '🔐 JWT Access & Refresh Token Rotation',
                    description: 'Configure 15m access token expiry and DB-backed refresh token rotation.',
                    position: 1,
                    due_date: new Date(Date.now() + 86400000 * 5).toISOString(),
                },
                {
                    list_id: listReview,
                    title: '🛡️ Role-Based Access Control Middleware',
                    description: 'Enforce Owner, Editor, Viewer permission checks on protected endpoints.',
                    position: 0,
                },
                {
                    list_id: listDone,
                    title: '🗄️ PostgreSQL DDL & Index Optimization',
                    description: 'Designed normalized ERD schemas and added indexes on foreign key constraints.',
                    position: 0,
                },
                {
                    list_id: listBacklog,
                    title: '🐳 Docker Compose Container Deployment',
                    description: 'Containerize Node Express backend, React Vite frontend, and PostgreSQL DB instance.',
                    position: 0,
                },
            ];

            for (const c of cardsData) {
                const resCard = await query(
                    `INSERT INTO cards (list_id, title, description, position, due_date) VALUES ($1, $2, $3, $4, $5) RETURNING id, title`,
                    [c.list_id, c.title, c.description, c.position, c.due_date || null]
                );

                if (resCard.rows.length > 0) {
                    const cardId = resCard.rows[0].id;
                    // Add sample comment
                    await query(
                        `INSERT INTO comments (card_id, user_id, content) VALUES ($1, $2, $3)`,
                        [cardId, user1.id, `Initial draft completed for "${c.title}". Ready for review.`]
                    );
                }
            }
            logger.info('✅ Seeded Cards & Comments successfully');
        }

        // 6. Activity Logs
        await query(
            `INSERT INTO activity_logs (board_id, user_id, action, details) VALUES ($1, $2, $3, $4)`,
            [board1Id, user1.id, 'BOARD_CREATED', JSON.stringify({ board_title: '🚀 Q3 Engineering Sprint' })]
        );

        logger.info('🎉 Database Seeding Completed Successfully!');
        logger.info('👉 Demo Login: demo@example.com | Password: Password123!');
    } catch (err) {
        logger.error(`❌ Seeding failed: ${err.message}`);
    } finally {
        if (pool) {
            await pool.end();
        }
    }
}

seed();
