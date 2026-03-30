import { parse } from 'pgsql-parser';

const forbiddenStatements = new Set([
  'InsertStmt',
  'UpdateStmt',
  'DeleteStmt',
  'CreateStmt',
  'DropStmt',
  'AlterTableStmt',
  'IndexStmt',
  'CopyStmt',
  'TruncateStmt',
]);

export function assertSelectOnly(sql: string) {
  const statements = parse(sql);
  if (!Array.isArray(statements) || statements.length === 0) {
    throw new Error('No SQL statement detected.');
  }
  if (statements.length > 1) {
    throw new Error('Only a single SELECT statement is allowed.');
  }

  const stmt = statements[0];
  const raw = stmt?.RawStmt?.stmt;
  if (!raw) {
    throw new Error('Unable to parse SQL statement.');
  }

  const typeName = Object.keys(raw)[0];
  if (forbiddenStatements.has(typeName)) {
    throw new Error('Only read-only SELECT statements are permitted.');
  }
  if (typeName !== 'SelectStmt') {
    throw new Error('Only SELECT statements are permitted.');
  }

  const selectStmt = raw.SelectStmt;
  if (selectStmt.intoClause) {
    throw new Error('INTO clauses are not allowed.');
  }
  if (selectStmt.withClause?.recursive) {
    throw new Error('Recursive CTEs are not supported.');
  }
  if (selectStmt.lockingClause?.length) {
    throw new Error('Locking clauses are not supported.');
  }
}
