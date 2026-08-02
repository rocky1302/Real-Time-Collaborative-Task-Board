import http from 'http';
import dotenv from 'dotenv';
import app from './app.js';
import { initSocket } from './socket/socketHandler.js';
import logger from './config/logger.js';
import { query } from './config/db.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = process.env.PORT || 5000;

const server = http.createServer(app);

// Initialize Socket.io
export const io = initSocket(server);

// Database Schema Initialization Helper
const initializeDatabase = async () => {
    try {
        const schemaPath = path.join(__dirname, 'models', 'schema.sql');
        if (fs.existsSync(schemaPath)) {
            const sql = fs.readFileSync(schemaPath, 'utf8');
            await query(sql);
            logger.info('Database schema verified and loaded successfully');
        }
    } catch (err) {
        logger.warn(`Database connection warning: ${err.message}. Ensure PostgreSQL server is running or configured in .env.`);
    }
};

server.listen(PORT, async () => {
    logger.info(`Server running on port ${PORT} in ${process.env.NODE_ENV || 'development'} mode`);
    logger.info(`Swagger Documentation available at http://localhost:${PORT}/api-docs`);
    await initializeDatabase();
});

// Process signal handlers
process.on('unhandledRejection', (reason, promise) => {
    logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

process.on('uncaughtException', (err) => {
    logger.error('Uncaught Exception thrown:', err);
});
