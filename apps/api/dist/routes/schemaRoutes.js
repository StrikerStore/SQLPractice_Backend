import { Router } from 'express';
import { getSchemaMetadata, listSchemas } from '../services/schemaService';
export const schemaRouter = Router();
schemaRouter.get('/', async (_req, res, next) => {
    try {
        const schemas = await listSchemas();
        res.json(schemas);
    }
    catch (err) {
        next(err);
    }
});
schemaRouter.get('/:id', async (req, res, next) => {
    try {
        const id = Number(req.params.id);
        if (Number.isNaN(id)) {
            return res.status(400).json({ error: 'Schema id must be numeric' });
        }
        const schema = await getSchemaMetadata(id);
        res.json(schema);
    }
    catch (err) {
        next(err);
    }
});
