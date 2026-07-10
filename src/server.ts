import { createServer } from 'http';
import { env } from './config/env.js';
import { redis } from './lib/redis.js';
import app from './app.js';
import { socket } from './lib/socket.js';
import dotenv from 'dotenv';
import { promisify } from 'node:util';

dotenv.config();

const httpServer = createServer(app);

socket.init(httpServer);

await redis.connect();

const server = httpServer.listen(env.app.port, () => {
  console.info(`Server started and running on port ${env.app.port}`);
  console.info(`Environment: ${env.app.env}`);
});

const closeServer = promisify(server.close.bind(server));

const shutdown = async (signal: string) => {
  console.info(`${signal} received, starting graceful shutdown`);

  const timeout = setTimeout(() => {
    console.error('Forced shutdown after timeout');
    process.exit(1);
  }, 30_000);

  try {
    await closeServer();
    await redis.disconnect();

    clearTimeout(timeout);

    console.info('Server closed successfully');
    process.exit(0);
  } catch (err) {
    clearTimeout(timeout);

    console.error('Error during shutdown', err);
    process.exit(1);
  }
};

process.on('SIGTERM', () => {
  void shutdown('SIGTERM');
});

process.on('SIGINT', () => {
  void shutdown('SIGINT');
});
