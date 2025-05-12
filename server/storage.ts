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
  deleteCreditCard(id: number): Promise<void>;

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
      cardBenefits: {
        general: ["Free Checked Baggage", "Priority Boarding"],
        cards: [
          {
            cardName: "HDFC Infinia",
            benefits: ["5% cashback (₹1,140 savings)", "4X reward points (4,560 points)", "Complimentary lounge access"],
            discountedPrice: 21660
          },
          {
            cardName: "SBI Elite",
            benefits: ["8% discount on base fare (₹1,824 savings)", "Double reward points", "Free seat selection"],
            discountedPrice: 20976
          },
          {
            cardName: "ICICI Emeralde",
            benefits: ["3% cashback (₹684 savings)", "Free travel insurance worth ₹5 Lakh", "Complimentary meal"],
            discountedPrice: 22116
          }
        ]
      }
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
      cardBenefits: {
        general: ["Complimentary Seat Selection", "Web Check-in"],
        cards: [
          {
            cardName: "ICICI Emeralde",
            benefits: ["10% cashback on IndiGo flights (₹1,850 savings)", "Priority check-in", "Free meal voucher worth ₹350"],
            discountedPrice: 16650
          },
          {
            cardName: "HDFC Infinia",
            benefits: ["5% discount (₹925 savings)", "3X reward points on flight booking", "Free cancellation insurance"],
            discountedPrice: 17575
          },
          {
            cardName: "SBI Elite",
            benefits: ["7% cashback (₹1,295 savings)", "Complimentary lounge access", "Extra 5kg baggage allowance"],
            discountedPrice: 17205
          }
        ]
      }
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
      cardBenefits: {
        general: ["Premium Economy Upgrade (₹3,500 value)", "Club Vistara points"],
        cards: [
          {
            cardName: "SBI Elite",
            benefits: ["12% discount on business class (₹2,952 savings)", "Double CV points", "Free lounge access for companion"],
            discountedPrice: 21648
          },
          {
            cardName: "HDFC Infinia",
            benefits: ["7.5% cashback (₹1,845 savings)", "Complimentary business class lounge access", "5X reward points"],
            discountedPrice: 22755
          },
          {
            cardName: "ICICI Emeralde",
            benefits: ["6% cashback (₹1,476 savings)", "Free cancellation insurance", "Priority baggage handling"],
            discountedPrice: 23124
          }
        ]
      }
    };
    await this.createFlight(vistara);

    // Add an Emirates flight with premium benefits
    const emiratesFlight: InsertFlight = {
      airline: "Emirates",
      departureTime: "2:30 PM",
      departureAirport: "BOM",
      arrivalTime: "4:05 PM",
      arrivalAirport: "DXB",
      duration: "3h 05m",
      isNonstop: true,
      pointsRequired: 42000,
      cashPrice: 31500, // ₹31,500
      rating: 5.0,
      cardBenefits: {
        general: ["Complimentary chauffeur service", "30kg baggage allowance"],
        cards: [
          {
            cardName: "HDFC Infinia",
            benefits: ["15% discount on first & business class (₹4,725 savings)", "Exclusive Emirates lounge access", "6X reward points (18,900 points)"],
            discountedPrice: 26775
          },
          {
            cardName: "ICICI Emeralde",
            benefits: ["10% cashback (₹3,150 savings)", "Fast-track immigration at Dubai", "Complimentary hotel stay for 7+ hour layovers"],
            discountedPrice: 28350
          },
          {
            cardName: "SBI Elite",
            benefits: ["8% discount (₹2,520 savings)", "Double Emirates Skywards miles", "Free seat selection in Economy Flex"],
            discountedPrice: 28980
          }
        ]
      }
    };
    await this.createFlight(emiratesFlight);

    // Add an Air Arabia budget option
    const airArabiaFlight: InsertFlight = {
      airline: "Air Arabia",
      departureTime: "11:10 PM",
      departureAirport: "BOM",
      arrivalTime: "12:40 AM",
      arrivalAirport: "DXB",
      duration: "3h 00m",
      isNonstop: true,
      pointsRequired: 18000,
      cashPrice: 14200, // ₹14,200
      rating: 3.8,
      cardBenefits: {
        general: ["Price guarantee", "Web check-in"],
        cards: [
          {
            cardName: "ICICI Emeralde",
            benefits: ["12% cashback on Air Arabia (₹1,704 savings)", "Free seat selection worth ₹800", "Priority boarding"],
            discountedPrice: 12496
          },
          {
            cardName: "SBI Elite",
            benefits: ["10% discount (₹1,420 savings)", "Extra 7kg baggage allowance", "Free cancellation up to 24 hours"],
            discountedPrice: 12780
          },
          {
            cardName: "HDFC Infinia",
            benefits: ["8% cashback (₹1,136 savings)", "4X reward points on booking", "Free meal voucher worth ₹500"],
            discountedPrice: 13064
          }
        ]
      }
    };
    await this.createFlight(airArabiaFlight);

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

    // Add more fashion shopping offers
    const shopper_stop: InsertShoppingOffer = {
      storeName: "Shoppers Stop",
      location: "Multiple locations across India",
      distanceFromHotel: "Available online",
      offerType: "percentage",
      offerValue: "20% Off",
      description: "Premier department store chain in India offering a wide range of fashion and lifestyle products.",
      imageUrl: "https://images.unsplash.com/photo-1607082349566-187342175e2f",
      benefits: [
        "20% instant discount with HDFC Infinia",
        "Additional 5% as FirstCitizen reward points"
      ],
      validThrough: "May 31, 2023",
      category: "Fashion"
    };
    await this.createShoppingOffer(shopper_stop);

    const myntra: InsertShoppingOffer = {
      storeName: "Myntra",
      location: "Online, India",
      distanceFromHotel: "Available online",
      offerType: "cash",
      offerValue: "₹1,000 Off",
      description: "India's leading e-commerce platform for fashion and lifestyle products from top brands.",
      imageUrl: "https://images.unsplash.com/photo-1614771637369-ed94441a651a",
      benefits: [
        "₹1,000 instant discount on ₹5,000 with ICICI Emeralde",
        "No-cost EMI options with select cards"
      ],
      validThrough: "April 30, 2023",
      category: "Fashion"
    };
    await this.createShoppingOffer(myntra);
    
    const ajio: InsertShoppingOffer = {
      storeName: "AJIO",
      location: "Online, India",
      distanceFromHotel: "Available online",
      offerType: "percentage",
      offerValue: "15% Off",
      description: "Trendy fashion platform offering a curated collection of Indian and international brands.",
      imageUrl: "https://images.unsplash.com/photo-1539109136881-3be0616acf4b",
      benefits: [
        "15% instant discount with SBI Elite Card",
        "Additional 10% off with coupon code SBIELITE10"
      ],
      validThrough: "June 15, 2023",
      category: "Fashion"
    };
    await this.createShoppingOffer(ajio);

    // Add more hotels in Dubai
    const jumeirahBeachHotel: InsertHotel = {
      name: "Jumeirah Beach Hotel",
      location: "Jumeirah Beach Road, Dubai",
      area: "Jumeirah",
      rating: 4.8,
      reviewCount: 932,
      pricePerNight: 28000, // ₹28,000
      totalPrice: 196000,   // ₹196,000 for 7 nights
      pointsEarned: 58800,
      description: "Iconic wave-shaped luxury hotel on Jumeirah Beach with stunning views of the Arabian Gulf and Burj Al Arab.",
      imageUrl: "https://images.unsplash.com/photo-1602002418816-5c0aeef426aa",
      benefits: [
        "Free access to Wild Wadi Waterpark",
        "SBI Elite Card 10% cashback",
        "Complimentary breakfast and dinner",
        "Private beach access"
      ],
      cardExclusiveOffer: "4X SBI Elite Reward Points"
    };
    await this.createHotel(jumeirahBeachHotel);

    const armaniHotel: InsertHotel = {
      name: "Armani Hotel Dubai",
      location: "Burj Khalifa, Downtown Dubai",
      area: "Downtown",
      rating: 4.9,
      reviewCount: 724,
      pricePerNight: 45000, // ₹45,000
      totalPrice: 315000,   // ₹315,000 for 7 nights
      pointsEarned: 94500,
      description: "Luxury hotel designed by Giorgio Armani, located within the iconic Burj Khalifa building.",
      imageUrl: "https://images.unsplash.com/photo-1551882547-ff40c63fe5fa",
      benefits: [
        "HDFC Infinia exclusive rate with 15% discount",
        "Armani signature spa treatment voucher",
        "VIP access to Dubai Mall",
        "Guaranteed Burj Khalifa view"
      ],
      cardExclusiveOffer: "5X HDFC Infinia Reward Points and complimentary spa access"
    };
    await this.createHotel(armaniHotel);

    const fourSeasonsDubai: InsertHotel = {
      name: "Four Seasons Resort Dubai",
      location: "Jumeirah Beach Road",
      area: "Jumeirah",
      rating: 4.7,
      reviewCount: 856,
      pricePerNight: 38000, // ₹38,000
      totalPrice: 266000,   // ₹266,000 for 7 nights
      pointsEarned: 79800,
      description: "Beachfront resort with luxurious rooms, multiple pools, and a pristine private beach.",
      imageUrl: "https://images.unsplash.com/photo-1566073771259-6a8506099945",
      benefits: [
        "ICICI Emeralde 3rd night free offer",
        "Complimentary airport transfers",
        "Daily breakfast buffet",
        "Resort credit of AED 500"
      ],
      cardExclusiveOffer: "ICICI Emeralde 15% cashback on total stay"
    };
    await this.createHotel(fourSeasonsDubai);

    // Add Indian domestic flights
    const airIndiaDomestic: InsertFlight = {
      airline: "Air India",
      departureTime: "6:15 AM",
      departureAirport: "DEL",
      arrivalTime: "8:45 AM",
      arrivalAirport: "BOM",
      duration: "2h 30m",
      isNonstop: true,
      pointsRequired: 12000,
      cashPrice: 6800, // ₹6,800
      rating: 3.8,
      cardBenefits: {
        general: ["Free web check-in", "Extra 5kg baggage allowance"],
        cards: [
          {
            cardName: "HDFC Infinia",
            benefits: ["10% cashback (₹680 savings)", "2X reward points (1,360 points)", "Free lounge access"],
            discountedPrice: 6120
          },
          {
            cardName: "SBI Elite",
            benefits: ["7% discount on base fare (₹476 savings)", "Free seat selection", "Priority baggage handling"],
            discountedPrice: 6324
          },
          {
            cardName: "ICICI Emeralde",
            benefits: ["5% cashback (₹340 savings)", "Free travel insurance", "Complimentary meal"],
            discountedPrice: 6460
          }
        ]
      }
    };
    await this.createFlight(airIndiaDomestic);

    const indigoMumBang: InsertFlight = {
      airline: "IndiGo",
      departureTime: "11:20 AM",
      departureAirport: "BOM",
      arrivalTime: "1:40 PM",
      arrivalAirport: "BLR",
      duration: "1h 20m",
      isNonstop: true,
      pointsRequired: 8000,
      cashPrice: 4500, // ₹4,500
      rating: 4.2,
      cardBenefits: {
        general: ["Free web check-in", "On-time guarantee"],
        cards: [
          {
            cardName: "ICICI Emeralde",
            benefits: ["12% cashback on IndiGo flights (₹540 savings)", "6E Prime access", "Fast-track security"],
            discountedPrice: 3960
          },
          {
            cardName: "HDFC Infinia",
            benefits: ["8% discount (₹360 savings)", "Extra legroom seat", "Priority boarding"],
            discountedPrice: 4140
          },
          {
            cardName: "SBI Elite",
            benefits: ["10% cashback (₹450 savings)", "Free cancellation", "Free seat selection"],
            discountedPrice: 4050
          }
        ]
      }
    };
    await this.createFlight(indigoMumBang);

    const vistaraDelhiHyd: InsertFlight = {
      airline: "Vistara",
      departureTime: "3:40 PM",
      departureAirport: "DEL",
      arrivalTime: "6:10 PM",
      arrivalAirport: "HYD",
      duration: "2h 30m",
      isNonstop: true,
      pointsRequired: 15000,
      cashPrice: 7200, // ₹7,200
      rating: 4.6,
      cardBenefits: {
        general: ["Premium Economy option", "Club Vistara points"],
        cards: [
          {
            cardName: "SBI Elite",
            benefits: ["15% discount on premium economy (₹1,080 savings)", "Double CV points", "Complimentary lounge access"],
            discountedPrice: 6120
          },
          {
            cardName: "HDFC Infinia",
            benefits: ["10% cashback (₹720 savings)", "Extra baggage allowance", "Priority check-in"],
            discountedPrice: 6480
          },
          {
            cardName: "ICICI Emeralde",
            benefits: ["8% cashback (₹576 savings)", "Free meal selection", "Free cancellation insurance"],
            discountedPrice: 6624
          }
        ]
      }
    };
    await this.createFlight(vistaraDelhiHyd);

    // Add more shopping offers for travel and luxury categories
    const travelGadgets: InsertShoppingOffer = {
      storeName: "Croma Travel Tech",
      location: "Multiple locations across India",
      distanceFromHotel: "Available online",
      offerType: "bundle",
      offerValue: "Free Powerbank",
      description: "Premium travel gadgets including cameras, noise-cancelling headphones, and travel adapters.",
      imageUrl: "https://images.unsplash.com/photo-1505751172876-fa1923c5c528",
      benefits: [
        "Free 10,000 mAh powerbank with purchase over ₹15,000",
        "Extended 2-year warranty with HDFC Infinia"
      ],
      validThrough: "May 31, 2023",
      category: "Travel"
    };
    await this.createShoppingOffer(travelGadgets);

    const luxuryWatch: InsertShoppingOffer = {
      storeName: "Ethos Watch Boutiques",
      location: "Multiple locations across India",
      distanceFromHotel: "Available online",
      offerType: "percentage",
      offerValue: "10% Off",
      description: "Authorized retailer for premium watch brands including Rolex, Omega, and TAG Heuer.",
      imageUrl: "https://images.unsplash.com/photo-1523170335258-f5ed11844a49",
      benefits: [
        "10% instant discount with HDFC Infinia up to ₹50,000",
        "Complimentary watch servicing for 3 years"
      ],
      validThrough: "June 30, 2023",
      category: "Luxury"
    };
    await this.createShoppingOffer(luxuryWatch);

    const titanEyePlus: InsertShoppingOffer = {
      storeName: "Titan Eye+",
      location: "Multiple locations across India",
      distanceFromHotel: "Available online",
      offerType: "cash",
      offerValue: "₹2,000 Off",
      description: "Premium eyewear store offering a wide range of sunglasses and prescription glasses.",
      imageUrl: "https://images.unsplash.com/photo-1577803645773-f96470509666",
      benefits: [
        "₹2,000 off on sunglasses above ₹7,000 with ICICI Emeralde",
        "Free eye checkup and frame customization"
      ],
      validThrough: "July 15, 2023",
      category: "Fashion"
    };
    await this.createShoppingOffer(titanEyePlus);

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
  
  async deleteCreditCard(id: number): Promise<void> {
    if (this.creditCards.has(id)) {
      this.creditCards.delete(id);
      console.log(`[MemStorage] Deleted credit card with ID: ${id}`);
    } else {
      console.log(`[MemStorage] Credit card with ID ${id} not found for deletion`);
      throw new Error(`Credit card with ID ${id} not found`);
    }
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

// Use MemStorage instead of DatabaseStorage to display our sample flight data
// export const storage = new DatabaseStorage();
export const storage = new MemStorage();
