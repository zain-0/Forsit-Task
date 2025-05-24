const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const mongoose = require('mongoose');

const config = require('./config');
const { requestLogger } = require('./middleware/requestInterceptor');
const { basicLimiter, strictLimiter } = require('./middleware/rateLimiting');

// Routes
const productRoutes = require('./routes/products');
const salesRoutes = require('./routes/sales');
const inventoryRoutes = require('./routes/inventory');
const analyticsRoutes = require('./routes/analytics');
const healthRoutes = require('./routes/health');

const app = express();

// Basic middleware
app.use(helmet());
app.use(cors());
app.use(basicLimiter);
app.use(express.json());
app.use(requestLogger);

// Connect to MongoDB
mongoose.connect(config.mongoUri)
  .then(() => console.log('Connected to MongoDB'))
  .catch(err => console.error('MongoDB connection error:', err));

// Routes
app.use('/health', healthRoutes);
app.use('/api/v1/products', strictLimiter, productRoutes);
app.use('/api/v1/sales', strictLimiter, salesRoutes);
app.use('/api/v1/inventory', strictLimiter, inventoryRoutes);
app.use('/api/v1/analytics', analyticsRoutes);

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found'
  });
});

// Error handler
app.use((error, req, res, next) => {
  console.error('Error:', error.message);
  
  if (error.name === 'ValidationError') {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: Object.values(error.errors).map(e => e.message)
    });
  }
  
  res.status(500).json({
    success: false,
    message: config.isDev ? error.message : 'Internal server error'
  });
});

const PORT = config.port;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});