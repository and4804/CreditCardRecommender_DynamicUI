/**
 * MongoDB verification script
 * Run with: node check-mongodb.js
 */

import { MongoClient } from 'mongodb';

// MongoDB connection string
const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/replitcc';

// Function to connect to MongoDB and display collections
async function checkMongoDB() {
  const client = new MongoClient(uri);
  
  try {
    // Connect to the MongoDB server
    await client.connect();
    console.log('✅ Connected to MongoDB');
    
    // Get database
    const db = client.db();
    console.log(`📂 Database: ${db.databaseName}`);
    
    // List all collections
    const collections = await db.listCollections().toArray();
    console.log('\n📋 Collections:');
    if (collections.length === 0) {
      console.log('   No collections found. Database might be empty.');
    } else {
      collections.forEach(collection => {
        console.log(`   - ${collection.name}`);
      });
    }
    
    // Check users collection
    console.log('\n👤 Users:');
    const users = await db.collection('users').find({}).toArray();
    if (users.length === 0) {
      console.log('   No users found.');
    } else {
      users.forEach(user => {
        // Print user info without sensitive data
        const { password, ...userInfo } = user;
        console.log(`   - ID: ${user._id}`);
        console.log(`     Username: ${user.username || 'N/A'}`);
        console.log(`     Name: ${user.name || 'N/A'}`);
        console.log(`     Email: ${user.email || 'N/A'}`);
        if (user.auth0Id) {
          console.log(`     Auth0 ID: ${user.auth0Id}`);
        }
      });
    }
    
    // Check financial profiles
    console.log('\n💰 Financial Profiles:');
    const profiles = await db.collection('financialprofiles').find({}).toArray();
    if (profiles.length === 0) {
      console.log('   No financial profiles found.');
    } else {
      profiles.forEach(profile => {
        console.log(`   - Profile ID: ${profile._id}`);
        console.log(`     User ID: ${profile.userId}`);
        console.log(`     Annual Income: ${profile.annualIncome}`);
        console.log(`     Credit Score: ${profile.creditScore}`);
        console.log(`     Primary Categories: ${profile.primarySpendingCategories?.join(', ') || 'N/A'}`);
        console.log(`     Created: ${profile.createdAt}`);
      });
    }
    
    // Check credit cards
    console.log('\n💳 Credit Cards:');
    const cards = await db.collection('creditcards').find({}).toArray();
    if (cards.length === 0) {
      console.log('   No credit cards found.');
    } else {
      cards.forEach(card => {
        console.log(`   - Card ID: ${card._id}`);
        console.log(`     User ID: ${card.userId}`);
        console.log(`     Card Name: ${card.cardName}`);
        console.log(`     Issuer: ${card.issuer}`);
      });
    }
    
  } catch (err) {
    console.error('❌ Error connecting to MongoDB:', err);
  } finally {
    // Close the connection
    await client.close();
    console.log('\n✅ MongoDB connection closed');
  }
}

// Run the function
checkMongoDB().catch(console.error); 