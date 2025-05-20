// Simple test script for AstraDB connection
import dotenv from 'dotenv';
import { DataAPIClient } from '@datastax/astra-db-ts';

// Initialize dotenv
dotenv.config();

async function testAstraConnection() {
  console.log('Testing AstraDB connection...');

  const ASTRA_DB_ID = process.env.ASTRA_DB_ID;
  const ASTRA_DB_REGION = process.env.ASTRA_DB_REGION;
  const ASTRA_DB_TOKEN = process.env.ASTRA_DB_TOKEN;
  const ASTRA_DB_NAMESPACE = process.env.ASTRA_DB_NAMESPACE || "default_keyspace";
  const ASTRA_DB_COLLECTION = process.env.ASTRA_DB_COLLECTION || "cc_details";

  console.log('AstraDB Settings:');
  console.log(`- Database ID: ${ASTRA_DB_ID}`);
  console.log(`- Region: ${ASTRA_DB_REGION}`);
  console.log(`- Token: ${ASTRA_DB_TOKEN?.substring(0, 10)}...`);
  console.log(`- Namespace: ${ASTRA_DB_NAMESPACE}`);
  console.log(`- Collection: ${ASTRA_DB_COLLECTION}`);

  try {
    // Create the AstraDB client (v2.0.1 API) using the pattern from the README
    const client = new DataAPIClient();
    const endpoint = `https://${ASTRA_DB_ID}-${ASTRA_DB_REGION}.apps.astra.datastax.com`;
    const db = client.db(endpoint, { token: ASTRA_DB_TOKEN, keyspace: ASTRA_DB_NAMESPACE });
    
    console.log('AstraDB client created successfully');
    
    // Test connection by getting the collection
    const collection = await db.collection(ASTRA_DB_COLLECTION);
    console.log(`Connected to collection: ${ASTRA_DB_COLLECTION}`);
    
    // Try to find documents directly instead of counting
    const cursor = collection.find({}).limit(5);
    const documents = await cursor.toArray();
    console.log(`Found ${documents.length} documents in collection`);
    
    // Display document info if any were found
    if (documents.length > 0) {
      const firstDocument = documents[0];
      console.log('First document:', JSON.stringify(firstDocument, null, 2));
      
      // List all document properties
      console.log('Document properties:');
      Object.keys(firstDocument).forEach(key => {
        console.log(`- ${key}: ${typeof firstDocument[key]}`);
      });
    } else {
      console.log('No documents found in the collection.');
    }
    
    console.log('AstraDB connection test successful!');
  } catch (error) {
    console.error('Error connecting to AstraDB:', error);
    console.error('Error details:', error.message);
    if (error.stack) {
      console.error('Stack trace:', error.stack);
    }
  }
}

// Run the test
testAstraConnection().then(() => {
  console.log('Test completed');
}).catch(err => {
  console.error('Test failed:', err);
}); 