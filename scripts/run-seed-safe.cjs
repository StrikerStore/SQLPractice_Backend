// Auto-seed only when required databases/tables/data are missing.
const { spawnSync } = require('child_process');
const mysql = require('mysql2/promise');
require('dotenv').config();

const REQUIRED_DATASETS = [
  { db: 'retail',       table: 'orders',    minRows: 3000 },
  { db: 'hr',           table: 'salaries',  minRows: 3000 },
  { db: 'sql_practice', table: 'questions', minRows: 100  },
];

async function needsSeed(connection) {
  for (const item of REQUIRED_DATASETS) {
    const [dbRows] = await connection.query(
      'SELECT SCHEMA_NAME FROM INFORMATION_SCHEMA.SCHEMATA WHERE SCHEMA_NAME = ?',
      [item.db],
    );
    if (!Array.isArray(dbRows) || dbRows.length === 0) {
      console.log(`[seed-safe] Missing database: ${item.db}`);
      return true;
    }

    const [tableRows] = await connection.query(
      'SELECT TABLE_NAME FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_SCHEMA = ? AND TABLE_NAME = ?',
      [item.db, item.table],
    );
    if (!Array.isArray(tableRows) || tableRows.length === 0) {
      console.log(`[seed-safe] Missing table: ${item.db}.${item.table}`);
      return true;
    }

    const [countRows] = await connection.query(
      `SELECT COUNT(*) AS cnt FROM \`${item.db}\`.\`${item.table}\``,
    );
    const count = Number(countRows?.[0]?.cnt ?? 0);
    if (!Number.isFinite(count) || count < item.minRows) {
      console.log(
        `[seed-safe] Insufficient data in ${item.db}.${item.table}: ${count}/${item.minRows}`,
      );
      return true;
    }
  }
  return false;
}

async function main() {
  const url = process.env.DATABASE_URL?.trim() || 'mysql://root:root@localhost:3306/';
  let connection;
  try {
    connection = await mysql.createConnection(url);
    const shouldSeed = await needsSeed(connection);

    if (!shouldSeed) {
      console.log('[seed-safe] Database and data checks passed. Skipping seed.');
      return;
    }

    console.log('[seed-safe] Missing/incomplete data detected. Running `npm run seed`...');
    const npmCmd = process.platform === 'win32' ? 'npm.cmd' : 'npm';
    const result = spawnSync(npmCmd, ['run', 'seed'], {
      stdio: 'inherit',
      shell: false,
    });

    const code = result.status ?? 0;
    if (code !== 0) {
      console.error(`[seed-safe] Seeding failed with exit code ${code}.`);
      process.exit(code);
    }
  } catch (error) {
    console.error('[seed-safe] Failed to run safe seed check (will skip):', error.message ?? error);
    // Exit 0 — a connection failure is non-fatal; the server has already started.
  } finally {
    if (connection) await connection.end();
  }
}

main();

