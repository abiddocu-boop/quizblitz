/**
 * config/db.js
 * MongoDB connection using Mongoose.
 * Connects to MongoDB Atlas (free tier) or local MongoDB.
 */

const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI, {
      // These options help with connection stability on free tier
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    });

    console.log(`[DB] MongoDB connected: ${conn.connection.host}`);
  } catch (error) {
    console.error('[DB] Connection failed:', error.message);
    process.exit(1); // Exit if DB connection fails — app cannot run without it
  }
};

// Handle connection events for better observability
mongoose.connection.on('disconnected', () => {
  console.warn('[DB] MongoDB disconnected. Attempting to reconnect...');
});

mongoose.connection.on('reconnected', () => {
  console.log('[DB] MongoDB reconnected');
});

module.exports = connectDB;
