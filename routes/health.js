const express = require('express');
const router = express.Router();
const databaseManager = require('../utils/database');
const Package = require('../package.json');
const os = require('os');

/**
 * @route GET /health
 * @desc Basic health check
 */
router.get('/', async (req, res) => {
  const healthCheck = {
    status: 'OK',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
    version: Package.version,
    uptime: process.uptime(),
    requestId: req.requestId
  };

  res.status(200).json(healthCheck);
});

/**
 * @route GET /health/detailed
 * @desc Detailed health check with system and database status
 */
router.get('/detailed', async (req, res) => {
  try {
    const dbHealth = databaseManager.getHealthStatus();
    const dbStats = await databaseManager.getStats();
    
    const healthCheck = {
      status: dbHealth.status === 'connected' ? 'OK' : 'DEGRADED',
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV,
      version: Package.version,
      system: {
        uptime: process.uptime(),
        memory: {
          used: process.memoryUsage(),
          free: os.freemem(),
          total: os.totalmem()
        },
        cpu: {
          count: os.cpus().length,
          platform: os.platform(),
          arch: os.arch()
        },
        load: os.loadavg()
      },
      database: {
        ...dbHealth,
        stats: dbStats
      },
      api: {
        rateLimit: {
          windowMs: process.env.RATE_LIMIT_WINDOW_MS || '900000',
          maxRequests: process.env.RATE_LIMIT_MAX_REQUESTS || '100'
        }
      }
    };

    const statusCode = healthCheck.status === 'OK' ? 200 : 503;
    res.status(statusCode).json(healthCheck);
    
  } catch (error) {
    res.status(503).json({
      status: 'ERROR',
      timestamp: new Date().toISOString(),
      error: error.message
    });
  }
});

/**
 * @route GET /health/readiness
 * @desc Kubernetes readiness probe
 */
router.get('/readiness', async (req, res) => {
  const dbHealth = databaseManager.getHealthStatus();
  
  if (dbHealth.status === 'connected') {
    res.status(200).json({ status: 'READY' });
  } else {
    res.status(503).json({ status: 'NOT_READY', reason: 'Database not connected' });
  }
});

/**
 * @route GET /health/liveness
 * @desc Kubernetes liveness probe
 */
router.get('/liveness', (req, res) => {
  res.status(200).json({ status: 'ALIVE' });
});

module.exports = router;
