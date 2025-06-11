import { Pinecone } from '@pinecone-database/pinecone';
import OpenAI from 'openai';
import * as fs from 'fs';
import * as path from 'path';

// Initialize OpenAI for embeddings
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Initialize Pinecone
let pinecone: Pinecone;

const initializePinecone = async () => {
  if (!pinecone) {
    pinecone = new Pinecone({
      apiKey: process.env.PINECONE_API_KEY!,
    });
  }
  return pinecone;
};

export interface CreditCardMITC {
  id: string;
  cardName: string;
  issuer: string;
  cardType: string;
  annualFee: number;
  rewardsRate: Record<string, string>;
  signupBonus?: string;
  benefitsSummary: string[];
  primaryBenefits: string[];
  mitcContent: string;
  matchScore?: number;
  matchReason?: string;
}

/**
 * Create Pinecone index for credit card MITC documents
 */
export async function createPineconeIndex(): Promise<void> {
  try {
    const pc = await initializePinecone();
    const indexName = process.env.PINECONE_INDEX_NAME || 'credit-cards-mitc';
    
    console.log(`🔧 Creating Pinecone index: ${indexName}`);
    
    // Check if index already exists
    const existingIndexes = await pc.listIndexes();
    const indexExists = existingIndexes.indexes?.some(index => index.name === indexName);
    
    if (indexExists) {
      console.log(`✅ Index ${indexName} already exists`);
      return;
    }
    
    // Create new index with 1536 dimensions (OpenAI text-embedding-ada-002)
    await pc.createIndex({
      name: indexName,
      dimension: 1536,
      metric: 'cosine',
      spec: {
        serverless: {
          cloud: 'aws',
          region: 'us-east-1'
        }
      }
    });
    
    console.log(`✅ Successfully created Pinecone index: ${indexName}`);
    
    // Wait for index to be ready
    console.log('⏳ Waiting for index to be ready...');
    await new Promise(resolve => setTimeout(resolve, 10000));
    
  } catch (error) {
    console.error('❌ Error creating Pinecone index:', error);
    throw error;
  }
}

/**
 * Generate embedding for text using OpenAI
 */
async function generateEmbedding(text: string): Promise<number[]> {
  try {
    const response = await openai.embeddings.create({
      model: "text-embedding-ada-002",
      input: text
    });
    
    return response.data[0].embedding;
  } catch (error) {
    console.error('❌ Error generating embedding:', error);
    throw error;
  }
}

/**
 * Upload MITC document to Pinecone
 */
export async function uploadMITCToPinecone(mitcData: CreditCardMITC): Promise<void> {
  try {
    const pc = await initializePinecone();
    const indexName = process.env.PINECONE_INDEX_NAME || 'credit-cards-mitc';
    const index = pc.index(indexName);
    
    console.log(`📤 Uploading MITC for ${mitcData.cardName} to Pinecone...`);
    
    // Generate embedding for the MITC content
    const embedding = await generateEmbedding(mitcData.mitcContent);
    
    // Prepare metadata (Pinecone has limits on metadata size)
    const metadata = {
      cardName: mitcData.cardName,
      issuer: mitcData.issuer,
      cardType: mitcData.cardType,
      annualFee: mitcData.annualFee,
      rewardsRate: JSON.stringify(mitcData.rewardsRate),
      signupBonus: mitcData.signupBonus || '',
      benefitsSummary: mitcData.benefitsSummary.join(' | ').substring(0, 1000), // Limit size
      primaryBenefits: mitcData.primaryBenefits.join(' | ').substring(0, 500),
      mitcContent: mitcData.mitcContent.substring(0, 2000) // Limit MITC content size
    };
    
    // Upload to Pinecone
    await index.upsert([{
      id: mitcData.id,
      values: embedding,
      metadata: metadata
    }]);
    
    console.log(`✅ Successfully uploaded ${mitcData.cardName} to Pinecone`);
    
  } catch (error) {
    console.error(`❌ Error uploading MITC to Pinecone:`, error);
    throw error;
  }
}

/**
 * Search for relevant credit cards based on user profile
 */
export async function searchRelevantCards(
  userProfile: {
    annualIncome: number;
    creditScore: number;
    primarySpendingCategories: string[];
    travelFrequency: string;
    diningFrequency: string;
    preferredBenefits: string[];
  },
  topK: number = 10
): Promise<CreditCardMITC[]> {
  try {
    const pc = await initializePinecone();
    const indexName = process.env.PINECONE_INDEX_NAME || 'credit-cards-mitc';
    const index = pc.index(indexName);
    
    console.log(`🔍 Searching for relevant credit cards in Pinecone with topK: ${topK}...`);
    
    // Create a more generic search query to get all cards
    const searchQuery = `
      Credit card terms and conditions for Indian credit cards.
      Looking for credit cards with benefits, rewards, and features.
      Annual income ${userProfile.annualIncome}, credit score ${userProfile.creditScore}.
      Interested in ${userProfile.primarySpendingCategories.join(', ')} spending.
      Travel frequency: ${userProfile.travelFrequency}, dining frequency: ${userProfile.diningFrequency}.
      Preferred benefits: ${userProfile.preferredBenefits.join(', ')}.
    `;
    
    // Generate embedding for search query
    const queryEmbedding = await generateEmbedding(searchQuery);
    
    // Search Pinecone with higher topK to get more results and lower similarity threshold
    const searchResults = await index.query({
      vector: queryEmbedding,
      topK: Math.max(topK, 15), // Get more results
      includeMetadata: true,
      // Remove any similarity filtering to get all available cards
    });
    
    console.log(`📊 Pinecone returned ${searchResults.matches?.length || 0} matches`);
    
    // Log the similarity scores to see if cards are being filtered out
    searchResults.matches?.forEach((match, i) => {
      console.log(`  ${i + 1}. ${match.metadata?.cardName || 'Unknown'} - Score: ${match.score?.toFixed(4)}`);
    });
    
    // Convert ALL results to CreditCardMITC format (don't filter by score)
    const relevantCards: CreditCardMITC[] = (searchResults.matches || []).map((match, index) => {
      const metadata = match.metadata as any;
      
      return {
        id: match.id,
        cardName: metadata.cardName || `Credit Card ${index + 1}`,
        issuer: metadata.issuer || 'Unknown Bank',
        cardType: metadata.cardType || 'General',
        annualFee: metadata.annualFee || 0,
        rewardsRate: metadata.rewardsRate ? JSON.parse(metadata.rewardsRate) : { general: '1% cashback' },
        signupBonus: metadata.signupBonus || '',
        benefitsSummary: metadata.benefitsSummary ? metadata.benefitsSummary.split(' | ') : [],
        primaryBenefits: metadata.primaryBenefits ? metadata.primaryBenefits.split(' | ') : [],
        mitcContent: metadata.mitcContent || 'No MITC content available'
      };
    });
    
    console.log(`✅ Processed ${relevantCards.length} relevant cards from Pinecone`);
    
    return relevantCards;
    
  } catch (error) {
    console.error('❌ Error searching Pinecone:', error);
    return [];
  }
}

/**
 * Clean OpenAI response by removing markdown code blocks
 */
function cleanOpenAIResponse(content: string): string {
  // Remove all backticks and the word "json"
  let cleaned = content.replace(/`/g, '').replace(/json/gi, '').trim();

  // Find the first { and the last } to extract the JSON object
  const firstBrace = cleaned.indexOf('{');
  const lastBrace = cleaned.lastIndexOf('}');
  if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
    cleaned = cleaned.substring(firstBrace, lastBrace + 1);
  }

  // Final trim to remove any whitespace/newlines
  return cleaned.trim();
}

/**
 * Generate recommendations using Pinecone + OpenAI
 */
export async function generatePineconeRecommendations(
  userProfile: {
    userId?: string;
    annualIncome: number;
    creditScore: number;
    primarySpendingCategories: string[];
    travelFrequency: string;
    diningFrequency: string;
    preferredBenefits: string[];
    monthlySpending: Record<string, number>;
  },
  limit: number = 7
): Promise<any[]> {
  try {
    console.log(`🎯 Generating Pinecone-based recommendations for user ${userProfile.userId} with limit: ${limit}`);
    
    // Get ALL cards from Pinecone instead of using similarity search
    const relevantCards = await getAllCardsFromPinecone();
    
    console.log(`📊 Retrieved ${relevantCards.length} cards from Pinecone search:`);
    relevantCards.forEach((card, i) => {
      console.log(`  ${i + 1}. ${card.cardName} (${card.issuer}) - ${card.cardType}`);
    });
    
    if (relevantCards.length === 0) {
      console.log('❌ No relevant cards found in Pinecone');
      return [];
    }
    
    // Process each card individually to get match scores
    const recommendations: any[] = [];
    
    for (const card of relevantCards) {
      try {
        const prompt = `
        Analyze this credit card for the given user profile and provide a match score, reason, and EXTRACT THE REAL CARD NAME from the MITC content:
        
        User Profile:
        - Annual Income: ₹${userProfile.annualIncome.toLocaleString()}
        - Credit Score: ${userProfile.creditScore}
        - Primary Spending Categories: ${userProfile.primarySpendingCategories.join(', ')}
        - Travel Frequency: ${userProfile.travelFrequency}
        - Dining Frequency: ${userProfile.diningFrequency}
        - Preferred Benefits: ${userProfile.preferredBenefits.join(', ')}
        - Monthly Spending: ${JSON.stringify(userProfile.monthlySpending)}
        
        Credit Card Information:
        - Current Name (from filename): ${card.cardName}
        - Issuer: ${card.issuer}
        - Type: ${card.cardType}
        - Annual Fee: ₹${card.annualFee}
        - Rewards: ${JSON.stringify(card.rewardsRate)}
        - Benefits: ${card.benefitsSummary.join(', ')}
        - Primary Benefits: ${card.primaryBenefits.join(', ')}
        - MITC Content: ${card.mitcContent.substring(0, 1000)}...
        
        IMPORTANT: Extract the ACTUAL credit card name from the MITC content. Look for:
        - Bank name + card type (e.g., "HDFC Regalia Credit Card", "SBI SimplyCLICK", "ICICI Amazon Pay")
        - Specific product names mentioned in the terms
        - Brand names and card series
        
        If you cannot find a specific card name in the MITC content, use the bank name + "Credit Card".
        
        Provide a JSON response with:
        {
          "actualCardName": "extracted real card name from MITC content",
          "issuer": "bank or financial institution name",
          "matchScore": number (0-100),
          "matchReason": "detailed explanation of why this card matches the user's profile"
        }
        `;
        
        const response = await openai.chat.completions.create({
          model: 'gpt-4o',
          messages: [{ role: 'user', content: prompt }],
          temperature: 0.3,
          max_tokens: 500
        });
        
        const content = response.choices[0]?.message?.content;
        if (content) {
          try {
            // Clean the response to remove markdown code blocks
            const cleanedContent = cleanOpenAIResponse(content);
            console.log(`🔍 Processing ${card.cardName}:`);
            console.log(`   Raw content: ${content.substring(0, 100)}...`);
            console.log(`   Cleaned content: ${cleanedContent.substring(0, 100)}...`);
            
            const analysis = JSON.parse(cleanedContent);
            
            recommendations.push({
              cardName: analysis.actualCardName || card.cardName,
              issuer: analysis.issuer || card.issuer,
              cardType: card.cardType,
              annualFee: card.annualFee,
              rewardsRate: card.rewardsRate,
              signupBonus: card.signupBonus,
              benefitsSummary: card.benefitsSummary,
              primaryBenefits: card.primaryBenefits,
              matchScore: analysis.matchScore,
              matchReason: analysis.matchReason
            });
            
            console.log(`✅ Processed ${analysis.actualCardName || card.cardName} - Score: ${analysis.matchScore}`);
          } catch (parseError) {
            console.error(`❌ JSON Parse Error for ${card.cardName}:`, parseError instanceof Error ? parseError.message : String(parseError));
            console.error(`   Raw content: "${content}"`);
            console.error(`   Cleaned content: "${cleanOpenAIResponse(content)}"`);
            
            // Add card with default score if JSON parsing fails
            recommendations.push({
              cardName: card.cardName,
              issuer: card.issuer,
              cardType: card.cardType,
              annualFee: card.annualFee,
              rewardsRate: card.rewardsRate,
              signupBonus: card.signupBonus,
              benefitsSummary: card.benefitsSummary,
              primaryBenefits: card.primaryBenefits,
              matchScore: 50,
              matchReason: 'Card analysis failed due to JSON parsing error'
            });
          }
        }
      } catch (error) {
        console.error(`❌ Error processing card ${card.cardName}:`, error);
        // Add card with default score if OpenAI fails
        recommendations.push({
          cardName: card.cardName,
          issuer: card.issuer,
          cardType: card.cardType,
          annualFee: card.annualFee,
          rewardsRate: card.rewardsRate,
          signupBonus: card.signupBonus,
          benefitsSummary: card.benefitsSummary,
          primaryBenefits: card.primaryBenefits,
          matchScore: 50,
          matchReason: 'Card analysis failed, but card is relevant based on search'
        });
      }
    }
    
    // Sort by match score and return top recommendations
    const sortedRecommendations = recommendations
      .sort((a, b) => b.matchScore - a.matchScore)
      .slice(0, limit);
    
    console.log(`🎯 Generated ${sortedRecommendations.length} Pinecone-based recommendations`);
    
    return sortedRecommendations;
    
  } catch (error) {
    console.error('❌ Error generating Pinecone recommendations:', error);
    return [];
  }
}

/**
 * Test Pinecone connection and index status
 */
export async function testPineconeConnection(): Promise<{ success: boolean; message: string; stats?: any }> {
  try {
    const pc = await initializePinecone();
    const indexName = process.env.PINECONE_INDEX_NAME || 'credit-cards-mitc';
    
    // Check if index exists
    const existingIndexes = await pc.listIndexes();
    const indexExists = existingIndexes.indexes?.some(index => index.name === indexName);
    
    if (!indexExists) {
      return {
        success: false,
        message: `Index ${indexName} does not exist. Please create it first.`
      };
    }
    
    // Get index stats
    const index = pc.index(indexName);
    const stats = await index.describeIndexStats();
    
    return {
      success: true,
      message: `Successfully connected to Pinecone index: ${indexName}`,
      stats: stats
    };
    
  } catch (error) {
    return {
      success: false,
      message: `Failed to connect to Pinecone: ${error}`
    };
  }
}

// Add this new function to get all cards from Pinecone
export async function getAllCardsFromPinecone(): Promise<CreditCardMITC[]> {
  try {
    const pc = await initializePinecone();
    const indexName = process.env.PINECONE_INDEX_NAME || 'credit-cards-mitc';
    const index = pc.index(indexName);
    
    console.log(`🔍 Getting ALL cards from Pinecone...`);
    
    // Use a very generic query to get all cards
    const genericQuery = "credit card";
    const queryEmbedding = await generateEmbedding(genericQuery);
    
    // Search with high topK to get all records
    const searchResults = await index.query({
      vector: queryEmbedding,
      topK: 20, // Get all possible records
      includeMetadata: true
    });
    
    console.log(`📊 Pinecone returned ${searchResults.matches?.length || 0} total matches`);
    
    // Log all cards found
    searchResults.matches?.forEach((match, i) => {
      console.log(`  ${i + 1}. ID: ${match.id} | ${match.metadata?.cardName || 'Unknown'} | Score: ${match.score?.toFixed(4)}`);
    });
    
    // Convert ALL results to CreditCardMITC format
    const allCards: CreditCardMITC[] = (searchResults.matches || []).map((match, index) => {
      const metadata = match.metadata as any;
      
      return {
        id: match.id,
        cardName: metadata.cardName || `Credit Card ${index + 1}`,
        issuer: metadata.issuer || 'Unknown Bank',
        cardType: metadata.cardType || 'General',
        annualFee: metadata.annualFee || 0,
        rewardsRate: metadata.rewardsRate ? JSON.parse(metadata.rewardsRate) : { general: '1% cashback' },
        signupBonus: metadata.signupBonus || '',
        benefitsSummary: metadata.benefitsSummary ? metadata.benefitsSummary.split(' | ') : [],
        primaryBenefits: metadata.primaryBenefits ? metadata.primaryBenefits.split(' | ') : [],
        mitcContent: metadata.mitcContent || 'No MITC content available'
      };
    });
    
    console.log(`✅ Retrieved ${allCards.length} total cards from Pinecone`);
    
    return allCards;
    
  } catch (error) {
    console.error('❌ Error getting all cards from Pinecone:', error);
    return [];
  }
} 