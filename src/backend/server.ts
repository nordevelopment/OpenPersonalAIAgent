/**
 * server.ts - Application entry point
 * Starts the Fastify server
 */

import { buildApp } from './app.js';
import { config } from './config.js';
import logger from './utils/logger.js';

async function start() {
  let app: ReturnType<typeof buildApp> extends Promise<infer T> ? T : never;

  try {
    // Create and configure application
    app = await buildApp();

    // Start server
    const port = config.PORT;
    const host = config.HOST;
    await app.listen({ port: Number(port), host });
    // app.log.info(`Server running at http://${host}:${port}`);

    // Graceful shutdown
    const gracefulShutdown = async (signal: string) => {
      app.log.info({ signal }, 'Received shutdown signal. Starting graceful shutdown...');

      try {
        // Close server (stop accepting new connections)
        await app.close();
        app.log.info('HTTP server closed. Graceful shutdown completed.');
        process.exit(0);
      } catch (err) {
        app.log.error({ err }, 'Error during graceful shutdown');
        process.exit(1);
      }
    };

    // Handle shutdown signals
    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => gracefulShutdown('SIGINT'));

  } catch (err) {
    logger.error({ err }, 'Failed to start server');
    process.exit(1);
  }
}

start();
