# Card Rewards Travel Application

A travel booking application that shows flight options with card rewards benefits.

## Running the Application

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
- Log in to view personalized recommendations 
