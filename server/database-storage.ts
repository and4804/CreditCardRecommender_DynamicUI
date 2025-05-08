import { 
  User, 
  InsertUser, 
  CreditCard, 
  InsertCreditCard, 
  Flight, 
  InsertFlight, 
  Hotel, 
  InsertHotel, 
  ShoppingOffer, 
  InsertShoppingOffer, 
  ChatMessage, 
  InsertChatMessage,
  users,
  creditCards,
  flights,
  hotels,
  shoppingOffers,
  chatMessages
} from "@shared/schema";
import { db } from "./db";
import { eq } from "drizzle-orm";
import { IStorage } from "./storage";

export class DatabaseStorage implements IStorage {
  // User methods
  async getUser(id: number): Promise<User | undefined> {
    const foundUsers = await db.select().from(users).where(eq(users.id, id)).limit(1);
    return foundUsers.length > 0 ? foundUsers[0] : undefined;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const foundUsers = await db.select().from(users).where(eq(users.username, username)).limit(1);
    return foundUsers.length > 0 ? foundUsers[0] : undefined;
  }

  async createUser(user: InsertUser): Promise<User> {
    const [newUser] = await db.insert(users).values({
      ...user,
      createdAt: new Date().toISOString(),
      lastLogin: new Date().toISOString()
    }).returning();
    return newUser;
  }

  // Credit Card methods
  async getCreditCards(userId: number): Promise<CreditCard[]> {
    return await db.select().from(creditCards).where(eq(creditCards.userId, userId));
  }

  async getCreditCard(id: number): Promise<CreditCard | undefined> {
    const foundCards = await db.select().from(creditCards).where(eq(creditCards.id, id)).limit(1);
    return foundCards.length > 0 ? foundCards[0] : undefined;
  }

  async createCreditCard(card: InsertCreditCard): Promise<CreditCard> {
    const [newCard] = await db.insert(creditCards).values(card).returning();
    return newCard;
  }

  // Flight methods
  async getFlights(): Promise<Flight[]> {
    return await db.select().from(flights);
  }

  async getFlight(id: number): Promise<Flight | undefined> {
    const foundFlights = await db.select().from(flights).where(eq(flights.id, id)).limit(1);
    return foundFlights.length > 0 ? foundFlights[0] : undefined;
  }

  async createFlight(flight: InsertFlight): Promise<Flight> {
    const [newFlight] = await db.insert(flights).values(flight).returning();
    return newFlight;
  }

  // Hotel methods
  async getHotels(): Promise<Hotel[]> {
    return await db.select().from(hotels);
  }

  async getHotel(id: number): Promise<Hotel | undefined> {
    const foundHotels = await db.select().from(hotels).where(eq(hotels.id, id)).limit(1);
    return foundHotels.length > 0 ? foundHotels[0] : undefined;
  }

  async createHotel(hotel: InsertHotel): Promise<Hotel> {
    const [newHotel] = await db.insert(hotels).values(hotel).returning();
    return newHotel;
  }

  // Shopping Offer methods
  async getShoppingOffers(): Promise<ShoppingOffer[]> {
    return await db.select().from(shoppingOffers);
  }

  async getShoppingOffersByCategory(category: string): Promise<ShoppingOffer[]> {
    return await db.select().from(shoppingOffers).where(eq(shoppingOffers.category, category));
  }

  async getShoppingOffer(id: number): Promise<ShoppingOffer | undefined> {
    const foundOffers = await db.select().from(shoppingOffers).where(eq(shoppingOffers.id, id)).limit(1);
    return foundOffers.length > 0 ? foundOffers[0] : undefined;
  }

  async createShoppingOffer(offer: InsertShoppingOffer): Promise<ShoppingOffer> {
    const [newOffer] = await db.insert(shoppingOffers).values(offer).returning();
    return newOffer;
  }

  // Chat Message methods
  async getChatMessages(userId: number): Promise<ChatMessage[]> {
    return await db.select().from(chatMessages).where(eq(chatMessages.userId, userId));
  }

  async createChatMessage(message: InsertChatMessage): Promise<ChatMessage> {
    const [newMessage] = await db.insert(chatMessages).values(message).returning();
    return newMessage;
  }
}