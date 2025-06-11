# Pinecone Setup Guide for Credit Card RAG System

## 🎯 Overview
This guide will help you set up Pinecone as your vector database for storing and retrieving MITC (Most Important Terms and Conditions) documents for credit card recommendations.

## 📋 Prerequisites
- Node.js and npm installed
- OpenAI API key
- Your MITC PDF files ready

## 🚀 Step 1: Create Pinecone Account

1. **Visit**: https://www.pinecone.io/
2. **Sign up** for a free account
3. **Verify** your email address
4. **Create** your first project

## 🔑 Step 2: Get Your API Credentials

1. **In Pinecone Console**: 
   - Go to "API Keys" section
   - Copy your **API Key** (starts with `pc-...`)
   - Note your **Environment** (usually `gcp-starter` for free tier)

2. **Update your `.env` file**:
   ```bash
   # Add these lines to your .env file
   PINECONE_API_KEY=your_pinecone_api_key_here
   PINECONE_ENVIRONMENT=gcp-starter
   PINECONE_INDEX_NAME=credit-cards-mitc
   ```

## 🏗️ Step 3: Create Pinecone Index

**Option A: Using API endpoint (Recommended)**
```bash
# Make sure your server is running first
sh start-mongodb.sh

# Then create the index
curl -X POST http://localhost:5000/api/create-pinecone-index
```

**Option B: Using Pinecone Console**
1. Go to Pinecone Console
2. Click "Create Index"
3. **Index Name**: `credit-cards-mitc`
4. **Dimensions**: `1536` (for OpenAI embeddings)
5. **Metric**: `cosine`
6. **Cloud**: `AWS`
7. **Region**: `us-east-1`

## 📤 Step 4: Upload Your MITC Data

### Option A: Upload Sample Data (Quick Test)
```bash
# Upload sample credit card MITC data
node scripts/upload-mitc-to-pinecone.js --sample
```

### Option B: Upload Your PDF Files
```bash
# Process your actual MITC PDF files
node scripts/upload-mitc-to-pinecone.js --pdf /path/to/your/pdf/directory
```

**Note**: The PDF processing is a template. You'll need to customize the extraction logic based on your specific PDF format.

## 🧪 Step 5: Test Your Setup

### Test Pinecone Connection
```bash
curl http://localhost:5000/api/test-pinecone
```

**Expected Response**:
```json
{
  "success": true,
  "message": "Successfully connected to Pinecone index: credit-cards-mitc",
  "stats": {
    "dimension": 1536,
    "indexFullness": 0.0,
    "totalVectorCount": 3
  }
}
```

### Test Recommendations
```bash
curl -X POST http://localhost:5000/api/direct-recommendation \
  -H "Content-Type: application/json" \
  -d '{
    "income": 1200000,
    "expenses": 50000,
    "preferences": "travel rewards and airport lounge access"
  }'
```

## 🔄 Step 6: Update Your Recommendation System

The system will automatically use Pinecone when:
1. Pinecone is properly configured
2. The index contains MITC data
3. The recommendation endpoint is called

### Integration Flow:
1. **User Profile** → **Pinecone Vector Search** → **Relevant MITC Documents**
2. **MITC Documents** + **User Profile** → **OpenAI Analysis** → **Personalized Recommendations**

## 📊 Monitoring and Maintenance

### Check Index Stats
```bash
curl http://localhost:5000/api/test-pinecone | jq '.stats'
```

### View Uploaded Cards
The test endpoint will show you what's stored:
```bash
curl http://localhost:5000/api/test-pinecone | jq '.stats.totalVectorCount'
```

## 🛠️ Customizing for Your PDFs

To process your actual MITC PDF files, you'll need to modify the `scripts/upload-mitc-to-pinecone.js` file:

1. **Extract Card Information**: Parse PDF content to extract:
   - Card name
   - Issuer bank
   - Annual fee
   - Rewards structure
   - Benefits
   - Eligibility criteria

2. **Structure the Data**: Format according to the `CreditCardMITC` interface

3. **Upload to Pinecone**: The script handles embedding generation and upload

## 🔍 Troubleshooting

### Common Issues:

**1. "Index does not exist" Error**
```bash
# Create the index first
curl -X POST http://localhost:5000/api/create-pinecone-index
```

**2. "PINECONE_API_KEY not found" Error**
- Check your `.env` file
- Ensure the API key is correct
- Restart your server after updating `.env`

**3. "Dimension mismatch" Error**
- Ensure your index has 1536 dimensions
- OpenAI's text-embedding-ada-002 produces 1536-dimensional vectors

**4. No recommendations returned**
- Check if data was uploaded: `curl http://localhost:5000/api/test-pinecone`
- Verify your MITC content is meaningful and detailed

## 💡 Best Practices

1. **MITC Content Quality**: Ensure your MITC documents contain:
   - Clear benefit descriptions
   - Specific reward rates
   - Eligibility criteria
   - Fee structures

2. **Regular Updates**: Update your Pinecone index when:
   - New credit cards are launched
   - Terms and conditions change
   - Benefits are updated

3. **Testing**: Always test with sample queries after uploading new data

## 📈 Scaling Considerations

**Free Tier Limits**:
- 1M vectors
- 1 index
- Perfect for testing and small deployments

**Production Considerations**:
- Monitor vector count
- Consider upgrading for more cards
- Implement batch upload for large datasets

## 🎉 Success Indicators

Your Pinecone setup is working correctly when:
- ✅ Test endpoint returns `success: true`
- ✅ Vector count matches uploaded cards
- ✅ Recommendations return actual card names (not "Credit Card 1")
- ✅ Match scores are reasonable (70-95%)
- ✅ Recommendations are relevant to user profiles

## 🆘 Support

If you encounter issues:
1. Check the server logs for detailed error messages
2. Verify all environment variables are set
3. Test each step individually
4. Ensure your OpenAI API key has sufficient credits

---

**Next Steps**: Once Pinecone is set up and working, your credit card recommendation system will provide much more accurate and relevant suggestions based on actual MITC content rather than generic web data! 