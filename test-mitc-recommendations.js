// Test script for MITC-based credit card recommendations
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import { DataAPIClient } from '@datastax/astra-db-ts';
import OpenAI from 'openai';
import { MongoClient } from 'mongodb';

// Load environment variables
dotenv.config();

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// MongoDB connection
async function connectToMongoDB() {
  try {
    const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/replitcc';
    console.log(`Connecting to MongoDB at ${uri}`);
    
    const client = new MongoClient(uri);
    await client.connect();
    console.log('Connected to MongoDB successfully');
    return client;
  } catch (error) {
    console.error('MongoDB connection error:', error);
    return null;
  }
}

// Define User Schema (simplified version of what's in the app)
const UserSchema = new mongoose.Schema({
  username: String,
  email: String,
  name: String,
  auth0Id: String,
  financialProfile: {
    annualIncome: Number,
    creditScore: Number,
    monthlySpending: {
      type: Map,
      of: Number
    },
    primarySpendingCategories: [String],
    travelFrequency: String,
    diningFrequency: String,
    preferredBenefits: [String],
    preferredAirlines: [String],
    existingCards: [String],
    shoppingHabits: {
      online: Number,
      inStore: Number
    }
  }
});

// Create AstraDB client
async function createAstraClient() {
  const ASTRA_DB_ID = process.env.ASTRA_DB_ID;
  const ASTRA_DB_REGION = process.env.ASTRA_DB_REGION;
  const ASTRA_DB_TOKEN = process.env.ASTRA_DB_TOKEN;
  const ASTRA_DB_NAMESPACE = process.env.ASTRA_DB_NAMESPACE || "default_keyspace";
  const ASTRA_DB_COLLECTION = process.env.ASTRA_DB_COLLECTION || "cc_details";

  if (!ASTRA_DB_ID || !ASTRA_DB_REGION || !ASTRA_DB_TOKEN) {
    console.error("AstraDB environment variables not set properly");
    return null;
  }

  try {
    console.log("Creating AstraDB client...");
    
    // Creating client using v2.0.1 API
    const client = new DataAPIClient();
    const endpoint = `https://${ASTRA_DB_ID}-${ASTRA_DB_REGION}.apps.astra.datastax.com`;
    const db = client.db(endpoint, { token: ASTRA_DB_TOKEN, keyspace: ASTRA_DB_NAMESPACE });
    
    // Test the connection by getting the collection
    const collection = await db.collection(ASTRA_DB_COLLECTION);
    console.log(`Connected to collection: ${ASTRA_DB_COLLECTION}`);
    
    return { db, collection };
  } catch (error) {
    console.error("Error creating AstraDB client:", error);
    return null;
  }
}

// Generate embedding for user profile
async function generateProfileEmbedding(profile) {
  try {
    console.log("Creating embedding from user profile...");
    
    // Create a text representation of the user profile
    const profileText = `
      Financial Profile:
      Annual Income: ${profile.annualIncome}
      Credit Score: ${profile.creditScore}
      Primary Spending Categories: ${profile.primarySpendingCategories?.join(', ') || 'Not specified'}
      Travel Frequency: ${profile.travelFrequency || 'Not specified'}
      Dining Frequency: ${profile.diningFrequency || 'Not specified'}
      Preferred Benefits: ${profile.preferredBenefits?.join(', ') || 'Not specified'}
      
      I need credit cards that match this financial profile, focusing on:
      1. Cards with good rewards and benefits
      2. Cards that offer good value for money
      3. Cards with low or no annual fees
      4. Cards with good customer service
    `;

    // Call OpenAI embedding API with the model that produces 1024-dimension vectors
    const response = await openai.embeddings.create({
      model: "text-embedding-ada-002", // This model produces 1024-dimension vectors
      input: profileText
    });
    
    // Extract the embedding vector
    const embedding = response.data[0].embedding;
    console.log(`Generated embedding vector of length ${embedding.length}`);
    
    // Double-check that we have the expected vector dimension
    if (embedding.length !== 1024) {
      console.warn(`Warning: Expected 1024-dimension vector but got ${embedding.length}-dimension vector`);
    }
    
    return embedding;
  } catch (error) {
    console.error("Error generating embedding:", error);
    
    // Fallback to mock vector if embedding fails
    console.log("Falling back to mock vector with 1024 dimensions");
    return Array(1024).fill(0).map(() => Math.random() - 0.5); // 1024 dimensions to match AstraDB
  }
}

// Find relevant credit cards based on user profile
async function findRelevantCreditCards(userProfile) {
  try {
    console.log("Creating embedding from user profile...");
    const embedding = await generateProfileEmbedding(userProfile);
    console.log(`Generated embedding vector of length ${embedding.length}`);
    
    // Log warning about dimension mismatch
    if (embedding.length !== 1024) {
      console.log(`Note: OpenAI is returning ${embedding.length}-dimensional vectors. AstraDB expects 1024-dimensional vectors.`);
      console.log("Will use regular document retrieval instead of vector search.");
    }
    
    console.log("Querying AstraDB for credit cards...");
    
    // Create AstraDB client using the same approach as in test-mitc-fragments.js
    const ASTRA_DB_ID = process.env.ASTRA_DB_ID;
    const ASTRA_DB_REGION = process.env.ASTRA_DB_REGION;
    const ASTRA_DB_TOKEN = process.env.ASTRA_DB_TOKEN;
    const ASTRA_DB_NAMESPACE = process.env.ASTRA_DB_NAMESPACE || "default_keyspace";
    const ASTRA_DB_COLLECTION = process.env.ASTRA_DB_COLLECTION || "cc_details";

    // Create the AstraDB client
    const client = new DataAPIClient();
    const endpoint = `https://${ASTRA_DB_ID}-${ASTRA_DB_REGION}.apps.astra.datastax.com`;
    const db = client.db(endpoint, { token: ASTRA_DB_TOKEN, keyspace: ASTRA_DB_NAMESPACE });
    
    console.log('AstraDB client created successfully');
    
    // Get collection
    const collection = await db.collection(ASTRA_DB_COLLECTION);
    console.log(`Connected to collection: ${ASTRA_DB_COLLECTION}`);
    
    try {
      console.log("Getting credit card documents without vector search...");
      // Use find without vector search due to dimension mismatch
      const allCards = await collection.find({}, {
        projection: { _id: 1, type: 1, $vectorize: 1 }
      }).limit(20).toArray();
      
      console.log(`Found ${allCards.length} credit cards in AstraDB`);
      
      if (allCards.length > 0) {
        console.log("Sample card fields:", Object.keys(allCards[0]));
        
        // Check if $vectorize field exists in the results
        const hasVectorizeField = allCards.some(card => card.$vectorize);
        console.log(`$vectorize field found in results: ${hasVectorizeField}`);
        
        if (hasVectorizeField) {
          console.log(`Sample $vectorize content: ${allCards[0].$vectorize?.substring(0, 100)} ...`);
          
          // Log a few cards to check $vectorize field
          for (let i = 1; i <= 5; i++) {
            if (allCards[i]) {
              console.log(`Card ${i + 1} has $vectorize field: ${Boolean(allCards[i].$vectorize)}`);
            }
          }
        }
      }
      
      return allCards;
    } catch (error) {
      console.error("Error querying AstraDB:", error);
      return [];
    }
  } catch (error) {
    console.error("Error finding relevant credit cards:", error);
    return [];
  }
}

// Generate recommendations using OpenAI based on user profile and relevant cards
async function generateRecommendations(userProfile, creditCards) {
  try {
    console.log("Calling OpenAI API for credit card recommendations...");
    
    // Extract MITC content from each card
    const cardsWithTerms = creditCards.map(card => {
      const cardId = card._id;
      const cardType = card.type || "Unknown";
      const mitcContent = card.$vectorize || "No terms available";
      
      // Try to extract card name from MITC content if possible
      let cardName = "Unknown Card";
      if (mitcContent.includes("HDFC Bank")) {
        cardName = "HDFC Bank Credit Card";
      } else if (mitcContent.includes("Kotak")) {
        cardName = "Kotak Credit Card";
        // Check for specific Kotak cards
        if (mitcContent.includes("Kotak 811")) {
          cardName = "Kotak 811 Credit Card";
        } else if (mitcContent.includes("PVR")) {
          cardName = "Kotak PVR Credit Card";
        } else if (mitcContent.includes("Metro Kotak")) {
          cardName = "Metro Kotak Credit Card";
        } else if (mitcContent.includes("IndiGo Kotak")) {
          cardName = "IndiGo Kotak Credit Card";
        }
      } else if (mitcContent.includes("Indian Oil")) {
        cardName = "Indian Oil Credit Card";
      } else if (mitcContent.includes("World Safari")) {
        cardName = "World Safari Credit Card";
      }
      
      return {
        id: cardId,
        type: cardType,
        name: cardName,
        terms: mitcContent
      };
    });

    // Create a prompt for OpenAI
    const prompt = {
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: `You are a financial advisor specializing in credit card recommendations. 
          Your task is to analyze credit card terms and conditions fragments and match them with a user's financial profile.
          For each recommended card:
          1. EXTRACT THE CARD NAME: Look for brand names (HDFC, Kotak, etc.) and card types in the terms.
          2. FOCUS ON BENEFITS: Identify rewards, cashback, travel benefits, insurance, etc.
          3. PROVIDE A MATCH SCORE: Rate how well the card matches the user's profile (0-100%).
          4. HIGHLIGHT KEY FEATURES: Focus on user-friendly benefits, not legal terms.
          
          If the terms are too fragmentary to determine benefits, focus on what you can extract and be honest about limitations.`
        },
        {
          role: "user",
          content: `Please recommend the top 3 credit cards for this user based on their financial profile and the available credit card terms:
          
          # User Financial Profile
          ${JSON.stringify(userProfile, null, 2)}
          
          # Available Credit Card Terms
          ${cardsWithTerms.map((card, index) => 
            `Card ${index + 1} (ID: ${card.id}, Name: ${card.name}):
            ${card.terms.substring(0, 500)}...`
          ).join('\n\n')}
          
          For each recommendation, provide:
          1. Card Name (be specific if possible)
          2. Match Score (percentage)
          3. Key Benefits/Features (focus on rewards, cashback, travel benefits, etc.)
          4. Why this card is suitable for the user`
        }
      ]
    };

    const response = await openai.chat.completions.create(prompt);
    console.log("Received recommendations from OpenAI");
    return response.choices[0].message.content;
  } catch (error) {
    console.error("Error generating recommendations:", error);
    return "Failed to generate recommendations.";
  }
}

// Create a test financial profile
function createTestFinancialProfile() {
  return {
    annualIncome: 1200000,
    creditScore: 750,
    monthlySpending: new Map([
      ['groceries', 15000],
      ['dining', 8000],
      ['travel', 10000],
      ['shopping', 12000],
      ['utilities', 5000]
    ]),
    primarySpendingCategories: ['groceries', 'travel', 'dining'],
    travelFrequency: 'frequent',
    diningFrequency: 'regular',
    preferredBenefits: ['cashback', 'travel rewards', 'airport lounge access'],
    preferredAirlines: ['Air India', 'Vistara'],
    existingCards: ['HDFC Regalia', 'SBI SimplyClick'],
    shoppingHabits: {
      online: 70,
      inStore: 30
    }
  };
}

// Create mock credit card data
function createMockCreditCards() {
  console.log("Creating mock credit card data...");
  
  return [
    {
      id: "hdfc-regalia",
      cardName: "Regalia Credit Card",
      issuer: "HDFC Bank",
      cardType: "Travel",
      annualFee: 2500,
      rewardsRate: {
        "Travel": "5X Reward Points",
        "Dining": "5X Reward Points",
        "Shopping": "1X Reward Points"
      },
      signupBonus: "2,000 Reward Points on spending ₹5,000 in first 30 days",
      benefitsSummary: [
        "Complimentary airport lounge access",
        "Milestone benefits",
        "Fuel surcharge waiver",
        "Reward points on all spends"
      ],
      primaryBenefits: [
        "Airport lounge access",
        "Travel insurance",
        "Fuel surcharge waiver"
      ],
      creditScoreRequired: 750,
      minIncomeRequired: 1200000,
      feeWaiver: "Annual fee waived on spending ₹3,00,000 in previous year",
      foreignTransactionFee: "3.5% + GST",
      airportLoungeAccess: "8 complimentary visits per year to domestic and international lounges",
      golfPrivileges: "2 complimentary golf games per quarter",
      conciergeServices: true,
      complimentaryCards: 1,
      fuelSurcharge: "1% fuel surcharge waiver across all petrol pumps",
      mitc: `MOST IMPORTANT TERMS AND CONDITIONS - HDFC REGALIA CREDIT CARD
      
1. FEES AND CHARGES
a. Annual Membership Fee: ₹2,500 + applicable taxes
b. Annual Fee Waiver: On spending ₹3,00,000 in the previous year
c. Cash Advance Fee: 2.5% of the amount withdrawn (minimum ₹500)
d. Late Payment Fee: ₹700 for outstanding up to ₹10,000, ₹950 for outstanding between ₹10,001 and ₹25,000, ₹1,100 for outstanding above ₹25,000
e. Over Limit Fee: 2.5% of the over limit amount (minimum ₹500)
f. Foreign Currency Transaction Fee: 3.5% + GST

2. CREDIT AND CASH WITHDRAWAL LIMITS
a. Credit Limit: As communicated to the cardholder from time to time
b. Cash Withdrawal Limit: As communicated to the cardholder from time to time

3. BILLING
a. Billing Statement: Monthly statement sent on a pre-determined date
b. Payment Due Date: 18 days from the statement date
c. Minimum Amount Due: 5% of the total outstanding amount or ₹200, whichever is higher

4. REWARDS AND BENEFITS
a. Reward Points: 
   - 5X Reward Points on travel and dining spends
   - 1 Reward Point for every ₹150 spent on other categories
b. Airport Lounge Access: 8 complimentary visits per year (including add-on cards)
c. Golf Program: 2 complimentary golf games per quarter
d. Milestone Benefits: 10,000 bonus points on annual spends of ₹5,00,000
e. Fuel Surcharge Waiver: 1% fuel surcharge waiver on transactions between ₹400 and ₹5,000

5. INSURANCE BENEFITS
a. Air Accident Cover: ₹1 crore
b. Travel Insurance: 
   - Lost Card Liability: ₹3,00,000
   - Lost Baggage Cover: ₹1,00,000
   - Delayed Baggage Cover: ₹30,000
   - Loss of Passport Documents: ₹40,000
   - Missing of Connecting Flight: ₹10,000

6. ELIGIBILITY
a. Age: 21-65 years
b. Minimum Income: ₹12,00,000 per annum
c. Credit Score: 750 and above

7. INTEREST RATES
a. Interest-free Credit Period: Up to 50 days
b. Finance Charges: 3.49% per month (41.88% per annum)
c. Interest Calculation: Interest is charged from the date of transaction until the amount is paid in full

8. DEFAULT AND CIRCUMSTANCES
If payment is not made by the due date, interest will be charged at the applicable rate on all transactions from the date of transaction. In case of default, the bank may:
a. Report to credit bureaus
b. Call and remind cardholders through calls and SMS
c. Engage third party collection agencies
d. Legal action in case of non-payment

9. TERMINATION/REVOCATION OF CARD
a. By Cardholder: Can be terminated by calling customer care or submitting written request
b. By Bank: The bank may terminate the card if:
   - Payment is overdue
   - Card is used for prohibited purposes
   - Misleading information was provided during application

10. LOSS/THEFT OF CARD
a. Report immediately to customer care at 1800-266-3333
b. Cardholder's liability ceases once loss is reported

11. DISCLOSURE
Bank may disclose cardholder information to:
a. Credit bureaus
b. Regulatory authorities
c. Other banks and financial institutions
d. Service providers and merchants as necessary

For detailed terms and conditions, please visit www.hdfcbank.com`
    },
    {
      id: "sbi-card-elite",
      cardName: "SBI Card ELITE",
      issuer: "SBI Card",
      cardType: "Lifestyle",
      annualFee: 4999,
      rewardsRate: {
        "Dining": "5 Reward Points per ₹100",
        "Grocery": "5 Reward Points per ₹100",
        "Entertainment": "5 Reward Points per ₹100",
        "Other": "2 Reward Points per ₹100"
      },
      signupBonus: "5,000 Bonus Reward Points on payment of annual fee",
      benefitsSummary: [
        "Milestone benefits",
        "Dining privileges",
        "Movie ticket offers",
        "Fuel surcharge waiver"
      ],
      primaryBenefits: [
        "Dining discounts",
        "Entertainment offers",
        "Milestone rewards"
      ],
      creditScoreRequired: 720,
      minIncomeRequired: 900000,
      feeWaiver: "Annual fee waived on spending ₹4,00,000 in previous year",
      foreignTransactionFee: "3.5% + GST",
      airportLoungeAccess: "6 complimentary visits per year to domestic lounges",
      mitc: `MOST IMPORTANT TERMS AND CONDITIONS - SBI CARD ELITE

1. FEES AND CHARGES
a. Joining Fee: ₹4,999 + applicable taxes
b. Annual Fee: ₹4,999 + applicable taxes
c. Annual Fee Waiver: On spending ₹4,00,000 in the previous year
d. Cash Advance Fee: 2.5% of the amount withdrawn (minimum ₹500)
e. Late Payment Fee: ₹700 for outstanding up to ₹10,000, ₹950 for outstanding between ₹10,001 and ₹25,000, ₹1,100 for outstanding above ₹25,000
f. Over Limit Fee: 2.5% of the over limit amount (minimum ₹500)
g. Foreign Currency Transaction Fee: 3.5% + GST

2. CREDIT AND CASH WITHDRAWAL LIMITS
a. Credit Limit: As communicated to the cardholder from time to time
b. Cash Withdrawal Limit: Up to 30% of credit limit

3. BILLING
a. Billing Statement: Monthly statement sent on a pre-determined date
b. Payment Due Date: 18 days from the statement date
c. Minimum Amount Due: 5% of the total outstanding amount or ₹200, whichever is higher

4. REWARDS AND BENEFITS
a. Reward Points: 
   - 5 Reward Points per ₹100 spent on dining, grocery, and entertainment
   - 2 Reward Points per ₹100 spent on other categories
b. Welcome Benefit: 5,000 Bonus Reward Points on payment of annual fee
c. Airport Lounge Access: 6 complimentary visits per year to domestic lounges
d. Milestone Benefits: 10,000 bonus points on annual spends of ₹5,00,000
e. Fuel Surcharge Waiver: 1% fuel surcharge waiver on transactions between ₹500 and ₹3,000

5. DINING PRIVILEGES
a. Up to 15% discount at select restaurants
b. Buy 1 Get 1 movie ticket free on BookMyShow (up to 2 times per month)
c. Exclusive dining privileges at premium restaurants

6. ELIGIBILITY
a. Age: 21-65 years
b. Minimum Income: ₹9,00,000 per annum
c. Credit Score: 720 and above

7. INTEREST RATES
a. Interest-free Credit Period: Up to 50 days
b. Finance Charges: 3.35% per month (40.2% per annum)
c. Interest Calculation: Interest is charged from the date of transaction until the amount is paid in full

8. DEFAULT AND CIRCUMSTANCES
If payment is not made by the due date, interest will be charged at the applicable rate on all transactions from the date of transaction. In case of default, SBI Card may:
a. Report to credit bureaus
b. Call and remind cardholders through calls and SMS
c. Engage third party collection agencies
d. Legal action in case of non-payment

9. TERMINATION/REVOCATION OF CARD
a. By Cardholder: Can be terminated by calling customer care or submitting written request
b. By SBI Card: SBI Card may terminate the card if:
   - Payment is overdue
   - Card is used for prohibited purposes
   - Misleading information was provided during application

10. LOSS/THEFT OF CARD
a. Report immediately to customer care at 1860-180-1290
b. Cardholder's liability ceases once loss is reported

11. DISCLOSURE
SBI Card may disclose cardholder information to:
a. Credit bureaus
b. Regulatory authorities
c. Other banks and financial institutions
d. Service providers and merchants as necessary

For detailed terms and conditions, please visit www.sbicard.com`
    },
    {
      id: "icici-amazon-pay",
      cardName: "Amazon Pay ICICI Credit Card",
      issuer: "ICICI Bank",
      cardType: "Cashback",
      annualFee: 0,
      rewardsRate: {
        "Amazon": "5% cashback",
        "Amazon Prime": "5% cashback",
        "Pay Later": "2% cashback",
        "Other": "1% cashback"
      },
      signupBonus: "₹500 Amazon Pay balance on card approval",
      benefitsSummary: [
        "No annual fee",
        "Amazon-specific rewards",
        "No minimum transaction amount",
        "Fuel surcharge waiver"
      ],
      primaryBenefits: [
        "Amazon cashback",
        "No annual fee",
        "Fuel surcharge waiver"
      ],
      creditScoreRequired: 700,
      minIncomeRequired: 300000,
      foreignTransactionFee: "3.5% + GST",
      fuelSurcharge: "1% fuel surcharge waiver across all petrol pumps",
      mitc: `MOST IMPORTANT TERMS AND CONDITIONS - AMAZON PAY ICICI CREDIT CARD

1. FEES AND CHARGES
a. Joining Fee: NIL
b. Annual Fee: NIL
c. Cash Advance Fee: 2.5% of the amount withdrawn (minimum ₹500)
d. Late Payment Fee: ₹600 for outstanding up to ₹10,000, ₹800 for outstanding between ₹10,001 and ₹25,000, ₹1,000 for outstanding above ₹25,000
e. Over Limit Fee: 2.5% of the over limit amount (minimum ₹500)
f. Foreign Currency Transaction Fee: 3.5% + GST

2. CREDIT AND CASH WITHDRAWAL LIMITS
a. Credit Limit: As communicated to the cardholder from time to time
b. Cash Withdrawal Limit: Up to 30% of credit limit

3. BILLING
a. Billing Statement: Monthly statement sent on a pre-determined date
b. Payment Due Date: 18 days from the statement date
c. Minimum Amount Due: 5% of the total outstanding amount or ₹200, whichever is higher

4. REWARDS AND BENEFITS
a. Cashback: 
   - 5% cashback on Amazon.in shopping for Prime members
   - 3% cashback on Amazon.in shopping for non-Prime members
   - 2% cashback on payments made using Amazon Pay
   - 1% cashback on all other payments
b. Welcome Benefit: ₹500 Amazon Pay balance on card approval
c. Fuel Surcharge Waiver: 1% fuel surcharge waiver on transactions between ₹500 and ₹4,000

5. CASHBACK REDEMPTION
a. Cashback earned will be automatically credited to the Amazon Pay balance
b. No minimum threshold for cashback redemption
c. Cashback earned will be updated in the monthly statement

6. ELIGIBILITY
a. Age: 21-60 years
b. Minimum Income: ₹3,00,000 per annum
c. Credit Score: 700 and above

7. INTEREST RATES
a. Interest-free Credit Period: Up to 50 days
b. Finance Charges: 3.49% per month (41.88% per annum)
c. Interest Calculation: Interest is charged from the date of transaction until the amount is paid in full

8. DEFAULT AND CIRCUMSTANCES
If payment is not made by the due date, interest will be charged at the applicable rate on all transactions from the date of transaction. In case of default, ICICI Bank may:
a. Report to credit bureaus
b. Call and remind cardholders through calls and SMS
c. Engage third party collection agencies
d. Legal action in case of non-payment

9. TERMINATION/REVOCATION OF CARD
a. By Cardholder: Can be terminated by calling customer care or submitting written request
b. By ICICI Bank: ICICI Bank may terminate the card if:
   - Payment is overdue
   - Card is used for prohibited purposes
   - Misleading information was provided during application

10. LOSS/THEFT OF CARD
a. Report immediately to customer care at 1800-266-7777
b. Cardholder's liability ceases once loss is reported

11. DISCLOSURE
ICICI Bank may disclose cardholder information to:
a. Credit bureaus
b. Regulatory authorities
c. Other banks and financial institutions
d. Service providers and merchants as necessary

For detailed terms and conditions, please visit www.icicibank.com`
    }
  ];
}

// Main function to run the test
async function runTest() {
  let client;
  try {
    console.log("Starting MITC-based credit card recommendation test");
    
    // Connect to MongoDB
    const mongoUri = process.env.MONGODB_URI || "mongodb://localhost:27017/replitcc";
    console.log(`Connecting to MongoDB at ${mongoUri}`);
    client = new MongoClient(mongoUri);
    await client.connect();
    console.log("Connected to MongoDB successfully");
    
    // Find a user with a financial profile
    const db = client.db();
    const usersCollection = db.collection("users");
    const user = await usersCollection.findOne({ username: "dgagadaf" });
    
    if (!user || !user.financialProfile) {
      console.log("No user with financial profile found in MongoDB");
      return;
    }
    
    console.log(`Found user: ${user.username} with financial profile`);
    console.log("Financial Profile:", JSON.stringify(user.financialProfile, null, 2));
    
    // Find relevant credit cards
    const relevantCards = await findRelevantCreditCards(user.financialProfile);
    
    // Generate recommendations
    const recommendationsText = await generateRecommendations(user.financialProfile, relevantCards);
    
    // Display recommendations
    console.log("\n--- CREDIT CARD RECOMMENDATIONS ---\n");
    console.log(recommendationsText);
    
  } catch (error) {
    console.log("Test failed with error:", error);
  } finally {
    if (client) {
      await client.close();
      console.log("Disconnected from MongoDB");
    }
  }
}

// Run the test
runTest(); 