/**
 * ChatHistoryManager - Управление историей чата
 * Отвечает за хранение и извлечение истории сообщений в SQLite
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
   * Получить историю для сессии
   * @param sessionId - идентификатор сессии
   * @returns массив сообщений
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
   * Добавить сообщение в историю
   * @param sessionId - идентификатор сессии
   * @param message - сообщение для добавления
   */
  async addMessage(sessionId: string, message: AIMessages): Promise<void> {
    console.log('ChatHistoryManager: addMessage called', { sessionId, message });

    // Убедиться, что сессия существует
    const session = await this.sessionModel.findById(sessionId);
    console.log('Session exists:', !!session);
    if (!session) {
      console.log('Creating session:', sessionId);
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

    const result = await this.messageModel.create(createDto);
    console.log('Message created with ID:', result);
  }

  /**
   * Очистить историю сессии
   * @param sessionId - идентификатор сессии
   */
  async clearHistory(sessionId: string): Promise<void> {
    // console.log('ChatHistoryManager: clearHistory called', { sessionId });
    await this.messageModel.deleteBySessionId(sessionId);
  }

}
