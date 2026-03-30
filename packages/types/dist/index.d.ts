import { z } from 'zod';
export declare const difficultyLevels: readonly ["easy", "medium", "hard"];
export type Difficulty = (typeof difficultyLevels)[number];
export declare const schemaMetaSchema: z.ZodObject<{
    id: z.ZodNumber;
    slug: z.ZodString;
    name: z.ZodString;
    description: z.ZodString;
    erDiagram: z.ZodOptional<z.ZodString>;
    tables: z.ZodArray<z.ZodObject<{
        name: z.ZodString;
        description: z.ZodOptional<z.ZodString>;
        columns: z.ZodArray<z.ZodObject<{
            name: z.ZodString;
            type: z.ZodString;
            isPrimary: z.ZodOptional<z.ZodBoolean>;
        }, "strip", z.ZodTypeAny, {
            name: string;
            type: string;
            isPrimary?: boolean | undefined;
        }, {
            name: string;
            type: string;
            isPrimary?: boolean | undefined;
        }>, "many">;
        rowCount: z.ZodOptional<z.ZodNumber>;
        sampleRows: z.ZodOptional<z.ZodArray<z.ZodRecord<z.ZodString, z.ZodAny>, "many">>;
    }, "strip", z.ZodTypeAny, {
        name: string;
        columns: {
            name: string;
            type: string;
            isPrimary?: boolean | undefined;
        }[];
        description?: string | undefined;
        rowCount?: number | undefined;
        sampleRows?: Record<string, any>[] | undefined;
    }, {
        name: string;
        columns: {
            name: string;
            type: string;
            isPrimary?: boolean | undefined;
        }[];
        description?: string | undefined;
        rowCount?: number | undefined;
        sampleRows?: Record<string, any>[] | undefined;
    }>, "many">;
}, "strip", z.ZodTypeAny, {
    id: number;
    slug: string;
    name: string;
    description: string;
    tables: {
        name: string;
        columns: {
            name: string;
            type: string;
            isPrimary?: boolean | undefined;
        }[];
        description?: string | undefined;
        rowCount?: number | undefined;
        sampleRows?: Record<string, any>[] | undefined;
    }[];
    erDiagram?: string | undefined;
}, {
    id: number;
    slug: string;
    name: string;
    description: string;
    tables: {
        name: string;
        columns: {
            name: string;
            type: string;
            isPrimary?: boolean | undefined;
        }[];
        description?: string | undefined;
        rowCount?: number | undefined;
        sampleRows?: Record<string, any>[] | undefined;
    }[];
    erDiagram?: string | undefined;
}>;
export type SchemaMetadata = z.infer<typeof schemaMetaSchema>;
export declare const questionSchema: z.ZodObject<{
    id: z.ZodNumber;
    schemaId: z.ZodNumber;
    difficulty: z.ZodEnum<["easy", "medium", "hard"]>;
    prompt: z.ZodString;
    canonicalSql: z.ZodString;
    tags: z.ZodArray<z.ZodString, "many">;
    explanationStub: z.ZodOptional<z.ZodString>;
    optimalityNotes: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    id: number;
    schemaId: number;
    difficulty: "easy" | "medium" | "hard";
    prompt: string;
    canonicalSql: string;
    tags: string[];
    explanationStub?: string | undefined;
    optimalityNotes?: string | undefined;
}, {
    id: number;
    schemaId: number;
    difficulty: "easy" | "medium" | "hard";
    prompt: string;
    canonicalSql: string;
    tags: string[];
    explanationStub?: string | undefined;
    optimalityNotes?: string | undefined;
}>;
export type Question = z.infer<typeof questionSchema>;
export declare const sessionRequestSchema: z.ZodObject<{
    sessionId: z.ZodString;
    difficulty: z.ZodEnum<["easy", "medium", "hard"]>;
}, "strip", z.ZodTypeAny, {
    difficulty: "easy" | "medium" | "hard";
    sessionId: string;
}, {
    difficulty: "easy" | "medium" | "hard";
    sessionId: string;
}>;
export declare const submissionRequestSchema: z.ZodObject<{
    sessionId: z.ZodString;
    questionId: z.ZodNumber;
    userSql: z.ZodString;
}, "strip", z.ZodTypeAny, {
    sessionId: string;
    questionId: number;
    userSql: string;
}, {
    sessionId: string;
    questionId: number;
    userSql: string;
}>;
export declare const verdictTypes: readonly ["correct", "row_mismatch", "column_mismatch", "error", "timeout"];
export type Verdict = (typeof verdictTypes)[number];
export declare const submissionResponseSchema: z.ZodObject<{
    verdict: z.ZodEnum<["correct", "row_mismatch", "column_mismatch", "error", "timeout"]>;
    diffSummary: z.ZodObject<{
        missingColumns: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        extraColumns: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        rowCountDelta: z.ZodOptional<z.ZodNumber>;
        error: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        error?: string | undefined;
        missingColumns?: string[] | undefined;
        extraColumns?: string[] | undefined;
        rowCountDelta?: number | undefined;
    }, {
        error?: string | undefined;
        missingColumns?: string[] | undefined;
        extraColumns?: string[] | undefined;
        rowCountDelta?: number | undefined;
    }>;
    canonicalSqlPreview: z.ZodString;
    aiGuidanceId: z.ZodOptional<z.ZodString>;
    metrics: z.ZodObject<{
        executionMs: z.ZodOptional<z.ZodNumber>;
        rowsReturned: z.ZodOptional<z.ZodNumber>;
    }, "strip", z.ZodTypeAny, {
        executionMs?: number | undefined;
        rowsReturned?: number | undefined;
    }, {
        executionMs?: number | undefined;
        rowsReturned?: number | undefined;
    }>;
}, "strip", z.ZodTypeAny, {
    verdict: "correct" | "row_mismatch" | "column_mismatch" | "error" | "timeout";
    diffSummary: {
        error?: string | undefined;
        missingColumns?: string[] | undefined;
        extraColumns?: string[] | undefined;
        rowCountDelta?: number | undefined;
    };
    canonicalSqlPreview: string;
    metrics: {
        executionMs?: number | undefined;
        rowsReturned?: number | undefined;
    };
    aiGuidanceId?: string | undefined;
}, {
    verdict: "correct" | "row_mismatch" | "column_mismatch" | "error" | "timeout";
    diffSummary: {
        error?: string | undefined;
        missingColumns?: string[] | undefined;
        extraColumns?: string[] | undefined;
        rowCountDelta?: number | undefined;
    };
    canonicalSqlPreview: string;
    metrics: {
        executionMs?: number | undefined;
        rowsReturned?: number | undefined;
    };
    aiGuidanceId?: string | undefined;
}>;
export type SubmissionResponse = z.infer<typeof submissionResponseSchema>;
export declare const sessionStateSchema: z.ZodObject<{
    sessionId: z.ZodString;
    currentDifficulty: z.ZodEnum<["easy", "medium", "hard"]>;
    totalAnswered: z.ZodNumber;
    correctStreak: z.ZodNumber;
    wrongStreak: z.ZodNumber;
}, "strip", z.ZodTypeAny, {
    sessionId: string;
    currentDifficulty: "easy" | "medium" | "hard";
    totalAnswered: number;
    correctStreak: number;
    wrongStreak: number;
}, {
    sessionId: string;
    currentDifficulty: "easy" | "medium" | "hard";
    totalAnswered: number;
    correctStreak: number;
    wrongStreak: number;
}>;
export type SessionState = z.infer<typeof sessionStateSchema>;
export declare const schemaListResponseSchema: z.ZodArray<z.ZodObject<Pick<{
    id: z.ZodNumber;
    slug: z.ZodString;
    name: z.ZodString;
    description: z.ZodString;
    erDiagram: z.ZodOptional<z.ZodString>;
    tables: z.ZodArray<z.ZodObject<{
        name: z.ZodString;
        description: z.ZodOptional<z.ZodString>;
        columns: z.ZodArray<z.ZodObject<{
            name: z.ZodString;
            type: z.ZodString;
            isPrimary: z.ZodOptional<z.ZodBoolean>;
        }, "strip", z.ZodTypeAny, {
            name: string;
            type: string;
            isPrimary?: boolean | undefined;
        }, {
            name: string;
            type: string;
            isPrimary?: boolean | undefined;
        }>, "many">;
        rowCount: z.ZodOptional<z.ZodNumber>;
        sampleRows: z.ZodOptional<z.ZodArray<z.ZodRecord<z.ZodString, z.ZodAny>, "many">>;
    }, "strip", z.ZodTypeAny, {
        name: string;
        columns: {
            name: string;
            type: string;
            isPrimary?: boolean | undefined;
        }[];
        description?: string | undefined;
        rowCount?: number | undefined;
        sampleRows?: Record<string, any>[] | undefined;
    }, {
        name: string;
        columns: {
            name: string;
            type: string;
            isPrimary?: boolean | undefined;
        }[];
        description?: string | undefined;
        rowCount?: number | undefined;
        sampleRows?: Record<string, any>[] | undefined;
    }>, "many">;
}, "id" | "name" | "description">, "strip", z.ZodTypeAny, {
    id: number;
    name: string;
    description: string;
}, {
    id: number;
    name: string;
    description: string;
}>, "many">;
export declare const aiCoachPayloadSchema: z.ZodObject<{
    id: z.ZodString;
    questionId: z.ZodNumber;
    verdict: z.ZodEnum<["correct", "row_mismatch", "column_mismatch", "error", "timeout"]>;
    explanation: z.ZodString;
    optimalSql: z.ZodString;
    whyOptimal: z.ZodString;
}, "strip", z.ZodTypeAny, {
    id: string;
    questionId: number;
    verdict: "correct" | "row_mismatch" | "column_mismatch" | "error" | "timeout";
    explanation: string;
    optimalSql: string;
    whyOptimal: string;
}, {
    id: string;
    questionId: number;
    verdict: "correct" | "row_mismatch" | "column_mismatch" | "error" | "timeout";
    explanation: string;
    optimalSql: string;
    whyOptimal: string;
}>;
export type AiCoachPayload = z.infer<typeof aiCoachPayloadSchema>;
//# sourceMappingURL=index.d.ts.map