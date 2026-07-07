/**
 * Memory Service - Vector memory using sqlite-vec
 * Author: Norayr Petrosyan
 */

import { getDB } from '../database/sqlite.js';
import type { RunResult } from 'better-sqlite3';
import { config } from '../config/config.js';
import axios from 'axios';

export interface Memory {
  id: number;
  user_id: number;
  character_id: number;
  key: string;
  value: string;
  category: string;
  embedding?: Buffer;
  created_at: string;
  updated_at: string;
}

export interface SearchResult {
  memory: Memory;
  similarity: number;
}

export class MemoryService {
  /**
   * Get semantic embedding for text
   */
  private static async getEmbedding(text: string): Promise<number[]> {
    if (!config.ai.apiKey) {
      console.error('[Memory] ❌ No API key');
      return [];
    }

    try {
      const model = config.ai.embeddingModel || 'qwen/qwen3-embedding-8b';
      const embeddingUrl = config.ai.embeddingUrl || config.ai.apiUrl.replace('/chat/completions', '/embeddings');

      const response = await axios.post(
        embeddingUrl,
        { model, input: text.replace(/\n/g, ' ') },
        {
          headers: {
            'Authorization': `Bearer ${config.ai.apiKey}`,
            'Content-Type': 'application/json'
          },
          timeout: 10000
        }
      );

      if (response.data?.data?.[0]?.embedding) {
        return response.data.data[0].embedding;
      }
      return [];
    } catch (error: any) {
      console.error('[Memory] ❌ Embedding API error:', error.message);
      return [];
    }
  }

  private static serializeEmbedding(embedding: number[]): Buffer {
    const buffer = Buffer.alloc(embedding.length * 4);
    for (let i = 0; i < embedding.length; i++) {
      buffer.writeFloatLE(embedding[i], i * 4);
    }
    return buffer;
  }

  /**
   * Save a memory
   */
  static async saveMemory(
    userId: number,
    characterId: number,
    key: string,
    value: string,
    category: string = 'personal'
  ): Promise<Memory> {
    const db = getDB();
    const content = `${key}: ${value}`;
    const embedding = await this.getEmbedding(content);

    // Save text record first
    const sql = `
      INSERT INTO memories (user_id, character_id, key, value, category)
      VALUES (?, ?, ?, ?, ?)
    `;
    const result = db.prepare(sql).run(userId, characterId, key, value, category);
    const memoryId = Number(result.lastInsertRowid);

    if (embedding.length > 0) {
      try {
        const serialized = this.serializeEmbedding(embedding);

        // Use CAST to ensure integer type for rowid
        const vecSql = 'INSERT INTO vec_memories (rowid, embedding) VALUES (CAST(? AS INTEGER), ?)';
        db.prepare(vecSql).run(memoryId, serialized);
        console.log(`[Memory] ✅ Vector saved for ID ${memoryId} Bytes ${serialized.length}`);
      } catch (err: any) {
        console.error(`[Memory] ❌ Vector save failed (ID ${memoryId}):`, err.message);
      }
    }

    return this.getById(memoryId)!;
  }

  static getById(id: number): Memory | undefined {
    const db = getDB();
    return db.prepare('SELECT * FROM memories WHERE id = ?').get(id) as Memory | undefined;
  }

  static getByUserAndCharacter(userId: number, characterId: number): Memory[] {
    const db = getDB();
    return db.prepare(
      'SELECT * FROM memories WHERE user_id = ? AND character_id = ? ORDER BY updated_at DESC'
    ).all(userId, characterId) as Memory[];
  }

  static async searchMemories(
    userId: number,
    characterId: number,
    query: string,
    limit: number = 5
  ): Promise<SearchResult[]> {
    const db = getDB();
    const queryEmbedding = await this.getEmbedding(query);

    if (queryEmbedding.length === 0) {
      const keywords = this.searchMemoriesByKeyword(userId, characterId, query, limit);
      return keywords.map(m => ({ memory: m, similarity: 0.5 }));
    }

    const serializedQuery = this.serializeEmbedding(queryEmbedding);

    try {
      const sql = `
        SELECT 
          m.*, 
          1 - vec_distance_cosine(vm.embedding, ?) as similarity
        FROM memories m
        JOIN vec_memories vm ON m.id = vm.rowid
        WHERE m.user_id = ? AND m.character_id = ?
        ORDER BY similarity DESC
        LIMIT ?
      `;

      const results = db.prepare(sql).all(serializedQuery, userId, characterId, limit);

      return (results as any[]).map((row: any) => ({
        memory: {
          id: row.id,
          user_id: row.user_id,
          character_id: row.character_id,
          key: row.key,
          value: row.value,
          category: row.category,
          created_at: row.created_at,
          updated_at: row.updated_at
        },
        similarity: row.similarity
      }));
    } catch (error: any) {
      console.error('[Memory] ❌ Search error:', error.message);
      const fallback = this.searchMemoriesByKeyword(userId, characterId, query, limit);
      return fallback.map(m => ({ memory: m, similarity: 0.5 }));
    }
  }

  static searchMemoriesByKeyword(userId: number, characterId: number, query: string, limit: number = 5): Memory[] {
    const db = getDB();
    const searchTerm = `%${query.toLowerCase()}%`;
    return db.prepare(
      `SELECT * FROM memories 
       WHERE user_id = ? AND character_id = ? 
       AND (LOWER(key) LIKE ? OR LOWER(value) LIKE ?) 
       ORDER BY updated_at DESC LIMIT ?`
    ).all(userId, characterId, searchTerm, searchTerm, limit) as Memory[];
  }

  static async update(id: number, value: string): Promise<void> {
    const db = getDB();
    const memory = this.getById(id);
    if (!memory) return;

    const content = `${memory.key}: ${value}`;
    const embedding = await this.getEmbedding(content);

    db.prepare('UPDATE memories SET value = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?').run(value, id);

    if (embedding.length > 0) {
      const serialized = this.serializeEmbedding(embedding);
      db.prepare('UPDATE vec_memories SET embedding = ? WHERE rowid = ?').run(serialized, id);
    }
  }

  static delete(id: number): void {
    const db = getDB();
    db.prepare('DELETE FROM vec_memories WHERE rowid = ?').run(id);
    db.prepare('DELETE FROM memories WHERE id = ?').run(id);
  }

  static clearMemories(userId: number, characterId: number): RunResult {
    const db = getDB();
    db.prepare(`
      DELETE FROM vec_memories 
      WHERE rowid IN (SELECT id FROM memories WHERE user_id = ? AND character_id = ?)
    `).run(userId, characterId);
    return db.prepare('DELETE FROM memories WHERE user_id = ? AND character_id = ?').run(userId, characterId);
  }

  static async getRelevantContext(userId: number, characterId: number, query: string, limit: number = 3): Promise<string> {
    console.log('[Memory] Relevant memories:', query);
    if (query.trim().length < 10) return '';
    const results = await this.searchMemories(userId, characterId, query, limit);
    const filtered = results.filter(r => r.similarity > 0.6);
    console.log('[Memory] Relevant memories - filtered:', filtered);
    if (filtered.length === 0) return '';
    const contextItems = filtered.map(r => `  - ${r.memory.key}: ${r.memory.value}`);
    return `\n\n[YOUR MEMORIES]\n${contextItems.join('\n')}`;
  }
}

export const memoryService = new MemoryService();
