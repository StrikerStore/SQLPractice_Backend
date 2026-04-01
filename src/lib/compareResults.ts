/**
 * Deterministic comparison of MySQL result sets (order- and type-tolerant).
 */

function normalizeCell(val: unknown): string {
  if (val === null || val === undefined) return 'NULL';
  if (typeof val === 'bigint') return val.toString();
  if (val instanceof Date) return val.toISOString();
  if (typeof Buffer !== 'undefined' && Buffer.isBuffer(val)) return val.toString('hex');
  if (typeof val === 'number' && Number.isFinite(val)) {
    return Number.isInteger(val) ? String(val) : val.toFixed(12).replace(/\.?0+$/, '');
  }
  return String(val);
}

function normalizeRow(row: Record<string, unknown>): Record<string, string> {
  const out: Record<string, string> = {};
  for (const key of Object.keys(row).sort()) {
    out[key] = normalizeCell(row[key]);
  }
  return out;
}

type RowLike = Record<string, unknown>;

function strictSignatures(rows: RowLike[]): string[] {
  return rows.map((r) => JSON.stringify(normalizeRow(r as Record<string, unknown>))).sort();
}

function valueOnlySignatures(rows: RowLike[]): string[] {
  return rows
    .map((r) => {
      const values = Object.values(r).map((v) => normalizeCell(v));
      return JSON.stringify(values);
    })
    .sort();
}

export function resultsEquivalent(userRows: RowLike[], canonicalRows: RowLike[]): boolean {
  if (!Array.isArray(userRows) || !Array.isArray(canonicalRows)) return false;
  if (userRows.length !== canonicalRows.length) return false;
  const a = strictSignatures(userRows);
  const b = strictSignatures(canonicalRows);
  for (let i = 0; i < a.length; i++) {
    if (a[i] !== b[i]) {
      const vA = valueOnlySignatures(userRows);
      const vB = valueOnlySignatures(canonicalRows);
      if (vA.length !== vB.length) return false;
      for (let j = 0; j < vA.length; j++) {
        if (vA[j] !== vB[j]) return false;
      }
      return true;
    }
  }
  return true;
}
