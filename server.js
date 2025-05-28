const { requestLogger } = require('./middleware/requestInterceptor');
const { basicLimiter, strictLimiter } = require('./middleware/rateLimiting');
const mongoose = require('mongoose');
const express = require('express');
const config = require('./config');
const helmet = require('helmet');
const cors = require('cors');
const productRoutes = require('./routes/products');
const salesRoutes = require('./routes/sales');
const inventoryRoutes = require('./routes/inventory');
const analyticsRoutes = require('./routes/analytics');
const healthRoutes = require('./routes/health');

const app = express();
app.use(helmet());
app.use(cors());
app.use(basicLimiter);
app.use(express.json());
app.use(requestLogger);

// Routes
app.use('/debug', healthRoutes);
app.use('/api/v1/products', strictLimiter, productRoutes);
app.use('/api/v1/sales', strictLimiter, salesRoutes);
app.use('/api/v1/inventory', strictLimiter, inventoryRoutes);
app.use('/api/v1/analytics', analyticsRoutes);


app.use((req, res) => {
  res.status(404).json({
    error: 'Not found',
    path: req.originalUrl
  });
});


app.use((error, req, res, next) => {
  console.log('Something went wrong:', error.message);

  // mongoose validation errors
  if (error.type === 'ValidationError') {
    const validationErrors = [];
    for (const field in error.errors) {
      validationErrors.push(error.errors[field].message);
    }
    return res.status(400).json({
      error: 'Bad request',
      details: validationErrors
    });
  }

  const statusCode = error.status || 500;
  res.status(statusCode).json({
    error: error.message,
    details: error.stack
  });
});

const PORT = config.port || 3000;
mongoose.connect(config.mongoUri)
  .then(() => {
    console.log('DB connected successfully');
    app.listen(PORT, () => {
      console.log('Server started on port ' + PORT);
    });
  })
  .catch(err => {
    console.log('Failed to connect to database:', err.message);
    process.exit(1);
  });