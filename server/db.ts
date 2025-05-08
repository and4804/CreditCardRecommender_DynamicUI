import pg from 'pg';
import * as schema from '@shared/schema';
import { drizzle } from 'drizzle-orm/node-postgres';

// Get the Pool class from pg
const { Pool } = pg;

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL is not defined');
}

// Create the connection pool
export const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

// Create the database client with the schema
export const db = drizzle(pool, { schema });