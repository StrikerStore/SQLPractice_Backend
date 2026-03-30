import { z } from 'zod';

export const difficultyLevels = ['easy', 'medium', 'hard'] as const;
export type Difficulty = (typeof difficultyLevels)[number];

export const schemaMetaSchema = z.object({
  id: z.number().int().positive(),
  slug: z.string(),
  name: z.string(),
  description: z.string(),
  erDiagram: z.string().optional(),
  tables: z.array(
    z.object({
      name: z.string(),
      description: z.string().optional(),
      columns: z.array(
        z.object({
          name: z.string(),
          type: z.string(),
          isPrimary: z.boolean().optional(),
        }),
      ),
      rowCount: z.number().int().nonnegative().optional(),
      sampleRows: z.array(z.record(z.any())).optional(),
    }),
  ),
});
export type SchemaMetadata = z.infer<typeof schemaMetaSchema>;

export const questionSchema = z.object({
  id: z.number().int().positive(),
  schemaId: z.number().int().positive(),
  difficulty: z.enum(difficultyLevels),
  prompt: z.string(),
  canonicalSql: z.string(),
  tags: z.array(z.string()),
  explanationStub: z.string().optional(),
  optimalityNotes: z.string().optional(),
});
export type Question = z.infer<typeof questionSchema>;

export const sessionRequestSchema = z.object({
  sessionId: z.string().uuid(),
  difficulty: z.enum(difficultyLevels),
});

export const submissionRequestSchema = z.object({
  sessionId: z.string().uuid(),
  questionId: z.number().int().positive(),
  userSql: z.string().min(1),
});

export const verdictTypes = ['correct', 'row_mismatch', 'column_mismatch', 'error', 'timeout'] as const;
export type Verdict = (typeof verdictTypes)[number];

export const submissionResponseSchema = z.object({
  verdict: z.enum(verdictTypes),
  diffSummary: z.object({
    missingColumns: z.array(z.string()).optional(),
    extraColumns: z.array(z.string()).optional(),
    rowCountDelta: z.number().optional(),
    error: z.string().optional(),
  }),
  canonicalSqlPreview: z.string(),
  aiGuidanceId: z.string().uuid().optional(),
  metrics: z.object({
    executionMs: z.number().optional(),
    rowsReturned: z.number().optional(),
  }),
});
export type SubmissionResponse = z.infer<typeof submissionResponseSchema>;

export const sessionStateSchema = z.object({
  sessionId: z.string().uuid(),
  currentDifficulty: z.enum(difficultyLevels),
  totalAnswered: z.number(),
  correctStreak: z.number(),
  wrongStreak: z.number(),
});
export type SessionState = z.infer<typeof sessionStateSchema>;

export const schemaListResponseSchema = z.array(schemaMetaSchema.pick({ id: true, name: true, description: true }));

export const aiCoachPayloadSchema = z.object({
  id: z.string().uuid(),
  questionId: z.number().int().positive(),
  verdict: z.enum(verdictTypes),
  explanation: z.string(),
  optimalSql: z.string(),
  whyOptimal: z.string(),
});
export type AiCoachPayload = z.infer<typeof aiCoachPayloadSchema>;
