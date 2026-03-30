import { z } from 'zod';
const envSchema = z.object({
    NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
    PORT: z.coerce.number().default(4000),
    DATABASE_URL: z.string().default('postgres://postgres:postgres@localhost:5432/sqlcat'),
    DB_POOL_MAX: z.coerce.number().default(10),
    OPENROUTER_API_KEY: z.string().optional(),
    OPENROUTER_MODEL: z.string().default('openrouter/auto'),
    AI_GUIDANCE_CACHE_TTL: z.coerce.number().default(3600),
    LOG_LEVEL: z.string().default('info'),
});
export const env = envSchema.parse({
    NODE_ENV: process.env.NODE_ENV,
    PORT: process.env.PORT,
    DATABASE_URL: process.env.DATABASE_URL,
    DB_POOL_MAX: process.env.DB_POOL_MAX,
    OPENROUTER_API_KEY: process.env.OPENROUTER_API_KEY,
    OPENROUTER_MODEL: process.env.OPENROUTER_MODEL,
    AI_GUIDANCE_CACHE_TTL: process.env.AI_GUIDANCE_CACHE_TTL,
    LOG_LEVEL: process.env.LOG_LEVEL,
});
