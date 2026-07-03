/**
 * AIClient.ts - Клиент для общения с AI API
 * Отвечает за отправку сообщений в AI и получение ответов
 * Author: Norayr Petrosyan
 */
import { config } from '../config.js';
import axios from 'axios';
import fs from 'fs';
import fsp from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import sharp from 'sharp';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export interface AIMessages {
  role: 'system' | 'user' | 'assistant' | 'tool';
  content: string | AiContentItem[] | null;
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

interface AiContentItem {
  type: 'text' | 'image_url';
  text?: string;
  image_url?: { url: string };
}

export class AIClient {
  get apiKey(): string {
    return config.AI_API_KEY;
  }
  get apiUrl(): string {
    return config.AI_API_URL || 'https://openrouter.ai/api/v1/chat/completions';
  }
  get model(): string {
    return config.AI_DEFAULT_MODEL;
  }

  constructor() {
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

    // Convert local stored image paths to base64 strings for the API request
    const processedMessages: AIMessages[] = await Promise.all(messages.map(async (msg): Promise<AIMessages> => {
      if (Array.isArray(msg.content)) {
        const newContent: AiContentItem[] = await Promise.all(msg.content.map(async (item): Promise<AiContentItem> => {
          if (item.type === 'image_url' && item.image_url && item.image_url.url.startsWith('/storage/')) {
            try {
              const relativePath = item.image_url.url;
              const cleanPath = relativePath.startsWith('/storage') ? relativePath.substring(8) : relativePath;
              const fullPath = path.join(config.storageDir, cleanPath);
              const fileData = await fsp.readFile(fullPath);
              const base64 = fileData.toString('base64');
              const mimeType = 'image/jpeg';
              return {
                type: 'image_url' as const,
                image_url: {
                  url: `data:${mimeType};base64,${base64}`
                }
              };
            } catch (err) {
              console.error('Error reading stored image for AI request:', err);
              return item;
            }
          }
          return item;
        }));
        return { ...msg, content: newContent };
      }
      return msg;
    }));

    // Добавить системный промпт в начало сообщений
    const messagesWithSystem: AIMessages[] = [];
    if (systemPrompt) {
      messagesWithSystem.push({
        role: 'system',
        content: systemPrompt,
      });
    }
    messagesWithSystem.push(...processedMessages);

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

    // console.log('AIClient: requestBody', requestBody);

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
      // console.log('AIClient: response', data);

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


  /**
   * Process and resize incoming images
   */
  async processImage(imageData: { base64: string, url: string }, logger?: any): Promise<{ filePath: string, base64Image: string }> {
    try {
      const matches = imageData.base64.match(/^data:([a-zA-Z0-9]+\/[a-zA-Z0-9-.+]+);base64,(.+)$/);
      const data = matches ? matches[2] : imageData.base64;
      const imgBuffer = Buffer.from(data, 'base64');

      const resized = await sharp(imgBuffer)
        .resize({ width: 1024, height: 1024, fit: 'inside', withoutEnlargement: true })
        .jpeg({ quality: 85 })
        .toBuffer();

      // Convert to base64
      const base64Image = `data:image/jpeg;base64,${resized.toString('base64')}`;

      //save image to file
      const filename = `${Date.now()}.jpg`;
      const imagesDir = path.join(config.storageDir, 'images');
      await fsp.mkdir(imagesDir, { recursive: true });
      const fullPath = path.join(imagesDir, filename);
      await fsp.writeFile(fullPath, resized);

      // Return relative path for frontend use
      const filePath = `/storage/images/${filename}`;

      return { filePath, base64Image };

    } catch (err: any) {
      logger?.error({ error: err.message }, '[AI SERVICE] Image processing error');
      throw new Error('Image processing failed');
    }
  }

}
