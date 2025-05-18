// Load environment variables from .env file
import * as dotenv from 'dotenv';
dotenv.config();

import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import cors from 'cors';
import { setupAuth, setupSessions } from './auth';
import { DatabaseStorage } from './database-storage';
import { MemStorage } from './storage';
import { MongoDBStorage } from './mongodb-storage';
import { connectToMongoDB } from './mongo-db';

// Check for memory storage flag in command line arguments
if (process.argv.includes('--mem-storage')) {
  process.env.USE_MEM_STORAGE = 'true';
  log('Memory storage mode enabled via command line argument');
}

// Check if we're using memory storage
const useMemStorage = process.env.USE_MEM_STORAGE === 'true';
// Check if we're using MongoDB
const useMongoDB = process.env.USE_MONGODB === 'true';

async function startServer() {
  // Create Express app
  const app = express();
  app.use(express.json());
  app.use(express.urlencoded({ extended: false }));
  
  // Add CORS middleware if needed
  app.use(cors({
    origin: process.env.NODE_ENV === 'production' ? false : ['http://localhost:5173'],
    credentials: true
  }));

  // Setup request logging middleware
  app.use((req, res, next) => {
    const start = Date.now();
    const path = req.path;
    let capturedJsonResponse: Record<string, any> | undefined = undefined;

    const originalResJson = res.json;
    res.json = function (bodyJson, ...args) {
      capturedJsonResponse = bodyJson;
      return originalResJson.apply(res, [bodyJson, ...args]);
    };

    res.on("finish", () => {
      const duration = Date.now() - start;
      if (path.startsWith("/api")) {
        let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
        if (capturedJsonResponse) {
          logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
        }

        if (logLine.length > 80) {
          logLine = logLine.slice(0, 79) + "…";
        }

        log(logLine);
      }
    });

    next();
  });

  // Log environment variables for debugging
  log(`Environment: ${process.env.NODE_ENV || 'development'}`);
  log(`Storage mode: ${useMemStorage ? 'Memory' : useMongoDB ? 'MongoDB' : 'PostgreSQL'}`);

  // Setup sessions and authentication
  setupSessions(app);
  setupAuth(app);

  // Initialize storage provider based on configuration
  if (useMemStorage) {
    log('🧠 Using in-memory storage');
  } else if (useMongoDB) {
    log('🍃 Using MongoDB storage');
    // Connect to MongoDB
    await connectToMongoDB();
  } else {
    log('🐘 Using PostgreSQL storage');
  }

  // Register API routes and create HTTP server
  const server = await registerRoutes(app);

  // Error handler
  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";
    console.error('Server error:', err);
    res.status(status).json({ message });
  });

  // Setup Vite or static serving based on environment
  if (process.env.NODE_ENV === 'development') {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  // ALWAYS serve the app on port 5000
  // this serves both the API and the client.
  // It is the only port that is not firewalled.
  const port = 5000;
  server.listen({
    port,
    host: "0.0.0.0",
    reusePort: true,
  }, () => {
    log(`⚡ Server running on port ${port}`);
  });
}

// Handle any uncaught exceptions
process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
});

// Handle any unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

// Start the server
startServer().catch(error => {
  console.error('Failed to start server:', error);
  process.exit(1);
});
