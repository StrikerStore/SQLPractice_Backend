'use client';

import useSWR from 'swr';
import type { AiCoachPayload } from '@sqlcat/types';
import { fetchGuidance } from '../lib/api';

type Props = {
  guidanceId?: string;
};

export default function CoachNotes({ guidanceId }: Props) {
  const { data, error, isLoading } = useSWR<AiCoachPayload>(
    guidanceId ? ['ai-guidance', guidanceId] : null,
    () => fetchGuidance(guidanceId as string),
    { refreshInterval: 0 },
  );

  return (
    <div className="rounded-2xl border border-slate-200 bg-white/80 p-4">
      <div className="mb-2 flex items-center justify-between">
        <p className="text-sm font-semibold uppercase tracking-wide text-slate-500">Coach&apos;s Notes</p>
        {isLoading && <span className="text-xs text-slate-400">Summoning...</span>}
      </div>
      {!guidanceId && <p className="text-sm text-slate-500">Submit a query to unlock guidance.</p>}
      {error && <p className="text-sm text-red-500">AI guidance unavailable right now.</p>}
      {data && (
        <div className="space-y-2 text-sm text-slate-700">
          <p className="font-medium text-slate-900">Explanation</p>
          <p>{data.explanation}</p>
          <p className="font-medium text-slate-900">Suggested SQL</p>
          <pre className="rounded-xl bg-slate-900/90 p-3 text-xs text-slate-50">
            <code>{data.optimalSql}</code>
          </pre>
          <p className="text-slate-600">{data.whyOptimal}</p>
        </div>
      )}
    </div>
  );
}
