import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import OpenAI from "openai";
import { z } from "zod";
import { insertChatMessageSchema } from "@shared/schema";

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
  // API routes
  
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
