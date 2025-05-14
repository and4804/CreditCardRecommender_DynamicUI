import { Tab } from "@headlessui/react";
import { useState, useEffect } from "react";
import SimpleHotelInterface from "@/components/ui/hotel-interface-simple";
import { 
  Hotel, 
  CreditCard, 
  MapPin,
  Calendar,
  Users,
  Star,
  Wallet
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";
import { useInterface } from "@/lib/contexts/interface-context";

export default function Hotels() {
  const [activeTab, setActiveTab] = useState(0);
  const [location] = useLocation();
  const { activeInterface } = useInterface();
  
  // If interface is not active, render an empty div
  if (activeInterface !== 'hotel' && !location.includes('hotels')) {
    return <div className="hidden"></div>;
  }

  return (
    <div className="container mx-auto p-4">
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <h1 className="text-2xl font-sf-pro font-bold text-[#1A1F71] mb-2">Hotel Smart with CardSavvy</h1>
        <p className="text-gray-600 mb-4">
          Find the perfect accommodation and maximize your card benefits with our hotel search.
        </p>
        
        <Tab.Group selectedIndex={activeTab} onChange={setActiveTab}>
          <Tab.List className="flex space-x-1 rounded-xl bg-blue-50 p-1 mb-6">
            <Tab className={({ selected }) =>
              `w-full rounded-lg py-2.5 text-sm font-medium leading-5 
               ${selected 
                 ? 'bg-[#FFB700] text-white shadow' 
                 : 'text-blue-700 hover:bg-white/[0.12] hover:text-blue-800'
               } transition-all flex items-center justify-center`
            }>
              <Hotel className="w-4 h-4 mr-2" />
              All Hotels
            </Tab>
            <Tab className={({ selected }) =>
              `w-full rounded-lg py-2.5 text-sm font-medium leading-5 
               ${selected 
                 ? 'bg-[#FFB700] text-white shadow' 
                 : 'text-blue-700 hover:bg-white/[0.12] hover:text-blue-800'
               } transition-all flex items-center justify-center`
            }>
              <Star className="w-4 h-4 mr-2" />
              Luxury Collection
            </Tab>
            <Tab className={({ selected }) =>
              `w-full rounded-lg py-2.5 text-sm font-medium leading-5 
               ${selected 
                 ? 'bg-[#FFB700] text-white shadow' 
                 : 'text-blue-700 hover:bg-white/[0.12] hover:text-blue-800'
               } transition-all flex items-center justify-center`
            }>
              <Wallet className="w-4 h-4 mr-2" />
              Best Value
            </Tab>
          </Tab.List>
          
          <Tab.Panels>
            <Tab.Panel>
              <div className="rounded-xl bg-white p-4 mb-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                  <div className="flex flex-col">
                    <label className="text-sm font-medium text-gray-700 mb-1">Destination</label>
                    <div className="flex border rounded-md overflow-hidden">
                      <span className="bg-gray-100 p-2 flex items-center">
                        <MapPin className="h-4 w-4 text-gray-500" />
                      </span>
                      <input
                        type="text"
                        placeholder="Dubai"
                        className="flex-1 p-2 outline-none"
                      />
                    </div>
                  </div>
                  <div className="flex flex-col">
                    <label className="text-sm font-medium text-gray-700 mb-1">Check-in/out</label>
                    <div className="flex border rounded-md overflow-hidden">
                      <span className="bg-gray-100 p-2 flex items-center">
                        <Calendar className="h-4 w-4 text-gray-500" />
                      </span>
                      <input
                        type="text"
                        placeholder="May 15 - May 22"
                        className="flex-1 p-2 outline-none"
                      />
                    </div>
                  </div>
                  <div className="flex flex-col">
                    <label className="text-sm font-medium text-gray-700 mb-1">Guests</label>
                    <div className="flex border rounded-md overflow-hidden">
                      <span className="bg-gray-100 p-2 flex items-center">
                        <Users className="h-4 w-4 text-gray-500" />
                      </span>
                      <select className="flex-1 p-2 outline-none">
                        <option>1 Guest</option>
                        <option>2 Guests</option>
                        <option>3 Guests</option>
                        <option>4 Guests</option>
                      </select>
                    </div>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                  <div className="flex flex-col">
                    <label className="text-sm font-medium text-gray-700 mb-1">Price Range</label>
                    <div className="flex border rounded-md overflow-hidden">
                      <span className="bg-gray-100 p-2 flex items-center">
                        <CreditCard className="h-4 w-4 text-gray-500" />
                      </span>
                      <select className="flex-1 p-2 outline-none">
                        <option>Any price</option>
                        <option>₹0 - ₹20,000 / night</option>
                        <option>₹20,000 - ₹40,000 / night</option>
                        <option>₹40,000+ / night</option>
                      </select>
                    </div>
                  </div>
                  <div className="flex flex-col">
                    <label className="text-sm font-medium text-gray-700 mb-1">Star Rating</label>
                    <div className="flex border rounded-md overflow-hidden">
                      <span className="bg-gray-100 p-2 flex items-center">
                        <Star className="h-4 w-4 text-gray-500" />
                      </span>
                      <select className="flex-1 p-2 outline-none">
                        <option>Any Rating</option>
                        <option>5 Stars</option>
                        <option>4+ Stars</option>
                        <option>3+ Stars</option>
                      </select>
                    </div>
                  </div>
                  <div className="flex items-end">
                    <Button className="w-full bg-[#FFB700] text-white hover:bg-amber-600">
                      Search Hotels
                    </Button>
                  </div>
                </div>
              </div>
              
              {/* Hotel Results Section */}
              <div className="border rounded-lg shadow-sm overflow-hidden">
                <SimpleHotelInterface />
              </div>
            </Tab.Panel>
            
            <Tab.Panel>
              <div className="p-4">
                <h3 className="font-medium text-lg mb-4">Luxury Collection</h3>
                <p className="text-gray-600 mb-6">Exclusive properties with premium amenities and exceptional service.</p>
                <SimpleHotelInterface />
              </div>
            </Tab.Panel>
            
            <Tab.Panel>
              <div className="p-4">
                <h3 className="font-medium text-lg mb-4">Best Value Properties</h3>
                <p className="text-gray-600 mb-6">Great properties with maximum benefits for your credit card points.</p>
                <SimpleHotelInterface />
              </div>
            </Tab.Panel>
          </Tab.Panels>
        </Tab.Group>
      </div>
    </div>
  );
} 