import { pgTable, text, serial, integer, boolean, jsonb, numeric } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Credit Card Validation Schema
export const creditCardSchema = z.object({
  cardName: z.string(),
  issuer: z.string(),
  cardNumber: z.string(),
  pointsBalance: z.number(),
  expireDate: z.string(),
  cardType: z.string(),
  color: z.string().default("primary"),
});

// Financial Profile Validation Schema
export const financialProfileSchema = z.object({
  annualIncome: z.number().min(0),
  creditScore: z.number().min(300).max(850),
  monthlySpending: z.record(z.string(), z.number()).default({}), // Map of category ID to amount
  primarySpendingCategories: z.array(z.string()),
  travelFrequency: z.enum(['rarely', 'occasionally', 'frequently']),
  preferredAirlines: z.array(z.string()).optional(),
  shoppingHabits: z.object({
    online: z.number(),
    inStore: z.number(),
  }).optional(),
  diningFrequency: z.enum(['rarely', 'occasionally', 'frequently']),
  existingCards: z.array(z.string()).optional(),
  preferredBenefits: z.array(z.string()),
  updatedAt: z.string().optional(),
});

// Consolidated User Schema
export const consolidatedUserSchema = z.object({
  // Basic user info
  auth0Id: z.string().optional(),
  username: z.string(),
  email: z.string().email(),
  password: z.string().optional(), // Optional because of Auth0
  name: z.string(),
  membershipLevel: z.string().default("Premium"),
  pictureUrl: z.string().optional(),
  phone: z.string().optional(),
  createdAt: z.string().optional(),
  lastLogin: z.string().optional(),
  
  // Financial profile
  financialProfile: financialProfileSchema.optional(),
  
  // Credit cards
  creditCards: z.array(creditCardSchema).optional(),
});

// User Schema (for PostgreSQL - keeping for backward compatibility)
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  email: text("email").notNull().unique(),
  password: text("password").notNull(),
  name: text("name").notNull(),
  membershipLevel: text("membership_level").notNull().default("Premium"),
  pictureUrl: text("picture_url"),
  createdAt: text("created_at").notNull().default(new Date().toISOString()),
  lastLogin: text("last_login")
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  email: true,
  password: true,
  name: true,
  pictureUrl: true,
  membershipLevel: true,
}).extend({
  auth0Id: z.string().optional(),
  // Add embedded schemas as optional
  financialProfile: financialProfileSchema.optional(),
  creditCards: z.array(creditCardSchema).optional(),
});

// Legacy schemas (keeping for backward compatibility)
export const creditCards = pgTable("credit_cards", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  cardName: text("card_name").notNull(),
  issuer: text("issuer").notNull(),
  cardNumber: text("card_number").notNull(),
  pointsBalance: integer("points_balance").notNull(),
  expireDate: text("expire_date").notNull(),
  cardType: text("card_type").notNull(),
  color: text("color").notNull().default("primary"),
});

export const insertCreditCardSchema = createInsertSchema(creditCards).pick({
  userId: true,
  cardName: true,
  issuer: true,
  cardNumber: true,
  pointsBalance: true,
  expireDate: true,
  cardType: true,
  color: true,
});

export const financialProfiles = pgTable("financial_profiles", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  annualIncome: numeric("annual_income").notNull(),
  creditScore: integer("credit_score").notNull(),
  monthlySpending: jsonb("monthly_spending").notNull(), // Detailed spending by category
  primarySpendingCategories: jsonb("primary_spending_categories").notNull(), // Array of categories
  travelFrequency: text("travel_frequency").notNull(), // 'rarely', 'occasionally', 'frequently'
  preferredAirlines: jsonb("preferred_airlines"), // Array of airlines
  shoppingHabits: jsonb("shopping_habits"), // Online vs in-store preferences
  diningFrequency: text("dining_frequency").notNull(), // 'rarely', 'occasionally', 'frequently'
  existingCards: jsonb("existing_cards"), // Array of card types/issuers
  preferredBenefits: jsonb("preferred_benefits").notNull(), // Array of benefits
  createdAt: text("created_at").notNull().default(new Date().toISOString()),
  updatedAt: text("updated_at").notNull().default(new Date().toISOString()),
});

export const insertFinancialProfileSchema = createInsertSchema(financialProfiles).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

// We're keeping this for backward compatibility, but marking it as deprecated
/** @deprecated Use consolidatedUserSchema.financialProfile instead */
export const financialProfileValidationSchema = z.object({
  userId: z.union([z.number(), z.string()]),
  annualIncome: z.number().min(0),
  creditScore: z.number().min(300).max(850),
  monthlySpending: z.record(z.string(), z.number()).default({}), // Map of category ID to amount
  primarySpendingCategories: z.array(z.string()),
  travelFrequency: z.enum(['rarely', 'occasionally', 'frequently']),
  preferredAirlines: z.array(z.string()).optional(),
  shoppingHabits: z.object({
    online: z.number(),
    inStore: z.number(),
  }).optional(),
  diningFrequency: z.enum(['rarely', 'occasionally', 'frequently']),
  existingCards: z.array(z.string()).optional(),
  preferredBenefits: z.array(z.string()),
});

// Export type definitions
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect & {
  financialProfile?: z.infer<typeof financialProfileSchema>;
  creditCards?: z.infer<typeof creditCardSchema>[];
};

export type ConsolidatedUser = z.infer<typeof consolidatedUserSchema>;
export type CreditCard = typeof creditCards.$inferSelect;
export type FinancialProfile = typeof financialProfiles.$inferSelect;
export type InsertCreditCard = z.infer<typeof insertCreditCardSchema>;
export type InsertFinancialProfile = z.infer<typeof insertFinancialProfileSchema>;

// Sessions table for authentication
export const sessions = pgTable("sessions", {
  id: text("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  expiresAt: text("expires_at").notNull(),
  createdAt: text("created_at").notNull().default(new Date().toISOString()),
});

export const insertSessionSchema = createInsertSchema(sessions);
export type InsertSession = z.infer<typeof insertSessionSchema>;
export type Session = typeof sessions.$inferSelect;

// Flight Schema
export const flights = pgTable("flights", {
  id: serial("id").primaryKey(),
  airline: text("airline").notNull(),
  departureTime: text("departure_time").notNull(),
  departureAirport: text("departure_airport").notNull(),
  arrivalTime: text("arrival_time").notNull(),
  arrivalAirport: text("arrival_airport").notNull(),
  duration: text("duration").notNull(),
  isNonstop: boolean("is_nonstop").notNull(),
  pointsRequired: integer("points_required").notNull(),
  cashPrice: integer("cash_price").notNull(),
  rating: integer("rating").notNull(),
  cardBenefits: jsonb("card_benefits").notNull(),
});

export const insertFlightSchema = createInsertSchema(flights).omit({
  id: true,
});

export type InsertFlight = z.infer<typeof insertFlightSchema>;
export type Flight = typeof flights.$inferSelect;

// Hotel Schema
export const hotels = pgTable("hotels", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  location: text("location").notNull(),
  area: text("area").notNull(),
  rating: integer("rating").notNull(),
  reviewCount: integer("review_count").notNull(),
  pricePerNight: integer("price_per_night").notNull(),
  totalPrice: integer("total_price").notNull(),
  pointsEarned: integer("points_earned").notNull(),
  description: text("description").notNull(),
  imageUrl: text("image_url").notNull(),
  benefits: jsonb("benefits").notNull(),
  cardExclusiveOffer: text("card_exclusive_offer").notNull(),
});

export const insertHotelSchema = createInsertSchema(hotels).omit({
  id: true,
});

export type InsertHotel = z.infer<typeof insertHotelSchema>;
export type Hotel = typeof hotels.$inferSelect;

// Shopping Offers Schema
export const shoppingOffers = pgTable("shopping_offers", {
  id: serial("id").primaryKey(),
  storeName: text("store_name").notNull(),
  location: text("location").notNull(),
  distanceFromHotel: text("distance_from_hotel").notNull(),
  offerType: text("offer_type").notNull(),
  offerValue: text("offer_value").notNull(),
  description: text("description").notNull(),
  imageUrl: text("image_url").notNull(),
  benefits: jsonb("benefits").notNull(),
  validThrough: text("valid_through").notNull(),
  category: text("category").notNull(),
  retailers: jsonb("retailers"), // Optional retailers field
});

export const insertShoppingOfferSchema = createInsertSchema(shoppingOffers).omit({
  id: true,
});

// Define a more specific type for retailers
export type Retailer = {
  name: string;
  price: number;
  discount?: string;
  link: string;
};

// Extend the ShoppingOffer type to explicitly include retailers
export type ShoppingOffer = typeof shoppingOffers.$inferSelect & {
  retailers?: Retailer[];
};

// Chat Message Schema
export const chatMessages = pgTable("chat_messages", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  role: text("role").notNull(), // 'user' or 'assistant'
  content: text("content").notNull(),
  timestamp: text("timestamp").notNull(),
});

export const insertChatMessageSchema = createInsertSchema(chatMessages).pick({
  userId: true,
  role: true,
  content: true,
  timestamp: true,
});

export type InsertChatMessage = z.infer<typeof insertChatMessageSchema>;
export type ChatMessage = typeof chatMessages.$inferSelect;

// Card Recommendation Schema
export const cardRecommendations = pgTable("card_recommendations", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  cardName: text("card_name").notNull(),
  issuer: text("issuer").notNull(),
  cardType: text("card_type").notNull(),
  annualFee: numeric("annual_fee").notNull(),
  rewardsRate: jsonb("rewards_rate").notNull(),
  signupBonus: text("signup_bonus"),
  benefitsSummary: jsonb("benefits_summary").notNull(),
  primaryBenefits: jsonb("primary_benefits").notNull(),
  matchScore: integer("match_score").notNull(),
  matchReason: text("match_reason").notNull(),
  imageUrl: text("image_url"),
  applyUrl: text("apply_url"),
  createdAt: text("created_at").notNull().default(new Date().toISOString()),
});

export const insertCardRecommendationSchema = createInsertSchema(cardRecommendations).omit({
  id: true,
  createdAt: true,
});

export type InsertCardRecommendation = z.infer<typeof insertCardRecommendationSchema>;
export type CardRecommendation = typeof cardRecommendations.$inferSelect;
