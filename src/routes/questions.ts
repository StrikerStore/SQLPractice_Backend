import { Router, Request, Response } from 'express';
import { questionStore } from '../lib/QuestionStore.js';
import rateLimit from 'express-rate-limit';

const router = Router();

// ─── Rate limiters ──────────────────────────────────────────────────────────
const questionListLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 60,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests — please slow down.' },
});

const buildConceptLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many build-concept requests — slow down.' },
});

const solutionLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many solution requests — slow down.' },
});

// ─── Input validation helpers ───────────────────────────────────────────────
const VALID_DIFFICULTIES = new Set(['easy', 'medium', 'hard']);
const ID_RE = /^[A-Za-z0-9_-]{1,20}$/;

function safeStr(val: unknown): string | undefined {
  if (typeof val !== 'string' || val.length > 128) return undefined;
  return val.trim() || undefined;
}

function safeInt(val: unknown): number | undefined {
  const n = Number(val);
  return Number.isInteger(n) && n > 0 ? n : undefined;
}

/**
 * GET /api/questions/levels
 * Returns all curriculum levels with question counts.
 */
router.get('/levels', questionListLimiter, (_req: Request, res: Response) => {
  const levels = questionStore.getLevels();
  res.json({ count: levels.length, levels });
});

/**
 * GET /api/questions/levels/:levelId
 * Returns a single level's learning content plus its questions.
 */
router.get('/levels/:levelId', questionListLimiter, (req: Request, res: Response) => {
  const levelId = safeInt(req.params.levelId);
  if (!levelId) {
    res.status(400).json({ error: 'Invalid level ID.' });
    return;
  }
  const level = questionStore.getLevelById(levelId);
  if (!level) {
    res.status(404).json({ error: `Level ${levelId} not found.` });
    return;
  }
  const questions = questionStore.getByLevel(levelId);
  res.json({ level, questions });
});

/**
 * GET /api/questions
 * Returns all questions (public fields only — canonical_sql is NEVER included).
 * Supports optional query params: db, difficulty, level
 */
router.get('/', questionListLimiter, (req: Request, res: Response) => {
  const db = safeStr(req.query.db);
  const rawDiff = safeStr(req.query.difficulty);
  const difficulty = rawDiff && VALID_DIFFICULTIES.has(rawDiff) ? rawDiff : undefined;
  const level = safeInt(req.query.level);

  const questions = questionStore.getAll({ db, difficulty, level });
  res.json({
    count: questions.length,
    filters: {
      databases: questionStore.getDatabases(),
      levels: questionStore.getLevels().map((l) => ({ level_id: l.level_id, slug: l.slug, title: l.title })),
    },
    questions,
  });
});

/**
 * GET /api/questions/:id/build-concept
 * Returns the step-by-step thinking guide for a question.
 * Rate-limited to prevent bulk harvesting.
 */
router.get('/:id/build-concept', buildConceptLimiter, (req: Request, res: Response) => {
  const id = req.params.id;
  if (!ID_RE.test(id)) {
    res.status(400).json({ error: 'Invalid question ID.' });
    return;
  }
  const steps = questionStore.getBuildConcept(id);
  if (!steps) {
    res.status(404).json({ error: `Question "${id}" not found.` });
    return;
  }
  res.json({ questionId: id, steps });
});

/**
 * GET /api/questions/:id/solution
 * Returns the canonical SQL for a question.
 * Rate-limited (20 req/min) to prevent bulk harvesting of answers.
 */
router.get('/:id/solution', solutionLimiter, (req: Request, res: Response) => {
  const id = req.params.id;
  if (!ID_RE.test(id)) {
    res.status(400).json({ error: 'Invalid question ID.' });
    return;
  }
  const canonicalSql = questionStore.getCanonicalSql(id);
  if (!canonicalSql) {
    res.status(404).json({ error: `Question "${id}" not found.` });
    return;
  }
  res.json({ canonicalSql });
});

/**
 * GET /api/questions/:id
 * Returns a single question by ID (public fields only — no canonical_sql).
 */
router.get('/:id', questionListLimiter, (req: Request, res: Response) => {
  const id = req.params.id;
  if (!ID_RE.test(id)) {
    res.status(400).json({ error: 'Invalid question ID.' });
    return;
  }
  const question = questionStore.getById(id);
  if (!question) {
    res.status(404).json({ error: `Question "${id}" not found.` });
    return;
  }
  res.json(question);
});

export default router;
