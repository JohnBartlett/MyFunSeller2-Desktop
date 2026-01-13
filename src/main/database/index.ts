import Database from 'better-sqlite3';
import { app } from 'electron';
import path from 'path';
import fs from 'fs';
import { createSchema } from './schema';

let db: Database.Database | null = null;

export const initializeDatabase = (): Database.Database => {
  if (db) {
    return db;
  }

  // Ensure data directory exists
  const dataDir = path.join(app.getPath('userData'), '..', '..', 'MyFunSeller2', 'data');
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }

  const dbPath = path.join(dataDir, 'myfunseller.db');

  // Create database connection
  db = new Database(dbPath, {
    verbose: process.env.NODE_ENV === 'development' ? console.log : undefined
  });

  // Enable WAL mode for better concurrent access
  db.pragma('journal_mode = WAL');
  db.pragma('foreign_keys = ON');

  // Create schema
  createSchema(db);

  console.log(`Database initialized at: ${dbPath}`);

  return db;
};

export const getDatabase = (): Database.Database => {
  if (!db) {
    throw new Error('Database not initialized. Call initializeDatabase() first.');
  }
  return db;
};

export const closeDatabase = (): void => {
  if (db) {
    db.close();
    db = null;
  }
};

// Handle app quit
app.on('before-quit', () => {
  closeDatabase();
});
