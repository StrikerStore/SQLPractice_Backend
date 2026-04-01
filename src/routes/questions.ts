import { Router, Request, Response } from 'express';
import { questionStore } from '../lib/QuestionStore';
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

/**
 * GET /api/questions
 * Returns all questions (public fields only — canonicalSql is NEVER included).
 * Supports optional query params: db, difficulty, topic
 */
router.get('/', questionListLimiter, (req: Request, res: Response) => {
  const db = safeStr(req.query.db);
  const topic = safeStr(req.query.topic);
  const rawDiff = safeStr(req.query.difficulty);
  const difficulty = rawDiff && VALID_DIFFICULTIES.has(rawDiff) ? rawDiff : undefined;

  const questions = questionStore.query({ db, difficulty, topic });
  res.json({
    count: questions.length,
    filters: {
      databases: questionStore.getDatabases(),
      topics: questionStore.getTopics(),
    },
    questions,
  });
});

/**
 * GET /api/questions/meta
 * Returns filter metadata: list of databases and topics.
 */
router.get('/meta', questionListLimiter, (_req: Request, res: Response) => {
  res.json({
    databases: questionStore.getDatabases(),
    topics: questionStore.getTopics(),
    count: questionStore.count,
  });
});

/**
 * GET /api/questions/:id/solution
 * Returns the canonical SQL for a question.
 * Rate-limited (20 req/min) to prevent bulk harvesting of answers.
 * The UI enforces an additional attempt gate (2 wrong tries).
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
 * Returns a single question by ID (public fields only — no canonicalSql).
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

/**
 * POST /api/questions/reload
 * Hot-reloads all question JSON files without restarting the server.
 * Guarded by ADMIN_KEY env var — for content updates on Railway only.
 */
router.post('/reload', (req: Request, res: Response) => {
  const adminKey = process.env.ADMIN_KEY?.trim();
  const providedKey = (req.headers['x-admin-key'] as string | undefined)?.trim();

  if (!adminKey || providedKey !== adminKey) {
    res.status(403).json({ error: 'Forbidden.' });
    return;
  }

  questionStore.reload();
  res.json({ reloaded: true, count: questionStore.count });
});

export default router;
