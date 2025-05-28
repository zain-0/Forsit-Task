const express = require('express');
const router = express.Router();
const healthController = require('../controllers/healthController');

// Basic health check
router.get('/', healthController.getHealthCheck);

// Database health check
router.get('/db', healthController.getDbConnection);

module.exports = router;
