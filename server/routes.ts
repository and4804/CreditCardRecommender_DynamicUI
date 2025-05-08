import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import OpenAI from "openai";
import { z } from "zod";
import session from "express-session";
import { insertChatMessageSchema, insertUserSchema } from "@shared/schema";
import { hashPassword, comparePasswords } from "./auth";
import { pool } from "./db";
import connectPgSimple from "connect-pg-simple";

// Initialize OpenAI with API key from environment
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY || "sk-dummy-key-for-development" });

// Define a type for context analysis response
type ContextAnalysis = {
  context: "flight" | "hotel" | "shopping" | "general";
  intent: string;
  entities: {
    location?: string;
    dates?: {
      start?: string;
      end?: string;
    };
    travelers?: number;
    cardPreference?: string;
    budget?: string;
    category?: string;
  };
};

export async function registerRoutes(app: Express): Promise<Server> {
  // Setup sessions
  const PgSession = connectPgSimple(session);
  app.use(session({
    store: new PgSession({
      pool,
      tableName: 'sessions',
      createTableIfMissing: true
    }),
    secret: process.env.SESSION_SECRET || 'cardsavvy-session-secret',
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: process.env.NODE_ENV === 'production',
      maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
      httpOnly: true
    }
  }));

  // Authentication middleware
  const isAuthenticated = (req: Request, res: Response, next: NextFunction) => {
    if (req.session && req.session.userId) {
      return next();
    }
    return res.status(401).json({ message: "Unauthorized" });
  };

  // Authentication routes
  app.post("/api/auth/register", async (req: Request, res: Response) => {
    try {
      // Validate request data
      const userData = insertUserSchema.parse(req.body);
      
      // Check if username already exists
      const existingUser = await storage.getUserByUsername(userData.username);
      if (existingUser) {
        return res.status(400).json({ message: "Username already exists" });
      }
      
      // Hash password
      userData.password = await hashPassword(userData.password);
      
      // Create user
      const newUser = await storage.createUser(userData);
      
      // Set session
      req.session.userId = newUser.id;
      
      // Return user without password
      const { password, ...userWithoutPassword } = newUser;
      res.status(201).json(userWithoutPassword);
    } catch (error) {
      console.error("Registration error:", error);
      res.status(400).json({ message: "Invalid user data", error: (error as Error).message });
    }
  });

  app.post("/api/auth/login", async (req: Request, res: Response) => {
    try {
      const { username, password } = req.body;
      
      // Find user by username
      const user = await storage.getUserByUsername(username);
      if (!user) {
        return res.status(401).json({ message: "Invalid username or password" });
      }
      
      // Verify password
      const isValid = await comparePasswords(password, user.password);
      if (!isValid) {
        return res.status(401).json({ message: "Invalid username or password" });
      }
      
      // Set session
      req.session.userId = user.id;
      
      // Return user without password
      const { password: _, ...userWithoutPassword } = user;
      res.json(userWithoutPassword);
    } catch (error) {
      console.error("Login error:", error);
      res.status(400).json({ message: "Invalid login data", error: (error as Error).message });
    }
  });

  app.post("/api/auth/logout", (req: Request, res: Response) => {
    req.session.destroy((err) => {
      if (err) {
        return res.status(500).json({ message: "Could not log out" });
      }
      res.clearCookie("connect.sid");
      res.json({ message: "Logged out successfully" });
    });
  });

  // Get current authenticated user
  app.get("/api/auth/me", async (req: Request, res: Response) => {
    if (!req.session.userId) {
      return res.status(401).json({ message: "Not authenticated" });
    }
    
    const user = await storage.getUser(req.session.userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    
    // Return user without password
    const { password, ...userWithoutPassword } = user;
    res.json(userWithoutPassword);
  });
  
  // API routes
  
  // Auth0 verification endpoint for alternative authentication flow
  app.post("/api/auth/verify", async (req: Request, res: Response) => {
    try {
      const { code, state } = req.body;
      
      // Log what we received from the client
      console.log("Auth verification request received:", { 
        hasCode: !!code, 
        hasState: !!state,
        origin: req.get('origin') || req.get('host')
      });
      
      if (!code || !state) {
        return res.status(400).json({ 
          success: false, 
          message: "Missing required parameters",
          details: "Auth0 code and state parameters are required" 
        });
      }
      
      // For simplicity in this prototype, we're treating any valid code and state as successful
      // In a production app, this would exchange the code for tokens with Auth0's token endpoint
      
      // Creating a mock user that would come from Auth0
      const mockUser = {
        id: 1,
        name: "James Wilson", // Match our existing user
        email: "james.wilson@example.com",
        picture: "https://i.pravatar.cc/150?u=james.wilson@example.com"
      };
      
      // Log success and return a success response with mock user data
      console.log("Auth verification successful with mock implementation");
      res.status(200).json({ 
        success: true, 
        message: "Authentication verified", 
        user: mockUser 
      });
    } catch (error) {
      console.error("Auth verification error:", error);
      res.status(401).json({ 
        success: false, 
        message: "Authentication failed",
        error: error instanceof Error ? error.message : String(error)
      });
    }
  });
  
  // Get current user (for demo, we'll use the first user)
  app.get("/api/user", async (req: Request, res: Response) => {
    const users = Array.from((await storage.getUserByUsername("james.wilson")) ? [await storage.getUserByUsername("james.wilson")] : []);
    const user = users[0];
    
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    
    // Remove password for security
    const { password, ...userWithoutPassword } = user;
    res.json(userWithoutPassword);
  });
  
  // Get user's credit cards
  app.get("/api/cards", async (req: Request, res: Response) => {
    // For demo purposes, always use userId 1
    const userId = 1;
    const cards = await storage.getCreditCards(userId);
    res.json(cards);
  });
  
  // Get flights
  app.get("/api/flights", async (req: Request, res: Response) => {
    const flights = await storage.getFlights();
    res.json(flights);
  });
  
  // Get hotels
  app.get("/api/hotels", async (req: Request, res: Response) => {
    const hotels = await storage.getHotels();
    res.json(hotels);
  });
  
  // Get shopping offers
  app.get("/api/shopping-offers", async (req: Request, res: Response) => {
    const category = req.query.category as string;
    
    if (category) {
      const offers = await storage.getShoppingOffersByCategory(category);
      res.json(offers);
    } else {
      const offers = await storage.getShoppingOffers();
      res.json(offers);
    }
  });
  
  // Get chat history
  app.get("/api/chat", async (req: Request, res: Response) => {
    // For demo purposes, always use userId 1
    const userId = 1;
    const messages = await storage.getChatMessages(userId);
    res.json(messages);
  });
  
  // Add a chat message and get a response
  app.post("/api/chat", async (req: Request, res: Response) => {
    try {
      const userId = 1; // For demo purposes, always use userId 1
      
      // Validate user message
      const messageData = insertChatMessageSchema.parse({
        userId,
        role: "user",
        content: req.body.message,
        timestamp: new Date().toISOString()
      });
      
      // Save user message
      const savedMessage = await storage.createChatMessage(messageData);
      
      // Get chat history for context
      const chatHistory = await storage.getChatMessages(userId);
      
      // Get user's credit cards to provide in context
      const userCards = await storage.getCreditCards(userId);
      const cardContext = userCards.map(card => 
        `${card.cardName} by ${card.issuer} (${card.cardType}): Points balance: ${card.pointsBalance}, Expires: ${card.expireDate}`
      ).join('\n');
      
      // Analyze message context using OpenAI
      const contextAnalysis = await analyzeMessageContext(req.body.message, chatHistory);
      
      // Generate AI response based on the context
      let aiResponseText = "";
      
      try {
        // Create a dynamic system prompt based on the conversation context and user's cards
        let systemPrompt = `You are CardConcierge, an AI-powered travel and shopping assistant that helps users maximize their credit card benefits.
        Your goal is to create a conversational, step-by-step planning experience that collects all necessary information.
        
        Context: ${contextAnalysis.context}
        Intent: ${contextAnalysis.intent}
        
        THE USER HAS THE FOLLOWING CREDIT CARDS:
        ${cardContext}
        
        MAKE RECOMMENDATIONS BASED ON THESE SPECIFIC CARDS. Reference the actual cards by name in your responses.
        
        IMPORTANT CONVERSATION GUIDELINES:
        
        1. For FLIGHT bookings:
           - If user hasn't specified travel dates, ask for them
           - If user hasn't specified number of passengers, ask for them
           - If user hasn't specified preferred time of day, ask for preferences
           - After collecting all necessary flight details, suggest the best credit card from the user's cards to use
           - After completing flight conversation, ask if they need hotel recommendations for their destination
           
        2. For HOTEL bookings:
           - If user hasn't specified check-in/check-out dates, ask for them
           - If user hasn't specified number of guests, ask for them
           - If user hasn't specified any preferences (area, amenities), ask for them
           - After collecting all necessary hotel details, suggest the best credit card from the user's cards to use
           - After hotel conversation, ask if they need shopping or dining recommendations for their destination
           
        3. For SHOPPING assistance:
           - If user is looking for a specific product, ask for details about their preferences
           - If user hasn't specified a budget, ask for a range
           - After understanding their shopping needs, recommend the best credit card from the user's cards to maximize rewards
           
        Always maintain a helpful, conversational tone. Ask one question at a time to avoid overwhelming the user.
        After completing one stage of planning, guide them to the next logical step in their journey.
        
        Remember that this user is from India and your recommendations should be tailored for Indian credit cards and traveling from India.`;

        const response = await openai.chat.completions.create({
          model: "gpt-4o", // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
          messages: [
            {
              role: "system",
              content: systemPrompt
            },
            ...chatHistory.map(msg => ({
              role: msg.role as "user" | "assistant",
              content: msg.content
            }))
          ],
          temperature: 0.7,
          max_tokens: 300
        });
      
        aiResponseText = response.choices[0].message.content || "I'm sorry, I couldn't generate a response. Please try again.";
      } catch (error) {
        console.error("OpenAI API error:", error);
        aiResponseText = "I'm sorry, I'm having trouble connecting to my knowledge base. Let me help you with your travel or shopping needs based on what I know about credit card benefits.";
      }
      
      // Save AI response
      const aiMessageData = insertChatMessageSchema.parse({
        userId,
        role: "assistant",
        content: aiResponseText,
        timestamp: new Date().toISOString()
      });
      
      const savedAiMessage = await storage.createChatMessage(aiMessageData);
      
      // Return both messages and the context analysis
      res.json({
        userMessage: savedMessage,
        aiMessage: savedAiMessage,
        contextAnalysis
      });
    } catch (error) {
      console.error("Error processing chat message:", error);
      res.status(400).json({ message: "Invalid message data", error: (error as Error).message });
    }
  });
  
  // Clear chat history
  app.delete("/api/chat", async (req: Request, res: Response) => {
    // This would normally delete chat messages from storage
    // But our in-memory storage doesn't support this yet
    // Instead, we'll add a welcome message
    const userId = 1;
    
    const welcomeMessage = insertChatMessageSchema.parse({
      userId,
      role: "assistant",
      content: "Hello James! I'm your CardConcierge. I see you have premium Indian credit cards including HDFC Infinia, ICICI Emeralde, and SBI Elite. How can I help you maximize your card benefits for travel or shopping today? Would you like recommendations for flights, hotels, or perhaps help finding the best deals on electronics?",
      timestamp: new Date().toISOString()
    });
    
    await storage.createChatMessage(welcomeMessage);
    
    res.json({ message: "Chat cleared successfully" });
  });

  const httpServer = createServer(app);

  return httpServer;
}

// Function to analyze message context using OpenAI
async function analyzeMessageContext(message: string, chatHistory: any[]): Promise<ContextAnalysis> {
  try {
    const contextMessages = chatHistory.slice(-8); // Get more context messages (last 8)
    
    const prompt = `
      Analyze the following user message in the context of a travel and credit card benefits assistant that guides users through step-by-step travel planning and shopping:
      
      "${message}"
      
      ${contextMessages.length > 0 ? `Recent conversation context:
      ${contextMessages.map(msg => `${msg.role}: ${msg.content}`).join('\n')}` : 'No recent conversation.'}
      
      CONTEXT ANALYSIS INSTRUCTIONS:
      
      1. For flight inquiries:
         - If this is a NEW flight query, set context to "flight"
         - If user is CONTINUING a flight conversation (answering questions about dates, passengers, etc.), MAINTAIN "flight" context
      
      2. For hotel inquiries:
         - If this is a NEW hotel query, set context to "hotel"
         - If user is CONTINUING a hotel conversation (answering about check-in/out dates, guest count, etc.), MAINTAIN "hotel" context
         - If user just completed a flight booking and this relates to hotels at their destination, set context to "hotel"
      
      3. For shopping inquiries:
         - If this is a NEW shopping query, set context to "shopping"
         - If user is CONTINUING a shopping conversation (answering about product preferences, budget, etc.), MAINTAIN "shopping" context
         - If user is responding to a suggestion about shopping at their travel destination, set context to "shopping"
      
      4. For general inquiries that don't fit above contexts, set to "general"
      
      Respond with JSON in this exact format:
      {
        "context": "flight|hotel|shopping|general",
        "intent": "describe the user's intent here",
        "entities": {
          "location": "extracted location if any",
          "dates": {
            "start": "extracted start date if any",
            "end": "extracted end date if any"
          },
          "travelers": "number of travelers if specified",
          "cardPreference": "any mentioned card preference",
          "budget": "any budget constraints mentioned",
          "category": "shopping category if relevant"
        }
      }`;
    
    try {
      const response = await openai.chat.completions.create({
        model: "gpt-4o", // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
        messages: [
          {
            role: "user",
            content: prompt
          }
        ],
        response_format: { type: "json_object" },
        temperature: 0.3
      });
      
      const content = response.choices[0].message.content || '{"context":"general","intent":"Unknown intent","entities":{}}';
      const result = JSON.parse(content);
      return result as ContextAnalysis;
    } catch (error) {
      console.error("OpenAI API error in context analysis:", error);
      // Return a default context analysis
      return {
        context: "general",
        intent: "Unknown intent due to error",
        entities: {}
      };
    }
  } catch (error) {
    console.error("Error in analyzeMessageContext:", error);
    return {
      context: "general",
      intent: "General inquiry",
      entities: {}
    };
  }
}
