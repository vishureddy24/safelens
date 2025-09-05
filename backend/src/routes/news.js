import { Router } from 'express';
import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();
const router = Router();

// News API configuration
const NEWS_API_KEY = process.env.NEWS_API_KEY;
const NEWS_API_URL = 'https://newsapi.org/v2/top-headlines';

// Basic endpoint for news with pagination
router.get('/', async (req, res) => {
  try {
    const { pageSize = 20, page = 1, q } = req.query;
    
    // If we have a NEWS_API_KEY, fetch from NewsAPI
    if (NEWS_API_KEY) {
      const params = {
        apiKey: NEWS_API_KEY,
        pageSize: Math.min(parseInt(pageSize), 100), // Max 100 articles per request
        page: parseInt(page),
        language: 'en',
        ...(q && { q }) // Add search query if provided
      };
      
      const response = await axios.get(NEWS_API_URL, { params });
      return res.json({
        status: 'success',
        totalResults: response.data.totalResults,
        articles: response.data.articles
      });
    }
    
    // Fallback response if no News API key is configured
    res.json({
      status: 'success',
      message: 'News API is not configured',
      totalResults: 0,
      articles: []
    });
    
  } catch (error) {
    console.error('Error fetching news:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch news',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

export default router;
