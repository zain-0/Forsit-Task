const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const compression = require('compression');

// Import configuration and utilities
const config = require('./config');
const databaseManager = require('./utils/database');
const logger = require('./utils/logger');
const { requestLogger, securityHeaders, validateCommonParams } = require('./middleware/requestInterceptor');
const { basicLimiter, strictLimiter, analyticsLimiter } = require('./middleware/rateLimiting');

// Import routes
const productRoutes = require('./routes/products');
const salesRoutes = require('./routes/sales');
const inventoryRoutes = require('./routes/inventory');
const analyticsRoutes = require('./routes/analytics');
const healthRoutes = require('./routes/health');

const app = express();

// Validate configuration
try {
  config.validateRequired();
  logger.info('Configuration validated successfully');
} catch (error) {
  logger.error('Configuration validation failed', { error: error.message });
  process.exit(1);
}

// Security middleware
app.use(helmet(config.security.helmet));

// Rate limiting with different tiers
app.use(basicLimiter);

// Middleware
app.use(compression());
app.use(cors(config.security.cors));

// Custom middleware
app.use(requestLogger);
app.use(securityHeaders);
app.use(validateCommonParams);

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Database connection
databaseManager.connect();

// Routes with specific rate limiting
app.use('/health', healthRoutes);
app.use(`${config.api.prefix}/products`, strictLimiter, productRoutes);
app.use(`${config.api.prefix}/sales`, strictLimiter, salesRoutes);
app.use(`${config.api.prefix}/inventory`, strictLimiter, inventoryRoutes);
app.use(`${config.api.prefix}/analytics`, analyticsLimiter, analyticsRoutes);

// 404 handler
app.use((req, res, next) => {
  logger.warn('Route not found', {
    method: req.method,
    url: req.originalUrl,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    requestId: req.requestId
  });
  
  res.status(404).json({ 
    success: false,
    message: 'Route not found',
    path: req.originalUrl,
    timestamp: new Date().toISOString(),
    requestId: req.requestId
  });
});

// Enhanced global error handler
app.use((error, req, res, next) => {
  logger.error('Unhandled error', {
    error: {
      message: error.message,
      stack: error.stack,
      name: error.name
    },
    request: {
      method: req.method,
      url: req.originalUrl,
      headers: req.headers,
      body: req.body,
      query: req.query,
      params: req.params
    },
    requestId: req.requestId
  });
  
  if (error.name === 'ValidationError') {
    return res.status(400).json({
      success: false,
      message: 'Validation Error',
      errors: Object.values(error.errors).map(e => e.message),
      timestamp: new Date().toISOString(),
      requestId: req.requestId
    });
  }
  
  if (error.name === 'CastError') {
    return res.status(400).json({
      success: false,
      message: 'Invalid ID format',
      timestamp: new Date().toISOString(),
      requestId: req.requestId
    });
  }

  if (error.name === 'MongoError' || error.name === 'MongoServerError') {
    return res.status(500).json({
      success: false,
      message: 'Database error',
      timestamp: new Date().toISOString(),
      requestId: req.requestId
    });
  }
  
  res.status(error.statusCode || 500).json({ 
    success: false,
    message: error.isOperational ? error.message : 'Internal server error',
    timestamp: new Date().toISOString(),
    requestId: req.requestId,
    ...(config.isDevelopment && { 
      error: error.message,
      stack: error.stack 
    })
  });
});

// Graceful shutdown handling
const gracefulShutdown = (signal) => {
  logger.info(`Received ${signal}. Starting graceful shutdown...`);
  
  const server = app.listen(config.server.port, () => {
    logger.info('Server started', {
      port: config.server.port,
      environment: config.server.env,
      nodeVersion: process.version,
      pid: process.pid
    });
  });

  process.on(signal, () => {
    logger.info('Closing HTTP server...');
    server.close(() => {
      logger.info('HTTP server closed');
      process.exit(0);
    });
  });
};

// Handle shutdown signals
['SIGINT', 'SIGTERM'].forEach(signal => {
  process.on(signal, () => gracefulShutdown(signal));
});

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  logger.error('Uncaught Exception', { error: error.message, stack: error.stack });
  process.exit(1);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Rejection', { reason, promise });
  process.exit(1);
});

// Start server
const server = app.listen(config.server.port, () => {
  logger.info('Server started successfully', {
    port: config.server.port,
    environment: config.server.env,
    nodeVersion: process.version,
    pid: process.pid,
    apiVersion: config.api.version
  });
});

module.exports = app;
