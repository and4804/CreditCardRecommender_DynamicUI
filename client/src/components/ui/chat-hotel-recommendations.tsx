import React, { useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { useInterface } from '@/lib/contexts/interface-context';
import { useChat } from '@/lib/contexts/chat-context';
import { useToast } from '@/hooks/use-toast';

// Component to show prompt to view hotels in the chat
export function ChatHotelRecommendations() {
  const { setActiveInterface } = useInterface();
  const { messages } = useChat();
  const { toast } = useToast();

  // Check if we should show hotel recommendations
  const shouldShowRecommendations = () => {
    // Get the last few messages
    const recentMessages = messages.slice(-5);
    
    // Look for hotel booking intent in recent messages
    return recentMessages.some(msg => {
      const content = msg.content.toLowerCase();
      return (content.includes('hotel') || 
              content.includes('accommodation') || 
              content.includes('stay') ||
              content.includes('room')) &&
             (content.includes('book') || 
              content.includes('find') || 
              content.includes('search') ||
              content.includes('looking for'));
    });
  };

  // Navigate to the hotels page
  const viewHotels = () => {
    // Switch the interface to show the hotel panel
    setActiveInterface('hotel');
    
    // Show a toast to direct user's attention to the right panel
    toast({
      title: "Hotel Options Available",
      description: "Check out your personalized hotel options on the right →",
      duration: 5000,
    });
  };

  if (!shouldShowRecommendations()) {
    return null;
  }

  return (
    <div className="mt-4 mb-2 bg-blue-50 rounded-lg p-3 border border-blue-200">
      <h3 className="text-sm font-medium text-blue-800 mb-2">Hotel Information Available</h3>
      <p className="text-xs text-gray-700 mb-3">
        I can help you find the perfect hotel for your stay with your credit card benefits.
      </p>
      <Button 
        variant="default" 
        size="sm"
        className="w-full text-xs bg-blue-600 text-white"
        onClick={viewHotels}
      >
        View Hotel Options
      </Button>
    </div>
  );
} 