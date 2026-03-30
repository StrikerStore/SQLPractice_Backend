import type { SubmissionResponse } from '@sqlcat/types';

const verdictCopy: Record<string, { title: string; tone: string }> = {
  correct: { title: '?? Correct', tone: 'text-emerald-600' },
  row_mismatch: { title: '?? Row mismatch', tone: 'text-amber-600' },
  column_mismatch: { title: '?? Column mismatch', tone: 'text-amber-600' },
  error: { title: '?? Error executing query', tone: 'text-rose-600' },
  timeout: { title: '? Query timed out', tone: 'text-rose-600' },
};

type Props = {
  submission?: SubmissionResponse | null;
};

export default function ResultSummary({ submission }: Props) {
  if (!submission) {
    return (
      <div className="rounded-2xl border border-dashed border-slate-200 p-6 text-sm text-slate-500">
        Run your query to see verdicts, result diffs, and the canonical answer preview.
      </div>
    );
  }
  const copy = verdictCopy[submission.verdict] ?? verdictCopy.error;
  return (
    <div className="rounded-2xl border border-slate-200 bg-white/90 p-4 shadow-sm">
      <p className={`text-lg font-semibold ${copy.tone}`}>{copy.title}</p>
      {submission.diffSummary.error && <p className="text-sm text-rose-600">{submission.diffSummary.error}</p>}
      <div className="mt-3 grid gap-3 text-sm text-slate-700 sm:grid-cols-2">
        <div className="rounded-xl bg-slate-50 p-3">
          <p className="text-xs uppercase tracking-wide text-slate-400">Canonical SQL</p>
          <pre className="mt-1 max-h-32 overflow-auto text-xs text-slate-800">
            <code>{submission.canonicalSqlPreview}</code>
          </pre>
        </div>
        <div className="rounded-xl bg-slate-50 p-3">
          <p className="text-xs uppercase tracking-wide text-slate-400">Difference summary</p>
          <ul className="mt-1 space-y-1">
            {submission.diffSummary.missingColumns && (
              <li>Missing columns: {submission.diffSummary.missingColumns.join(', ')}</li>
            )}
            {submission.diffSummary.extraColumns && <li>Extra columns: {submission.diffSummary.extraColumns.join(', ')}</li>}
            {submission.diffSummary.rowCountDelta !== undefined && (
              <li>Row delta: {submission.diffSummary.rowCountDelta}</li>
            )}
            {!submission.diffSummary.missingColumns &&
              !submission.diffSummary.extraColumns &&
              submission.diffSummary.rowCountDelta === undefined &&
              !submission.diffSummary.error && <li>Result set matched perfectly.</li>}
          </ul>
        </div>
      </div>
    </div>
  );
}
