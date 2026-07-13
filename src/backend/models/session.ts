/**
 * Session - Модель сессии чата
 */

export interface Session {
  id: string;
  agent_id: string;
  title?: string;
  created_at: Date;
}

export interface CreateSession {
  id: string;
  agent_id?: string;
  title?: string;
}

import { DatabaseClient } from '../database/DatabaseClient.js';

export class Session {
  constructor(private db: DatabaseClient) { }

  /**
   * Создать сессию
   */
  async create(dto: CreateSession): Promise<number> {
    return await this.db.insert('sessions', dto as unknown as Record<string, unknown>);
  }

  /**
   * Найти сессию по id
   */
  async findById(id: string): Promise<Session | null> {
    const rows = await this.db.select('sessions', { id });
    return rows[0] as Session || null;
  }

  async findAll(): Promise<Session[]> {
    const rows = await this.db.select('sessions');
    return rows as Session[];
  }

  /**
   * Получить последнюю созданную сессию
   */
  async findLast(): Promise<Session | null> {
    const rows = await this.db.query('SELECT * FROM sessions ORDER BY created_at DESC LIMIT 1');
    return rows.rows[0] as Session || null;
  }

  /**
   * Удалить сессию по id
   */
  async deleteById(id: string): Promise<number> {
    return await this.db.delete('sessions', { id });
  }

  /**
   * Обновить заголовок сессии
   */
  async updateTitle(id: string, title: string): Promise<number> {
    return await this.db.update('sessions', { title }, { id });
  }

  /**
   * Обновить ID агента для всех сессий с определенным ID агента
   */
  async updateAgentId(oldAgentId: string, newAgentId: string): Promise<number> {
    return await this.db.update('sessions', { agent_id: newAgentId }, { agent_id: oldAgentId });
  }
}