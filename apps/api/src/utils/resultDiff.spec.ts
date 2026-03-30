import { describe, expect, it } from 'vitest';
import { diffQueryResults, QueryResult } from './resultDiff';

const canonical: QueryResult = {
  rows: [
    { id: 1, name: 'Asha' },
    { id: 2, name: 'Ravi' },
  ],
  columns: ['id', 'name'],
  durationMs: 10,
};

describe('diffQueryResults', () => {
  it('returns null when result sets match regardless of order', () => {
    const user: QueryResult = {
      rows: [
        { id: 2, name: 'Ravi' },
        { id: 1, name: 'Asha' },
      ],
      columns: ['id', 'name'],
      durationMs: 12,
    };
    expect(diffQueryResults(user, canonical)).toBeNull();
  });

  it('detects column deviations', () => {
    const user: QueryResult = {
      rows: [{ id: 1, city: 'Pune' }],
      columns: ['id', 'city'],
      durationMs: 5,
    };
    const diff = diffQueryResults(user, canonical);
    expect(diff?.missingColumns).toEqual(['name']);
    expect(diff?.extraColumns).toEqual(['city']);
  });

  it('detects row count deltas', () => {
    const user: QueryResult = {
      rows: [{ id: 1, name: 'Asha' }],
      columns: ['id', 'name'],
      durationMs: 4,
    };
    const diff = diffQueryResults(user, canonical);
    expect(diff?.rowCountDelta).toBe(-1);
  });
});
