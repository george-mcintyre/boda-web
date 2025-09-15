const mongoose = require('mongoose');

// Environment detection
const isProduction = process.env.NODE_ENV === 'production';
const isVercel = process.env.VERCEL === '1';

// Database configuration
const getDatabaseConfig = () => {
  // Use MongoDB Atlas for both local development and production
  return {
    uri: process.env.MONGODB_URI || 'mongodb+srv://admin:EWEWQZwECrY2JgI0@bodadb.zyb782r.mongodb.net/?retryWrites=true&w=majority&appName=BodaDB',
    options: {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
      dbName: 'boda-web' // Specify database name
    }
  };
};

// Connect to MongoDB
const connectDB = async () => {
  try {
    const config = getDatabaseConfig();
    
    console.log(`🔗 Connecting to MongoDB...`);
    console.log(`📍 Environment: ${isVercel ? 'Vercel' : isProduction ? 'Production' : 'Local'}`);
    console.log(`🗄️ Database: ${config.uri.replace(/\/\/.*@/, '//***:***@')}`); // Hide credentials in logs
    
    await mongoose.connect(config.uri, config.options);
    
    console.log('✅ MongoDB connected successfully');
    
    // Handle connection events
    mongoose.connection.on('error', (err) => {
      console.error('❌ MongoDB connection error:', err);
    });
    
    mongoose.connection.on('disconnected', () => {
      console.log('⚠️ MongoDB disconnected');
    });
    
    // Graceful shutdown
    process.on('SIGINT', async () => {
      await mongoose.connection.close();
      console.log('🔌 MongoDB connection closed through app termination');
      process.exit(0);
    });
    
  } catch (error) {
    console.error('❌ MongoDB connection failed:', error);
    process.exit(1);
  }
};

// Database models will be defined here
const models = {};

module.exports = {
  connectDB,
  getDatabaseConfig,
  models
};

