#!/bin/bash

# Read OPENAI_API_KEY from .env file
export OPENAI_API_KEY=$(grep OPENAI_API_KEY .env | cut -d'=' -f2)

# Kill any existing server processes
pgrep -f "node.*server/index.ts" | xargs -r kill -9

# Set environment variables and start the server
export USE_MEM_STORAGE=true
export NODE_ENV=development

echo "Starting server with API key: ${OPENAI_API_KEY:0:10}..."
npx tsx server/index.ts 