import { useState } from "react";
import { Tab } from "@headlessui/react";
import { ShoppingInterface } from "@/components/ui/shopping-interface";
import {
  Search,
  ShoppingBag,
  CreditCard,
  Tag,
  Map,
  ArrowUpRight,
  Check
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type TabProps = {
  selected: boolean;
  children: React.ReactNode;
  className?: string;
};

export default function Shopping() {
  const [searchQuery, setSearchQuery] = useState("");
  
  return (
    <div className="container mx-auto p-4">
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <h1 className="text-2xl font-sf-pro font-bold text-[#1A1F71] mb-2">Smart Shopping with CardSavvy</h1>
        <p className="text-gray-600 mb-4">
          Find the best credit card offers and maximize your rewards at top stores and retailers.
        </p>
        
        <Tab.Group>
          <Tab.List className="flex space-x-1 rounded-xl bg-blue-50 p-1 mb-6">
            <Tab className={({ selected }) =>
              `w-full rounded-lg py-2.5 text-sm font-medium leading-5 
               ${selected 
                 ? 'bg-[#1A1F71] text-white shadow' 
                 : 'text-blue-700 hover:bg-white/[0.12] hover:text-blue-800'
               } transition-all flex items-center justify-center`
            }>
              <ShoppingBag className="w-4 h-4 mr-2" />
              Store Offers
            </Tab>
            <Tab className={({ selected }) =>
              `w-full rounded-lg py-2.5 text-sm font-medium leading-5 
               ${selected 
                 ? 'bg-[#1A1F71] text-white shadow' 
                 : 'text-blue-700 hover:bg-white/[0.12] hover:text-blue-800'
               } transition-all flex items-center justify-center`
            }>
              <CreditCard className="w-4 h-4 mr-2" />
              Card Recommendations
            </Tab>
            <Tab className={({ selected }) =>
              `w-full rounded-lg py-2.5 text-sm font-medium leading-5 
               ${selected 
                 ? 'bg-[#1A1F71] text-white shadow' 
                 : 'text-blue-700 hover:bg-white/[0.12] hover:text-blue-800'
               } transition-all flex items-center justify-center`
            }>
              <Map className="w-4 h-4 mr-2" />
              Shopping Map
            </Tab>
          </Tab.List>
          
          <Tab.Panels>
            <Tab.Panel>
              <div className="rounded-xl bg-white p-4 mb-6">
                <div className="mb-4">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                    <Input
                      type="text"
                      placeholder="Search for products, stores, or card offers..."
                      className="pl-10 pr-4 py-2 w-full"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                  </div>
                </div>
                
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-4">
                  <Button 
                    variant="outline"
                    className="text-xs p-2 rounded-full"
                    onClick={() => setSearchQuery("Electronics")}
                  >
                    Electronics
                  </Button>
                  <Button 
                    variant="outline"
                    className="text-xs p-2 rounded-full"
                    onClick={() => setSearchQuery("Fashion")}
                  >
                    Fashion
                  </Button>
                  <Button 
                    variant="outline"
                    className="text-xs p-2 rounded-full"
                    onClick={() => setSearchQuery("Dining")}
                  >
                    Dining
                  </Button>
                  <Button 
                    variant="outline"
                    className="text-xs p-2 rounded-full"
                    onClick={() => setSearchQuery("Entertainment")}
                  >
                    Entertainment
                  </Button>
                </div>
                
                <div className="flex items-center space-x-2 text-sm text-gray-500 mb-4">
                  <Tag className="h-4 w-4" />
                  <span>Showing card-exclusive offers at top retailers</span>
                </div>
              </div>
              
              {/* Shopping Interface Component */}
              <div className="border rounded-lg shadow-sm overflow-hidden">
                <ShoppingInterface />
              </div>
            </Tab.Panel>
            
            <Tab.Panel>
              <div className="p-4">
                <h3 className="font-sf-pro text-xl font-semibold mb-4">Best Shopping Credit Cards</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {/* Card 1 */}
                  <div className="border rounded-lg overflow-hidden hover:shadow-md transition">
                    <div className="bg-gradient-to-r from-[#1A1F71] to-[#141A5E] text-white p-4">
                      <h4 className="font-sf-pro font-semibold">HDFC Diners Black</h4>
                      <p className="text-sm opacity-80">Premium Shopping Card</p>
                    </div>
                    <div className="p-4">
                      <div className="flex justify-between mb-2">
                        <span className="text-sm font-medium">Annual Fee:</span>
                        <span className="text-sm">₹10,000 + GST</span>
                      </div>
                      <div className="flex justify-between mb-2">
                        <span className="text-sm font-medium">Rewards Rate:</span>
                        <span className="text-sm">10X on shopping</span>
                      </div>
                      <h5 className="font-medium mt-3 mb-2">Shopping Benefits</h5>
                      <ul className="text-sm space-y-1">
                        <li className="flex items-start">
                          <Check className="h-4 w-4 text-green-500 mr-1 mt-0.5" />
                          Amazon vouchers worth ₹5,000 annually
                        </li>
                        <li className="flex items-start">
                          <Check className="h-4 w-4 text-green-500 mr-1 mt-0.5" />
                          Premium brand 1+1 offers
                        </li>
                        <li className="flex items-start">
                          <Check className="h-4 w-4 text-green-500 mr-1 mt-0.5" />
                          Extended warranty protection
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
                      <h4 className="font-sf-pro font-semibold">Flipkart Axis Bank</h4>
                      <p className="text-sm opacity-80">E-Commerce Rewards</p>
                    </div>
                    <div className="p-4">
                      <div className="flex justify-between mb-2">
                        <span className="text-sm font-medium">Annual Fee:</span>
                        <span className="text-sm">₹500 + GST</span>
                      </div>
                      <div className="flex justify-between mb-2">
                        <span className="text-sm font-medium">Rewards Rate:</span>
                        <span className="text-sm">5% on Flipkart/Myntra</span>
                      </div>
                      <h5 className="font-medium mt-3 mb-2">Shopping Benefits</h5>
                      <ul className="text-sm space-y-1">
                        <li className="flex items-start">
                          <Check className="h-4 w-4 text-green-500 mr-1 mt-0.5" />
                          4% unlimited cashback on Flipkart, Myntra
                        </li>
                        <li className="flex items-start">
                          <Check className="h-4 w-4 text-green-500 mr-1 mt-0.5" />
                          1.5% unlimited cashback on all other spends
                        </li>
                        <li className="flex items-start">
                          <Check className="h-4 w-4 text-green-500 mr-1 mt-0.5" />
                          Flipkart Plus membership voucher
                        </li>
                      </ul>
                      <Button className="w-full mt-4 bg-[#00A4E4] hover:bg-[#0082B6]">
                        View Details
                      </Button>
                    </div>
                  </div>
                  
                  {/* Card 3 */}
                  <div className="border rounded-lg overflow-hidden hover:shadow-md transition">
                    <div className="bg-gradient-to-r from-[#FFB700] to-[#FF9500] text-white p-4">
                      <h4 className="font-sf-pro font-semibold">ICICI Amazon Pay</h4>
                      <p className="text-sm opacity-80">E-Commerce Rewards</p>
                    </div>
                    <div className="p-4">
                      <div className="flex justify-between mb-2">
                        <span className="text-sm font-medium">Annual Fee:</span>
                        <span className="text-sm">₹500 + GST</span>
                      </div>
                      <div className="flex justify-between mb-2">
                        <span className="text-sm font-medium">Rewards Rate:</span>
                        <span className="text-sm">5% on Amazon.in</span>
                      </div>
                      <h5 className="font-medium mt-3 mb-2">Shopping Benefits</h5>
                      <ul className="text-sm space-y-1">
                        <li className="flex items-start">
                          <Check className="h-4 w-4 text-green-500 mr-1 mt-0.5" />
                          5% unlimited rewards on Amazon.in
                        </li>
                        <li className="flex items-start">
                          <Check className="h-4 w-4 text-green-500 mr-1 mt-0.5" />
                          2% rewards on Amazon Pay Partner merchants
                        </li>
                        <li className="flex items-start">
                          <Check className="h-4 w-4 text-green-500 mr-1 mt-0.5" />
                          Amazon Prime membership worth ₹1,499
                        </li>
                      </ul>
                      <Button className="w-full mt-4 bg-[#FFB700] hover:bg-[#FF9500]">
                        View Details
                      </Button>
                    </div>
                  </div>
                </div>
                
                <div className="mt-6 p-4 bg-gray-50 rounded-lg border">
                  <h4 className="font-sf-pro font-medium mb-3">Top Shopping Categories</h4>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="bg-white p-3 rounded border hover:shadow-sm transition cursor-pointer">
                      <h5 className="text-sm font-medium mb-1">Electronics</h5>
                      <div className="flex justify-between items-center">
                        <span className="text-xs text-gray-600">Best card: HDFC Diners</span>
                        <ArrowUpRight className="h-3 w-3 text-gray-400" />
                      </div>
                    </div>
                    <div className="bg-white p-3 rounded border hover:shadow-sm transition cursor-pointer">
                      <h5 className="text-sm font-medium mb-1">Fashion</h5>
                      <div className="flex justify-between items-center">
                        <span className="text-xs text-gray-600">Best card: SBI Elite</span>
                        <ArrowUpRight className="h-3 w-3 text-gray-400" />
                      </div>
                    </div>
                    <div className="bg-white p-3 rounded border hover:shadow-sm transition cursor-pointer">
                      <h5 className="text-sm font-medium mb-1">Home Decor</h5>
                      <div className="flex justify-between items-center">
                        <span className="text-xs text-gray-600">Best card: ICICI Amazon</span>
                        <ArrowUpRight className="h-3 w-3 text-gray-400" />
                      </div>
                    </div>
                    <div className="bg-white p-3 rounded border hover:shadow-sm transition cursor-pointer">
                      <h5 className="text-sm font-medium mb-1">Luxury Goods</h5>
                      <div className="flex justify-between items-center">
                        <span className="text-xs text-gray-600">Best card: HDFC Infinia</span>
                        <ArrowUpRight className="h-3 w-3 text-gray-400" />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </Tab.Panel>
            
            <Tab.Panel>
              <div className="p-4">
                <h3 className="font-sf-pro text-xl font-semibold mb-4">Shopping Map</h3>
                
                <div className="bg-blue-50 p-4 rounded-lg mb-4">
                  <p className="text-sm text-blue-800">
                    Our interactive shopping map shows you nearby stores with special card offers. Use your current location or search for a specific area.
                  </p>
                </div>
                
                <div className="bg-white p-4 border rounded-lg mb-4">
                  <div className="flex items-center space-x-2 mb-4">
                    <div className="relative flex-1">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                      <Input
                        type="text"
                        placeholder="Search location (e.g. Mumbai, Bandra)"
                        className="pl-10 pr-4 py-2 w-full"
                      />
                    </div>
                    <Button className="bg-[#1A1F71]">
                      Find Offers
                    </Button>
                  </div>
                  
                  <div className="flex flex-wrap gap-2 mb-4">
                    <Button variant="outline" size="sm" className="text-xs">
                      Electronics
                    </Button>
                    <Button variant="outline" size="sm" className="text-xs">
                      Fashion
                    </Button>
                    <Button variant="outline" size="sm" className="text-xs">
                      Dining
                    </Button>
                    <Button variant="outline" size="sm" className="text-xs">
                      Luxury
                    </Button>
                    <Button variant="outline" size="sm" className="text-xs">
                      Entertainment
                    </Button>
                  </div>
                  
                  {/* Mock Map Interface */}
                  <div className="w-full h-96 bg-gray-100 rounded-lg flex items-center justify-center">
                    <div className="text-center">
                      <Map className="h-12 w-12 text-gray-400 mx-auto mb-2" />
                      <p className="text-gray-500">Shopping map will appear here</p>
                      <p className="text-sm text-gray-400">Search for a location to see nearby card offers</p>
                    </div>
                  </div>
                </div>
                
                <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-white p-4 border rounded-lg">
                    <h4 className="font-medium text-sm mb-2">Nearby Premium Offers</h4>
                    <div className="space-y-3">
                      <div className="flex items-start border-b pb-2">
                        <div className="w-10 h-10 bg-gray-100 rounded flex-shrink-0 mr-3"></div>
                        <div>
                          <h5 className="text-sm font-medium">Croma Electronics</h5>
                          <p className="text-xs text-gray-500">10% cashback with HDFC Diners</p>
                        </div>
                      </div>
                      <div className="flex items-start border-b pb-2">
                        <div className="w-10 h-10 bg-gray-100 rounded flex-shrink-0 mr-3"></div>
                        <div>
                          <h5 className="text-sm font-medium">Reliance Digital</h5>
                          <p className="text-xs text-gray-500">5% instant discount with ICICI</p>
                        </div>
                      </div>
                      <div className="flex items-start">
                        <div className="w-10 h-10 bg-gray-100 rounded flex-shrink-0 mr-3"></div>
                        <div>
                          <h5 className="text-sm font-medium">Apple Store</h5>
                          <p className="text-xs text-gray-500">No-cost EMI with SBI cards</p>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="bg-white p-4 border rounded-lg">
                    <h4 className="font-medium text-sm mb-2">Mall-Specific Offers</h4>
                    <div className="space-y-3">
                      <div className="flex items-start border-b pb-2">
                        <div className="w-10 h-10 bg-gray-100 rounded flex-shrink-0 mr-3"></div>
                        <div>
                          <h5 className="text-sm font-medium">Phoenix Marketcity</h5>
                          <p className="text-xs text-gray-500">Extra 5% off with Amex</p>
                        </div>
                      </div>
                      <div className="flex items-start border-b pb-2">
                        <div className="w-10 h-10 bg-gray-100 rounded flex-shrink-0 mr-3"></div>
                        <div>
                          <h5 className="text-sm font-medium">Inorbit Mall</h5>
                          <p className="text-xs text-gray-500">Exclusive lounges for HDFC Infinia</p>
                        </div>
                      </div>
                      <div className="flex items-start">
                        <div className="w-10 h-10 bg-gray-100 rounded flex-shrink-0 mr-3"></div>
                        <div>
                          <h5 className="text-sm font-medium">DLF Emporio</h5>
                          <p className="text-xs text-gray-500">Valet parking with SBI Elite</p>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="bg-white p-4 border rounded-lg">
                    <h4 className="font-medium text-sm mb-2">Special Event Offers</h4>
                    <div className="space-y-3">
                      <div className="flex items-start border-b pb-2">
                        <div className="w-10 h-10 bg-gray-100 rounded flex-shrink-0 mr-3"></div>
                        <div>
                          <h5 className="text-sm font-medium">Summer Fashion Week</h5>
                          <p className="text-xs text-gray-500">Early access with HDFC</p>
                        </div>
                      </div>
                      <div className="flex items-start border-b pb-2">
                        <div className="w-10 h-10 bg-gray-100 rounded flex-shrink-0 mr-3"></div>
                        <div>
                          <h5 className="text-sm font-medium">Electronics Expo</h5>
                          <p className="text-xs text-gray-500">Buy 1 Get 1 with SBI cards</p>
                        </div>
                      </div>
                      <div className="flex items-start">
                        <div className="w-10 h-10 bg-gray-100 rounded flex-shrink-0 mr-3"></div>
                        <div>
                          <h5 className="text-sm font-medium">Diwali Sale</h5>
                          <p className="text-xs text-gray-500">10X points with ICICI</p>
                        </div>
                      </div>
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