import { Router } from 'express';
const router = Router();

// Basic endpoint for news
router.get('/', (req, res) => {
  res.json({
    message: 'This is a placeholder endpoint for ' + 'news',
    status: 'active'
  });
});

export default router;
