import 'dotenv/config';
import { z } from 'zod';

// JWT_SECRET and JWT_EXPIRES_IN are added in Phase 3 (authentication).
const schema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().default(4000),
  DATABASE_URL: z.string().min(1),
  DATABASE_SSL: z.enum(['true', 'false']).default('true'), // Supabase requires true; local DB uses false
  CORS_ORIGIN: z.string().default('http://localhost:5173'),
});

// Fail fast at startup if any variable is missing or invalid.
export const env = schema.parse(process.env);
