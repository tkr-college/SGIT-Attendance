const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    // Build MongoDB URI with proper format
    const mongoUri = process.env.MONGO_URI || 
      `mongodb://qr-attendance-mongo.railway.internal:27017/qr_attendance`;
    
    await mongoose.connect(mongoUri);
    console.log('MongoDB connected');
  } catch (err) {
    console.error('MongoDB connection error:', err.message);
    process.exit(1);
  }
};

module.exports = connectDB;
