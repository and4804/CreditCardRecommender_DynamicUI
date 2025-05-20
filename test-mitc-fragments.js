// Script to print the full $vectorize content of each card
import dotenv from 'dotenv';
import { DataAPIClient } from '@datastax/astra-db-ts';

// Load environment variables
dotenv.config();

async function printMITCFragments() {
  console.log('Printing MITC fragments from AstraDB...');

  const ASTRA_DB_ID = process.env.ASTRA_DB_ID;
  const ASTRA_DB_REGION = process.env.ASTRA_DB_REGION;
  const ASTRA_DB_TOKEN = process.env.ASTRA_DB_TOKEN;
  const ASTRA_DB_NAMESPACE = process.env.ASTRA_DB_NAMESPACE || "default_keyspace";
  const ASTRA_DB_COLLECTION = process.env.ASTRA_DB_COLLECTION || "cc_details";

  try {
    // Create the AstraDB client
    const client = new DataAPIClient();
    const endpoint = `https://${ASTRA_DB_ID}-${ASTRA_DB_REGION}.apps.astra.datastax.com`;
    const db = client.db(endpoint, { token: ASTRA_DB_TOKEN, keyspace: ASTRA_DB_NAMESPACE });
    
    console.log('AstraDB client created successfully');
    
    // Get collection
    const collection = await db.collection(ASTRA_DB_COLLECTION);
    console.log(`Connected to collection: ${ASTRA_DB_COLLECTION}`);
    
    // Get documents with $vectorize field
    const docs = await collection.find({}, {
      projection: { _id: 1, type: 1, $vectorize: 1 }
    }).limit(10).toArray();
    
    if (docs.length === 0) {
      console.log('No documents found in the collection');
      return;
    }
    
    console.log(`Found ${docs.length} documents with $vectorize field`);
    
    // Print the full $vectorize content of each document
    docs.forEach((doc, index) => {
      console.log(`\n--- DOCUMENT ${index + 1}: ${doc._id} ---`);
      console.log('Type:', doc.type);
      console.log('$vectorize content:');
      console.log(doc.$vectorize || 'No $vectorize field');
      console.log('-'.repeat(80));
    });
    
  } catch (error) {
    console.error('Error:', error);
  }
}

// Run the script
printMITCFragments()
  .then(() => console.log('\nDone'))
  .catch(err => console.error('\nError:', err))
  .finally(() => process.exit(0)); 