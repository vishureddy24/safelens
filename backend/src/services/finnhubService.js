import axios from 'axios';
import config from '../config/env.js';

class FinnhubService {
  constructor() {
    if (!config.features.finnhub) {
      throw new Error('Finnhub is not properly configured. Please check your environment variables.');
    }
    
    this.client = axios.create({
      baseURL: config.finnhubApiUrl,
      params: {
        token: config.finnhubApiKey
      }
    });
  }

  /**
   * Get stock quote for a symbol
   * @param {string} symbol - Stock symbol (e.g., 'AAPL')
   * @returns {Promise<Object>} - Stock quote data
   */
  async getStockQuote(symbol) {
    try {
      const response = await this.client.get('/quote', {
        params: { symbol }
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching stock quote:', error);
      throw new Error(`Failed to fetch stock quote for ${symbol}`);
    }
  }

  /**
   * Get company profile for a symbol
   * @param {string} symbol - Stock symbol (e.g., 'AAPL')
   * @returns {Promise<Object>} - Company profile data
   */
  async getCompanyProfile(symbol) {
    try {
      const response = await this.client.get('/stock/profile2', {
        params: { symbol }
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching company profile:', error);
      throw new Error(`Failed to fetch company profile for ${symbol}`);
    }
  }

  /**
   * Get company news
   * @param {string} symbol - Stock symbol (e.g., 'AAPL')
   * @param {string} from - Start date (YYYY-MM-DD)
   * @param {string} to - End date (YYYY-MM-DD)
   * @returns {Promise<Array>} - List of news articles
   */
  async getCompanyNews(symbol, from, to) {
    try {
      const response = await this.client.get('/company-news', {
        params: { symbol, from, to }
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching company news:', error);
      throw new Error(`Failed to fetch news for ${symbol}`);
    }
  }

  /**
   * Get stock candlestick data
   * @param {string} symbol - Stock symbol (e.g., 'AAPL')
   * @param {string} resolution - Resolution of data (1, 5, 15, 30, 60, D, W, M)
   * @param {number} from - Unix timestamp (seconds since epoch)
   * @param {number} to - Unix timestamp (seconds since epoch)
   * @returns {Promise<Object>} - Candlestick data
   */
  async getStockCandles(symbol, resolution, from, to) {
    try {
      const response = await this.client.get('/stock/candle', {
        params: { symbol, resolution, from, to }
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching stock candles:', error);
      throw new Error(`Failed to fetch candlestick data for ${symbol}`);
    }
  }

  /**
   * Search for stocks, ETFs, or mutual funds
   * @param {string} query - Search query
   * @returns {Promise<Array>} - List of matching symbols
   */
  async searchSymbols(query) {
    try {
      const response = await this.client.get('/search', {
        params: { q: query }
      });
      return response.data.result || [];
    } catch (error) {
      console.error('Error searching symbols:', error);
      throw new Error('Failed to search for symbols');
    }
  }
}

// Export a singleton instance
export default new FinnhubService();
