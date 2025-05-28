const mongoose = require('mongoose');

function getHealthCheck(req, res) {
  res.status(200).json({ ping: 'pong' });
}

// Database health check
function getDbConnection(req, res) {
  const dbState = mongoose.connection.readyState;
  const isConnected = dbState === 1;

  res.status(isConnected ? 200 : 503).json({
    status: isConnected ? 'OK' : 'ERROR',
    database: isConnected ? 'connected' : 'disconnected'
  });
}

module.exports = {
  getHealthCheck,
  getDbConnection
};