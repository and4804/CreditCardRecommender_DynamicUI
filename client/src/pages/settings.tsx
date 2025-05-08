import { useState } from 'react';
import { useAuth0 } from '@auth0/auth0-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { Link } from 'wouter';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';

export default function Settings() {
  const { user, isAuthenticated, isLoading, logout } = useAuth0();
  const { toast } = useToast();
  const [isSaving, setIsSaving] = useState(false);

  // Example settings state
  const [settings, setSettings] = useState({
    notifications: {
      email: true,
      offers: true,
      security: true,
      marketing: false
    },
    preferences: {
      travelAlerts: true,
      newCardOffers: true,
      shoppingDeals: true,
      partnerOffers: false
    },
    accessibility: {
      highContrast: false,
      largeText: false
    }
  });

  const handleNotificationChange = (key: keyof typeof settings.notifications) => {
    setSettings({
      ...settings,
      notifications: {
        ...settings.notifications,
        [key]: !settings.notifications[key]
      }
    });
  };

  const handlePreferenceChange = (key: keyof typeof settings.preferences) => {
    setSettings({
      ...settings,
      preferences: {
        ...settings.preferences,
        [key]: !settings.preferences[key]
      }
    });
  };

  const handleAccessibilityChange = (key: keyof typeof settings.accessibility) => {
    setSettings({
      ...settings,
      accessibility: {
        ...settings.accessibility,
        [key]: !settings.accessibility[key]
      }
    });
  };

  const handleSaveSettings = () => {
    setIsSaving(true);
    // Simulate API call
    setTimeout(() => {
      setIsSaving(false);
      toast({
        title: 'Settings Saved',
        description: 'Your preferences have been updated successfully.',
      });
    }, 1000);
  };

  const handleLogout = () => {
    logout({ logoutParams: { returnTo: window.location.origin + '/login' } });
  };

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
                    <Link href="/profile">My Profile</Link>
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
          <Tabs defaultValue="general">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="general">General</TabsTrigger>
              <TabsTrigger value="notifications">Notifications</TabsTrigger>
              <TabsTrigger value="security">Security</TabsTrigger>
            </TabsList>
            
            <TabsContent value="general" className="mt-6">
              <Card>
                <CardHeader>
                  <CardTitle>Account Settings</CardTitle>
                  <CardDescription>
                    Manage your account information and preferences.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-4">
                    <h3 className="text-lg font-medium">Personal Information</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="name">Full Name</Label>
                        <Input id="name" defaultValue={user?.name || ''} />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="email">Email Address</Label>
                        <Input id="email" type="email" defaultValue={user?.email || ''} disabled />
                        <p className="text-xs text-gray-500">Email cannot be changed</p>
                      </div>
                    </div>
                  </div>
                  
                  <Separator />
                  
                  <div className="space-y-4">
                    <h3 className="text-lg font-medium">Preferences</h3>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                          <Label htmlFor="travel-alerts">Travel Alerts</Label>
                          <p className="text-sm text-gray-500">Receive alerts about flight deals and discounts</p>
                        </div>
                        <Switch 
                          id="travel-alerts" 
                          checked={settings.preferences.travelAlerts}
                          onCheckedChange={() => handlePreferenceChange('travelAlerts')}
                        />
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                          <Label htmlFor="new-card-offers">New Card Offers</Label>
                          <p className="text-sm text-gray-500">Get notified about new credit card offers</p>
                        </div>
                        <Switch 
                          id="new-card-offers" 
                          checked={settings.preferences.newCardOffers}
                          onCheckedChange={() => handlePreferenceChange('newCardOffers')}
                        />
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                          <Label htmlFor="shopping-deals">Shopping Deals</Label>
                          <p className="text-sm text-gray-500">Receive shopping offers and deals</p>
                        </div>
                        <Switch 
                          id="shopping-deals" 
                          checked={settings.preferences.shoppingDeals}
                          onCheckedChange={() => handlePreferenceChange('shoppingDeals')}
                        />
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                          <Label htmlFor="partner-offers">Partner Offers</Label>
                          <p className="text-sm text-gray-500">Get promotions from our partners</p>
                        </div>
                        <Switch 
                          id="partner-offers" 
                          checked={settings.preferences.partnerOffers}
                          onCheckedChange={() => handlePreferenceChange('partnerOffers')}
                        />
                      </div>
                    </div>
                  </div>
                  
                  <Separator />
                  
                  <div className="space-y-4">
                    <h3 className="text-lg font-medium">Accessibility</h3>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                          <Label htmlFor="high-contrast">High Contrast Mode</Label>
                          <p className="text-sm text-gray-500">Increase contrast for better visibility</p>
                        </div>
                        <Switch 
                          id="high-contrast" 
                          checked={settings.accessibility.highContrast}
                          onCheckedChange={() => handleAccessibilityChange('highContrast')}
                        />
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                          <Label htmlFor="large-text">Large Text</Label>
                          <p className="text-sm text-gray-500">Increase text size throughout the application</p>
                        </div>
                        <Switch 
                          id="large-text" 
                          checked={settings.accessibility.largeText}
                          onCheckedChange={() => handleAccessibilityChange('largeText')}
                        />
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex justify-end">
                    <Button 
                      onClick={handleSaveSettings} 
                      className="bg-[#1A1F71] hover:bg-[#141A5E]"
                      disabled={isSaving}
                    >
                      {isSaving ? (
                        <>
                          <div className="animate-spin mr-2 h-4 w-4 border-2 border-white border-t-transparent rounded-full" />
                          Saving...
                        </>
                      ) : "Save Changes"}
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
                    Control how and when you receive notifications.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-4">
                    <h3 className="text-lg font-medium">Email Notifications</h3>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                          <Label htmlFor="email-notifications">Email Notifications</Label>
                          <p className="text-sm text-gray-500">Receive notifications via email</p>
                        </div>
                        <Switch 
                          id="email-notifications" 
                          checked={settings.notifications.email}
                          onCheckedChange={() => handleNotificationChange('email')}
                        />
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                          <Label htmlFor="offer-notifications">Offer Notifications</Label>
                          <p className="text-sm text-gray-500">Get notified about new offers and rewards</p>
                        </div>
                        <Switch 
                          id="offer-notifications" 
                          checked={settings.notifications.offers}
                          onCheckedChange={() => handleNotificationChange('offers')}
                        />
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                          <Label htmlFor="security-notifications">Security Alerts</Label>
                          <p className="text-sm text-gray-500">Receive notifications about security events</p>
                        </div>
                        <Switch 
                          id="security-notifications" 
                          checked={settings.notifications.security}
                          onCheckedChange={() => handleNotificationChange('security')}
                        />
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                          <Label htmlFor="marketing-emails">Marketing Emails</Label>
                          <p className="text-sm text-gray-500">Receive promotional and marketing emails</p>
                        </div>
                        <Switch 
                          id="marketing-emails" 
                          checked={settings.notifications.marketing}
                          onCheckedChange={() => handleNotificationChange('marketing')}
                        />
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex justify-end">
                    <Button 
                      onClick={handleSaveSettings} 
                      className="bg-[#1A1F71] hover:bg-[#141A5E]"
                      disabled={isSaving}
                    >
                      {isSaving ? (
                        <>
                          <div className="animate-spin mr-2 h-4 w-4 border-2 border-white border-t-transparent rounded-full" />
                          Saving...
                        </>
                      ) : "Save Changes"}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="security" className="mt-6">
              <Card>
                <CardHeader>
                  <CardTitle>Security Settings</CardTitle>
                  <CardDescription>
                    Manage your account security and privacy.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-4">
                    <h3 className="text-lg font-medium">Password</h3>
                    <div className="space-y-3">
                      <div className="space-y-2">
                        <Label htmlFor="current-password">Current Password</Label>
                        <Input id="current-password" type="password" />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="new-password">New Password</Label>
                        <Input id="new-password" type="password" />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="confirm-password">Confirm New Password</Label>
                        <Input id="confirm-password" type="password" />
                      </div>
                    </div>
                  </div>
                  
                  <Separator />
                  
                  <div className="space-y-4">
                    <h3 className="text-lg font-medium">Two-Factor Authentication</h3>
                    <div className="space-y-3">
                      <p className="text-sm text-gray-500">Add an extra layer of security to your account by enabling two-factor authentication.</p>
                      <Button variant="outline">Enable Two-Factor Authentication</Button>
                    </div>
                  </div>
                  
                  <Separator />
                  
                  <div className="space-y-4">
                    <h3 className="text-lg font-medium">Sessions</h3>
                    <div className="space-y-3">
                      <p className="text-sm text-gray-500">Manage your active sessions and sign out from other devices.</p>
                      <div className="bg-gray-50 p-4 rounded-lg">
                        <div className="flex justify-between items-center">
                          <div>
                            <p className="font-medium">Current Session</p>
                            <p className="text-sm text-gray-500">Web Browser • {new Date().toLocaleDateString()}</p>
                          </div>
                          <span className="text-sm bg-green-100 text-green-700 px-2 py-1 rounded-full">Active</span>
                        </div>
                      </div>
                      <Button variant="outline" className="w-full text-red-500">Sign Out From All Other Devices</Button>
                    </div>
                  </div>
                  
                  <div className="flex justify-end">
                    <Button 
                      onClick={handleSaveSettings} 
                      className="bg-[#1A1F71] hover:bg-[#141A5E]"
                      disabled={isSaving}
                    >
                      {isSaving ? (
                        <>
                          <div className="animate-spin mr-2 h-4 w-4 border-2 border-white border-t-transparent rounded-full" />
                          Saving...
                        </>
                      ) : "Save Changes"}
                    </Button>
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