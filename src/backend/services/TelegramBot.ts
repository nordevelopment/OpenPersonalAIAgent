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

    // Warning about open bot
    if (!config.ALLOWED_TELEGRAM_USER_IDS) {
      console.warn('[Telegram] WARNING: ALLOWED_TELEGRAM_USER_IDS is empty. Anyone can use your bot and consume your API balances!');
    }

    // Middleware to restrict access
    this.bot.use(async (ctx, next) => {
      const userId = ctx.from?.id;
      const allowedIdsStr = config.ALLOWED_TELEGRAM_USER_IDS || '';
      const allowedIds = allowedIdsStr.split(',').map(id => id.trim()).filter(Boolean).map(Number);

      if (allowedIds.length > 0) {
        if (!userId || !allowedIds.includes(userId)) {
          console.warn(`[Telegram] Access denied for user ${userId || 'unknown'} (${ctx.from?.username || 'no username'})`);
          try {
            await ctx.reply("Access denied. Please configure ALLOWED_TELEGRAM_USER_IDS in settings.");
          } catch (err) {
            console.error('[Telegram] Error sending access denied message:', err);
          }
          return;
        }
      }
      await next();
    });

    this.bot.start(async (ctx: Context) => {
      await ctx.reply("Hi! I'm Personal AI Agent. How can I help you today?");
    });

    this.bot.help(async (ctx: Context) => {
      await ctx.reply("Commands:\n/start - Start the agent\n/help - Show this help message\n/clear - Clear current chat history");
    });

    this.bot.command('clear', async (ctx: Context) => {
      const userId = ctx.from?.id;
      if (!userId) return;

      const sessionId = `telegram_${userId}`;
      try {
        if (this.chatManager) {
          await this.chatManager.clearHistory(sessionId);
          await ctx.reply('🧹 Chat history cleared successfully!');
        } else {
          await ctx.reply('AI service is not available');
        }
      } catch (err) {
        console.error('[Telegram] Error clearing history:', err);
        await ctx.reply('Failed to clear chat history.');
      }
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

      // Regex that matches either a markdown image OR a raw storage path (with optional backticks/quotes)
      const splitRegex = /(!\[.*?\]\(.*?\)|`?\b\/?storage\/generated\/img_[a-f0-9-]+\.(?:png|jpg|jpeg|webp)\b`?)/gi;
      const parts = content.split(splitRegex);

      for (const part of parts) {
        const trimmed = part.trim();
        if (!trimmed) continue;

        // Check if this part is a markdown image
        const mdMatch = /!\[(.*?)\]\((.*?)\)/.exec(trimmed);
        if (mdMatch) {
          const alt = mdMatch[1];
          let cleanPath = mdMatch[2];
          if (cleanPath.startsWith('/')) {
            cleanPath = cleanPath.substring(1);
          }
          const absolutePath = path.resolve(process.cwd(), cleanPath);
          if (fs.existsSync(absolutePath)) {
            await ctx.replyWithPhoto({ source: absolutePath }, { caption: alt || undefined });
          } else {
            console.error(`[Telegram] Image file not found: ${absolutePath}`);
            await ctx.reply(`[Image: ${alt || 'photo'}]`);
          }
          continue;
        }

        // Check if this part is a raw path (possibly enclosed in backticks or quotes)
        const pathMatch = /`?\b\/?(storage\/generated\/img_[a-f0-9-]+\.(?:png|jpg|jpeg|webp))\b`?/i.exec(trimmed);
        if (pathMatch) {
          const cleanPath = pathMatch[1];
          const absolutePath = path.resolve(process.cwd(), cleanPath);
          if (fs.existsSync(absolutePath)) {
            await ctx.replyWithPhoto({ source: absolutePath }, { caption: 'Generated Image' });
          } else {
            console.error(`[Telegram] Image file not found: ${absolutePath}`);
            await ctx.reply(`[Image: Generated Image]`);
          }
          continue;
        }

        // Otherwise it's plain text
        await ctx.reply(part);
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
    try {
      this.bot.stop();
    } catch (err) {
      console.warn('[Telegram] Error stopping bot (might not be running):', err instanceof Error ? err.message : err);
    }
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
