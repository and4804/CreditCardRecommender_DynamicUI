import { IStorage, PgStorage } from "./storage";
import {
  User, InsertUser, CreditCard, InsertCreditCard,
  Flight, InsertFlight, Hotel, InsertHotel,
  ShoppingOffer, ChatMessage, InsertChatMessage,
  FinancialProfile, InsertFinancialProfile,
  CardRecommendation, InsertCardRecommendation,
  InsertShoppingOffer,
  ConsolidatedUser
} from "@shared/schema";
import { User as MongoUser, CreditCard as MongoCreditCard, FinancialProfile as MongoFinancialProfile } from "./models/mongo-models";
import mongoose from "mongoose";

// MongoDB implementation of storage interface
export class MongoDBStorage implements IStorage {
  // User methods
  async getUser(id: number | string): Promise<User | undefined> {
    try {
      const user = await MongoUser.findById(id);
      if (!user) return undefined;
      
      return this.mapMongoUserToUser(user);
    } catch (error) {
      console.error("Error getting user:", error);
      return undefined;
    }
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    try {
      const user = await MongoUser.findOne({ username });
      if (!user) return undefined;
      
      return this.mapMongoUserToUser(user);
    } catch (error) {
      console.error("Error getting user by username:", error);
      return undefined;
    }
  }

  async getUserByAuth0Id(auth0Id: string): Promise<User | undefined> {
    try {
      const user = await MongoUser.findOne({ auth0Id });
      if (!user) return undefined;
      
      return this.mapMongoUserToUser(user);
    } catch (error) {
      console.error("Error getting user by Auth0 ID:", error);
      return undefined;
    }
  }

  async createUser(userData: InsertUser): Promise<User> {
    try {
      // Extract the financial profile and credit cards if they exist
      const { financialProfile, creditCards, ...userBasicData } = userData as any;
      
      const newUser = new MongoUser({
        ...userBasicData,
        createdAt: new Date(),
        lastLogin: new Date()
      });
      
      // Add financial profile if provided
      if (financialProfile) {
        newUser.financialProfile = {
          ...financialProfile,
          updatedAt: new Date()
        };
      }
      
      // Add credit cards if provided
      if (creditCards && Array.isArray(creditCards) && creditCards.length > 0) {
        newUser.creditCards = creditCards;
      }
      
      await newUser.save();
      
      return this.mapMongoUserToUser(newUser);
    } catch (error) {
      console.error("Error creating user:", error);
      throw error;
    }
  }
  
  // Helper method to map MongoDB user document to User type
  private mapMongoUserToUser(user: any): User {
    return {
      id: user._id.toString(),
      username: user.username,
      email: user.email,
      name: user.name,
      password: "", // We don't return the password
      membershipLevel: user.membershipLevel,
      pictureUrl: user.pictureUrl,
      createdAt: user.createdAt.toISOString(),
      lastLogin: user.lastLogin?.toISOString(),
      // Include financialProfile if it exists
      ...(user.financialProfile ? {
        financialProfile: {
          annualIncome: user.financialProfile.annualIncome,
          creditScore: user.financialProfile.creditScore,
          monthlySpending: user.financialProfile.monthlySpending || {},
          primarySpendingCategories: user.financialProfile.primarySpendingCategories || [],
          travelFrequency: user.financialProfile.travelFrequency,
          preferredAirlines: user.financialProfile.preferredAirlines,
          shoppingHabits: user.financialProfile.shoppingHabits,
          diningFrequency: user.financialProfile.diningFrequency,
          existingCards: user.financialProfile.existingCards,
          preferredBenefits: user.financialProfile.preferredBenefits,
          updatedAt: user.financialProfile.updatedAt?.toISOString()
        }
      } : {}),
      // Include creditCards if they exist
      ...(user.creditCards && user.creditCards.length > 0 ? {
        creditCards: user.creditCards.map((card: any) => ({
          id: card._id?.toString(),
          cardName: card.cardName,
          issuer: card.issuer,
          cardNumber: card.cardNumber,
          pointsBalance: card.pointsBalance,
          expireDate: card.expireDate,
          cardType: card.cardType,
          color: card.color || 'primary'
        }))
      } : {})
    };
  }

  // Credit Card methods
  async getCreditCards(userId: number | string): Promise<CreditCard[]> {
    try {
      const user = await MongoUser.findById(userId);
      if (!user || !user.creditCards || user.creditCards.length === 0) {
        return [];
      }
      
      return user.creditCards.map((card: any) => ({
        id: card._id?.toString() || new mongoose.Types.ObjectId().toString(),
        userId: userId.toString(),
        cardName: card.cardName,
        issuer: card.issuer,
        cardNumber: card.cardNumber,
        pointsBalance: card.pointsBalance,
        expireDate: card.expireDate,
        cardType: card.cardType,
        color: card.color || 'primary'
      }));
    } catch (error) {
      console.error("Error getting credit cards:", error);
      return [];
    }
  }

  async getCreditCard(id: number | string): Promise<CreditCard | undefined> {
    try {
      // Find a user with a credit card that has the specified ID
      const user = await MongoUser.findOne({ "creditCards._id": id });
      if (!user || !user.creditCards) return undefined;
      
      const card = user.creditCards.find((card: any) => card._id.toString() === id.toString());
      if (!card) return undefined;
      
      return {
        id: card._id.toString(),
        userId: user._id.toString(),
        cardName: card.cardName,
        issuer: card.issuer,
        cardNumber: card.cardNumber,
        pointsBalance: card.pointsBalance,
        expireDate: card.expireDate,
        cardType: card.cardType,
        color: card.color || 'primary'
      };
    } catch (error) {
      console.error("Error getting credit card:", error);
      return undefined;
    }
  }

  async createCreditCard(card: InsertCreditCard): Promise<CreditCard> {
    try {
      const userId = card.userId;
      const user = await MongoUser.findById(userId);
      
      if (!user) {
        throw new Error(`User with ID ${userId} not found`);
      }
      
      // Generate a new ID for the card
      const cardId = new mongoose.Types.ObjectId();
      
      // Add the card to the user's creditCards array
      const newCard = {
        _id: cardId,
        cardName: card.cardName,
        issuer: card.issuer,
        cardNumber: card.cardNumber,
        pointsBalance: card.pointsBalance,
        expireDate: card.expireDate,
        cardType: card.cardType,
        color: card.color || 'primary'
      };
      
      // Initialize creditCards array if it doesn't exist
      if (!user.creditCards) {
        user.creditCards = [];
      }
      
      user.creditCards.push(newCard);
      await user.save();
      
      return {
        id: cardId.toString(),
        userId: userId.toString(),
        cardName: card.cardName,
        issuer: card.issuer,
        cardNumber: card.cardNumber,
        pointsBalance: card.pointsBalance,
        expireDate: card.expireDate,
        cardType: card.cardType,
        color: card.color || 'primary'
      };
    } catch (error) {
      console.error("Error creating credit card:", error);
      throw error;
    }
  }
  
  async deleteCreditCard(id: number | string): Promise<void> {
    try {
      // Find the user with this card and pull it from the array
      await MongoUser.updateOne(
        { "creditCards._id": id },
        { $pull: { creditCards: { _id: id } } }
      );
    } catch (error) {
      console.error("Error deleting credit card:", error);
      throw error;
    }
  }

  // Financial Profile methods
  async createFinancialProfile(data: InsertFinancialProfile): Promise<FinancialProfile> {
    try {
      const userId = data.userId;
      const user = await MongoUser.findById(userId);
      
      if (!user) {
        throw new Error(`User with ID ${userId} not found`);
      }
      
      // Set or update the financial profile
      user.financialProfile = {
        annualIncome: data.annualIncome,
        creditScore: data.creditScore,
        monthlySpending: data.monthlySpending,
        primarySpendingCategories: data.primarySpendingCategories,
        travelFrequency: data.travelFrequency,
        preferredAirlines: data.preferredAirlines,
        shoppingHabits: data.shoppingHabits,
        diningFrequency: data.diningFrequency,
        existingCards: data.existingCards,
        preferredBenefits: data.preferredBenefits,
        updatedAt: new Date()
      };
      
      await user.save();
      
      return {
        id: user._id.toString(), // Use user ID as profile ID
        userId: user._id.toString(),
        annualIncome: user.financialProfile.annualIncome,
        creditScore: user.financialProfile.creditScore,
        monthlySpending: user.financialProfile.monthlySpending as Record<string, number>,
        primarySpendingCategories: user.financialProfile.primarySpendingCategories,
        travelFrequency: user.financialProfile.travelFrequency as any,
        preferredAirlines: user.financialProfile.preferredAirlines,
        shoppingHabits: user.financialProfile.shoppingHabits as any,
        diningFrequency: user.financialProfile.diningFrequency as any,
        existingCards: user.financialProfile.existingCards,
        preferredBenefits: user.financialProfile.preferredBenefits,
        createdAt: user.createdAt.toISOString(),
        updatedAt: user.financialProfile.updatedAt.toISOString()
      };
    } catch (error) {
      console.error("Error creating financial profile:", error);
      throw error;
    }
  }

  async getFinancialProfileByUserId(userId: number | string): Promise<FinancialProfile | null> {
    try {
      const user = await MongoUser.findById(userId);
      if (!user || !user.financialProfile) return null;
      
      return {
        id: user._id.toString(), // Use user ID as profile ID
        userId: user._id.toString(),
        annualIncome: user.financialProfile.annualIncome,
        creditScore: user.financialProfile.creditScore,
        monthlySpending: user.financialProfile.monthlySpending as Record<string, number>,
        primarySpendingCategories: user.financialProfile.primarySpendingCategories,
        travelFrequency: user.financialProfile.travelFrequency as any,
        preferredAirlines: user.financialProfile.preferredAirlines,
        shoppingHabits: user.financialProfile.shoppingHabits as any,
        diningFrequency: user.financialProfile.diningFrequency as any,
        existingCards: user.financialProfile.existingCards,
        preferredBenefits: user.financialProfile.preferredBenefits,
        createdAt: user.createdAt.toISOString(),
        updatedAt: user.financialProfile.updatedAt?.toISOString() || user.createdAt.toISOString()
      };
    } catch (error) {
      console.error("Error getting financial profile:", error);
      return null;
    }
  }

  async updateFinancialProfile(userId: number | string, data: Partial<InsertFinancialProfile>): Promise<FinancialProfile | null> {
    try {
      const user = await MongoUser.findById(userId);
      if (!user) return null;
      
      // Initialize financialProfile if it doesn't exist
      if (!user.financialProfile) {
        user.financialProfile = {};
      }
      
      // Update financial profile fields
      for (const [key, value] of Object.entries(data)) {
        if (key !== 'userId') { // Skip userId field
          (user.financialProfile as any)[key] = value;
        }
      }
      
      // Update the timestamp
      user.financialProfile.updatedAt = new Date();
      
      await user.save();
      
      return {
        id: user._id.toString(),
        userId: user._id.toString(),
        annualIncome: user.financialProfile.annualIncome,
        creditScore: user.financialProfile.creditScore,
        monthlySpending: user.financialProfile.monthlySpending as Record<string, number>,
        primarySpendingCategories: user.financialProfile.primarySpendingCategories,
        travelFrequency: user.financialProfile.travelFrequency as any,
        preferredAirlines: user.financialProfile.preferredAirlines,
        shoppingHabits: user.financialProfile.shoppingHabits as any,
        diningFrequency: user.financialProfile.diningFrequency as any,
        existingCards: user.financialProfile.existingCards,
        preferredBenefits: user.financialProfile.preferredBenefits,
        createdAt: user.createdAt.toISOString(),
        updatedAt: user.financialProfile.updatedAt.toISOString()
      };
    } catch (error) {
      console.error("Error updating financial profile:", error);
      return null;
    }
  }

  // Placeholder methods for other entities
  // Flight methods
  async getFlights(): Promise<Flight[]> {
    return [];
  }

  async getFlight(id: number): Promise<Flight | undefined> {
    return undefined;
  }

  async createFlight(flight: InsertFlight): Promise<Flight> {
    throw new Error("Flight creation not implemented in MongoDB storage");
  }

  // Hotel methods
  async getHotels(): Promise<Hotel[]> {
    return [];
  }

  async getHotel(id: number): Promise<Hotel | undefined> {
    return undefined;
  }

  async createHotel(hotel: InsertHotel): Promise<Hotel> {
    throw new Error("Hotel creation not implemented in MongoDB storage");
  }

  // Shopping Offer methods
  async getShoppingOffers(): Promise<ShoppingOffer[]> {
    return [];
  }

  async getShoppingOffersByCategory(category: string): Promise<ShoppingOffer[]> {
    return [];
  }

  async getShoppingOffer(id: number): Promise<ShoppingOffer | undefined> {
    return undefined;
  }

  async createShoppingOffer(offer: InsertShoppingOffer): Promise<ShoppingOffer> {
    throw new Error("Shopping offer creation not implemented in MongoDB storage");
  }

  // Chat Message methods
  async getChatMessages(userId: number): Promise<ChatMessage[]> {
    return [];
  }

  async createChatMessage(message: InsertChatMessage): Promise<ChatMessage> {
    throw new Error("Chat message creation not implemented in MongoDB storage");
  }

  async clearChatMessages(userId: number): Promise<void> {
    return;
  }

  // Card Recommendation methods
  async createCardRecommendations(recommendations: InsertCardRecommendation[]): Promise<CardRecommendation[]> {
    return [];
  }

  async getCardRecommendationsByUserId(userId: number): Promise<CardRecommendation[]> {
    return [];
  }

  async deleteCardRecommendationsByUserId(userId: number): Promise<void> {
    return;
  }
} 