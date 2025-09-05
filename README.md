# SafeLens 🔍

SafeLens is an advanced news verification platform that helps users identify credible news sources and detect potential misinformation. Using AI-powered analysis and trusted source verification, SafeLens provides confidence scores and detailed analysis for news articles.

## 🌟 Features

- 🔍 AI-powered news verification - Advanced algorithms analyze news content for authenticity
- ✅ Trusted source validation - Cross-reference with reliable news sources
- 📊 Confidence scoring system** - Get numerical confidence scores for news reliability
- 🛡️ Protection against misinformation - Identify potentially false or misleading content
- 🚀 Fast and reliable analysis - Quick processing with detailed insights
- 🌐 Web-based platform - Accessible from any device with internet connection

## 🚀 Live Demo

The application is deployed and ready to use:
- Live Application: [https://safelens-izrh.onrender.com]
- API Endpoint: [https://safelensai.onrender.com]

## 🛠️ Technology Stack

### Frontend
- React - Modern JavaScript library for building user interfaces
- TypeScript - Type-safe JavaScript for better development experience
- Vite - Fast build tool and development server
- Tailwind CSS - Utility-first CSS framework for styling
- shadcn/ui - Beautiful and accessible UI components

### Backend
- Node.js- JavaScript runtime for server-side development
- Express.js - Web application framework
- AI Integration - Machine learning models for news verification
- Database - [Specify your database - MongoDB, PostgreSQL, etc.]

## 📦 Installation & Setup

### Prerequisites

- Node.js (v16 or higher)
- npm or yarn package manager
- Git

### Clone the Repository

```bash
git clone https://github.com/vishureddy24/safelens.git
cd safelens
```

### Backend Setup

1. Navigate to the backend directory:
```bash
cd backend
```

2. Install dependencies:
```bash
npm install
```

3. Create environment variables file:
```bash
cp .env.example .env
```

4. Configure your environment variables in `.env`:
```env
PORT=5000
DATABASE_URL=your_database_url
API_KEY=your_api_key
NODE_ENV=development
```

5. Start the backend server:
```bash
npm start
```

The backend will be running on `http://localhost:5000`

### Frontend Setup

1. Navigate to the frontend directory:
```bash
cd frontend
```

2. Install dependencies:
```bash
npm install
```

3. Create environment variables file:
```bash
cp .env.example .env
```

4. Configure your environment variables in `.env`:
```env
VITE_API_URL=http://localhost:5000/api
VITE_APP_NAME=SafeLens
```

5. Start the development server:
```bash
npm run dev
```

The frontend will be running on `http://localhost:5173`

## 🔧 Development Scripts

### Backend
```bash
npm start          # Start production server
npm run dev        # Start development server with hot reload
npm run build      # Build for production
npm test           # Run tests
npm run lint       # Run linting
```

### Frontend
```bash
npm run dev        # Start development server
npm run build      # Build for production
npm run preview    # Preview production build
npm run lint       # Run linting
npm test           # Run tests
```



## 🔑 Environment Variables

### Backend Environment Variables

Create a `.env` file in the backend directory with the following variables:

```env
# Server Configuration
PORT=5000
NODE_ENV=development

# Database
DATABASE_URL=your_database_connection_string

# API Keys
NEWS_API_KEY=your_news_api_key
AI_SERVICE_API_KEY=your_ai_service_key

# CORS
FRONTEND_URL=http://localhost:5173

# JWT
JWT_SECRET=your_jwt_secret_key
```

### Frontend Environment Variables

Create a `.env` file in the frontend directory with the following variables:

```env
# API Configuration
VITE_API_URL=http://localhost:5000/api
VITE_APP_NAME=SafeLens
VITE_APP_VERSION=1.0.0

# Feature Flags
VITE_ENABLE_ANALYTICS=false
VITE_ENABLE_DEBUG=false
```

## 🚀 Deployment

This project is deployed on Render with separate services for frontend and backend.

### Backend Deployment on Render

1. Connect your GitHub repository to Render
2. Create a new Web Service
3. Set the build command: `cd backend && npm install`
4. Set the start command: `cd backend && npm start`
5. Add environment variables in Render dashboard

### Frontend Deployment on Render

1. Create a new Static Site
2. Set the build command: `cd frontend && npm install && npm run build`
3. Set the publish directory: `frontend/dist`
4. Add environment variables in Render dashboard

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 API Documentation

### Base URL
```
Production: [Your Render Backend URL]
Development: http://localhost:5000/api
```

### Main Endpoints

#### Verify News Article
```http
POST /api/verify
Content-Type: application/json

{
  "url": "https://example-news-article.com",
  "text": "Optional: Article text content"
}
```

Response:
```json
{
  "success": true,
  "data": {
    "confidence_score": 0.85,
    "is_credible": true,
    "source_reliability": "high",
    "analysis": {
      "fact_check_results": [...],
      "source_verification": {...},
      "content_analysis": {...}
    }
  }
}
```

## 🧪 Testing

### Backend Testing
```bash
cd backend
npm test                 # Run all tests
npm run test:watch      # Run tests in watch mode
npm run test:coverage   # Run tests with coverage report
```

### Frontend Testing
```bash
cd frontend
npm test                 # Run all tests
npm run test:watch      # Run tests in watch mode
npm run test:coverage   # Run tests with coverage report
```

## 🐛 Troubleshooting

### Common Issues

1. Port already in use**: Change the port in your `.env` file
2. CORS errors: Ensure `FRONTEND_URL` is set correctly in backend `.env`
3. Module not found: Run `npm install` in the respective directory
4. Build failures: Clear cache with `npm run clean` and rebuild

### Getting Help

- Check the [Issues](https://github.com/vishureddy24/safelens/issues) section
- Create a new issue with detailed description
- Include error messages and system information


## 👥 Authors

- Pavani Reddy - [@pavani1210](https://github.com/pavani1210)
- Nalathatagari Viswa Vardhan Reddy - [@vishureddy24](https://github.com/vishureddy24)

## 🙏 Acknowledgments

- Thanks to all contributors who have helped improve this project
- Inspired by the need for reliable news verification in the digital age
- Built with modern web technologies and AI capabilities

## 📊 Project Status

- ✅ Core functionality implemented
- ✅ Frontend and backend deployed
- ✅ AI verification system active
- 🔄 Continuous improvements and feature additions

---

