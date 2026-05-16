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
    res.json({ signals: signals || [] });
  } catch (err: any) {
    res.json({ signals: [], _note: 'MongoDB unavailable', error: err.message });
  }
});

export default router;
