import React from 'react';
import { useAuth0 } from '@auth0/auth0-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Link } from 'wouter';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export default function Settings() {
  const { isAuthenticated, isLoading } = useAuth0();

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#1A1F71] mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading your settings...</p>
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
              Please log in to view your settings.
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
    <div className="container max-w-4xl py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Account Settings</h1>
        <p className="text-muted-foreground">Manage your account preferences and settings</p>
      </div>
      
      <Tabs defaultValue="profile">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="profile">Profile</TabsTrigger>
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
          <TabsTrigger value="preferences">Preferences</TabsTrigger>
          <TabsTrigger value="privacy">Privacy</TabsTrigger>
        </TabsList>
        
        <TabsContent value="profile" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Profile Information</CardTitle>
              <CardDescription>
                Update your profile information and personal details.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="firstName">First Name</Label>
                  <Input id="firstName" placeholder="First Name" defaultValue="James" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lastName">Last Name</Label>
                  <Input id="lastName" placeholder="Last Name" defaultValue="Wilson" />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="email">Email Address</Label>
                <Input id="email" type="email" placeholder="Email" defaultValue="james.wilson@example.com" />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="phone">Phone Number</Label>
                <Input id="phone" placeholder="Phone Number" defaultValue="+91 98765 43210" />
              </div>
              
              <div className="pt-4">
                <Button className="bg-[#1A1F71] hover:bg-[#141A5E]">
                  Save Changes
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="notifications" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Notification Settings</CardTitle>
              <CardDescription>
                Configure how and when you receive notifications.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-medium">Email Notifications</h3>
                  <p className="text-sm text-muted-foreground">Receive email updates about your account</p>
                </div>
                <Switch defaultChecked />
              </div>
              
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-medium">Card Recommendations</h3>
                  <p className="text-sm text-muted-foreground">Get notified about new card offers</p>
                </div>
                <Switch defaultChecked />
              </div>
              
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-medium">Travel Deals</h3>
                  <p className="text-sm text-muted-foreground">Special travel deals based on your cards</p>
                </div>
                <Switch defaultChecked />
              </div>
              
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-medium">Shopping Offers</h3>
                  <p className="text-sm text-muted-foreground">Receive notifications about shopping discounts</p>
                </div>
                <Switch defaultChecked />
              </div>
              
              <div className="pt-4">
                <Button className="bg-[#1A1F71] hover:bg-[#141A5E]">
                  Save Preferences
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="preferences" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>User Preferences</CardTitle>
              <CardDescription>
                Customize your experience with CardSavvy.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="currency">Default Currency</Label>
                <Select defaultValue="inr">
                  <SelectTrigger>
                    <SelectValue placeholder="Select currency" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="inr">Indian Rupee (₹)</SelectItem>
                    <SelectItem value="usd">US Dollar ($)</SelectItem>
                    <SelectItem value="eur">Euro (€)</SelectItem>
                    <SelectItem value="gbp">British Pound (£)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="preferredCard">Preferred Credit Card</Label>
                <Select defaultValue="hdfc">
                  <SelectTrigger>
                    <SelectValue placeholder="Select preferred card" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="hdfc">HDFC Infinia</SelectItem>
                    <SelectItem value="icici">ICICI Emeralde</SelectItem>
                    <SelectItem value="sbi">SBI Elite</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-medium">Dark Mode</h3>
                  <p className="text-sm text-muted-foreground">Use dark theme for the interface</p>
                </div>
                <Switch />
              </div>
              
              <div className="pt-4">
                <Button className="bg-[#1A1F71] hover:bg-[#141A5E]">
                  Save Preferences
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="privacy" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Privacy Settings</CardTitle>
              <CardDescription>
                Manage your privacy and data sharing preferences.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-medium">Data Collection</h3>
                  <p className="text-sm text-muted-foreground">Allow us to collect usage data to improve your experience</p>
                </div>
                <Switch defaultChecked />
              </div>
              
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-medium">Personalized Recommendations</h3>
                  <p className="text-sm text-muted-foreground">Enable AI-powered recommendations based on your usage</p>
                </div>
                <Switch defaultChecked />
              </div>
              
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-medium">Marketing Communications</h3>
                  <p className="text-sm text-muted-foreground">Receive promotional emails and offers</p>
                </div>
                <Switch />
              </div>
              
              <div className="pt-4">
                <div className="flex flex-col space-y-2">
                  <Button className="bg-[#1A1F71] hover:bg-[#141A5E]">
                    Save Privacy Settings
                  </Button>
                  <Button variant="outline" className="border-red-300 text-red-500 hover:bg-red-50">
                    Delete Account
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}