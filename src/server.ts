import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import helmet from 'helmet';
import pino from 'pino';
import rateLimit from 'express-rate-limit';
import { v4 as uuidv4 } from 'uuid';
import { executeQuery, explainQuery } from './routes/query';
import { aiCoachHandler } from './routes/ai-coach';
import { getSchema } from './routes/schema';
import questionsRouter from './routes/questions';
import { testConnection } from './db';
import { questionStore } from './lib/QuestionStore';

dotenv.config();

const app = express();
const logger = pino();

// ─── Trust Proxy (Required for Railway) ──────────────────────────────────────
app.set('trust proxy', 1);

// ─── Request ID ──────────────────────────────────────────────────────────────
app.use((req, res, next) => {
  const id = uuidv4();
  (req as express.Request & { requestId: string }).requestId = id;
  res.setHeader('X-Request-Id', id);
  next();
});

// ─── Security headers (Helmet) ───────────────────────────────────────────────
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' },
    contentSecurityPolicy: false, // CSP handled by Next.js frontend
    hsts: { maxAge: 31536000, includeSubDomains: true, preload: true },
  }),
);

// ─── CORS ────────────────────────────────────────────────────────────────────
const allowedOrigins = process.env.CORS_ORIGIN
  ? process.env.CORS_ORIGIN.split(',').map((s) => s.trim()).filter(Boolean)
  : [];

app.use(
  cors({
    origin: allowedOrigins.length > 0
      ? (origin, cb) => {
          // Allow requests with no origin (server-to-server, curl, health checks)
          if (!origin || allowedOrigins.includes(origin)) return cb(null, true);
          cb(new Error(`CORS: Origin "${origin}" not allowed`));
        }
      : true, // allow all if no CORS_ORIGIN set (local dev)
    methods: ['GET', 'POST', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Accept'],
    maxAge: 86400, // cache preflight for 24h
  }),
);

// ─── Body parser — strict 512KB cap ─────────────────────────────────────────
app.use(express.json({ limit: '512kb' }));

// ─── Global abuse guard (120 req/min across ALL routes) ─────────────────────
const globalLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 120,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests. Please slow down.' },
  skip: (req) => req.path === '/health', // health checks exempt
});
app.use(globalLimiter);

// ─── Per-route tighter limiters ──────────────────────────────────────────────
const apiLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 60,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Query rate limit exceeded. Wait a moment and try again.' },
});

const aiLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 15,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'AI Coach rate limit exceeded. Wait a moment and try again.' },
});

const schemaLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 60,
  standardHeaders: true,
  legacyHeaders: false,
});

// ─── Strip sensitive server info ─────────────────────────────────────────────
app.disable('x-powered-by');

// ─── Health endpoint (no auth needed) ───────────────────────────────────────
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', ts: new Date().toISOString(), questions: questionStore.count });
});

// ─── API Routes ──────────────────────────────────────────────────────────────
app.post('/api/query',    apiLimiter,    executeQuery);
app.post('/api/explain',  apiLimiter,    explainQuery);
app.post('/api/ai-coach', aiLimiter,     aiCoachHandler);
app.get( '/api/schema/:id', schemaLimiter, getSchema);
app.use( '/api/questions', questionsRouter);

// ─── 404 catch-all ───────────────────────────────────────────────────────────
app.use((_req, res) => {
  res.status(404).json({ error: 'Not found.' });
});

// ─── Global error handler ─────────────────────────────────────────────────────
app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  logger.error({ err }, 'Unhandled error');
  res.status(500).json({ error: 'Internal server error.' });
});

const PORT = Number(process.env.PORT) || 3001;

const startServer = async () => {
  questionStore.load();
  await testConnection();
  app.listen(PORT, '0.0.0.0', () => {
    logger.info(`Server listening on 0.0.0.0:${PORT} — ${questionStore.count} questions loaded`);
  });
};

startServer();
