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
import { useState, useEffect } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";

// Define types for our enhanced card benefits structure
type CardBenefit = {
  cardName: string;
  benefits: string[];
  discountedPrice: number;
};

type CardBenefits = {
  general: string[];
  cards: CardBenefit[];
};

export function FlightInterface() {
  const [sortBy, setSortBy] = useState("bestValue");
  const [selectedFilter, setSelectedFilter] = useState("premiumEconomy");
  const [selectedCardTab, setSelectedCardTab] = useState("all");

  const { data: flights, isLoading, error, refetch } = useQuery<Flight[]>({
    queryKey: ["/api/flights"],
    retry: 3,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 10000),
    refetchOnMount: "always",
    staleTime: 0
  });

  // Add a state to store directly fetched data if the query fails
  const [directlyFetchedFlights, setDirectlyFetchedFlights] = useState<Flight[] | null>(null);

  // Directly fetch the flight data on component mount
  useEffect(() => {
    const fetchFlights = async () => {
      try {
        console.log('Initial direct fetch of flight data...');
        const response = await fetch('http://localhost:5000/api/flights');
        
        if (!response.ok) {
          throw new Error(`API responded with status: ${response.status}`);
        }
        
        const data = await response.json();
        console.log('Direct fetch succeeded with', data.length, 'flights');
        setDirectlyFetchedFlights(data);
      } catch (error) {
        console.error('Initial direct fetch failed:', error);
      }
    };
    
    fetchFlights();
  }, []);

  // Retry loading data if there was an error
  useEffect(() => {
    if (error) {
      // Log the error for debugging
      console.error('Flight data fetch error detected:', error);
      
      // Try direct fetch as a fallback
      const fetchDirectly = async () => {
        try {
          console.log('Attempting direct fetch of flight data...');
          const response = await fetch('http://localhost:5000/api/flights');
          
          if (!response.ok) {
            throw new Error(`API responded with status: ${response.status}`);
          }
          
          const data = await response.json();
          console.log('Direct fetch succeeded with', data.length, 'flights');
          setDirectlyFetchedFlights(data);
        } catch (directFetchError) {
          console.error('Direct fetch also failed:', directFetchError);
          // Wait and retry the original query
          setTimeout(() => {
            console.log('Attempting to refetch flight data via query...');
            refetch();
          }, 3000);
        }
      };
      
      fetchDirectly();
    }
  }, [error, refetch]);

  const handleFilterClick = (filter: string) => {
    setSelectedFilter(filter === selectedFilter ? "" : filter);
  };

  // Find the best card for a flight (lowest discounted price)
  const getBestCardForFlight = (flight: Flight) => {
    const benefits = flight.cardBenefits as unknown as CardBenefits;
    if (!benefits.cards || benefits.cards.length === 0) return null;
    
    return benefits.cards.reduce((best, current) => 
      current.discountedPrice < best.discountedPrice ? current : best
    );
  };

  // Calculate savings amount
  const calculateSavings = (flight: Flight, card: CardBenefit) => {
    return flight.cashPrice - card.discountedPrice;
  };

  // Get savings percentage
  const getSavingsPercentage = (flight: Flight, card: CardBenefit) => {
    return Math.round((calculateSavings(flight, card) / flight.cashPrice) * 100);
  };

  // Use directly fetched data if available and query data is not
  const displayFlights = directlyFetchedFlights || flights || [];

  // Check if we have any flights to display, regardless of the source
  const hasFlights = displayFlights && (displayFlights as Flight[]).length > 0;

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

  // If there's an error
  if (error) {
    return (
      <div className="h-full p-8 flex flex-col items-center justify-center">
        <div className="text-center mb-6">
          <svg className="mx-auto h-12 w-12 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <h3 className="mt-2 text-lg font-medium text-gray-900">Unable to load flights</h3>
          <p className="mt-1 text-sm text-gray-500">We're having trouble connecting to the flight service.</p>
        </div>
        <Button onClick={() => refetch()} className="bg-[#1A1F71]">
          Try Again
        </Button>
      </div>
    );
  }

  // If there's no data even though it's not loading
  if (!isLoading && (!displayFlights || (displayFlights as Flight[]).length === 0)) {
    return (
      <div className="h-full p-8 flex flex-col items-center justify-center">
        <div className="text-center mb-6">
          <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
          <h3 className="mt-2 text-lg font-medium text-gray-900">No Flights Found</h3>
          <p className="mt-1 text-sm text-gray-500">Try adjusting your search criteria or check back later.</p>
        </div>
        <Button onClick={() => refetch()} className="bg-[#1A1F71]">
          Refresh Flights
        </Button>
      </div>
    );
  }

  return (
    <div className="h-full">
      <div className="bg-[#00A4E4] p-4 text-white">
        <div className="flex justify-between items-center">
          <h2 className="font-sf-pro font-semibold">Flight Search</h2>
          <div className="text-xs bg-white text-[#00A4E4] px-2 py-1 rounded-full">
            Using HDFC Infinia Points
          </div>
        </div>
        <p className="text-sm opacity-80">Mumbai to Dubai • May 15-22, 2023 • 1 Traveler</p>
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
            Indian Card Partners
          </Button>
        </div>
        
        {/* Results Header */}
        <div className="flex justify-between items-center mb-4">
          <h3 className="font-sf-pro font-medium">Best Options for Your Indian Premium Cards</h3>
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
        
        {/* Loading state */}
        {isLoading && (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-48 w-full" />
            ))}
          </div>
        )}
        
        {/* Error state */}
        {error && (
          <div className="p-8 flex flex-col items-center justify-center">
            <div className="text-center mb-6">
              <svg className="mx-auto h-12 w-12 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <h3 className="mt-2 text-lg font-medium text-gray-900">Unable to load flights</h3>
              <p className="mt-1 text-sm text-gray-500">We're having trouble connecting to the flight service.</p>
            </div>
            <Button onClick={() => refetch()} className="bg-[#1A1F71]">
              Try Again
            </Button>
          </div>
        )}
        
        {/* Empty state */}
        {!isLoading && !error && (!displayFlights || displayFlights.length === 0) && (
          <div className="p-8 flex flex-col items-center justify-center">
            <div className="text-center mb-6">
              <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              <h3 className="mt-2 text-lg font-medium text-gray-900">No Flights Found</h3>
              <p className="mt-1 text-sm text-gray-500">Try adjusting your search criteria or check back later.</p>
            </div>
            <Button onClick={() => refetch()} className="bg-[#1A1F71]">
              Refresh Flights
            </Button>
          </div>
        )}
        
        {/* Flight Results - Only show when not loading and we have data */}
        {!isLoading && !error && displayFlights && displayFlights.length > 0 && (
          <div className="space-y-4 max-h-[calc(100vh-20rem)] overflow-y-auto scrollbar-thin">
            {displayFlights.map((flight) => {
              const benefits = flight.cardBenefits as unknown as CardBenefits;
              const bestCard = getBestCardForFlight(flight);
              
              return (
                <div key={flight.id} className="border rounded-lg p-4 hover:shadow-md transition cursor-pointer">
                  <div className="flex justify-between items-center mb-3">
                    <div className="flex items-center">
                      <div className="w-8 h-8 mr-2 flex items-center justify-center bg-blue-50 rounded-full">
                        <span className="font-bold text-blue-700">{flight.airline.substring(0, 2)}</span>
                      </div>
                      <span className="font-medium">{flight.airline}</span>
                    </div>
                    <div>
                      {flight.isNonstop && (
                        <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full">Nonstop</span>
                      )}
                      {bestCard && (
                        <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full ml-2">
                          Save {getSavingsPercentage(flight, bestCard)}%
                        </span>
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
                        {bestCard && (
                          <>
                            <p className="text-xs font-semibold text-green-600">₹{bestCard.discountedPrice.toLocaleString()}</p>
                            <p className="text-xs text-green-600">Save ₹{calculateSavings(flight, bestCard).toLocaleString()}</p>
                          </>
                        )}
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
                    {/* General Benefits */}
                    <div className="mb-2">
                      <p className="text-xs text-gray-500 mb-1">General Benefits:</p>
                      <div className="flex flex-wrap gap-1">
                        {benefits.general.map((benefit, index) => (
                          <Badge key={index} variant="outline" className="text-xs bg-gray-50">
                            {benefit}
                          </Badge>
                        ))}
                      </div>
                    </div>
                    
                    {/* Card-specific benefits */}
                    <div className="mb-3">
                      <Tabs defaultValue={benefits.cards && benefits.cards.length > 0 ? benefits.cards[0].cardName : "HDFC Infinia"} className="w-full" onValueChange={setSelectedCardTab}>
                        <TabsList className="w-full flex mb-2">
                          {benefits.cards && benefits.cards.map((card, index) => (
                            <TabsTrigger
                              key={index}
                              value={card.cardName}
                              className="flex-1 text-xs"
                            >
                              {card.cardName}
                            </TabsTrigger>
                          ))}
                        </TabsList>
                        
                        {benefits.cards && benefits.cards.map((card, index) => (
                          <TabsContent key={index} value={card.cardName} className="mt-0">
                            <div className="bg-blue-50 p-2 rounded-md">
                              <div className="flex justify-between mb-2">
                                <p className="text-sm font-semibold text-blue-800">{card.cardName} Benefits</p>
                                <p className="text-sm font-bold text-green-600">₹{card.discountedPrice.toLocaleString()}</p>
                              </div>
                              <ul className="space-y-1">
                                {card.benefits.map((benefit, i) => (
                                  <li key={i} className="text-xs flex items-start">
                                    <svg className="w-3 h-3 text-green-600 mr-1 mt-0.5" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"></path>
                                    </svg>
                                    {benefit}
                                  </li>
                                ))}
                              </ul>
                            </div>
                          </TabsContent>
                        ))}
                      </Tabs>
                    </div>
                    
                    <div className="flex justify-end">
                      <Button className="text-sm bg-[#1A1F71] text-white px-4 py-1 rounded hover:bg-[#141A5E] transition">
                        Book with {benefits.cards && benefits.cards.length > 0 ? (selectedCardTab === "all" ? benefits.cards[0].cardName : selectedCardTab) : "HDFC Infinia"}
                      </Button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
