// ESM module script to check MongoDB for saved user profile
import mongoose from 'mongoose';

// Connect to MongoDB
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

// Find user by Auth0 ID
async function findUserByAuth0Id(auth0Id) {
  try {
    // Get connected
    const connected = await connectToMongoDB();
    if (!connected) return;
    
    // Query the user collection directly without schema
    const db = mongoose.connection.db;
    const usersCollection = db.collection('users');
    
    console.log(`\nLooking for user with Auth0 ID: ${auth0Id}`);
    
    // Find user by Auth0 ID
    const user = await usersCollection.findOne({ auth0Id });
    
    if (!user) {
      console.log('No user found with that Auth0 ID');
      return null;
    }
    
    console.log('\n===== USER INFORMATION =====');
    console.log(`MongoDB ID: ${user._id}`);
    console.log(`Username: ${user.username}`);
    console.log(`Email: ${user.email}`);
    console.log(`Name: ${user.name}`);
    console.log(`Auth0 ID: ${user.auth0Id}`);
    
    // Check for financial profile
    if (user.financialProfile) {
      console.log('\n===== FINANCIAL PROFILE =====');
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
      console.log('\nNo financial profile found for this user');
    }
    
    // Check for credit cards
    if (user.creditCards && user.creditCards.length > 0) {
      console.log('\n===== CREDIT CARDS =====');
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
      console.log('\nNo credit cards found for this user');
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

// Main function to run the script
async function main() {
  // Auth0 ID (can be passed as command line argument)
  const auth0Id = process.argv[2] || 'google-oauth2|106228294801252547878';
  
  await findUserByAuth0Id(auth0Id);
}

// Run the main function
main().catch(console.error); 