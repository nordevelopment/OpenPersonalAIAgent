/**
 * TelegramBot.ts - Telegram Bot Service
 * Author: Norayr Petrosyan
 * Using Telegraf for interaction with Telegram API
 */

import type { ChatManager } from '../ai/ChatManager.js';
import { config } from '../config.js';
import { Telegraf, Context } from 'telegraf';
import path from 'path';
import fs from 'fs';


export class TelegramBot {
  private bot: Telegraf | null = null;
  private chatManager: ChatManager | null = null;
  private isEnabled: boolean = false;

  constructor(chatManager?: ChatManager) {
    const botToken = config.TELEGRAM_BOT_TOKEN;

    this.chatManager = chatManager ?? null;

    if (!botToken) {
      console.log('[Telegram] Bot not initialized, bot token is empty.');
      this.isEnabled = false;
      return;
    }

    this.bot = new Telegraf(botToken);
    this.isEnabled = true;

    // console.log('[Telegram] Bot initialized successfully.');
    this.setupHandlers();
  }

  /**
   * Update token and reload the bot service dynamically
   */
  async updateToken(newToken: string): Promise<void> {
    if (this.bot && this.isEnabled) {
      try {
        await this.stop();
      } catch (err) {
        console.error('[Telegram] Error stopping bot during reload:', err);
      }
    }

    const trimmedToken = newToken ? newToken.trim() : '';
    if (!trimmedToken) {
      this.bot = null;
      this.isEnabled = false;
      console.log('[Telegram] Bot disabled (empty token).');
      return;
    }

    try {
      this.bot = new Telegraf(trimmedToken);
      this.isEnabled = true;
      this.setupHandlers();
      await this.start();
      console.log('[Telegram] Bot hot-reloaded successfully.');
    } catch (err) {
      this.isEnabled = false;
      this.bot = null;
      console.error('[Telegram] Failed to start with new token:', err);
      throw err;
    }
  }

  /**
   * Setup handlers 
   */
  private setupHandlers(): void {
    if (!this.isEnabled || !this.bot) return;

    this.bot.start(async (ctx: Context) => {
      await ctx.reply("Hi! I'm Personal AI Agent. How can I help you today?");
    });

    this.bot.help(async (ctx: Context) => {
      await ctx.reply("Commands:\n/start - Start\n/help - Help");
    });

    this.bot.on('text', async (ctx: Context) => {
      await this.handleTextMessage(ctx);
    });
  }

  /**
   * Handle text message
   */
  private async handleTextMessage(ctx: Context): Promise<void> {
    const message = ctx.message;

    if (!message || !('text' in message)) {
      return;
    }

    const userId = ctx.from?.id;
    const userMessage = message.text;
    //const username = ctx.from?.username || 'unknown';

    // console.log(`[Telegram] User: ${username} (${userId}), Message: ${userMessage}`);

    try {
      if (!this.chatManager) {
        await ctx.reply('AI service is not available');
        return;
      }

      // Send initial typing status
      await ctx.sendChatAction('typing');

      // Keep showing "typing..." status in Telegram while AI is thinking (which can take time due to image gen/tool calls)
      const typingInterval = setInterval(() => {
        ctx.sendChatAction('typing').catch(err => {
          console.error('[Telegram] Error sending typing action:', err);
        });
      }, 4000);

      const sessionId = `telegram_${userId}`;
      let response;
      try {
        response = await this.chatManager.sendMessage(userMessage, sessionId);
      } finally {
        clearInterval(typingInterval);
      }

      const content = response.content;

      // Extract markdown images: ![caption](image_path)
      const imgRegex = /!\[(.*?)\]\((.*?)\)/g;
      const imagesToSend: { alt: string; path: string }[] = [];
      let match;

      while ((match = imgRegex.exec(content)) !== null) {
        imagesToSend.push({ alt: match[1], path: match[2] });
      }

      if (imagesToSend.length === 0) {
        await ctx.reply(content);
        return;
      }

      // Split text by markdown images to send messages in correct sequence
      const plainTexts = content.split(/!\[.*?\]\(.*?\)/g);

      for (let i = 0; i < plainTexts.length; i++) {
        const textPart = plainTexts[i].trim();
        if (textPart) {
          await ctx.reply(textPart);
        }
        if (i < imagesToSend.length) {
          const img = imagesToSend[i];
          let cleanPath = img.path;
          if (cleanPath.startsWith('/')) {
            cleanPath = cleanPath.substring(1);
          }
          const absolutePath = path.resolve(process.cwd(), cleanPath);

          if (fs.existsSync(absolutePath)) {
            await ctx.replyWithPhoto({ source: absolutePath }, { caption: img.alt || undefined });
          } else {
            console.error(`[Telegram] Image file not found: ${absolutePath}`);
            await ctx.reply(`[Image: ${img.alt || 'photo'}]`);
          }
        }
      }
    } catch (error) {
      console.error('[Telegram] Error handling message:', error);
      await ctx.reply('Error handling message');
    }
  }

  /**
   * Start bot (polling)
   */
  async start(): Promise<void> {
    if (!this.isEnabled || !this.bot) {
      console.log('[Telegram] Cannot start: bot is not enabled');
      return;
    }
    try {
      await this.bot.launch();
      // console.log('[Telegram] Bot started');
    } catch (error) {
      console.error('[Telegram] Error starting bot:', error);
    }
  }

  /**
   * Stop bot
   */
  async stop(): Promise<void> {
    if (!this.isEnabled || !this.bot) {
      console.log('[Telegram] Cannot stop: bot is not enabled');
      return;
    }
    this.bot.stop();
    // console.log('[Telegram] Bot stopped');
  }

  /**
   * Send message to chat
   */
  async sendMessage(chatId: number | string, text: string): Promise<void> {
    if (!this.isEnabled || !this.bot) {
      console.log('[Telegram] Cannot send message: bot is not enabled');
      return;
    }
    await this.bot.telegram.sendMessage(chatId, text);
  }

  /**
   * Get bot info
   */
  async getBotInfo(): Promise<any> {
    if (!this.isEnabled || !this.bot) {
      console.log('[Telegram] Cannot get bot info: bot is not enabled');
      return null;
    }
    return await this.bot.telegram.getMe();
  }
}
