import React, { useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { useInterface } from '@/lib/contexts/interface-context';
import { useChat } from '@/lib/contexts/chat-context';
import { useFlights } from '@/lib/contexts/flight-context';
import { useToast } from '@/hooks/use-toast';

// Component to show prompt to view flights in the chat
export function ChatFlightRecommendations() {
  const { setActiveInterface } = useInterface();
  const { messages } = useChat();
  const { loadFlights } = useFlights();
  const { toast } = useToast();

  // Check if we should show flight recommendations
  const shouldShowRecommendations = () => {
    // Get the last few messages
    const recentMessages = messages.slice(-5);
    
    // Look for flight booking intent in recent messages
    return recentMessages.some(msg => {
      const content = msg.content.toLowerCase();
      return (content.includes('flight') || 
              content.includes('travel') || 
              content.includes('airport')) &&
             (content.includes('book') || 
              content.includes('find') || 
              content.includes('search') ||
              content.includes('looking for'));
    });
  };

  // When component renders or messages change, load flights if needed
  useEffect(() => {
    if (shouldShowRecommendations()) {
      // Preload flight data
      loadFlights();
    }
  }, [messages, loadFlights]);

  // Navigate to the flights page
  const viewFlights = () => {
    // First load flights to ensure data is ready
    loadFlights();
    // Then switch the interface to show the flight panel
    setActiveInterface('flight');
    
    // Show a toast to direct user's attention to the right panel
    toast({
      title: "Flight Options Available",
      description: "Check out your personalized flight options on the right →",
      duration: 5000,
    });
  };

  if (!shouldShowRecommendations()) {
    return null;
  }

  return (
    <div className="mt-4 mb-2 bg-blue-50 rounded-lg p-3 border border-blue-200">
      <h3 className="text-sm font-medium text-blue-800 mb-2">Flight Information Available</h3>
      <p className="text-xs text-gray-700 mb-3">
        I can help you find the perfect flight for your trip with your credit card benefits.
      </p>
      <Button 
        variant="default" 
        size="sm"
        className="w-full text-xs bg-blue-600 text-white"
        onClick={viewFlights}
      >
        View Flight Options
      </Button>
    </div>
  );
} 