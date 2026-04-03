import { Router, Request, Response } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import { db } from '../db.js';

const router = Router();

const COURSES = [
  'B.Tech/B.E. - Computer Science',
  'B.Tech/B.E. - Other Branch',
  'BCA', 'MCA',
  'BSc Computer Science',
  'BA / BCom / BSc (Other)',
  'MBA', 'MSc / MTech',
  'Working Professional',
  'Not Currently Studying',
  'Other',
] as const;

const SignupSchema = z.object({
  full_name: z.string().min(2).max(100).trim(),
  email:     z.string().email().max(150).toLowerCase(),
  contact:   z.string().regex(/^\+?[\d\s\-(). ]{7,20}$/, 'Invalid contact number').trim(),
  city:      z.string().min(2).max(80).trim(),
  course:    z.enum(COURSES),
  college:   z.string().max(150).trim().optional(),
  password:  z.string().min(8).max(72),
});

const LoginSchema = z.object({
  email:    z.string().email().toLowerCase(),
  password: z.string().min(1),
});

function jwtSecret(): string {
  const s = process.env.JWT_SECRET;
  if (!s) throw new Error('JWT_SECRET env var is not set');
  return s;
}

// ── POST /api/auth/signup ────────────────────────────────────────────────────
router.post('/signup', async (req: Request, res: Response) => {
  const parsed = SignupSchema.safeParse(req.body);
  if (!parsed.success) {
    const msg = parsed.error.errors[0]?.message ?? 'Invalid input';
    res.status(400).json({ error: msg });
    return;
  }

  const { full_name, email, contact, city, course, college, password } = parsed.data;

  try {
    const [existing] = await db.execute(
      'SELECT user_id FROM learnmycode.users WHERE email = ?', [email],
    );
    if ((existing as unknown[]).length > 0) {
      res.status(409).json({ error: 'An account with this email already exists.' });
      return;
    }

    const hash = await bcrypt.hash(password, 12);
    const [result] = await db.execute(
      `INSERT INTO learnmycode.users
         (full_name, email, contact, city, course, college, password_hash, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, NOW())`,
      [full_name, email, contact, city, course, college ?? null, hash],
    );

    const userId = (result as { insertId: number }).insertId;
    const token = jwt.sign(
      { user_id: userId, email, full_name },
      jwtSecret(),
      { expiresIn: '7d' },
    );

    res.status(201).json({ token, user: { user_id: userId, full_name, email } });
  } catch (err) {
    console.error('[auth/signup]', err);
    res.status(500).json({ error: 'Server error. Please try again.' });
  }
});

// ── POST /api/auth/login ─────────────────────────────────────────────────────
router.post('/login', async (req: Request, res: Response) => {
  const parsed = LoginSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: 'Invalid email or password.' });
    return;
  }

  const { email, password } = parsed.data;

  try {
    const [rows] = await db.execute(
      'SELECT user_id, full_name, email, password_hash FROM learnmycode.users WHERE email = ?',
      [email],
    );
    const users = rows as { user_id: number; full_name: string; email: string; password_hash: string }[];

    if (users.length === 0) {
      res.status(401).json({ error: 'No account found with this email.' });
      return;
    }

    const user = users[0];
    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) {
      res.status(401).json({ error: 'Incorrect password.' });
      return;
    }

    const token = jwt.sign(
      { user_id: user.user_id, email: user.email, full_name: user.full_name },
      jwtSecret(),
      { expiresIn: '7d' },
    );

    res.json({ token, user: { user_id: user.user_id, full_name: user.full_name, email: user.email } });
  } catch (err) {
    console.error('[auth/login]', err);
    res.status(500).json({ error: 'Server error. Please try again.' });
  }
});

// ── POST /api/auth/verify ────────────────────────────────────────────────────
router.post('/verify', (req: Request, res: Response) => {
  const auth = req.headers.authorization;
  if (!auth?.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Missing token' });
    return;
  }
  try {
    const payload = jwt.verify(auth.slice(7), jwtSecret());
    res.json({ valid: true, user: payload });
  } catch {
    res.status(401).json({ valid: false, error: 'Invalid or expired token' });
  }
});

export default router;
