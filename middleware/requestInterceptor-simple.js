const logger = require('../utils/logger');

const requestLogger = (req, res, next) => {
  const start = Date.now();
  const requestId = Math.random().toString(36).substr(2, 9);
  
  req.requestId = requestId;
  
  logger.info('Request received', {
    requestId,
    method: req.method,
    url: req.originalUrl,
    ip: req.ip
  });

  const originalJson = res.json;
  res.json = function(obj) {
    const duration = Date.now() - start;
    
    logger.info('Response sent', {
      requestId,
      statusCode: res.statusCode,
      duration: `${duration}ms`
    });
    
    return originalJson.call(this, obj);
  };

  next();
};

const securityHeaders = (req, res, next) => {
  res.setHeader('X-Request-ID', req.requestId);
  res.setHeader('X-Response-Time', Date.now());
  next();
};

const validateCommonParams = (req, res, next) => {
  if (req.query.page) {
    const page = parseInt(req.query.page);
    if (isNaN(page) || page < 1) {
      req.query.page = 1;
    }
  }

  if (req.query.limit) {
    const limit = parseInt(req.query.limit);
    if (isNaN(limit) || limit < 1 || limit > 100) {
      req.query.limit = 10;
    }
  }

  next();
};

module.exports = {
  requestLogger,
  securityHeaders,
  validateCommonParams
};
