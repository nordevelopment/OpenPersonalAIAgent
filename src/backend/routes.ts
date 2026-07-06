/**
 * routes.ts - API routes
 * Author: Norayr Petrosyan
 */

import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { ChatManager } from './ai/ChatManager.js';
import { AgentService } from './ai/AgentService.js';
import { TelegramBot } from './services/TelegramBot.js';
import { config } from './config.js';
import { updateEnvFile } from './utils/envHelper.js';
import fs from 'fs';
import path from 'path';


/**
 * Types for chat request body
 */
interface ChatRequestBody {
  message: string;
  sessionId?: string;
  image?: string;
}

interface ClearHistoryRequestBody {
  sessionId: string;
}

/**
 * Register all API routes
 * @param app - Fastify instance
 * @param chatManager - chat manager
 * @param agentService - agent service
 */
export async function registerRoutes(app: FastifyInstance, chatManager: ChatManager, agentService: AgentService, telegramBot: TelegramBot): Promise<void> {

  // Main chat template route
  app.get('/', async (_request, reply) => {
    return reply.view('chat.ejs');
  });

  // Render system settings page
  app.get('/settings', async (_request, reply) => {
    return reply.view('settings.ejs');
  });

  // Render agent editor page
  app.get('/edit-agent/:agentId', async (request: FastifyRequest<{ Params: { agentId: string } }>, reply: FastifyReply) => {
    const { agentId } = request.params;
    
    const exists = await agentService.agentExists(agentId);
    if (!exists) {
      return reply.status(404).send('Agent not found');
    }

    const files = await agentService.getAgentFiles(agentId);
    return reply.view('edit_agent.ejs', { agentId, files });
  });

  // Save agent files
  app.post('/api/agents/:id/files', async (request: FastifyRequest<{ Params: { id: string }, Body: { files: Record<string, string> } }>, reply: FastifyReply) => {
    const agentId = request.params.id;
    const { files } = request.body;

    const exists = await agentService.agentExists(agentId);
    if (!exists) {
      return reply.status(404).send({ success: false, message: 'Agent not found' });
    }

    if (!files || typeof files !== 'object') {
      return reply.status(400).send({ success: false, message: 'Invalid files payload' });
    }

    try {
      await agentService.saveAgentFiles(agentId, files);
      return reply.send({ success: true, message: 'Agent files updated successfully' });
    } catch (error) {
      request.log.error({ err: error }, 'Failed to save agent files');
      return reply.status(500).send({ success: false, message: error instanceof Error ? error.message : 'Failed to save agent files' });
    }
  });

  // Health check
  app.get('/api/health', async (_request, _reply) => {
    return { status: 'ok', message: 'System initialized', timestamp: new Date().toISOString() };
  });

  // Get list of available agents
  app.get('/api/agents', async (_request, _reply) => {
    const agents = await agentService.getAvailableAgents();
    return _reply.send({ agents });
  });

  // Create new agent profile
  app.post('/api/agents/create', async (request: FastifyRequest<{ Body: { agentId: string } }>, reply: FastifyReply) => {
    const { agentId } = request.body;
    if (!agentId || typeof agentId !== 'string') {
      return reply.status(400).send({ success: false, message: 'Invalid agentId' });
    }

    try {
      await agentService.createAgent(agentId);
      return reply.send({ success: true, message: 'Agent created successfully' });
    } catch (error) {
      request.log.error({ err: error }, 'Failed to create agent');
      return reply.status(500).send({ success: false, message: error instanceof Error ? error.message : 'Failed to create agent' });
    }
  });

  // Delete agent profile
  app.delete('/api/agents/:id', async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
    const agentId = request.params.id;
    if (agentId === 'main_agent') {
      return reply.status(400).send({ success: false, message: 'Cannot delete the default main_agent' });
    }

    try {
      await agentService.deleteAgent(agentId);
      // Update database sessions referencing this agent to fallback to main_agent
      await chatManager.updateSessionsAgent(agentId, 'main_agent');
      return reply.send({ success: true, message: 'Agent deleted successfully' });
    } catch (error) {
      request.log.error({ err: error }, 'Failed to delete agent');
      return reply.status(500).send({ success: false, message: error instanceof Error ? error.message : 'Failed to delete agent' });
    }
  });

  // Chat with agent
  app.post('/api/chat', async (request: FastifyRequest<{ Body: ChatRequestBody }>, reply: FastifyReply) => {
    const { message, image } = request.body;
    const sessionId = request.sessionId; // Magic!
    console.log('Chat request:', { message, sessionId, hasImage: !!image });
    const response = await chatManager.sendMessage(message, sessionId, image);
    return reply.send({ message: response.content, reasoning: response.reasoning });
  });

  app.get('/api/sessions', async (_request, _reply) => {
    const sessions = await chatManager.getAllSessions();
    return _reply.send({ sessions });
  });

  app.post('/api/chat/get_history', async (request: FastifyRequest<{ Body: ChatRequestBody }>, reply: FastifyReply) => {
    const sessionId = request.body.sessionId || request.sessionId;
    console.log('Get history request:', { sessionId });
    const history = await chatManager.getHistory(sessionId);
    return reply.send({ history });
  });

  // route clear chat history
  app.post('/api/chat/clear_history', async (request: FastifyRequest<{ Body: ClearHistoryRequestBody }>, reply: FastifyReply) => {
    const sessionId = request.body.sessionId || request.sessionId;
    await chatManager.clearHistory(sessionId);
    return reply.send({ success: true, message: 'Chat history cleared' });
  });

  // Clear memory route
  app.post('/api/memory/clear', async (_request, _reply) => {
    return _reply.send({ success: true, message: 'Memory cleared' });
  });

  // Create new session
  app.post('/api/sessions/create', async (request: FastifyRequest<{ Body: { agentId?: string } }>, reply: FastifyReply) => {
    const { agentId } = request.body || {};
    const sessionId = 'session_' + Date.now() + '_' + Math.random().toString(30).substring(2, 9);
    await chatManager.createSession(sessionId, agentId);

    reply.setCookie('sessionId', sessionId, {
      path: '/',
      maxAge: 86400000,
      httpOnly: true,
    });

    return reply.send({ success: true, sessionId });
  });

  // Get current session
  app.get('/api/sessions/current', async (request: FastifyRequest, reply: FastifyReply) => {
    // Hook already checked everything and put ID in request
    return reply.send({ sessionId: request.sessionId });
  });

  // Switch to existing session
  app.post('/api/sessions/switch', async (request: FastifyRequest<{ Body: { sessionId: string } }>, reply: FastifyReply) => {
    const { sessionId } = request.body;

    const session = await chatManager.getSession(sessionId);
    if (!session) {
      return reply.status(404).send({ success: false, message: 'Session not found' });
    }

    reply.setCookie('sessionId', sessionId, {
      path: '/',
      maxAge: 86400000,
      httpOnly: true,
    });

    return reply.send({ success: true, sessionId });
  });

  // Delete session
  app.delete('/api/sessions/:id', async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
    const { id } = request.params;
    await chatManager.deleteSession(id);
    return reply.send({ success: true, message: 'Session deleted' });
  });

  // Get system settings
  app.get('/api/settings', async (_request, reply) => {
    return reply.send({
      hasAiApiKey: !!config.AI_API_KEY,
      aiApiUrl: config.AI_API_URL || 'https://openrouter.ai/api/v1/chat/completions',
      aiDefaultModel: config.AI_DEFAULT_MODEL || 'qwen/qwen3.5-flash-02-23',
      hasTelegramBotToken: !!config.TELEGRAM_BOT_TOKEN,
      hasTogetherApiKey: !!config.images.together.key,
      hasXaiApiKey: !!config.images.xai.key,
      aiApiKeyMasked: config.AI_API_KEY ? '******' : '',
      telegramBotTokenMasked: config.TELEGRAM_BOT_TOKEN ? '******' : '',
      togetherApiKeyMasked: config.images.together.key ? '******' : '',
      xaiApiKeyMasked: config.images.xai.key ? '******' : ''
    });
  });

  // Save system settings
  app.post('/api/settings', async (request: FastifyRequest<{ Body: { aiApiKey?: string, aiApiUrl?: string, aiDefaultModel?: string, telegramBotToken?: string, togetherApiKey?: string, xaiApiKey?: string } }>, reply: FastifyReply) => {
    const { aiApiKey, aiApiUrl, aiDefaultModel, telegramBotToken, togetherApiKey, xaiApiKey } = request.body;

    const envPath = path.join(process.cwd(), '.env');
    const configJsonPath = path.join(process.cwd(), 'config.json');
    const isNewKey = (key?: string) => key !== undefined && key !== '******';

    if (fs.existsSync(envPath)) {
      // .env mode
      const envUpdates: Record<string, string> = {};

      if (isNewKey(aiApiKey)) {
        const clean = aiApiKey!.trim();
        envUpdates.AI_API_KEY = clean;
        config.AI_API_KEY = clean;
      }
      if (aiApiUrl !== undefined) {
        const clean = aiApiUrl.trim();
        envUpdates.AI_API_URL = clean;
        config.AI_API_URL = clean;
      }
      if (aiDefaultModel !== undefined) {
        const clean = aiDefaultModel.trim();
        envUpdates.AI_DEFAULT_MODEL = clean;
        config.AI_DEFAULT_MODEL = clean;
      }
      if (isNewKey(telegramBotToken)) {
        const clean = telegramBotToken!.trim();
        envUpdates.TELEGRAM_BOT_TOKEN = clean;
        config.TELEGRAM_BOT_TOKEN = clean;
        telegramBot.updateToken(clean).catch(err => {
          request.log.error({ err }, 'Failed to reload Telegram bot dynamically');
        });
      }
      if (isNewKey(togetherApiKey)) {
        const clean = togetherApiKey!.trim();
        envUpdates.TOGETHER_API_KEY = clean;
        config.images.together.key = clean;
      }
      if (isNewKey(xaiApiKey)) {
        const clean = xaiApiKey!.trim();
        envUpdates.XAI_API_KEY = clean;
        config.images.xai.key = clean;
      }

      updateEnvFile(envPath, envUpdates);

      // Clean up config.json if it exists to prevent conflict/duplication
      if (fs.existsSync(configJsonPath)) {
        try {
          fs.unlinkSync(configJsonPath);
        } catch (e) {
          // ignore
        }
      }
    } else {
      // config.json mode
      let configData: Record<string, string> = {};
      if (fs.existsSync(configJsonPath)) {
        try {
          const raw = fs.readFileSync(configJsonPath, 'utf-8');
          if (raw.trim()) {
            configData = JSON.parse(raw);
          }
        } catch (err) {
          // ignore
        }
      }

      if (isNewKey(aiApiKey)) {
        configData.ai_api_key = aiApiKey!.trim();
        config.AI_API_KEY = configData.ai_api_key;
      }
      if (aiApiUrl !== undefined) {
        const cleanUrl = aiApiUrl.trim();
        configData.ai_api_url = cleanUrl;
        config.AI_API_URL = cleanUrl;
      }
      if (aiDefaultModel !== undefined) {
        const cleanModel = aiDefaultModel.trim();
        configData.ai_default_model = cleanModel;
        config.AI_DEFAULT_MODEL = cleanModel;
      }
      if (isNewKey(telegramBotToken)) {
        const cleanToken = telegramBotToken!.trim();
        configData.telegram_bot_token = cleanToken;
        config.TELEGRAM_BOT_TOKEN = cleanToken;
        telegramBot.updateToken(cleanToken).catch(err => {
          request.log.error({ err }, 'Failed to reload Telegram bot dynamically');
        });
      }
      if (isNewKey(togetherApiKey)) {
        configData.together_api_key = togetherApiKey!.trim();
        config.images.together.key = configData.together_api_key;
      }
      if (isNewKey(xaiApiKey)) {
        configData.xai_api_key = xaiApiKey!.trim();
        config.images.xai.key = configData.xai_api_key;
      }

      fs.writeFileSync(configJsonPath, JSON.stringify(configData, null, 2), 'utf-8');
    }

    return reply.send({ success: true, message: 'Settings saved successfully' });
  });

}
