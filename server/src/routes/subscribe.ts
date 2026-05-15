import { Router } from 'express';
import { z } from 'zod';
import { query } from '../db/pool.js';

const router = Router();

const subscribeSchema = z.object({
  email: z.string().email(),
});

router.post('/', async (req, res) => {
  try {
    const { email } = subscribeSchema.parse(req.body);
    await query(
      'INSERT INTO subscribers (email) VALUES ($1) ON CONFLICT (email) DO NOTHING',
      [email]
    );
    res.json({ success: true, message: 'Subscribed successfully' });
  } catch (err: any) {
    if (err instanceof z.ZodError) {
      res.status(400).json({ error: 'Invalid email address' });
      return;
    }
    res.status(500).json({ error: 'Subscription failed' });
  }
});

export default router;
