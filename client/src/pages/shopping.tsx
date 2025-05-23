import { Tab } from "@headlessui/react";
import { useState, useEffect } from "react";
import SimpleShoppingInterface from "@/components/ui/shopping-interface-simple";
import { 
  ShoppingBag, 
  CreditCard, 
  Search,
  Smartphone,
  Headphones,
  Laptop,
  Tag,
  Percent
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";
import { useInterface } from "@/lib/contexts/interface-context";

export default function Shopping() {
  const [activeTab, setActiveTab] = useState(0);
  const [location] = useLocation();
  const { activeInterface } = useInterface();
  
  // If interface is not active, render an empty div
  if (activeInterface !== 'shopping' && !location.includes('shopping')) {
    return <div className="hidden"></div>;
  }

  return (
    <div className="container mx-auto p-4">
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <h1 className="text-2xl font-sf-pro font-bold text-[#1A1F71] mb-2">Shop Smart with CardSavvy</h1>
        <p className="text-gray-600 mb-4">
          Discover exclusive deals and maximize your savings with credit card offers.
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
              <Smartphone className="w-4 h-4 mr-2" />
              Smartphones
            </Tab>
            <Tab className={({ selected }) =>
              `w-full rounded-lg py-2.5 text-sm font-medium leading-5 
               ${selected 
                 ? 'bg-[#1A1F71] text-white shadow' 
                 : 'text-blue-700 hover:bg-white/[0.12] hover:text-blue-800'
               } transition-all flex items-center justify-center`
            }>
              <Laptop className="w-4 h-4 mr-2" />
              Electronics
            </Tab>
            <Tab className={({ selected }) =>
              `w-full rounded-lg py-2.5 text-sm font-medium leading-5 
               ${selected 
                 ? 'bg-[#1A1F71] text-white shadow' 
                 : 'text-blue-700 hover:bg-white/[0.12] hover:text-blue-800'
               } transition-all flex items-center justify-center`
            }>
              <Percent className="w-4 h-4 mr-2" />
              Best Offers
            </Tab>
          </Tab.List>
          
          <Tab.Panels>
            <Tab.Panel>
              <div className="rounded-xl bg-white p-4 mb-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                  <div className="flex flex-col col-span-2">
                    <label className="text-sm font-medium text-gray-700 mb-1">Search for products</label>
                    <div className="flex border rounded-md overflow-hidden">
                      <span className="bg-gray-100 p-2 flex items-center">
                        <Search className="h-4 w-4 text-gray-500" />
                      </span>
                      <input
                        type="text"
                        placeholder="Samsung S25 Ultra, iPhone 15..."
                        className="flex-1 p-2 outline-none"
                      />
                    </div>
                  </div>
                  <div className="flex flex-col">
                    <label className="text-sm font-medium text-gray-700 mb-1">Price Range</label>
                    <div className="flex border rounded-md overflow-hidden">
                      <span className="bg-gray-100 p-2 flex items-center">
                        <Tag className="h-4 w-4 text-gray-500" />
                      </span>
                      <select className="flex-1 p-2 outline-none">
                        <option>Any price</option>
                        <option>₹0 - ₹20,000</option>
                        <option>₹20,000 - ₹50,000</option>
                        <option>₹50,000 - ₹100,000</option>
                        <option>₹100,000+</option>
                      </select>
                    </div>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                  <div className="flex flex-col">
                    <label className="text-sm font-medium text-gray-700 mb-1">Brand</label>
                    <div className="flex border rounded-md overflow-hidden">
                      <span className="bg-gray-100 p-2 flex items-center">
                        <ShoppingBag className="h-4 w-4 text-gray-500" />
                      </span>
                      <select className="flex-1 p-2 outline-none">
                        <option>All Brands</option>
                        <option>Samsung</option>
                        <option>Apple</option>
                        <option>OnePlus</option>
                        <option>Xiaomi</option>
                        <option>Vivo</option>
                      </select>
                    </div>
                  </div>
                  <div className="flex flex-col">
                    <label className="text-sm font-medium text-gray-700 mb-1">Card Benefits</label>
                    <div className="flex border rounded-md overflow-hidden">
                      <span className="bg-gray-100 p-2 flex items-center">
                        <CreditCard className="h-4 w-4 text-gray-500" />
                      </span>
                      <select className="flex-1 p-2 outline-none">
                        <option>Any Benefit</option>
                        <option>Cashback</option>
                        <option>No-cost EMI</option>
                        <option>Instant Discount</option>
                        <option>Extended Warranty</option>
                      </select>
                    </div>
                  </div>
                  <div className="flex items-end">
                    <Button className="w-full bg-[#1A1F71]">
                      Search Products
                    </Button>
                  </div>
                </div>
              </div>
              
              {/* Shopping Results Section */}
              <div className="border rounded-lg shadow-sm overflow-hidden">
                <SimpleShoppingInterface />
              </div>
            </Tab.Panel>
            
            <Tab.Panel>
              <div className="p-4">
                <h3 className="font-medium text-lg mb-4">Electronics Deals</h3>
                <p className="text-gray-600 mb-6">Explore the latest deals on laptops, tablets, audio devices and more.</p>
                <SimpleShoppingInterface />
              </div>
            </Tab.Panel>
            
            <Tab.Panel>
              <div className="p-4">
                <h3 className="font-medium text-lg mb-4">Best Credit Card Offers</h3>
                <p className="text-gray-600 mb-6">Exclusive deals with maximum savings for your premium credit cards.</p>
                <SimpleShoppingInterface />
              </div>
            </Tab.Panel>
          </Tab.Panels>
        </Tab.Group>
      </div>
    </div>
  );
}