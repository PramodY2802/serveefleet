import { createClient } from 'redis';
import config from '../../config/index.js';
import logger from '../utils/logger.js';

const client = createClient({ url: config.redisUrl });

client.on('error', (error) => {
  logger.error('Redis connection error: %o', error);
});

client.on('connect', () => {
  logger.info('Redis client connected');
});

const connectRedis = async () => {
  if (!client.isOpen) {
    await client.connect();
  }
};

export { client, connectRedis };
