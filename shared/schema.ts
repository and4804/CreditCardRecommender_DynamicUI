import { pgTable, text, serial, integer, boolean, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Credit Card Schema
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

export type InsertCreditCard = z.infer<typeof insertCreditCardSchema>;
export type CreditCard = typeof creditCards.$inferSelect;

// User Schema
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
});

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

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

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
});

export const insertShoppingOfferSchema = createInsertSchema(shoppingOffers).omit({
  id: true,
});

export type InsertShoppingOffer = z.infer<typeof insertShoppingOfferSchema>;
export type ShoppingOffer = typeof shoppingOffers.$inferSelect;

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
