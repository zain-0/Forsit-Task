const NodeCache = require('node-cache');
const logger = require('../utils/logger');

class CacheService {
  constructor() {
    this.defaultCache = new NodeCache({ stdTTL: 600, checkperiod: 120 });
    this.quickCache = new NodeCache({ stdTTL: 300, checkperiod: 60 });
    this.longCache = new NodeCache({ stdTTL: 3600, checkperiod: 300 });
  }

  getCache(type = 'default') {
    switch (type) {
      case 'quick': return this.quickCache;
      case 'long': return this.longCache;
      default: return this.defaultCache;
    }
  }

  get(key, cacheType = 'default') {
    try {
      const cache = this.getCache(cacheType);
      return cache.get(key);
    } catch (error) {
      logger.error('Cache get error', { key, cacheType, error: error.message });
      return undefined;
    }
  }

  set(key, value, ttl, cacheType = 'default') {
    try {
      const cache = this.getCache(cacheType);
      return cache.set(key, value, ttl);
    } catch (error) {
      logger.error('Cache set error', { key, cacheType, error: error.message });
      return false;
    }
  }

  del(key, cacheType = 'default') {
    try {
      const cache = this.getCache(cacheType);
      return cache.del(key);
    } catch (error) {
      logger.error('Cache delete error', { key, cacheType, error: error.message });
      return 0;
    }
  }

  clearPattern(pattern, cacheType = 'default') {
    const cache = this.getCache(cacheType);
    const keys = cache.keys();
    const matchingKeys = keys.filter(key => key.includes(pattern));
    
    matchingKeys.forEach(key => cache.del(key));
    return matchingKeys.length;
  }

  getStats(cacheType = 'default') {
    const cache = this.getCache(cacheType);
    return cache.getStats();
  }

  middleware(ttl = 300, cacheType = 'default') {
    return (req, res, next) => {
      const key = this.generateCacheKey(req);
      const cachedData = this.get(key, cacheType);
      
      if (cachedData) {
        return res.json(cachedData);
      }
      
      const originalJson = res.json;
      res.json = (data) => {
        if (res.statusCode === 200 && data.success) {
          this.set(key, data, ttl, cacheType);
        }
        return originalJson.call(res, data);
      };
      
      next();
    };
  }

  generateCacheKey(req) {
    const { method, originalUrl, query } = req;
    const keyParts = [method, originalUrl];
    
    if (method === 'GET' && Object.keys(query).length > 0) {
      keyParts.push(JSON.stringify(query));
    }
    
    return keyParts.join(':');
  }
}

module.exports = new CacheService();
