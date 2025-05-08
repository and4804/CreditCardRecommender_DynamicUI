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
    this.initializeSampleData();
  }

  private initializeSampleData() {
    // Create sample user
    const user: InsertUser = {
      username: "james.wilson",
      password: "password123", // In a real app, this would be hashed
      name: "James Wilson",
      membershipLevel: "Platinum"
    };
    const createdUser = this.createUser(user);

    // Create sample credit cards
    const amexCard: InsertCreditCard = {
      userId: createdUser.id,
      cardName: "Platinum Card",
      issuer: "American Express",
      cardNumber: "•••• •••• •••• 4578",
      pointsBalance: 78450,
      expireDate: "09/26",
      cardType: "Platinum",
      color: "primary"
    };
    this.createCreditCard(amexCard);

    const chaseCard: InsertCreditCard = {
      userId: createdUser.id,
      cardName: "Sapphire Preferred",
      issuer: "Chase",
      cardNumber: "•••• •••• •••• 1236",
      pointsBalance: 43820,
      expireDate: "11/24",
      cardType: "Preferred",
      color: "accent"
    };
    this.createCreditCard(chaseCard);

    const capitalOneCard: InsertCreditCard = {
      userId: createdUser.id,
      cardName: "Venture X",
      issuer: "Capital One",
      cardNumber: "•••• •••• •••• 7892",
      pointsBalance: 92150,
      expireDate: "03/25",
      cardType: "Venture",
      color: "gray"
    };
    this.createCreditCard(capitalOneCard);

    // Create sample flights
    const deltaFlight: InsertFlight = {
      airline: "Delta",
      departureTime: "6:30 AM",
      departureAirport: "SFO",
      arrivalTime: "3:15 PM",
      arrivalAirport: "JFK",
      duration: "5h 45m",
      isNonstop: true,
      pointsRequired: 60500,
      cashPrice: 650,
      rating: 3.5,
      cardBenefits: [
        "Amex 3X Points",
        "Premium Economy available"
      ]
    };
    this.createFlight(deltaFlight);

    const unitedFlight: InsertFlight = {
      airline: "United",
      departureTime: "8:15 AM",
      departureAirport: "SFO",
      arrivalTime: "4:45 PM",
      arrivalAirport: "EWR",
      duration: "5h 30m",
      isNonstop: true,
      pointsRequired: 55000,
      cashPrice: 590,
      rating: 4.0,
      cardBenefits: [
        "Priority Boarding",
        "Free checked bag with Amex"
      ]
    };
    this.createFlight(unitedFlight);

    const jetBlueFlight: InsertFlight = {
      airline: "JetBlue",
      departureTime: "1:10 PM",
      departureAirport: "SFO",
      arrivalTime: "10:20 PM",
      arrivalAirport: "JFK",
      duration: "6h 10m",
      isNonstop: true,
      pointsRequired: 48000,
      cashPrice: 510,
      rating: 4.5,
      cardBenefits: [
        "$50 Statement Credit",
        "WiFi included with Amex"
      ]
    };
    this.createFlight(jetBlueFlight);

    // Create sample hotels
    const langhamHotel: InsertHotel = {
      name: "The Langham New York",
      location: "Midtown Manhattan",
      area: "Manhattan",
      rating: 5.0,
      reviewCount: 324,
      pricePerNight: 450,
      totalPrice: 3150,
      pointsEarned: 15750,
      description: "Luxury 5-star hotel with spacious rooms and acclaimed restaurant. Walking distance to major attractions.",
      imageUrl: "https://images.unsplash.com/photo-1566073771259-6a8506099945",
      benefits: [
        "$100 property credit",
        "Room upgrade when available",
        "Noon check-in",
        "Free breakfast for two"
      ],
      cardExclusiveOffer: "Platinum Card exclusive offer"
    };
    this.createHotel(langhamHotel);

    const mercerHotel: InsertHotel = {
      name: "The Mercer Hotel",
      location: "SoHo",
      area: "Manhattan",
      rating: 4.5,
      reviewCount: 218,
      pricePerNight: 380,
      totalPrice: 2660,
      pointsEarned: 13300,
      description: "Chic boutique hotel in the heart of SoHo with loft-style rooms and popular restaurant.",
      imageUrl: "https://images.unsplash.com/photo-1590490360182-c33d57733427",
      benefits: [
        "$50 dining credit",
        "Late checkout 2PM",
        "Free breakfast for two"
      ],
      cardExclusiveOffer: "5X points with Amex booking"
    };
    this.createHotel(mercerHotel);

    const standardHotel: InsertHotel = {
      name: "The Standard High Line",
      location: "Meatpacking District",
      area: "Manhattan",
      rating: 4.0,
      reviewCount: 415,
      pricePerNight: 320,
      totalPrice: 2240,
      pointsEarned: 11200,
      description: "Modern hotel with floor-to-ceiling windows and rooftop bar overlooking the High Line.",
      imageUrl: "https://images.unsplash.com/photo-1445019980597-93fa8acb246c",
      benefits: [
        "$25 food & beverage credit",
        "Priority room assignment",
        "Complimentary WiFi"
      ],
      cardExclusiveOffer: "10% Amex statement credit"
    };
    this.createHotel(standardHotel);

    // Create sample shopping offers
    const bloomingdalesOffer: InsertShoppingOffer = {
      storeName: "Bloomingdale's",
      location: "59th St & Lexington Ave",
      distanceFromHotel: "1.2mi from hotel",
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
    this.createShoppingOffer(bloomingdalesOffer);

    const bhPhotoOffer: InsertShoppingOffer = {
      storeName: "B&H Photo Video",
      location: "9th Ave & 34th St",
      distanceFromHotel: "0.8mi from hotel",
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
    this.createShoppingOffer(bhPhotoOffer);

    const elevenMadisonOffer: InsertShoppingOffer = {
      storeName: "Eleven Madison Park",
      location: "Madison Ave & 24th St",
      distanceFromHotel: "0.4mi from hotel",
      offerType: "percentage",
      offerValue: "20% Back",
      description: "Three Michelin-starred fine dining restaurant with seasonal, multi-course tasting menu.",
      imageUrl: "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4",
      benefits: [
        "Receive 20% back as statement credit",
        "Priority reservations for cardholders"
      ],
      validThrough: "June 30, 2023",
      category: "Dining"
    };
    this.createShoppingOffer(elevenMadisonOffer);

    const broadwayOffer: InsertShoppingOffer = {
      storeName: "Broadway Show Tickets",
      location: "Times Square",
      distanceFromHotel: "1.0mi from hotel",
      offerType: "points",
      offerValue: "2X Points",
      description: "Broadway show tickets for top musicals and plays during your stay in New York.",
      imageUrl: "https://pixabay.com/get/g8b35b058987c75e24502dc465c7f9f97a5a588f946a4b60ed1a4efd6103f194343c87e22461f0fc9702edfaf6c436e88904c912e3a6b814781ee937c14c86388_1280.jpg",
      benefits: [
        "Double points on ticket purchases",
        "Exclusive presale access"
      ],
      validThrough: "During your stay",
      category: "Entertainment"
    };
    this.createShoppingOffer(broadwayOffer);

    // Create initial chat message
    const welcomeMessage: InsertChatMessage = {
      userId: createdUser.id,
      role: "assistant",
      content: "Hello James! I'm your CardConcierge. How can I help you plan your travel or shopping today? I can help you maximize your credit card benefits.",
      timestamp: new Date().toISOString()
    };
    this.createChatMessage(welcomeMessage);
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
    const newUser: User = { ...user, id };
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
    const newCard: CreditCard = { ...card, id };
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
}

export const storage = new MemStorage();
