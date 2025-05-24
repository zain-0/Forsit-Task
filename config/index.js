require('dotenv').config();

module.exports = {
  port: process.env.PORT || 3000,
  mongoUri: process.env.MONGODB_URI || 'mongodb://localhost:27017/ecommerce-admin',
  isDev: process.env.NODE_ENV === 'development'
};