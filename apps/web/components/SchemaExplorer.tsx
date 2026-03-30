import type { SchemaMetadata } from '@sqlcat/types';
import clsx from 'clsx';

type Props = {
  schema?: SchemaMetadata;
};

export default function SchemaExplorer({ schema }: Props) {
  if (!schema) {
    return (
      <div className="rounded-2xl border border-dashed border-slate-200 p-6 text-sm text-slate-500">
        Select Start Practice to load a schema snapshot.
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-slate-200 bg-white/70 p-4 shadow-sm">
      <div className="mb-3">
        <p className="text-sm font-semibold uppercase tracking-wide text-slate-500">Database</p>
        <h3 className="text-lg font-semibold text-slate-900">{schema.name}</h3>
        <p className="text-sm text-slate-600">{schema.description}</p>
      </div>
      <div className="space-y-3 max-h-80 overflow-y-auto pr-2">
        {schema.tables.map((table) => (
          <div key={table.name} className="rounded-xl border border-slate-100 bg-slate-50/80 p-3">
            <p className="font-medium text-slate-900">{table.name}</p>
            {table.description && <p className="text-xs text-slate-500">{table.description}</p>}
            <ul className="mt-2 space-y-1 text-sm text-slate-600">
              {table.columns.map((col) => (
                <li key={col.name} className="flex items-center gap-2">
                  <span className={clsx('font-mono text-xs text-slate-800', col.isPrimary && 'text-brand-600')}>
                    {col.name}
                  </span>
                  <span className="text-[11px] uppercase tracking-wide text-slate-400">{col.type}</span>
                  {col.isPrimary && <span className="rounded bg-brand-50 px-1 text-[11px] text-brand-700">PK</span>}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </div>
  );
}
