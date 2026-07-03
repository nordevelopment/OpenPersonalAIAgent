/**
 * SessionManager - Session management
 * Responsible for creating, finding and deleting sessions
 * Author: Norayr Petrosyan
 */
import { Session } from '../models/session.js';
import { DatabaseClient } from '../database/DatabaseClient.js';

export class SessionManager {
  private sessionModel: Session;

  constructor(db: DatabaseClient) {
    this.sessionModel = new Session(db);
  }

  /**
   * Create new session
   * @param sessionId - session ID
   * @param agentId - agent ID
   * @returns created session
   */
  async createSession(sessionId: string, agentId?: string): Promise<Session> {
    await this.sessionModel.create({
      id: sessionId,
      agent_id: agentId || 'main_agent'
    });
    return await this.sessionModel.findById(sessionId) as Session;
  }

  /**
   * Get session by ID
   * @param sessionId - session ID
   * @returns session or null
   */
  async getSession(sessionId: string): Promise<Session | null> {
    return await this.sessionModel.findById(sessionId);
  }

  /**
   * Get all sessions
   * @returns array of sessions
   */
  async getAllSessions(): Promise<Session[]> {
    return await this.sessionModel.findAll();
  }

  /**
   * Get last session
   * @returns last session or null
   */
  async getLastSession(): Promise<Session | null> {
    return await this.sessionModel.findLast();
  }

  /**
   * Delete session by ID
   * @param sessionId - session ID
   * @returns number of deleted records
   */
  async deleteSession(sessionId: string): Promise<number> {
    return await this.sessionModel.deleteById(sessionId);
  }

  /**
   * Update sessions using oldAgentId to use newAgentId
   */
  async updateSessionsAgent(oldAgentId: string, newAgentId: string): Promise<number> {
    return await this.sessionModel.updateAgentId(oldAgentId, newAgentId);
  }
}
