import React, { useState, useEffect } from 'react';
import { Hotel as HotelType } from '@shared/schema';
import { useLocation } from 'wouter';
import { Button } from "@/components/ui/button";
import { Hotel, MapPin, Calendar, Star, CreditCard, CheckCircle } from 'lucide-react';

// Explicitly define a type that includes the benefits array
interface ExtendedHotel extends HotelType {
  benefits: string[];
}

export default function SimpleHotelInterface() {
  const [hotels, setHotels] = useState<ExtendedHotel[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [selectedHotelId, setSelectedHotelId] = useState<string | null>(null);
  const [location] = useLocation();

  useEffect(() => {
    const fetchHotels = async () => {
      try {
        const response = await fetch('/api/hotels');
        
        if (!response.ok) {
          throw new Error(`API responded with status: ${response.status}`);
        }
        
        const data = await response.json();
        console.log('Hotel data:', data);
        // Cast the data to the extended type
        setHotels(data as ExtendedHotel[]);
        setIsLoading(false);
      } catch (err) {
        console.error('Error fetching hotels:', err);
        setError(err instanceof Error ? err : new Error('Unknown error'));
        setIsLoading(false);
      }
    };
    
    fetchHotels();

    // Extract selected hotel ID from URL if present
    if (location.includes('?')) {
      const params = new URLSearchParams(location.split('?')[1]);
      const selected = params.get('selected');
      if (selected) {
        setSelectedHotelId(selected);
      }
    }
  }, [location]);

  // Function to render star rating
  const renderStars = (rating: number = 0) => {
    return Array(5).fill(0).map((_, i) => (
      <Star 
        key={i} 
        className={`h-4 w-4 ${i < rating ? 'text-amber-400 fill-amber-400' : 'text-gray-300'}`} 
      />
    ));
  };

  if (isLoading) {
    return (
      <div className="p-8 text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-700 mx-auto"></div>
        <p className="mt-4 text-gray-600">Loading hotels...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8 text-center">
        <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 rounded">
          <p>Unable to load hotels. Please try again later.</p>
          <p className="text-sm">{error.message}</p>
        </div>
      </div>
    );
  }

  if (hotels.length === 0) {
    return (
      <div className="p-8 text-center">
        <Hotel className="h-12 w-12 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-700 mb-2">No Hotels Found</h3>
        <p className="text-gray-500">
          No hotels are currently available. Please try different search criteria.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white">
      <div className="bg-blue-50 p-4 border-b">
        <div className="flex justify-between items-center">
          <h2 className="text-lg font-medium text-blue-900">
            Hotel Search
          </h2>
          <div className="text-sm text-blue-600 bg-white px-3 py-1 rounded-full border border-blue-200">
            Using HDFC Infinia Points
          </div>
        </div>
        <p className="text-sm text-gray-600 mt-1">Dubai • May 15-22, 2023 • 1 Guest</p>
      </div>

      <div className="p-4 border-b bg-amber-50">
        <h3 className="font-medium mb-2">Best Options for Your Indian Premium Cards</h3>
        <div className="flex flex-wrap gap-2">
          <div className="bg-white text-xs px-2 py-1 rounded border">
            <span className="flex items-center">
              <span className="w-3 h-3 rounded-full bg-[#1A1F71] mr-1"></span>
              HDFC Infinia: 10X reward points
            </span>
          </div>
          <div className="bg-white text-xs px-2 py-1 rounded border">
            <span className="flex items-center">
              <span className="w-3 h-3 rounded-full bg-amber-500 mr-1"></span>
              ICICI Emeralde: 12% discount
            </span>
          </div>
          <div className="bg-white text-xs px-2 py-1 rounded border">
            <span className="flex items-center">
              <span className="w-3 h-3 rounded-full bg-blue-500 mr-1"></span>
              SBI Elite: Free airport transfers
            </span>
          </div>
        </div>
      </div>

      <div className="divide-y">
        {hotels.map((hotel, index) => (
          <div 
            key={hotel.id || `hotel-${index}`}
            className={`p-4 hover:bg-gray-50 transition-colors ${selectedHotelId === (hotel.id ? hotel.id.toString() : '') ? 'bg-blue-50 border-l-4 border-blue-500' : ''}`}
          >
            <div className="flex flex-col md:flex-row gap-4">
              <div className="w-full md:w-1/4">
                <div className="relative aspect-video rounded-lg overflow-hidden bg-gray-200">
                  {hotel.imageUrl && (
                    <img 
                      src={hotel.imageUrl} 
                      alt={hotel.name} 
                      className="w-full h-full object-cover"
                    />
                  )}
                </div>
              </div>
              
              <div className="flex-1">
                <h3 className="font-medium text-lg">{hotel.name}</h3>
                <div className="flex items-center gap-1 mb-2">
                  {renderStars(hotel.rating)}
                  <span className="text-xs text-gray-500 ml-1">({hotel.rating || 0}/5)</span>
                </div>
                
                <div className="flex items-center text-sm text-gray-600 mb-2">
                  <MapPin className="h-4 w-4 mr-1" />
                  {hotel.location || 'Location not specified'}
                </div>
                
                {hotel.benefits && hotel.benefits.length > 0 && (
                  <div className="mt-3">
                    <h4 className="text-sm font-medium mb-1">Benefits:</h4>
                    <ul className="space-y-1">
                      {hotel.benefits.map((benefit, index) => (
                        <li key={index} className="text-sm flex items-start">
                          <CheckCircle className="h-4 w-4 text-green-500 mr-1 flex-shrink-0 mt-0.5" />
                          <span className="text-gray-700">{benefit}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {hotel.cardExclusiveOffer && (
                  <div className="mt-3 bg-blue-50 p-2 rounded-md inline-block">
                    <p className="text-sm text-blue-800 font-medium">
                      <CreditCard className="h-4 w-4 inline mr-1" />
                      {hotel.cardExclusiveOffer}
                    </p>
                  </div>
                )}
              </div>
              
              <div className="w-full md:w-1/4 flex flex-col items-end justify-between">
                <div className="text-right">
                  {hotel.pointsEarned !== undefined && (
                    <div className="text-blue-600 font-medium">
                      {hotel.pointsEarned.toLocaleString()} points earned
                    </div>
                  )}
                  <div className="text-lg font-bold">
                    ₹{(hotel.pricePerNight || 0).toLocaleString()}/night
                  </div>
                  <div className="text-sm text-gray-500">
                    ₹{(hotel.totalPrice || 0).toLocaleString()} total
                  </div>
                </div>
                
                <Button className="mt-3 bg-[#1A1F71]">
                  Book Hotel
                </Button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
} 