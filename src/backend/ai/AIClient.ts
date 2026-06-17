/**
 * AIClient.ts - Клиент для общения с AI API
 * Отвечает за отправку сообщений в AI и получение ответов
 * Author: Norayr Petrosyan
 */
import { config } from '../config.js';
import axios from 'axios';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export interface AIMessages {
  role: 'system' | 'user' | 'assistant' | 'tool';
  content: string;
  tool_call_id?: string; // ОБЯЗАТЕЛЬНО для role: 'tool'
  tool_calls?: any[];    // Для role: 'assistant' при вызове инструментов
}

export interface AIResponse {
  content: string;
  toolCalls?: any[]; // Если ИИ захотел вызвать инструмент
  reasoning?: string;
  usage?: {
    promptTokens: number;
    completionTokens: number;
  };
}

export class AIClient {
  private apiKey: string;
  private apiUrl: string;
  private model: string;

  constructor() {
    this.apiKey = config.AI_API_KEY;
    this.apiUrl = config.AI_API_URL;
    this.model = config.AI_DEFAULT_MODEL;
  }

  buildSystemPrompt(agentId: string = 'main_agent'): string {
    const mainAgentPath = path.join(__dirname, `../../../agents/${agentId}`);

    if (fs.existsSync(mainAgentPath)) {
      // Определяем строгий порядок загрузки файлов
      const order = [
        'Identity.md',
        'User.md',
        'Agent.md',
        'Skills.md',
        'Memory.md'
      ];

      let systemPrompt = '';

      for (const fileName of order) {
        const filePath = path.join(mainAgentPath, fileName);

        if (fs.existsSync(filePath)) {
          const content = fs.readFileSync(filePath, 'utf-8');
          systemPrompt += `\n${content}`;
        }
      }

      return systemPrompt.trim();

    } else {
      console.warn(`AIClient: Agent directory not found: ${agentId}`);
      return '';
    }
  }

  /**
   * Отправить сообщение в AI
   * @param messages - массив сообщений (история диалога)
   * @param tools - список доступных инструментов (из AITools.getAvailableTools())
   * @param agentId - ID агента (название папки в agents/)
   * @returns ответ от AI
   */
  async sendMessage(messages: AIMessages[], agentId?: string, tools?: any[]): Promise<AIResponse> {

    const systemPrompt = this.buildSystemPrompt(agentId);

    // Добавить системный промпт в начало сообщений
    const messagesWithSystem: AIMessages[] = [];
    if (systemPrompt) {
      messagesWithSystem.push({
        role: 'system',
        content: systemPrompt,
      });
    }
    messagesWithSystem.push(...messages);

    // Здесь будет реальный код для отправки запроса к AI API
    // Например, с использованием axios
    const requestBody: Record<string, unknown> = {
      model: this.model,
      messages: messagesWithSystem,
      temperature: config.AI_TEMPERATURE,
      max_tokens: config.AI_MAX_TOKENS,
      top_p: config.AI_TOP_P,
    };

    // Если инструменты переданы, добавляем их в запрос
    if (tools && tools.length > 0) {
      requestBody.tools = tools;
      requestBody.tool_choice = 'auto';
    }

    console.log('AIClient: requestBody', requestBody);

    try {
      const response = await axios.post(
        this.apiUrl,
        requestBody,
        {
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json',
            'X-Title': 'PAIAgent'
          },
          timeout: config.AI_TIMEOUT
        }
      );

      const data = response.data;
      console.log('AIClient: response', data);

      const message = data.choices?.[0]?.message;
      const reasoning = message?.reasoning_content || message?.reasoning || undefined;

      // Если нет ни текста, ни вызова функций, ни рассуждений — тогда беда
      if (!message?.content && (!message?.tool_calls || message.tool_calls.length === 0) && !reasoning) {
        return {
          content: 'Error: AI response not received',
        };
      }

      return {
        content: message?.content || '', // Пустая строка — это ок, если есть tool_calls
        toolCalls: message?.tool_calls || undefined,
        reasoning: reasoning,
      };

    } catch (error: any) {
      if (axios.isAxiosError(error)) {
        console.error('AIClient: Axios Error ', error.response?.data);
        return {
          content: 'Error: AI response ' + error.response?.data?.error.message + ' : ' + error.message,
        };
      } else {
        console.error('AIClient: Error ', error);
        return {
          content: 'Error: AI response ' + error.message,
        };
      }
    }
  }
}
