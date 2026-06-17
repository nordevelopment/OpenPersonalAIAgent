/**
 * TelegramBot.ts - Обработка сообщений из Telegram
 * Использует Telegraf для взаимодействия с Telegram API
 * Author: Norayr Petrosyan
 */

import type { ChatManager } from '../ai/ChatManager.js';
import { config } from '../config.js';
import { Telegraf, Context, Markup } from 'telegraf';

export class TelegramBot {
  private bot: Telegraf | null = null;
  private chatManager: ChatManager | null = null;
  private isEnabled: boolean = false;

  constructor(token?: string, chatManager?: ChatManager) {
    const botToken = token || config.TELEGRAM_BOT_TOKEN;

    this.chatManager = chatManager ?? null;

    if (!botToken) {
      console.log('[Telegram] Bot not initialized, bot token is empty.');
      this.isEnabled = false;
      return;
    }

    this.bot = new Telegraf(botToken);
    this.isEnabled = true;

    console.log('[Telegram] Bot initialized successfully.');
    this.setupHandlers();
  }

  /**
   * Настроить обработчики сообщений
   */
  private setupHandlers(): void {
    if (!this.isEnabled || !this.bot) return;

    // Обработка текстовых сообщений
    this.bot.on('text', async (ctx: Context) => {
      await this.handleTextMessage(ctx);
    });

    // Обработка команд /start
    this.bot.start(async (ctx: Context) => {
      await ctx.reply('Привет! Я AI ассистент. Отправь мне сообщение и я отвечу.');
    });

    // Обработка команды /help
    this.bot.help(async (ctx: Context) => {
      await ctx.reply('Commands:\n/start - Start\n/help - Help');
    });
  }

  /**
   * Обработать текстовое сообщение
   */
  private async handleTextMessage(ctx: Context): Promise<void> {
    const message = ctx.message;

    if (!message || !('text' in message)) {
      return;
    }

    const userId = ctx.from?.id;
    const userMessage = message.text;
    const username = ctx.from?.username || 'unknown';

    console.log(`[Telegram] User: ${username} (${userId}), Message: ${userMessage}`);

    try {
      // Интеграция с ChatManager для обработки через AI
      if (!this.chatManager) {
        await ctx.reply('AI service is not available');
        return;
      }

      await ctx.sendChatAction('typing');

      // Используем userId как sessionId для сохранения истории чата
      const sessionId = `telegram_${userId}`;
      const response = await this.chatManager.sendMessage(userMessage, sessionId);

      await ctx.reply(response);
    } catch (error) {
      console.error('[Telegram] Error handling message:', error);
      await ctx.reply('Error handling message');
    }
  }

  /**
   * Запустить бота (polling)
   */
  async start(): Promise<void> {
    if (!this.isEnabled || !this.bot) {
      console.log('[Telegram] Cannot start: bot is not enabled');
      return;
    }
    try {
      await this.bot.launch();
      console.log('[Telegram] Bot started');
    } catch (error) {
      console.error('[Telegram] Error starting bot:', error);
    }
  }

  /**
   * Остановить бота
   */
  async stop(): Promise<void> {
    if (!this.isEnabled || !this.bot) {
      console.log('[Telegram] Cannot stop: bot is not enabled');
      return;
    }
    this.bot.stop();
    console.log('[Telegram] Bot stopped');
  }

  /**
   * Отправить сообщение в чат
   */
  async sendMessage(chatId: number | string, text: string): Promise<void> {
    if (!this.isEnabled || !this.bot) {
      console.log('[Telegram] Cannot send message: bot is not enabled');
      return;
    }
    await this.bot.telegram.sendMessage(chatId, text);
  }

  /**
   * Получить информацию о боте
   */
  async getBotInfo(): Promise<any> {
    if (!this.isEnabled || !this.bot) {
      console.log('[Telegram] Cannot get bot info: bot is not enabled');
      return null;
    }
    return await this.bot.telegram.getMe();
  }
}
