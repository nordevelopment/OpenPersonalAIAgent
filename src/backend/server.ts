/**
 * server.ts - Application entry point
 * Starts the Fastify server
 */

import { buildApp } from './app.js';
import { config } from './config.js';

async function start() {
  let app: ReturnType<typeof buildApp> extends Promise<infer T> ? T : never;

  try {
     // Create and configure application
    app = await buildApp();

    // Start server
    const port = config.PORT;
    const host = config.HOST;
    await app.listen({ port: Number(port), host });
    console.log(`Server running at http://${host}:${port}`);

    // Graceful shutdown
    const gracefulShutdown = async (signal: string) => {
      console.log(`\n${signal} received. Starting graceful shutdown...`);

      try {
        // Close server (stop accepting new connections)
        await app.close();
        console.log('HTTP server closed, Graceful shutdown completed');
        process.exit(0);
      } catch (err) {
        console.error('Error during graceful shutdown:', err);
        process.exit(1);
      }
    };

    // Handle shutdown signals
    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => gracefulShutdown('SIGINT'));

  } catch (err) {
    console.error('Failed to start server:', err);
    process.exit(1);
  }
}

start();
