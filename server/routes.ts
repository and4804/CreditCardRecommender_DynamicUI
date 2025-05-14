import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import OpenAI from "openai";
import { z } from "zod";
import { setupSessions, setupAuth, isAuthenticated } from "./auth";
import { insertChatMessageSchema } from "@shared/schema";

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
        create: async (params: any) => {
          // Check if this is a context analysis call or a chat completion call
          const isContextAnalysis = params.messages?.length === 1 && 
                                  params.messages[0].role === 'user' && 
                                  params.messages[0].content.includes('ANALYSIS INSTRUCTIONS');
          
          if (isContextAnalysis) {
            // For context analysis, return structured JSON
            return {
              choices: [
                {
                  message: {
                    content: JSON.stringify({
                      context: "flight",
                      intent: "search_flights",
                      reasoning: "The user is asking about flight options which indicates a flight booking intent.",
                      confidence: "high",
                      needs_clarification: false,
                      entities: {
                        location: {
                          departure: "Mumbai",
                          destination: "Dubai"
                        },
                        dates: {
                          start: "2023-12-15",
                          end: "2023-12-22"
                        },
                        travelers: 2,
                        cardPreference: "HDFC Infinia",
                        secondary_intents: []
                      }
                    })
                  }
                }
              ]
            };
          } else {
            // For regular chat responses, return a helpful message
            return {
              choices: [
                {
                  message: {
                    content: `Based on your travel plans to Dubai, your HDFC Infinia card would be the best choice for booking flights. 

Here's why:
1. The HDFC Infinia offers 5% cashback on flight bookings, which would save you approximately ₹1,140 on a typical Mumbai-Dubai flight.
2. You'll also earn 4X reward points (around 4,560 points) which can be redeemed for future travel.
3. The card provides complimentary airport lounge access at both Mumbai and Dubai airports.

For your Dubai trip between December 15-22, I'd recommend checking out our flight booking interface, where you can see all available options with your card benefits already calculated.

Would you also like me to help with hotel recommendations for your Dubai stay?`
                  }
                }
              ]
            };
          }
        }
      }
    }
  } as unknown as OpenAI;
} else {
  console.log('Using real OpenAI client with API key');
  openai = new OpenAI({ apiKey });
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
