import React, { useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { useInterface } from '@/lib/contexts/interface-context';
import { useChat } from '@/lib/contexts/chat-context';
import { useToast } from '@/hooks/use-toast';

// Component to show prompt to view shopping products in the chat
export function ChatShoppingRecommendations() {
  const { setActiveInterface } = useInterface();
  const { messages } = useChat();
  const { toast } = useToast();

  // Check if we should show shopping recommendations
  const shouldShowRecommendations = () => {
    // Get the last few messages
    const recentMessages = messages.slice(-5);
    
    // Look for shopping-related intents in recent messages
    return recentMessages.some(msg => {
      const content = msg.content.toLowerCase();
      return (content.includes('shop') || 
              content.includes('buy') || 
              content.includes('purchase') ||
              content.includes('phone') ||
              content.includes('smartphone') ||
              content.includes('gadget') ||
              content.includes('electronics') ||
              content.includes('price')) &&
             (content.includes('find') || 
              content.includes('search') ||
              content.includes('looking for') ||
              content.includes('best deal') ||
              content.includes('discount'));
    });
  };

  // Navigate to the shopping page
  const viewProducts = () => {
    // Switch the interface to show the shopping panel
    setActiveInterface('shopping');
    
    // Show a toast to direct user's attention to the right panel
    toast({
      title: "Shopping Options Available",
      description: "Check out personalized product offers on the right →",
      duration: 5000,
    });
  };

  if (!shouldShowRecommendations()) {
    return null;
  }

  return (
    <div className="mt-4 mb-2 bg-blue-50 rounded-lg p-3 border border-blue-200">
      <h3 className="text-sm font-medium text-blue-800 mb-2">Shopping Deals Available</h3>
      <p className="text-xs text-gray-700 mb-3">
        I can help you find the best deals on smartphones with your credit card benefits.
      </p>
      <Button 
        variant="default" 
        size="sm"
        className="w-full text-xs bg-blue-600 text-white"
        onClick={viewProducts}
      >
        View Shopping Deals
      </Button>
    </div>
  );
} 