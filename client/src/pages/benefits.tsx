import React from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Gift, Coffee, Plane, ShoppingBag, CreditCard, Percent, Shield, Star } from 'lucide-react';

export default function Benefits() {
  return (
    <div className="container max-w-7xl py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Credit Card Benefits</h1>
        <p className="text-gray-500">Discover the exclusive benefits and rewards available with your cards</p>
      </div>

      <Tabs defaultValue="all" className="w-full">
        <TabsList className="grid grid-cols-5 mb-8">
          <TabsTrigger value="all">All Benefits</TabsTrigger>
          <TabsTrigger value="travel">Travel</TabsTrigger>
          <TabsTrigger value="dining">Dining</TabsTrigger>
          <TabsTrigger value="shopping">Shopping</TabsTrigger>
          <TabsTrigger value="premium">Premium</TabsTrigger>
        </TabsList>
        
        <TabsContent value="all" className="space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Travel Benefits */}
            <Card className="border-t-4 border-t-blue-500">
              <CardHeader className="pb-2">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-full bg-blue-100">
                    <Plane className="h-5 w-5 text-blue-600" />
                  </div>
                  <CardTitle className="text-lg">Airport Lounge Access</CardTitle>
                </div>
                <CardDescription>HDFC Infinia, ICICI Emeralde</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600 mb-4">
                  Enjoy complimentary access to 1,000+ airport lounges worldwide with Priority Pass membership.
                </p>
                <div className="flex flex-wrap gap-2 mb-4">
                  <Badge variant="outline" className="bg-gray-100">Complimentary Food</Badge>
                  <Badge variant="outline" className="bg-gray-100">Wifi Access</Badge>
                  <Badge variant="outline" className="bg-gray-100">Shower Facilities</Badge>
                </div>
              </CardContent>
              <CardFooter className="pt-0">
                <Button variant="outline" size="sm" className="w-full">
                  View Details
                </Button>
              </CardFooter>
            </Card>
            
            {/* Dining Benefits */}
            <Card className="border-t-4 border-t-amber-500">
              <CardHeader className="pb-2">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-full bg-amber-100">
                    <Coffee className="h-5 w-5 text-amber-600" />
                  </div>
                  <CardTitle className="text-lg">Dining Privileges</CardTitle>
                </div>
                <CardDescription>SBI Elite, HDFC Infinia</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600 mb-4">
                  Get up to 25% discount at 1,500+ premium restaurants across India with your eligible cards.
                </p>
                <div className="flex flex-wrap gap-2 mb-4">
                  <Badge variant="outline" className="bg-gray-100">Fine Dining</Badge>
                  <Badge variant="outline" className="bg-gray-100">Café Discounts</Badge>
                  <Badge variant="outline" className="bg-gray-100">Weekend Offers</Badge>
                </div>
              </CardContent>
              <CardFooter className="pt-0">
                <Button variant="outline" size="sm" className="w-full">
                  View Details
                </Button>
              </CardFooter>
            </Card>
            
            {/* Shopping Benefits */}
            <Card className="border-t-4 border-t-green-500">
              <CardHeader className="pb-2">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-full bg-green-100">
                    <ShoppingBag className="h-5 w-5 text-green-600" />
                  </div>
                  <CardTitle className="text-lg">Shopping Rewards</CardTitle>
                </div>
                <CardDescription>ICICI Emeralde, Axis Bank Luxury</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600 mb-4">
                  Earn 5X reward points on all your shopping at partner retailers and online stores.
                </p>
                <div className="flex flex-wrap gap-2 mb-4">
                  <Badge variant="outline" className="bg-gray-100">Amazon India</Badge>
                  <Badge variant="outline" className="bg-gray-100">Flipkart</Badge>
                  <Badge variant="outline" className="bg-gray-100">Lifestyle</Badge>
                </div>
              </CardContent>
              <CardFooter className="pt-0">
                <Button variant="outline" size="sm" className="w-full">
                  View Details
                </Button>
              </CardFooter>
            </Card>
            
            {/* Premium Service */}
            <Card className="border-t-4 border-t-purple-500">
              <CardHeader className="pb-2">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-full bg-purple-100">
                    <Star className="h-5 w-5 text-purple-600" />
                  </div>
                  <CardTitle className="text-lg">Concierge Services</CardTitle>
                </div>
                <CardDescription>HDFC Infinia, ICICI Emeralde</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600 mb-4">
                  Access 24/7 concierge services to assist with travel bookings, dining reservations, and more.
                </p>
                <div className="flex flex-wrap gap-2 mb-4">
                  <Badge variant="outline" className="bg-gray-100">24/7 Support</Badge>
                  <Badge variant="outline" className="bg-gray-100">Global Assistance</Badge>
                  <Badge variant="outline" className="bg-gray-100">Personalized</Badge>
                </div>
              </CardContent>
              <CardFooter className="pt-0">
                <Button variant="outline" size="sm" className="w-full">
                  View Details
                </Button>
              </CardFooter>
            </Card>
            
            {/* Insurance Benefits */}
            <Card className="border-t-4 border-t-red-500">
              <CardHeader className="pb-2">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-full bg-red-100">
                    <Shield className="h-5 w-5 text-red-600" />
                  </div>
                  <CardTitle className="text-lg">Travel Insurance</CardTitle>
                </div>
                <CardDescription>SBI Elite, HDFC Infinia, ICICI Emeralde</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600 mb-4">
                  Enjoy comprehensive travel insurance coverage including medical emergencies and trip cancellation.
                </p>
                <div className="flex flex-wrap gap-2 mb-4">
                  <Badge variant="outline" className="bg-gray-100">Medical Coverage</Badge>
                  <Badge variant="outline" className="bg-gray-100">Lost Baggage</Badge>
                  <Badge variant="outline" className="bg-gray-100">Trip Cancellation</Badge>
                </div>
              </CardContent>
              <CardFooter className="pt-0">
                <Button variant="outline" size="sm" className="w-full">
                  View Details
                </Button>
              </CardFooter>
            </Card>
            
            {/* Cashback Benefits */}
            <Card className="border-t-4 border-t-teal-500">
              <CardHeader className="pb-2">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-full bg-teal-100">
                    <Percent className="h-5 w-5 text-teal-600" />
                  </div>
                  <CardTitle className="text-lg">Cashback Rewards</CardTitle>
                </div>
                <CardDescription>SBI Elite, Axis Bank Luxury</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600 mb-4">
                  Earn up to 5% cashback on your fuel, utility bills, and grocery purchases.
                </p>
                <div className="flex flex-wrap gap-2 mb-4">
                  <Badge variant="outline" className="bg-gray-100">Fuel</Badge>
                  <Badge variant="outline" className="bg-gray-100">Utility Bills</Badge>
                  <Badge variant="outline" className="bg-gray-100">Groceries</Badge>
                </div>
              </CardContent>
              <CardFooter className="pt-0">
                <Button variant="outline" size="sm" className="w-full">
                  View Details
                </Button>
              </CardFooter>
            </Card>
          </div>
          
          <div className="bg-[#f8fafc] rounded-lg p-6">
            <h2 className="text-xl font-bold mb-4">How to Maximize Your Benefits</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white p-4 rounded-lg shadow-sm">
                <div className="flex items-center gap-3 mb-3">
                  <div className="flex items-center justify-center w-8 h-8 rounded-full bg-[#1A1F71] text-white font-medium">1</div>
                  <h3 className="font-medium">Choose the Right Card</h3>
                </div>
                <p className="text-sm text-gray-600">
                  Select cards that align with your spending habits and lifestyle needs to maximize rewards.
                </p>
              </div>
              
              <div className="bg-white p-4 rounded-lg shadow-sm">
                <div className="flex items-center gap-3 mb-3">
                  <div className="flex items-center justify-center w-8 h-8 rounded-full bg-[#1A1F71] text-white font-medium">2</div>
                  <h3 className="font-medium">Track Category Bonuses</h3>
                </div>
                <p className="text-sm text-gray-600">
                  Use specific cards for categories where they offer bonus points or higher cashback rates.
                </p>
              </div>
              
              <div className="bg-white p-4 rounded-lg shadow-sm">
                <div className="flex items-center gap-3 mb-3">
                  <div className="flex items-center justify-center w-8 h-8 rounded-full bg-[#1A1F71] text-white font-medium">3</div>
                  <h3 className="font-medium">Redeem Strategically</h3>
                </div>
                <p className="text-sm text-gray-600">
                  Wait for promotions or transfer bonuses to get the most value from your accumulated points.
                </p>
              </div>
            </div>
          </div>
        </TabsContent>
        
        <TabsContent value="travel">
          <div className="min-h-[500px] space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Travel Benefits</CardTitle>
                <CardDescription>
                  Explore exclusive travel perks and privileges available with your premium cards
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="border rounded-lg p-4">
                    <div className="flex items-start gap-3">
                      <div className="p-2 rounded-full bg-blue-100">
                        <Plane className="h-5 w-5 text-blue-600" />
                      </div>
                      <div>
                        <h3 className="font-medium mb-1">Airport Lounge Access</h3>
                        <p className="text-sm text-gray-600 mb-2">
                          Complimentary access to 1,000+ airport lounges worldwide with Priority Pass membership.
                        </p>
                        <p className="text-sm font-medium">Eligible Cards: HDFC Infinia, ICICI Emeralde</p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="border rounded-lg p-4">
                    <div className="flex items-start gap-3">
                      <div className="p-2 rounded-full bg-blue-100">
                        <Gift className="h-5 w-5 text-blue-600" />
                      </div>
                      <div>
                        <h3 className="font-medium mb-1">Travel Insurance</h3>
                        <p className="text-sm text-gray-600 mb-2">
                          Comprehensive travel insurance including medical emergencies, trip cancellation and lost baggage.
                        </p>
                        <p className="text-sm font-medium">Eligible Cards: SBI Elite, HDFC Infinia</p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="border rounded-lg p-4">
                    <div className="flex items-start gap-3">
                      <div className="p-2 rounded-full bg-blue-100">
                        <CreditCard className="h-5 w-5 text-blue-600" />
                      </div>
                      <div>
                        <h3 className="font-medium mb-1">Foreign Currency Transaction</h3>
                        <p className="text-sm text-gray-600 mb-2">
                          Lower foreign currency markup fees (1.5% vs standard 3.5%) on international transactions.
                        </p>
                        <p className="text-sm font-medium">Eligible Cards: ICICI Emeralde, Axis Bank Luxury</p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="border rounded-lg p-4">
                    <div className="flex items-start gap-3">
                      <div className="p-2 rounded-full bg-blue-100">
                        <Star className="h-5 w-5 text-blue-600" />
                      </div>
                      <div>
                        <h3 className="font-medium mb-1">Hotel Benefits</h3>
                        <p className="text-sm text-gray-600 mb-2">
                          Complimentary room upgrades, early check-in, late check-out, and dining credits at partner hotels.
                        </p>
                        <p className="text-sm font-medium">Eligible Cards: HDFC Infinia, SBI Elite</p>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
              <CardFooter>
                <p className="text-sm text-gray-500">
                  Note: Benefits may vary based on card type and issuer policies. Check your specific card terms for details.
                </p>
              </CardFooter>
            </Card>
          </div>
        </TabsContent>
        
        <TabsContent value="dining">
          <div className="min-h-[500px] flex items-center justify-center">
            <div className="text-center">
              <h3 className="text-xl font-bold mb-2">Dining Benefits View</h3>
              <p className="text-gray-500 mb-4">This view is coming soon!</p>
              <Button variant="outline">
                Return to All Benefits
              </Button>
            </div>
          </div>
        </TabsContent>
        
        <TabsContent value="shopping">
          <div className="min-h-[500px] flex items-center justify-center">
            <div className="text-center">
              <h3 className="text-xl font-bold mb-2">Shopping Benefits View</h3>
              <p className="text-gray-500 mb-4">This view is coming soon!</p>
              <Button variant="outline">
                Return to All Benefits
              </Button>
            </div>
          </div>
        </TabsContent>
        
        <TabsContent value="premium">
          <div className="min-h-[500px] flex items-center justify-center">
            <div className="text-center">
              <h3 className="text-xl font-bold mb-2">Premium Benefits View</h3>
              <p className="text-gray-500 mb-4">This view is coming soon!</p>
              <Button variant="outline">
                Return to All Benefits
              </Button>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}