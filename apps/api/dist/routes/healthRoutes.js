import { Router } from 'express';
import { pool } from '../db/pool';
export const healthRouter = Router();
healthRouter.get('/', async (_req, res) => {
    try {
        await pool.query('SELECT 1');
        res.json({ status: 'ok' });
    }
    catch (err) {
        res.status(500).json({ status: 'error', error: err instanceof Error ? err.message : 'unknown' });
    }
});
