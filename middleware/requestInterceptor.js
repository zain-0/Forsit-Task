const requestLogger = (req, res, next) => {
  const start = Date.now();
  req.requestId = Math.random().toString(36).substr(2, 9);
  
  console.log(`${req.method} ${req.originalUrl}`);

  const originalJson = res.json;
  res.json = function(obj) {
    const duration = Date.now() - start;
    console.log(`Response ${res.statusCode} - ${duration}ms`);
    return originalJson.call(this, obj);
  };

  next();
};

module.exports = { requestLogger };