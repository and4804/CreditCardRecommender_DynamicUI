import React from 'react';
import { useAuth0 } from '@auth0/auth0-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Link } from 'wouter';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useQuery } from '@tanstack/react-query';
import { CreditCard } from '@shared/schema';
import { AddCardDialog } from '@/components/ui/add-card-dialog';

export default function Profile() {
  const { user, isAuthenticated, isLoading, logout } = useAuth0();

  const { data: cards } = useQuery<CreditCard[]>({
    queryKey: ['/api/cards'],
    enabled: isAuthenticated,
  });

  const handleLogout = () => {
    logout({ logoutParams: { returnTo: window.location.origin + '/login' } });
  };

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#1A1F71] mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading your profile...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Card className="w-[400px]">
          <CardHeader>
            <CardTitle className="text-center">Authentication Required</CardTitle>
            <CardDescription className="text-center">
              Please log in to view your profile.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex justify-center">
            <Link href="/login">
              <Button className="w-full bg-[#1A1F71] hover:bg-[#141A5E]">
                Go to Login
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container max-w-6xl py-8">
      <div className="flex flex-col md:flex-row gap-8">
        <div className="w-full md:w-1/3">
          <Card>
            <CardHeader>
              <div className="flex justify-center">
                <Avatar className="h-24 w-24">
                  <AvatarImage src={user?.picture} alt={user?.name} />
                  <AvatarFallback>{user?.name?.charAt(0) || 'U'}</AvatarFallback>
                </Avatar>
              </div>
              <CardTitle className="text-center mt-4">{user?.name}</CardTitle>
              <CardDescription className="text-center">{user?.email}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <Button variant="outline" className="w-full" asChild>
                    <Link href="/">Dashboard</Link>
                  </Button>
                </div>
                <div>
                  <Button variant="outline" className="w-full" asChild>
                    <Link href="/settings">Account Settings</Link>
                  </Button>
                </div>
                <Separator />
                <div>
                  <Button variant="outline" className="w-full text-red-500" onClick={handleLogout}>
                    Sign Out
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
        
        <div className="w-full md:w-2/3">
          <Tabs defaultValue="overview">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="cards">My Cards</TabsTrigger>
              <TabsTrigger value="history">Activity History</TabsTrigger>
            </TabsList>
            
            <TabsContent value="overview" className="mt-6">
              <Card>
                <CardHeader>
                  <CardTitle>Your Account Overview</CardTitle>
                  <CardDescription>
                    Here's a summary of your account and recommendations.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium">Your Credit Cards</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold">{cards?.length || 0}</div>
                        <p className="text-xs text-muted-foreground">
                          Premium Indian cards that maximize your benefits
                        </p>
                      </CardContent>
                    </Card>
                    
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium">Points Balance</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold">45,320</div>
                        <p className="text-xs text-muted-foreground">
                          Across all your reward programs
                        </p>
                      </CardContent>
                    </Card>
                    
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium">Recent Savings</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold">₹12,450</div>
                        <p className="text-xs text-muted-foreground">
                          Total savings in the last 3 months
                        </p>
                      </CardContent>
                    </Card>
                    
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium">Upcoming Benefits</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold">3</div>
                        <p className="text-xs text-muted-foreground">
                          Card benefits expiring in 30 days
                        </p>
                      </CardContent>
                    </Card>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="cards" className="mt-6">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <div>
                    <CardTitle>Your Credit Cards</CardTitle>
                    <CardDescription>
                      Manage your linked credit cards and see their benefits.
                    </CardDescription>
                  </div>
                  <AddCardDialog>
                    <Button size="sm" className="bg-[#1A1F71] hover:bg-[#141A5E]">
                      Add Card
                    </Button>
                  </AddCardDialog>
                </CardHeader>
                <CardContent>
                  {cards && cards.length > 0 ? (
                    <div className="space-y-4">
                      {cards.map((card) => (
                        <div key={card.id} className="flex items-center p-4 border rounded-lg">
                          <div className="w-12 h-8 bg-[#1A1F71] rounded mr-4 flex items-center justify-center text-white text-xs">
                            {card.issuer.substring(0, 4)}
                          </div>
                          <div className="flex-1">
                            <h3 className="font-medium">{card.issuer} {card.cardName}</h3>
                            <p className="text-sm text-gray-500">**** **** **** {card.cardNumber.slice(-4)}</p>
                          </div>
                          <Button variant="outline" size="sm">View Details</Button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <p className="text-gray-500 mb-4">You don't have any credit cards linked yet.</p>
                      <AddCardDialog>
                        <Button className="bg-[#1A1F71] hover:bg-[#141A5E]">Add a Credit Card</Button>
                      </AddCardDialog>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="history" className="mt-6">
              <Card>
                <CardHeader>
                  <CardTitle>Activity History</CardTitle>
                  <CardDescription>
                    Your recent activities and recommendations.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="border-l-2 border-[#1A1F71] pl-4 py-2">
                      <div className="text-xs text-gray-500">Today</div>
                      <div className="font-medium">Received new card recommendation</div>
                      <div className="text-sm">HDFC Infinia Card - 10X rewards on dining</div>
                    </div>
                    
                    <div className="border-l-2 border-gray-200 pl-4 py-2">
                      <div className="text-xs text-gray-500">Yesterday</div>
                      <div className="font-medium">Booked flight to Dubai</div>
                      <div className="text-sm">Saved ₹8,500 using ICICI Emeralde</div>
                    </div>
                    
                    <div className="border-l-2 border-gray-200 pl-4 py-2">
                      <div className="text-xs text-gray-500">May 5, 2023</div>
                      <div className="font-medium">Added new credit card</div>
                      <div className="text-sm">SBI Elite Card successfully linked</div>
                    </div>
                    
                    <div className="border-l-2 border-gray-200 pl-4 py-2">
                      <div className="text-xs text-gray-500">May 2, 2023</div>
                      <div className="font-medium">Received cashback</div>
                      <div className="text-sm">₹3,950 credited to your account</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}