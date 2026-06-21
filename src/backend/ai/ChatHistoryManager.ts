/**
 * ChatHistoryManager - Manages chat history
 * Responsible for storing and retrieving message history in SQLite
 * Author: Norayr Petrosyan
 */
import { AIMessages } from './AIClient.js';
import { Message, CreateMessage } from '../models/message.js';
import { Session } from '../models/session.js';
import { DatabaseClient } from '../database/DatabaseClient.js';

export class ChatHistoryManager {
  private messageModel: Message;
  private sessionModel: Session;

  constructor(db: DatabaseClient) {
    this.messageModel = new Message(db);
    this.sessionModel = new Session(db);
  }

  /**
   * Get chat history
   * @param sessionId - session ID
   * @returns array of messages
   */
  async getHistory(sessionId: string): Promise<AIMessages[]> {
    // console.log('ChatHistoryManager: getHistory called', { sessionId });
    const messages = await this.messageModel.findBySessionId(sessionId);
    return messages.map(msg => {
      let content: any = msg.content;
      if (content && typeof content === 'string' && content.startsWith('[')) {
        try {
          content = JSON.parse(content);
        } catch (e) {
          // ignore
        }
      }
      const result: AIMessages = {
        role: msg.role,
        content: content,
      };
      if (msg.tool_call_id) {
        result.tool_call_id = msg.tool_call_id;
      }
      if (msg.tool_calls) {
        result.tool_calls = JSON.parse(msg.tool_calls);
      }
      return result;
    });
  }

  /**
   * Add message to history
   * @param sessionId - session ID
   * @param message - message to add
   */
  async addMessage(sessionId: string, message: AIMessages): Promise<void> {
    // console.log('ChatHistoryManager: addMessage called', { sessionId, message });

    // Ensure session exists
    const session = await this.sessionModel.findById(sessionId);
    if (!session) {
      await this.sessionModel.create({ id: sessionId });
    }

    const createDto: CreateMessage = {
      session_id: sessionId,
      role: message.role,
      content: typeof message.content === 'string' ? message.content : (message.content ? JSON.stringify(message.content) : ''),
    };

    if (message.tool_call_id !== undefined) {
      createDto.tool_call_id = message.tool_call_id;
    }
    if (message.tool_calls) {
      createDto.tool_calls = JSON.stringify(message.tool_calls);
    }

    await this.messageModel.create(createDto);
  }

  /**
   * Clear chat history
   * @param sessionId - session ID
   */
  async clearHistory(sessionId: string): Promise<void> {
    // console.log('ChatHistoryManager: clearHistory called', { sessionId });
    await this.messageModel.deleteBySessionId(sessionId);
  }

}
