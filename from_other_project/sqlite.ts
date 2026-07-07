import Database from 'better-sqlite3';
import * as sqliteVec from 'sqlite-vec';
import { config } from '../config/config.js';

// Типизируем переменную сразу
let db: Database.Database | null = null;

/**
 * Инициализирует SQLite, подключает векторное расширение и настраивает PRAGMA.
 */
export function initDB(): Database.Database {
  if (db) return db;

  try {
    // Создаем экземпляр базы
    db = new Database(config.dbFile, {
      // verbose: config.debug.requests ? console.log : undefined // Логируем запросы, если включен дебаг
    });

    // Загружаем sqlite-vec для векторного поиска (RAG)
    sqliteVec.load(db);

    // Оптимизация производительности:
    // WAL — позволяет читать и писать одновременно без блокировок
    db.pragma('journal_mode = WAL');
    // Включаем поддержку внешних ключей (важно для связей в БД)
    db.pragma('foreign_keys = ON');
    // Синхронизация: NORMAL быстрее, чем FULL, и в WAL-режиме вполне безопасна
    db.pragma('synchronous = NORMAL');

    console.log(`[DB] SQLite (with sqlite-vec) initialized`);

    return db;
  } catch (error) {
    console.error('[DB] Failed to connect to SQLite:', error);
    process.exit(1);
  }
}

/**
 * Возвращает активный экземпляр базы данных.
 */
export function getDB(): Database.Database {
  if (!db) {
    return initDB();
  }
  return db;
}

/**
 * Закрывает базу данных при выходе (опционально, но полезно)
 */
export function closeDB() {
  if (db) {
    db.close();
    console.log('[DB] Connection closed.');
  }
}
