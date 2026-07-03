/**
 * db-reset.ts - Reset and initialize the database
 */
import { DatabaseClient } from './DatabaseClient.js';
import fs from 'fs';

async function main() {
    console.log('Resetting database...');

    try {
        const dbPath = './database.sqlite';
        const walPath = './database.sqlite-wal';
        const shmPath = './database.sqlite-shm';

        // Delete the database files if they exist
        [dbPath, walPath, shmPath].forEach(p => {
            if (fs.existsSync(p)) {
                console.log(`Deleting ${p}...`);
                fs.unlinkSync(p);
            }
        });

        const db = new DatabaseClient();
        await db.initialize();
        db.close();

        console.log('Database reset successfully!');
    } catch (error) {
        console.error('Database reset failed:', error);
        process.exit(1);
    }
}

main();
