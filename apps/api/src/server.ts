import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import helmet from 'helmet';
import { apiRouter } from './routes';
import { env } from './config/env';
import { logger } from './config/logger';

const app = express();

app.use(helmet());
app.use(cors());
app.use(express.json({ limit: '1mb' }));
app.use(
  rateLimit({
    windowMs: 60_000,
    limit: 60,
    standardHeaders: true,
    legacyHeaders: false,
  }),
);

app.use('/api', apiRouter);

app.use((err: unknown, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  logger.error({ err }, 'Unhandled error');
  res.status(500).json({ error: err instanceof Error ? err.message : 'Unexpected server error' });
});

app.listen(env.PORT, () => {
  logger.info(`API server listening on port ${env.PORT}`);
});
