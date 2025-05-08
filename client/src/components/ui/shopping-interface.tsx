import { useQuery } from "@tanstack/react-query";
import { ShoppingOffer } from "@shared/schema";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useState } from "react";

export function ShoppingInterface() {
  const [sortBy, setSortBy] = useState("highestDiscount");
  const [selectedCategory, setSelectedCategory] = useState("Electronics");
  const [searchQuery, setSearchQuery] = useState("");

  const { data: offers, isLoading } = useQuery<ShoppingOffer[]>({
    queryKey: ["/api/shopping-offers", selectedCategory !== "all" ? selectedCategory : null],
  });

  const handleCategoryClick = (category: string) => {
    setSelectedCategory(category);
  };

  // Filter offers based on search query
  const filteredOffers = offers?.filter(offer => {
    if (!searchQuery) return true;
    return (
      offer.storeName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      offer.description.toLowerCase().includes(searchQuery.toLowerCase())
    );
  });

  if (isLoading) {
    return (
      <div className="h-full">
        <div className="bg-[#141A5E] p-4 text-white">
          <div className="flex justify-between items-center">
            <h2 className="font-sf-pro font-semibold">Credit Card Offers</h2>
            <div className="text-xs bg-white text-[#141A5E] px-2 py-1 rounded-full">
              Global Offers
            </div>
          </div>
          <p className="text-sm opacity-80">Maximize your benefits with these card-exclusive offers</p>
        </div>
        
        <div className="p-4">
          <Skeleton className="h-8 w-full mb-4" />
          <Skeleton className="h-12 w-full mb-4" />
          <div className="space-y-4">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-28 w-full" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full">
      <div className="bg-[#141A5E] p-4 text-white">
        <div className="flex justify-between items-center">
          <h2 className="font-sf-pro font-semibold">Credit Card Offers</h2>
          <div className="text-xs bg-white text-[#141A5E] px-2 py-1 rounded-full">
            Global Offers
          </div>
        </div>
        <p className="text-sm opacity-80">Maximize your benefits with these card-exclusive offers</p>
      </div>
      
      <div className="p-4">
        {/* Search Bar */}
        <div className="mb-4">
          <input
            type="text"
            placeholder="Search for products or stores (e.g. Samsung S25 Ultra)"
            className="w-full p-2 border border-gray-300 rounded-lg"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      
        {/* Category Filters */}
        <div className="flex flex-wrap items-center gap-3 mb-4 pb-4 border-b">
          <span className="text-sm font-medium">Categories:</span>
          <Button 
            variant="outline"
            size="sm"
            className={`text-xs px-3 py-1 rounded-full ${selectedCategory === "all" ? "bg-[#1A1F71] text-white" : "bg-gray-100 hover:bg-gray-200"}`}
            onClick={() => handleCategoryClick("all")}
          >
            All Offers
          </Button>
          <Button 
            variant="outline"
            size="sm"
            className={`text-xs px-3 py-1 rounded-full ${selectedCategory === "Fashion" ? "bg-[#1A1F71] text-white" : "bg-gray-100 hover:bg-gray-200"}`}
            onClick={() => handleCategoryClick("Fashion")}
          >
            Fashion
          </Button>
          <Button 
            variant="outline"
            size="sm"
            className={`text-xs px-3 py-1 rounded-full ${selectedCategory === "Electronics" ? "bg-[#1A1F71] text-white" : "bg-gray-100 hover:bg-gray-200"}`}
            onClick={() => handleCategoryClick("Electronics")}
          >
            Electronics
          </Button>
          <Button 
            variant="outline"
            size="sm"
            className={`text-xs px-3 py-1 rounded-full ${selectedCategory === "Dining" ? "bg-[#1A1F71] text-white" : "bg-gray-100 hover:bg-gray-200"}`}
            onClick={() => handleCategoryClick("Dining")}
          >
            Dining
          </Button>
          <Button 
            variant="outline"
            size="sm"
            className={`text-xs px-3 py-1 rounded-full ${selectedCategory === "Entertainment" ? "bg-[#1A1F71] text-white" : "bg-gray-100 hover:bg-gray-200"}`}
            onClick={() => handleCategoryClick("Entertainment")}
          >
            Entertainment
          </Button>
        </div>
        
        {/* Samsung S25 Ultra Spotlight */}
        {selectedCategory === "Electronics" && (
          <div className="bg-gradient-to-r from-[#1A1F71] to-[#00A4E4] p-4 rounded-lg mb-4 text-white">
            <div className="flex justify-between items-center">
              <h3 className="font-sf-pro font-semibold">Samsung S25 Ultra Special Offers</h3>
              <div className="bg-white text-[#1A1F71] text-xs px-2 py-1 rounded-full">Best Card Deals</div>
            </div>
            <p className="text-sm mt-1 mb-3">Compare the best credit card offers for your new smartphone purchase</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
              <div className="bg-white bg-opacity-20 p-2 rounded">
                <span className="font-medium">Chase Freedom Flex:</span> 5% cashback on electronics purchases, extended warranty
              </div>
              <div className="bg-white bg-opacity-20 p-2 rounded">
                <span className="font-medium">American Express Blue Cash:</span> Special financing, purchase protection
              </div>
              <div className="bg-white bg-opacity-20 p-2 rounded">
                <span className="font-medium">Citi Double Cash Card:</span> 2% cash back on all purchases including your new phone
              </div>
              <div className="bg-white bg-opacity-20 p-2 rounded">
                <span className="font-medium">Discover it Cash Back:</span> First-year cash back match on all purchases
              </div>
            </div>
          </div>
        )}
        
        {/* Results Header */}
        <div className="flex justify-between items-center mb-4">
          <h3 className="font-sf-pro font-medium">
            {searchQuery ? `Search Results for "${searchQuery}"` : 
             selectedCategory === "all" ? "All Card Offers" : 
             `${selectedCategory} Card Offers`}
          </h3>
          <div className="flex items-center">
            <span className="text-sm mr-2">Sort by:</span>
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="text-sm h-8 w-40">
                <SelectValue placeholder="Highest Discount" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="highestDiscount">Highest Discount</SelectItem>
                <SelectItem value="bestValue">Best Value</SelectItem>
                <SelectItem value="mostPopular">Most Popular</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        
        {/* Store Results */}
        <div className="space-y-4 max-h-[calc(100vh-20rem)] overflow-y-auto scrollbar-thin">
          {filteredOffers?.length === 0 && (
            <div className="text-center p-4">
              <p className="text-gray-500">No offers found matching your search criteria.</p>
            </div>
          )}
          {filteredOffers?.map((offer) => (
            <div key={offer.id} className="border rounded-lg p-4 hover:shadow-md transition cursor-pointer">
              <div className="flex items-start">
                <div className="w-16 h-16 rounded-lg overflow-hidden mr-4 flex-shrink-0">
                  <img 
                    src={offer.imageUrl} 
                    alt={offer.storeName} 
                    className="w-full h-full object-cover" 
                  />
                </div>
                
                <div className="flex-1">
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="font-sf-pro font-semibold">{offer.storeName}</h4>
                      <p className="text-xs text-gray-500">{offer.location} ({offer.distanceFromHotel})</p>
                    </div>
                    <div className={`
                      ${offer.offerType === "percentage" && offer.storeName === "Bloomingdale's" ? "bg-[#FFB700]" : ""}
                      ${offer.offerType === "cash" ? "bg-[#00A4E4]" : ""}
                      ${offer.offerType === "percentage" && offer.storeName === "Eleven Madison Park" ? "bg-green-600" : ""}
                      ${offer.offerType === "points" ? "bg-[#1A1F71]" : ""}
                      text-white text-sm font-bold px-3 py-1 rounded-full
                    `}>
                      {offer.offerValue}
                    </div>
                  </div>
                  
                  <p className="text-sm mt-2">{offer.description}</p>
                  
                  <div className="mt-3 flex flex-wrap gap-2">
                    {(offer.benefits as string[]).map((benefit, index) => (
                      <span 
                        key={index} 
                        className={`text-xs ${index === 0 ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800'} px-2 py-1 rounded-full`}
                      >
                        {benefit}
                      </span>
                    ))}
                  </div>
                  
                  <div className="mt-3 flex justify-between items-center">
                    <span className="text-xs text-gray-500">Valid through {offer.validThrough}</span>
                    <Button 
                      className="text-sm bg-[#1A1F71] text-white px-4 py-1 rounded hover:bg-[#141A5E] transition"
                    >
                      {offer.storeName === "Broadway Show Tickets" ? "View Shows" : "Add to Card"}
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
        
        {/* Card Benefits Section */}
        <div className="mt-4 p-4 rounded-lg bg-gray-50 border border-gray-200">
          <h3 className="font-sf-pro font-medium text-sm mb-2 text-[#1A1F71]">Your Amex Platinum Shopping Benefits</h3>
          <div className="grid grid-cols-2 gap-2">
            <div className="flex items-center">
              <svg 
                xmlns="http://www.w3.org/2000/svg" 
                viewBox="0 0 24 24" 
                fill="none" 
                stroke="#1A1F71" 
                strokeWidth="2" 
                className="w-4 h-4 mr-2"
              >
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                <polyline points="22 4 12 14.01 9 11.01"></polyline>
              </svg>
              <span className="text-xs">Return protection up to $300 per item</span>
            </div>
            <div className="flex items-center">
              <svg 
                xmlns="http://www.w3.org/2000/svg" 
                viewBox="0 0 24 24" 
                fill="none" 
                stroke="#1A1F71" 
                strokeWidth="2" 
                className="w-4 h-4 mr-2"
              >
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                <polyline points="22 4 12 14.01 9 11.01"></polyline>
              </svg>
              <span className="text-xs">Purchase protection up to $10,000</span>
            </div>
            <div className="flex items-center">
              <svg 
                xmlns="http://www.w3.org/2000/svg" 
                viewBox="0 0 24 24" 
                fill="none" 
                stroke="#1A1F71" 
                strokeWidth="2" 
                className="w-4 h-4 mr-2"
              >
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                <polyline points="22 4 12 14.01 9 11.01"></polyline>
              </svg>
              <span className="text-xs">Extended warranty coverage</span>
            </div>
            <div className="flex items-center">
              <svg 
                xmlns="http://www.w3.org/2000/svg" 
                viewBox="0 0 24 24" 
                fill="none" 
                stroke="#1A1F71" 
                strokeWidth="2" 
                className="w-4 h-4 mr-2"
              >
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                <polyline points="22 4 12 14.01 9 11.01"></polyline>
              </svg>
              <span className="text-xs">ShopRunner 2-day shipping</span>
            </div>
          </div>
          <p className="text-xs text-center mt-3 text-gray-500">To view all available offers in NYC, ask your CardConcierge</p>
        </div>
      </div>
    </div>
  );
}
