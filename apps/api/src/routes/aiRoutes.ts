import { Router } from 'express';
import { getGuidanceById } from '../services/aiCoachService';

export const aiRouter = Router();

aiRouter.get('/guidance/:id', (req, res) => {
  const guidance = getGuidanceById(req.params.id);
  if (!guidance) {
    return res.status(404).json({ error: 'Guidance not found' });
  }
  res.json(guidance);
});
