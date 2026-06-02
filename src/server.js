import app from './app.js';
import config from './config/index.js';
import logger from './common/utils/logger.js';
import { closeDatabase } from './database/index.js';
import ReminderService from './modules/reminder/reminder.service.js';

const PORT = config.port;
const REMINDER_DUE_INTERVAL_MS = 5 * 60 * 1000;

let server;
let reminderDueInterval;
let reminderDueProcessorRunning = false;

const reminderDueProcessorDisabled = process.env.DISABLE_REMINDER_DUE_PROCESSOR === 'true' || process.env.NODE_ENV === 'test';

const runReminderDueProcessor = async () => {
  if (reminderDueProcessorRunning) {
    return;
  }

  reminderDueProcessorRunning = true;
  try {
    const result = await ReminderService.processDueReminders({ id: 'system', role: 'admin' });
    if ((result?.modifiedCount || 0) > 0) {
      logger.info(`Reminder due processor updated ${result.modifiedCount} reminders`);
    }
  } catch (error) {
    logger.warn('Reminder due processor failed:', error);
  } finally {
    reminderDueProcessorRunning = false;
  }
};

const startReminderDueProcessor = () => {
  if (reminderDueProcessorDisabled) {
    logger.info('Reminder due processor is disabled.');
    return;
  }

  if (reminderDueInterval) {
    return;
  }

  void runReminderDueProcessor();
  reminderDueInterval = setInterval(() => {
    void runReminderDueProcessor();
  }, REMINDER_DUE_INTERVAL_MS);
  reminderDueInterval.unref?.();
};

const shutdown = async (signal) => {
  logger.info(`Received ${signal}. Shutting down gracefully...`);
  if (reminderDueInterval) {
    clearInterval(reminderDueInterval);
    reminderDueInterval = null;
  }
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
  startReminderDueProcessor();
});
