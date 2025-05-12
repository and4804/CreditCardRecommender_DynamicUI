import React, { useState, useEffect } from 'react';
import { Flight } from '@shared/schema';
import { Button } from "@/components/ui/button";

// Simplified flight card component
const FlightCard = ({ flight }: { flight: Flight }) => {
  const cardBenefits = flight.cardBenefits as any;
  
  return (
    <div className="border rounded-lg p-4 hover:shadow-md transition mb-4 bg-white">
      <div className="flex justify-between items-center mb-3">
        <div className="flex items-center">
          <div className="w-8 h-8 mr-2 flex items-center justify-center bg-blue-50 rounded-full">
            <span className="font-bold text-blue-700">{flight.airline.substring(0, 2)}</span>
          </div>
          <span className="font-medium">{flight.airline}</span>
        </div>
        {flight.isNonstop && (
          <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full">Nonstop</span>
        )}
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
                <p className="text-xs text-center text-gray-500 mt-4">{flight.duration}</p>
              </div>
            </div>
            <div className="text-center">
              <p className="font-semibold">{flight.arrivalTime}</p>
              <p className="text-xs text-gray-500">{flight.arrivalAirport}</p>
            </div>
          </div>
        </div>
        
        <div className="ml-6 text-right">
          <p className="font-semibold text-blue-500">{flight.pointsRequired.toLocaleString()} points</p>
          <p className="text-xs text-gray-500">₹{flight.cashPrice.toLocaleString()}</p>
          <div className="flex items-center justify-end mt-1">
            {Array.from({ length: 5 }).map((_, i) => (
              <svg 
                key={i}
                xmlns="http://www.w3.org/2000/svg" 
                viewBox="0 0 24 24" 
                fill={i < flight.rating ? "#FFB700" : "none"}
                stroke={i >= flight.rating ? "#FFB700" : "none"}
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
        <div className="mb-2">
          <p className="text-xs text-gray-500 mb-1">Card Benefits:</p>
          <div>
            {cardBenefits?.cards && cardBenefits.cards[0]?.benefits && (
              <ul className="text-xs text-gray-700">
                {cardBenefits.cards[0].benefits.map((benefit: string, i: number) => (
                  <li key={i} className="flex items-start mb-1">
                    <svg className="w-3 h-3 text-green-600 mr-1 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"></path>
                    </svg>
                    {benefit}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
        <div className="flex justify-end">
          <Button className="text-sm bg-blue-800 text-white">
            Book Flight
          </Button>
        </div>
      </div>
    </div>
  );
};

// Main flight interface component
export default function SimpleFlightInterface() {
  const [flights, setFlights] = useState<Flight[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const fetchFlights = async () => {
      try {
        console.log('Fetching flights...');
        const response = await fetch('http://localhost:5000/api/flights');
        
        if (!response.ok) {
          throw new Error(`API responded with status: ${response.status}`);
        }
        
        const data = await response.json();
        console.log('Fetched', data.length, 'flights');
        setFlights(data);
        setLoading(false);
      } catch (err) {
        console.error('Error fetching flights:', err);
        setError(err instanceof Error ? err : new Error('Unknown error'));
        setLoading(false);
      }
    };
    
    fetchFlights();
  }, []);

  if (loading) {
    return (
      <div className="p-8">
        <div className="bg-blue-500 p-4 text-white rounded-t-lg">
          <h2 className="font-semibold">Flight Search</h2>
          <p className="text-sm">Mumbai to Dubai • May 15-22, 2023</p>
        </div>
        <div className="p-4 border border-t-0 rounded-b-lg">
          <p className="text-center">Loading flights...</p>
          <div className="mt-4 space-y-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="animate-pulse">
                <div className="h-32 bg-gray-200 rounded-lg"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8">
        <div className="bg-blue-500 p-4 text-white rounded-t-lg">
          <h2 className="font-semibold">Flight Search</h2>
          <p className="text-sm">Mumbai to Dubai • May 15-22, 2023</p>
        </div>
        <div className="p-8 border border-t-0 rounded-b-lg text-center">
          <div className="text-red-500 mb-4">
            <svg className="w-12 h-12 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h3 className="text-lg font-medium">Error Loading Flights</h3>
          <p className="text-gray-600 mt-2">{error.message}</p>
          <Button 
            className="mt-4 bg-blue-500" 
            onClick={() => window.location.reload()}
          >
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  if (flights.length === 0) {
    return (
      <div className="p-8">
        <div className="bg-blue-500 p-4 text-white rounded-t-lg">
          <h2 className="font-semibold">Flight Search</h2>
          <p className="text-sm">Mumbai to Dubai • May 15-22, 2023</p>
        </div>
        <div className="p-8 border border-t-0 rounded-b-lg text-center">
          <h3 className="text-lg font-medium">No Flights Found</h3>
          <p className="text-gray-600 mt-2">Try adjusting your search criteria or check back later.</p>
          <Button 
            className="mt-4 bg-blue-500" 
            onClick={() => window.location.reload()}
          >
            Refresh
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="bg-blue-500 p-4 text-white rounded-t-lg">
        <h2 className="font-semibold">Flight Search</h2>
        <p className="text-sm">Mumbai to Dubai • May 15-22, 2023</p>
        <div className="text-xs inline-block bg-white text-blue-500 px-2 py-1 rounded-full mt-2">
          Using HDFC Infinia Points
        </div>
      </div>
      
      <div className="p-4 border border-t-0 rounded-b-lg bg-gray-50">
        <h3 className="font-medium mb-4">Best Options for Your Indian Premium Cards</h3>
        <div className="space-y-4">
          {flights.map(flight => (
            <FlightCard key={flight.id} flight={flight} />
          ))}
        </div>
      </div>
    </div>
  );
} 