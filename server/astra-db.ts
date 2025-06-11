import { DataAPIClient } from "@datastax/astra-db-ts";
import * as dotenv from "dotenv";
import OpenAI from "openai";
import { ChatCompletionMessageParam } from "openai/resources";

// Load environment variables
dotenv.config();

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Define the interface for credit card data with vector fields
export interface CreditCardVectorData {
  id?: string;
  cardName?: string;
  issuer?: string;
  cardType?: string;
  annualFee?: number;
  rewardsRate?: Record<string, string>;
  signupBonus?: string;
  benefitsSummary?: string[];
  primaryBenefits?: string[];
  $vectorize?: string;
}

// Create Astra DB client
const createAstraClient = async () => {
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
    
    // Creating client using v2.0.1 API - use the approach that works in our test script
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

// Initialize the client - this is now async
let astraClient: Awaited<ReturnType<typeof createAstraClient>> | null = null;

// Initialize the client immediately if possible
(async () => {
  try {
    astraClient = await createAstraClient();
  } catch (err) {
    console.error("Failed to initialize AstraDB client:", err);
  }
})();

/**
 * Get relevant credit cards based on user financial profile
 */
export async function getRelevantCreditCards(
  profile: {
    annualIncome: number;
    creditScore: number;
    primarySpendingCategories: string[];
    travelFrequency: string;
    diningFrequency: string;
    preferredBenefits: string[];
  },
  limit: number = 15
): Promise<CreditCardVectorData[]> {
  // Try to initialize client if it's not already done
  if (!astraClient) {
    astraClient = await createAstraClient();
  }
  
  if (!astraClient) {
    console.error("AstraDB client not initialized");
    return [];
  }

  try {
    // Construct the vector query based on the user's profile
    const query = await buildQueryFromProfile(profile);
    
    // Get the collection from the established connection
    const collection = astraClient.collection;

    // Get top 15 similar cards using vector similarity search
    console.log("Querying AstraDB for credit cards...");
    const results = await collection.find({}, {
      sort: {
        $vector: query,
      },
      limit: limit,
      projection: { $vector: 0 }, // Exclude the vector from results
    });

    // Convert results to array
    const cards = await results.toArray();
    console.log(`Found ${cards.length} relevant credit cards from AstraDB`);
    
    // Type cast the results - we know the format should match
    return cards as unknown as CreditCardVectorData[];
  } catch (error) {
    console.error("Error querying AstraDB:", error);
    return [];
  }
}

/**
 * Get credit cards with MITC content from AstraDB
 * This function specifically requests the $vectorize field which contains MITC data
 */
export async function getCreditCardsWithMITC(limit: number = 20): Promise<CreditCardVectorData[]> {
  try {
    // Initialize AstraDB client
    const ASTRA_DB_ID = process.env.ASTRA_DB_ID;
    const ASTRA_DB_REGION = process.env.ASTRA_DB_REGION;
    const ASTRA_DB_TOKEN = process.env.ASTRA_DB_TOKEN;
    const ASTRA_DB_NAMESPACE = process.env.ASTRA_DB_NAMESPACE || "default_keyspace";
    const ASTRA_DB_COLLECTION = process.env.ASTRA_DB_COLLECTION || "cc_details";
    
    if (!ASTRA_DB_ID || !ASTRA_DB_REGION || !ASTRA_DB_TOKEN) {
      console.error("AstraDB environment variables not set properly");
      return [];
    }
    
    // Creating client using v2.0.1 API
    const client = new DataAPIClient();
    const endpoint = `https://${ASTRA_DB_ID}-${ASTRA_DB_REGION}.apps.astra.datastax.com`;
    const db = client.db(endpoint, { token: ASTRA_DB_TOKEN, keyspace: ASTRA_DB_NAMESPACE });
    
    // Get the collection
    const collection = await db.collection(ASTRA_DB_COLLECTION);
    
    // Query for documents with the $vectorize field
    const documents = await collection.find({}, { 
      projection: { _id: 1, type: 1, $vectorize: 1 } 
    }).limit(limit).toArray();
    
    console.log(`Found ${documents.length} documents with MITC content`);
    
    return documents as CreditCardVectorData[];
  } catch (error) {
    console.error("Error fetching credit cards with MITC:", error);
    return [];
  }
}

/**
 * Build a query vector from the user's financial profile
 * Uses OpenAI's embedding API to convert the profile into a vector
 */
async function buildQueryFromProfile(profile: any): Promise<number[]> {
  try {
    console.log("Creating embedding from user profile...");
    
    // Create a text representation of the user profile
    const profileText = `
      Financial Profile:
      Annual Income: ${profile.annualIncome}
      Credit Score: ${profile.creditScore}
      Primary Spending Categories: ${profile.primarySpendingCategories.join(', ')}
      Travel Frequency: ${profile.travelFrequency}
      Dining Frequency: ${profile.diningFrequency}
      Preferred Benefits: ${profile.preferredBenefits.join(', ')}
      
      I need credit cards that match this financial profile, focusing on:
      1. Cards that require a credit score at or below ${profile.creditScore}
      2. Cards that require annual income at or below ${profile.annualIncome}
      3. Cards with rewards for these spending categories: ${profile.primarySpendingCategories.join(', ')}
      4. Cards with these benefits: ${profile.preferredBenefits.join(', ')}
      5. Cards suitable for someone who travels ${profile.travelFrequency} and dines out ${profile.diningFrequency}
    `;

    // Call OpenAI embedding API
    const response = await openai.embeddings.create({
      model: "text-embedding-ada-002", // This should produce 1024-dimensional vectors
      input: profileText
    });
    
    // Extract the embedding vector
    const embedding = response.data[0].embedding;
    console.log(`Generated embedding vector of length ${embedding.length}`);
    
    return embedding;
  } catch (error) {
    console.error("Error generating embedding:", error);
    
    // Fallback to mock vector if embedding fails
    console.log("Falling back to mock vector");
    return Array(1536).fill(0).map(() => Math.random() - 0.5);
  }
}

// Create a prompt for OpenAI
const messages: ChatCompletionMessageParam[] = [
  {
    role: "system",
    content: `You are a financial advisor specializing in credit card recommendations. 
    Your task is to analyze credit card terms and conditions fragments and match them with a user's financial profile.
    For each recommended card:
    1. EXTRACT THE CARD NAME: Look for brand names (HDFC, Kotak, etc.) and card types in the terms.
    2. FOCUS ON BENEFITS: Identify rewards, cashback, travel benefits, insurance, etc.
    3. PROVIDE A MATCH SCORE: Rate how well the card matches the user's profile (0-100%).
    4. HIGHLIGHT KEY FEATURES: Focus on user-friendly benefits, not legal terms.
    
    If the terms are too fragmentary to determine benefits, focus on what you can extract and be honest about limitations.
    
    Return credit card recommendations formatted as a JSON array with objects containing:
    - cardName: The name of the card
    - issuer: The bank/issuer
    - cardType: The type of card (e.g., Travel, Cashback, Rewards)
    - annualFee: The annual fee (use 0 if unknown)
    - rewardsRate: An object mapping categories to reward rates (e.g., {"Dining": "5%", "Travel": "3x points"})
    - benefitsSummary: An array of benefit summaries
    - primaryBenefits: An array of primary benefits
    - matchScore: A number from 0-100 indicating match quality
    - matchReason: A detailed explanation of why this card matches the user's profile`
  },
  {
    role: "user",
    content: "This will be replaced with the actual user prompt"
  }
];

// Add this function to generate MITC-based recommendations
export async function generateMITCBasedRecommendations(
  profile: {
    userId: number;
    annualIncome: number;
    creditScore: number;
    monthlySpending: Record<string, number>;
    primarySpendingCategories: string[];
    travelFrequency: string;
    diningFrequency: string;
    preferredBenefits: string[];
    preferredAirlines?: string[];
    existingCards?: string[];
    shoppingHabits?: { online: number; inStore: number };
  },
  limit: number = 5
): Promise<any[]> {
  try {
    // Get credit cards with MITC content
    const cards = await getCreditCardsWithMITC(20);
    
    if (cards.length === 0) {
      console.log("No cards with MITC content found");
      return [];
    }
    
    console.log(`Found ${cards.length} cards with MITC content for recommendation`);
    
    // Format shopping habits
    const shoppingHabitsText = profile.shoppingHabits
      ? `${profile.shoppingHabits.online}% online, ${profile.shoppingHabits.inStore}% in-store`
      : 'Not specified';
    
    // Format monthly spending
    const formattedSpending = Object.entries(profile.monthlySpending || {}).map(([category, amount]) => 
      `${category}: ₹${amount.toLocaleString()}`
    ).join(', ');
    
    // Extract MITC content from each card
    const cardsWithTerms = cards.map(card => {
      // Use type assertion for properties that might not be in the type definition
      const cardData = card as CreditCardVectorData & { _id?: string; type?: string; $vectorize?: string };
      const cardId = cardData.id || cardData._id || "";
      const cardType = cardData.cardType || cardData.type || "Credit Card";
      const mitcContent = cardData.$vectorize || "No terms available";
      
      return {
        id: cardId,
        type: cardType,
        name: cardData.cardName || "Credit Card",
        issuer: cardData.issuer || "Unknown",
        terms: mitcContent
      };
    });
    
    // Create a prompt for OpenAI with properly typed messages
    const promptMessages: ChatCompletionMessageParam[] = [
      {
        role: "system",
        content: `You are a financial advisor specializing in credit card recommendations. 
        Your task is to analyze credit card terms and conditions fragments and match them with a user's financial profile.
        For each recommended card:
        1. EXTRACT THE CARD NAME: Look for brand names (HDFC, Kotak, etc.) and card types in the terms.
        2. FOCUS ON BENEFITS: Identify rewards, cashback, travel benefits, insurance, etc.
        3. PROVIDE A MATCH SCORE: Rate how well the card matches the user's profile (0-100%).
        4. HIGHLIGHT KEY FEATURES: Focus on user-friendly benefits, not legal terms.
        
        If the terms are too fragmentary to determine benefits, focus on what you can extract and be honest about limitations.
        
        Return EXACTLY ${limit} credit card recommendations formatted as a JSON array with objects containing:
        - cardName: The name of the card
        - issuer: The bank/issuer
        - cardType: The type of card (e.g., Travel, Cashback, Rewards)
        - annualFee: The annual fee (use 0 if unknown)
        - rewardsRate: An object mapping categories to reward rates (e.g., {"Dining": "5%", "Travel": "3x points"})
        - benefitsSummary: An array of benefit summaries
        - primaryBenefits: An array of primary benefits
        - matchScore: A number from 0-100 indicating match quality
        - matchReason: A detailed explanation of why this card matches the user's profile`
      },
      {
        role: "user",
        content: `Please recommend the top ${limit} credit cards for this user based on their financial profile and the available credit card terms:
        
        # User Financial Profile
        - Annual Income: ₹${profile.annualIncome.toLocaleString()}
        - Credit Score: ${profile.creditScore}
        - Monthly Spending Breakdown: ${formattedSpending}
        - Top Spending Categories: ${profile.primarySpendingCategories.join(', ')}
        - Travel Frequency: ${profile.travelFrequency}
        - Dining Frequency: ${profile.diningFrequency}
        - Shopping Habits: ${shoppingHabitsText}
        - Preferred Benefits: ${profile.preferredBenefits.join(', ')}
        ${profile.preferredAirlines && profile.preferredAirlines.length > 0 ? `- Preferred Airlines: ${profile.preferredAirlines.join(', ')}` : ''}
        ${profile.existingCards && profile.existingCards.length > 0 ? `- Existing Cards: ${profile.existingCards.join(', ')}` : ''}
        
        # Available Credit Card Terms
        ${cardsWithTerms.map((card, index) => 
          `Card ${index + 1} (ID: ${card.id}, Name: ${card.name}, Issuer: ${card.issuer}):
          ${card.terms.substring(0, 500)}...`
        ).join('\n\n')}
        
        For each recommendation, provide:
        1. Card Name (be specific if possible)
        2. Issuer (bank or financial institution)
        3. Card Type (e.g., Travel, Cashback, Rewards)
        4. Annual Fee (use 0 if unknown)
        5. Rewards Rate (as an object mapping categories to rates)
        6. Benefits Summary (array of benefits)
        7. Primary Benefits (array of key benefits)
        8. Match Score (percentage)
        9. Match Reason (why this card is suitable for the user)
        
        Return the recommendations as a JSON array.`
      }
    ];
    
    // Call OpenAI API
    console.log("Calling OpenAI API for MITC-based credit card recommendations");
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: promptMessages,
      temperature: 0.3,
      response_format: { type: "json_object" }
    });
    
    // Process the response
    const content = response.choices[0]?.message?.content || "{}";
    console.log("Received response from OpenAI");
    
    try {
      // Parse the response
      const jsonContent = content.replace(/```json\s+|\s+```|```/g, '');
      let parsedResponse = JSON.parse(jsonContent);
      
      // Handle different response formats
      let recommendations = [];
      if (Array.isArray(parsedResponse)) {
        recommendations = parsedResponse;
      } else if (parsedResponse.recommendations && Array.isArray(parsedResponse.recommendations)) {
        recommendations = parsedResponse.recommendations;
      } else {
        recommendations = [parsedResponse];
      }
      
      // Format recommendations for storage
      const formattedRecommendations = recommendations.slice(0, limit).map((rec: {
        cardName?: string;
        issuer?: string;
        cardType?: string;
        annualFee?: number;
        rewardsRate?: Record<string, string>;
        signupBonus?: string;
        benefitsSummary?: string[];
        primaryBenefits?: string[];
        matchScore?: number;
        matchReason?: string;
      }) => ({
        userId: profile.userId,
        cardName: rec.cardName || "Unknown Card",
        issuer: rec.issuer || "Unknown Issuer",
        cardType: rec.cardType || "Credit Card",
        annualFee: String(rec.annualFee || 0), // Convert to string to match schema
        rewardsRate: rec.rewardsRate || {},
        signupBonus: rec.signupBonus || null,
        benefitsSummary: rec.benefitsSummary || [],
        primaryBenefits: rec.primaryBenefits || [],
        matchScore: rec.matchScore || 0,
        matchReason: rec.matchReason || "This card may match your profile."
      }));
      
      console.log(`Generated ${formattedRecommendations.length} MITC-based credit card recommendations`);
      return formattedRecommendations;
    } catch (parseError) {
      console.error("Error parsing OpenAI response:", parseError);
      return [];
    }
  } catch (error) {
    console.error("Error generating MITC-based recommendations:", error);
    return [];
  }
}

export default {
  getRelevantCreditCards,
  getCreditCardsWithMITC,
  generateMITCBasedRecommendations
}; 