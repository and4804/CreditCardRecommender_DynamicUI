// Script to check MongoDB for financial profile data
import mongoose from 'mongoose';

// Connect to MongoDB
async function connectToMongoDB() {
  try {
    const uri = 'mongodb://localhost:27017/replitcc';
    console.log(`Connecting to MongoDB at: ${uri}`);
    await mongoose.connect(uri);
    console.log('Connected to MongoDB');
    return true;
  } catch (error) {
    console.error('MongoDB connection error:', error);
    return false;
  }
}

// Find user by MongoDB ID or Auth0 ID
async function findUser(userId = '6828702b85244119c5e9411f', auth0Id = 'google-oauth2|106228294801252547878') {
  try {
    // Get connected
    const connected = await connectToMongoDB();
    if (!connected) return;
    
    const db = mongoose.connection.db;
    const usersCollection = db.collection('users');
    
    // Try finding by MongoDB ID first
    console.log(`\nLooking for user with MongoDB ID: ${userId}`);
    let user = null;
    
    try {
      user = await usersCollection.findOne({ _id: new mongoose.Types.ObjectId(userId) });
    } catch (err) {
      console.log(`Could not find by MongoDB ID: ${err.message}`);
    }
    
    // If not found, try Auth0 ID
    if (!user) {
      console.log(`Looking for user with Auth0 ID: ${auth0Id}`);
      user = await usersCollection.findOne({ auth0Id: auth0Id });
    }
    
    if (!user) {
      console.log('No matching user found');
      // List all users
      console.log('\nListing all users:');
      const users = await usersCollection.find({}).toArray();
      users.forEach((u, i) => {
        console.log(`${i+1}. ID: ${u._id}, Auth0 ID: ${u.auth0Id || 'N/A'}, Email: ${u.email || 'N/A'}`);
      });
      return null;
    }
    
    console.log('\n===== USER INFORMATION =====');
    console.log(`MongoDB ID: ${user._id}`);
    console.log(`Username: ${user.username || 'N/A'}`);
    console.log(`Email: ${user.email || 'N/A'}`);
    console.log(`Name: ${user.name || 'N/A'}`);
    console.log(`Auth0 ID: ${user.auth0Id || 'N/A'}`);
    
    // Check for financial profile (embedded)
    if (user.financialProfile) {
      console.log('\n===== EMBEDDED FINANCIAL PROFILE =====');
      const fp = user.financialProfile;
      console.log(`Annual Income: ${fp.annualIncome}`);
      console.log(`Credit Score: ${fp.creditScore}`);
      console.log(`Travel Frequency: ${fp.travelFrequency}`);
      console.log(`Dining Frequency: ${fp.diningFrequency}`);
      
      if (fp.monthlySpending) {
        console.log('\nMonthly Spending:');
        Object.entries(fp.monthlySpending).forEach(([category, amount]) => {
          console.log(`  - ${category}: ${amount}`);
        });
      }
      
      if (fp.shoppingHabits) {
        console.log('\nShopping Habits:');
        console.log(`  - Online: ${fp.shoppingHabits.online}%`);
        console.log(`  - In-Store: ${fp.shoppingHabits.inStore}%`);
      }
      
      if (fp.primarySpendingCategories && fp.primarySpendingCategories.length > 0) {
        console.log(`\nPrimary Categories: ${fp.primarySpendingCategories.join(', ')}`);
      }
      
      if (fp.preferredAirlines && fp.preferredAirlines.length > 0) {
        console.log(`Preferred Airlines: ${fp.preferredAirlines.join(', ')}`);
      }
      
      if (fp.existingCards && fp.existingCards.length > 0) {
        console.log(`Existing Cards: ${fp.existingCards.join(', ')}`);
      }
      
      if (fp.preferredBenefits && fp.preferredBenefits.length > 0) {
        console.log(`Preferred Benefits: ${fp.preferredBenefits.join(', ')}`);
      }
      
      console.log(`Last Updated: ${fp.updatedAt}`);
    } else {
      console.log('\nNo embedded financial profile found');
    }
    
    // Check for standalone financial profile
    const financialProfilesCollection = db.collection('financialprofiles');
    const profile = await financialProfilesCollection.findOne({ userId: user._id.toString() });
    
    if (profile) {
      console.log('\n===== STANDALONE FINANCIAL PROFILE =====');
      console.log(`Profile ID: ${profile._id}`);
      console.log(`User ID: ${profile.userId}`);
      console.log(`Annual Income: ${profile.annualIncome}`);
      console.log(`Credit Score: ${profile.creditScore}`);
      
      // Display other fields
      const keys = Object.keys(profile);
      keys.forEach(key => {
        if (!['_id', 'userId', 'annualIncome', 'creditScore'].includes(key)) {
          const value = profile[key];
          if (Array.isArray(value)) {
            console.log(`${key}: ${value.join(', ')}`);
          } else if (typeof value === 'object' && value !== null) {
            console.log(`${key}: ${JSON.stringify(value)}`);
          } else {
            console.log(`${key}: ${value}`);
          }
        }
      });
    } else {
      console.log('\nNo standalone financial profile found');
    }
    
    // Check for credit cards
    if (user.creditCards && user.creditCards.length > 0) {
      console.log('\n===== EMBEDDED CREDIT CARDS =====');
      user.creditCards.forEach((card, i) => {
        console.log(`\nCard ${i+1}:`);
        console.log(`Name: ${card.cardName}`);
        console.log(`Issuer: ${card.issuer}`);
        console.log(`Card Number: ${card.cardNumber}`);
        console.log(`Type: ${card.cardType}`);
        console.log(`Points Balance: ${card.pointsBalance}`);
        console.log(`Expiration: ${card.expireDate}`);
      });
    } else {
      console.log('\nNo embedded credit cards found');
    }
    
    // Check for standalone credit cards
    const creditCardsCollection = db.collection('creditcards');
    const cards = await creditCardsCollection.find({ userId: user._id.toString() }).toArray();
    
    if (cards && cards.length > 0) {
      console.log('\n===== STANDALONE CREDIT CARDS =====');
      cards.forEach((card, i) => {
        console.log(`\nCard ${i+1}:`);
        console.log(`Card ID: ${card._id}`);
        console.log(`User ID: ${card.userId}`);
        console.log(`Name: ${card.cardName}`);
        console.log(`Issuer: ${card.issuer}`);
        console.log(`Card Number: ${card.cardNumber}`);
      });
    } else {
      console.log('\nNo standalone credit cards found');
    }
    
    return user;
  } catch (error) {
    console.error('Error finding user:', error);
    return null;
  } finally {
    console.log('\nClosing MongoDB connection');
    await mongoose.connection.close();
  }
}

// Run the main function
findUser().catch(console.error); 