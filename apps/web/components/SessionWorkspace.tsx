'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import dynamic from 'next/dynamic';
import { Difficulty, SubmissionResponse } from '@sqlcat/types';
import { fetchNextQuestion, submitAnswer, type NextQuestionResponse } from '../lib/api';
import { useSessionState } from '../hooks/useSessionState';
import SchemaExplorer from './SchemaExplorer';
import ResultSummary from './ResultSummary';
import CoachNotes from './CoachNotes';
import ProgressStats from './ProgressStats';
import clsx from 'clsx';

const MonacoEditor = dynamic(() => import('@monaco-editor/react'), { ssr: false });

export default function SessionWorkspace() {
  const { state, recordVerdict, resetSession } = useSessionState();
  const [active, setActive] = useState<NextQuestionResponse | null>(null);
  const [editorValue, setEditorValue] = useState<string>('-- Write your SQL here\n');
  const [submission, setSubmission] = useState<SubmissionResponse | null>(null);
  const [aiGuidanceId, setAiGuidanceId] = useState<string | undefined>();
  const [loadingQuestion, setLoadingQuestion] = useState(false);
  const [running, setRunning] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadQuestion = useCallback(async (difficulty: Difficulty, sessionId: string) => {
    setLoadingQuestion(true);
    setError(null);
    try {
      const next = await fetchNextQuestion(sessionId, difficulty);
      setActive(next);
      setSubmission(null);
      setAiGuidanceId(undefined);
      setEditorValue('-- Preview the schema on the right and craft your SQL here\n');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to load question');
    } finally {
      setLoadingQuestion(false);
    }
  }, []);

  useEffect(() => {
    loadQuestion(state.currentDifficulty, state.sessionId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loadQuestion, state.sessionId]);

  const handleRun = useCallback(async () => {
    if (!active) return;
    setRunning(true);
    setError(null);
    try {
      const result = await submitAnswer({ sessionId: state.sessionId, questionId: active.question.id, userSql: editorValue });
      setSubmission(result);
      setAiGuidanceId(result.aiGuidanceId ?? undefined);
      recordVerdict(result.verdict);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to evaluate query');
    } finally {
      setRunning(false);
    }
  }, [active, editorValue, recordVerdict, state.sessionId]);

  const difficultyPill = useMemo(() => difficultyPills[active?.difficulty ?? state.currentDifficulty], [active, state.currentDifficulty]);

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-sm uppercase tracking-wide text-slate-500">Session ID</p>
          <p className="font-mono text-sm text-slate-900">{state.sessionId}</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => loadQuestion(state.currentDifficulty, state.sessionId)}
            disabled={loadingQuestion}
            className="rounded-full border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50"
          >
            {loadingQuestion ? 'Loading...' : 'New question'}
          </button>
          <button
            onClick={resetSession}
            className="rounded-full border border-rose-200 px-4 py-2 text-sm font-medium text-rose-600 hover:bg-rose-50"
          >
            Reset session
          </button>
        </div>
      </header>
      {error && <p className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700">{error}</p>}
      <div className="grid gap-6 lg:grid-cols-[2fr,1fr]">
        <div className="space-y-4">
          <article className="rounded-2xl border border-slate-200 bg-white/90 p-5 shadow-sm">
            <div className="mb-3 flex items-center justify-between">
              <div>
                <p className="text-xs uppercase tracking-wide text-slate-500">Current difficulty</p>
                <span className={clsx('inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold', difficultyPill.className)}>
                  {difficultyPill.label}
                </span>
              </div>
              <div className="text-right text-sm text-slate-500">
                {active && <p>Hints left: {active.remainingHintCount}</p>}
              </div>
            </div>
            {loadingQuestion && <p className="text-sm text-slate-500">Fetching a fresh prompt...</p>}
            {active && !loadingQuestion && (
              <div>
                <h2 className="text-xl font-semibold text-slate-900">Question</h2>
                <p className="mt-2 text-slate-700">{active.question.prompt}</p>
                {active.question.tags.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-2">
                    {active.question.tags.map((tag) => (
                      <span key={tag} className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600">
                        {tag}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            )}
          </article>
          <section className="rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
              <p className="font-semibold text-slate-900">SQL Editor</p>
              <button
                onClick={handleRun}
                disabled={running || !active}
                className="rounded-full bg-brand-600 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-500 disabled:opacity-50"
              >
                {running ? 'Running...' : 'Run (Ctrl/Cmd + Enter)'}
              </button>
            </div>
            <div style={{ minHeight: 320 }}>
              <MonacoEditor
                height="320px"
                language="sql"
                theme="vs-dark"
                value={editorValue}
                onChange={(value) => setEditorValue(value ?? '')}
                options={{ minimap: { enabled: false }, fontSize: 14, scrollBeyondLastLine: false }}
                onMount={(editor, monaco) => {
                  editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.Enter, () => handleRun());
                }}
              />
            </div>
          </section>
          <ResultSummary submission={submission} />
        </div>
        <div className="space-y-4">
          <SchemaExplorer schema={active?.schema} />
          <ProgressStats state={state} />
          <CoachNotes guidanceId={aiGuidanceId} />
        </div>
      </div>
    </div>
  );
}

const difficultyPills: Record<Difficulty, { label: string; className: string }> = {
  easy: { label: 'Easy', className: 'bg-emerald-50 text-emerald-700 border border-emerald-100' },
  medium: { label: 'Medium', className: 'bg-amber-50 text-amber-700 border border-amber-100' },
  hard: { label: 'Hard', className: 'bg-rose-50 text-rose-700 border border-rose-100' },
};
