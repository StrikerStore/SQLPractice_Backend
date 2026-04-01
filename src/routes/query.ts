import sqlParser from 'node-sql-parser';
const { Parser } = sqlParser;
import { z } from 'zod';
import { db } from '../db.js';
import pino from 'pino';
import { Request, Response } from 'express';
import { resultsEquivalent } from '../lib/compareResults.js';
import { questionStore } from '../lib/QuestionStore.js';

const logger = pino();
const parser = new Parser();

const MYSQL_PARSER_OPT = { database: 'MySQL' } as const;

// Strict allowlist — prevents switching into arbitrary schemas via API
const ALLOWED_DATABASES = new Set(['retail', 'hr', 'flights', 'analytics', 'finance']);

const MAX_ROWS_RETURNED = 2000;
const QUERY_TIMEOUT_MS = 5000;

export const queryBodySchema = z.object({
  sql: z.string().min(1).max(50_000),
  database: z.string().regex(/^[a-zA-Z0-9_]+$/),
  questionId: z.string().max(64).optional(),
});

export const executeQuery = async (req: Request, res: Response): Promise<void> => {
  const parsedBody = queryBodySchema.safeParse(req.body);
  if (!parsedBody.success) {
    res.status(400).json({
      error: 'Invalid request body.',
      details: parsedBody.error.flatten(),
    });
    return;
  }

  const { sql, database, questionId } = parsedBody.data;

  // Second-layer allowlist check (in addition to the Zod regex)
  if (!ALLOWED_DATABASES.has(database)) {
    res.status(400).json({ error: `Unknown database "${database}". Valid options: ${[...ALLOWED_DATABASES].join(', ')}` });
    return;
  }

  try {
    const ast = parser.astify(sql, MYSQL_PARSER_OPT);
    const statements = Array.isArray(ast) ? ast : [ast];
    for (const stmt of statements) {
      if (stmt.type !== 'select') {
        res.status(403).json({
          error:
            'Security Warning: Only SELECT queries are permitted in the training environment.',
        });
        return;
      }
    }
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    logger.warn({ err: error, sql }, 'SQL Parse Error / Syntax Error');
    res.status(400).json({
      error: `Syntax Error: Could not parse SQL statement. ${message}`,
    });
    return;
  }

  let connection;
  try {
    connection = await db.getConnection();
    await connection.query(`USE \`${database}\``);
    await connection.query(
      "SET SESSION sql_mode = REPLACE(REPLACE(@@sql_mode, 'ANSI_QUOTES', ''), 'NO_BACKSLASH_ESCAPES', '')",
    );
    // Hard server-side kill for runaway queries (MySQL 5.7.8+)
    await connection.query(`SET SESSION MAX_EXECUTION_TIME=${QUERY_TIMEOUT_MS}`);

    const t0 = Date.now();
    
    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error('Query execution timed out')), QUERY_TIMEOUT_MS)
    );

    const [rows, fields] = await Promise.race([
      connection.query(sql),
      timeoutPromise
    ]) as any;

    const executionTimeMs = Date.now() - t0;

    const rowArray = Array.isArray(rows) ? rows : [];
    const truncated = rowArray.length > MAX_ROWS_RETURNED;
    const rowsOut = truncated ? rowArray.slice(0, MAX_ROWS_RETURNED) : rowArray;

    let graded = false;
    let isCorrect: boolean | null = null;
    let canonicalSql: string | undefined = undefined;
    let verdict: string = 'ungraded';
    let canonicalRowCount: number | undefined = undefined;

    if (questionId && questionStore.getCanonicalSql(questionId)) {
      graded = true;
      canonicalSql = questionStore.getCanonicalSql(questionId);
      try {
        const [canonicalRows] = await connection.query(canonicalSql!);
        const canonArr = Array.isArray(canonicalRows) ? canonicalRows : [];
        canonicalRowCount = canonArr.length;
        isCorrect = resultsEquivalent(rowArray as Record<string, unknown>[], canonArr as Record<string, unknown>[]);
        if (isCorrect) {
          verdict = 'correct';
        } else if (rowArray.length !== canonArr.length) {
          verdict = 'row_mismatch';
        } else {
          const userCols = rowArray.length > 0 ? Object.keys(rowArray[0] as object).sort().join(',') : '';
          const canonCols = canonArr.length > 0 ? Object.keys(canonArr[0] as object).sort().join(',') : '';
          verdict = userCols !== canonCols ? 'column_mismatch' : 'wrong_answer';
        }
      } catch (evalError) {
        logger.error({ err: evalError }, 'Canonical query failed to run');
        isCorrect = false;
        verdict = 'wrong_answer';
      }
    } else if (questionId) {
      graded = false;
      isCorrect = null;
    }

    const columns = Array.isArray(fields) ? fields.map((f: { name: string }) => f.name) : [];

    res.json({
      success: true,
      columns,
      rows: rowsOut,
      rowCount: rowArray.length,
      truncated,
      maxRowsReturned: MAX_ROWS_RETURNED,
      executionTimeMs,
      graded,
      isCorrect,
      canonicalSql,
      verdict,
    });
  } catch (error: unknown) {
    const err = error as { sqlMessage?: string; message?: string };
    logger.error({ err: error }, 'Database execution error');
    res.status(400).json({
      error: err.sqlMessage || err.message || 'Error executing query',
    });
  } finally {
    if (connection) {
      try {
        await connection.query('USE information_schema');
      } catch (e) {
        logger.error({ err: e }, 'Failed to reset connection database');
      }
      connection.release();
    }
  }
};

// ─── EXPLAIN endpoint ───────────────────────────────────────────────────────
export const explainQuery = async (req: Request, res: Response): Promise<void> => {
  const parsedBody = queryBodySchema.safeParse(req.body);
  if (!parsedBody.success) {
    res.status(400).json({ error: 'Invalid request body.', details: parsedBody.error.flatten() });
    return;
  }

  const { sql, database } = parsedBody.data;

  if (!ALLOWED_DATABASES.has(database)) {
    res.status(400).json({ error: `Unknown database "${database}".` });
    return;
  }

  // Must be SELECT
  try {
    const ast = parser.astify(sql, MYSQL_PARSER_OPT);
    const stmts = Array.isArray(ast) ? ast : [ast];
    if (stmts.some((s) => s.type !== 'select')) {
      res.status(403).json({ error: 'Only SELECT queries can be explained.' });
      return;
    }
  } catch {
    res.status(400).json({ error: 'Could not parse SQL for EXPLAIN.' });
    return;
  }

  let connection;
  try {
    connection = await db.getConnection();
    await connection.query(`USE \`${database}\``);
    const [rows] = await connection.query(`EXPLAIN FORMAT=JSON ${sql}`) as any[];
    // MySQL returns EXPLAIN FORMAT=JSON as a JSON string in the first column of the first row.
    // Parse it so the frontend receives a real object (not escaped text).
    const firstRow = Array.isArray(rows) ? rows[0] : rows;
    const rawJson = firstRow ? Object.values(firstRow)[0] : null;
    const explainObj = typeof rawJson === 'string' ? JSON.parse(rawJson) : rawJson;
    res.json({ explain: explainObj });

  } catch (error: unknown) {
    const err = error as { sqlMessage?: string; message?: string };
    res.status(400).json({ error: err.sqlMessage || err.message || 'EXPLAIN failed' });
  } finally {
    if (connection) {
      try { await connection.query('USE information_schema'); } catch { /* ignore */ }
      connection.release();
    }
  }
};
