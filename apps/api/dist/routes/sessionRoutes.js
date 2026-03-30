import { Router } from 'express';
import { sessionRequestSchema, submissionRequestSchema, submissionResponseSchema } from '@sqlcat/types';
import { fetchQuestionByDifficulty, fetchQuestionById } from '../services/questionService';
import { getSchemaMetadata } from '../services/schemaService';
import { evaluateSubmission } from '../services/evaluationService';
import { generateGuidance } from '../services/aiCoachService';
import { logger } from '../config/logger';
export const sessionRouter = Router();
sessionRouter.post('/next', async (req, res, next) => {
    try {
        const parse = sessionRequestSchema.safeParse(req.body);
        if (!parse.success) {
            return res.status(400).json({ error: parse.error.issues });
        }
        const question = await fetchQuestionByDifficulty(parse.data.difficulty);
        const schema = await getSchemaMetadata(question.schemaId);
        return res.json({
            question: {
                id: question.id,
                schemaId: question.schemaId,
                prompt: question.prompt,
                difficulty: question.difficulty,
                tags: question.tags,
                explanationStub: question.explanationStub,
            },
            schema,
            difficulty: question.difficulty,
            remainingHintCount: 2,
        });
    }
    catch (err) {
        next(err);
    }
});
sessionRouter.post('/submit', async (req, res, next) => {
    try {
        const parse = submissionRequestSchema.safeParse(req.body);
        if (!parse.success) {
            return res.status(400).json({ error: parse.error.issues });
        }
        const { sessionId, questionId, userSql } = parse.data;
        const question = await fetchQuestionById(questionId);
        const evaluation = await evaluateSubmission(sessionId, question, userSql);
        let guidanceId;
        try {
            const guidance = await generateGuidance({
                questionId: question.id,
                verdict: evaluation.verdict,
                prompt: question.prompt,
                schemaDescription: question.schemaDescription,
                canonicalSql: question.canonicalSql,
                userSql,
                diffSummary: evaluation.diffSummary,
                optimalityNotes: question.optimalityNotes,
            });
            guidanceId = guidance?.id;
        }
        catch (err) {
            logger.warn({ err }, 'AI guidance failed');
        }
        const response = submissionResponseSchema.parse({
            verdict: evaluation.verdict,
            diffSummary: evaluation.diffSummary,
            canonicalSqlPreview: question.canonicalSql,
            aiGuidanceId: guidanceId,
            metrics: evaluation.metrics,
        });
        return res.json(response);
    }
    catch (err) {
        next(err);
    }
});
