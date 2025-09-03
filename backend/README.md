# InvestSafe Shield - Backend

Backend service for InvestSafe Shield, providing AI-powered media analysis and fraud detection capabilities.

## Features

- Deepfake detection using Hive AI
- News article verification
- Real-time alerts via Telegram
- Stock market data integration
- Secure API endpoints
- Rate limiting and CORS protection

## Environment Variables

Create a `.env` file in the root directory with the following variables:

```
# Server Configuration
PORT=3001
NODE_ENV=development

# CORS Configuration
FRONTEND_URL=http://localhost:8080

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000  # 15 minutes
RATE_LIMIT_MAX=100  # limit each IP to 100 requests per windowMs

# API Keys
HIVE_API_KEY=your_hive_api_key
NEWS_API_KEY=your_news_api_key
OPENROUTER_API_KEY=your_openrouter_api_key
TELEGRAM_BOT_TOKEN=your_telegram_bot_token
FINNHUB_API_KEY=your_finnhub_api_key
SIGHTENGINE_API_USER=your_sightengine_user_id
SIGHTENGINE_API_SECRET=your_sightengine_api_secret

# Supabase Configuration
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_PUBLIC_KEY=your_supabase_public_key
VITE_SUPABASE_PROJECT_ID=your_supabase_project_id
```

## Installation

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```
3. Set up environment variables (see above)
4. Start the development server:
   ```bash
   npm run dev
   ```

## API Endpoints

### Media Analysis

`POST /api/analyze/media`

Analyze media for potential deepfake content.

**Request Body:**
```json
{
  "file": "base64_encoded_file",
  "fileName": "example.jpg"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "analysis": {
      "status": "success",
      "request_id": "...",
      "output": [
        {
          "time": 0,
          "detections": [
            {
              "bounding_box": {
                "x1": 0.1,
                "y1": 0.2,
                "x2": 0.9,
                "y2": 0.8
              },
              "confidence": 0.95,
              "class": "deepfake"
            }
          ]
        }
      ]
    }
  }
}
```

### Deepfake Detection

`POST /api/analysis/deepfake`

Check if an image is a deepfake using Sightengine.

**Request Body:**
```json
{
  "imageUrl": "https://example.com/image.jpg"
}
```

**Response:**
```json
{
  "isDeepfake": true,
  "analysis": {
    "faces": [
      {
        "attributes": {
          "synthetic": 0.85,
          "liveness": 0.2
        },
        "quality": {
          "score": 0.4
        }
      }
    ]
  }
}
```

### NSFW Content Detection

`POST /api/analysis/nsfw`

Check if an image contains NSFW content.

**Request Body:**
```json
{
  "imageUrl": "https://example.com/image.jpg"
}
```

**Response:**
```json
{
  "isNsfw": true,
  "analysis": {
    "nudity": {
      "erotica": 0.7,
      "nonNude": {
        "porn": 0.1
      },
      "sexualActivity": 0.8,
      "sexualDisplay": 0.6
    }
  }
}
```

### Stock Market Data

#### Get Stock Quote
`GET /api/analysis/stocks/quote/:symbol`

Get current stock quote for a symbol.

**Response:**
```json
{
  "c": 150.25,
  "d": 1.5,
  "dp": 1.01,
  "h": 151.3,
  "l": 148.9,
  "o": 149.5,
  "pc": 148.75,
  "t": 1617321600
}
```

#### Get Company Profile
`GET /api/analysis/stocks/company/:symbol`

Get company profile information.

**Response:**
```json
{
  "country": "US",
  "currency": "USD",
  "exchange": "NASDAQ",
  "finnhubIndustry": "Technology",
  "ipo": "1980-12-12",
  "logo": "https://logo.clearbit.com/apple.com",
  "marketCapitalization": 2500000000000,
  "name": "Apple Inc",
  "phone": "14089961010",
  "shareOutstanding": 16788.1,
  "ticker": "AAPL",
  "weburl": "https://www.apple.com/"
}
```

#### Search Stocks
`GET /api/analysis/stocks/search?q=:query`

Search for stocks, ETFs, or mutual funds.

**Response:**
```json
[
  {
    "description": "APPLE INC",
    "displaySymbol": "AAPL",
    "symbol": "AAPL",
    "type": "Common Stock"
  }
]
```

## Development

- Use `npm run dev` for development with hot-reload
- Use `npm start` for production
- Use `npm test` to run tests

## Security

- All API routes are rate limited
- CORS is enabled for the frontend URL only
- Sensitive environment variables are not exposed
- Input validation is performed on all endpoints

## License

Proprietary - All rights reserved
