import 'dotenv/config';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';
import { readFile } from 'fs/promises';
import format from 'pg-format';
import { Pool } from 'pg';
import { datasets, questionSeeds } from './datasets';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const connectionString = process.env.DATABASE_URL ?? 'postgres://postgres:postgres@localhost:5432/sqlcat';

async function run() {
  const pool = new Pool({ connectionString });
  const client = await pool.connect();
  try {
    console.log('??  Resetting public catalog tables...');
    await client.query('BEGIN');
    const schemaSqlPath = resolve(__dirname, '../schema/001_init.sql');
    const schemaSql = await readFile(schemaSqlPath, 'utf8');
    await client.query(schemaSql);
    await client.query('TRUNCATE public.submissions, public.questions, public.schemas RESTART IDENTITY CASCADE');

    const schemaIdMap = new Map<string, number>();

    for (const dataset of datasets) {
      console.log(`??  Loading dataset ${dataset.slug}`);
      await client.query(format('DROP SCHEMA IF EXISTS %I CASCADE', dataset.slug));
      await client.query(format('CREATE SCHEMA %I', dataset.slug));

      for (const table of dataset.tables) {
        const columnSql = table.columns
          .map((col) => `${format('%I', col.name)} ${col.definition}`)
          .join(',\n  ');
        const createSql = `CREATE TABLE ${format('%I.%I', dataset.slug, table.name)} (\n  ${columnSql}\n)`;
        await client.query(createSql);

        if (table.rows.length) {
          const columnNames = table.columns.map((col) => col.name);
          const values = table.rows.map((row) => columnNames.map((col) => (row[col] ?? null)));
          const columnPlaceholders = columnNames.map(() => '%I').join(', ');
          const insertSql = format(
            `INSERT INTO %I.%I (${columnPlaceholders}) VALUES %L`,
            dataset.slug,
            table.name,
            ...columnNames,
            values,
          );
          await client.query(insertSql);
        }
      }

      const metadata = {
        erDiagram: dataset.erDiagram,
        tables: dataset.tables.map((table) => ({
          name: table.name,
          description: table.description,
          columns: table.columns.map((col) => ({
            name: col.name,
            type: col.displayType,
            isPrimary: col.definition.toUpperCase().includes('PRIMARY KEY'),
          })),
          rowCount: table.rows.length,
          sampleRows: table.rows.slice(0, 3),
        })),
      };

      const { rows } = await client.query(
        'INSERT INTO public.schemas (slug, name, description, metadata) VALUES ($1, $2, $3, $4::jsonb) RETURNING id',
        [dataset.slug, dataset.name, dataset.description, JSON.stringify(metadata)],
      );
      schemaIdMap.set(dataset.slug, rows[0].id);
    }

    console.log('??  Inserting question bank...');
    for (const question of questionSeeds) {
      const schemaId = schemaIdMap.get(question.schemaSlug);
      if (!schemaId) {
        throw new Error(`Missing schema id for ${question.schemaSlug}`);
      }
      await client.query(
        `INSERT INTO public.questions (schema_id, difficulty, prompt, canonical_sql, tags, explanation_stub, optimality_notes)
         VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [
          schemaId,
          question.difficulty,
          question.prompt,
          question.canonicalSql,
          question.tags,
          question.explanationStub ?? null,
          question.optimalityNotes ?? null,
        ],
      );
    }

    await client.query('COMMIT');
    console.log('?  Database seeded successfully.');
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('?  Seed failed', err);
    process.exitCode = 1;
  } finally {
    client.release();
    await pool.end();
  }
}

run();
