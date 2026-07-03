/**
 * Memory - Модель памяти
 */

export type MemoryCategory = 'personal' | 'preference' | 'fact' | 'context';

export interface Memory {
  id: number;
  session_id: string;
  key: string;
  value: string;
  category: MemoryCategory;
  content: string;
  created_at: Date;
  updated_at: Date;
}

export interface CreateMemoryDTO {
  session_id: string;
  key: string;
  value: string;
  category?: MemoryCategory;
  content: string;
}

export interface UpdateMemoryDTO {
  value?: string;
  category?: MemoryCategory;
  content?: string;
}

import { DatabaseClient } from '../database/DatabaseClient.js';

export class Memory {
  constructor(private db: DatabaseClient) {}

  /**
   * Создать память
   */
  async create(dto: CreateMemoryDTO): Promise<number> {
    return await this.db.insert('memories', dto as unknown as Record<string, unknown>);
  }

  /**
   * Найти память по key
   */
  async findByKey(key: string): Promise<Memory | null> {
    const rows = await this.db.select('memories', { key });
    return rows[0] as Memory || null;
  }

  /**
   * Найти все памяти по session_id
   */
  async findBySessionId(sessionId: string): Promise<Memory[]> {
    const rows = await this.db.select('memories', { session_id: sessionId });
    return rows as Memory[];
  }

  /**
   * Обновить память по key
   */
  async updateByKey(key: string, dto: UpdateMemoryDTO): Promise<number> {
    return await this.db.update('memories', dto as unknown as Record<string, unknown>, { key });
  }

  /**
   * Удалить память по id
   */
  async deleteById(id: number): Promise<number> {
    return await this.db.delete('memories', { id });
  }

  /**
   * Удалить все памяти по session_id
   */
  async deleteBySessionId(sessionId: string): Promise<number> {
    return await this.db.delete('memories', { session_id: sessionId });
  }
}