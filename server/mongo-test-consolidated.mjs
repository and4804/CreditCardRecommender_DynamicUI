// Test script to verify the consolidated user model in MongoDB
import mongoose from 'mongoose';
import { connectToMongoDB } from './mongo-db.js';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import { createRequire } from 'module';

// Create a require function
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const require = createRequire(import.meta.url);

async function testConsolidatedUserModel() {
  try {
    // Connect to MongoDB
    await connectToMongoDB();
    console.log('Connected to MongoDB successfully');
    
    // Get the User model
    const { User } = await import('./models/mongo-models.js');
    
    // Check if there are existing users
    const existingUserCount = await User.countDocuments();
    console.log(`Found ${existingUserCount} existing users in the database`);
    
    // Create a new test user with all data embedded
    const testUser = new User({
      auth0Id: `test-auth0-id-${Date.now()}`,
      username: `testuser-${Date.now()}`,
      email: `testuser-${Date.now()}@example.com`,
      name: 'Test Consolidated User',
      membershipLevel: 'Premium',
      pictureUrl: 'https://example.com/test.png',
      createdAt: new Date(),
      lastLogin: new Date(),
      
      // Embedded financial profile
      financialProfile: {
        annualIncome: 1200000,
        creditScore: 750,
        monthlySpending: {
          groceries: 20000,
          dining: 15000,
          travel: 30000,
          shopping: 25000
        },
        primarySpendingCategories: ['groceries', 'dining', 'travel', 'shopping'],
        travelFrequency: 'frequently',
        diningFrequency: 'frequently',
        preferredBenefits: ['cashback', 'travel_rewards'],
        preferredAirlines: ['air_india', 'vistara'],
        existingCards: ['hdfc_regalia', 'sbi_elite'],
        shoppingHabits: {
          online: 70,
          inStore: 30
        },
        updatedAt: new Date()
      },
      
      // Embedded credit cards
      creditCards: [
        {
          cardName: 'Test Premium Card',
          issuer: 'Test Bank',
          cardNumber: '4111111111111111',
          pointsBalance: 5000,
          expireDate: '12/28',
          cardType: 'visa',
          color: 'blue'
        },
        {
          cardName: 'Test Gold Card',
          issuer: 'Premium Bank',
          cardNumber: '5555555555554444',
          pointsBalance: 12000,
          expireDate: '10/27',
          cardType: 'mastercard',
          color: 'gold'
        }
      ]
    });
    
    // Save the test user
    await testUser.save();
    console.log('Created new test user with ID:', testUser._id);
    
    // Retrieve the user to verify data
    const savedUser = await User.findById(testUser._id);
    console.log('Retrieved saved user:');
    console.log('- ID:', savedUser._id);
    console.log('- Username:', savedUser.username);
    console.log('- Financial Profile:', savedUser.financialProfile ? 'Present' : 'Missing');
    if (savedUser.financialProfile) {
      console.log('  - Annual Income:', savedUser.financialProfile.annualIncome);
      console.log('  - Credit Score:', savedUser.financialProfile.creditScore);
      console.log('  - Spending Categories:', savedUser.financialProfile.primarySpendingCategories);
      console.log('  - Monthly Spending:', savedUser.financialProfile.monthlySpending);
    }
    console.log('- Credit Cards:', savedUser.creditCards ? savedUser.creditCards.length : 0);
    if (savedUser.creditCards && savedUser.creditCards.length > 0) {
      savedUser.creditCards.forEach((card, index) => {
        console.log(`  - Card ${index + 1}: ${card.cardName} (${card.cardType})`);
      });
    }
    
    // Test updating the financial profile
    console.log('\nUpdating financial profile...');
    savedUser.financialProfile.annualIncome = 1500000;
    savedUser.financialProfile.monthlySpending.set('entertainment', 10000);
    savedUser.financialProfile.primarySpendingCategories.push('entertainment');
    savedUser.financialProfile.updatedAt = new Date();
    await savedUser.save();
    
    // Verify the update
    const updatedUser = await User.findById(testUser._id);
    console.log('Updated financial profile:');
    console.log('- Annual Income:', updatedUser.financialProfile.annualIncome);
    console.log('- Monthly Spending:', updatedUser.financialProfile.monthlySpending);
    console.log('- Spending Categories:', updatedUser.financialProfile.primarySpendingCategories);
    
    // Add a new credit card
    console.log('\nAdding a new credit card...');
    updatedUser.creditCards.push({
      cardName: 'Test Platinum Card',
      issuer: 'Luxury Bank',
      cardNumber: '3782822463100053',
      pointsBalance: 20000,
      expireDate: '08/30',
      cardType: 'amex',
      color: 'black'
    });
    await updatedUser.save();
    
    // Verify the added card
    const finalUser = await User.findById(testUser._id);
    console.log('Final credit cards:');
    finalUser.creditCards.forEach((card, index) => {
      console.log(`- Card ${index + 1}: ${card.cardName} (${card.cardType})`);
    });
    
    console.log('\nTest completed successfully!');
    console.log('The consolidated User model is working as expected.');
    
  } catch (error) {
    console.error('Test failed with error:', error);
  } finally {
    // Close the MongoDB connection
    await mongoose.connection.close();
    console.log('MongoDB connection closed');
  }
}

// Run the test
testConsolidatedUserModel(); 