import express from 'express';
import newsVerificationService from '../services/newsVerificationService.js';

const router = express.Router();

// Basic endpoint for newsVerificationRoutes
router.get('/', (req, res) => {
  res.json({
    message: 'News Verification API is running',
    status: 'active',
    endpoints: ['POST / - Verify a news headline']
  });
});

// Verify a news headline
router.post('/', async (req, res) => {
  try {
    const { headline, content } = req.body;
    
    if (!headline) {
      return res.status(400).json({
        success: false,
        error: 'Headline is required'
      });
    }

    const verificationResult = await newsVerificationService.verifyNews(headline, content || '');
    
    res.json({
      success: true,
      data: verificationResult
    });
  } catch (error) {
    console.error('Error in news verification:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to verify news',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

export default router;
