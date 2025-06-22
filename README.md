# Card Rewards Travel Application

A travel booking application that shows flight options with card rewards benefits.

## Running the Application

### Contents of .env file- ####
```
DATABASE_URL=postgres://postgres:postgres@localhost:5433/replitcc
# Replace this with your actual OpenAI API key
OPENAI_API_KEY=your-openai-api-key

# Auth0 Configuration
AUTH0_DOMAIN=dev-v4g3q7uma25d66c2.us.auth0.com
AUTH0_CLIENT_ID=uOMkgc6m0jAcRd6Z3Z56g1PA1eZnlHhQ
AUTH0_CLIENT_SECRET=GiQcWsySDVMlf2jvu7i71I1_smnh-6peUSzBKTSbud1ArYrbZ9DkJ7ONZpcpKKyE
AUTH0_CALLBACK_URL=http://localhost:3000/callback

# MongoDB Configuration
MONGODB_URI=mongodb://localhost:27017/replitcc
USE_MONGODB=true

# Storage Configuration 
# Set to false to use PostgreSQL or MongoDB
USE_MEM_STORAGE=false
```

This application can run with or without a database:

### Quick Start Options
1. **Run the server script** (recommended):
   ```
   start-server.sh
   ```

2. **Memory mode with real OpenAI responses** (recommended):
   ```
   npm run start:mem:api
   ```
   Uses in-memory storage (no database needed) and real OpenAI API from your .env file.

3. **Memory mode with mock AI** (no API key needed):
   ```
   npm run start:mem
   ```
   Uses in-memory storage and mock OpenAI responses (static responses).

4. **With database** (requires PostgreSQL):
   ```
   npm run dev
   ```
   Note: Requires DATABASE_URL in your .env file.

### Environment Setup

Create a `.env` file with:
```
# For memory mode with real AI:
OPENAI_API_KEY=your-openai-api-key-here

# For database mode (optional):
DATABASE_URL=postgresql://username:password@localhost:5432/dbname
```

## Default Login (Memory Mode)

When running in memory mode, you can log in with:
- Username: `ameya`
- Password: `password`

## Features

- Browse flight options
- View card rewards benefits
- Filter flights by various criteria
<<<<<<< HEAD
- Log in to view personalized recommendations 
=======
- Log in to view personalized recommendations 
