import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { CardDisplay } from "@/components/ui/card-display";
import { ChatInterface } from "@/components/ui/chat-interface";
import { FlightInterface } from "@/components/ui/flight-interface";
import { HotelInterface } from "@/components/ui/hotel-interface";
import { ShoppingInterface } from "@/components/ui/shopping-interface";
import { useInterface } from "@/lib/contexts/interface-context";
import { useEffect } from "react";
import { PlaneIcon, HotelIcon, ShoppingBagIcon } from "lucide-react";

export default function Home() {
  const { activeInterface } = useInterface();

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      
      <main className="flex-1">
        <div className="container mx-auto p-4">
          <CardDisplay />
          
          {/* Main Split Interface */}
          <div className="flex flex-col md:flex-row gap-6 mobile-layout">
            {/* Chat Interface */}
            <ChatInterface />
            
            {/* Dynamic Interface Container */}
            <div className="w-full md:w-3/5 rounded-xl shadow-md overflow-hidden bg-white relative">
              {activeInterface === "flight" && <FlightInterface />}
              {activeInterface === "hotel" && <HotelInterface />}
              {activeInterface === "shopping" && <ShoppingInterface />}
              {activeInterface === "welcome" && <WelcomeInterface />}
            </div>
          </div>
        </div>
      </main>
      
      <Footer />
    </div>
  );
}

function WelcomeInterface() {
  return (
    <div className="bg-gradient-to-r from-[#1A1F71] to-[#00A4E4] p-8 h-full flex flex-col items-center justify-center text-white text-center">
      <PlaneIcon className="h-16 w-16 mb-4 text-[#FFB700]" />
      <h2 className="font-sf-pro text-2xl font-bold mb-2">Welcome to CardConcierge</h2>
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
      </div>
    </div>
  );
}
