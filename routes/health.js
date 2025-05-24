const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const Package = require('../package.json');

// Basic health check
router.get('/', (req, res) => {
  res.status(200).json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    version: Package.version,
    uptime: Math.floor(process.uptime())
  });
});

// Database health check
router.get('/db', (req, res) => {
  const dbState = mongoose.connection.readyState;
  const isConnected = dbState === 1;
  
  res.status(isConnected ? 200 : 503).json({
    status: isConnected ? 'OK' : 'ERROR',
    database: isConnected ? 'connected' : 'disconnected'
  });
});

module.exports = router;
