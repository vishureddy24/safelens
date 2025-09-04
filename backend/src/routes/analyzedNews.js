import { Router } from 'express';
const router = Router();

// Basic endpoint for analyzedNews
router.get('/', (req, res) => {
  res.json({
    message: 'This is a placeholder endpoint for ' + 'analyzedNews',
    status: 'active'
  });
});

export default router;
