/**
 * routes.ts - Определение всех API маршрутов
 */

import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { ChatManager } from './ai/ChatManager.js';
import { AgentService } from './ai/AgentService.js';


/**
 * Типы для тела запроса чата
 */
interface ChatRequestBody {
  message: string;
  sessionId?: string;
}

interface ClearHistoryRequestBody {
  sessionId: string;
}

/**
 * Регистрация всех маршрутов API
 * @param app - экземпляр Fastify
 * @param chatManager - менеджер чата
 */
export async function registerRoutes(app: FastifyInstance, chatManager: ChatManager, agentService: AgentService): Promise<void> {

  // Health check
  app.get('/api/health', async (_request, _reply) => {
    return { status: 'ok', message: 'System initialized', timestamp: new Date().toISOString() };
  });

  // Получить список доступных агентов
  app.get('/api/agents', async (_request, _reply) => {
    const agents = await agentService.getAvailableAgents();
    return _reply.send({ agents });
  });

  // Маршрут для чата с агентом
  app.post('/api/chat', async (request: FastifyRequest<{ Body: ChatRequestBody }>, reply: FastifyReply) => {
    const { message } = request.body;
    const sessionId = request.sessionId; // Магия!
    console.log('Chat request:', { message, sessionId });
    const response = await chatManager.sendMessage(message, sessionId);
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

  // Маршрут для очистки памяти
  app.post('/api/memory/clear', async (_request, _reply) => {
    return _reply.send({ success: true, message: 'Memory cleared' });
  });

  // Создать новую сессию
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

  // Получить текущую сессию
  app.get('/api/sessions/current', async (request: FastifyRequest, reply: FastifyReply) => {
    // Хук уже всё проверил и положил ID в запрос
    return reply.send({ sessionId: request.sessionId });
  });

  // Переключить на существующую сессию
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

  // Удалить сессию
  app.delete('/api/sessions/:id', async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
    const { id } = request.params;
    await chatManager.deleteSession(id);
    return reply.send({ success: true, message: 'Session deleted' });
  });

}
