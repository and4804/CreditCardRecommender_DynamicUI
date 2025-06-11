import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import OpenAI from "openai";
import { z } from "zod";
import { setupSessions, setupAuth, isAuthenticated } from "./auth";
import { 
  insertChatMessageSchema, 
  financialProfileValidationSchema, 
  FinancialProfile 
} from "@shared/schema";
import { MongoDBStorage } from "./mongodb-storage";
import { connectToMongoDB } from "./mongo-db";
import { getRelevantCreditCards, CreditCardVectorData, generateMITCBasedRecommendations } from "./astra-db";
import { ChatCompletionMessageParam } from "openai/resources";
import { testPineconeConnection, createPineconeIndex, searchRelevantCards } from "./pinecone-db";

// Check if we're using memory storage
const useMemStorage = process.env.USE_MEM_STORAGE === 'true';

// Initialize OpenAI with API key from environment or use a mock client in memory mode
let openai: OpenAI;
const apiKey = process.env.OPENAI_API_KEY;

if (!apiKey || apiKey === 'mock-key' || apiKey === '') {
  console.log('Using mock OpenAI client');
  // Create a mock OpenAI client
  openai = {
    chat: {
      completions: {
        create: async () => ({
          choices: [
            {
              message: {
                content: JSON.stringify([
                  {
                    cardName: "HDFC Diners Club Black",
                    issuer: "HDFC Bank",
                    cardType: "Travel Rewards",
                    annualFee: 10000,
                    rewardsRate: {
                      dining: "10X rewards",
                      travel: "10X rewards",
                      groceries: "5X rewards",
                      other: "1X rewards"
                    },
                    signupBonus: "10,000 reward points on spending ₹50,000 in first 90 days",
                    benefitsSummary: [
                      "Airport lounge access worldwide",
                      "Milestone benefits up to ₹10,000",
                      "10X rewards on select merchants",
                      "Golf privileges at courses across India"
                    ],
                    primaryBenefits: ["Travel Rewards", "Premium Lounges"],
                    matchScore: 95,
                    matchReason: "High rewards on travel and dining with premium travel benefits"
                  },
                  {
                    cardName: "Amazon Pay ICICI Bank Credit Card",
                    issuer: "ICICI Bank",
                    cardType: "Cashback",
                    annualFee: 0,
                    rewardsRate: {
                      dining: "2% back",
                      travel: "2% back",
                      groceries: "2% back",
                      other: "1% back",
                      amazon: "5% back"
                    },
                    signupBonus: "₹500 Amazon Pay balance as welcome benefit",
                    benefitsSummary: [
                      "5% cashback on Amazon.in",
                      "2% cashback on Amazon Pay partner merchants",
                      "1% cashback on all other spends",
                      "No annual fee or joining fee"
                    ],
                    primaryBenefits: ["Cashback", "No Annual Fee"],
                    matchScore: 90,
                    matchReason: "Strong cashback benefits with no annual fee"
                  },
                  {
                    cardName: "SBI SimplyCLICK Credit Card",
                    issuer: "State Bank of India",
                    cardType: "Online Shopping Rewards",
                    annualFee: 499,
                    rewardsRate: {
                      dining: "1% back",
                      travel: "1% back",
                      groceries: "1% back",
                      other: "1% back",
                      online: "5X rewards"
                    },
                    signupBonus: "₹500 worth of Amazon gift voucher on joining",
                    benefitsSummary: [
                      "5X rewards on all online spends",
                      "1% fuel surcharge waiver",
                      "eGift vouchers on milestone spends",
                      "Movie ticket discounts"
                    ],
                    primaryBenefits: ["Online Shopping Rewards", "Low Annual Fee"],
                    matchScore: 85,
                    matchReason: "Good for online shopping with reasonable annual fee"
                  }
                ])
              }
            }
          ]
        })
      }
    }
  } as any;
} else {
  try {
    console.log('Initializing OpenAI client with API key:', apiKey.substring(0, 5) + '...');
    openai = new OpenAI({
      apiKey: apiKey,
      dangerouslyAllowBrowser: false
    });
  } catch (e) {
    console.error('Error initializing OpenAI client:', e);
    // Fallback to mock client if there's an error
    console.log('Falling back to mock OpenAI client');
    openai = {
      chat: {
        completions: {
          create: async () => ({
            choices: [
              {
                message: {
                  // content: JSON.stringify(generateFallbackRecommendations({ annualIncome: 1000000, creditScore: 750, travelFrequency: 'occasionally', diningFrequency: 'occasionally', monthlySpending: {}, primarySpendingCategories: [], preferredBenefits: [] } as any))
                }
              }
            ]
          })
        }
      }
    } as any;
  }
}

// Define a type for context analysis response
type ContextAnalysis = {
  context: "flight" | "hotel" | "shopping" | "general";
  intent: string;
  reasoning?: string;
  confidence?: "high" | "medium" | "low";
  needs_clarification?: boolean;
  clarification_question?: string;
  entities: {
    location?: {
      departure?: string;
      destination?: string;
    };
    dates?: {
      start?: string;
      end?: string;
    };
    travelers?: number;
    cardPreference?: string;
    budget?: string;
    category?: string;
    secondary_intents?: string[];
  };
};

export async function registerRoutes(app: Express): Promise<Server> {
  // Setup sessions and authentication
  setupSessions(app);
  setupAuth(app);
  
  // API routes
  
  // Auth0 verification endpoint
  app.post("/api/auth/verify", async (req: Request, res: Response) => {
    try {
      const { user } = req.body; // Auth0 user object
      
      if (!user || !user.sub) { // 'sub' is Auth0's unique identifier
        return res.status(400).json({ error: "Invalid Auth0 user data" });
      }
      
      console.log("[AUTH] Verifying Auth0 user:", user.sub);
      console.log("[AUTH] Session before verify:", req.sessionID, req.session);
      
      // Store auth0Id in session immediately
      req.session.auth0Id = user.sub;
      
      // Save session to ensure it's stored before continuing
      await new Promise<void>((resolve, reject) => {
        req.session.save((err) => {
          if (err) {
            console.error("[AUTH] Session save error:", err);
            reject(err);
          } else {
            console.log("[AUTH] Session saved successfully after initial auth0Id storage:", req.sessionID);
            resolve();
          }
        });
      });
      
      // Connect to MongoDB
      const { MongoDBStorage } = await import("./mongodb-storage");
      const { connectToMongoDB } = await import("./mongo-db");
      await connectToMongoDB();
      const storage = new MongoDBStorage();
      
      // Check if user already exists in MongoDB by Auth0 ID
      let dbUser = await storage.getUserByAuth0Id(user.sub);
      
      if (!dbUser) {
        console.log("[AUTH] New user from Auth0, creating in MongoDB");
        // Create new user in MongoDB
        dbUser = await storage.createUser({
          username: user.nickname || user.email.split('@')[0],
          email: user.email,
          name: user.name,
          auth0Id: user.sub,
          pictureUrl: user.picture,
          membershipLevel: "Standard",
          password: "" // Not needed with Auth0
        });
        console.log("[AUTH] Created new user in MongoDB:", dbUser.id);
      } else {
        console.log("[AUTH] Found existing user in MongoDB:", dbUser.id);
      }
      
      // Store userId in session
      req.session.userId = dbUser.id;
      
      // Save session explicitly to ensure it's stored before responding
      await new Promise<void>((resolve, reject) => {
        req.session.save((err) => {
          if (err) {
            console.error("[AUTH] Session save error:", err);
            reject(err);
          } else {
            console.log("[AUTH] Session saved successfully with userId and auth0Id:", req.sessionID);
            resolve();
          }
        });
      });
      
      // Set up a durable cookie to help with auth fallback
      res.cookie('cardconcierge_user_id', user.sub, {
        maxAge: 90 * 24 * 60 * 60 * 1000, // 90 days
        httpOnly: true,
        sameSite: 'lax',
        secure: process.env.NODE_ENV === 'production'
      });
      
      console.log("[AUTH] Session after verify:", req.sessionID, {
        userId: req.session.userId,
        auth0Id: req.session.auth0Id
      });
      
      // Check if user has a financial profile - now looking at the embedded financialProfile
      const hasFinancialProfile = dbUser.financialProfile && 
        dbUser.financialProfile.annualIncome && 
        dbUser.financialProfile.creditScore;
      
      res.status(200).json({ 
        success: true,
        user: dbUser,
        isNewUser: !hasFinancialProfile,
        sessionId: req.sessionID
      });
    } catch (error) {
      console.error("[AUTH] Auth verification error:", error);
      res.status(500).json({ error: "Failed to verify user" });
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
    console.log("[express] Fetching credit cards for userId:", userId);
    const cards = await storage.getCreditCards(userId);
    console.log("[express] Found credit cards:", cards.length);
    res.json(cards);
  });
  
  // Get a specific card by ID
  app.get("/api/cards/:id", async (req: Request, res: Response) => {
    try {
      const cardId = parseInt(req.params.id, 10);
      if (isNaN(cardId)) {
        return res.status(400).json({ error: "Invalid card ID" });
      }
      
      console.log(`[express] Fetching details for card ID: ${cardId}`);
      
      const card = await storage.getCreditCard(cardId);
      
      if (!card) {
        console.log(`[express] Card not found with ID: ${cardId}`);
        return res.status(404).json({ error: "Card not found" });
      }
      
      // For demo purposes, only check if it belongs to userId 1
      if (card.userId !== 1) {
        console.log(`[express] Card belongs to userId ${card.userId}, not authorized`);
        return res.status(403).json({ error: "You don't have permission to view this card" });
      }
      
      console.log(`[express] Successfully retrieved card ID: ${cardId}`);
      res.json(card);
    } catch (error) {
      console.error(`[express] Error fetching card details: ${(error as Error).message}`);
      res.status(500).json({ error: "Failed to fetch credit card details" });
    }
  });
  
  // Add a credit card
  app.post("/api/cards", async (req: Request, res: Response) => {
    try {
      // For demo purposes, use userId 1 if not provided
      const userId = req.body.userId || 1;
      
      console.log("[express] Adding new credit card for userId:", userId);
      console.log("[express] Card details:", {
        cardName: req.body.cardName,
        issuer: req.body.issuer,
        cardNumber: req.body.cardNumber ? "****" + req.body.cardNumber.slice(-4) : undefined,
        pointsBalance: req.body.pointsBalance,
        expireDate: req.body.expireDate,
        cardType: req.body.cardType,
        color: req.body.color || "primary"
      });
      
      // Create the credit card
      const newCard = await storage.createCreditCard({
        userId,
        cardName: req.body.cardName,
        issuer: req.body.issuer,
        cardNumber: req.body.cardNumber,
        pointsBalance: req.body.pointsBalance,
        expireDate: req.body.expireDate,
        cardType: req.body.cardType,
        color: req.body.color || "primary"
      });
      
      console.log("[express] Successfully created new card with ID:", newCard.id);
      res.status(201).json(newCard);
    } catch (error) {
      console.error("Error creating credit card:", error);
      res.status(400).json({ 
        message: "Failed to create credit card", 
        error: (error as Error).message 
      });
    }
  });
  
  // Delete a credit card
  app.delete("/api/cards/:id", async (req: Request, res: Response) => {
    try {
      const cardId = parseInt(req.params.id, 10);
      if (isNaN(cardId)) {
        return res.status(400).json({ error: "Invalid card ID" });
      }
      
      console.log(`[express] Attempting to delete card ID: ${cardId}`);
      
      // First, check if the card exists
      const card = await storage.getCreditCard(cardId);
      
      if (!card) {
        console.log(`[express] Card not found with ID: ${cardId}`);
        return res.status(404).json({ error: "Card not found" });
      }
      
      // For demo purposes, only check if it belongs to userId 1
      if (card.userId !== 1) {
        console.log(`[express] Card belongs to userId ${card.userId}, not authorized to delete`);
        return res.status(403).json({ error: "You don't have permission to delete this card" });
      }
      
      // Delete the card
      await storage.deleteCreditCard(cardId);
      
      console.log(`[express] Successfully deleted card ID: ${cardId}`);
      res.status(200).json({ message: "Card deleted successfully" });
    } catch (error) {
      console.error(`[express] Error deleting card: ${(error as Error).message}`);
      res.status(500).json({ error: "Failed to delete credit card" });
    }
  });
  
  // Get flights
  app.get("/api/flights", async (req: Request, res: Response) => {
    try {
      console.log("[express] Fetching flights data");
      const flights = await storage.getFlights();
      console.log(`[express] Successfully retrieved ${flights.length} flights`);
      
      // Add CORS headers for local development
      res.header('Access-Control-Allow-Origin', '*');
      res.header('Access-Control-Allow-Methods', 'GET');
      res.header('Access-Control-Allow-Headers', 'Content-Type');
      
      res.json(flights);
    } catch (error) {
      console.error("[express] Error fetching flights:", error);
      res.status(500).json({ 
        error: "Failed to fetch flights data",
        message: (error as Error).message
      });
    }
  });
  
  // Get hotels
  app.get("/api/hotels", async (req: Request, res: Response) => {
    try {
      console.log("[express] Fetching hotels data");
      const hotels = await storage.getHotels();
      
      // Filter out any hotels without an ID
      const validHotels = hotels.filter(hotel => hotel && hotel.id);
      
      console.log(`[express] Successfully retrieved ${validHotels.length} hotels`);
      
      // Add CORS headers for local development
      res.header('Access-Control-Allow-Origin', '*');
      res.header('Access-Control-Allow-Methods', 'GET');
      res.header('Access-Control-Allow-Headers', 'Content-Type');
      
      res.json(validHotels);
    } catch (error) {
      console.error("[express] Error fetching hotels:", error);
      res.status(500).json({ 
        error: "Failed to fetch hotels data",
        message: (error as Error).message
      });
    }
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
  
  // Alias for '/api/shopping-offers' to handle requests from the new interface
  app.get("/api/shopping", async (req: Request, res: Response) => {
    try {
      const category = req.query.category as string;
      console.log("[express] Fetching shopping offers data");
      
      let offers;
      if (category) {
        offers = await storage.getShoppingOffersByCategory(category);
      } else {
        offers = await storage.getShoppingOffers();
      }
      
      // Filter out any empty objects to ensure valid JSON
      const validOffers = offers.filter((offer: any) => 
        offer && typeof offer === 'object' && Object.keys(offer).length > 0
      );
      
      console.log(`[express] Successfully retrieved ${validOffers.length} shopping offers`);
      
      // Add CORS headers for local development
      res.header('Access-Control-Allow-Origin', '*');
      res.header('Access-Control-Allow-Methods', 'GET');
      res.header('Access-Control-Allow-Headers', 'Content-Type');
      
      res.json(validOffers);
    } catch (error) {
      console.error("[express] Error fetching shopping offers:", error);
      res.status(500).json({ 
        error: "Failed to fetch shopping offers data",
        message: (error as Error).message
      });
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
        let systemPrompt = `You are CardConcierge, an AI-powered assistant for the Credit Card Benefits Maximizer that helps users identify which credit cards offer the best benefits for their planned activities.

Context: ${contextAnalysis.context}
Intent: ${contextAnalysis.intent}

THE USER HAS THE FOLLOWING CREDIT CARDS:
${cardContext}

MAKE RECOMMENDATIONS BASED ON THESE SPECIFIC CARDS. Reference the actual cards by name in your responses.

KEY RESPONSIBILITIES:
1. IDENTIFY the primary activity type(s) from user messages: FLIGHT, HOTEL, or SHOPPING
2. For AMBIGUOUS queries, ask ONLY the minimal clarifying questions needed to determine the activity type
3. USE CHAIN-OF-THOUGHT REASONING to explain your recommendations step-by-step
4. EXPLAIN which card benefits apply to each identified activity
5. REMEMBER that specialized UI components will collect detailed booking information, so focus on INTENT rather than details

INTENT-SPECIFIC GUIDANCE:

1. For FLIGHT intents:
   - RECOGNIZE but DO NOT ask for detailed flight information - the flight booking UI will collect this
   - EXPLAIN which card offers the best benefits for flights (miles, lounge access, travel insurance)
   - After identifying flight intent, guide user to the flight booking UI
   - SUGGEST considering hotel bookings at their destination
   
2. For HOTEL intents:
   - RECOGNIZE but DO NOT ask for detailed hotel preferences - the hotel booking UI will collect this
   - EXPLAIN which card offers the best benefits for hotel stays (free nights, status benefits, etc.)
   - After identifying hotel intent, guide user to the hotel booking UI
   - SUGGEST considering shopping or dining at their destination
   
3. For SHOPPING intents:
   - RECOGNIZE broad product categories but DO NOT ask for detailed product specifications
   - EXPLAIN which card offers the best benefits for their shopping category
   - After identifying shopping intent, guide user to the shopping UI
   
Always maintain a helpful, conversational tone. Use step-by-step reasoning to explain credit card benefits clearly. Guide the user to the appropriate specialized UI for each intent.

Remember that this user is from India and your recommendations should be tailored for Indian credit cards and traveling from India.`;

        const response = await openai.chat.completions.create({
          model: "gpt-4o", // Using the latest GPT-4o model for better recommendations
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
          temperature: 0.4, // Lower temperature for more consistent, deterministic recommendations
          max_tokens: 3000, // Increased token limit for more detailed responses
          response_format: { type: "json_object" } // We need to keep this as json_object since we're requesting a JSON array inside a JSON object
        });
      
        // Log the complete response for debugging
        console.log("COMPLETE OPENAI API RESPONSE:", response);
        
        // Try to parse the generated recommendations
        const content = response.choices[0]?.message?.content || "[]";
        console.log("RAW CONTENT FROM OPENAI:", content);
        
        // Clean the response - sometimes the model returns non-JSON wrapped content
        const jsonContent = content.replace(/```json\s+|\s+```|```/g, '');
        console.log("CLEANED CONTENT:", jsonContent);
        
        aiResponseText = jsonContent;
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
    const userId = 1;
    
    // First, actually clear all existing chat messages
    await storage.clearChatMessages(userId);
    
    // Then add a welcome message
    const welcomeMessage = insertChatMessageSchema.parse({
      userId,
      role: "assistant",
      content: "Hi there! How can I assist you today? Are you planning a trip, looking for hotel recommendations, or perhaps some help with shopping? Let me know how I can help you maximize your benefits with your Regalia by Axis Bank card!",
      timestamp: new Date().toISOString()
    });
    
    await storage.createChatMessage(welcomeMessage);
    
    res.json({ message: "Chat cleared successfully" });
  });
  
  // Financial Profile Routes
  
  // Get user's financial profile
  app.get("/api/financial-profile/user", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const userId = req.session.userId;
      const auth0Id = req.session.auth0Id;
      
      if (!userId && !auth0Id) {
        return res.status(401).json({ error: "User not authenticated" });
      }
      
      console.log("[PROFILE] Fetching financial profile for user:", userId, "Auth0 ID:", auth0Id);
      
      // Connect to MongoDB
      const { MongoDBStorage } = await import("./mongodb-storage");
      const { connectToMongoDB } = await import("./mongo-db");
      await connectToMongoDB();
      const storage = new MongoDBStorage();
      
      // First, get the MongoDB user
      let dbUser;
      let profile = null;
      
      if (auth0Id) {
        // Try to find user by Auth0 ID
        dbUser = await storage.getUserByAuth0Id(auth0Id);
        if (dbUser) {
          profile = await storage.getFinancialProfileByUserId(dbUser.id);
        }
      } 
      
      if (!profile && userId) {
        // Try by direct userId if available
        profile = await storage.getFinancialProfileByUserId(userId);
      }
      
      if (!profile) {
        console.log("[PROFILE] No financial profile found for user");
        return res.status(404).json({ 
          error: "Financial profile not found",
          isNewUser: true
        });
      }
      
      console.log("[PROFILE] Found financial profile for user");
      res.status(200).json({
        profile,
        isNewUser: false
      });
    } catch (error) {
      console.error("[PROFILE] Error fetching user profile:", error);
      res.status(500).json({ error: "Failed to fetch financial profile" });
    }
  });

  // Save or update user's financial profile
  app.post("/api/financial-profile", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const userId = req.session.userId;
      const auth0Id = req.session.auth0Id;
      const auth0UserId = req.body.auth0UserId; // Auth0 ID from request body as fallback
      
      console.log("[PROFILE] Session data:", { 
        sessionId: req.sessionID, 
        userId, 
        auth0Id,
        headers: {
          'X-Auth-User-ID': req.headers['x-auth-user-id'],
          'X-Auth-Session': req.headers['x-auth-session']
        },
        bodyAuth0UserId: auth0UserId
      });
      
      // Try multiple auth methods
      if (!userId && !auth0Id && !auth0UserId) {
        return res.status(401).json({ error: "User not authenticated" });
      }
      
      console.log("[PROFILE] Saving financial profile - Auth via:", 
        userId ? "session.userId" : auth0Id ? "session.auth0Id" : "body.auth0UserId");
      
      // Connect to MongoDB
      const { MongoDBStorage } = await import("./mongodb-storage");
      const { connectToMongoDB } = await import("./mongo-db");
      const mongoose = await import("mongoose");
      await connectToMongoDB();
      const storage = new MongoDBStorage();
      
      // First, ensure we have the MongoDB user object
      let dbUser;
      
      // Try finding user by different auth methods
      if (auth0Id) {
        dbUser = await storage.getUserByAuth0Id(auth0Id);
      }
      
      if (!dbUser && auth0UserId) {
        dbUser = await storage.getUserByAuth0Id(auth0UserId);
      }
      
      if (!dbUser && userId) {
        dbUser = await storage.getUser(userId);
      }
      
      // If no user found but auth0 ID exists, create a new user
      if (!dbUser && (auth0Id || auth0UserId)) {
        const effectiveAuth0Id = auth0Id || auth0UserId;
        console.log("[PROFILE] No user found, creating new user with Auth0 ID:", effectiveAuth0Id);
        
        dbUser = await storage.createUser({
          username: `user_${Date.now()}`,
          email: "unknown@example.com", // Will be updated later
          name: "Unknown User", // Will be updated later
          auth0Id: effectiveAuth0Id,
          password: "password", // Required by schema but not used
          membershipLevel: "Standard"
        });
      }
      
      if (!dbUser) {
        return res.status(400).json({ error: "Could not find or create user" });
      }
      
      console.log("[PROFILE] Using MongoDB user:", dbUser.id);
      
      // Create a valid MongoDB ObjectId from the user's _id
      const mongoUserId = dbUser.id;
      
      // Check if profile already exists
      const existingProfile = await storage.getFinancialProfileByUserId(mongoUserId);
      
      // Prepare profile data with userId
      const profileData = {
        ...req.body,
        userId: mongoUserId
      };
      
      // Remove auth0UserId from profileData as it's not part of the schema
      delete profileData.auth0UserId;
      
      // Validate the data
      const { financialProfileValidationSchema } = await import("@shared/schema");
      const validation = financialProfileValidationSchema.safeParse(profileData);
      
      if (!validation.success) {
        console.error("[PROFILE] Validation error:", validation.error);
        return res.status(400).json({
          error: "Invalid financial profile data",
          details: validation.error.format()
        });
      }
      
      let profile;
      if (existingProfile) {
        // Update existing profile
        console.log("[PROFILE] Updating existing profile for user:", mongoUserId);
        profile = await storage.updateFinancialProfile(mongoUserId, profileData);
      } else {
        // Create new profile
        console.log("[PROFILE] Creating new profile for user:", mongoUserId);
        profile = await storage.createFinancialProfile(profileData);
      }
      
      res.status(200).json({
        success: true,
        profile,
        message: existingProfile ? "Profile updated successfully" : "Profile created successfully"
      });
    } catch (error) {
      console.error("[PROFILE] Error saving financial profile:", error);
      res.status(500).json({ 
        error: "Failed to save financial profile",
        message: error instanceof Error ? error.message : String(error)
      });
    }
  });
  
  // Get card recommendations for current user
  app.get("/api/card-recommendations", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const userId = req.session.userId;
      
      if (!userId) {
        return res.status(401).json({ error: "User not authenticated" });
      }
      
      const recommendations = await storage.getCardRecommendationsByUserId(userId);
      
      res.status(200).json(recommendations);
    } catch (error) {
      console.error("Get card recommendations error:", error);
      res.status(500).json({ error: "Failed to retrieve card recommendations" });
    }
  });
  
  // Temporary direct access to recommendations (without authentication check)
  app.get("/api/temp-recommendations/:userId", async (req: Request, res: Response) => {
    try {
      const userId = parseInt(req.params.userId);
      
      if (isNaN(userId)) {
        return res.status(400).json({ error: "Invalid user ID" });
      }
      
      console.log(`[express] Temporary recommendation access for user ${userId}`);
      const recommendations = await storage.getCardRecommendationsByUserId(userId);
      
      res.status(200).json(recommendations);
    } catch (error) {
      console.error("Temp recommendations access error:", error);
      res.status(500).json({ error: "Failed to retrieve recommendations" });
    }
  });

  // Helper endpoint to ensure recommendations exist
  app.get("/api/ensure-recommendations", async (req: Request, res: Response) => {
    try {
      const userId = 1; // Always use user 1 for this helper
      
      // Check if recommendations exist
      const existingRecommendations = await storage.getCardRecommendationsByUserId(userId);
      console.log(`[express] Found ${existingRecommendations.length} existing recommendations for user ${userId}`);
      
      if (existingRecommendations.length === 0) {
        console.log(`[express] Creating fallback recommendations for user ${userId}`);
        
        // Get the user's profile or create a simple one
        const profile = await storage.getFinancialProfileByUserId(userId) || {
          userId: 1,
          annualIncome: 1000000,
          creditScore: 750,
          monthlySpending: {
            groceries: 20000,
            dining: 15000,
            travel: 30000,
            shopping: 25000
          },
          primarySpendingCategories: ["travel", "dining", "shopping"],
          travelFrequency: "frequently",
          diningFrequency: "frequently",
          preferredBenefits: ["travel_rewards", "cashback"],
          preferredAirlines: ["air_india", "vistara"],
          existingCards: [],
        } as any;
        
        // Generate fallback recommendations
        // const fallbackRecs = generateFallbackRecommendations(profile);
        
        // Add user ID and create
        // const recsWithUserId = fallbackRecs.map(rec => ({ ...rec, userId }));
        // const createdRecs = await storage.createCardRecommendations(recsWithUserId);
        
        // console.log(`[express] Created ${createdRecs.length} fallback recommendations for user ${userId}`);
        
        // return res.status(200).json({
        //   message: "Created fallback recommendations",
        //   recommendations: createdRecs
        // });
      }
      
      res.status(200).json({
        message: "Recommendations already exist",
        count: existingRecommendations.length
      });
    } catch (error) {
      console.error("Error ensuring recommendations:", error);
      res.status(500).json({ error: "Failed to ensure recommendations" });
    }
  });

  // Endpoint to regenerate recommendations
  app.post("/api/financial-profile/regenerate-recommendations", async (req: Request, res: Response) => {
    try {
      const userId = 1; // Use user ID 1 for demo purposes
      console.log(`[express] Regenerating recommendations for user ${userId}`);
      
      // First get the user's profile
      const profile = await storage.getFinancialProfileByUserId(userId);
      
      if (!profile) {
        return res.status(404).json({ error: "Financial profile not found" });
      }
      
      // Delete existing recommendations
      await storage.deleteCardRecommendationsByUserId(userId);
      console.log(`[express] Deleted existing recommendations for user ${userId}`);
      
      // Generate new recommendations
      await generateCardRecommendations(userId, profile);
      console.log(`[express] Generated new recommendations for user ${userId}`);
      
      // Get the new recommendations
      const newRecommendations = await storage.getCardRecommendationsByUserId(userId);
      
      res.status(200).json({
        message: "Recommendations regenerated successfully",
        count: newRecommendations.length
      });
    } catch (error) {
      console.error("Error regenerating recommendations:", error);
      res.status(500).json({ error: "Failed to regenerate recommendations" });
    }
  });

  // Modified MongoDB test endpoint to be more lenient with authentication
  app.post("/api/financial-profile/mongodb-test", async (req: Request, res: Response) => {
    try {
      console.log("[MONGODB TEST] Received request to save profile directly to MongoDB");
      
      // Import mongoose for creating ObjectId
      const mongoose = await import("mongoose");
      
      // Create a proper MongoDB ObjectId instead of using a string
      const validMongoId = new mongoose.Types.ObjectId().toString();

      console.log(`[MONGODB TEST] Using MongoDB ObjectId: ${validMongoId} for storage`);
      
      // Ensure profile data has a userId field that's a valid ObjectId string
      const profileData = {
        ...req.body,
        userId: validMongoId
      };
      
      // Import the validationSchema
      const { financialProfileValidationSchema } = await import("@shared/schema");
      
      // Validate the request body
      const validation = financialProfileValidationSchema.safeParse(profileData);
      if (!validation.success) {
        console.error("[MONGODB TEST] Validation error:", validation.error);
        return res.status(400).json({
          error: "Invalid financial profile data",
          details: validation.error.format()
        });
      }
      
      // Import the MongoDBStorage class and create an instance
      const { MongoDBStorage } = await import("./mongodb-storage");
      const mongoDBStorage = new MongoDBStorage();
      console.log("[MONGODB TEST] Created MongoDB storage instance");
      
      // Connect to MongoDB
      const { connectToMongoDB } = await import("./mongo-db");
      await connectToMongoDB();
      console.log("[MONGODB TEST] Connected to MongoDB");
      
      // Check if profile already exists in MongoDB
      try {
        const existingProfile = await mongoDBStorage.getFinancialProfileByUserId(validMongoId);
        console.log("[MONGODB TEST] Existing profile found:", !!existingProfile);
        
        let profile;
        if (existingProfile) {
          // Update existing profile in MongoDB
          console.log("[MONGODB TEST] Updating existing profile in MongoDB");
          profile = await mongoDBStorage.updateFinancialProfile(validMongoId, profileData);
        } else {
          // Create new profile in MongoDB
          console.log("[MONGODB TEST] Creating new profile in MongoDB");
          profile = await mongoDBStorage.createFinancialProfile(profileData);
        }
        console.log("[MONGODB TEST] Profile saved successfully to MongoDB:", !!profile);
        
        res.status(200).json({
          message: "Profile explicitly saved to MongoDB for testing",
          profile,
          storedIn: "MongoDB"
        });
      } catch (dbError) {
        console.error("[MONGODB TEST] MongoDB operation error:", dbError);
        throw dbError;
      }
    } catch (error) {
      console.error("[MONGODB TEST] Error saving to MongoDB:", error);
      res.status(500).json({ 
        error: "Failed to save financial profile to MongoDB",
        message: error instanceof Error ? error.message : String(error)
      });
    }
  });

  // Comprehensive MongoDB test endpoint that creates user, credit cards, and financial profile
  app.post("/api/mongodb-test/complete-user-data", async (req: Request, res: Response) => {
    try {
      console.log("[MONGODB COMPLETE TEST] Starting comprehensive data creation");
      
      // Import necessary MongoDB classes and utilities
      const { MongoDBStorage } = await import("./mongodb-storage");
      const mongoose = await import("mongoose");
      const storage = new MongoDBStorage();
      
      // Connect to MongoDB
      const { connectToMongoDB } = await import("./mongo-db");
      await connectToMongoDB();
      console.log("[MONGODB COMPLETE TEST] Connected to MongoDB");
      
      // 1. Create a test user
      const userData = {
        username: "testuser" + Date.now().toString().slice(-4),
        email: `test${Date.now().toString().slice(-4)}@example.com`,
        name: "Test User",
        membershipLevel: "Premium",
        pictureUrl: "https://randomuser.me/api/portraits/lego/1.jpg",
        password: "password123"  // Not used in MongoDB but required by schema
      };
      
      console.log("[MONGODB COMPLETE TEST] Creating test user:", userData.username);
      const user = await storage.createUser(userData);
      console.log("[MONGODB COMPLETE TEST] Created user with ID:", user.id);
      
      // 2. Create two credit cards for the user
      const creditCard1Data = {
        userId: user.id,
        cardName: "Test Visa Signature",
        issuer: "Test Bank",
        cardNumber: "4111111111111111",
        pointsBalance: 5000,
        expireDate: "12/28",
        cardType: "visa",
        color: "blue"
      };
      
      const creditCard2Data = {
        userId: user.id,
        cardName: "Test Platinum",
        issuer: "Premium Bank",
        cardNumber: "5555555555554444",
        pointsBalance: 12000,
        expireDate: "10/27",
        cardType: "mastercard",
        color: "black"
      };
      
      console.log("[MONGODB COMPLETE TEST] Creating credit cards for user");
      const card1 = await storage.createCreditCard(creditCard1Data);
      const card2 = await storage.createCreditCard(creditCard2Data);
      console.log("[MONGODB COMPLETE TEST] Created cards with IDs:", card1.id, card2.id);
      
      // 3. Create financial profile with the same user ID
      const financialData = {
        ...req.body,
        userId: user.id,
        // Add default values if not provided in the request
        annualIncome: req.body.annualIncome || 10000000,
        creditScore: req.body.creditScore || 750,
        monthlySpending: req.body.monthlySpending || {
          groceries: 30000,
          dining: 25000,
          travel: 35000,
          gas: 15000,
          entertainment: 20000,
          shopping: 40000,
          utilities: 10000,
          healthcare: 15000,
          education: 25000
        },
        primarySpendingCategories: req.body.primarySpendingCategories || [
          "groceries", "dining", "travel", "shopping", "entertainment"
        ],
        travelFrequency: req.body.travelFrequency || "frequently",
        diningFrequency: req.body.diningFrequency || "frequently",
        preferredBenefits: req.body.preferredBenefits || [
          "cashback", "travel_points", "airport_lounge"
        ],
        preferredAirlines: req.body.preferredAirlines || [
          "air_india", "emirates", "vistara"
        ],
        existingCards: req.body.existingCards || [
          "citi_prestige", "rbl_icon"
        ],
        shoppingHabits: req.body.shoppingHabits || {
          online: 70,
          inStore: 30
        }
      };
      
      console.log("[MONGODB COMPLETE TEST] Creating financial profile for user");
      const profile = await storage.createFinancialProfile(financialData);
      console.log("[MONGODB COMPLETE TEST] Created profile with ID:", profile.id);
      
      // Return all created data
      res.status(200).json({
        message: "Successfully created complete user data in MongoDB",
        user,
        creditCards: [card1, card2],
        financialProfile: profile
      });
      
    } catch (error) {
      console.error("[MONGODB COMPLETE TEST] Error creating complete data:", error);
      res.status(500).json({
        error: "Failed to create complete user data in MongoDB",
        message: error instanceof Error ? error.message : String(error)
      });
    }
  });

  // Endpoint to get recommendations based on user's financial profile
  app.get("/api/recommendations", async (req: Request, res: Response) => {
    try {
      // Get session data for debugging
      console.log("[RECOMMENDATIONS] Session data:", JSON.stringify(req.session, null, 2));
      console.log("[RECOMMENDATIONS] Headers:", {
        'x-auth-user-id': req.headers['x-auth-user-id'],
        'cookie': req.headers.cookie ? req.headers.cookie.substring(0, 30) + '...' : 'none'
      });
      
      // Get user ID from session or headers
      const userId = req.session.auth0Id || req.session.userId || req.headers['x-auth-user-id'];
      
      if (!userId) {
        console.log("[RECOMMENDATIONS] No user ID found in session or headers, returning fallback");
        // Instead of 401, return 200 with a flag indicating authentication is needed
        // This allows the client to handle the situation gracefully
        return res.status(200).json({ 
          authNeeded: true,
          message: "Authentication required",
          //recommendations: getFallbackRecommendations()
        });
      }
      
      console.log(`[RECOMMENDATIONS] Getting recommendations for user: ${userId}`);
      
      // Connect to MongoDB
      await connectToMongoDB();
      
      // Create storage instance
      const mongoDBStorage = new MongoDBStorage();
      
      // Get the user by Auth0 ID (or try to if it's a string)
      let user;
      if (typeof userId === 'string') {
        user = await mongoDBStorage.getUserByAuth0Id(userId);
      }
      
      if (!user) {
        console.log(`[RECOMMENDATIONS] User not found: ${userId}`);
        return res.status(200).json({
          userNotFound: true,
          message: "User not found",
          //recommendations: getFallbackRecommendations()
        });
      }
      
      console.log(`[RECOMMENDATIONS] Found user: ${user.id}`);
      
      // Check if user has a financial profile
      if (!user.financialProfile) {
        console.log(`[RECOMMENDATIONS] No financial profile found for user: ${user.id}`);
        return res.status(200).json({ 
          profileNeeded: true,
          message: "Please fill out your financial profile first",
          //recommendations: getFallbackRecommendations()
        });
      }
      
      console.log(`[RECOMMENDATIONS] Found financial profile for user: ${user.id}`);
      
      // Check if we already have recommendations for this user in MongoDB
      const existingRecommendations = await mongoDBStorage.getCardRecommendationsByUserId(user.id);
      
      // If we have recommendations, return them
      if (existingRecommendations && existingRecommendations.length > 0) {
        console.log(`[RECOMMENDATIONS] Found ${existingRecommendations.length} existing recommendations for user: ${user.id}`);
        return res.status(200).json(existingRecommendations);
      }
      
      // No existing recommendations, return a single card recommendation
      console.log(`[RECOMMENDATIONS] Generating recommendation for user: ${user.id}`);
      
      // Use default recommendation tied to the user
      const recommendation = {
        cardName: "HDFC Diners Club Black",
        issuer: "HDFC Bank",
        cardType: "Travel Rewards",
        annualFee: "10000",
        rewardsRate: {
          dining: "10X rewards",
          travel: "10X rewards",
          groceries: "5X rewards",
          other: "1X rewards"
        },
        signupBonus: "10,000 reward points on spending ₹50,000 in first 90 days",
        benefitsSummary: [
          "Airport lounge access worldwide",
          "Milestone benefits up to ₹10,000",
          "10X rewards on select merchants",
          "Golf privileges at courses across India"
        ],
        primaryBenefits: ["Travel Rewards", "Premium Lounges"],
        matchScore: 95,
        matchReason: "High rewards on travel and dining with premium travel benefits",
        userId: user.id
      };
      
      // Save recommendation to MongoDB
      try {
        await mongoDBStorage.deleteCardRecommendationsByUserId(user.id);
        await mongoDBStorage.createCardRecommendations([recommendation]);
        console.log(`[RECOMMENDATIONS] Successfully saved recommendation for user: ${user.id}`);
      } catch (saveError) {
        console.error(`[RECOMMENDATIONS] Error saving recommendation for user ${user.id}:`, saveError);
        // Continue anyway since we already have the recommendation in memory
      }
      
      // Return recommendation as an array
      return res.status(200).json([recommendation]);
    } catch (error) {
      console.error("[RECOMMENDATIONS] Error generating recommendations:", error);
      // Return fallback recommendations rather than error
      return res.status(200).json({
        error: true,
        message: "Failed to generate recommendations",
        //recommendations: getFallbackRecommendations()
      });
    }
  });

  // Endpoint to regenerate recommendations
  app.post("/api/recommendations/regenerate", async (req: Request, res: Response) => {
    try {
      // Get user ID from session or headers
      const userId = req.session.auth0Id || req.session.userId || req.headers['x-auth-user-id'];
      
      if (!userId) {
        return res.status(200).json({ 
          authNeeded: true,
          message: "Authentication required to regenerate recommendations"
        });
      }
      
      console.log(`[RECOMMENDATIONS] Regenerating recommendations for user: ${userId}`);
      
      // Connect to MongoDB and find the user
      const mongoDBStorage = new MongoDBStorage();
      await connectToMongoDB();
      
      // Get the user
      let user;
      if (typeof userId === 'string') {
        user = await mongoDBStorage.getUserByAuth0Id(userId);
      }
      
      if (!user) {
        return res.status(200).json({ 
          userNotFound: true,
          message: "User not found"
        });
      }
      
      // Delete existing recommendations
      await mongoDBStorage.deleteCardRecommendationsByUserId(user.id);
      
      // Return success response
      return res.status(200).json({
        success: true,
        message: "Recommendations will be regenerated on next request",
        userId: user.id
      });
    } catch (error) {
      console.error("[RECOMMENDATIONS] Error regenerating recommendations:", error);
      return res.status(200).json({ 
        error: true,
        message: "Failed to regenerate recommendations"
      });
    }
  });

  // Diagnostic endpoint for authentication status
  app.get("/api/auth/status", async (req: Request, res: Response) => {
    try {
      console.log("[AUTH STATUS] Session data:", JSON.stringify(req.session, null, 2));
      console.log("[AUTH STATUS] Headers:", {
        'x-auth-user-id': req.headers['x-auth-user-id'],
        'cookie': req.headers.cookie ? req.headers.cookie.substring(0, 30) + '...' : 'none'
      });
      
      // Get user ID from session or headers
      const sessionUserId = req.session.userId;
      const sessionAuth0Id = req.session.auth0Id;
      const headerAuthId = req.headers['x-auth-user-id'];
      
      // Connect to MongoDB to check if user exists
      let mongoUser = null;
      try {
        await connectToMongoDB();
        const mongoDBStorage = new MongoDBStorage();
        
        if (sessionAuth0Id && typeof sessionAuth0Id === 'string') {
          mongoUser = await mongoDBStorage.getUserByAuth0Id(sessionAuth0Id);
        }
        
        if (!mongoUser && headerAuthId && typeof headerAuthId === 'string') {
          mongoUser = await mongoDBStorage.getUserByAuth0Id(headerAuthId);
        }
      } catch (mongoError) {
        console.error("[AUTH STATUS] MongoDB error:", mongoError);
      }
      
      // Return comprehensive auth status
      return res.status(200).json({
        sessionId: req.sessionID,
        sessionActive: !!req.session,
        sessionUserId: sessionUserId,
        sessionAuth0Id: sessionAuth0Id,
        headerAuthId: headerAuthId,
        isAuthenticated: !!(sessionUserId || sessionAuth0Id || headerAuthId),
        mongoUserFound: !!mongoUser,
        mongoUserId: mongoUser?.id,
        time: new Date().toISOString(),
        cookiesPresent: !!req.headers.cookie
      });
    } catch (error) {
      console.error("[AUTH STATUS] Error:", error);
      return res.status(500).json({ 
        error: "Failed to check auth status",
        message: error instanceof Error ? error.message : String(error)
      });
    }
  });

  // Direct OpenAI recommendation endpoint with hybrid approach
  app.post("/api/direct-recommendation", async (req: Request, res: Response) => {
    try {
      console.log("[HYBRID-RECOMMENDATION] Starting hybrid recommendation process...");
      
      // Initialize storage
      const storage = new MongoDBStorage();
      
      // Get user data from session or headers
      const sessionUserId = req.session.userId;
      const auth0Id = req.session.auth0Id;
      
      // Convert sessionUserId to number, defaulting to 0 if not available
      let numericUserId = 0;
      if (typeof sessionUserId === 'string') {
        const parsed = parseInt(sessionUserId, 10);
        numericUserId = isNaN(parsed) ? 0 : parsed;
      } else if (typeof sessionUserId === 'number') {
        numericUserId = sessionUserId;
      }
      
      console.log("[HYBRID-RECOMMENDATION] User ID:", numericUserId, "Auth0 ID:", auth0Id);
      
      // Get user profile from MongoDB
      let userProfile = null;
      let profileData = null;
      
      if (numericUserId > 0 || auth0Id) {
        try {
          // Try to get user profile
          if (auth0Id) {
            const dbUser = await storage.getUserByAuth0Id(auth0Id);
            if (dbUser) {
              userProfile = await storage.getFinancialProfileByUserId(dbUser.id);
              profileData = userProfile;
              // Update numericUserId if we found the user
              if (numericUserId === 0) {
                numericUserId = dbUser.id;
              }
            }
          } else if (numericUserId > 0) {
            userProfile = await storage.getFinancialProfileByUserId(numericUserId);
            profileData = userProfile;
          }
        } catch (profileError) {
          console.log("[HYBRID-RECOMMENDATION] Could not fetch user profile:", profileError);
        }
      }
      
      // Get income from request body or profile
      const { income, expenses, preferences } = req.body;
      
      // If no profile and no income provided, return error
      if (!userProfile && !income) {
        return res.status(400).json({ 
          error: "Annual income is required for recommendation",
          message: "Please provide your annual income to get personalized credit card recommendations."
        });
      }
      
      // Create a complete profile for the hybrid approach
      const completeProfile = {
        userId: numericUserId || 1, // Use 1 as fallback for demo purposes
        annualIncome: userProfile?.annualIncome || income || 1000000,
        creditScore: userProfile?.creditScore || 750,
        monthlySpending: userProfile?.monthlySpending || { dining: 5000, travel: 3000, shopping: 4000 },
        primarySpendingCategories: userProfile?.primarySpendingCategories || ['dining', 'travel'],
        travelFrequency: userProfile?.travelFrequency || 'occasionally',
        diningFrequency: userProfile?.diningFrequency || 'occasionally',
        preferredBenefits: userProfile?.preferredBenefits || ['cashback', 'rewards'],
        preferredAirlines: userProfile?.preferredAirlines || [],
        existingCards: userProfile?.existingCards || [],
        shoppingHabits: userProfile?.shoppingHabits || { online: 50, inStore: 50 }
      } as {
        userId: number;
        annualIncome: number;
        creditScore: number;
        monthlySpending: Record<string, number>;
        primarySpendingCategories: string[];
        travelFrequency: string;
        diningFrequency: string;
        preferredBenefits: string[];
        preferredAirlines?: string[];
        existingCards?: string[];
        shoppingHabits?: { online: number; inStore: number };
      };
      
      console.log("[HYBRID-RECOMMENDATION] Using profile:", completeProfile);
      
      try {
        // Try Pinecone-based recommendations first (using actual MITC documents)
        console.log("[HYBRID-RECOMMENDATION] Attempting Pinecone-based recommendations...");
        const { generatePineconeRecommendations } = await import("./pinecone-db");
        
        const pineconeRecommendations = await generatePineconeRecommendations({
          ...completeProfile,
          userId: String(completeProfile.userId) // Convert number to string for Pinecone
        }, 7);
        
        if (pineconeRecommendations && pineconeRecommendations.length > 0) {
          console.log(`[HYBRID-RECOMMENDATION] Successfully generated ${pineconeRecommendations.length} Pinecone recommendations`);
          
          const primaryRecommendation = pineconeRecommendations[0];
          
          const finalResponse = {
            ...primaryRecommendation,
            ...(profileData && { profileData }),
            source: "pinecone_mitc_based",
            totalRecommendations: pineconeRecommendations.length,
            allRecommendations: pineconeRecommendations
          };
          
          return res.status(200).json(finalResponse);
        } else {
          console.log("[HYBRID-RECOMMENDATION] No Pinecone recommendations, trying AstraDB...");
        }
      } catch (pineconeError) {
        console.error("[HYBRID-RECOMMENDATION] Pinecone approach failed:", pineconeError);
        console.log("[HYBRID-RECOMMENDATION] Falling back to AstraDB approach...");
      }
      
      try {
        // Fallback to AstraDB + OpenAI approach
        const { generateMITCBasedRecommendations } = await import("./astra-db");
        
        console.log("[HYBRID-RECOMMENDATION] Calling generateMITCBasedRecommendations...");
        const recommendations = await generateMITCBasedRecommendations(completeProfile, 3);
        
        if (recommendations && recommendations.length > 0) {
          console.log(`[HYBRID-RECOMMENDATION] Successfully generated ${recommendations.length} AstraDB recommendations`);
          
          // Return the first recommendation (or all if you want multiple)
          const primaryRecommendation = recommendations[0];
          
          // Add profile data to the response if available
          const finalResponse = {
            ...primaryRecommendation,
            ...(profileData && { profileData }),
            source: "hybrid_astradb_openai",
            totalRecommendations: recommendations.length,
            allRecommendations: recommendations // Include all recommendations
          };
          
          return res.status(200).json(finalResponse);
        } else {
          console.log("[HYBRID-RECOMMENDATION] No recommendations from AstraDB approach, falling back to pure OpenAI");
          throw new Error("No recommendations from AstraDB approach");
        }
        
      } catch (hybridError) {
        console.error("[HYBRID-RECOMMENDATION] Hybrid approach failed:", hybridError);
        console.log("[HYBRID-RECOMMENDATION] Falling back to pure OpenAI approach...");
        
        // Fallback to pure OpenAI approach
        const annualIncome = completeProfile.annualIncome;
        const monthlyExpenses = Object.values(completeProfile.monthlySpending).reduce((sum, val) => sum + (typeof val === 'number' ? val : 0), 0) || (expenses || 0);
        const userPreferences = completeProfile.preferredBenefits.join(", ");
        const primarySpendingCategories = completeProfile.primarySpendingCategories.join(", ");
        
        const prompt = `
As an expert credit card advisor for Indian users, recommend ONE credit card based on the following information:

- Annual Income: ₹${annualIncome}
- Monthly Expenses: ${monthlyExpenses ? `₹${monthlyExpenses}` : "Not specified"}
- Preferences/Needs: ${userPreferences || "Not specified"}
- Primary Spending Categories: ${primarySpendingCategories}
- Travel Frequency: ${completeProfile.travelFrequency}
- Dining Frequency: ${completeProfile.diningFrequency}

Provide a single credit card recommendation in the following JSON format:
{
  "cardName": "Card name",
  "issuer": "Bank or company issuing the card",
  "cardType": "Type of card (Rewards/Cashback/Travel/Premium)",
  "annualFee": fee_amount_in_rupees_as_number,
  "rewardsRate": {
    "category1": "reward description",
    "category2": "reward description"
  },
  "signupBonus": "Description of any welcome offers",
  "benefitsSummary": ["Benefit 1", "Benefit 2", "Benefit 3", "Benefit 4"],
  "primaryBenefits": ["Key benefit 1", "Key benefit 2"],
  "matchScore": match_percentage_between_70_and_100,
  "matchReason": "Personalized explanation of why this card matches the user's profile"
}

Important: Return ONLY the JSON object with no additional text.`;
        
        // Call OpenAI API as fallback
        const response = await openai.chat.completions.create({
          model: "gpt-4o",
          messages: [
            {
              role: "system",
              content: "You are an expert financial advisor specializing in Indian credit cards. Provide accurate, helpful recommendations based on the user's financial profile."
            },
            {
              role: "user",
              content: prompt
            }
          ],
          temperature: 0.2,
          max_tokens: 1000,
          response_format: { type: "json_object" }
        });
        
        const content = response.choices[0]?.message?.content || "{}";
        console.log("[HYBRID-RECOMMENDATION] Fallback OpenAI response:", content);
        
        try {
          const recommendation = JSON.parse(content);
          
          if (!recommendation.cardName || !recommendation.issuer) {
            throw new Error("Invalid recommendation format");
          }
          
          const finalResponse = {
            ...recommendation,
            ...(profileData && { profileData }),
            source: "fallback_openai_only"
          };
          
          return res.status(200).json(finalResponse);
        } catch (parseError) {
          console.error("[HYBRID-RECOMMENDATION] Parse error:", parseError);
          return res.status(500).json({ error: "Failed to parse recommendation" });
        }
      }
      
    } catch (error) {
      console.error("[HYBRID-RECOMMENDATION] Error:", error);
      return res.status(500).json({ 
        error: "Failed to get recommendation",
        details: error instanceof Error ? error.message : String(error)
      });
    }
  });

  // Test endpoint for AstraDB
  app.get("/api/test-astra", async (req: Request, res: Response) => {
    try {
      const astraDb = await import("./astra-db");
      const cards = await astraDb.getCreditCardsWithMITC();
      
      res.json({ 
        success: true, 
        count: cards.length, 
        cards 
      });
    } catch (error) {
      console.error("Error in test-astra endpoint:", error);
      res.json({ 
        success: false, 
        error: String(error),
        message: "Failed to query AstraDB"
      });
    }
  });

  // Test endpoint for Pinecone
  app.get("/api/test-pinecone", async (req: Request, res: Response) => {
    try {
      const result = await testPineconeConnection();
      res.json(result);
    } catch (error) {
      console.error("Error in test-pinecone endpoint:", error);
      res.json({ 
        success: false, 
        error: String(error),
        message: "Failed to connect to Pinecone"
      });
    }
  });

  // Test endpoint for Pinecone cards
  app.get("/api/test-pinecone-cards", async (req: Request, res: Response) => {
    try {
      const { searchRelevantCards } = await import("./pinecone-db");
      
      const testProfile = {
        annualIncome: 1200000,
        creditScore: 750,
        primarySpendingCategories: ["dining", "travel"],
        travelFrequency: "frequently",
        diningFrequency: "frequently",
        preferredBenefits: ["travel rewards", "lounge access"]
      };
      
      const cards = await searchRelevantCards(testProfile, 10);
      
      res.json({
        success: true,
        totalCards: cards.length,
        cards: cards.map(card => ({
          id: card.id,
          cardName: card.cardName,
          issuer: card.issuer,
          cardType: card.cardType,
          annualFee: card.annualFee
        }))
      });
    } catch (error) {
      console.error("Error testing Pinecone cards:", error);
      res.json({ 
        success: false, 
        error: String(error),
        message: "Failed to retrieve cards from Pinecone"
      });
    }
  });

  // Create Pinecone index endpoint
  app.post("/api/create-pinecone-index", async (req: Request, res: Response) => {
    try {
      await createPineconeIndex();
      res.json({ 
        success: true, 
        message: "Pinecone index created successfully"
      });
    } catch (error) {
      console.error("Error creating Pinecone index:", error);
      res.json({ 
        success: false, 
        error: String(error),
        message: "Failed to create Pinecone index"
      });
    }
  });

  // Test endpoint to get all cards from Pinecone
  app.get('/api/test-all-cards', async (req, res) => {
    try {
      console.log('🧪 Testing getAllCardsFromPinecone function...');
      const { getAllCardsFromPinecone } = await import('./pinecone-db');
      const allCards = await getAllCardsFromPinecone();
      
      console.log(`📊 getAllCardsFromPinecone returned ${allCards.length} cards`);
      
      res.json({
        success: true,
        totalCards: allCards.length,
        cards: allCards.map(card => ({
          cardName: card.cardName,
          issuer: card.issuer,
          cardType: card.cardType,
          annualFee: card.annualFee
        }))
      });
    } catch (error) {
      console.error('❌ Error testing getAllCardsFromPinecone:', error);
      res.status(500).json({ 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      });
    }
  });

  // Test endpoint to check environment variables
  app.get('/api/test-env', async (req, res) => {
    try {
      res.json({
        success: true,
        openaiKeyExists: !!process.env.OPENAI_API_KEY,
        openaiKeyLength: process.env.OPENAI_API_KEY?.length || 0,
        pineconeKeyExists: !!process.env.PINECONE_API_KEY,
        pineconeIndexName: process.env.PINECONE_INDEX_NAME || 'not set'
      });
    } catch (error) {
      res.status(500).json({ 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      });
    }
  });

  const httpServer = createServer(app);

  return httpServer;
}

// Function to analyze message context using OpenAI
async function analyzeMessageContext(message: string, chatHistory: any[]): Promise<ContextAnalysis> {
  try {
    const contextMessages = chatHistory.slice(-8); // Get more context messages (last 8)
    
    const prompt = `
      Analyze the following user message in the context of a credit card benefits assistant that helps users maximize rewards for travel and shopping:
      
      "${message}"
      
      ${contextMessages.length > 0 ? `Recent conversation context:
      ${contextMessages.map(msg => `${msg.role}: ${msg.content}`).join('\n')}` : 'No recent conversation.'}
      
      ANALYSIS INSTRUCTIONS:
      
      1. IDENTIFY PRIMARY AND SECONDARY INTENTS
         - Determine if message indicates FLIGHT, HOTEL, SHOPPING, or GENERAL intent
         - Identify any secondary intents (e.g., message about flight but also mentions hotel)
         - Prioritize intents based on user's immediate needs
         - Use chain-of-thought reasoning to explain your classification
      
      2. EXTRACT RELEVANT ENTITIES WITH REASONING
         - Location information: departure/destination for travel
         - Dates: travel dates, length of stay
         - People: number of travelers
         - Card mentions: any specific credit cards referenced
         - Shopping categories: types of products mentioned
         - Budget information: spending limits or ranges
      
      3. DETERMINE CONFIDENCE LEVEL
         - Assess how confident you are in the intent classification
         - If confidence is low, indicate clarification is needed
      
      Respond with JSON in this exact format:
      {
        "context": "flight|hotel|shopping|general",
        "intent": "describe the user's intent here",
        "reasoning": "explain your step-by-step reasoning for this classification",
        "confidence": "high|medium|low",
        "needs_clarification": true|false,
        "clarification_question": "only if clarification needed",
        "entities": {
          "location": {
            "departure": "extracted departure location if any",
            "destination": "extracted destination if any"
          },
          "dates": {
            "start": "extracted start date if any",
            "end": "extracted end date if any"
          },
          "travelers": "number of travelers if specified",
          "cardPreference": "any mentioned card preference",
          "budget": "any budget constraints mentioned",
          "category": "shopping category if relevant",
          "secondary_intents": ["array", "of", "secondary", "intents"]
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
        intent: "Unknown intent",
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

// Add this function after the registerRoutes function
async function generateCardRecommendations(userId: number, profile: FinancialProfile): Promise<void> {
  try {
    // Delete existing recommendations for this user
    await storage.deleteCardRecommendationsByUserId(userId);
    
    // Type casting for the profile's array fields to ensure proper handling
    const primarySpendingCategories = Array.isArray(profile.primarySpendingCategories) 
      ? profile.primarySpendingCategories 
      : [];
      
    const preferredBenefits = Array.isArray(profile.preferredBenefits)
      ? profile.preferredBenefits
      : [];
      
    const preferredAirlines = profile.preferredAirlines && Array.isArray(profile.preferredAirlines)
      ? profile.preferredAirlines
      : [];
      
    const existingCards = profile.existingCards && Array.isArray(profile.existingCards)
      ? profile.existingCards
      : [];
    
    // Format monthly spending for better readability in the prompt
    const formattedSpending = Object.entries(profile.monthlySpending as Record<string, number>).map(([category, amount]) => 
      `${category}: ₹${amount.toLocaleString()}`
    ).join(', ');
    
    // Get shopping habits with type safety
    const shoppingHabitsText = profile.shoppingHabits && 
      typeof profile.shoppingHabits === 'object' && 
      'online' in profile.shoppingHabits && 
      'inStore' in profile.shoppingHabits
        ? `${profile.shoppingHabits.online}% online, ${profile.shoppingHabits.inStore}% in-store` 
        : 'Not specified';
    
    // First approach: Get credit cards with MITC content from AstraDB
    let mitcCards: CreditCardVectorData[] = [];
    try {
      console.log("Fetching credit cards with MITC content from AstraDB...");
      mitcCards = await getRelevantCreditCards({
        annualIncome: typeof profile.annualIncome === 'string' ? parseInt(profile.annualIncome, 10) : profile.annualIncome,
        creditScore: typeof profile.creditScore === 'string' ? parseInt(profile.creditScore, 10) : profile.creditScore,
        primarySpendingCategories,
        travelFrequency: profile.travelFrequency,
        diningFrequency: profile.diningFrequency,
        preferredBenefits
      });
      console.log(`Retrieved ${mitcCards.length} cards with MITC content from AstraDB`);
    } catch (astraError) {
      console.error("Error fetching cards with MITC content from AstraDB:", astraError);
    }
    
    // If we have MITC cards, use those for MITC-based recommendations
    if (mitcCards.length > 0) {
      console.log("Using MITC-based recommendation approach");
      
      try {
        // Use the new function from astra-db.ts
        const mitcRecommendations = await generateMITCBasedRecommendations({
          userId,
          annualIncome: typeof profile.annualIncome === 'string' ? parseInt(profile.annualIncome, 10) : profile.annualIncome,
          creditScore: typeof profile.creditScore === 'string' ? parseInt(profile.creditScore, 10) : profile.creditScore,
          monthlySpending: profile.monthlySpending as Record<string, number>,
          primarySpendingCategories,
          travelFrequency: profile.travelFrequency,
          diningFrequency: profile.diningFrequency,
          preferredBenefits,
          preferredAirlines,
          existingCards,
          shoppingHabits: profile.shoppingHabits as { online: number; inStore: number } | undefined
        }, 5);
        
        if (mitcRecommendations.length > 0) {
          // Save recommendations to database
          await storage.createCardRecommendations(mitcRecommendations);
          console.log(`Saved ${mitcRecommendations.length} MITC-based credit card recommendations for user ${userId}`);
          return;
        } else {
          console.log("No MITC-based recommendations generated, falling back to standard approach");
        }
      } catch (mitcError) {
        console.error("Error generating MITC-based recommendations:", mitcError);
        console.log("Falling back to standard recommendation approach");
      }
    }
    
    // Second approach: Get relevant credit cards from AstraDB based on user profile
    let relevantCards: CreditCardVectorData[] = [];
    if (mitcCards.length === 0) {
      try {
        console.log("Fetching relevant credit cards from AstraDB...");
        relevantCards = await getRelevantCreditCards({
          annualIncome: typeof profile.annualIncome === 'string' ? parseInt(profile.annualIncome, 10) : profile.annualIncome,
          creditScore: typeof profile.creditScore === 'string' ? parseInt(profile.creditScore, 10) : profile.creditScore,
          primarySpendingCategories,
          travelFrequency: profile.travelFrequency,
          diningFrequency: profile.diningFrequency,
          preferredBenefits
        });
        console.log(`Retrieved ${relevantCards.length} relevant cards from AstraDB`);
      } catch (astraError) {
        console.error("Error fetching cards from AstraDB:", astraError);
      }
    }
    
    // Determine which set of cards to use
    const cardsToUse = mitcCards.length > 0 ? mitcCards : relevantCards;
    
    // If we have cards from AstraDB, use them for standard recommendations
    if (cardsToUse.length > 0) {
      try {
        // Format cards for the prompt
        const formattedCards = cardsToUse.map(card => {
          return {
            id: card.id || "",
            name: card.cardName || "Credit Card",
            issuer: card.issuer || "Unknown",
            type: card.cardType || "Credit Card",
            annualFee: card.annualFee || 0,
            rewardsRate: card.rewardsRate || {},
            signupBonus: card.signupBonus || "",
            benefitsSummary: card.benefitsSummary || [],
            primaryBenefits: card.primaryBenefits || []
          };
        });
        
        // Create a prompt for OpenAI
        const prompt = `
        Please recommend the top 3 credit cards for this user based on their financial profile and our database of cards:
        
        # User Financial Profile
        - Annual Income: ₹${profile.annualIncome.toLocaleString()}
        - Credit Score: ${profile.creditScore}
        - Monthly Spending Breakdown: ${formattedSpending}
        - Top Spending Categories: ${primarySpendingCategories.join(', ')}
        - Travel Frequency: ${profile.travelFrequency}
        - Dining Frequency: ${profile.diningFrequency}
        - Shopping Habits: ${shoppingHabitsText}
        - Preferred Benefits: ${preferredBenefits.join(', ')}
        ${preferredAirlines.length > 0 ? `- Preferred Airlines: ${preferredAirlines.join(', ')}` : ''}
        ${existingCards.length > 0 ? `- Existing Cards: ${existingCards.join(', ')}` : ''}
        
        # Available Credit Cards
        ${JSON.stringify(formattedCards, null, 2)}
        
        For each recommendation, provide:
        1. Card ID (from our database)
        2. Card Name
        3. Issuer (bank or financial institution)
        4. Card Type (e.g., Travel, Cashback, Rewards)
        5. Annual Fee
        6. Rewards Rate (as an object mapping categories to rates)
        7. Benefits Summary (array of benefits)
        8. Primary Benefits (array of key benefits)
        9. Match Score (percentage)
        10. Match Reason (why this card is suitable for the user)
        
        Return the recommendations as a JSON array.
        `;
        
        // Create properly typed messages for OpenAI
        const messages: ChatCompletionMessageParam[] = [
          { 
            role: "system", 
            content: "You are an expert credit card advisor who specializes in Indian credit cards. You provide detailed, accurate recommendations based on financial profiles and our database of cards. Your analysis should focus on matching the user's spending patterns, preferences, and needs with the most suitable cards. ALWAYS provide EXACTLY 3 credit card recommendations in the requested format. Only recommend cards from the provided list, DO NOT invent or hallucinate cards." 
          },
          { role: "user", content: prompt }
        ];
        
        // Call OpenAI API
        console.log("Calling OpenAI API for credit card recommendations");
        const response = await openai.chat.completions.create({
          model: "gpt-4o",
          messages: messages,
          temperature: 0.3,
          max_tokens: 3500,
          response_format: { type: "json_object" }
        });
        
        // Process the response
        const content = response.choices[0]?.message?.content || "{}";
        console.log("Received response from OpenAI");
        
        try {
          // Parse the response
          const jsonContent = content.replace(/```json\s+|\s+```|```/g, '');
          let parsedResponse = JSON.parse(jsonContent);
          
          // Handle different response formats
          let recommendations = [];
          if (Array.isArray(parsedResponse)) {
            recommendations = parsedResponse;
          } else if (parsedResponse.recommendations && Array.isArray(parsedResponse.recommendations)) {
            recommendations = parsedResponse.recommendations;
          } else {
            recommendations = [parsedResponse];
          }
          
          // Ensure we have at least 3 recommendations
          const targetCount = 3;
          if (recommendations.length < targetCount) {
            console.log(`Adding fallback recommendations to reach ${targetCount}`);
            
            // Create a FinancialProfile object for fallback recommendations
            const fallbackProfile = {
              userId: profile.userId,
              annualIncome: profile.annualIncome,
              creditScore: profile.creditScore,
              monthlySpending: profile.monthlySpending || {},
              primarySpendingCategories: primarySpendingCategories,
              travelFrequency: profile.travelFrequency || 'occasionally',
              diningFrequency: profile.diningFrequency || 'occasionally',
              preferredBenefits: preferredBenefits,
              preferredAirlines: preferredAirlines,
              existingCards: existingCards,
              shoppingHabits: profile.shoppingHabits || { online: 50, inStore: 50 }
            };
            
            // Generate fallback recommendations
            //const fallbackRecs = generateFallbackRecommendations(fallbackProfile as FinancialProfile);
            
            // Add fallback recommendations to reach targetCount
            // for (let i = recommendations.length; i < targetCount; i++) {
            //   if (fallbackRecs[i - recommendations.length]) {
            //     recommendations.push(fallbackRecs[i - recommendations.length]);
            //   }
            // }
          }
          
          // Format recommendations for storage
          const recsToSave = recommendations.map((rec: {
            cardName?: string;
            issuer?: string;
            cardType?: string;
            annualFee?: number | string;
            rewardsRate?: Record<string, string>;
            signupBonus?: string;
            benefitsSummary?: string[];
            primaryBenefits?: string[];
            matchScore?: number;
            matchReason?: string;
          }) => ({
            userId: userId,
            cardName: rec.cardName || "Unknown Card",
            issuer: rec.issuer || "Unknown Issuer",
            cardType: rec.cardType || "Credit Card",
            annualFee: String(rec.annualFee || 0),
            rewardsRate: rec.rewardsRate || {},
            signupBonus: rec.signupBonus || null,
            benefitsSummary: rec.benefitsSummary || [],
            primaryBenefits: rec.primaryBenefits || [],
            matchScore: rec.matchScore || 0,
            matchReason: rec.matchReason || "This card may match your profile."
          }));
          
          // Save recommendations to database
          await storage.createCardRecommendations(recsToSave);
          console.log(`Saved ${recsToSave.length} credit card recommendations for user ${userId}`);
        } catch (parseError) {
          console.error("Error parsing OpenAI response:", parseError);
          // Generate and save fallback recommendations
          // const fallbackRecs = generateFallbackRecommendations(profile as FinancialProfile);
          // await storage.createCardRecommendations(fallbackRecs.map(rec => ({
          //   userId: userId,
          //   ...rec
          // })));
          // console.log(`Saved ${fallbackRecs.length} fallback credit card recommendations for user ${userId}`);
        }
      } catch (openaiError) {
        console.error("Error calling OpenAI API:", openaiError);
        // Generate and save fallback recommendations
        // const fallbackRecs = generateFallbackRecommendations(profile as FinancialProfile);
        // await storage.createCardRecommendations(fallbackRecs.map(rec => ({
        //   userId: userId,
        //   ...rec
        // })));
        // console.log(`Saved ${fallbackRecs.length} fallback credit card recommendations for user ${userId}`);
      }
    } else {
      console.log("No cards found in AstraDB, using fallback recommendations");
      // Generate and save fallback recommendations
      // const fallbackRecs = generateFallbackRecommendations(profile as FinancialProfile);
      // await storage.createCardRecommendations(fallbackRecs.map(rec => ({
      //   userId: userId,
      //   ...rec
      // })));
      // console.log(`Saved ${fallbackRecs.length} fallback credit card recommendations for user ${userId}`);
    }
  } catch (error) {
    console.error("Error generating card recommendations:", error);
    throw error;
  }
}

// Fallback recommendations function when OpenAI API fails
// function generateFallbackRecommendations(profile: FinancialProfile) {
//   // Check if profile has travel as a preference
//   const prefersTravelRewards = Array.isArray(profile.preferredBenefits) && 
//     profile.preferredBenefits.some(b => b.includes('travel'));
    
//   // Check if profile has cashback as a preference
//   const prefersCashback = Array.isArray(profile.preferredBenefits) && 
//     profile.preferredBenefits.some(b => b.includes('cash'));
    
//   // Check if profile has frequent travel
//   const frequentTraveler = profile.travelFrequency === 'frequently';
  
//   // Select relevant cards based on preferences
//   const recommendations = [];
  
//   // Add travel card if user prefers travel
//   if (prefersTravelRewards || frequentTraveler) {
//     recommendations.push({
//       cardName: "HDFC Diners Club Black",
//       issuer: "HDFC Bank",
//       cardType: "Travel Rewards",
//       annualFee: "10000",
//       rewardsRate: {
//         dining: "10X rewards",
//         travel: "10X rewards",
//         groceries: "5X rewards",
//         other: "1X rewards"
//       },
//       signupBonus: "10,000 reward points on spending ₹50,000 in first 90 days",
//       benefitsSummary: [
//         "Airport lounge access worldwide",
//         "Milestone benefits up to ₹10,000",
//         "10X rewards on select merchants",
//         "Golf privileges at courses across India"
//       ],
//       primaryBenefits: ["Travel Rewards", "Premium Lounges"],
//       matchScore: frequentTraveler ? 95 : 85,
//       matchReason: "High rewards on travel and dining with premium travel benefits",
//       imageUrl: "https://www.hdfcbank.com/content/api/contentstream-id/723fb80a-2dde-42a3-9793-7ae1be57c87f/f1f4db7a-e60e-4753-9e5b-96c47010fc91/Personal/Pay/Cards/Credit-Cards/Diners-Black/Banner/Diners_Black.jpg",
//       applyUrl: "https://www.hdfcbank.com/personal/pay/cards/credit-cards/diners-club-black"
//     });
//   }
  
//   // Add cashback card if user prefers cashback
//   if (prefersCashback || !prefersTravelRewards) {
//     recommendations.push({
//       cardName: "Amazon Pay ICICI Bank Credit Card",
//       issuer: "ICICI Bank",
//       cardType: "Cashback",
//       annualFee: "0",
//       rewardsRate: {
//         dining: "2% back",
//         travel: "2% back",
//         groceries: "2% back",
//         other: "1% back",
//         amazon: "5% back"
//       },
//       signupBonus: "₹500 Amazon Pay balance as welcome benefit",
//       benefitsSummary: [
//         "5% cashback on Amazon.in",
//         "2% cashback on Amazon Pay partner merchants",
//         "1% cashback on all other spends",
//         "No annual fee or joining fee"
//       ],
//       primaryBenefits: ["Cashback", "No Annual Fee"],
//       matchScore: prefersCashback ? 90 : 80,
//       matchReason: "Strong cashback benefits with no annual fee",
//       imageUrl: "https://m.media-amazon.com/images/G/31/payments-portal/r1/issuer-images/icici-bank-cc-new._CB632974078_.jpg",
//       applyUrl: "https://www.amazon.in/amazonpay/icicicard"
//     });
//   }
  
//   // Add a premium card for high income profiles
//   if (Number(profile.annualIncome) >= 1000000) {
//     recommendations.push({
//       cardName: "HDFC Infinia",
//       issuer: "HDFC Bank",
//       cardType: "Premium Rewards",
//       annualFee: "12500",
//       rewardsRate: {
//         dining: "5X rewards",
//         travel: "5X rewards",
//         groceries: "3X rewards",
//         other: "3X rewards"
//       },
//       signupBonus: "10,000 reward points on first spend",
//       benefitsSummary: [
//         "Unlimited airport lounge access",
//         "Reward points never expire",
//         "Premium concierge services",
//         "Milestone benefits up to ₹20,000 annually"
//       ],
//       primaryBenefits: ["Premium Services", "Travel Benefits"],
//       matchScore: 88,
//       matchReason: "Premium card with excellent rewards suited for your income level",
//       imageUrl: "https://www.hdfcbank.com/content/api/contentstream-id/723fb80a-2dde-42a3-9793-7ae1be57c87f/ae05df62-4c24-4615-8800-de4d004b5095/Common/HDFC%20cards/infinia-credit-card-image.jpg",
//       applyUrl: "https://www.hdfcbank.com/personal/pay/cards/credit-cards/infinia-credit-card"
//     });
//   }
  
//   // Ensure we have at least 3 recommendations
//   if (recommendations.length < 3) {
//     recommendations.push({
//       cardName: "SBI SimplyCLICK Credit Card",
//       issuer: "State Bank of India",
//       cardType: "Online Shopping Rewards",
//       annualFee: "499",
//       rewardsRate: {
//         dining: "1% back",
//         travel: "1% back",
//         groceries: "1% back",
//         other: "1% back",
//         online: "5X rewards"
//       },
//       signupBonus: "₹500 worth of Amazon gift voucher on joining",
//       benefitsSummary: [
//         "5X rewards on all online spends",
//         "1% fuel surcharge waiver",
//         "eGift vouchers on milestone spends",
//         "Movie ticket discounts"
//       ],
//       primaryBenefits: ["Online Shopping Rewards", "Low Annual Fee"],
//       matchScore: 75,
//       matchReason: "Good for online shopping with reasonable annual fee",
//       imageUrl: "https://www.sbicard.com/sbi-card-en/assets/media/images/personal/credit-cards/shopping/simplyclick-sbi-card/simplyclick-credit-card.jpg",
//       applyUrl: "https://www.sbicard.com/en/personal/credit-cards/shopping/simplyclick-sbi-card.page"
//     });
//   }
  
//   return recommendations;
// }

// Add this helper function at the end of the file
// function getFallbackRecommendations() {
//   return [
//     {
//       cardName: "HDFC Diners Club Black",
//       issuer: "HDFC Bank",
//       cardType: "Travel Rewards",
//       annualFee: "10000",
//       rewardsRate: {
//         dining: "10X rewards",
//         travel: "10X rewards",
//         groceries: "5X rewards",
//         other: "1X rewards"
//       },
//       signupBonus: "10,000 reward points on spending ₹50,000 in first 90 days",
//       benefitsSummary: [
//         "Airport lounge access worldwide",
//         "Milestone benefits up to ₹10,000",
//         "10X rewards on select merchants",
//         "Golf privileges at courses across India"
//       ],
//       primaryBenefits: ["Travel Rewards", "Premium Lounges"],
//       matchScore: 95,
//       matchReason: "High rewards on travel and dining with premium travel benefits"
//     },
//     {
//       cardName: "Amazon Pay ICICI Bank Credit Card",
//       issuer: "ICICI Bank",
//       cardType: "Cashback",
//       annualFee: "0",
//       rewardsRate: {
//         dining: "2% back",
//         travel: "2% back",
//         groceries: "2% back",
//         other: "1% back",
//         amazon: "5% back"
//       },
//       signupBonus: "₹500 Amazon Pay balance as welcome benefit",
//       benefitsSummary: [
//         "5% cashback on Amazon.in",
//         "2% cashback on Amazon Pay partner merchants",
//         "1% cashback on all other spends",
//         "No annual fee or joining fee"
//       ],
//       primaryBenefits: ["Cashback", "No Annual Fee"],
//       matchScore: 90,
//       matchReason: "Strong cashback benefits with no annual fee"
//     }
//   ];
// }
