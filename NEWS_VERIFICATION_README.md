# News Verification System

This document provides an overview of the new News Verification System implemented in the InvestSafe Shield application.

## Overview

The News Verification System allows users to verify the authenticity of news articles by checking them against multiple trusted sources. The system provides a confidence score and detailed analysis for each verification request.

## Features

- **Three Verification Statuses**:
  - ✅ **Verified**: News is confirmed by multiple trusted sources
  - ⚠️ **Partially Verified**: Some verification found, but needs cross-checking
  - ❌ **Unverified**: Unable to verify from trusted sources

- **Detailed Analysis**:
  - Source credibility assessment
  - Content analysis for clickbait and sensationalism
  - Confidence scoring
  - List of supporting sources

## Setup

1. **Backend Setup**:
   - Add your NewsAPI key to `.env`:
     ```
     NEWS_API_KEY=your_api_key_here
     ```
   - Install dependencies:
     ```bash
     cd backend
     npm install
     ```

2. **Frontend Setup**:
   - Install dependencies:
     ```bash
     cd frontend
     npm install
     ```

## API Endpoints

### Verify News
- **Endpoint**: `POST /api/news/verify`
- **Request Body**:
  ```json
  {
    "headline": "Your news headline here"
  }
  ```
- **Response**:
  ```json
  {
    "status": "verified | partially_verified | unverified",
    "confidence": 85,
    "sources": [
      {
        "name": "Source Name",
        "url": "https://source.url",
        "publishedAt": "2023-01-01T00:00:00Z",
        "isTrusted": true
      }
    ],
    "reasons": ["Reason 1", "Reason 2"]
  }
  ```

## Usage

1. Navigate to `/news-verification` in the application
2. Enter a news headline in the input field
3. Click "Verify" to check the authenticity
4. View the verification status, confidence score, and supporting sources

## Trusted Sources

The system checks against these trusted news sources by default:
- Reuters
- Associated Press
- Bloomberg
- CNBC
- Wall Street Journal
- Financial Times
- Forbes
- The New York Times
- The Guardian
- BBC
- The Economist

## Error Handling

- Invalid or missing API keys will result in verification failures
- Rate limiting is in place (100 requests per 15 minutes per IP)
- Detailed error messages are provided in the API response

## Dependencies

### Backend
- Node.js
- Express
- Axios
- dotenv

### Frontend
- React
- TypeScript
- Tailwind CSS
- Lucide Icons

## License

This project is licensed under the MIT License - see the LICENSE file for details.
