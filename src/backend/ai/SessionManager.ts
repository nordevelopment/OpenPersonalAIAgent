/**
 * SessionManager - Управление сессиями чата
 * Отвечает за создание, поиск и удаление сессий
 */
import { Session } from '../models/session.js';
import { DatabaseClient } from '../database/DatabaseClient.js';

export class SessionManager {
  private sessionModel: Session;

  constructor(db: DatabaseClient) {
    this.sessionModel = new Session(db);
  }

  /**
   * Создать новую сессию
   * @param sessionId - идентификатор сессии
   * @returns созданная сессия
   */
  async createSession(sessionId: string, agentId?: string): Promise<Session> {
    await this.sessionModel.create({
      id: sessionId,
      agent_id: agentId || 'main_agent'
    });
    return await this.sessionModel.findById(sessionId) as Session;
  }

  /**
   * Получить сессию по id
   * @param sessionId - идентификатор сессии
   * @returns сессия или null
   */
  async getSession(sessionId: string): Promise<Session | null> {
    return await this.sessionModel.findById(sessionId);
  }

  /**
   * Получить все сессии
   * @returns массив всех сессий
   */
  async getAllSessions(): Promise<Session[]> {
    return await this.sessionModel.findAll();
  }

  /**
   * Получить последнюю сессию
   */
  async getLastSession(): Promise<Session | null> {
    return await this.sessionModel.findLast();
  }

  /**
   * Удалить сессию по id
   * @param sessionId - идентификатор сессии
   * @returns количество удаленных записей
   */
  async deleteSession(sessionId: string): Promise<number> {
    return await this.sessionModel.deleteById(sessionId);
  }
}
