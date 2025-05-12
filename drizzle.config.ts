import { defineConfig } from "drizzle-kit";

// Check if we're using memory storage
const useMemStorage = process.env.USE_MEM_STORAGE === 'true';

// Only throw error if we're actually trying to use the database
if (!process.env.DATABASE_URL && !useMemStorage) {
  throw new Error("DATABASE_URL is not defined - ensure the database is provisioned");
}

// Use a dummy URL when in memory mode
const dbUrl = useMemStorage ? 'postgresql://dummy:dummy@localhost:5432/dummy' : process.env.DATABASE_URL;

export default defineConfig({
  out: "./migrations",
  schema: "./shared/schema.ts",
  dialect: "postgresql",
  dbCredentials: {
    url: dbUrl || '',
  },
});
