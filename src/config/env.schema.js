// Placeholder for environment schema validation.
// Upgrade to Joi/Zod when dependency decisions are finalized.

export const envSchema = {
  required: [
    'PORT',
    'MONGO_URI',
    'JWT_SECRET',
    'REFRESH_TOKEN_SECRET',
    'FRONTEND_URL',
    'SMTP_USER',
    'SMTP_PASS',
    'EMAIL_USER',
    'GOOGLE_CLIENT_ID',
    'GOOGLE_CLIENT_SECRET',
    'GOOGLE_CALLBACK_URL',
  ],
};
