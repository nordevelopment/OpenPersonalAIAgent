/**
 * ChatManager.ts - Оркестратор чата
 * Собирает все компоненты вместе: AIClient, ChatHistoryManager, AITools, MemoryManager
 * Author: Norayr Petrosyan
 */

import { AIClient, AIMessages } from './AIClient.js';
import { ChatHistoryManager } from './ChatHistoryManager.js';
import { SessionManager } from './SessionManager.js';
import { AITools } from './AITools.js';
import { MemoryManager } from './MemoryManager.js';
import { config } from '../config.js';

export class ChatManager {
  constructor(
    private aiClient: AIClient,
    private historyManager: ChatHistoryManager,
    private tools: AITools,
    _memoryManager: MemoryManager,
    private sessionManager: SessionManager
  ) { }

  /**
   * Отправить сообщение в чат
   * @param userMessage - сообщение пользователя
   * @param sessionId - идентификатор сессии
   * @returns ответ от AI
   */


  async sendMessage(userMessage: string, sessionId: string, imageBase64?: string): Promise<{ content: string; reasoning?: string }> {
    let finalContent: any = userMessage;

    if (imageBase64) {
      try {
        const processed = await this.aiClient.processImage({ base64: imageBase64, url: '' });
        finalContent = [
          { type: 'text', text: userMessage || 'Опиши это изображение' },
          { type: 'image_url', image_url: { url: processed.filePath } }
        ];
      } catch (err) {
        console.error('[ChatManager] Failed to process incoming image:', err);
      }
    }

    // 1. Сохраняем сообщение пользователя
    await this.historyManager.addMessage(sessionId, {
      role: 'user',
      content: finalContent
    });

    // Получаем текущие доступные инструменты
    const availableTools = this.tools.getAvailableTools();

    let lastReasoning: string | undefined = undefined;

    // Запускаем цикл взаимодействия с AI (максимум 5 итераций, чтобы не уйти в бесконечный цикл)
    for (let i = 0; i < 5; i++) {
      const fullHistory = await this.historyManager.getHistory(sessionId);

      // Ограничиваем историю последних сообщений из конфига
      const history = fullHistory.slice(-config.AI_MAX_HISTORY_MESSAGES);

      // 2. Получаем ID агента для этой сессии
      const session = await this.sessionManager.getSession(sessionId);
      const agentId = session?.agent_id || 'main_agent';

      // 3. Запрос к AI (передаем историю, ID агента и описание инструментов)
      const aiResponse = await this.aiClient.sendMessage(history, agentId, availableTools);

      if (aiResponse.reasoning) {
        lastReasoning = aiResponse.reasoning;
      }

      // Если ИИ просто ответил текстом (без вызова инструментов)
      if (!aiResponse.toolCalls || aiResponse.toolCalls.length === 0) {
        const finalContent = aiResponse.content ?? "Я не смог подготовить ответ, Господин.";

        await this.historyManager.addMessage(sessionId, {
          role: 'assistant',
          content: finalContent
        });

        return { content: finalContent, reasoning: lastReasoning };
      }

      await this.historyManager.addMessage(sessionId, {
        role: 'assistant',
        content: aiResponse.content || '',
        tool_calls: aiResponse.toolCalls
      });

      console.log(`[Agent] AI decided to use ${aiResponse.toolCalls.length} tools`);
      console.log('Executing tools:', aiResponse.toolCalls);

      for (const toolCall of aiResponse.toolCalls) {
        try {
          const result = await this.tools.executeTool({
            name: toolCall.function.name,
            arguments: JSON.parse(toolCall.function.arguments)
          });

          // 4. Сохраняем результат выполнения инструмента в историю
          await this.historyManager.addMessage(sessionId, {
            role: 'tool',
            content: JSON.stringify(result.result),
            tool_call_id: toolCall.id
          });
        } catch (error) {
          console.error(`[ChatManager] Error executing tool ${toolCall.function.name}:`, error);
          // Сохраняем ошибку в историю, чтобы AI знал, что пошло не так
          await this.historyManager.addMessage(sessionId, {
            role: 'tool',
            content: JSON.stringify({ error: (error as Error).message }),
            tool_call_id: toolCall.id
          });
        }
      }

    }

    return { content: "Превышен лимит итераций размышления, Господин." };
  }


  /**
   * Получить историю чата
   * @param sessionId - идентификатор сессии
   * @returns массив сообщений
   */
  async getHistory(sessionId: string): Promise<AIMessages[]> {
    console.log(`[ChatManager] Getting history for session: ${sessionId}`);
    return await this.historyManager.getHistory(sessionId);
  }

  async getAllSessions(): Promise<any[]> {
    return await this.sessionManager.getAllSessions();
  }

  async getLastSession(): Promise<any | null> {
    return await this.sessionManager.getLastSession();
  }

  /**
   * Очистить историю чата
   * @param sessionId - идентификатор сессии
   */
  async clearHistory(sessionId: string): Promise<void> {
    await this.historyManager.clearHistory(sessionId);
  }


  /**
   * Создать новую сессию
   * @param sessionId - идентификатор сессии
   * @param agentId - идентификатор агента
   */
  async createSession(sessionId: string, agentId?: string): Promise<void> {
    await this.sessionManager.createSession(sessionId, agentId);
  }

  /**
   * Удалить сессию
   * @param sessionId - идентификатор сессии
   */
  async deleteSession(sessionId: string): Promise<number> {
    // История сообщений и воспоминания удалятся автоматически благодаря ON DELETE CASCADE
    return await this.sessionManager.deleteSession(sessionId);
  }

  /**
   * Получить сессию
   * @param sessionId - идентификатор сессии
   */
  async getSession(sessionId: string): Promise<any> {
    return await this.sessionManager.getSession(sessionId);
  }
}
