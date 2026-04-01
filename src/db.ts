import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
import pino from 'pino';

dotenv.config();

const logger = pino();

const databaseUrl = process.env.DATABASE_URL?.trim();
if (!databaseUrl) {
  logger.error('DATABASE_URL is missing or empty. Set it in your environment or .env file.');
  process.exit(1);
}

export const db = mysql.createPool({
  uri: databaseUrl,
  waitForConnections: true,
  connectionLimit: 10,
  maxIdle: 10,
  idleTimeout: 60000,
  queueLimit: 0,
  enableKeepAlive: true,
  keepAliveInitialDelay: 0,
  multipleStatements: false,
});

export async function testConnection() {
  try {
    const connection = await db.getConnection();
    logger.info('Successfully connected to MySQL Database');
    connection.release();
  } catch (error) {
    logger.error({ err: error }, 'Failed to connect to MySQL Database');
    process.exit(1);
  }
}
