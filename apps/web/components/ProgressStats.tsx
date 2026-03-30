import type { ClientSessionState } from '../hooks/useSessionState';

export default function ProgressStats({ state }: { state: ClientSessionState }) {
  const rows = [
    { label: 'Current difficulty', value: state.currentDifficulty.toUpperCase() },
    { label: 'Questions answered', value: state.totalAnswered.toString() },
    { label: 'Correct streak', value: state.correctStreak.toString() },
  ];
  return (
    <div className="rounded-2xl border border-slate-200 bg-white/80 p-4">
      <p className="mb-2 text-sm font-semibold uppercase tracking-wide text-slate-500">Session Stats</p>
      <dl className="space-y-1 text-sm text-slate-700">
        {rows.map((row) => (
          <div key={row.label} className="flex justify-between rounded-lg bg-slate-50 px-3 py-2">
            <dt className="text-slate-500">{row.label}</dt>
            <dd className="font-medium text-slate-900">{row.value}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}
