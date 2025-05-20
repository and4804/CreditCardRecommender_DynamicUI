// Script to check if we can access the $vectorize field in AstraDB documents
import dotenv from 'dotenv';
import { DataAPIClient } from '@datastax/astra-db-ts';

// Load environment variables
dotenv.config();

async function checkAstraDBVectorize() {
  console.log('Checking AstraDB $vectorize field access...');

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
    // Create the AstraDB client
    const client = new DataAPIClient();
    const endpoint = `https://${ASTRA_DB_ID}-${ASTRA_DB_REGION}.apps.astra.datastax.com`;
    const db = client.db(endpoint, { token: ASTRA_DB_TOKEN, keyspace: ASTRA_DB_NAMESPACE });
    
    console.log('AstraDB client created successfully');
    
    // Get collection
    const collection = await db.collection(ASTRA_DB_COLLECTION);
    console.log(`Connected to collection: ${ASTRA_DB_COLLECTION}`);
    
    // Get first document to check its structure
    const firstDoc = await collection.find({}).limit(1).toArray();
    if (firstDoc.length === 0) {
      console.log('No documents found in the collection');
      return;
    }
    
    console.log('First document fields:', Object.keys(firstDoc[0]));
    console.log('First document structure:', JSON.stringify(firstDoc[0], null, 2));
    
    // Try to specifically request the $vectorize field
    console.log('\nAttempting to retrieve document with $vectorize field...');
    const docWithVectorize = await collection.findOne(
      { _id: firstDoc[0]._id },
      { projection: { _id: 1, type: 1, $vectorize: 1 } }
    );
    
    console.log('Document with requested $vectorize field:');
    console.log('Fields:', Object.keys(docWithVectorize));
    console.log('Structure:', JSON.stringify(docWithVectorize, null, 2));
    
    // Try to get the $vectorize field using direct field access
    console.log('\nTrying direct $vectorize field access...');
    const allFields = await collection.findOne(
      { _id: firstDoc[0]._id }
    );
    
    console.log('All fields in document:');
    console.log('Fields:', Object.keys(allFields));
    
    // Check if there are any fields that might contain the vectorized text
    Object.entries(allFields).forEach(([key, value]) => {
      if (typeof value === 'string' && value.length > 50) {
        console.log(`\nPotential text content field: ${key}`);
        console.log('Content preview:', value.substring(0, 100) + '...');
      }
    });
    
    // Try to access the $vectorize field directly
    if (allFields.$vectorize) {
      console.log('\n$vectorize field found:', allFields.$vectorize.substring(0, 100) + '...');
    } else {
      console.log('\n$vectorize field not directly accessible');
    }
    
    // Try a raw query to check if we can access the field
    try {
      console.log('\nAttempting raw query to access $vectorize...');
      const rawQuery = await db.raw({
        find: ASTRA_DB_COLLECTION,
        filter: { _id: firstDoc[0]._id },
        options: { projection: { _id: 1, $vectorize: 1 } }
      });
      
      console.log('Raw query result:', JSON.stringify(rawQuery, null, 2));
    } catch (error) {
      console.error('Raw query failed:', error.message);
    }
    
  } catch (error) {
    console.error('Error checking AstraDB $vectorize field:', error);
  }
}

// Run the check
checkAstraDBVectorize()
  .then(() => console.log('\nCheck completed'))
  .catch(err => console.error('\nCheck failed:', err))
  .finally(() => process.exit(0)); 