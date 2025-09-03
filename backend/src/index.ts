const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const config = require('./config/env');
const hiveService = require('./services/hiveService');
const analysisRoutes = require('./routes/analysis.js');
const analyzedNewsRoutes = require('./routes/analyzedNews.js');
const newsRoutes = require('./routes/news.js');
const newsVerificationRoutes = require('./routes/newsVerificationRoutes.js');
require('./services/telegramBot'); // Initialize Telegram bot
const { createServer } = require('http');
const { Server } = require('socket.io');

// Initialize Express app
const app = express();
const server = createServer(app);

// Initialize Socket.IO
const io = new Server(server, {
  cors: {
    origin: config.frontendUrl,
    methods: ['GET', 'POST']
  }
});

// Socket.IO connection handler
io.on('connection', (socket) => {
  console.log('Client connected:', socket.id);
  
  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
  });
});

// Middleware
app.use(helmet());

// CORS configuration
const corsOptions = {
  origin: function (origin, callback) {
    const allowedOrigins = [
      'http://localhost:8080',
      'http://localhost:8081',
      'http://localhost:8082',
      'http://localhost:5173',
      'http://127.0.0.1:8080',
      'http://127.0.0.1:8081',
      'http://127.0.0.1:8082',
      'http://127.0.0.1:5173',
      config.frontendUrl
    ];
    
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.indexOf(origin) === -1) {
      const msg = `CORS policy blocks this request: ${origin}`;
      console.warn(msg);
      return callback(new Error(msg), false);
    }
    
    return callback(null, true);
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: [
    'Content-Type',
    'Authorization',
    'x-socket-id',
    'X-Requested-With',
    'Accept',
    'Origin'
  ],
  exposedHeaders: ['Content-Length', 'X-Foo', 'X-Bar'],
  maxAge: 86400 // 24 hours
};

app.use(cors(corsOptions));
app.options('*', cors(corsOptions)); // Enable preflight for all routes

// Body parsers
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Logging
app.use(morgan('dev'));

// Rate limiting
const apiLimiter = rateLimit({
  windowMs: config.rateLimit.windowMs,
  max: config.rateLimit.max,
  message: { error: 'Too many requests, please try again later.' }
});

// Apply rate limiting to all API routes
app.use('/api', apiLimiter);

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Expose /tmp directory for static file serving (for Sightengine image analysis)
const path = require('path');
const tmpDir = path.join(path.resolve(), 'tmp');
app.use('/tmp', express.static(tmpDir));

// API Routes
app.use('/api/analysis', analysisRoutes);
app.use('/api/analyzed-news', analyzedNewsRoutes);
app.use('/api/news', newsRoutes);
app.use('/api/news-verification', newsVerificationRoutes); // Add the new news verification routes

// Media analysis endpoint
app.post('/api/analyze/media', async (req, res) => {
  try {
    const { file, fileName } = req.body;
    
    if (!file || !fileName) {
      return res.status(400).json({ 
        error: 'File and fileName are required' 
      });
    }
    
    // Convert base64 to buffer
    let fileBuffer;
    try {
      // Handle both data URLs and raw base64
      const base64Data = file.includes('base64,') 
        ? file.split('base64,')[1] 
        : file;
      
      fileBuffer = Buffer.from(base64Data, 'base64');
      
      if (!fileBuffer || fileBuffer.length === 0) {
        throw new Error('Invalid file data');
      }
    } catch (error) {
      console.error('File processing error:', error);
      return res.status(400).json({
        error: 'Invalid file format. Please upload a valid file.'
      });
    }
    
    // Emit progress updates via socket
    const socketId = req.headers['x-socket-id'];
    const emitProgress = (progress) => {
      if (socketId && io) {
        io.to(socketId).emit('analysis-progress', { progress });
      }
    };
    
    try {
      // Start analysis
      emitProgress(10);
      const result = await hiveService.analyzeMedia(fileBuffer, fileName);
      emitProgress(100);
      
      res.json({
        success: true,
        data: result
      });
    } catch (error) {
      console.error('Analysis error:', error);
      emitProgress(-1); // Indicate error
      throw error; // Let the outer catch handle it
    }
    
  } catch (error) {
    console.error('API Error:', error);
    res.status(500).json({
      error: error.message || 'Failed to process media',
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

// Start server
const PORT = config.port;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Environment: ${config.env}`);
  console.log(`CORS enabled for: ${config.frontendUrl}`);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
  console.error('Unhandled Rejection:', err);
  // Close server & exit process
  server.close(() => process.exit(1));
});

export { app, server };
