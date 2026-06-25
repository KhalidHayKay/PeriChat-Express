import { env } from '../config/env.js';
import { redis } from '../lib/redis.js';
import app from './app.js';

const server = app.listen(env.app.port, () => {
  redis.connect();

  console.info(`Server started and running on port ${env.app.port}`);
  console.info(`Environment: ${env.app.env}`);
});

const shutdown = (signal: string) => {
  console.info(`${signal} received, starting graceful shutdown`);

  server.close((err) => {
    if (err) {
      redis.disconnect();

      console.error('Error during shutdown', err);
      process.exit(1);
    }

    console.info('Server closed successfully');
    process.exit(0);
  });

  // Force shutdown after 30 seconds if graceful shutdown fails
  setTimeout(() => {
    console.error('Forced shutdown after timeout');
    process.exit(1);
  }, 30000);
};

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));
