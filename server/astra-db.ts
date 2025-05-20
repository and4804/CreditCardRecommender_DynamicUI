import { DataAPIClient } from "@datastax/astra-db-ts";
import dotenv from "dotenv";
import OpenAI from "openai";

// Load environment variables
dotenv.config();

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Define the credit card type that matches your vector database schema
export interface CreditCardVectorData {
  id: string;
  cardName: string;
  issuer: string;
  cardType: string;
  annualFee: number;
  rewardsRate: Record<string, string>;
  signupBonus?: string;
  benefitsSummary: string[];
  primaryBenefits: string[];
  creditScoreRequired: number;
  minIncomeRequired: number;
  feeWaiver?: string;
  foreignTransactionFee?: string;
  insuranceCoverage?: string[];
  airportLoungeAccess?: string;
  golfPrivileges?: string;
  conciergeServices?: boolean;
  complimentaryCards?: number;
  fuelSurcharge?: string;
  emiOptions?: string;
  categorySpecificRewards?: Record<string, string>;
  mitc?: string; // Most Important Terms and Conditions URL or content
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
      model: "text-embedding-3-small",
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

export default {
  getRelevantCreditCards
}; 