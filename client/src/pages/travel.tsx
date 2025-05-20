import { Tab } from "@headlessui/react";
import { useState, useEffect } from "react";
import SimpleFlightInterface from "@/components/ui/flight-interface-simple";
import SimpleHotelInterface from "@/components/ui/hotel-interface-simple";
import { 
  Plane,
  Hotel, 
  CreditCard, 
  MapPin,
  Calendar,
  Users
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";
import { useFlights } from "@/lib/contexts/flight-context";
import { useInterface } from "@/lib/contexts/interface-context";

type TabProps = {
  selected: boolean;
  children: React.ReactNode;
  className?: string;
};

export default function Travel() {
  const [activeTab, setActiveTab] = useState(0);
  const [location] = useLocation();
  const { loadFlights } = useFlights();
  const { activeInterface } = useInterface();
  
  // Extract query parameters from URL
  useEffect(() => {
    // Check if there are query parameters
    if (location.includes('?')) {
      
      const queryParams = new URLSearchParams(location.split('?')[1]);
      const selected = queryParams.get('selected');
      const from = queryParams.get('from');
      const to = queryParams.get('to');
      
      if (selected || from || to) {
        // Force tab to flights
        setActiveTab(0);
        
        // Reload flight data
        loadFlights();
        
        console.log('Travel page loaded with flight selection:', { selected, from, to });
      }
    }
  }, [location, loadFlights]);

  // If interface is not active, render an empty div
  if (activeInterface !== 'flight' && !location.includes('travel')) {
    return <div className="hidden"></div>;
  }

  return (
    <div className="container mx-auto p-4">
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <h1 className="text-2xl font-sf-pro font-bold text-[#1A1F71] mb-2">Travel Smart with CardSavvy</h1>
        <p className="text-gray-600 mb-4">
          Plan your journey and maximize your card benefits with our powerful booking tools.
        </p>
        
        <Tab.Group selectedIndex={activeTab} onChange={setActiveTab}>
          <Tab.List className="flex space-x-1 rounded-xl bg-blue-50 p-1 mb-6">
            <Tab className={({ selected }) =>
              `w-full rounded-lg py-2.5 text-sm font-medium leading-5 
               ${selected 
                 ? 'bg-[#1A1F71] text-white shadow' 
                 : 'text-blue-700 hover:bg-white/[0.12] hover:text-blue-800'
               } transition-all flex items-center justify-center`
            }>
              <Plane className="w-4 h-4 mr-2" />
              Flights
            </Tab>
            <Tab className={({ selected }) =>
              `w-full rounded-lg py-2.5 text-sm font-medium leading-5 
               ${selected 
                 ? 'bg-[#1A1F71] text-white shadow' 
                 : 'text-blue-700 hover:bg-white/[0.12] hover:text-blue-800'
               } transition-all flex items-center justify-center`
            }>
              <Hotel className="w-4 h-4 mr-2" />
              Hotels
            </Tab>
            <Tab className={({ selected }) =>
              `w-full rounded-lg py-2.5 text-sm font-medium leading-5 
               ${selected 
                 ? 'bg-[#1A1F71] text-white shadow' 
                 : 'text-blue-700 hover:bg-white/[0.12] hover:text-blue-800'
               } transition-all flex items-center justify-center`
            }>
              <CreditCard className="w-4 h-4 mr-2" />
              Travel Cards
            </Tab>
          </Tab.List>
          
          <Tab.Panels>
            <Tab.Panel>
              <div className="rounded-xl bg-white p-4 mb-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                  <div className="flex flex-col">
                    <label className="text-sm font-medium text-gray-700 mb-1">Where from?</label>
                    <div className="flex border rounded-md overflow-hidden">
                      <span className="bg-gray-100 p-2 flex items-center">
                        <MapPin className="h-4 w-4 text-gray-500" />
                      </span>
                      <input
                        type="text"
                        placeholder="Mumbai"
                        className="flex-1 p-2 outline-none"
                        value="Mumbai"
                        readOnly
                      />
                    </div>
                  </div>
                  <div className="flex flex-col">
                    <label className="text-sm font-medium text-gray-700 mb-1">Where to?</label>
                    <div className="flex border rounded-md overflow-hidden">
                      <span className="bg-gray-100 p-2 flex items-center">
                        <MapPin className="h-4 w-4 text-gray-500" />
                      </span>
                      <input
                        type="text"
                        placeholder="Dubai"
                        className="flex-1 p-2 outline-none"
                        value="Dubai"
                        readOnly
                      />
                    </div>
                  </div>
                  <div className="flex flex-col">
                    <label className="text-sm font-medium text-gray-700 mb-1">Dates</label>
                    <div className="flex border rounded-md overflow-hidden">
                      <span className="bg-gray-100 p-2 flex items-center">
                        <Calendar className="h-4 w-4 text-gray-500" />
                      </span>
                      <input
                        type="text"
                        placeholder="May 15 - May 22"
                        className="flex-1 p-2 outline-none"
                        value="May 15 - May 22"
                        readOnly
                      />
                    </div>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                  <div className="flex flex-col">
                    <label className="text-sm font-medium text-gray-700 mb-1">Travelers</label>
                    <div className="flex border rounded-md overflow-hidden">
                      <span className="bg-gray-100 p-2 flex items-center">
                        <Users className="h-4 w-4 text-gray-500" />
                      </span>
                      <select className="flex-1 p-2 outline-none">
                        <option>1 Adult</option>
                        <option>2 Adults</option>
                        <option>2 Adults, 1 Child</option>
                      </select>
                    </div>
                  </div>
                  <div className="flex flex-col">
                    <label className="text-sm font-medium text-gray-700 mb-1">Class</label>
                    <div className="flex border rounded-md overflow-hidden">
                      <span className="bg-gray-100 p-2 flex items-center">
                        <CreditCard className="h-4 w-4 text-gray-500" />
                      </span>
                      <select className="flex-1 p-2 outline-none">
                        <option>Economy</option>
                        <option>Premium Economy</option>
                        <option>Business</option>
                        <option>First</option>
                      </select>
                    </div>
                  </div>
                  <div className="flex items-end">
                    <Button className="w-full bg-[#1A1F71]">
                      Search Flights
                    </Button>
                  </div>
                </div>
                
                <div className="bg-blue-50 p-3 rounded-lg mt-2">
                  <h3 className="text-sm font-medium text-blue-800">Premium Card Benefits</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-2 mt-2">
                    <div className="bg-white p-2 rounded text-xs border border-blue-100">
                      <span className="flex items-center font-medium text-blue-900">
                        <span className="w-2 h-2 rounded-full bg-[#1A1F71] mr-1"></span>
                        HDFC Infinia: 5% cashback
                      </span>
                    </div>
                    <div className="bg-white p-2 rounded text-xs border border-blue-100">
                      <span className="flex items-center font-medium text-blue-900">
                        <span className="w-2 h-2 rounded-full bg-amber-500 mr-1"></span>
                        SBI Elite: Free cancellation
                      </span>
                    </div>
                    <div className="bg-white p-2 rounded text-xs border border-blue-100">
                      <span className="flex items-center font-medium text-blue-900">
                        <span className="w-2 h-2 rounded-full bg-blue-500 mr-1"></span>
                        ICICI Emeralde: Lounge access
                      </span>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Flight Results Section */}
              <div className="border rounded-lg shadow-sm overflow-hidden">
                <SimpleFlightInterface />
              </div>
            </Tab.Panel>
            
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
                        value="Dubai"
                        readOnly
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
                        value="May 15 - May 22"
                        readOnly
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
                    <label className="text-sm font-medium text-gray-700 mb-1">Hotel Area</label>
                    <div className="flex border rounded-md overflow-hidden">
                      <span className="bg-gray-100 p-2 flex items-center">
                        <Hotel className="h-4 w-4 text-gray-500" />
                      </span>
                      <select className="flex-1 p-2 outline-none">
                        <option>All Areas</option>
                        <option>Downtown Dubai</option>
                        <option>Jumeirah</option>
                        <option>The Palm</option>
                        <option>Dubai Marina</option>
                      </select>
                    </div>
                  </div>
                  <div className="flex items-end">
                    <Button className="w-full bg-[#1A1F71] text-white">
                      Search Hotels
                    </Button>
                  </div>
                </div>
                
                <div className="bg-amber-50 p-3 rounded-lg mt-2">
                  <h3 className="text-sm font-medium text-amber-800">Premium Card Benefits</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-2 mt-2">
                    <div className="bg-white p-2 rounded text-xs border border-amber-100">
                      <span className="flex items-center font-medium text-amber-900">
                        <span className="w-2 h-2 rounded-full bg-[#1A1F71] mr-1"></span>
                        HDFC Infinia: 10X reward points
                      </span>
                    </div>
                    <div className="bg-white p-2 rounded text-xs border border-amber-100">
                      <span className="flex items-center font-medium text-amber-900">
                        <span className="w-2 h-2 rounded-full bg-amber-500 mr-1"></span>
                        ICICI Emeralde: 12% discount
                      </span>
                    </div>
                    <div className="bg-white p-2 rounded text-xs border border-amber-100">
                      <span className="flex items-center font-medium text-amber-900">
                        <span className="w-2 h-2 rounded-full bg-blue-500 mr-1"></span>
                        SBI Elite: Free airport transfers
                      </span>
                    </div>
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
                <h3 className="font-sf-pro text-xl font-semibold mb-4">Best Travel Credit Cards</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Card 1 */}
                  <div className="border rounded-lg overflow-hidden hover:shadow-md transition">
                    <div className="bg-gradient-to-r from-[#1A1F71] to-[#141A5E] text-white p-4">
                      <h4 className="font-sf-pro font-semibold">HDFC Infinia</h4>
                      <p className="text-sm opacity-80">Premium Travel Card</p>
                    </div>
                    <div className="p-4">
                      <div className="flex justify-between mb-2">
                        <span className="text-sm font-medium">Annual Fee:</span>
                        <span className="text-sm">₹12,500 + GST</span>
                      </div>
                      <div className="flex justify-between mb-2">
                        <span className="text-sm font-medium">Rewards Rate:</span>
                        <span className="text-sm">5-10X on travel</span>
                      </div>
                      <h5 className="font-medium mt-3 mb-2">Key Benefits</h5>
                      <ul className="text-sm space-y-1">
                        <li className="flex items-start">
                          <svg className="h-4 w-4 text-green-500 mr-1 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                          </svg>
                          Complimentary airport lounge access worldwide
                        </li>
                        <li className="flex items-start">
                          <svg className="h-4 w-4 text-green-500 mr-1 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                          </svg>
                          1:1 reward point transfers to airline partners
                        </li>
                        <li className="flex items-start">
                          <svg className="h-4 w-4 text-green-500 mr-1 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                          </svg>
                          Premium hotel benefits and upgrades
                        </li>
                      </ul>
                      <Button className="w-full mt-4 bg-[#1A1F71]">
                        View Details
                      </Button>
                    </div>
                  </div>
                  
                  {/* Card 2 */}
                  <div className="border rounded-lg overflow-hidden hover:shadow-md transition">
                    <div className="bg-gradient-to-r from-[#00A4E4] to-[#0082B6] text-white p-4">
                      <h4 className="font-sf-pro font-semibold">SBI Elite</h4>
                      <p className="text-sm opacity-80">Premium Travel & Lifestyle</p>
                    </div>
                    <div className="p-4">
                      <div className="flex justify-between mb-2">
                        <span className="text-sm font-medium">Annual Fee:</span>
                        <span className="text-sm">₹4,999 + GST</span>
                      </div>
                      <div className="flex justify-between mb-2">
                        <span className="text-sm font-medium">Rewards Rate:</span>
                        <span className="text-sm">4X on dining and travel</span>
                      </div>
                      <h5 className="font-medium mt-3 mb-2">Key Benefits</h5>
                      <ul className="text-sm space-y-1">
                        <li className="flex items-start">
                          <svg className="h-4 w-4 text-green-500 mr-1 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                          </svg>
                          8 complimentary lounge visits per year
                        </li>
                        <li className="flex items-start">
                          <svg className="h-4 w-4 text-green-500 mr-1 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                          </svg>
                          Golf privileges at top courses
                        </li>
                        <li className="flex items-start">
                          <svg className="h-4 w-4 text-green-500 mr-1 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                          </svg>
                          Milestone benefits worth ₹30,000
                        </li>
                      </ul>
                      <Button className="w-full mt-4 bg-[#00A4E4] hover:bg-[#0082B6]">
                        View Details
                      </Button>
                    </div>
                  </div>
                </div>
                
                <div className="mt-6 p-4 bg-gray-50 rounded-lg border">
                  <h4 className="font-sf-pro font-medium mb-3">Why Choose a Premium Travel Card?</h4>
                  <p className="text-sm text-gray-600 mb-3">
                    Premium travel cards offer exceptional value for frequent travelers with benefits like:
                  </p>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-white p-3 rounded border">
                      <h5 className="text-sm font-medium mb-1">Lounge Access</h5>
                      <p className="text-xs text-gray-600">
                        Enjoy comfortable airport lounges worldwide with complimentary food and drinks.
                      </p>
                    </div>
                    <div className="bg-white p-3 rounded border">
                      <h5 className="text-sm font-medium mb-1">Travel Insurance</h5>
                      <p className="text-xs text-gray-600">
                        Comprehensive coverage for trip cancellations, lost luggage, and medical emergencies.
                      </p>
                    </div>
                    <div className="bg-white p-3 rounded border">
                      <h5 className="text-sm font-medium mb-1">Hotel Upgrades</h5>
                      <p className="text-xs text-gray-600">
                        Automatic room upgrades, late checkout, and special amenities at partner hotels.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </Tab.Panel>
          </Tab.Panels>
        </Tab.Group>
      </div>
    </div>
  );
}