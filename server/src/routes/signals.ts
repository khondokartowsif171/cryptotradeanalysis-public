import { Router } from 'express';
import { getMongo } from '../db/mongo.js';

const router = Router();

router.get('/', async (req, res) => {
  try {
    const db = await getMongo();
    const signals = await db.collection('signals')
      .find({})
      .sort({ generated_at: -1 })
      .limit(20)
      .toArray();
    res.json({ signals });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to fetch signals' });
  }
});

export default router;
