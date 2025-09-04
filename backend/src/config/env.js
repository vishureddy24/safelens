import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const env = process.env.NODE_ENV || 'development';

// Debug: Log loaded environment variables
console.log('Environment:', env);
console.log('HIVE_API_KEY exists:', !!process.env.HIVE_API_KEY);
console.log('NEWS_API_KEY exists:', !!process.env.NEWS_API_KEY);
console.log('OPENROUTER_API_KEY exists:', !!process.env.OPENROUTER_API_KEY);

const config = {
  env,
  port: process.env.PORT || 3001,
  frontendUrl: process.env.FRONTEND_URL || 'http://localhost:8080',
  
  // API Keys with fallbacks
  hiveApiKey: process.env.HIVE_API_KEY || 'demo_key',
  newsApiKey: process.env.NEWS_API_KEY || 'demo_key',
  openRouterApiKey: process.env.OPENROUTER_API_KEY || 'demo_key',
  telegramBotToken: process.env.TELEGRAM_BOT_TOKEN || 'demo_key',
  
  // Rate limiting
  rateLimit: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100 // limit each IP to 100 requests per windowMs
  },
  finnhubApiKey: process.env.FINNHUB_API_KEY || 'demo_key',
  
  // API Endpoints
  finnhubApiUrl: 'https://finnhub.io/api/v1',
  hiveApiUrl: 'https://api.thehive.ai',
  
  // Supabase
  supabase: {
    url: process.env.VITE_SUPABASE_URL,
    publicKey: process.env.VITE_SUPABASE_ANON_KEY,
    projectId: process.env.VITE_SUPABASE_URL?.split('//')[1]?.split('.')[0]
  },
  
  // Sightengine Configuration
  sightengine: {
    apiUser: process.env.SIGHTENGINE_API_USER,
    apiSecret: process.env.SIGHTENGINE_API_SECRET,
    apiUrl: 'https://api.sightengine.com/1.0/check.json'
  },
  
  // JWT Configuration
  jwtSecret: process.env.JWT_SECRET || 'your_jwt_secret_key_here',
  
  // Feature flags
  features: {
    hiveAi: !!process.env.HIVE_API_KEY && process.env.HIVE_API_KEY !== 'your_hive_api_key',
    newsApi: !!process.env.NEWS_API_KEY && process.env.NEWS_API_KEY !== 'your_news_api_key',
    openRouter: !!process.env.OPENROUTER_API_KEY && process.env.OPENROUTER_API_KEY !== 'your_openrouter_api_key',
    telegram: !!process.env.TELEGRAM_BOT_TOKEN && process.env.TELEGRAM_BOT_TOKEN !== 'your_telegram_bot_token',
    finnhub: !!process.env.FINNHUB_API_KEY && process.env.FINNHUB_API_KEY !== 'your_finnhub_api_key',
    sightengine: !!process.env.SIGHTENGINE_API_SECRET && process.env.SIGHTENGINE_API_SECRET !== 'your_sightengine_api_secret'
  },
  
  // Rate limiting
  rateLimit: {
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000', 10), // 15 minutes
    max: parseInt(process.env.RATE_LIMIT_MAX || '100', 10) // limit each IP to 100 requests per windowMs
  },
  
  // API Endpoints
  hiveApiUrl: 'https://api.thehive.ai/v2',
  newsApiUrl: 'https://newsapi.org/v2',
  finnhubApiUrl: 'https://finnhub.io/api/v1',
  
  // Validation
  validate() {
    const required = [
      'supabase.url',
      'supabase.publicKey'
    ];
    
    const recommended = [
      'hiveApiKey',
      'newsApiKey',
      'openRouterApiKey',
      'telegramBotToken',
      'finnhubApiKey'
    ];
    
    const checkVars = (vars, isRequired = false) => {
      const missing = [];
      
      vars.forEach(key => {
        const keys = key.split('.');
        let value = this;
        
        for (const k of keys) {
          value = value?.[k];
          if (value === undefined) break;
        }
        
        if (value === undefined || value === '' || value === 'demo_key' || value.includes('your_')) {
          missing.push(key);
        }
      });
      
      return missing;
    };
    
    const missingRequired = checkVars(required, true);
    const missingRecommended = checkVars(recommended);
    
    if (missingRequired.length > 0) {
      console.error('❌ Missing required environment variables:', missingRequired.join(', '));
      if (this.env === 'production') {
        process.exit(1);
      } else {
        console.warn('⚠️  Running in development mode with missing required variables. Some features may not work.');
      }
    }
    
    if (missingRecommended.length > 0) {
      console.warn('ℹ️  Missing recommended environment variables for features:', missingRecommended.join(', '));
      console.warn('   Some features may be limited or disabled.');
    }
    
    // Log enabled features
    const enabledFeatures = Object.entries(this.features)
      .filter(([_, enabled]) => enabled)
      .map(([feature]) => feature);
      
    if (enabledFeatures.length > 0) {
      console.log('✅ Enabled features:', enabledFeatures.join(', '));
    }
  }
};

// Validate required environment variables
config.validate();

export default config;
