/**
 * TaskModel - Model for managing background tasks
 * Author: Antigravity AI
 */

import { DatabaseClient } from '../database/DatabaseClient.js';

export interface Task {
  id: number;
  title: string;
  status: 'ready' | 'done' | 'running' | 'failed';
  result?: string;
  run_at?: string;
  created_at: string;
  updated_at: string;
}

export interface CreateTask {
  title: string;
  status?: 'ready' | 'done' | 'running' | 'failed';
  result?: string;
  run_at?: string;
}

export class TaskModel {
  constructor(private db: DatabaseClient) {}

  /**
   * Create a new task
   * @param dto Task details
   * @returns Inserted task ID
   */
  async create(dto: CreateTask): Promise<number> {
    return await this.db.insert('tasks', {
      title: dto.title,
      status: dto.status || 'ready',
      result: dto.result || null,
      run_at: dto.run_at || null
    });
  }

  /**
   * Find a task by ID
   * @param id Task ID
   */
  async findById(id: number): Promise<Task | null> {
    const rows = await this.db.select('tasks', { id });
    return rows[0] as Task || null;
  }

  /**
   * Get all tasks ordered by creation date desc
   */
  async findAll(): Promise<Task[]> {
    const result = await this.db.query('SELECT * FROM tasks ORDER BY created_at DESC');
    return result.rows as Task[];
  }

  /**
   * Find tasks that are ready to run (status = 'ready' and run_at is null or passed)
   * @param nowIso Current timestamp in ISO format
   */
  async findReadyToRun(nowIso: string): Promise<Task[]> {
    const result = await this.db.query(
      'SELECT * FROM tasks WHERE status = \'ready\' AND (run_at IS NULL OR run_at <= ?)',
      [nowIso]
    );
    return result.rows as Task[];
  }

  /**
   * Update task fields
   * @param id Task ID
   * @param data Fields to update
   */
  async update(id: number, data: Partial<CreateTask>): Promise<number> {
    const updateData = {
      ...data,
      updated_at: new Date().toISOString()
    };
    return await this.db.update('tasks', updateData, { id });
  }

  /**
   * Delete task by ID
   * @param id Task ID
   */
  async delete(id: number): Promise<number> {
    return await this.db.delete('tasks', { id });
  }
}
