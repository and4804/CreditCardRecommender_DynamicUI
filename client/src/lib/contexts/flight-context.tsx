import { createContext, useState, useContext, ReactNode, useEffect } from 'react';
import { Flight } from '@shared/schema';
import { useLocation } from 'wouter';
import { useChat } from './chat-context';

type FlightContextType = {
  flights: Flight[];
  isLoading: boolean;
  error: Error | null;
  selectedFlight: Flight | null;
  directBookFlight: (flightId: number) => void;
  loadFlights: () => Promise<void>;
};

const FlightContext = createContext<FlightContextType>({
  flights: [],
  isLoading: true,
  error: null,
  selectedFlight: null,
  directBookFlight: () => {},
  loadFlights: async () => {},
});

export const FlightContextProvider = ({ children }: { children: ReactNode }) => {
  const [flights, setFlights] = useState<Flight[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [selectedFlight, setSelectedFlight] = useState<Flight | null>(null);
  const [, setLocation] = useLocation();
  const { messages } = useChat();
  
  // Load flights data
  const loadFlights = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/flights');
      
      if (!response.ok) {
        throw new Error(`API responded with status: ${response.status}`);
      }
      
      const data = await response.json();
      console.log('Loaded flights data:', data.length, 'flights');
      setFlights(data);
      setError(null);
    } catch (err) {
      console.error('Error loading flights:', err);
      setError(err instanceof Error ? err : new Error('Unknown error loading flights'));
    } finally {
      setIsLoading(false);
    }
  };
  
  // Load flights on component mount
  useEffect(() => {
    loadFlights();
  }, []);
  
  // Book a flight directly from the chat interface
  const directBookFlight = (flightId: number) => {
    const flight = flights.find(f => f.id === flightId);
    if (flight) {
      setSelectedFlight(flight);
      // Navigate to the travel page 
      setLocation(`/travel?selected=${flightId}&from=${flight.departureAirport}&to=${flight.arrivalAirport}`);
    }
  };
  
  // Analyze chat messages for flight booking intent
  useEffect(() => {
    if (messages.length > 0) {
      // Get the latest assistant message
      const lastAssistantMessage = [...messages]
        .reverse()
        .find(msg => msg.role === 'assistant');
      
      if (lastAssistantMessage) {
        // Check if the message contains a flight booking recommendation
        const content = lastAssistantMessage.content.toLowerCase();
        if ((content.includes('flight') || content.includes('air')) && 
            (content.includes('book') || content.includes('recommend'))) {
          // Ensure flights are loaded
          if (flights.length === 0 && !isLoading) {
            loadFlights();
          }
        }
      }
    }
  }, [messages, flights.length, isLoading]);
  
  return (
    <FlightContext.Provider
      value={{
        flights,
        isLoading,
        error,
        selectedFlight,
        directBookFlight,
        loadFlights
      }}
    >
      {children}
    </FlightContext.Provider>
  );
};

export const useFlights = () => useContext(FlightContext); 