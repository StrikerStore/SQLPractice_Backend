export type QueryResult = {
  rows: Record<string, unknown>[];
  columns: string[];
  durationMs: number;
};

export type DiffSummary = {
  missingColumns?: string[];
  extraColumns?: string[];
  rowCountDelta?: number;
  error?: string;
};

export function diffQueryResults(user: QueryResult, canonical: QueryResult): DiffSummary | null {
  const missingColumns = canonical.columns.filter((col) => !user.columns.includes(col));
  const extraColumns = user.columns.filter((col) => !canonical.columns.includes(col));
  const rowCountDelta = user.rows.length - canonical.rows.length;
  const hasColumnIssues = missingColumns.length > 0 || extraColumns.length > 0;
  const hasRowIssues = rowCountDelta !== 0 || !rowsEqual(user.rows, canonical.rows);

  if (!hasColumnIssues && !hasRowIssues) {
    return null;
  }

  return {
    missingColumns: missingColumns.length ? missingColumns : undefined,
    extraColumns: extraColumns.length ? extraColumns : undefined,
    rowCountDelta: rowCountDelta || undefined,
  };
}

function rowsEqual(a: Record<string, unknown>[], b: Record<string, unknown>[]) {
  if (a.length !== b.length) {
    return false;
  }
  const normalize = (rows: Record<string, unknown>[]) =>
    rows
      .map((row) => {
        const sortedEntries = Object.entries(row).sort(([k1], [k2]) => k1.localeCompare(k2));
        return JSON.stringify(sortedEntries);
      })
      .sort();
  const [normA, normB] = [normalize(a), normalize(b)];
  return normA.every((val, idx) => val === normB[idx]);
}
