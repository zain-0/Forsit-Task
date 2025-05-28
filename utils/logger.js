// Simple console logger - should add winston or similar for later
const logger = {
  info: (message, data) => {
    console.log(`[INFO] ${message}`, data ? JSON.stringify(data) : '');
  },
  
  error: (message, data) => {
    console.error(`[ERROR] ${message}`, data ? JSON.stringify(data) : '');
  },
  
  warn: (message, data) => {
    console.warn(`[WARN] ${message}`, data ? JSON.stringify(data) : '');
  }
};

module.exports = logger;