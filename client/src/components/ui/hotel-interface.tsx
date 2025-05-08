import { useQuery } from "@tanstack/react-query";
import { Hotel } from "@shared/schema";
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

export function HotelInterface() {
  const [sortBy, setSortBy] = useState("recommended");
  const [selectedFilter, setSelectedFilter] = useState("amexFine");

  const { data: hotels, isLoading } = useQuery<Hotel[]>({
    queryKey: ["/api/hotels"],
  });

  const handleFilterClick = (filter: string) => {
    setSelectedFilter(filter === selectedFilter ? "" : filter);
  };

  if (isLoading) {
    return (
      <div className="h-full">
        <div className="bg-[#FFB700] p-4 text-white">
          <div className="flex justify-between items-center">
            <h2 className="font-sf-pro font-semibold">Hotel Search</h2>
            <div className="text-xs bg-white text-[#FFB700] px-2 py-1 rounded-full">
              FHR Properties
            </div>
          </div>
          <p className="text-sm opacity-80">Dubai • May 15-22, 2023 • 1 Guest</p>
        </div>
        
        <div className="p-4">
          <Skeleton className="h-8 w-full mb-4" />
          <Skeleton className="h-12 w-full mb-4" />
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-64 w-full" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full">
      <div className="bg-[#FFB700] p-4 text-white">
        <div className="flex justify-between items-center">
          <h2 className="font-sf-pro font-semibold">Hotel Search</h2>
          <div className="text-xs bg-white text-[#FFB700] px-2 py-1 rounded-full">
            FHR Properties
          </div>
        </div>
        <p className="text-sm opacity-80">Dubai • May 15-22, 2023 • 1 Guest</p>
      </div>
      
      <div className="p-4">
        {/* Search Filters */}
        <div className="flex flex-wrap items-center gap-3 mb-4 pb-4 border-b">
          <span className="text-sm font-medium">Filters:</span>
          <Button 
            variant="outline"
            size="sm"
            className={`text-xs px-3 py-1 rounded-full ${selectedFilter === "fourStar" ? "bg-[#FFB700] text-white" : "bg-gray-100 hover:bg-gray-200"}`}
            onClick={() => handleFilterClick("fourStar")}
          >
            4★ & Up
          </Button>
          <Button 
            variant="outline"
            size="sm"
            className={`text-xs px-3 py-1 rounded-full ${selectedFilter === "midPrice" ? "bg-[#FFB700] text-white" : "bg-gray-100 hover:bg-gray-200"}`}
            onClick={() => handleFilterClick("midPrice")}
          >
            ₹30,000-50,000/night
          </Button>
          <Button 
            variant="outline"
            size="sm"
            className={`text-xs px-3 py-1 rounded-full ${selectedFilter === "breakfast" ? "bg-[#FFB700] text-white" : "bg-gray-100 hover:bg-gray-200"}`}
            onClick={() => handleFilterClick("breakfast")}
          >
            Free Breakfast
          </Button>
          <Button 
            variant="outline"
            size="sm"
            className={`text-xs px-3 py-1 rounded-full ${selectedFilter === "amexFine" ? "bg-[#FFB700] text-white" : "bg-gray-100 hover:bg-gray-200"}`}
            onClick={() => handleFilterClick("amexFine")}
          >
            Amex Fine Hotels
          </Button>
          <Button 
            variant="outline"
            size="sm"
            className={`text-xs px-3 py-1 rounded-full ${selectedFilter === "downtown" ? "bg-[#FFB700] text-white" : "bg-gray-100 hover:bg-gray-200"}`}
            onClick={() => handleFilterClick("downtown")}
          >
            Dubai Downtown
          </Button>
        </div>
        
        {/* Results Header */}
        <div className="flex justify-between items-center mb-4">
          <h3 className="font-sf-pro font-medium">Recommended Hotels for Your Stay</h3>
          <div className="flex items-center">
            <span className="text-sm mr-2">Sort by:</span>
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="text-sm h-8 w-40">
                <SelectValue placeholder="Recommended" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="recommended">Recommended</SelectItem>
                <SelectItem value="priceAsc">Price (low to high)</SelectItem>
                <SelectItem value="rating">Rating</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        
        {/* Hotel Results */}
        <div className="space-y-4 max-h-[calc(100vh-20rem)] overflow-y-auto scrollbar-thin">
          {hotels?.map((hotel) => (
            <div key={hotel.id} className="border rounded-lg overflow-hidden hover:shadow-md transition cursor-pointer">
              <div className="flex flex-col md:flex-row">
                <div className="w-full md:w-1/3 h-48 md:h-auto relative">
                  <img 
                    src={hotel.imageUrl} 
                    alt={hotel.name} 
                    className="w-full h-full object-cover" 
                  />
                  <div className="absolute top-2 left-2">
                    {hotel.name === "The Langham New York" && (
                      <span className="text-xs bg-[#1A1F71] text-white px-2 py-1 rounded-full">FHR Property</span>
                    )}
                    {hotel.name === "The Mercer Hotel" && (
                      <span className="text-xs bg-[#FFB700] text-white px-2 py-1 rounded-full">Member Favorite</span>
                    )}
                    {hotel.name === "The Standard High Line" && (
                      <span className="text-xs bg-green-600 text-white px-2 py-1 rounded-full">Best Value</span>
                    )}
                  </div>
                </div>
                
                <div className="w-full md:w-2/3 p-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="font-sf-pro font-semibold">{hotel.name}</h4>
                      <div className="flex items-center mt-1">
                        <div className="flex text-[#FFB700]">
                          {[...Array(Math.floor(hotel.rating))].map((_, i) => (
                            <svg 
                              key={i}
                              xmlns="http://www.w3.org/2000/svg" 
                              viewBox="0 0 24 24" 
                              fill="#FFB700" 
                              className="w-4 h-4"
                            >
                              <path d="M12 2l2.4 7.6h7.6l-6 4.4 2.4 7.6-6-4.4-6 4.4 2.4-7.6-6-4.4h7.6z" />
                            </svg>
                          ))}
                          {hotel.rating % 1 !== 0 && (
                            <svg 
                              xmlns="http://www.w3.org/2000/svg" 
                              viewBox="0 0 24 24"
                              fill="#FFB700"
                              className="w-4 h-4"
                            >
                              <path d="M12 2l2.4 7.6h7.6l-6 4.4 2.4 7.6-6-4.4-6 4.4 2.4-7.6-6-4.4h7.6z" />
                              <path d="M12 2v15.5l-6 4.5 2.3-7.6-6-4.4h7.6z" />
                            </svg>
                          )}
                          {[...Array(5 - Math.ceil(hotel.rating))].map((_, i) => (
                            <svg 
                              key={i + Math.ceil(hotel.rating)}
                              xmlns="http://www.w3.org/2000/svg" 
                              viewBox="0 0 24 24" 
                              fill="none"
                              stroke="#FFB700"
                              strokeWidth="1"
                              className="w-4 h-4"
                            >
                              <path d="M12 2l2.4 7.6h7.6l-6 4.4 2.4 7.6-6-4.4-6 4.4 2.4-7.6-6-4.4h7.6z" />
                            </svg>
                          ))}
                        </div>
                        <span className="text-xs ml-2 text-gray-500">
                          {hotel.rating.toFixed(1)} ({hotel.reviewCount} reviews)
                        </span>
                      </div>
                      <p className="text-sm text-gray-500 mt-1">{hotel.location}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-gray-500 line-through">₹{hotel.pricePerNight.toLocaleString()}<span className="text-sm font-normal">/night</span></p>
                      <p className="font-semibold text-[#1A1F71]">₹{Math.round(hotel.pricePerNight * 0.85).toLocaleString()}<span className="text-sm font-normal text-gray-500">/night</span></p>
                      <p className="text-xs text-gray-500 line-through">₹{hotel.totalPrice.toLocaleString()} total</p>
                      <p className="text-xs font-semibold text-green-600">₹{Math.round(hotel.totalPrice * 0.85).toLocaleString()} total</p>
                      <p className="text-xs text-green-600">Save ₹{Math.round(hotel.totalPrice * 0.15).toLocaleString()}</p>
                      <p className="text-xs text-amber-600 mt-1">Earn {hotel.pointsEarned.toLocaleString()} points</p>
                    </div>
                  </div>
                  
                  <div className="mt-3">
                    <p className="text-sm">{hotel.description}</p>
                    
                    <div className="mt-3 flex flex-wrap gap-2">
                      {(hotel.benefits as string[]).map((benefit, index) => {
                        const colors = [
                          "bg-green-100 text-green-800", 
                          "bg-blue-100 text-blue-800", 
                          "bg-purple-100 text-purple-800", 
                          "bg-amber-100 text-amber-800"
                        ];
                        return (
                          <span 
                            key={index} 
                            className={`text-xs ${colors[index % colors.length]} px-2 py-1 rounded-full`}
                          >
                            {benefit}
                          </span>
                        );
                      })}
                    </div>
                    
                    <div className="mt-3 flex justify-between items-center">
                      <span className="text-xs text-[#1A1F71] font-medium">{hotel.cardExclusiveOffer}</span>
                      <Button className="text-sm bg-[#1A1F71] text-white px-4 py-1 rounded hover:bg-[#141A5E] transition">
                        Select
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
        
        {/* Card Benefits Section */}
        <div className="mt-4 p-4 rounded-lg bg-yellow-50 border border-yellow-100">
          <h3 className="font-sf-pro font-medium text-sm mb-2 text-[#1A1F71]">Your Premium Indian Credit Card Benefits</h3>
          <div className="grid grid-cols-2 gap-2">
            <div className="flex items-center">
              <svg 
                xmlns="http://www.w3.org/2000/svg" 
                viewBox="0 0 24 24" 
                fill="none" 
                stroke="#FFB700" 
                strokeWidth="2" 
                className="w-4 h-4 mr-2"
              >
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                <polyline points="22 4 12 14.01 9 11.01"></polyline>
              </svg>
              <span className="text-xs">HDFC Infinia: 10X reward points</span>
            </div>
            <div className="flex items-center">
              <svg 
                xmlns="http://www.w3.org/2000/svg" 
                viewBox="0 0 24 24" 
                fill="none" 
                stroke="#FFB700" 
                strokeWidth="2" 
                className="w-4 h-4 mr-2"
              >
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                <polyline points="22 4 12 14.01 9 11.01"></polyline>
              </svg>
              <span className="text-xs">ICICI Emeralde: 12% discount</span>
            </div>
            <div className="flex items-center">
              <svg 
                xmlns="http://www.w3.org/2000/svg" 
                viewBox="0 0 24 24" 
                fill="none" 
                stroke="#FFB700" 
                strokeWidth="2" 
                className="w-4 h-4 mr-2"
              >
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                <polyline points="22 4 12 14.01 9 11.01"></polyline>
              </svg>
              <span className="text-xs">SBI Elite: Free airport transfers</span>
            </div>
            <div className="flex items-center">
              <svg 
                xmlns="http://www.w3.org/2000/svg" 
                viewBox="0 0 24 24" 
                fill="none" 
                stroke="#FFB700" 
                strokeWidth="2" 
                className="w-4 h-4 mr-2"
              >
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                <polyline points="22 4 12 14.01 9 11.01"></polyline>
              </svg>
              <span className="text-xs">All cards: Free Burj Khalifa tickets</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
