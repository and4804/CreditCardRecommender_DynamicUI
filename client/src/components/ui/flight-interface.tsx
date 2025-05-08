import { useQuery } from "@tanstack/react-query";
import { Flight } from "@shared/schema";
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

export function FlightInterface() {
  const [sortBy, setSortBy] = useState("bestValue");
  const [selectedFilter, setSelectedFilter] = useState("premiumEconomy");

  const { data: flights, isLoading } = useQuery<Flight[]>({
    queryKey: ["/api/flights"],
  });

  const handleFilterClick = (filter: string) => {
    setSelectedFilter(filter === selectedFilter ? "" : filter);
  };

  if (isLoading) {
    return (
      <div className="h-full">
        <div className="bg-[#00A4E4] p-4 text-white">
          <div className="flex justify-between items-center">
            <h2 className="font-sf-pro font-semibold">Flight Search</h2>
            <div className="text-xs bg-white text-[#00A4E4] px-2 py-1 rounded-full">
              Using Amex Points
            </div>
          </div>
          <p className="text-sm opacity-80">SFO to NYC • Jun 15-22, 2023 • 1 Traveler</p>
        </div>
        
        <div className="p-4">
          <Skeleton className="h-8 w-full mb-4" />
          <Skeleton className="h-12 w-full mb-4" />
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-48 w-full" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full">
      <div className="bg-[#00A4E4] p-4 text-white">
        <div className="flex justify-between items-center">
          <h2 className="font-sf-pro font-semibold">Flight Search</h2>
          <div className="text-xs bg-white text-[#00A4E4] px-2 py-1 rounded-full">
            Using Amex Points
          </div>
        </div>
        <p className="text-sm opacity-80">SFO to NYC • Jun 15-22, 2023 • 1 Traveler</p>
      </div>
      
      <div className="p-4">
        {/* Search Filters */}
        <div className="flex flex-wrap items-center gap-3 mb-4 pb-4 border-b">
          <span className="text-sm font-medium">Filters:</span>
          <Button 
            variant="outline"
            size="sm"
            className={`text-xs px-3 py-1 rounded-full ${selectedFilter === "nonstop" ? "bg-[#1A1F71] text-white" : "bg-gray-100 hover:bg-gray-200"}`}
            onClick={() => handleFilterClick("nonstop")}
          >
            Nonstop
          </Button>
          <Button 
            variant="outline"
            size="sm"
            className={`text-xs px-3 py-1 rounded-full ${selectedFilter === "morning" ? "bg-[#1A1F71] text-white" : "bg-gray-100 hover:bg-gray-200"}`}
            onClick={() => handleFilterClick("morning")}
          >
            Morning Departure
          </Button>
          <Button 
            variant="outline"
            size="sm"
            className={`text-xs px-3 py-1 rounded-full ${selectedFilter === "bestValue" ? "bg-[#1A1F71] text-white" : "bg-gray-100 hover:bg-gray-200"}`}
            onClick={() => handleFilterClick("bestValue")}
          >
            Best Points Value
          </Button>
          <Button 
            variant="outline"
            size="sm"
            className={`text-xs px-3 py-1 rounded-full ${selectedFilter === "premiumEconomy" ? "bg-[#1A1F71] text-white" : "bg-gray-100 hover:bg-gray-200"}`}
            onClick={() => handleFilterClick("premiumEconomy")}
          >
            Premium Economy+
          </Button>
          <Button 
            variant="outline"
            size="sm"
            className={`text-xs px-3 py-1 rounded-full ${selectedFilter === "amexPartners" ? "bg-[#1A1F71] text-white" : "bg-gray-100 hover:bg-gray-200"}`}
            onClick={() => handleFilterClick("amexPartners")}
          >
            Amex Travel Partners
          </Button>
        </div>
        
        {/* Results Header */}
        <div className="flex justify-between items-center mb-4">
          <h3 className="font-sf-pro font-medium">Best Options for Your Amex Card</h3>
          <div className="flex items-center">
            <span className="text-sm mr-2">Sort by:</span>
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="text-sm h-8 w-36">
                <SelectValue placeholder="Best Value" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="bestValue">Best Value</SelectItem>
                <SelectItem value="lowestPoints">Lowest Points</SelectItem>
                <SelectItem value="departureTime">Departure Time</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        
        {/* Flight Results */}
        <div className="space-y-4 max-h-[calc(100vh-20rem)] overflow-y-auto scrollbar-thin">
          {flights?.map((flight) => (
            <div key={flight.id} className="border rounded-lg p-4 hover:shadow-md transition cursor-pointer">
              <div className="flex justify-between items-center mb-3">
                <div className="flex items-center">
                  {flight.airline === "Delta" && (
                    <svg viewBox="0 0 24 24" className="w-8 h-8 mr-2">
                      <path fill="#E01933" d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8z"/>
                      <path fill="#E01933" d="m8 16 8-8-4-4-8 8z"/>
                    </svg>
                  )}
                  {flight.airline === "United" && (
                    <svg viewBox="0 0 24 24" className="w-8 h-8 mr-2">
                      <path fill="#005DAA" d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 15H7V7h4v10zm6 0h-4V7h4v10z"/>
                    </svg>
                  )}
                  {flight.airline === "JetBlue" && (
                    <svg viewBox="0 0 24 24" className="w-8 h-8 mr-2">
                      <path fill="#0033A0" d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15H7v-2h3v2zm4 0h-3v-2h3v2zm4 0h-3v-2h3v2z"/>
                    </svg>
                  )}
                  <span className="font-medium">{flight.airline}</span>
                </div>
                <div>
                  {flight.airline === "Delta" && (
                    <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full">Best Points Value</span>
                  )}
                  {flight.airline === "United" && (
                    <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">Amex Transfer Partner</span>
                  )}
                  {flight.airline === "JetBlue" && (
                    <span className="text-xs bg-purple-100 text-purple-800 px-2 py-1 rounded-full">Lowest Points</span>
                  )}
                </div>
              </div>
              
              <div className="flex justify-between items-center">
                <div className="flex-1">
                  <div className="flex justify-between items-center">
                    <div className="text-center">
                      <p className="font-semibold">{flight.departureTime}</p>
                      <p className="text-xs text-gray-500">{flight.departureAirport}</p>
                    </div>
                    <div className="flex-1 px-4">
                      <div className="relative">
                        <div className="h-[2px] bg-gray-300 w-full absolute top-1/2"></div>
                        <div className="flex justify-between relative">
                          <div className="w-2 h-2 rounded-full bg-gray-500"></div>
                          <div className="w-2 h-2 rounded-full bg-gray-500"></div>
                        </div>
                        <p className="text-xs text-center text-gray-500 mt-1">{flight.duration} • {flight.isNonstop ? "Nonstop" : "1 Stop"}</p>
                      </div>
                    </div>
                    <div className="text-center">
                      <p className="font-semibold">{flight.arrivalTime}</p>
                      <p className="text-xs text-gray-500">{flight.arrivalAirport}</p>
                    </div>
                  </div>
                </div>
                
                <div className="ml-6 text-right">
                  <p className="font-semibold text-[#00A4E4]">{flight.pointsRequired.toLocaleString()} points</p>
                  <div className="relative">
                    <p className="text-xs text-gray-500 line-through">₹{flight.cashPrice.toLocaleString()}</p>
                    <p className="text-xs font-semibold text-green-600">₹{Math.round(flight.cashPrice * 0.85).toLocaleString()}</p>
                    <p className="text-xs text-green-600">Save ₹{Math.round(flight.cashPrice * 0.15).toLocaleString()}</p>
                  </div>
                  <div className="flex items-center justify-end mt-1">
                    {[...Array(Math.floor(flight.rating))].map((_, i) => (
                      <svg 
                        key={i}
                        xmlns="http://www.w3.org/2000/svg" 
                        viewBox="0 0 24 24" 
                        fill="#FFB700" 
                        className="w-3 h-3"
                      >
                        <path d="M12 2l2.4 7.6h7.6l-6 4.4 2.4 7.6-6-4.4-6 4.4 2.4-7.6-6-4.4h7.6z" />
                      </svg>
                    ))}
                    {flight.rating % 1 !== 0 && (
                      <svg 
                        xmlns="http://www.w3.org/2000/svg" 
                        viewBox="0 0 24 24"
                        fill="#FFB700"
                        className="w-3 h-3"
                      >
                        <path d="M12 2l2.4 7.6h7.6l-6 4.4 2.4 7.6-6-4.4-6 4.4 2.4-7.6-6-4.4h7.6z" />
                        <path d="M12 2v15.5l-6 4.5 2.3-7.6-6-4.4h7.6z" />
                      </svg>
                    )}
                    {[...Array(5 - Math.ceil(flight.rating))].map((_, i) => (
                      <svg 
                        key={i + Math.ceil(flight.rating)}
                        xmlns="http://www.w3.org/2000/svg" 
                        viewBox="0 0 24 24" 
                        fill="none"
                        stroke="#FFB700"
                        strokeWidth="1"
                        className="w-3 h-3"
                      >
                        <path d="M12 2l2.4 7.6h7.6l-6 4.4 2.4 7.6-6-4.4-6 4.4 2.4-7.6-6-4.4h7.6z" />
                      </svg>
                    ))}
                  </div>
                </div>
              </div>
              
              <div className="mt-3 pt-3 border-t">
                <div className="flex justify-between items-center">
                  <div>
                    {(flight.cardBenefits as string[]).map((benefit, index) => (
                      <span key={index} className={`text-xs ${index === 0 ? 'bg-[#2A3080] text-white' : ''} ${index === 0 ? 'px-2 py-1 rounded-full' : ''} ${index !== 0 ? 'ml-2' : ''}`}>
                        {benefit}
                      </span>
                    ))}
                  </div>
                  <Button className="text-sm bg-[#1A1F71] text-white px-4 py-1 rounded hover:bg-[#141A5E] transition">
                    Select
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
        
        {/* Card Benefits Section */}
        <div className="mt-4 p-4 rounded-lg bg-blue-50 border border-blue-100">
          <h3 className="font-sf-pro font-medium text-sm mb-2 text-[#1A1F71]">Your Amex Platinum Card Benefits</h3>
          <div className="grid grid-cols-2 gap-2">
            <div className="flex items-center">
              <svg 
                xmlns="http://www.w3.org/2000/svg" 
                viewBox="0 0 24 24" 
                fill="none" 
                stroke="#00A4E4" 
                strokeWidth="2" 
                className="w-4 h-4 mr-2"
              >
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                <polyline points="22 4 12 14.01 9 11.01"></polyline>
              </svg>
              <span className="text-xs">5X points on flights booked directly</span>
            </div>
            <div className="flex items-center">
              <svg 
                xmlns="http://www.w3.org/2000/svg" 
                viewBox="0 0 24 24" 
                fill="none" 
                stroke="#00A4E4" 
                strokeWidth="2" 
                className="w-4 h-4 mr-2"
              >
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                <polyline points="22 4 12 14.01 9 11.01"></polyline>
              </svg>
              <span className="text-xs">$200 airline fee credit</span>
            </div>
            <div className="flex items-center">
              <svg 
                xmlns="http://www.w3.org/2000/svg" 
                viewBox="0 0 24 24" 
                fill="none" 
                stroke="#00A4E4" 
                strokeWidth="2" 
                className="w-4 h-4 mr-2"
              >
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                <polyline points="22 4 12 14.01 9 11.01"></polyline>
              </svg>
              <span className="text-xs">Airport lounge access</span>
            </div>
            <div className="flex items-center">
              <svg 
                xmlns="http://www.w3.org/2000/svg" 
                viewBox="0 0 24 24" 
                fill="none" 
                stroke="#00A4E4" 
                strokeWidth="2" 
                className="w-4 h-4 mr-2"
              >
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                <polyline points="22 4 12 14.01 9 11.01"></polyline>
              </svg>
              <span className="text-xs">Global Entry/TSA PreCheck credit</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
