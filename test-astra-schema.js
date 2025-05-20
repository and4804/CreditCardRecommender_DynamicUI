// Script to check AstraDB schema and vector dimensions
import dotenv from 'dotenv';
import { DataAPIClient } from '@datastax/astra-db-ts';

// Load environment variables
dotenv.config();

async function checkAstraDBSchema() {
  console.log('Checking AstraDB schema and vector dimensions...');

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
    
    // Get collection info
    const collection = await db.collection(ASTRA_DB_COLLECTION);
    console.log(`Connected to collection: ${ASTRA_DB_COLLECTION}`);
    
    // Try to get collection schema/metadata
    try {
      // This is a workaround to get schema info since there's no direct API for it
      // We'll try to get one document and examine its structure
      const cursor = collection.find({}).limit(1);
      const documents = await cursor.toArray();
      
      if (documents.length > 0) {
        const firstDocument = documents[0];
        console.log('Sample document structure:');
        
        // Check if the document has a vector field
        let vectorField = null;
        let vectorDimension = null;
        
        // Log all document properties and look for vector fields
        Object.entries(firstDocument).forEach(([key, value]) => {
          console.log(`- ${key}: ${typeof value}`);
          
          // If this looks like a vector field (array of numbers)
          if (Array.isArray(value) && value.length > 0 && typeof value[0] === 'number') {
            vectorField = key;
            vectorDimension = value.length;
            console.log(`  Found potential vector field: ${key} with dimension ${value.length}`);
          }
        });
        
        if (vectorField) {
          console.log(`\nVector field detected: "${vectorField}" with dimension: ${vectorDimension}`);
        } else {
          console.log('\nNo vector field detected in the document. The vector might be stored separately or with a different name.');
        }
        
        // Try to get collection info from AstraDB API if available
        try {
          // This is experimental and may not work depending on the AstraDB API version
          const collectionInfo = await db.describeCollection(ASTRA_DB_COLLECTION);
          console.log('\nCollection info:', collectionInfo);
        } catch (error) {
          console.log('\nCould not retrieve collection schema info:', error.message);
        }
      } else {
        console.log('No documents found in the collection. Cannot determine schema.');
      }
    } catch (error) {
      console.error('Error examining collection schema:', error);
    }
  } catch (error) {
    console.error('Error connecting to AstraDB:', error);
  }
}

// Run the check
checkAstraDBSchema()
  .then(() => console.log('Schema check completed'))
  .catch(err => console.error('Schema check failed:', err))
  .finally(() => process.exit(0)); 