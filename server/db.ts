import pg from 'pg';
import * as schema from '@shared/schema';
import { drizzle } from 'drizzle-orm/node-postgres';

// Check if we're using memory storage
const useMemStorage = process.env.USE_MEM_STORAGE === 'true';

// Get the Pool class from pg
const { Pool } = pg;

// Only throw error if we're actually trying to use the database
if (!process.env.DATABASE_URL && !useMemStorage) {
  throw new Error('DATABASE_URL is not defined');
}

// Create a dummy or real pool based on storage mode
let pgPool: pg.Pool;
if (useMemStorage) {
  // Create a dummy "mock" pool that won't be used
  console.log('Using memory storage - database connection is mocked');
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