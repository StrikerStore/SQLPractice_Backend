import type { PoolClient } from 'pg';
import { Question, questionSchema } from '@sqlcat/types';
import { withDbClient } from '../db/pool';
import { z } from 'zod';

const baseSelection = `q.id, q.schema_id as "schemaId", q.difficulty, q.prompt, q.canonical_sql as "canonicalSql",
  q.tags, q.explanation_stub as "explanationStub", q.optimality_notes as "optimalityNotes",
  s.slug as schema_slug, s.name as schema_name, s.description as schema_description`;

const questionRow = questionSchema.extend({
  schema_slug: z.string(),
  schema_name: z.string(),
  schema_description: z.string(),
});

export type QuestionWithSchema = Question & {
  schemaSlug: string;
  schemaName: string;
  schemaDescription: string;
};

function mapQuestion(row: z.infer<typeof questionRow>): QuestionWithSchema {
  return {
    id: row.id,
    schemaId: row.schemaId,
    difficulty: row.difficulty,
    prompt: row.prompt,
    canonicalSql: row.canonicalSql,
    tags: row.tags,
    explanationStub: row.explanationStub,
    optimalityNotes: row.optimalityNotes,
    schemaSlug: row.schema_slug,
    schemaName: row.schema_name,
    schemaDescription: row.schema_description,
  };
}

export async function fetchQuestionByDifficulty(difficulty: string): Promise<QuestionWithSchema> {
  return withDbClient(async (client: PoolClient) => {
    const result = await client.query(
      `SELECT ${baseSelection}
         FROM public.questions q
         JOIN public.schemas s ON s.id = q.schema_id
        WHERE q.difficulty = $1
        ORDER BY random()
        LIMIT 1`,
      [difficulty],
    );
    if (!result.rowCount) {
      throw new Error(`No question available for difficulty ${difficulty}`);
    }
    return mapQuestion(questionRow.parse(result.rows[0]));
  });
}

export async function fetchQuestionById(id: number): Promise<QuestionWithSchema> {
  return withDbClient(async (client: PoolClient) => {
    const result = await client.query(
      `SELECT ${baseSelection}
         FROM public.questions q
         JOIN public.schemas s ON s.id = q.schema_id
        WHERE q.id = $1`,
      [id],
    );
    if (!result.rowCount) {
      throw new Error('Question not found');
    }
    return mapQuestion(questionRow.parse(result.rows[0]));
  });
}
