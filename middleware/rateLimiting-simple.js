const rateLimit = require('express-rate-limit');
const logger = require('../utils/logger');

// Basic rate limiter for general API requests
const basicLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100,
  message: {
    success: false,
    message: 'Too many requests, please try again later.'
  },
  handler: (req, res) => {
    logger.warn('Rate limit exceeded', {
      ip: req.ip,
      endpoint: req.originalUrl
    });
    
    res.status(429).json({
      success: false,
      message: 'Too many requests, please try again later.'
    });
  }
});

// Stricter limiter for write operations
const strictLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 50,
  skip: (req) => {
    return !['POST', 'PUT', 'DELETE'].includes(req.method);
  },
  message: {
    success: false,
    message: 'Too many write requests, please try again later.'
  }
});

// Analytics endpoints limiter
const analyticsLimiter = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 minutes
  max: 200, // Higher limit for analytics
  message: {
    success: false,
    message: 'Too many analytics requests from this IP.'
  }
});

module.exports = {
  basicLimiter,
  strictLimiter,
  analyticsLimiter
};
