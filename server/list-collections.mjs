// Simple script to list all collections and data in MongoDB
import mongoose from 'mongoose';

async function connectToMongoDB() {
  try {
    const uri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/card-concierge';
    await mongoose.connect(uri);
    console.log('Connected to MongoDB');
    return true;
  } catch (error) {
    console.error('MongoDB connection error:', error);
    return false;
  }
}

async function listCollections() {
  try {
    const connected = await connectToMongoDB();
    if (!connected) return;
    
    const db = mongoose.connection.db;
    
    // Get all collection names
    const collections = await db.listCollections().toArray();
    console.log(`\n📋 Collections in database (${collections.length}):`);
    collections.forEach(collection => {
      console.log(`   - ${collection.name}`);
    });
    
    // Check each collection for documents
    for (const collection of collections) {
      const collectionName = collection.name;
      const docs = await db.collection(collectionName).find({}).limit(5).toArray();
      
      console.log(`\n📄 Collection: ${collectionName} (${docs.length} documents found)`);
      
      if (docs.length === 0) {
        console.log('   No documents found');
        continue;
      }
      
      // Print a summary of each document
      docs.forEach((doc, i) => {
        console.log(`\n   Document ${i+1}:`);
        console.log(`   - ID: ${doc._id}`);
        
        // Handle user collection
        if (collectionName === 'users') {
          console.log(`   - Username: ${doc.username || 'N/A'}`);
          console.log(`   - Email: ${doc.email || 'N/A'}`);
          console.log(`   - Auth0 ID: ${doc.auth0Id || 'N/A'}`);
          
          // Check for financial profile (consolidated model)
          if (doc.financialProfile) {
            console.log(`   - Has Financial Profile: Yes`);
            console.log(`     - Annual Income: ${doc.financialProfile.annualIncome}`);
            console.log(`     - Credit Score: ${doc.financialProfile.creditScore}`);
          } else {
            console.log(`   - Has Financial Profile: No`);
          }
          
          // Check for credit cards (consolidated model)
          if (doc.creditCards && doc.creditCards.length > 0) {
            console.log(`   - Credit Cards: ${doc.creditCards.length}`);
          } else {
            console.log(`   - Credit Cards: None`);
          }
        }
        
        // Handle financial profiles collection
        else if (collectionName === 'financialprofiles') {
          console.log(`   - User ID: ${doc.userId || 'N/A'}`);
          console.log(`   - Annual Income: ${doc.annualIncome || 'N/A'}`);
          console.log(`   - Credit Score: ${doc.creditScore || 'N/A'}`);
        }
        
        // Handle credit cards collection
        else if (collectionName === 'creditcards') {
          console.log(`   - User ID: ${doc.userId || 'N/A'}`);
          console.log(`   - Card Name: ${doc.cardName || 'N/A'}`);
          console.log(`   - Issuer: ${doc.issuer || 'N/A'}`);
        }
        
        // For other collections, show top-level keys
        else {
          const keys = Object.keys(doc);
          keys.slice(0, 5).forEach(key => {
            if (key !== '_id') {
              const value = typeof doc[key] === 'object' ? 
                (doc[key] ? '(object)' : 'null') : 
                doc[key];
              console.log(`   - ${key}: ${value}`);
            }
          });
          
          if (keys.length > 6) {
            console.log(`   - ... ${keys.length - 6} more fields`);
          }
        }
      });
    }
  } catch (error) {
    console.error('Error listing collections:', error);
  } finally {
    console.log('\nClosing MongoDB connection');
    await mongoose.connection.close();
  }
}

// Run the main function
listCollections().catch(console.error); 