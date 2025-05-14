import React, { useState, useEffect } from 'react';
import { ShoppingOffer as ShoppingOfferType, Retailer } from '@shared/schema';
import { useLocation } from 'wouter';
import { Button } from "@/components/ui/button";
import { ShoppingBag, Tag, CreditCard, CheckCircle, ExternalLink, Star, Percent } from 'lucide-react';

// Type for our component that ensures benefits is a string array
interface ExtendedShoppingOffer extends Omit<ShoppingOfferType, 'benefits'> {
  benefits: string[];
}

export default function SimpleShoppingInterface() {
  const [products, setProducts] = useState<ExtendedShoppingOffer[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [selectedProductId, setSelectedProductId] = useState<string | null>(null);
  const [location] = useLocation();
  const [activeCategory, setActiveCategory] = useState("all");

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const response = await fetch('/api/shopping');
        
        if (!response.ok) {
          throw new Error(`API responded with status: ${response.status}`);
        }
        
        const data = await response.json();
        console.log('Shopping data:', data);
        
        // Filter out any empty objects or invalid entries
        const validProducts = data.filter((product: any) => 
          product && 
          product.id && 
          product.storeName && 
          product.category
        );
        
        setProducts(validProducts as ExtendedShoppingOffer[]);
        setIsLoading(false);
      } catch (err) {
        console.error('Error fetching products:', err);
        setError(err instanceof Error ? err : new Error('Unknown error'));
        setIsLoading(false);
        
        // If we failed to fetch, use mock data for demonstration
        if (process.env.NODE_ENV !== 'production') {
          console.log('Using fallback product data');
          setProducts(getFallbackProducts());
          setError(null);
        }
      }
    };
    
    fetchProducts();

    // Extract selected product ID from URL if present
    if (location.includes('?')) {
      const params = new URLSearchParams(location.split('?')[1]);
      const selected = params.get('selected');
      if (selected) {
        setSelectedProductId(selected);
      }
    }
  }, [location]);

  // Get fallback products for development/testing
  const getFallbackProducts = (): ExtendedShoppingOffer[] => {
    return [
      {
        id: 1,
        storeName: "Samsung S25 Ultra",
        location: "Online & Retail Stores",
        distanceFromHotel: "N/A",
        offerType: "Flash Sale",
        offerValue: "Up to ₹12,000 off",
        description: "Experience Samsung's latest flagship with 200MP camera and advanced AI features.",
        imageUrl: "https://images.unsplash.com/photo-1610945415295-d9bbf067e59c",
        benefits: [
          "No-cost EMI up to 12 months with HDFC card",
          "10% instant discount with HDFC Infinia"
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
          }
        ]
      },
      {
        id: 2,
        storeName: "Apple iPhone 15 Pro",
        location: "Online & Apple Store",
        distanceFromHotel: "N/A",
        offerType: "Bank Offer",
        offerValue: "Up to ₹10,000 cashback",
        description: "Apple's premium smartphone with A17 Pro chip and 48MP camera system.",
        imageUrl: "https://images.unsplash.com/photo-1696448425293-f27ee245db30",
        benefits: [
          "5% cashback up to ₹10,000 with HDFC Infinia",
          "No-cost EMI for 9 months with ICICI cards"
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
          }
        ]
      }
    ];
  };

  const renderRetailers = (retailers: ExtendedShoppingOffer['retailers']) => {
    if (!retailers || retailers.length === 0) return null;

    return (
      <div className="mt-4 space-y-2">
        <h4 className="text-sm font-medium">Available at:</h4>
        {retailers.map((retailer, index) => (
          <div key={index} className="flex justify-between items-center text-sm border-b pb-2">
            <div className="flex items-center">
              <span className="font-medium">{retailer.name}</span>
              {retailer.discount && (
                <span className="ml-2 text-xs bg-green-100 text-green-800 px-1.5 py-0.5 rounded">
                  {retailer.discount}
                </span>
              )}
            </div>
            <div className="flex items-center gap-2">
              <span className="font-bold">₹{retailer.price.toLocaleString()}</span>
              <a 
                href={retailer.link} 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-blue-600 hover:text-blue-800"
              >
                <ExternalLink className="h-4 w-4" />
              </a>
            </div>
          </div>
        ))}
      </div>
    );
  };

  const filterProducts = () => {
    if (activeCategory === "all") return products;
    return products.filter(product => product.category === activeCategory);
  };

  if (isLoading) {
    return (
      <div className="p-8 text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-700 mx-auto"></div>
        <p className="mt-4 text-gray-600">Loading products...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8 text-center">
        <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 rounded">
          <p>Unable to load products. Please try again later.</p>
          <p className="text-sm">{error.message}</p>
        </div>
      </div>
    );
  }

  if (products.length === 0) {
    return (
      <div className="p-8 text-center">
        <ShoppingBag className="h-12 w-12 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-700 mb-2">No Products Found</h3>
        <p className="text-gray-500">
          No products are currently available. Please try different search criteria.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white">
      <div className="bg-blue-50 p-4 border-b">
        <div className="flex justify-between items-center">
          <h2 className="text-lg font-medium text-blue-900">
            Shopping Deals
          </h2>
          <div className="text-sm text-blue-600 bg-white px-3 py-1 rounded-full border border-blue-200">
            Using HDFC Infinia Card
          </div>
        </div>
        <p className="text-sm text-gray-600 mt-1">
          Find the best deals on smartphones with your card benefits
        </p>
      </div>

      <div className="p-4 border-b bg-amber-50">
        <h3 className="font-medium mb-2">Exclusive Card Offers</h3>
        <div className="flex flex-wrap gap-2">
          <div className="bg-white text-xs px-2 py-1 rounded border">
            <span className="flex items-center">
              <span className="w-3 h-3 rounded-full bg-[#1A1F71] mr-1"></span>
              HDFC Infinia: 10% instant discount
            </span>
          </div>
          <div className="bg-white text-xs px-2 py-1 rounded border">
            <span className="flex items-center">
              <span className="w-3 h-3 rounded-full bg-amber-500 mr-1"></span>
              ICICI Emeralde: No-cost EMI
            </span>
          </div>
          <div className="bg-white text-xs px-2 py-1 rounded border">
            <span className="flex items-center">
              <span className="w-3 h-3 rounded-full bg-blue-500 mr-1"></span>
              SBI Elite: 2X reward points
            </span>
          </div>
        </div>
      </div>

      {/* Category Filters */}
      <div className="p-4 border-b">
        <div className="flex flex-wrap gap-2">
          <button 
            className={`px-3 py-1 text-sm rounded-full ${activeCategory === "all" ? "bg-[#1A1F71] text-white" : "bg-gray-100 text-gray-800"}`}
            onClick={() => setActiveCategory("all")}
          >
            All Products
          </button>
          <button 
            className={`px-3 py-1 text-sm rounded-full ${activeCategory === "smartphone" ? "bg-[#1A1F71] text-white" : "bg-gray-100 text-gray-800"}`}
            onClick={() => setActiveCategory("smartphone")}
          >
            Smartphones
          </button>
          <button 
            className={`px-3 py-1 text-sm rounded-full ${activeCategory === "accessories" ? "bg-[#1A1F71] text-white" : "bg-gray-100 text-gray-800"}`}
            onClick={() => setActiveCategory("accessories")}
          >
            Accessories
          </button>
        </div>
      </div>

      <div className="divide-y">
        {filterProducts().map((product) => (
          <div 
            key={product.id}
            className={`p-4 hover:bg-gray-50 transition-colors ${selectedProductId === product.id.toString() ? 'bg-blue-50 border-l-4 border-blue-500' : ''}`}
          >
            <div className="flex flex-col md:flex-row gap-4">
              <div className="w-full md:w-1/4">
                <div className="relative aspect-square rounded-lg overflow-hidden bg-gray-200">
                  {product.imageUrl && (
                    <img 
                      src={product.imageUrl} 
                      alt={product.storeName} 
                      className="w-full h-full object-contain"
                    />
                  )}
                </div>
              </div>
              
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <h3 className="font-medium text-lg">{product.storeName}</h3>
                  <span className="text-xs bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full">
                    {product.category}
                  </span>
                </div>
                
                <p className="text-sm text-gray-700 mt-1">
                  {product.description}
                </p>

                {product.offerType && product.offerValue && (
                  <div className="mt-2 flex items-center text-sm">
                    <Tag className="h-4 w-4 mr-1 text-blue-600" />
                    <span className="font-medium text-blue-800">
                      {product.offerType}: {product.offerValue}
                    </span>
                  </div>
                )}
                
                {product.benefits && product.benefits.length > 0 && (
                  <div className="mt-3">
                    <h4 className="text-sm font-medium mb-1">Card Benefits:</h4>
                    <ul className="space-y-1">
                      {product.benefits.map((benefit, index) => (
                        <li key={index} className="text-sm flex items-start">
                          <CheckCircle className="h-4 w-4 text-green-500 mr-1 flex-shrink-0 mt-0.5" />
                          <span className="text-gray-700">{benefit}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {product.retailers && renderRetailers(product.retailers)}
              </div>
              
              <div className="w-full md:w-1/4 flex flex-col items-end justify-between">
                <div>
                  <div className="text-right">
                    <div className="text-lg font-bold">
                      Starting from
                    </div>
                    <div className="text-2xl font-bold text-blue-700">
                      ₹{Math.min(...(product.retailers?.map(r => r.price) || [0])).toLocaleString()}
                    </div>
                    <div className="text-sm text-gray-500">
                      Valid through: {product.validThrough}
                    </div>
                  </div>
                  
                  <div className="mt-2 flex items-center justify-end gap-1">
                    <Percent className="h-4 w-4 text-green-600" />
                    <span className="text-green-600 text-sm font-medium">
                      Best price with HDFC Infinia
                    </span>
                  </div>
                </div>
                
                <Button className="mt-3 bg-[#1A1F71] w-full">
                  Compare Prices
                </Button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
} 