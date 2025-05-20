# MITC-Based Credit Card Recommendation Test

This script tests the credit card recommendation system using Most Important Terms and Conditions (MITC) data from AstraDB.

## Overview

The test script performs the following operations:

1. Connects to MongoDB to retrieve a user's financial profile
2. Generates an embedding vector from the user profile using OpenAI's text-embedding-3-small model
3. Connects to AstraDB to retrieve credit card documents with MITC data in the `$vectorize` field
4. Extracts card names and features from the MITC fragments
5. Uses GPT-4o to generate personalized credit card recommendations based on the user profile and MITC data

## Prerequisites

- Node.js (v14 or higher)
- MongoDB running locally or accessible via URI
- AstraDB account with a collection containing credit card MITC data
- OpenAI API key

## Environment Variables

Create a `.env` file with the following variables:

```
# MongoDB
MONGODB_URI=mongodb://localhost:27017/replitcc

# AstraDB
ASTRA_DB_ID=your-astra-db-id
ASTRA_DB_REGION=your-astra-db-region
ASTRA_DB_TOKEN=your-astra-db-token
ASTRA_DB_NAMESPACE=your-keyspace
ASTRA_DB_COLLECTION=cc_details

# OpenAI
OPENAI_API_KEY=your-openai-api-key
```

## AstraDB Integration

The script accesses the `$vectorize` field in AstraDB documents which contains credit card terms and conditions. To properly access this field, it must be explicitly requested in the projection of the query:

```javascript
const allCards = await collection.find({}, {
  projection: { _id: 1, type: 1, $vectorize: 1 }
}).limit(20).toArray();
```

The AstraDB client is initialized as follows:

```javascript
const client = new DataAPIClient();
const endpoint = `https://${ASTRA_DB_ID}-${ASTRA_DB_REGION}.apps.astra.datastax.com`;
const db = client.db(endpoint, { token: ASTRA_DB_TOKEN, keyspace: ASTRA_DB_NAMESPACE });
const collection = await db.collection(ASTRA_DB_COLLECTION);
```

## Embedding Model

The script uses OpenAI's `text-embedding-ada-002` model which should produce 1024-dimensional vectors:

```javascript
const response = await openai.embeddings.create({
  model: "text-embedding-ada-002",
  input: profileText
});
```

**Note:** There appears to be a mismatch between the expected and actual vector dimensions. Even though we specify `text-embedding-ada-002`, OpenAI may return 1536-dimensional vectors. The script handles this by using regular document retrieval instead of vector search when a dimension mismatch is detected.

## Running the Test

To run the test:

```bash
node test-mitc-recommendations.js
```

## Expected Output

The script will output:
- Connection status to MongoDB and AstraDB
- User financial profile details
- Number of credit cards found in AstraDB
- Credit card recommendations with match scores and highlights

## Troubleshooting

- Ensure all environment variables are correctly set
- Make sure the `$vectorize` field is explicitly requested in the projection
- Check that MongoDB and AstraDB are accessible
- Verify that the OpenAI API key is valid 