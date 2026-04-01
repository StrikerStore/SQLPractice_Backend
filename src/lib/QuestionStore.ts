import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { z } from 'zod';
import pino from 'pino';

const logger = pino();

// ─── Zod schema for a single question ────────────────────────────────────────
const QuestionSchema = z.object({
  id: z.string().min(1).max(16),
  db: z.string().min(1).max(64),
  title: z.string().min(1).max(200),
  topic: z.string().min(1).max(100),
  difficulty: z.enum(['easy', 'medium', 'hard']),
  prompt: z.string().min(1).max(5000),
  hint: z.string().min(1).max(2000),
  canonicalSql: z.string().min(1).max(50_000),
  starterSql: z.string().max(50_000).optional(),
});

export type Question = z.infer<typeof QuestionSchema>;

// Public-facing question (never exposes canonicalSql)
export type PublicQuestion = Omit<Question, 'canonicalSql'>;

// ─── QuestionStore singleton ──────────────────────────────────────────────────
class QuestionStore {
  private questions: Question[] = [];
  private readonly questionsDir = path.join(process.cwd(), 'src/content/questions');

  load(): void {
    const loaded: Question[] = [];
    const seenIds = new Set<string>();

    const files = fs.readdirSync(this.questionsDir).filter((f) => f.endsWith('.json'));

    for (const file of files) {
      const filePath = path.join(this.questionsDir, file);
      try {
        const raw = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
        if (!Array.isArray(raw)) {
          logger.warn({ file }, 'Question file is not an array — skipping');
          continue;
        }
        for (const item of raw) {
          const parsed = QuestionSchema.safeParse(item);
          if (!parsed.success) {
            logger.warn({ file, id: item?.id, errors: parsed.error.flatten() }, 'Invalid question — skipping');
            continue;
          }
          if (seenIds.has(parsed.data.id)) {
            logger.warn({ id: parsed.data.id }, 'Duplicate question ID — skipping');
            continue;
          }
          seenIds.add(parsed.data.id);
          loaded.push(parsed.data);
        }
      } catch (err) {
        logger.error({ err, file }, 'Failed to load question file');
      }
    }

    this.questions = loaded;
    logger.info(`QuestionStore loaded ${loaded.length} questions from ${files.length} files`);
  }

  /** Reload from disk without restarting the server */
  reload(): void {
    this.load();
  }

  /** All questions, stripped of canonicalSql (safe for frontend) */
  getAll(): PublicQuestion[] {
    return this.questions.map(({ canonicalSql: _omit, ...q }) => q);
  }

  /** Questions filtered by db / difficulty / topic */
  query(filters: { db?: string; difficulty?: string; topic?: string }): PublicQuestion[] {
    return this.getAll().filter((q) => {
      if (filters.db && q.db !== filters.db) return false;
      if (filters.difficulty && q.difficulty !== filters.difficulty) return false;
      if (filters.topic && q.topic !== filters.topic) return false;
      return true;
    });
  }

  /** Public question by ID (no canonicalSql) */
  getById(id: string): PublicQuestion | undefined {
    const q = this.questions.find((q) => q.id === id);
    if (!q) return undefined;
    const { canonicalSql: _omit, ...pub } = q;
    return pub;
  }

  /** Canonical SQL — server-side use ONLY. Never send to frontend. */
  getCanonicalSql(id: string): string | undefined {
    return this.questions.find((q) => q.id === id)?.canonicalSql;
  }

  /** Distinct topic list (for filter dropdowns) */
  getTopics(): string[] {
    return [...new Set(this.questions.map((q) => q.topic))].sort();
  }

  /** Distinct database list */
  getDatabases(): string[] {
    return [...new Set(this.questions.map((q) => q.db))].sort();
  }

  get count(): number {
    return this.questions.length;
  }
}

export const questionStore = new QuestionStore();
