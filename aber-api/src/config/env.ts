import 'dotenv/config';
import { z } from 'zod';

const schema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().default(4000),
  DATABASE_URL: z.string().min(1),
  DATABASE_SSL: z.enum(['true', 'false']).default('true'), // Supabase requires true; local DB uses false
  JWT_SECRET: z.string().min(32, 'JWT_SECRET يجب ألا يقل عن 32 حرفًا'),
  JWT_EXPIRES_IN: z.string().default('8h'),
  CORS_ORIGIN: z.string().default('http://localhost:5173'),
});

// Fail fast at startup if any variable is missing or invalid.
export const env = schema.parse(process.env);
