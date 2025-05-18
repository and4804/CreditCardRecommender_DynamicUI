import mongoose, { Schema, Document } from 'mongoose';

// Consolidated User Interface
export interface IUser extends Document {
  // Auth & Account Information
  auth0Id?: string;
  username: string;
  email: string;
  name: string;
  phone?: string;
  membershipLevel: string;
  pictureUrl?: string;
  createdAt: Date;
  lastLogin?: Date;
  
  // Financial Profile
  financialProfile?: {
    annualIncome: number;
    creditScore: number;
    monthlySpending: Record<string, number>;
    primarySpendingCategories: string[];
    travelFrequency: 'rarely' | 'occasionally' | 'frequently';
    preferredAirlines?: string[];
    shoppingHabits?: {
      online: number;
      inStore: number;
    };
    diningFrequency: 'rarely' | 'occasionally' | 'frequently';
    existingCards?: string[];
    preferredBenefits: string[];
    updatedAt: Date;
  };
  
  // Credit Cards
  creditCards?: Array<{
    cardName: string;
    issuer: string;
    cardNumber: string;
    pointsBalance: number;
    expireDate: string;
    cardType: string;
    color: string;
  }>;
}

// Consolidated User Schema
const UserSchema = new Schema<IUser>({
  // Auth & Account Information
  auth0Id: { type: String },
  username: { type: String, required: true, unique: true },
  email: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  phone: { type: String },
  membershipLevel: { type: String, default: 'Premium' },
  pictureUrl: { type: String },
  createdAt: { type: Date, default: Date.now },
  lastLogin: { type: Date },
  
  // Financial Profile (embedded)
  financialProfile: {
    annualIncome: { type: Number },
    creditScore: { type: Number },
    monthlySpending: { type: Map, of: Number },
    primarySpendingCategories: { type: [String] },
    travelFrequency: { 
      type: String, 
      enum: ['rarely', 'occasionally', 'frequently']
    },
    preferredAirlines: { type: [String] },
    shoppingHabits: {
      online: { type: Number },
      inStore: { type: Number }
    },
    diningFrequency: { 
      type: String, 
      enum: ['rarely', 'occasionally', 'frequently']
    },
    existingCards: { type: [String] },
    preferredBenefits: { type: [String] },
    updatedAt: { type: Date, default: Date.now }
  },
  
  // Credit Cards (embedded array)
  creditCards: [{
    cardName: { type: String },
    issuer: { type: String },
    cardNumber: { type: String },
    pointsBalance: { type: Number },
    expireDate: { type: String },
    cardType: { type: String },
    color: { type: String, default: 'primary' }
  }]
});

// Export the consolidated User model
export const User = mongoose.model<IUser>('User', UserSchema);

// Keep the old models temporarily for backward compatibility
// but mark them as deprecated
/** @deprecated Use User model with embedded financialProfile instead */
export const FinancialProfile = mongoose.model<any>('FinancialProfile', new Schema({}));

/** @deprecated Use User model with embedded creditCards instead */
export const CreditCard = mongoose.model<any>('CreditCard', new Schema({})); 