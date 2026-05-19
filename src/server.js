import app from './app.js';
import config from './config/index.js';
import logger from './common/utils/logger.js';
import { closeDatabase } from './database/index.js';

const PORT = config.port;

let server;

const shutdown = async (signal) => {
  logger.info(`Received ${signal}. Shutting down gracefully...`);
  if (server) {
    server.close(async () => {
      logger.info('HTTP server closed');
      await closeDatabase();
      process.exit(0);
    });
  } else {
    await closeDatabase();
    process.exit(0);
  }
};

process.on('uncaughtException', (error) => {
  logger.error('Uncaught exception:', error);
  process.exit(1);
});

process.on('unhandledRejection', (reason) => {
  logger.error('Unhandled rejection:', reason);
  process.exit(1);
});

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));

server = app.listen(PORT, () => {
  logger.info(`Backend started on http://localhost:${PORT}`);
});
