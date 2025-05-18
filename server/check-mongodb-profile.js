// Script to check MongoDB for saved user profile
const mongoose = require('mongoose');
const { Schema } = mongoose;

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

// Define User schema inline for this script
const UserSchema = new Schema({
  auth0Id: { type: String },
  username: { type: String },
  email: { type: String },
  name: { type: String },
  membershipLevel: { type: String },
  pictureUrl: { type: String },
  
  // Financial Profile (embedded)
  financialProfile: {
    annualIncome: { type: Number },
    creditScore: { type: Number },
    monthlySpending: { type: Map, of: Number },
    primarySpendingCategories: { type: [String] },
    travelFrequency: { type: String },
    preferredAirlines: { type: [String] },
    shoppingHabits: {
      online: { type: Number },
      inStore: { type: Number }
    },
    diningFrequency: { type: String },
    existingCards: { type: [String] },
    preferredBenefits: { type: [String] },
    updatedAt: { type: Date }
  },
  
  // Credit Cards (embedded array)
  creditCards: [{
    cardName: { type: String },
    issuer: { type: String },
    cardNumber: { type: String },
    pointsBalance: { type: Number },
    expireDate: { type: String },
    cardType: { type: String },
    color: { type: String }
  }]
});

// Find users with most recent financial profiles
async function findRecentUserProfiles() {
  try {
    // Get connected
    const connected = await connectToMongoDB();
    if (!connected) return;

    // Create User model
    const User = mongoose.model('User', UserSchema);
    
    // Find users with financial profiles, sort by updated date
    const users = await User.find(
      { "financialProfile": { $exists: true } },
      { 
        username: 1, 
        email: 1, 
        auth0Id: 1,
        "financialProfile.annualIncome": 1,
        "financialProfile.creditScore": 1,
        "financialProfile.primarySpendingCategories": 1,
        "financialProfile.preferredBenefits": 1,
        "financialProfile.updatedAt": 1
      }
    ).sort({ "financialProfile.updatedAt": -1 }).limit(5);
    
    console.log(`\nFound ${users.length} users with financial profiles\n`);
    
    // Display the users
    users.forEach((user, index) => {
      console.log(`User ${index + 1}:`);
      console.log(`- ID: ${user._id}`);
      console.log(`- Username: ${user.username}`);
      console.log(`- Email: ${user.email}`);
      console.log(`- Auth0 ID: ${user.auth0Id || 'None'}`);
      
      if (user.financialProfile) {
        console.log(`- Financial Profile:`);
        console.log(`  - Annual Income: ${user.financialProfile.annualIncome}`);
        console.log(`  - Credit Score: ${user.financialProfile.creditScore}`);
        console.log(`  - Primary Categories: ${user.financialProfile.primarySpendingCategories?.join(', ')}`);
        console.log(`  - Preferred Benefits: ${user.financialProfile.preferredBenefits?.join(', ')}`);
        console.log(`  - Last Updated: ${user.financialProfile.updatedAt}`);
      }
      console.log('');
    });
    
    // Find the most recently updated profile to examine in detail
    if (users.length > 0) {
      const mostRecentUser = users[0];
      
      // Get the complete profile for this user
      const completeUser = await User.findById(mostRecentUser._id);
      
      console.log(`\n===== DETAILED PROFILE FOR ${completeUser.username} =====\n`);
      console.log(`Financial Profile:`);
      
      const fp = completeUser.financialProfile;
      if (fp) {
        console.log(`- Annual Income: ${fp.annualIncome}`);
        console.log(`- Credit Score: ${fp.creditScore}`);
        console.log(`- Travel Frequency: ${fp.travelFrequency}`);
        console.log(`- Dining Frequency: ${fp.diningFrequency}`);
        
        console.log(`- Monthly Spending:`);
        if (fp.monthlySpending && fp.monthlySpending.size > 0) {
          fp.monthlySpending.forEach((value, key) => {
            console.log(`  - ${key}: ${value}`);
          });
        } else {
          console.log(`  (No monthly spending data)`);
        }
        
        console.log(`- Shopping Habits:`);
        if (fp.shoppingHabits) {
          console.log(`  - Online: ${fp.shoppingHabits.online}%`);
          console.log(`  - In-Store: ${fp.shoppingHabits.inStore}%`);
        } else {
          console.log(`  (No shopping habits data)`);
        }
        
        console.log(`- Primary Spending Categories: ${fp.primarySpendingCategories?.join(', ') || 'None'}`);
        console.log(`- Preferred Airlines: ${fp.preferredAirlines?.join(', ') || 'None'}`);
        console.log(`- Existing Cards: ${fp.existingCards?.join(', ') || 'None'}`);
        console.log(`- Preferred Benefits: ${fp.preferredBenefits?.join(', ') || 'None'}`);
      } else {
        console.log(`(No financial profile data)`);
      }
      
      console.log(`\nCredit Cards: ${completeUser.creditCards?.length || 0}`);
      if (completeUser.creditCards && completeUser.creditCards.length > 0) {
        completeUser.creditCards.forEach((card, index) => {
          console.log(`- Card ${index + 1}:`);
          console.log(`  - Name: ${card.cardName}`);
          console.log(`  - Issuer: ${card.issuer}`);
          console.log(`  - Type: ${card.cardType}`);
          console.log(`  - Number: ${card.cardNumber}`);
          console.log(`  - Points: ${card.pointsBalance}`);
          console.log(`  - Expires: ${card.expireDate}`);
        });
      }
    }
  } catch (error) {
    console.error('Error finding user profiles:', error);
  } finally {
    // Close the MongoDB connection
    await mongoose.connection.close();
    console.log('\nMongoDB connection closed');
  }
}

// Run the main function
findRecentUserProfiles(); 