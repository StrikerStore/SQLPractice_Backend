import { RowDataPacket } from 'mysql2/promise';
import { db } from '../db.js';
import pino from 'pino';

const logger = pino();

// ─── Types ────────────────────────────────────────────────────────────────────

export interface Level {
  level_id: number;
  sort_order: number;
  slug: string;
  title: string;
  description: string;
  syntax: string;
  patterns: string;
  tips: string;
  question_count?: number;
}

export interface BuildConceptStep {
  step: number;
  title: string;
  body: string;
}

export interface Question {
  id: string;
  level_id: number;
  sort_order: number;
  db: string;
  title: string;
  difficulty: 'easy' | 'medium' | 'hard';
  prompt: string;
  hint: string;
  canonical_sql: string;
  starter_sql: string | null;
  build_concept: BuildConceptStep[];
}

// Public-facing question (never exposes canonical_sql)
export type PublicQuestion = Omit<Question, 'canonical_sql'>;

// ─── Row types for mysql2 ─────────────────────────────────────────────────────

interface LevelRow extends RowDataPacket {
  level_id: number;
  sort_order: number;
  slug: string;
  title: string;
  description: string;
  syntax: string;
  patterns: string;
  tips: string;
}

interface QuestionRow extends RowDataPacket {
  id: string;
  level_id: number;
  sort_order: number;
  db: string;
  title: string;
  difficulty: 'easy' | 'medium' | 'hard';
  prompt: string;
  hint: string;
  canonical_sql: string;
  starter_sql: string | null;
  build_concept: string; // JSON string from MySQL
}

// ─── QuestionStore singleton ──────────────────────────────────────────────────

class QuestionStore {
  private questions: Question[] = [];
  private levels: Level[] = [];

  async load(): Promise<void> {
    let connection;
    try {
      connection = await db.getConnection();

      // Load levels
      const [levelRows] = await connection.query<LevelRow[]>(
        'SELECT * FROM sql_practice.levels ORDER BY sort_order',
      );
      this.levels = levelRows.map((r) => ({
        level_id: r.level_id,
        sort_order: r.sort_order,
        slug: r.slug,
        title: r.title,
        description: r.description,
        syntax: r.syntax,
        patterns: r.patterns,
        tips: r.tips,
      }));

      // Load questions
      const [questionRows] = await connection.query<QuestionRow[]>(
        'SELECT * FROM sql_practice.questions ORDER BY level_id, sort_order',
      );
      this.questions = questionRows.map((r) => ({
        id: r.id,
        level_id: r.level_id,
        sort_order: r.sort_order,
        db: r.db,
        title: r.title,
        difficulty: r.difficulty,
        prompt: r.prompt,
        hint: r.hint,
        canonical_sql: r.canonical_sql,
        starter_sql: r.starter_sql,
        build_concept: typeof r.build_concept === 'string'
          ? JSON.parse(r.build_concept)
          : (r.build_concept as unknown as BuildConceptStep[]),
      }));

      logger.info(`QuestionStore loaded ${this.questions.length} questions across ${this.levels.length} levels`);
    } catch (err) {
      logger.error({ err }, 'QuestionStore.load() failed');
      throw err;
    } finally {
      if (connection) connection.release();
    }
  }

  /** All levels with question counts */
  getLevels(): (Level & { question_count: number })[] {
    return this.levels.map((lvl) => ({
      ...lvl,
      question_count: this.questions.filter((q) => q.level_id === lvl.level_id).length,
    }));
  }

  /** Single level by ID */
  getLevelById(levelId: number): Level | undefined {
    return this.levels.find((l) => l.level_id === levelId);
  }

  /** All public questions (no canonical_sql) optionally filtered */
  getAll(filters: { db?: string; difficulty?: string; level?: number } = {}): PublicQuestion[] {
    return this.questions
      .filter((q) => {
        if (filters.db && q.db !== filters.db) return false;
        if (filters.difficulty && q.difficulty !== filters.difficulty) return false;
        if (filters.level && q.level_id !== filters.level) return false;
        return true;
      })
      .map(({ canonical_sql: _omit, ...pub }) => pub);
  }

  /** Questions grouped by level */
  getByLevel(levelId: number): PublicQuestion[] {
    return this.questions
      .filter((q) => q.level_id === levelId)
      .map(({ canonical_sql: _omit, ...pub }) => pub);
  }

  /** Single public question by ID */
  getById(id: string): PublicQuestion | undefined {
    const q = this.questions.find((q) => q.id === id);
    if (!q) return undefined;
    const { canonical_sql: _omit, ...pub } = q;
    return pub;
  }

  /** Build concept steps for a question */
  getBuildConcept(id: string): BuildConceptStep[] | undefined {
    return this.questions.find((q) => q.id === id)?.build_concept;
  }

  /** Canonical SQL — server-side ONLY. Never send to frontend. */
  getCanonicalSql(id: string): string | undefined {
    return this.questions.find((q) => q.id === id)?.canonical_sql;
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
