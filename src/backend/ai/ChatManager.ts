/**
 * ChatManager.ts - Orchestrator of chat
 * Author: Norayr Petrosyan
 * 
 * Orchestrates the chat by coordinating the AIClient, ChatHistoryManager, AITools, and MemoryManager
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
   * Send message to AI
   * @param userMessage - user message
   * @param sessionId - session ID
   * @returns AI response
   */


  async sendMessage(userMessage: string, sessionId: string, imageBase64?: string): Promise<{ content: string; reasoning?: string }> {
    let finalContent: any = userMessage;

    if (imageBase64) {
      try {
        const processed = await this.aiClient.processImage({ base64: imageBase64, url: '' });
        finalContent = [
          { type: 'text', text: userMessage || 'What is this image? Describe it in details.' },
          { type: 'image_url', image_url: { url: processed.filePath } }
        ];
      } catch (err) {
        console.error('[ChatManager] Failed to process incoming image:', err);
      }
    }

    // Save user message in history
    await this.historyManager.addMessage(sessionId, {
      role: 'user',
      content: finalContent
    });

    // Get current available tools
    const availableTools = this.tools.getAvailableTools();

    let lastReasoning: string | undefined = undefined;

    // Run loop of interaction with AI (maximum 5 iterations, to not go into infinite loop)
    for (let i = 0; i < 5; i++) {
      const fullHistory = await this.historyManager.getHistory(sessionId);

      // Limit history of last messages from config
      const history = fullHistory.slice(-config.AI_MAX_HISTORY_MESSAGES);

      // Get agent ID for this session
      const session = await this.sessionManager.getSession(sessionId);
      const agentId = session?.agent_id || config.default_agent;

      // Query AI (pass history, agent ID and description of tools)
      const aiResponse = await this.aiClient.sendMessage(history, agentId, availableTools);

      if (aiResponse.reasoning) {
        lastReasoning = aiResponse.reasoning;
      }

      // If AI just answered text (without calling tools)
      if (!aiResponse.toolCalls || aiResponse.toolCalls.length === 0) {
        const finalContent = aiResponse.content ?? "I couldn't prepare an answer, Master.";

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

      //console.log(`[Agent] AI decided to use ${aiResponse.toolCalls.length} tools: ${JSON.stringify(aiResponse.toolCalls, null, 2)}`);

      for (const toolCall of aiResponse.toolCalls) {
        try {
          const result = await this.tools.executeTool({
            name: toolCall.function.name,
            arguments: JSON.parse(toolCall.function.arguments)
          });

          // Save result of tool execution in history
          await this.historyManager.addMessage(sessionId, {
            role: 'tool',
            content: JSON.stringify(result.result),
            tool_call_id: toolCall.id
          });
        } catch (error) {
          console.error(`[ChatManager] Error executing tool ${toolCall.function.name}:`, error);
          // save error in history for AI to know
          await this.historyManager.addMessage(sessionId, {
            role: 'tool',
            content: JSON.stringify({ error: (error as Error).message }),
            tool_call_id: toolCall.id
          });
        }
      }

    }

    return { content: "The thinking iteration limit has been exceeded, Try again later." };
  }


  /**
   * Get chat history
   * @param sessionId - session ID
   * @returns array of messages
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
   * Clear chat history
   * @param sessionId - session ID
   */
  async clearHistory(sessionId: string): Promise<void> {
    await this.historyManager.clearHistory(sessionId);
  }


  /**
   * Create new session
   * @param sessionId - session ID
   * @param agentId - agent ID
   */
  async createSession(sessionId: string, agentId?: string): Promise<void> {
    await this.sessionManager.createSession(sessionId, agentId);
  }

  /**
   * Delete session
   * @param sessionId - session ID
   */
  async deleteSession(sessionId: string): Promise<number> {
    // Message history and memories will be deleted automatically due to ON DELETE CASCADE
    return await this.sessionManager.deleteSession(sessionId);
  }

  /**
   * Get session
   * @param sessionId - session ID
   */
  async getSession(sessionId: string): Promise<any> {
    return await this.sessionManager.getSession(sessionId);
  }

  /**
   * Update sessions with old agent ID to new agent ID
   */
  async updateSessionsAgent(oldAgentId: string, newAgentId: string): Promise<number> {
    return await this.sessionManager.updateSessionsAgent(oldAgentId, newAgentId);
  }
}
