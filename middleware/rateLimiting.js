const rateLimit = require('express-rate-limit');

// TODO: make these configurable
const basicLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: 'Too many requests, try again later'
});

// for write methods (POST, PUT, DELETE)
const strictLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 50,
  skip: (req) => !['POST', 'PUT', 'DELETE'].includes(req.method),
  message: 'Too many requests'
});

module.exports = {
  basicLimiter,
  strictLimiter
};