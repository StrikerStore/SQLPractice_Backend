import { Pool, PoolClient } from 'pg';
import { env } from '../config/env';
import { logger } from '../config/logger';

export const pool = new Pool({
  connectionString: env.DATABASE_URL,
  max: env.DB_POOL_MAX,
  idleTimeoutMillis: 30_000,
});

pool.on('error', (err) => {
  logger.error({ err }, 'Unexpected database pool error');
});

export async function withDbClient<T>(fn: (client: PoolClient) => Promise<T>): Promise<T> {
  const client = await pool.connect();
  try {
    return await fn(client);
  } finally {
    client.release();
  }
}
