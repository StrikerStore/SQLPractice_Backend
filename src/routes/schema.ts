import { Request, Response } from 'express';
import { RowDataPacket } from 'mysql2/promise';
import { db } from '../db';
import pino from 'pino';

const logger = pino();

// Safe list of allowed schema names to prevent injection via URL param
const ALLOWED_SCHEMAS = new Set(['retail', 'hr', 'flights', 'analytics', 'finance']);

interface TableRow extends RowDataPacket {
  TABLE_NAME: string;
  TABLE_ROWS: number;
}

interface ColRow extends RowDataPacket {
  TABLE_NAME: string;
  COLUMN_NAME: string;
  DATA_TYPE: string;
  COLUMN_KEY: string;
  IS_NULLABLE: string;
  COLUMN_DEFAULT: string | null;
}

export const getSchema = async (req: Request, res: Response): Promise<void> => {
  const schemaName = req.params.id?.toLowerCase();

  if (!schemaName || !ALLOWED_SCHEMAS.has(schemaName)) {
    res.status(400).json({
      error: `Unknown schema "${schemaName}". Valid options: ${[...ALLOWED_SCHEMAS].join(', ')}`,
    });
    return;
  }

  let connection;
  try {
    connection = await db.getConnection();

    // Get all table names and estimated row counts
    const [tableRows] = await connection.query<TableRow[]>(
      `SELECT TABLE_NAME, TABLE_ROWS
       FROM information_schema.TABLES
       WHERE TABLE_SCHEMA = ?
       ORDER BY TABLE_NAME`,
      [schemaName],
    );

    // Get all column metadata
    const [colRows] = await connection.query<ColRow[]>(
      `SELECT TABLE_NAME, COLUMN_NAME, DATA_TYPE, COLUMN_KEY, IS_NULLABLE, COLUMN_DEFAULT
       FROM information_schema.COLUMNS
       WHERE TABLE_SCHEMA = ?
       ORDER BY TABLE_NAME, ORDINAL_POSITION`,
      [schemaName],
    );

    // Group columns by table
    const colsByTable: Record<
      string,
      { name: string; type: string; key: string; nullable: boolean }[]
    > = {};
    for (const col of colRows) {
      const tbl = col.TABLE_NAME;
      if (!colsByTable[tbl]) colsByTable[tbl] = [];
      colsByTable[tbl].push({
        name: col.COLUMN_NAME,
        type: col.DATA_TYPE.toUpperCase(),
        key: col.COLUMN_KEY, // 'PRI', 'MUL', 'UNI', or ''
        nullable: col.IS_NULLABLE === 'YES',
      });
    }

    const tables = tableRows.map((t) => ({
      name: t.TABLE_NAME,
      estimatedRows: t.TABLE_ROWS ?? 0,
      columns: colsByTable[t.TABLE_NAME] ?? [],
    }));

    res.json({ schema: schemaName, tables });
  } catch (error: unknown) {
    const err = error as { sqlMessage?: string; message?: string };
    logger.error({ err: error }, 'Schema metadata fetch failed');
    res.status(500).json({ error: err.sqlMessage || err.message || 'Failed to fetch schema' });
  } finally {
    if (connection) {
      connection.release();
    }
  }
};
