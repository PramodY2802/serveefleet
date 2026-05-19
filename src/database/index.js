import mongoose from 'mongoose';
import logger from '../common/utils/logger.js';

const MAX_RETRIES = 5;
const RETRY_DELAY_MS = 2000;

const connectDatabase = async (mongoUri) => {
  let attempt = 0;

  const connect = async () => {
    attempt += 1;
    try {
      await mongoose.connect(mongoUri, {
        useNewUrlParser: true,
        useUnifiedTopology: true,
      });
      logger.info('MongoDB connected');
    } catch (error) {
      logger.error('MongoDB connection failed (attempt %d): %o', attempt, error);
      if (attempt >= MAX_RETRIES) {
        logger.error('Maximum MongoDB reconnect attempts reached, exiting');
        process.exit(1);
      }
      await new Promise((resolve) => setTimeout(resolve, RETRY_DELAY_MS));
      await connect();
    }
  };

  await connect();
};

const closeDatabase = async () => {
  try {
    await mongoose.connection.close();
    logger.info('MongoDB connection closed');
  } catch (error) {
    logger.error('MongoDB close failed:', error);
  }
};

mongoose.connection.on('disconnected', () => logger.warn('MongoDB disconnected'));
mongoose.connection.on('reconnected', () => logger.info('MongoDB reconnected'));

export default connectDatabase;
export { closeDatabase };
