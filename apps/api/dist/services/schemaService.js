import { schemaMetaSchema } from '@sqlcat/types';
import { withDbClient } from '../db/pool';
import { z } from 'zod';
const schemaRow = z.object({
    id: z.number(),
    slug: z.string(),
    name: z.string(),
    description: z.string(),
    metadata: z.any().optional(),
});
export async function listSchemas() {
    return withDbClient(async (client) => {
        const result = await client.query('SELECT id, slug, name, description FROM public.schemas ORDER BY id ASC');
        return result.rows.map((row) => schemaRow.parse({ ...row }));
    });
}
export async function getSchemaMetadata(schemaId) {
    return withDbClient(async (client) => {
        const result = await client.query('SELECT metadata, id, slug, name, description FROM public.schemas WHERE id = $1', [schemaId]);
        if (!result.rowCount) {
            throw new Error('Schema not found');
        }
        const row = result.rows[0];
        if (row.metadata) {
            return schemaMetaSchema.parse({ ...row.metadata, id: row.id, name: row.name, description: row.description, slug: row.slug });
        }
        const tablesRes = await client.query('SELECT table_name FROM information_schema.tables WHERE table_schema = $1 ORDER BY table_name', [row.slug]);
        const tables = [];
        for (const table of tablesRes.rows) {
            const columnsRes = await client.query('SELECT column_name, data_type FROM information_schema.columns WHERE table_schema = $1 AND table_name = $2 ORDER BY ordinal_position', [row.slug, table.table_name]);
            tables.push({
                name: table.table_name,
                columns: columnsRes.rows.map((col) => ({ name: col.column_name, type: col.data_type })),
            });
        }
        return schemaMetaSchema.parse({
            id: row.id,
            slug: row.slug,
            name: row.name,
            description: row.description,
            tables,
        });
    });
}
