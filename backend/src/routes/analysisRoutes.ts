import { Router } from 'express';
import { analyzeMessage } from '../services/analysisService';

const router = Router();

router.post('/analyze-message', async (req, res) => {
  try {
    const { text, user, chatId, username } = req.body;
    
    if (!text || !user) {
      return res.status(400).json({ 
        error: 'Missing required fields: text and user are required' 
      });
    }

    console.log(`🔍 Analyzing message from user ${user} (${username})`);
    
    // Process the message (you'll implement the actual analysis logic here)
    const analysisResult = await analyzeMessage({
      text,
      userId: user,
      chatId,
      username
    });

    res.json(analysisResult);
  } catch (error) {
    console.error('Error in message analysis:', error);
    res.status(500).json({ 
      error: 'An error occurred while analyzing the message' 
    });
  }
});

export default router;
