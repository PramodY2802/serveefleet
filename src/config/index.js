import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { envSchema } from './schema.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '../../.env') });

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  const errors = parsed.error.format();
  throw new Error(`Environment validation failed: ${JSON.stringify(errors)}`);
}

const env = parsed.data;

const config = {
  port: env.PORT,
  mongoUri: env.MONGO_URI,
  jwtSecret: env.JWT_SECRET,
  jwtExpiresIn: env.JWT_EXPIRES_IN,
  refreshTokenSecret: env.REFRESH_TOKEN_SECRET,
  refreshTokenExpiresIn: env.REFRESH_TOKEN_EXPIRES_IN,
  clientUrl: env.FRONTEND_URL,
  smtp: {
    user: env.SMTP_USER,
    pass: env.SMTP_PASS,
    from: env.EMAIL_USER,
  },
  google: {
    clientId: env.GOOGLE_CLIENT_ID,
    clientSecret: env.GOOGLE_CLIENT_SECRET,
    callbackUrl: env.GOOGLE_CALLBACK_URL,
  },
  nodeEnv: env.NODE_ENV,
};

export default config;
