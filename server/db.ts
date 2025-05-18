import pg from 'pg';
import * as schema from '@shared/schema';
import { drizzle } from 'drizzle-orm/node-postgres';

// Check if we're using memory storage or MongoDB
const useMemStorage = process.env.USE_MEM_STORAGE === 'true';
const useMongoDB = process.env.USE_MONGODB === 'true';

// Get the Pool class from pg
const { Pool } = pg;

// Only throw error if we're actually trying to use PostgreSQL
if (!process.env.DATABASE_URL && !useMemStorage && !useMongoDB) {
  throw new Error('DATABASE_URL is not defined');
}

// Create a dummy or real pool based on storage mode
let pgPool: pg.Pool;
if (useMemStorage || useMongoDB) {
  // Create a dummy "mock" pool that won't be used
  console.log('Using memory storage or MongoDB - PostgreSQL connection is mocked');
  pgPool = {
    query: async () => ({ rows: [] }),
    on: () => ({}),
    end: async () => {}
  } as unknown as pg.Pool;
} else {
  // Actually connect to the database
  pgPool = new Pool({
    connectionString: process.env.DATABASE_URL
  });
}

// Export the pool for session management
export const pool = pgPool;

// Create the database client with the schema
export const db = drizzle(pgPool, { schema });