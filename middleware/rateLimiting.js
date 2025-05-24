const rateLimit = require('express-rate-limit');

const basicLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: 'Too many requests, try again later'
});

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