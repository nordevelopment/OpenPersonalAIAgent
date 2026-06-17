/**
 * DatabaseClient - Клиент для работы с SQLite
 * Низкоуровневый доступ к базе данных
 */
import Database from 'better-sqlite3';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import * as sqliteVec from 'sqlite-vec';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);


export interface QueryResult {
  rows: unknown[];
  changes: number;
}

export class DatabaseClient {
  private db: Database.Database;

  constructor(dbPath: string = './database.sqlite') {
    // Создаём/открываем базу
    this.db = new Database(dbPath);

    // Загружаем sqlite-vec расширение для векторного поиска
    sqliteVec.load(this.db);

    // Включаем WAL режим для лучшей производительности
    this.db.pragma('journal_mode = WAL');

    // Включаем foreign keys
    this.db.pragma('foreign_keys = ON');
    this.db.pragma('synchronous = NORMAL');
  }

  /**
   * Выполнить SQL запрос (SELECT)
   * @param sql - SQL запрос
   * @param params - параметры запроса
   * @returns результат запроса
   */
  async query(sql: string, params: unknown[] = []): Promise<QueryResult> {
    try {
      const stmt = this.db.prepare(sql);
      const rows = stmt.all(...params);
      return {
        rows,
        changes: 0,
      };
    } catch (error) {
      console.error('DatabaseClient: query error', { sql, params, error });
      throw error;
    }
  }

  /**
   * Вставить данные в таблицу
   * @param table - имя таблицы
   * @param data - данные для вставки
   * @returns ID вставленной записи
   */
  async insert(table: string, data: Record<string, unknown>): Promise<number> {
    try {
      const cleanData = Object.fromEntries(Object.entries(data).filter(([_, v]) => v !== undefined));
      const columns = Object.keys(cleanData).join(', ');
      const placeholders = Object.keys(cleanData).map(() => '?').join(', ');
      const values = Object.values(cleanData);

      const sql = `INSERT INTO ${table} (${columns}) VALUES (${placeholders})`;
      const stmt = this.db.prepare(sql);
      const result = stmt.run(...values);

      return Number(result.lastInsertRowid);
    } catch (error) {
      console.error('DatabaseClient: insert error', { table, data, error });
      throw error;
    }
  }

  /**
   * Получить данные из таблицы
   * @param table - имя таблицы
   * @param where - условия фильтрации
   * @returns массив записей
   */
  async select(table: string, where: Record<string, unknown> = {}): Promise<unknown[]> {
    try {
      let sql = `SELECT * FROM ${table}`;
      const values: unknown[] = [];

      if (Object.keys(where).length > 0) {
        const conditions = Object.keys(where).map(key => {
          values.push(where[key]);
          return `${key} = ?`;
        }).join(' AND ');
        sql += ` WHERE ${conditions}`;
      }

      const stmt = this.db.prepare(sql);
      return stmt.all(...values);
    } catch (error) {
      console.error('DatabaseClient: select error', { table, where, error });
      throw error;
    }
  }

  /**
   * Обновить данные в таблице
   * @param table - имя таблицы
   * @param data - данные для обновления
   * @param where - условия фильтрации
   * @returns количество измененных записей
   */
  async update(table: string, data: Record<string, unknown>, where: Record<string, unknown>): Promise<number> {
    try {
      const cleanData = Object.fromEntries(Object.entries(data).filter(([_, v]) => v !== undefined));
      const setClause = Object.keys(cleanData).map(key => `${key} = ?`).join(', ');
      const whereClause = Object.keys(where).map(key => `${key} = ?`).join(' AND ');
      const values = [...Object.values(cleanData), ...Object.values(where)];

      const sql = `UPDATE ${table} SET ${setClause} WHERE ${whereClause}`;
      const stmt = this.db.prepare(sql);
      const result = stmt.run(...values);

      return result.changes;
    } catch (error) {
      console.error('DatabaseClient: update error', { table, data, where, error });
      throw error;
    }
  }

  /**
   * Удалить данные из таблицы
   * @param table - имя таблицы
   * @param where - условия фильтрации
   * @returns количество удаленных записей
   */
  async delete(table: string, where: Record<string, unknown>): Promise<number> {
    try {
      const whereClause = Object.keys(where).map(key => `${key} = ?`).join(' AND ');
      const values = Object.values(where);

      const sql = `DELETE FROM ${table} WHERE ${whereClause}`;
      console.log(sql);
      const stmt = this.db.prepare(sql);
      const result = stmt.run(...values);

      return result.changes;
    } catch (error) {
      console.error('DatabaseClient: delete error', { table, where, error });
      throw error;
    }
  }

  /**
   * Инициализировать базу данных (создать таблицы)
   */
  async initialize(): Promise<void> {
    const schemaPath = path.join(__dirname, 'schema.sql');

    if (!fs.existsSync(schemaPath)) {
      console.warn('DatabaseClient: schema.sql not found, skipping initialization');
      return;
    }

    const schema = fs.readFileSync(schemaPath, 'utf-8');
    this.db.exec(schema);
    console.log('DatabaseClient: initialized');
  }

  /**
   * Закрыть соединение с базой
   */
  close(): void {
    this.db.close();
  }
}
