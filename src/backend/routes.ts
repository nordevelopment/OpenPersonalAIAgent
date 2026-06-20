/**
 * routes.ts - API routes
 * Author: Norayr Petrosyan
 */

import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { ChatManager } from './ai/ChatManager.js';
import { AgentService } from './ai/AgentService.js';


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
export async function registerRoutes(app: FastifyInstance, chatManager: ChatManager, agentService: AgentService): Promise<void> {

  // Main chat template route
  app.get('/', async (_request, reply) => {
    return reply.view('chat.ejs');
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

}
