const mongoose = require('mongoose');
const logger = require('../utils/logger');

class DatabaseManager {
  constructor() {
    this.isConnected = false;
  }

  async connect() {
    try {
      await mongoose.connect(process.env.MONGODB_URI, {
        maxPoolSize: 10,
        serverSelectionTimeoutMS: 5000,
        socketTimeoutMS: 45000,
        maxIdleTimeMS: 30000,
      });
      
      this.isConnected = true;
      logger.info('Database connected successfully');
      this.setupEventListeners();
      
    } catch (error) {
      logger.error('Database connection failed', { error: error.message });
      throw error;
    }
  }

  setupEventListeners() {
    mongoose.connection.on('disconnected', () => {
      this.isConnected = false;
      logger.warn('Database disconnected');
    });

    mongoose.connection.on('error', (err) => {
      logger.error('Database connection error', { error: err.message });
    });

    mongoose.connection.on('reconnected', () => {
      this.isConnected = true;
      logger.info('Database reconnected');
    });

    process.on('SIGINT', () => {
      mongoose.connection.close(() => {
        logger.info('Database connection closed');
        process.exit(0);
      });
    });
  }

  getHealthStatus() {
    const state = mongoose.connection.readyState;
    const states = { 0: 'disconnected', 1: 'connected', 2: 'connecting', 3: 'disconnecting' };

    return {
      status: states[state] || 'unknown',
      host: mongoose.connection.host,
      database: mongoose.connection.name
    };
  }

  async getStats() {
    try {
      const db = mongoose.connection.db;
      const stats = await db.stats();
      
      return {
        collections: stats.collections,
        dataSize: stats.dataSize,
        storageSize: stats.storageSize,
        indexes: stats.indexes,
        objects: stats.objects
      };
    } catch (error) {
      logger.error('Failed to get database stats', { error: error.message });
      return null;
    }
  }
}

module.exports = new DatabaseManager();
