// Simple script to check MongoDB connection and database (ESM version)
import mongoose from 'mongoose';

async function main() {
  try {
    // Connect to MongoDB
    const uri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/card-concierge';
    console.log(`Connecting to MongoDB at: ${uri}`);
    
    await mongoose.connect(uri);
    console.log('✅ Connected to MongoDB');
    
    // Get database name
    const dbName = mongoose.connection.db.databaseName;
    console.log(`📂 Database: ${dbName}`);
    
    // Get all collection names
    const collections = await mongoose.connection.db.listCollections().toArray();
    console.log(`\n📋 Collections (${collections.length}):`);
    
    if (collections.length === 0) {
      console.log('   No collections found');
    } else {
      collections.forEach(collection => {
        console.log(`   - ${collection.name}`);
      });
    }
    
    // Close connection
    await mongoose.connection.close();
    console.log('\n✅ MongoDB connection closed');
  } catch (error) {
    console.error('Error:', error);
  }
}

// Run the main function
main(); 