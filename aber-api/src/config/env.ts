import 'dotenv/config';
import { z } from 'zod';

// Phase 1 only: DATABASE_URL, DATABASE_SSL, JWT_SECRET and JWT_EXPIRES_IN are added in
// Phases 2 and 3, so no placeholder secrets are needed before then.
const schema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().default(4000),
  CORS_ORIGIN: z.string().default('http://localhost:5173'),
});

// Fail fast at startup if any variable is missing or invalid.
export const env = schema.parse(process.env);
