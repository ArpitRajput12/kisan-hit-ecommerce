import dotenv from 'dotenv';
import { z } from 'zod';

dotenv.config();

const envSchema = z.object({
  PORT: z.string().default('5000').transform((val) => parseInt(val, 10)),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  DATABASE_URL: z
    .string()
    .default('postgresql://postgres:postgres@localhost:5433/agri_commerce?schema=public'),
  JWT_SECRET: z.string().default('supersecret_agri_jwt_key_default_change_in_prod'),
  JWT_EXPIRES_IN: z.string().default('1d'),
  REFRESH_TOKEN_SECRET: z
    .string()
    .default('supersecret_agri_refresh_token_key_change_in_prod'),
  REFRESH_TOKEN_EXPIRES_IN: z.string().default('7d'),
  CORS_ORIGIN: z.string().default('*'),
  IDEMPOTENCY_EXPIRY_HOURS: z.string().default('24').transform((val) => parseInt(val, 10)),

  // Redis & Caching / Distributed Locking
  REDIS_URL: z.string().default('redis://localhost:6379'),
  REDIS_HOST: z.string().default('localhost'),
  REDIS_PORT: z.string().default('6379').transform((val) => parseInt(val, 10)),
  REDIS_PASSWORD: z.string().optional(),

  // Razorpay Payment Gateway
  RAZORPAY_KEY_ID: z.string().default('rzp_test_mockKeyId123456'),
  RAZORPAY_KEY_SECRET: z.string().default('rzp_test_mockSecretKey123456'),
  RAZORPAY_WEBHOOK_SECRET: z.string().default('rzp_mock_webhook_secret_789'),

  // Cloudinary for Public Product Images
  CLOUDINARY_CLOUD_NAME: z.string().default('agri_mock_cloud'),
  CLOUDINARY_API_KEY: z.string().default('mock_cloudinary_key'),
  CLOUDINARY_API_SECRET: z.string().default('mock_cloudinary_secret'),

  // Secure Local Document Storage (NO AWS S3)
  KYC_UPLOAD_DIR: z.string().default('./uploads/kyc-docs'),

  // SMS Gateway / Telephony
  SMS_PROVIDER: z.string().optional(),
  SMS_GATEWAY_API_KEY: z.string().optional(),
  TWILIO_ACCOUNT_SID: z.string().optional(),
  TWILIO_AUTH_TOKEN: z.string().optional(),
  TWILIO_PHONE_NUMBER: z.string().optional(),

  // Initial Admin Setup (prisma/seed.ts)
  ADMIN_EMAIL: z.string().optional(),
  ADMIN_PHONE: z.string().optional(),
  ADMIN_PASSWORD: z.string().optional(),
  SUPER_ADMIN_EMAIL: z.string().optional(),
  SUPER_ADMIN_PHONE: z.string().optional(),
  SUPER_ADMIN_PASSWORD: z.string().optional(),

  // Google OAuth / Sign-In
  GOOGLE_CLIENT_ID: z.string().optional(),
});

const _env = envSchema.safeParse(process.env);

if (!_env.success) {
  console.error('Invalid environment variables:', _env.error.format());
  process.exit(1);
}

export const env = _env.data;
export type Env = z.infer<typeof envSchema>;
