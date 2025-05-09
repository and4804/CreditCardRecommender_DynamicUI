import React, { useState, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { CreditCard as CardType } from '@shared/schema';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { PlusCircle, CreditCard, Zap, Gift, BarChart3 } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { AddCardDialog } from '@/components/ui/add-card-dialog';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';

export default function Cards() {
  const [activeTab, setActiveTab] = useState('all');
  // Use a counter as a refresh key
  const [refreshKey, setRefreshKey] = useState(0);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // Simplified manual refresh function
  const manualRefresh = async () => {
    // Increment the refresh key to force re-render
    setRefreshKey(prev => prev + 1);
    
    // Invalidate and refetch
    await queryClient.invalidateQueries({ queryKey: ['/api/cards'] });
    await refetch();
  };
  
  // This effect runs once when the component first mounts
  useEffect(() => {
    // Use a direct API call to ensure we get fresh data on mount
    const fetchInitialData = async () => {
      try {
        // Direct API call without using the React Query cache
        const response = await apiRequest('GET', '/api/cards');
        const initialCards = await response.json();
        
        // Set the data in the cache directly
        queryClient.setQueryData(['/api/cards'], initialCards);
        queryClient.setQueryData(['/api/cards', refreshKey], initialCards);
        
        console.log('Initial cards loaded:', initialCards.length);
      } catch (error) {
        console.error('Error loading initial cards:', error);
      }
    };
    
    // Execute immediately
    fetchInitialData();
    
    // No interval - it was causing too many refreshes and UI issues
  }, []); // Empty dependency array - run only once on mount
  
  // Enhanced query settings to ensure cards load on initial mount
  const { data: cards, isLoading, refetch } = useQuery<CardType[]>({
    queryKey: ['/api/cards', refreshKey],
    refetchOnWindowFocus: true,
    staleTime: 0, // Always consider data stale to ensure fresh fetches
    refetchOnMount: 'always', // Always refetch when component mounts
    retry: 3, // Retry failed requests up to 3 times
    retryDelay: 1000, // Wait 1 second between retries
    // Very important - this ensures data is always fetched on component mount
    enabled: true,
  });

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#1A1F71] mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading your cards...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container max-w-7xl py-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold">My Credit Cards</h1>
          <p className="text-gray-500">Manage your cards and maximize your benefits</p>
        </div>
        <div className="flex gap-2">
          <Button 
            variant="outline"
            onClick={async () => {
              try {
                // Clear query cache entirely
                queryClient.removeQueries({ queryKey: ['/api/cards'] });
                
                // Direct API call to get fresh data
                const response = await apiRequest('GET', '/api/cards');
                const freshData = await response.json();
                
                // Update cache with fresh data
                queryClient.setQueryData(['/api/cards'], freshData);
                
                // Update UI by incrementing refresh key
                setRefreshKey(prev => prev + 1);
                
                toast({
                  title: "Refreshed",
                  description: `Successfully loaded ${freshData.length} credit cards`,
                });
              } catch (error) {
                console.error("Error refreshing cards:", error);
                toast({
                  title: "Refresh Failed",
                  description: "There was an error refreshing your cards. Please try again.",
                  variant: "destructive"
                });
              }
            }}
            className="mt-4 md:mt-0"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="mr-2 h-4 w-4"
            >
              <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8" />
              <path d="M21 3v5h-5" />
              <path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16" />
              <path d="M3 21v-5h5" />
            </svg>
            Refresh
          </Button>
          <AddCardDialog>
            <Button className="mt-4 md:mt-0 bg-[#1A1F71] hover:bg-[#141A5E]">
              <PlusCircle className="mr-2 h-4 w-4" /> Add New Card
            </Button>
          </AddCardDialog>
        </div>
      </div>

      <Tabs defaultValue="all" value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid grid-cols-4 mb-8">
          <TabsTrigger value="all">All Cards</TabsTrigger>
          <TabsTrigger value="travel">Travel</TabsTrigger>
          <TabsTrigger value="shopping">Shopping</TabsTrigger>
          <TabsTrigger value="rewards">Rewards</TabsTrigger>
        </TabsList>
        
        <TabsContent value="all" className="space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {cards?.map((card) => {
              // Determine appropriate color class
              let colorClass = "";
              if (card.color === "primary") colorClass = "border-t-blue-600";
              else if (card.color === "accent") colorClass = "border-t-cyan-500";
              else if (card.color === "gray") colorClass = "border-t-gray-500";
              else colorClass = "border-t-blue-600"; // Default fallback
              
              return (
                <Card key={card.id} className={`border-t-4 ${colorClass}`}>
                  <CardHeader className="pb-2">
                    <div className="flex justify-between">
                      <CardTitle className="text-lg">{card.cardName}</CardTitle>
                      <div className="flex items-center justify-center w-12 h-8 bg-[#1A1F71] rounded text-white text-xs">
                        {card.issuer.substring(0, 4)}
                      </div>
                    </div>
                    <CardDescription>{card.issuer}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="font-mono text-base mb-2">**** **** **** {card.cardNumber.slice(-4)}</div>
                    <div className="text-sm text-gray-500">Expires: {card.expireDate}</div>
                    
                    <div className="mt-4">
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-sm">Points Balance</span>
                        <span className="font-medium">{card.pointsBalance.toLocaleString()}</span>
                      </div>
                      <Progress value={card.pointsBalance / 100} className="h-2" />
                    </div>
                  </CardContent>
                  <CardFooter className="flex justify-between pt-0">
                    <Button variant="ghost" size="sm" className="text-[#1A1F71]">
                      View Details
                    </Button>
                    <Button variant="outline" size="sm" className="text-[#1A1F71]">
                      Manage
                    </Button>
                  </CardFooter>
                </Card>
              );
            })}
            
            <AddCardDialog>
              <Card className="border-dashed border-2 border-gray-200 bg-gray-50 hover:bg-gray-100 cursor-pointer transition-colors">
                <CardContent className="flex flex-col items-center justify-center h-full py-10">
                  <div className="rounded-full bg-gray-100 p-3 mb-4">
                    <PlusCircle className="h-6 w-6 text-gray-400" />
                  </div>
                  <h3 className="font-medium mb-1">Add a New Card</h3>
                  <p className="text-sm text-gray-500 text-center mb-4">Unlock more rewards and benefits</p>
                  <Button variant="outline" size="sm">
                    Add Card
                  </Button>
                </CardContent>
              </Card>
            </AddCardDialog>
          </div>
          
          <div className="bg-[#f8fafc] rounded-lg p-6">
            <h2 className="text-xl font-bold mb-4">Card Benefits Overview</h2>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-start gap-4">
                    <div className="rounded-full bg-blue-100 p-2">
                      <CreditCard className="h-4 w-4 text-blue-600" />
                    </div>
                    <div>
                      <h3 className="font-medium">Cash Back</h3>
                      <p className="text-2xl font-bold">₹32,450</p>
                      <p className="text-sm text-gray-500">Total earned this year</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-start gap-4">
                    <div className="rounded-full bg-amber-100 p-2">
                      <Zap className="h-4 w-4 text-amber-600" />
                    </div>
                    <div>
                      <h3 className="font-medium">Points</h3>
                      <p className="text-2xl font-bold">145,320</p>
                      <p className="text-sm text-gray-500">Available to redeem</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-start gap-4">
                    <div className="rounded-full bg-purple-100 p-2">
                      <Gift className="h-4 w-4 text-purple-600" />
                    </div>
                    <div>
                      <h3 className="font-medium">Benefits</h3>
                      <p className="text-2xl font-bold">8</p>
                      <p className="text-sm text-gray-500">Special offers available</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-start gap-4">
                    <div className="rounded-full bg-green-100 p-2">
                      <BarChart3 className="h-4 w-4 text-green-600" />
                    </div>
                    <div>
                      <h3 className="font-medium">Savings</h3>
                      <p className="text-2xl font-bold">₹48,750</p>
                      <p className="text-sm text-gray-500">Potential annual savings</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>
        
        <TabsContent value="travel">
          <div className="min-h-[500px] flex items-center justify-center">
            <div className="text-center">
              <h3 className="text-xl font-bold mb-2">Travel Cards View</h3>
              <p className="text-gray-500 mb-4">This view is coming soon!</p>
              <Button variant="outline" onClick={() => setActiveTab('all')}>
                Return to All Cards
              </Button>
            </div>
          </div>
        </TabsContent>
        
        <TabsContent value="shopping">
          <div className="min-h-[500px] flex items-center justify-center">
            <div className="text-center">
              <h3 className="text-xl font-bold mb-2">Shopping Cards View</h3>
              <p className="text-gray-500 mb-4">This view is coming soon!</p>
              <Button variant="outline" onClick={() => setActiveTab('all')}>
                Return to All Cards
              </Button>
            </div>
          </div>
        </TabsContent>
        
        <TabsContent value="rewards">
          <div className="min-h-[500px] flex items-center justify-center">
            <div className="text-center">
              <h3 className="text-xl font-bold mb-2">Rewards Overview</h3>
              <p className="text-gray-500 mb-4">This view is coming soon!</p>
              <Button variant="outline" onClick={() => setActiveTab('all')}>
                Return to All Cards
              </Button>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}