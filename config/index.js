const path = require('path');
require('dotenv').config();

/**
 * Configuration management
 */
class Config {
  constructor() {
    this.env = process.env.NODE_ENV || 'development';
    this.isDevelopment = this.env === 'development';
    this.isProduction = this.env === 'production';
    this.isTest = this.env === 'test';
  }

  // Server Configuration
  get server() {
    return {
      port: parseInt(process.env.PORT) || 3000,
      host: process.env.HOST || 'localhost',
      env: this.env
    };
  }

  // Database Configuration
  get database() {
    return {
      uri: process.env.MONGODB_URI || 'mongodb://localhost:27017/ecommerce-admin',
      options: {
        maxPoolSize: parseInt(process.env.DB_MAX_POOL_SIZE) || 10,
        serverSelectionTimeoutMS: parseInt(process.env.DB_SERVER_SELECTION_TIMEOUT) || 5000,
        socketTimeoutMS: parseInt(process.env.DB_SOCKET_TIMEOUT) || 45000,
        maxIdleTimeMS: parseInt(process.env.DB_MAX_IDLE_TIME) || 30000,
      }
    };
  }

  // API Configuration
  get api() {
    return {
      version: process.env.API_VERSION || 'v1',
      prefix: `/api/${process.env.API_VERSION || 'v1'}`,
      requestTimeout: parseInt(process.env.API_REQUEST_TIMEOUT) || 30000
    };
  }

  // Rate Limiting Configuration
  get rateLimit() {
    return {
      windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000,
      maxRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100,
      strictMaxRequests: parseInt(process.env.STRICT_RATE_LIMIT_MAX_REQUESTS) || 50,
      analyticsMaxRequests: parseInt(process.env.ANALYTICS_RATE_LIMIT_MAX_REQUESTS) || 200
    };
  }

  // Logging Configuration
  get logging() {
    return {
      level: process.env.LOG_LEVEL || (this.isDevelopment ? 'debug' : 'info'),
      dir: process.env.LOG_DIR || path.join(__dirname, '..', 'logs'),
      maxSize: process.env.LOG_MAX_SIZE || '5MB',
      maxFiles: parseInt(process.env.LOG_MAX_FILES) || 5,
      enableConsole: process.env.LOG_ENABLE_CONSOLE !== 'false'
    };
  }

  // Cache Configuration
  get cache() {
    return {
      defaultTtl: parseInt(process.env.CACHE_DEFAULT_TTL) || 600, // 10 minutes
      quickTtl: parseInt(process.env.CACHE_QUICK_TTL) || 300, // 5 minutes
      longTtl: parseInt(process.env.CACHE_LONG_TTL) || 3600, // 1 hour
      checkPeriod: parseInt(process.env.CACHE_CHECK_PERIOD) || 120 // 2 minutes
    };
  }

  // Security Configuration
  get security() {
    return {
      helmet: {
        contentSecurityPolicy: this.isDevelopment ? false : {
          directives: {
            defaultSrc: ["'self'"],
            styleSrc: ["'self'", "'unsafe-inline'", "https:"],
            scriptSrc: ["'self'"],
            imgSrc: ["'self'", "data:", "https:"],
          }
        },
        crossOriginEmbedderPolicy: !this.isDevelopment
      },
      cors: {
        origin: process.env.CORS_ORIGIN || (this.isDevelopment ? true : false),
        credentials: process.env.CORS_CREDENTIALS === 'true',
        methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
        allowedHeaders: ['Content-Type', 'Authorization', 'X-API-Key']
      }
    };
  }

  // Pagination Configuration
  get pagination() {
    return {
      defaultLimit: parseInt(process.env.PAGINATION_DEFAULT_LIMIT) || 10,
      maxLimit: parseInt(process.env.PAGINATION_MAX_LIMIT) || 100,
      defaultSort: process.env.PAGINATION_DEFAULT_SORT || '-createdAt'
    };
  }

  // Validation Configuration
  get validation() {
    return {
      stripUnknown: process.env.VALIDATION_STRIP_UNKNOWN !== 'false',
      abortEarly: process.env.VALIDATION_ABORT_EARLY === 'true',
      allowUnknown: process.env.VALIDATION_ALLOW_UNKNOWN === 'true'
    };
  }

  // Feature Flags
  get features() {
    return {
      enableAnalytics: process.env.FEATURE_ANALYTICS !== 'false',
      enableCaching: process.env.FEATURE_CACHING !== 'false',
      enableDetailedHealthCheck: process.env.FEATURE_DETAILED_HEALTH !== 'false',
      enableRequestLogging: process.env.FEATURE_REQUEST_LOGGING !== 'false',
      enableMetrics: process.env.FEATURE_METRICS === 'true'
    };
  }

  // Get all configuration
  getAll() {
    return {
      server: this.server,
      database: this.database,
      api: this.api,
      rateLimit: this.rateLimit,
      logging: this.logging,
      cache: this.cache,
      security: this.security,
      pagination: this.pagination,
      validation: this.validation,
      features: this.features
    };
  }

  // Validate required environment variables
  validateRequired() {
    const required = ['MONGODB_URI'];
    const missing = required.filter(key => !process.env[key]);
    
    if (missing.length > 0) {
      throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
    }
  }
}

module.exports = new Config();
