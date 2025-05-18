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
  financialProfiles,
  cardRecommendations,
  InsertFinancialProfile,
  FinancialProfile,
  InsertCardRecommendation,
  CardRecommendation
} from "@shared/schema";
import { inArray } from "drizzle-orm";

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

  // Financial Profile methods
  createFinancialProfile(data: InsertFinancialProfile): Promise<FinancialProfile>;
  getFinancialProfileByUserId(userId: number): Promise<FinancialProfile | null>;
  updateFinancialProfile(userId: number, data: Partial<InsertFinancialProfile>): Promise<FinancialProfile | null>;
  createCardRecommendations(recommendations: InsertCardRecommendation[]): Promise<CardRecommendation[]>;
  getCardRecommendationsByUserId(userId: number): Promise<CardRecommendation[]>;
  deleteCardRecommendationsByUserId(userId: number): Promise<void>;
}

interface MemoryStorage {
  users: Map<number, User>;
  credit_cards: Map<number, CreditCard>;
  flights: Map<number, Flight>;
  hotels: Map<number, Hotel>;
  shopping_offers: Map<number, ShoppingOffer>;
  chat_messages: Map<number, ChatMessage>;
  financial_profiles: FinancialProfile[];
  card_recommendations: CardRecommendation[];
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private creditCards: Map<number, CreditCard>;
  private flights: Map<number, Flight>;
  private hotels: Map<number, Hotel>;
  private shoppingOffers: Map<number, ShoppingOffer>;
  private chatMessages: Map<number, ChatMessage>;
  private financial_profiles: FinancialProfile[];
  private card_recommendations: CardRecommendation[];
  
  private userIdCounter: number;
  private cardIdCounter: number;
  private flightIdCounter: number;
  private hotelIdCounter: number;
  private offerIdCounter: number;
  private messageIdCounter: number;
  private financialProfileIdCounter: number;
  private cardRecommendationIdCounter: number;

  constructor() {
    this.users = new Map();
    this.creditCards = new Map();
    this.flights = new Map();
    this.hotels = new Map();
    this.shoppingOffers = new Map();
    this.chatMessages = new Map();
    this.financial_profiles = [];
    this.card_recommendations = [];
    
    this.userIdCounter = 1;
    this.cardIdCounter = 1;
    this.flightIdCounter = 1;
    this.hotelIdCounter = 1;
    this.offerIdCounter = 1;
    this.messageIdCounter = 1;
    this.financialProfileIdCounter = 1;
    this.cardRecommendationIdCounter = 1;

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
    const samsungS25Ultra = this.createShoppingOffer({
      storeName: "Samsung S25 Ultra",
      location: "Online & Retail Stores",
      distanceFromHotel: "N/A",
      offerType: "Flash Sale",
      offerValue: "Up to ₹12,000 off",
      description: "Experience Samsung's latest flagship with 200MP camera, 120Hz dynamic AMOLED display, and advanced AI features.",
      imageUrl: "https://images.unsplash.com/photo-1610945415295-d9bbf067e59c",
      benefits: [
        "No-cost EMI up to 12 months with HDFC card",
        "10% instant discount up to ₹8,000 with HDFC Infinia",
        "Extra ₹12,000 off on exchange with ICICI cards",
        "Free Galaxy Buds2 Pro worth ₹18,990"
      ],
      validThrough: "July 31, 2023",
      category: "smartphone",
      retailers: [
        {
          name: "Amazon.in",
          price: 124999,
          discount: "₹8,000 off",
          link: "https://amazon.in"
        },
        {
          name: "Flipkart",
          price: 125999,
          discount: "₹7,000 off",
          link: "https://flipkart.com"
        },
        {
          name: "Samsung Store",
          price: 119999,
          discount: "₹12,000 off",
          link: "https://samsung.com"
        },
        {
          name: "Croma",
          price: 127999,
          discount: "₹5,000 off",
          link: "https://croma.com"
        },
        {
          name: "Reliance Digital",
          price: 126999,
          discount: "₹6,000 off",
          link: "https://reliancedigital.in"
        }
      ]
    });

    const iphone15Pro = this.createShoppingOffer({
      storeName: "Apple iPhone 15 Pro",
      location: "Online & Apple Store",
      distanceFromHotel: "N/A",
      offerType: "Bank Offer",
      offerValue: "Up to ₹10,000 cashback",
      description: "Apple's premium smartphone with A17 Pro chip, 48MP camera system, Dynamic Island, and titanium design.",
      imageUrl: "https://images.unsplash.com/photo-1696448425293-f27ee245db30",
      benefits: [
        "5% cashback up to ₹10,000 with HDFC Infinia",
        "No-cost EMI for 9 months with ICICI cards",
        "Double reward points with SBI Elite card",
        "AppleCare+ at 50% discount with Amex"
      ],
      validThrough: "June 30, 2023",
      category: "smartphone",
      retailers: [
        {
          name: "Apple Store",
          price: 134900,
          discount: "₹6,000 cashback",
          link: "https://apple.com/in"
        },
        {
          name: "Amazon.in",
          price: 134900,
          discount: "₹5,000 instant discount",
          link: "https://amazon.in"
        },
        {
          name: "Flipkart",
          price: 133900,
          discount: "₹7,000 off",
          link: "https://flipkart.com"
        },
        {
          name: "Croma",
          price: 134900,
          discount: "₹4,000 off",
          link: "https://croma.com"
        },
        {
          name: "Reliance Digital",
          price: 134900,
          discount: "₹8,000 off with exchange",
          link: "https://reliancedigital.in"
        }
      ]
    });

    const pixel8Pro = this.createShoppingOffer({
      storeName: "Google Pixel 8 Pro",
      location: "Online Only",
      distanceFromHotel: "N/A",
      offerType: "Limited Time Offer",
      offerValue: "Up to ₹15,000 off",
      description: "Google's flagship with advanced AI features, Tensor G3 chip, 50MP camera system, and 120Hz LTPO display.",
      imageUrl: "https://images.unsplash.com/photo-1667028379349-42ebf5367bc7",
      benefits: [
        "Flat ₹10,000 instant discount with HDFC Infinia",
        "No-cost EMI for up to 12 months with SBI cards",
        "Free Pixel Buds Pro worth ₹19,990",
        "5X reward points with ICICI Emeralde Card"
      ],
      validThrough: "August 15, 2023",
      category: "smartphone",
      retailers: [
        {
          name: "Flipkart",
          price: 99999,
          discount: "₹15,000 off",
          link: "https://flipkart.com"
        },
        {
          name: "Amazon.in",
          price: 106999,
          discount: "₹8,000 off",
          link: "https://amazon.in"
        },
        {
          name: "Croma",
          price: 104999,
          discount: "₹10,000 off",
          link: "https://croma.com"
        },
        {
          name: "Reliance Digital",
          price: 105999,
          discount: "₹9,000 off",
          link: "https://reliancedigital.in"
        }
      ]
    });

    const onePlus12 = this.createShoppingOffer({
      storeName: "OnePlus 12",
      location: "Online & OnePlus Experience Stores",
      distanceFromHotel: "N/A",
      offerType: "Bank Partner Offer",
      offerValue: "Extra ₹7,000 off",
      description: "Flagship with Snapdragon 8 Gen 3, Hasselblad camera, 120Hz AMOLED display, and 100W fast charging.",
      imageUrl: "https://images.unsplash.com/photo-1672151185537-b8ae860f764e",
      benefits: [
        "Instant discount of ₹5,000 with ICICI cards",
        "Additional ₹7,000 off with HDFC credit cards",
        "12-month no-cost EMI available",
        "Free OnePlus Buds Pro 2 on pre-booking"
      ],
      validThrough: "May 31, 2023",
      category: "smartphone",
      retailers: [
        {
          name: "OnePlus Store",
          price: 64999,
          discount: "₹7,000 off",
          link: "https://oneplus.in"
        },
        {
          name: "Amazon.in",
          price: 64999,
          discount: "₹5,000 off",
          link: "https://amazon.in"
        },
        {
          name: "Flipkart",
          price: 66999,
          discount: "₹3,000 off",
          link: "https://flipkart.com"
        },
        {
          name: "Croma",
          price: 65999,
          discount: "₹4,000 off",
          link: "https://croma.com"
        },
        {
          name: "Reliance Digital",
          price: 66999,
          discount: "₹3,000 off",
          link: "https://reliancedigital.in"
        }
      ]
    });

    const vivoX100Pro = this.createShoppingOffer({
      storeName: "Vivo X100 Pro",
      location: "Online & Retail Stores",
      distanceFromHotel: "N/A",
      offerType: "Special Launch Offer",
      offerValue: "Up to ₹10,000 discount",
      description: "Premium smartphone with Dimensity 9300, Zeiss camera system, 6.78-inch AMOLED display, and 100W FlashCharge.",
      imageUrl: "https://images.unsplash.com/photo-1675997834137-0a344a9b8808",
      benefits: [
        "10% instant discount up to ₹10,000 with HDFC cards",
        "No-cost EMI for up to 12 months",
        "Extra ₹8,000 off on exchange",
        "Free wireless earbuds worth ₹4,999"
      ],
      validThrough: "July 15, 2023",
      category: "smartphone",
      retailers: [
        {
          name: "Vivo E-store",
          price: 89999,
          discount: "₹10,000 off",
          link: "https://vivo.com/in"
        },
        {
          name: "Flipkart",
          price: 91999,
          discount: "₹8,000 off",
          link: "https://flipkart.com"
        },
        {
          name: "Amazon.in",
          price: 92999,
          discount: "₹7,000 off",
          link: "https://amazon.in"
        },
        {
          name: "Croma",
          price: 93999,
          discount: "₹6,000 off",
          link: "https://croma.com"
        },
        {
          name: "Reliance Digital",
          price: 94999,
          discount: "₹5,000 off",
          link: "https://reliancedigital.in"
        }
      ]
    });

    const galaxyZFold5 = this.createShoppingOffer({
      storeName: "Samsung Galaxy Z Fold 5",
      location: "Online & Samsung Stores",
      distanceFromHotel: "N/A",
      offerType: "Premium Device Offer",
      offerValue: "Up to ₹22,000 off",
      description: "Cutting-edge foldable with 7.6-inch main display, Snapdragon 8 Gen 2, and advanced multitasking capabilities.",
      imageUrl: "https://images.unsplash.com/photo-1633155089824-84841e3c9d5d",
      benefits: [
        "₹15,000 cashback with HDFC Infinia card",
        "No-cost EMI for up to 24 months with SBI Elite",
        "Free Samsung Care+ worth ₹11,999",
        "Guaranteed ₹20,000 off on exchange"
      ],
      validThrough: "June 30, 2023",
      category: "smartphone",
      retailers: [
        {
          name: "Samsung Store",
          price: 154999,
          discount: "₹22,000 off",
          link: "https://samsung.com/in"
        },
        {
          name: "Amazon.in",
          price: 159999,
          discount: "₹17,000 off",
          link: "https://amazon.in"
        },
        {
          name: "Flipkart",
          price: 158999,
          discount: "₹18,000 off",
          link: "https://flipkart.com"
        },
        {
          name: "Croma",
          price: 161999,
          discount: "₹15,000 off",
          link: "https://croma.com"
        },
        {
          name: "Reliance Digital",
          price: 157999,
          discount: "₹19,000 off",
          link: "https://reliancedigital.in"
        }
      ]
    });

    const nothingPhone2 = this.createShoppingOffer({
      storeName: "Nothing Phone (2)",
      location: "Online Only",
      distanceFromHotel: "N/A",
      offerType: "Special Discount",
      offerValue: "Up to ₹5,000 off",
      description: "Unique smartphone with Glyph Interface, Snapdragon 8+ Gen 1, and clean Nothing OS based on Android 13.",
      imageUrl: "https://images.unsplash.com/photo-1678911170153-18af9dce99c0",
      benefits: [
        "Instant discount of ₹5,000 with HDFC cards",
        "No-cost EMI for up to 9 months",
        "Free Nothing Ear (2) worth ₹9,999 with ICICI cards",
        "Additional exchange bonus of ₹3,000"
      ],
      validThrough: "May 31, 2023",
      category: "smartphone",
      retailers: [
        {
          name: "Flipkart",
          price: 44999,
          discount: "₹5,000 off",
          link: "https://flipkart.com"
        },
        {
          name: "Amazon.in",
          price: 45999,
          discount: "₹4,000 off",
          link: "https://amazon.in"
        },
        {
          name: "Croma",
          price: 46999,
          discount: "₹3,000 off",
          link: "https://croma.com"
        },
        {
          name: "Reliance Digital",
          price: 47999,
          discount: "₹2,000 off",
          link: "https://reliancedigital.in"
        }
      ]
    });

    const appleWatch9 = this.createShoppingOffer({
      storeName: "Apple Watch Series 9",
      location: "Online & Apple Stores",
      distanceFromHotel: "N/A",
      offerType: "Card Partner Offer",
      offerValue: "Up to ₹4,000 off",
      description: "Latest Apple Watch with S9 chip, Double Tap gesture, and advanced health monitoring features.",
      imageUrl: "https://images.unsplash.com/photo-1551816230-ef5deaed4a26",
      benefits: [
        "Instant discount of ₹4,000 with HDFC Infinia card",
        "No-cost EMI for up to 6 months with ICICI cards",
        "Additional Apple One subscription free for 3 months",
        "Extra trade-in value of ₹2,000 for old watches"
      ],
      validThrough: "August 31, 2023",
      category: "accessories",
      retailers: [
        {
          name: "Apple Store",
          price: 41900,
          discount: "₹4,000 off",
          link: "https://apple.com/in"
        },
        {
          name: "Amazon.in",
          price: 42900,
          discount: "₹3,000 off",
          link: "https://amazon.in"
        },
        {
          name: "Flipkart",
          price: 43900,
          discount: "₹2,000 off",
          link: "https://flipkart.com"
        },
        {
          name: "Croma",
          price: 42900,
          discount: "₹3,000 off",
          link: "https://croma.com"
        },
        {
          name: "Reliance Digital",
          price: 43900,
          discount: "₹2,000 off",
          link: "https://reliancedigital.in"
        }
      ]
    });
    
    // Store all the sample data
    this.users.set(createdUser.id, createdUser);

    this.creditCards.set(hdfcCard.id, hdfcCard);
    this.creditCards.set(iciciCard.id, iciciCard);
    this.creditCards.set(sbiCard.id, sbiCard);

    // Store sample flights
    this.flights.set(airIndiaFlight.id, airIndiaFlight);
    this.flights.set(indigoFlight.id, indigoFlight);
    this.flights.set(vistara.id, vistara);
    this.flights.set(emiratesFlight.id, emiratesFlight);
    this.flights.set(airArabiaFlight.id, airArabiaFlight);

    // Store sample hotels
    this.hotels.set(burjAlArabHotel.id, burjAlArabHotel);
    this.hotels.set(atlantisHotel.id, atlantisHotel);
    this.hotels.set(addressDowntownHotel.id, addressDowntownHotel);

    // Store sample shopping offers
    this.shoppingOffers.set(samsungS25Ultra.id, samsungS25Ultra);
    this.shoppingOffers.set(iphone15Pro.id, iphone15Pro);
    this.shoppingOffers.set(pixel8Pro.id, pixel8Pro);
    this.shoppingOffers.set(onePlus12.id, onePlus12);
    this.shoppingOffers.set(vivoX100Pro.id, vivoX100Pro);
    this.shoppingOffers.set(galaxyZFold5.id, galaxyZFold5);
    this.shoppingOffers.set(nothingPhone2.id, nothingPhone2);
    this.shoppingOffers.set(appleWatch9.id, appleWatch9);

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

  // Financial Profile methods
  async createFinancialProfile(data: InsertFinancialProfile): Promise<FinancialProfile> {
    const newProfile = {
      id: this.getNextId('financial_profiles'),
      ...data,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    } as FinancialProfile;
    
    this.financial_profiles.push(newProfile);
    return newProfile;
  }

  async getFinancialProfileByUserId(userId: number): Promise<FinancialProfile | null> {
    const profile = this.financial_profiles.find(p => p.userId === userId);
    return profile || null;
  }

  async updateFinancialProfile(userId: number, data: Partial<InsertFinancialProfile>): Promise<FinancialProfile | null> {
    const index = this.financial_profiles.findIndex(p => p.userId === userId);
    if (index === -1) return null;
    
    const updatedProfile = {
      ...this.financial_profiles[index],
      ...data,
      updatedAt: new Date().toISOString(),
    };
    
    this.financial_profiles[index] = updatedProfile;
    return updatedProfile;
  }

  async createCardRecommendations(recommendations: InsertCardRecommendation[]): Promise<CardRecommendation[]> {
    const newRecommendations = recommendations.map(rec => ({
      id: this.getNextId('card_recommendations'),
      ...rec,
      createdAt: new Date().toISOString(),
    })) as CardRecommendation[];
    
    this.card_recommendations.push(...newRecommendations);
    return newRecommendations;
  }

  async getCardRecommendationsByUserId(userId: number): Promise<CardRecommendation[]> {
    return this.card_recommendations.filter(rec => rec.userId === userId);
  }

  async deleteCardRecommendationsByUserId(userId: number): Promise<void> {
    this.card_recommendations = this.card_recommendations.filter(rec => rec.userId !== userId);
  }

  // Helper method to get the next available ID for a specific entity
  private getNextId(entity: string): number {
    switch (entity) {
      case 'financial_profiles':
        return this.financialProfileIdCounter++;
      case 'card_recommendations':
        return this.cardRecommendationIdCounter++;
      default:
        throw new Error(`Unknown entity type: ${entity}`);
    }
  }
}

// Import the database storage
import { DatabaseStorage } from "./database-storage";

// Use MemStorage instead of DatabaseStorage to display our sample flight data
// export const storage = new DatabaseStorage();
export const storage = new MemStorage();
