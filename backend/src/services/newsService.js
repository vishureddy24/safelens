import axios from 'axios';
import config from '../config/env.js';

const NEWS_API_URL = 'https://newsapi.org/v2';

/**
 * Fetches news articles from News API
 * @param {Object} options - Query options
 * @param {string} [options.query] - Search keywords
 * @param {string} [options.category] - News category (business, entertainment, general, health, science, sports, technology)
 * @param {string} [options.language] - Language code (e.g., 'en')
 * @param {number} [options.pageSize=10] - Number of results to return (1-100)
 * @returns {Promise<Array>} - Array of news articles
 */
async function fetchNews({
  query = 'stocks OR market OR economy',
  category = 'business',
  language = 'en',
  pageSize = 5,
} = {}) {
  try {
    console.log('Fetching news with params:', { query, category, language, pageSize });
    
    // Calculate date for last 30 days
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const fromDate = thirtyDaysAgo.toISOString().split('T')[0];
    
    const params = {
      apiKey: config.newsApiKey,
      q: query,
      language,
      pageSize,
      sortBy: 'publishedAt',
      from: fromDate,
      // Remove category as it's not supported in /everything endpoint
    };
    
    console.log('News API request params:', JSON.stringify(params, null, 2));
    
    // Use /everything endpoint instead of /top-headlines
    const response = await axios.get(`${NEWS_API_URL}/everything`, {
      params,
      timeout: 10000,
      headers: {
        'User-Agent': 'InvestSafeShield/1.0',
      },
    });
    
    console.log('News API response status:', response.status);
    console.log('News API response data:', JSON.stringify(response.data, null, 2));
    
    if (!response.data.articles || !Array.isArray(response.data.articles)) {
      console.error('Unexpected response format from News API:', response.data);
      return [];
    }

    return response.data.articles.map(article => ({
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      headline: article.title || 'No title',
      source: article.source?.name || 'Unknown source',
      description: article.description || '',
      content: article.content || '',
      url: article.url || '#',
      imageUrl: article.urlToImage || '',
      publishedAt: article.publishedAt || new Date().toISOString(),
      author: article.author || 'Unknown author',
      classification: 'UNVERIFIED',
      reasons: [],
    }));
  } catch (error) {
    console.error('Error fetching news:');
    if (error.response) {
      // The request was made and the server responded with a status code
      // that falls out of the range of 2xx
      console.error('Response data:', error.response.data);
      console.error('Response status:', error.response.status);
      console.error('Response headers:', error.response.headers);
    } else if (error.request) {
      // The request was made but no response was received
      console.error('No response received:', error.request);
    } else {
      // Something happened in setting up the request that triggered an Error
      console.error('Error message:', error.message);
    }
    console.error('Error config:', error.config);
    throw new Error(`Failed to fetch news articles: ${error.message}`);
  }
}

export default {
  fetchNews,
};
