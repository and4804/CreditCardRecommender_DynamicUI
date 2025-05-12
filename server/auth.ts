import { Request, Response, NextFunction, Express } from 'express';
import { randomBytes, scrypt, timingSafeEqual } from 'crypto';
import { promisify } from 'util';
import session from 'express-session';
import connectPgSimple from 'connect-pg-simple';
import { db } from './db';
import { pool } from './db';
import { users, sessions, InsertUser, User } from '@shared/schema';
import { eq } from 'drizzle-orm';
import { v4 as uuidv4 } from 'uuid';
import memoryStore from 'memorystore';

// Check if using memory storage
const useMemStorage = process.env.USE_MEM_STORAGE === 'true';

// In-memory user store for development
const inMemoryUsers: User[] = [];
let nextUserId = 1;

// Create memory store for in-memory sessions
const MemoryStore = memoryStore(session);

// Declare session for TypeScript
declare module 'express-session' {
  interface SessionData {
    userId: number;
  }
}

// Promisify the scrypt function
const scryptAsync = promisify(scrypt);

// Connect to the PostgreSQL database for sessions
const PgSession = connectPgSimple(session);

// Hash a password with a salt
export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16).toString('hex');
  const buf = await scryptAsync(password, salt, 64) as Buffer;
  return `${buf.toString('hex')}.${salt}`;
}

// Compare a password with a hashed password
export async function comparePasswords(provided: string, stored: string): Promise<boolean> {
  const [hash, salt] = stored.split('.');
  const hashBuffer = Buffer.from(hash, 'hex');
  const providedHashBuffer = await scryptAsync(provided, salt, 64) as Buffer;
  return timingSafeEqual(hashBuffer, providedHashBuffer);
}

// Setup the session middleware
export function setupSessions(app: Express) {
  // Session configuration
  const sessionConfig: session.SessionOptions = {
    secret: process.env.SESSION_SECRET || 'cardsavvy-secret-key',
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: process.env.NODE_ENV === 'production',
      maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
      httpOnly: true
    }
  };

  // Always use memory store for sessions
  console.log('Using memory session store');
  // Use memory store for sessions
  sessionConfig.store = new MemoryStore({
    checkPeriod: 86400000 // prune expired entries every 24h
  });
  
  // Create a default user for in-memory mode
  if (inMemoryUsers.length === 0) {
    inMemoryUsers.push({
      id: 1,
      username: "ameya",
      password: "$hashedpassword", // We'll handle this specially in comparePasswords
      email: "ameya@example.com",
      name: "Ameya Dusane",
      membershipLevel: "Premium",
      createdAt: new Date().toISOString(),
      lastLogin: new Date().toISOString(),
      pictureUrl: null
    });
  }
  
  app.use(session(sessionConfig));
}

// Setup the authentication routes
export function setupAuth(app: Express) {
  // Register a new user
  app.post('/api/auth/register', async (req: Request, res: Response) => {
    try {
      const { username, password, email, name } = req.body;
      
      if (useMemStorage) {
        // In-memory user registration
        const existingUser = inMemoryUsers.find(u => u.username === username);
        if (existingUser) {
          return res.status(400).json({ error: 'Username already exists' });
        }
        
        const existingEmail = inMemoryUsers.find(u => u.email === email);
        if (existingEmail) {
          return res.status(400).json({ error: 'Email already exists' });
        }
        
        // Create a new user
        const newId = nextUserId++;
        const hashedPassword = await hashPassword(password);
        
        const newUser: User = {
          id: newId,
          username,
          email,
          password: hashedPassword,
          name,
          membershipLevel: 'Premium',
          createdAt: new Date().toISOString(),
          lastLogin: new Date().toISOString(),
          pictureUrl: null
        };
        
        inMemoryUsers.push(newUser);
        
        // Create session
        req.session.userId = newUser.id;
        
        // Return user without password
        const { password: _, ...userWithoutPassword } = newUser;
        return res.status(201).json(userWithoutPassword);
      } else {
        // Database user registration
        // Check if username or email already exists
        const existingUser = await db.select()
          .from(users)
          .where(eq(users.username, username))
          .limit(1);
        
        if (existingUser.length > 0) {
          return res.status(400).json({ error: 'Username already exists' });
        }
        
        const existingEmail = await db.select()
          .from(users)
          .where(eq(users.email, email))
          .limit(1);
        
        if (existingEmail.length > 0) {
          return res.status(400).json({ error: 'Email already exists' });
        }
        
        // Hash the password
        const hashedPassword = await hashPassword(password);
        
        // Create new user
        const [newUser] = await db.insert(users)
          .values({
            username,
            email,
            password: hashedPassword,
            name,
            membershipLevel: 'Premium',
            createdAt: new Date().toISOString(),
            lastLogin: new Date().toISOString()
          })
          .returning();
        
        // Create session for the new user
        req.session.userId = newUser.id;
        
        // Return the user without the password
        const { password: _, ...userWithoutPassword } = newUser;
        return res.status(201).json(userWithoutPassword);
      }
    } catch (error) {
      console.error('Registration error:', error);
      return res.status(500).json({ error: 'An error occurred during registration' });
    }
  });
  
  // Login
  app.post('/api/auth/login', async (req: Request, res: Response) => {
    try {
      const { username, password } = req.body;
      
      if (useMemStorage) {
        // In-memory user login
        const user = inMemoryUsers.find(u => u.username === username);
        
        if (!user) {
          return res.status(401).json({ error: 'Invalid username or password' });
        }
        
        // Special handling for default user
        let isPasswordValid = false;
        if (user.id === 1 && username === "ameya") {
          // Default user can login with any password in memory mode
          isPasswordValid = true;
        } else {
          // Regular password check
          isPasswordValid = await comparePasswords(password, user.password);
        }
        
        if (!isPasswordValid) {
          return res.status(401).json({ error: 'Invalid username or password' });
        }
        
        // Update last login
        user.lastLogin = new Date().toISOString();
        
        // Create session
        req.session.userId = user.id;
        
        // Return user without password
        const { password: _, ...userWithoutPassword } = user;
        return res.status(200).json(userWithoutPassword);
      } else {
        // Database user login
        // Find the user by username
        const existingUsers = await db.select()
          .from(users)
          .where(eq(users.username, username))
          .limit(1);
        
        if (existingUsers.length === 0) {
          return res.status(401).json({ error: 'Invalid username or password' });
        }
        
        const user = existingUsers[0];
        
        // Compare passwords
        const isPasswordValid = await comparePasswords(password, user.password);
        
        if (!isPasswordValid) {
          return res.status(401).json({ error: 'Invalid username or password' });
        }
        
        // Update last login
        await db.update(users)
          .set({ lastLogin: new Date().toISOString() })
          .where(eq(users.id, user.id));
        
        // Create session for the user
        req.session.userId = user.id;
        
        // Return the user without the password
        const { password: _, ...userWithoutPassword } = user;
        return res.status(200).json(userWithoutPassword);
      }
    } catch (error) {
      console.error('Login error:', error);
      return res.status(500).json({ error: 'An error occurred during login' });
    }
  });
  
  // Logout
  app.post('/api/auth/logout', (req: Request, res: Response) => {
    req.session.destroy(err => {
      if (err) {
        return res.status(500).json({ error: 'An error occurred during logout' });
      }
      res.clearCookie('connect.sid');
      return res.status(200).json({ message: 'Logged out successfully' });
    });
  });
  
  // Get current user
  app.get('/api/auth/me', async (req: Request, res: Response) => {
    try {
      const userId = req.session.userId;
      
      if (!userId) {
        return res.status(401).json({ error: 'Not authenticated' });
      }
      
      if (useMemStorage) {
        // In-memory user retrieval
        const user = inMemoryUsers.find(u => u.id === userId);
        
        if (!user) {
          return res.status(404).json({ error: 'User not found' });
        }
        
        // Return user without password
        const { password, ...userWithoutPassword } = user;
        return res.status(200).json(userWithoutPassword);
      } else {
        // Database user retrieval
        const foundUsers = await db.select()
          .from(users)
          .where(eq(users.id, userId))
          .limit(1);
        
        if (foundUsers.length === 0) {
          return res.status(404).json({ error: 'User not found' });
        }
        
        // Return the user without the password
        const { password, ...userWithoutPassword } = foundUsers[0];
        return res.status(200).json(userWithoutPassword);
      }
    } catch (error) {
      console.error('Get current user error:', error);
      return res.status(500).json({ error: 'An error occurred while fetching user data' });
    }
  });
}

// Middleware to check if user is authenticated
export function isAuthenticated(req: Request, res: Response, next: NextFunction) {
  if (req.session.userId) {
    return next();
  }
  return res.status(401).json({ error: 'Not authenticated' });
}

// Verify user credentials and return user data
export async function verifyUserCredentials(username: string, password: string): Promise<User | null> {
  try {
    if (useMemStorage) {
      // In-memory credential verification
      const user = inMemoryUsers.find(u => u.username === username);
      
      if (!user) {
        return null;
      }
      
      // Special handling for default user
      let isPasswordValid = false;
      if (user.id === 1 && username === "ameya") {
        // Default user can login with any password in memory mode
        isPasswordValid = true;
      } else {
        // Regular password check
        isPasswordValid = await comparePasswords(password, user.password);
      }
      
      if (!isPasswordValid) {
        return null;
      }
      
      return user;
    } else {
      // Database credential verification
      const foundUsers = await db.select()
        .from(users)
        .where(eq(users.username, username))
        .limit(1);
      
      if (foundUsers.length === 0) {
        return null;
      }
      
      const user = foundUsers[0];
      const isPasswordValid = await comparePasswords(password, user.password);
      
      if (!isPasswordValid) {
        return null;
      }
      
      return user;
    }
  } catch (error) {
    console.error('Verify credentials error:', error);
    return null;
  }
}