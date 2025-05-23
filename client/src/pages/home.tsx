import { useEffect } from "react";
import { CardDisplay } from "@/components/ui/card-display";
import { ChatInterface } from "@/components/ui/chat-interface";
import { FlightInterface } from "@/components/ui/flight-interface";
import { ShoppingInterface } from "@/components/ui/shopping-interface";
import { useInterface } from "@/lib/contexts/interface-context";
import { useChat } from "@/lib/contexts/chat-context";
import { PlaneIcon, HotelIcon, ShoppingBagIcon, CreditCard } from "lucide-react";
import { clearChat } from "@/lib/openai";
import Travel from "@/pages/travel";
import Hotels from "@/pages/hotels";
import Shopping from "@/pages/shopping";

export default function Home() {
  const { activeInterface } = useInterface();
  const { startNewChat } = useChat();
  
  // Start a new chat when the page loads
  useEffect(() => {
    // We want to start a new chat on each visit
    const initializeChat = async () => {
      try {
        // First clear the chat explicitly
        await clearChat();
        // Then start a new chat session
        await startNewChat();
      } catch (error) {
        console.error("Failed to start new chat on page load:", error);
      }
    };
    
    initializeChat();
  }, []);

  return (
    <div className="container mx-auto p-4">
      <CardDisplay />
      
      {/* Main Split Interface */}
      <div className="flex flex-col md:flex-row gap-6 mobile-layout">
        {/* Chat Interface */}
        <ChatInterface />
        
        {/* Dynamic Interface Container */}
        <div className="w-full md:w-3/5 rounded-xl shadow-md overflow-hidden bg-white relative">
          {activeInterface === "flight" && <Travel />}
          {activeInterface === "hotel" && <Hotels />}
          {activeInterface === "shopping" && <Shopping />}
          {activeInterface === "welcome" && <WelcomeInterface />}
        </div>
      </div>
    </div>
  );
}

function WelcomeInterface() {
  return (
    <div className="bg-gradient-to-r from-[#1A1F71] to-[#00A4E4] p-8 h-full flex flex-col items-center justify-center text-white text-center">
      <PlaneIcon className="h-16 w-16 mb-4 text-[#FFB700]" />
      <h2 className="font-sf-pro text-2xl font-bold mb-2">Welcome to CardSavvy</h2>
      <p className="text-lg mb-6 max-w-md">Your AI-powered travel assistant for maximizing credit card benefits</p>
      <div className="max-w-lg">
        <p className="mb-4">Ask me anything about:</p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white bg-opacity-10 p-4 rounded-lg">
            <PlaneIcon className="h-8 w-8 mb-2 text-[#FFB700] mx-auto" />
            <h3 className="font-sf-pro font-medium mb-1">Flights</h3>
            <p className="text-sm">Find the best routes with your card benefits</p>
          </div>
          <div className="bg-white bg-opacity-10 p-4 rounded-lg">
            <HotelIcon className="h-8 w-8 mb-2 text-[#FFB700] mx-auto" />
            <h3 className="font-sf-pro font-medium mb-1">Hotels</h3>
            <p className="text-sm">Discover exclusive properties and upgrades</p>
          </div>
          <div className="bg-white bg-opacity-10 p-4 rounded-lg">
            <ShoppingBagIcon className="h-8 w-8 mb-2 text-[#FFB700] mx-auto" />
            <h3 className="font-sf-pro font-medium mb-1">Shopping</h3>
            <p className="text-sm">Maximize discounts and rewards on purchases</p>
          </div>
        </div>
        
        {/* Credit Card Recommendation Button */}
        <div className="mt-8">
          <a 
            href="/credit-advisor" 
            className="inline-flex items-center justify-center px-6 py-3 bg-[#FFB700] hover:bg-[#E5A500] text-[#1A1F71] font-bold rounded-lg shadow-lg transition-colors"
          >
            <CreditCard className="w-5 h-5 mr-2" />
            Recommend me a credit card!
          </a>
        </div>
      </div>
    </div>
  );
}
