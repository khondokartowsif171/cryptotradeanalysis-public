import { Router } from 'express';
import { getMongo } from '../db/mongo.js';

const router = Router();

router.get('/', async (req, res) => {
  try {
    const db = await getMongo();
    const news = await db.collection('news')
      .find({})
      .sort({ published_at: -1 })
      .limit(20)
      .toArray();
    res.json({ news });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to fetch news' });
  }
});

export default router;
