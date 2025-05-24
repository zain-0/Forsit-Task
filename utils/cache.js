const NodeCache = require('node-cache');
const logger = require('../utils/logger');

class CacheService {
  constructor() {
    this.cache = new NodeCache({ stdTTL: 600 });
  }

  get(key) {
    return this.cache.get(key);
  }

  set(key, value, ttl) {
    return this.cache.set(key, value, ttl);
  }

  del(key) {
    return this.cache.del(key);
  }

  clear() {
    return this.cache.flushAll();
  }

  middleware(ttl = 300) {
    return (req, res, next) => {
      const key = `${req.method}:${req.originalUrl}`;
      const cached = this.get(key);
      
      if (cached) {
        return res.json(cached);
      }
      
      const originalJson = res.json;
      res.json = (data) => {
        if (res.statusCode === 200) {
          this.set(key, data, ttl);
        }
        return originalJson.call(res, data);
      };
      
      next();
    };
  }
}

module.exports = new CacheService();