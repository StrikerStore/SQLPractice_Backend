import { z } from 'zod';
export const difficultyLevels = ['easy', 'medium', 'hard'];
export const schemaMetaSchema = z.object({
    id: z.number().int().positive(),
    slug: z.string(),
    name: z.string(),
    description: z.string(),
    erDiagram: z.string().optional(),
    tables: z.array(z.object({
        name: z.string(),
        description: z.string().optional(),
        columns: z.array(z.object({
            name: z.string(),
            type: z.string(),
            isPrimary: z.boolean().optional(),
        })),
        rowCount: z.number().int().nonnegative().optional(),
        sampleRows: z.array(z.record(z.any())).optional(),
    })),
});
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
export const sessionRequestSchema = z.object({
    sessionId: z.string().uuid(),
    difficulty: z.enum(difficultyLevels),
});
export const submissionRequestSchema = z.object({
    sessionId: z.string().uuid(),
    questionId: z.number().int().positive(),
    userSql: z.string().min(1),
});
export const verdictTypes = ['correct', 'row_mismatch', 'column_mismatch', 'error', 'timeout'];
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
export const sessionStateSchema = z.object({
    sessionId: z.string().uuid(),
    currentDifficulty: z.enum(difficultyLevels),
    totalAnswered: z.number(),
    correctStreak: z.number(),
    wrongStreak: z.number(),
});
export const schemaListResponseSchema = z.array(schemaMetaSchema.pick({ id: true, name: true, description: true }));
export const aiCoachPayloadSchema = z.object({
    id: z.string().uuid(),
    questionId: z.number().int().positive(),
    verdict: z.enum(verdictTypes),
    explanation: z.string(),
    optimalSql: z.string(),
    whyOptimal: z.string(),
});
