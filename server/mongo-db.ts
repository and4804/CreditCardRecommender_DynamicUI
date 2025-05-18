import mongoose from 'mongoose';

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/replitcc';

// MongoDB connection options
const options = {
  autoIndex: true,
};

// Connect to MongoDB
export async function connectToMongoDB() {
  try {
    await mongoose.connect(MONGODB_URI, options);
    console.log('Connected to MongoDB successfully');
    return mongoose.connection;
  } catch (error) {
    console.error('MongoDB connection error:', error);
    process.exit(1);
  }
}

// Disconnect from MongoDB
export async function disconnectFromMongoDB() {
  try {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  } catch (error) {
    console.error('Error disconnecting from MongoDB:', error);
  }
}

// Export the mongoose connection
export const mongoConnection = mongoose.connection; 