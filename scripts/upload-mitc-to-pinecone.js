import dotenv from 'dotenv';
import { Pinecone } from '@pinecone-database/pinecone';
import OpenAI from 'openai';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';

// Load environment variables
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Initialize OpenAI for embeddings
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Initialize Pinecone
const pc = new Pinecone({
  apiKey: process.env.PINECONE_API_KEY,
});

const INDEX_NAME = process.env.PINECONE_INDEX_NAME || 'mitc-cards';

/**
 * Extract actual text content from PDF file using system pdftotext command
 */
async function extractTextFromPDF(pdfPath) {
  try {
    console.log(`📖 Extracting text from: ${path.basename(pdfPath)}`);
    
    // Use system pdftotext command to extract text
    const command = `pdftotext "${pdfPath}" -`;
    const extractedText = execSync(command, { encoding: 'utf8' });
    
    console.log(`✅ Extracted ${extractedText.length} characters from ${path.basename(pdfPath)}`);
    
    if (extractedText.length < 100) {
      throw new Error(`PDF text extraction failed or file is too short (${extractedText.length} characters)`);
    }
    
    return extractedText.trim();
    
  } catch (error) {
    console.error(`❌ Error extracting text from PDF:`, error);
    throw error;
  }
}

/**
 * Extract card information from MITC content using OpenAI
 */
async function extractCardInfoFromContent(content, filename) {
  try {
    // Truncate content to fit within token limits (roughly 4000 characters = ~1000 tokens)
    const truncatedContent = content.substring(0, 4000);
    
    const prompt = `
    Analyze this MITC (Most Important Terms and Conditions) content and extract key credit card information:
    
    Filename: ${filename}
    Content: ${truncatedContent}
    
    Extract and return ONLY a valid JSON object with:
    {
      "cardName": "specific credit card name (e.g., HDFC Regalia, SBI Elite, ICICI Amazon Pay)",
      "issuer": "bank or financial institution name",
      "cardType": "type of card (Travel, Cashback, Rewards, Premium, etc.)",
      "annualFee": "annual fee amount in rupees (number only, 0 if free)",
      "keyBenefits": ["list", "of", "key", "benefits"],
      "rewardsStructure": "brief description of rewards/cashback structure"
    }
    
    Focus on extracting the actual card name mentioned in the content, not just the filename.
    Return ONLY the JSON object, no additional text or explanation.
    `;
    
    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.1,
      max_tokens: 500
    });
    
    const content_response = response.choices[0]?.message?.content;
    if (content_response) {
      try {
        // Clean the response more thoroughly
        let cleaned = content_response.trim();
        
        // Remove markdown code blocks
        cleaned = cleaned.replace(/```json\n?/g, '').replace(/```\n?/g, '');
        
        // Find JSON object in the response
        const jsonStart = cleaned.indexOf('{');
        const jsonEnd = cleaned.lastIndexOf('}') + 1;
        
        if (jsonStart !== -1 && jsonEnd > jsonStart) {
          cleaned = cleaned.substring(jsonStart, jsonEnd);
        }
        
        return JSON.parse(cleaned);
      } catch (parseError) {
        console.error('❌ Error parsing OpenAI response:', parseError);
        console.log('📄 Raw response:', content_response.substring(0, 200) + '...');
        
        // Return fallback data based on filename
        const fallbackName = filename.replace(/[-_]/g, ' ').replace('.pdf', '').replace(/\b\w/g, l => l.toUpperCase());
        return {
          cardName: fallbackName,
          issuer: 'Unknown Bank',
          cardType: 'Credit Card',
          annualFee: 0,
          keyBenefits: ['Credit facility', 'EMI options'],
          rewardsStructure: 'Standard rewards program'
        };
      }
    }
    
    return null;
  } catch (error) {
    console.error('❌ Error extracting card info with OpenAI:', error);
    return null;
  }
}

/**
 * Process all MITC PDFs and upload to Pinecone
 */
async function processMITCPDFs() {
  try {
    const indexName = INDEX_NAME;
    console.log(`🚀 Starting MITC PDF processing for index: ${indexName}`);
    
    // Check if index exists, create if it doesn't
    console.log('🔍 Checking if Pinecone index exists...');
    try {
      const indexList = await pc.listIndexes();
      const indexExists = indexList.indexes?.some(idx => idx.name === indexName);
      
      if (!indexExists) {
        console.log(`📝 Creating new Pinecone index: ${indexName}`);
        await pc.createIndex({
          name: indexName,
          dimension: 1536, // OpenAI embedding dimension
          metric: 'cosine',
          spec: {
            serverless: {
              cloud: 'aws',
              region: 'us-east-1'
            }
          }
        });
        console.log(`✅ Created new index: ${indexName}`);
        
        // Wait for index to be ready
        console.log('⏳ Waiting for index to be ready...');
        await new Promise(resolve => setTimeout(resolve, 30000)); // Wait 30 seconds
      } else {
        console.log(`✅ Index ${indexName} already exists`);
      }
    } catch (indexError) {
      console.error('❌ Error checking/creating index:', indexError);
      throw indexError;
    }
    
    // Connect to the index
    const index = pc.index(indexName);
    
    // Get initial index stats
    try {
      const initialStats = await index.describeIndexStats();
      console.log(`📊 Initial index stats: ${initialStats.totalVectorCount || 0} vectors`);
    } catch (statsError) {
      console.log('⚠️ Could not get initial stats (index might still be initializing)');
    }
    
    // Process PDF files from MITCs docs folder
    const mitcFolder = path.join(process.cwd(), 'MITCs docs');
    
    if (!fs.existsSync(mitcFolder)) {
      throw new Error(`MITCs docs folder not found at: ${mitcFolder}`);
    }
    
    const files = fs.readdirSync(mitcFolder).filter(file => file.endsWith('.pdf'));
    
    if (files.length === 0) {
      console.log('⚠️ No PDF files found in MITCs docs folder');
      return;
    }
    
    console.log(`📄 Found ${files.length} MITC PDF files:`);
    files.forEach(file => console.log(`  - ${file}`));
    
    // Process each PDF file
    for (const file of files) {
      const filePath = path.join(mitcFolder, file);
      console.log(`\n📖 Processing: ${file}`);
      
      try {
        // Extract text content from PDF
        const extractedContent = await extractTextFromPDF(filePath);
        
        // Extract card information using OpenAI
        const cardInfo = await extractCardInfoFromContent(extractedContent, file);
        
        // Create card data
        const cardData = {
          id: file.replace('.pdf', '').toLowerCase().replace(/[^a-z0-9]/g, '-'),
          cardName: cardInfo?.cardName || file.replace('.pdf', '').replace(/[-_]/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
          issuer: cardInfo?.issuer || 'Unknown Bank',
          cardType: cardInfo?.cardType || 'Credit Card',
          annualFee: cardInfo?.annualFee || 0,
          rewardsRate: { general: cardInfo?.rewardsStructure || 'Standard rewards' },
          signupBonus: '',
          benefitsSummary: cardInfo?.keyBenefits || ['Standard credit card benefits'],
          primaryBenefits: cardInfo?.keyBenefits?.slice(0, 3) || ['Credit facility'],
          mitcContent: extractedContent,
          fileName: file,
          extractedAt: new Date().toISOString()
        };
        
        console.log(`📝 Card identified as: ${cardData.cardName} (${cardData.issuer})`);
        
        // Generate embedding for the content (truncate if too long)
        console.log(`🔄 Generating embedding for ${cardData.cardName}...`);
        
        // Truncate content for embedding (max ~8000 characters to stay within token limits)
        const embeddingContent = `${cardData.cardName} ${cardData.issuer} ${cardData.cardType} ${extractedContent.substring(0, 6000)}`;
        
        const response = await openai.embeddings.create({
          model: "text-embedding-ada-002",
          input: embeddingContent
        });
        
        const embedding = response.data[0].embedding;
        
        // Prepare metadata for Pinecone
        const metadata = {
          cardName: cardData.cardName,
          issuer: cardData.issuer,
          cardType: cardData.cardType,
          annualFee: cardData.annualFee,
          rewardsRate: JSON.stringify(cardData.rewardsRate),
          signupBonus: cardData.signupBonus,
          benefitsSummary: cardData.benefitsSummary.join(' | '),
          primaryBenefits: cardData.primaryBenefits.join(' | '),
          mitcContent: extractedContent.substring(0, 8000), // Limit for metadata
          fileName: file,
          extractedAt: cardData.extractedAt,
          contentLength: extractedContent.length
        };
        
        // Upload to Pinecone
        await index.upsert([{
          id: cardData.id,
          values: embedding,
          metadata: metadata
        }]);
        
        console.log(`✅ Uploaded ${cardData.cardName} to Pinecone (ID: ${cardData.id})`);
        
        // Small delay to avoid rate limits
        await new Promise(resolve => setTimeout(resolve, 2000));
        
      } catch (pdfError) {
        console.error(`❌ Error processing ${file}:`, pdfError.message);
        continue;
      }
    }
    
    console.log('\n🎉 Successfully processed all MITC PDFs!');
    
    // Test the upload by querying
    console.log('\n🔍 Testing the upload with a sample query...');
    
    const testQuery = "Looking for a credit card with good travel benefits and rewards";
    const testResponse = await openai.embeddings.create({
      model: "text-embedding-ada-002",
      input: testQuery
    });
    
    const queryResults = await index.query({
      vector: testResponse.data[0].embedding,
      topK: 5,
      includeMetadata: true
    });
    
    console.log('📊 Query results:');
    queryResults.matches?.forEach((match, i) => {
      console.log(`${i + 1}. ${match.metadata?.cardName} (${match.metadata?.issuer})`);
      console.log(`   File: ${match.metadata?.fileName}`);
      console.log(`   Score: ${match.score?.toFixed(3)}`);
      console.log(`   Content Length: ${match.metadata?.contentLength} characters`);
    });
    
    // Get final index stats
    const finalStats = await index.describeIndexStats();
    console.log(`\n📈 Final index stats: ${finalStats.totalVectorCount} vectors uploaded`);
    
  } catch (error) {
    console.error('❌ Error processing MITC PDFs:', error);
    process.exit(1);
  }
}

// Run the script
async function main() {
  try {
    console.log('🚀 Script starting...');
    console.log('📊 Environment check:');
    console.log(`  - OPENAI_API_KEY: ${process.env.OPENAI_API_KEY ? 'Present' : 'Missing'}`);
    console.log(`  - PINECONE_API_KEY: ${process.env.PINECONE_API_KEY ? 'Present' : 'Missing'}`);
    console.log(`  - INDEX_NAME: ${INDEX_NAME}`);
    
    await processMITCPDFs();
    console.log('\n✅ MITC processing completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Script failed:', error);
    process.exit(1);
  }
}

// Execute the main function
main(); 