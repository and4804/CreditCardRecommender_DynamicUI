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
  InsertChatMessage 
} from "@shared/schema";

export interface IStorage {
  // User methods
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;

  // Credit Card methods
  getCreditCards(userId: number): Promise<CreditCard[]>;
  getCreditCard(id: number): Promise<CreditCard | undefined>;
  createCreditCard(card: InsertCreditCard): Promise<CreditCard>;

  // Flight methods
  getFlights(): Promise<Flight[]>;
  getFlight(id: number): Promise<Flight | undefined>;
  createFlight(flight: InsertFlight): Promise<Flight>;

  // Hotel methods
  getHotels(): Promise<Hotel[]>;
  getHotel(id: number): Promise<Hotel | undefined>;
  createHotel(hotel: InsertHotel): Promise<Hotel>;

  // Shopping Offer methods
  getShoppingOffers(): Promise<ShoppingOffer[]>;
  getShoppingOffersByCategory(category: string): Promise<ShoppingOffer[]>;
  getShoppingOffer(id: number): Promise<ShoppingOffer | undefined>;
  createShoppingOffer(offer: InsertShoppingOffer): Promise<ShoppingOffer>;

  // Chat Message methods
  getChatMessages(userId: number): Promise<ChatMessage[]>;
  createChatMessage(message: InsertChatMessage): Promise<ChatMessage>;
  clearChatMessages(userId: number): Promise<void>;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private creditCards: Map<number, CreditCard>;
  private flights: Map<number, Flight>;
  private hotels: Map<number, Hotel>;
  private shoppingOffers: Map<number, ShoppingOffer>;
  private chatMessages: Map<number, ChatMessage>;
  
  private userIdCounter: number;
  private cardIdCounter: number;
  private flightIdCounter: number;
  private hotelIdCounter: number;
  private offerIdCounter: number;
  private messageIdCounter: number;

  constructor() {
    this.users = new Map();
    this.creditCards = new Map();
    this.flights = new Map();
    this.hotels = new Map();
    this.shoppingOffers = new Map();
    this.chatMessages = new Map();
    
    this.userIdCounter = 1;
    this.cardIdCounter = 1;
    this.flightIdCounter = 1;
    this.hotelIdCounter = 1;
    this.offerIdCounter = 1;
    this.messageIdCounter = 1;

    // Initialize with sample data
    this.initializeSampleData().catch(error => {
      console.error("Error initializing sample data:", error);
    });
  }

  private async initializeSampleData() {
    // Create sample user
    const user: InsertUser = {
      username: "james.wilson",
      password: "password123", // In a real app, this would be hashed
      name: "James Wilson",
      email: "james.wilson@example.com",
      membershipLevel: "Platinum",
      pictureUrl: undefined
    };
    const createdUser = await this.createUser(user);

    // Create sample Indian credit cards
    const hdfcCard: InsertCreditCard = {
      userId: createdUser.id,
      cardName: "Infinia",
      issuer: "HDFC Bank",
      cardNumber: "•••• •••• •••• 4578",
      pointsBalance: 78450,
      expireDate: "09/26",
      cardType: "Signature",
      color: "primary"
    };
    await this.createCreditCard(hdfcCard);

    const iciciCard: InsertCreditCard = {
      userId: createdUser.id,
      cardName: "Emeralde",
      issuer: "ICICI Bank",
      cardNumber: "•••• •••• •••• 1236",
      pointsBalance: 43820,
      expireDate: "11/24",
      cardType: "Signature",
      color: "accent"
    };
    await this.createCreditCard(iciciCard);

    const sbiCard: InsertCreditCard = {
      userId: createdUser.id,
      cardName: "Elite",
      issuer: "SBI Card",
      cardNumber: "•••• •••• •••• 7892",
      pointsBalance: 92150,
      expireDate: "03/25",
      cardType: "Signature",
      color: "gray"
    };
    await this.createCreditCard(sbiCard);

    // Create sample flights with Indian airports and airlines
    const airIndiaFlight: InsertFlight = {
      airline: "Air India",
      departureTime: "4:30 AM",
      departureAirport: "BOM",
      arrivalTime: "6:15 AM",
      arrivalAirport: "DXB",
      duration: "3h 15m",
      isNonstop: true,
      pointsRequired: 38500,
      cashPrice: 22800, // ₹22,800
      rating: 3.5,
      cardBenefits: [
        "4X HDFC Reward Points",
        "Complimentary meal + beverage"
      ]
    };
    await this.createFlight(airIndiaFlight);

    const indigoFlight: InsertFlight = {
      airline: "IndiGo",
      departureTime: "9:40 AM",
      departureAirport: "BOM",
      arrivalTime: "11:25 AM",
      arrivalAirport: "DXB",
      duration: "3h 15m",
      isNonstop: true,
      pointsRequired: 25000,
      cashPrice: 18500, // ₹18,500
      rating: 4.0,
      cardBenefits: [
        "Complimentary Seat Selection",
        "5% cashback with ICICI cards"
      ]
    };
    await this.createFlight(indigoFlight);

    const vistara: InsertFlight = {
      airline: "Vistara",
      departureTime: "7:15 PM",
      departureAirport: "BOM",
      arrivalTime: "9:05 PM",
      arrivalAirport: "DXB",
      duration: "3h 20m",
      isNonstop: true,
      pointsRequired: 32000,
      cashPrice: 24600, // ₹24,600
      rating: 4.5,
      cardBenefits: [
        "10% off with SBI Elite Card",
        "Club Vistara points bonus"
      ]
    };
    await this.createFlight(vistara);

    // Create sample Dubai hotels for Indian travelers
    const burjAlArabHotel: InsertHotel = {
      name: "Burj Al Arab Jumeirah",
      location: "Jumeirah Beach Road",
      area: "Jumeirah",
      rating: 5.0,
      reviewCount: 876,
      pricePerNight: 75000, // ₹75,000
      totalPrice: 525000,   // ₹525,000 for 7 nights
      pointsEarned: 157500,
      description: "Iconic sail-shaped luxury hotel with stunning Arabian Gulf views. Features private beach access and butler service.",
      imageUrl: "https://images.unsplash.com/photo-1582719508461-905c673771fd",
      benefits: [
        "15% off on spa treatments",
        "Complimentary airport transfers",
        "Room upgrade when available",
        "Free breakfast buffet"
      ],
      cardExclusiveOffer: "Earn 10X HDFC Infinia Reward Points"
    };
    await this.createHotel(burjAlArabHotel);

    const atlantisHotel: InsertHotel = {
      name: "Atlantis, The Palm",
      location: "Palm Jumeirah",
      area: "The Palm",
      rating: 4.5,
      reviewCount: 1243,
      pricePerNight: 42000, // ₹42,000
      totalPrice: 294000,   // ₹294,000 for 7 nights
      pointsEarned: 88200,
      description: "Iconic ocean-themed resort with a massive aquarium, water park, and private beach on Palm Jumeirah.",
      imageUrl: "https://images.unsplash.com/photo-1556767573-4c111cce8103",
      benefits: [
        "Free Aquaventure Waterpark access",
        "SBI Elite Card 8% instant discount",
        "Late checkout 4PM",
        "Free Lost Chambers Aquarium tickets"
      ],
      cardExclusiveOffer: "3X bonus SBI Card ELITE Reward Points"
    };
    await this.createHotel(atlantisHotel);

    const addressDowntownHotel: InsertHotel = {
      name: "Address Downtown",
      location: "Downtown Dubai",
      area: "Downtown",
      rating: 4.7,
      reviewCount: 562,
      pricePerNight: 35000, // ₹35,000
      totalPrice: 245000,   // ₹245,000 for 7 nights
      pointsEarned: 73500,
      description: "Luxury hotel with stunning views of Burj Khalifa and Dubai Fountain. Features multiple restaurants and infinity pool.",
      imageUrl: "https://images.unsplash.com/photo-1533395427226-a54d3a0c25b3",
      benefits: [
        "ICICI Emeralde complimentary dinner",
        "Dubai Mall shopping vouchers",
        "Burj Khalifa fast-track tickets",
        "Free WiFi and airport transfers"
      ],
      cardExclusiveOffer: "12% discount with ICICI Emeralde card"
    };
    await this.createHotel(addressDowntownHotel);

    // Create sample shopping offers
    const bloomingdalesOffer: InsertShoppingOffer = {
      storeName: "Bloomingdale's",
      location: "59th St & Lexington Ave, New York",
      distanceFromHotel: "Available online",
      offerType: "percentage",
      offerValue: "15% Back",
      description: "Luxury department store offering designer clothing, accessories, home goods, and beauty products.",
      imageUrl: "https://pixabay.com/get/g90b6b12849be89529e14c053f0dd595d0fabe8f2834aa18fdfe4e3277003053b4725fbfbf9e3bb49ada8983b4d505b65970ba0bd68ee9a0d4f9ad290f26f9157_1280.jpg",
      benefits: [
        "Get 15% statement credit up to $75",
        "3X points on purchases"
      ],
      validThrough: "June 30, 2023",
      category: "Fashion"
    };
    await this.createShoppingOffer(bloomingdalesOffer);

    const bhPhotoOffer: InsertShoppingOffer = {
      storeName: "B&H Photo Video",
      location: "9th Ave & 34th St, New York",
      distanceFromHotel: "Available online",
      offerType: "cash",
      offerValue: "$50 Back",
      description: "Premier destination for cameras, computers, home theater equipment, and other electronics.",
      imageUrl: "https://images.unsplash.com/photo-1491933382434-500287f9b54b",
      benefits: [
        "$50 back on purchases of $250+",
        "Extended warranty with Amex"
      ],
      validThrough: "July 15, 2023",
      category: "Electronics"
    };
    await this.createShoppingOffer(bhPhotoOffer);

    const samsungStoreOffer: InsertShoppingOffer = {
      storeName: "Samsung Experience Store",
      location: "Multiple locations across India",
      distanceFromHotel: "Available online",
      offerType: "percentage",
      offerValue: "10% Back",
      description: "Official Samsung stores with latest products including Galaxy S25 Ultra and other premium smartphones.",
      imageUrl: "https://images.unsplash.com/photo-1610945415295-d9bbf067e59c",
      benefits: [
        "10% cashback up to ₹5,000 with HDFC Infinia",
        "Additional 1-year warranty with HDFC cards"
      ],
      validThrough: "August 31, 2023",
      category: "Electronics"
    };
    await this.createShoppingOffer(samsungStoreOffer);

    const flipkartOffer: InsertShoppingOffer = {
      storeName: "Flipkart",
      location: "Online, India",
      distanceFromHotel: "Available online",
      offerType: "cash",
      offerValue: "₹10,000 Off",
      description: "India's leading e-commerce marketplace with wide selection of electronics, clothing, and more.",
      imageUrl: "https://images.unsplash.com/photo-1622560480605-d83c853bc5c3",
      benefits: [
        "₹10,000 instant discount on S25 Ultra with ICICI Bank cards",
        "No-cost EMI options with Citi cards"
      ],
      validThrough: "Limited time offer",
      category: "Electronics"
    };
    await this.createShoppingOffer(flipkartOffer);

    const cromaOffer: InsertShoppingOffer = {
      storeName: "Croma",
      location: "Multiple locations across India",
      distanceFromHotel: "Available online",
      offerType: "points",
      offerValue: "5X Points",
      description: "Indian retail chain for consumer electronics and durables with wide product selection.",
      imageUrl: "https://images.unsplash.com/photo-1546054454-aa26e2b734c7",
      benefits: [
        "5X reward points with SBI Elite cards",
        "Extended warranty protection on premium electronics"
      ],
      validThrough: "July 30, 2023",
      category: "Electronics"
    };
    await this.createShoppingOffer(cromaOffer);

    const amazonIndiaOffer: InsertShoppingOffer = {
      storeName: "Amazon India",
      location: "Online, India",
      distanceFromHotel: "Available online",
      offerType: "percentage",
      offerValue: "15% Back",
      description: "E-commerce giant with vast selection of products including the latest smartphones and electronics.",
      imageUrl: "https://images.unsplash.com/photo-1523474253046-8cd2748b5fd2",
      benefits: [
        "15% instant discount up to ₹7,500 with HDFC Infinia",
        "Additional exchange bonus of ₹5,000 on old phones"
      ],
      validThrough: "Limited period offer",
      category: "Electronics"
    };
    await this.createShoppingOffer(amazonIndiaOffer);

    const reliance: InsertShoppingOffer = {
      storeName: "Reliance Digital",
      location: "Multiple locations across India",
      distanceFromHotel: "Available online",
      offerType: "cash",
      offerValue: "₹8,000 Back",
      description: "Electronics retail chain offering a wide range of consumer electronics and home appliances.",
      imageUrl: "https://images.unsplash.com/photo-1601524909162-ae8725290836",
      benefits: [
        "Instant cashback of ₹8,000 with ICICI Emeralde",
        "Free premium case worth ₹3,999"
      ],
      validThrough: "July 15, 2023",
      category: "Electronics"
    };
    await this.createShoppingOffer(reliance);

    // Create initial chat message
    const welcomeMessage: InsertChatMessage = {
      userId: createdUser.id,
      role: "assistant",
      content: "Hello James! I'm your CardConcierge. I see you have premium Indian credit cards including HDFC Infinia, ICICI Emeralde, and SBI Elite. How can I help you maximize your card benefits for travel or shopping today? Would you like recommendations for flights, hotels, or perhaps help finding the best deals on electronics?",
      timestamp: new Date().toISOString()
    };
    await this.createChatMessage(welcomeMessage);
  }

  // User methods
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username
    );
  }

  async createUser(user: InsertUser): Promise<User> {
    const id = this.userIdCounter++;
    const now = new Date().toISOString();
    const newUser: User = {
      ...user,
      id,
      membershipLevel: user.membershipLevel || "Standard",
      pictureUrl: user.pictureUrl || null,
      createdAt: now,
      lastLogin: now
    };
    this.users.set(id, newUser);
    return newUser;
  }

  // Credit Card methods
  async getCreditCards(userId: number): Promise<CreditCard[]> {
    return Array.from(this.creditCards.values()).filter(
      (card) => card.userId === userId
    );
  }

  async getCreditCard(id: number): Promise<CreditCard | undefined> {
    return this.creditCards.get(id);
  }

  async createCreditCard(card: InsertCreditCard): Promise<CreditCard> {
    const id = this.cardIdCounter++;
    // Ensure color property is always defined
    const newCard: CreditCard = { 
      ...card, 
      id,
      color: card.color || "primary" 
    };
    this.creditCards.set(id, newCard);
    return newCard;
  }

  // Flight methods
  async getFlights(): Promise<Flight[]> {
    return Array.from(this.flights.values());
  }

  async getFlight(id: number): Promise<Flight | undefined> {
    return this.flights.get(id);
  }

  async createFlight(flight: InsertFlight): Promise<Flight> {
    const id = this.flightIdCounter++;
    const newFlight: Flight = { ...flight, id };
    this.flights.set(id, newFlight);
    return newFlight;
  }

  // Hotel methods
  async getHotels(): Promise<Hotel[]> {
    return Array.from(this.hotels.values());
  }

  async getHotel(id: number): Promise<Hotel | undefined> {
    return this.hotels.get(id);
  }

  async createHotel(hotel: InsertHotel): Promise<Hotel> {
    const id = this.hotelIdCounter++;
    const newHotel: Hotel = { ...hotel, id };
    this.hotels.set(id, newHotel);
    return newHotel;
  }

  // Shopping Offer methods
  async getShoppingOffers(): Promise<ShoppingOffer[]> {
    return Array.from(this.shoppingOffers.values());
  }

  async getShoppingOffersByCategory(category: string): Promise<ShoppingOffer[]> {
    return Array.from(this.shoppingOffers.values()).filter(
      (offer) => offer.category === category
    );
  }

  async getShoppingOffer(id: number): Promise<ShoppingOffer | undefined> {
    return this.shoppingOffers.get(id);
  }

  async createShoppingOffer(offer: InsertShoppingOffer): Promise<ShoppingOffer> {
    const id = this.offerIdCounter++;
    const newOffer: ShoppingOffer = { ...offer, id };
    this.shoppingOffers.set(id, newOffer);
    return newOffer;
  }

  // Chat Message methods
  async getChatMessages(userId: number): Promise<ChatMessage[]> {
    return Array.from(this.chatMessages.values()).filter(
      (message) => message.userId === userId
    ).sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
  }

  async createChatMessage(message: InsertChatMessage): Promise<ChatMessage> {
    const id = this.messageIdCounter++;
    const newMessage: ChatMessage = { ...message, id };
    this.chatMessages.set(id, newMessage);
    return newMessage;
  }
  
  // Clear chat messages for a user
  async clearChatMessages(userId: number): Promise<void> {
    // Get all messages
    const allMessages = Array.from(this.chatMessages.entries());
    
    // For each message that belongs to the specified user, remove it from the map
    for (const [messageId, message] of allMessages) {
      if (message.userId === userId) {
        this.chatMessages.delete(messageId);
      }
    }
  }
}

// Import the database storage
import { DatabaseStorage } from "./database-storage";

// Use DatabaseStorage instead of MemStorage for production environments
export const storage = new DatabaseStorage();
