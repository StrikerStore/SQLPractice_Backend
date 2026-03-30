CREATE TABLE IF NOT EXISTS public.schemas (
    id SERIAL PRIMARY KEY,
    slug TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL,
    description TEXT NOT NULL,
    metadata JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.questions (
    id SERIAL PRIMARY KEY,
    schema_id INTEGER NOT NULL REFERENCES public.schemas(id) ON DELETE CASCADE,
    difficulty TEXT NOT NULL CHECK (difficulty IN ('easy','medium','hard')),
    prompt TEXT NOT NULL,
    canonical_sql TEXT NOT NULL,
    tags TEXT[] DEFAULT '{}'::TEXT[],
    explanation_stub TEXT,
    optimality_notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.submissions (
    id BIGSERIAL PRIMARY KEY,
    session_id UUID NOT NULL,
    question_id INTEGER NOT NULL REFERENCES public.questions(id) ON DELETE CASCADE,
    verdict TEXT NOT NULL,
    user_sql TEXT NOT NULL,
    diff_summary JSONB,
    metrics JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_questions_schema ON public.questions(schema_id);
CREATE INDEX IF NOT EXISTS idx_questions_difficulty ON public.questions(difficulty);
CREATE INDEX IF NOT EXISTS idx_submissions_question ON public.submissions(question_id);
