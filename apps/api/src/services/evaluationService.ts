import format from 'pg-format';
import type { PoolClient } from 'pg';
import { Verdict } from '@sqlcat/types';
import { withDbClient } from '../db/pool';
import { assertSelectOnly } from '../utils/sqlGuard';
import { diffQueryResults, DiffSummary, QueryResult } from '../utils/resultDiff';
import { QuestionWithSchema } from './questionService';

export type EvaluationResult = {
  verdict: Verdict;
  diffSummary: DiffSummary;
  metrics: { executionMs?: number; rowsReturned?: number };
  canonicalResult: QueryResult;
  userResult?: QueryResult;
};

const STATEMENT_TIMEOUT_MS = 5000;

export async function evaluateSubmission(sessionId: string, question: QuestionWithSchema, userSql: string): Promise<EvaluationResult> {
  assertSelectOnly(userSql);
  return withDbClient(async (client: PoolClient) => {
    const canonicalResult = await executeQuery(client, question.schemaSlug, question.canonicalSql);

    let userResult: QueryResult | undefined;
    let diffSummary: DiffSummary = {};
    let verdict: Verdict = 'correct';

    try {
      userResult = await executeQuery(client, question.schemaSlug, userSql);
      const diff = diffQueryResults(userResult, canonicalResult);
      if (diff) {
        diffSummary = diff;
        verdict = diff.missingColumns?.length ? 'column_mismatch' : 'row_mismatch';
      } else {
        diffSummary = {};
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown SQL error';
      diffSummary = { error: message };
      verdict = message.toLowerCase().includes('statement timeout') ? 'timeout' : 'error';
    }

    await client.query(
      'INSERT INTO public.submissions (session_id, question_id, verdict, user_sql, diff_summary, metrics) VALUES ($1, $2, $3, $4, $5::jsonb, $6::jsonb)',
      [
        sessionId,
        question.id,
        verdict,
        userSql,
        JSON.stringify(diffSummary),
        JSON.stringify({ executionMs: userResult?.durationMs, rowsReturned: userResult?.rows.length }),
      ],
    );

    return {
      verdict,
      diffSummary,
      metrics: { executionMs: userResult?.durationMs, rowsReturned: userResult?.rows.length },
      canonicalResult,
      userResult,
    };
  });
}

async function executeQuery(client: PoolClient, schemaSlug: string, sql: string): Promise<QueryResult> {
  await client.query('BEGIN');
  try {
    await client.query(`SET LOCAL statement_timeout = ${STATEMENT_TIMEOUT_MS}`);
    await client.query(format('SET LOCAL search_path TO %I', schemaSlug));
    const start = process.hrtime.bigint();
    const result = await client.query(sql);
    const durationMs = Number(process.hrtime.bigint() - start) / 1_000_000;
    await client.query('COMMIT');
    return {
      rows: result.rows,
      columns: result.fields?.map((field: any) => field.name) ?? Object.keys(result.rows[0] ?? {}),
      durationMs,
    };
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  }
}
