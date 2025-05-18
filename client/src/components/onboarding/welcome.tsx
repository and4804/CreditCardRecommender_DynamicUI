import { useEffect } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/hooks/use-auth";
import { CreditCard, User, LucideWallet, Coins, CheckCircle } from "lucide-react";

export function Welcome() {
  const { user, isNewUser } = useAuth();
  const [_, navigate] = useLocation();

  useEffect(() => {
    // If not a new user, redirect to dashboard
    if (!isNewUser) {
      navigate("/");
    }
  }, [isNewUser, navigate]);

  const handleGetStarted = () => {
    // Navigate to the financial profile form
    navigate("/financial-profile");
  };

  return (
    <div className="container flex flex-col items-center justify-center min-h-screen py-12">
      <div className="w-full max-w-3xl">
        <Card className="border-2 border-blue-100 shadow-lg">
          <CardHeader className="text-center bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-t-lg">
            <div className="mx-auto mb-4 bg-white rounded-full p-3 w-16 h-16 flex items-center justify-center">
              <CreditCard className="h-8 w-8 text-blue-600" />
            </div>
            <CardTitle className="text-3xl font-bold">Welcome to CardSavvy!</CardTitle>
            <CardDescription className="text-blue-100 text-lg">
              {user?.name ? `Hi ${user.name}, we're` : "We're"} glad you're here.
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-6 px-8">
            <div className="space-y-6">
              <h3 className="text-xl font-semibold text-gray-800">Let's get you started with personalized credit card recommendations</h3>
              
              <p className="text-gray-600">
                To provide you with the most relevant credit card recommendations, we need to understand your spending habits and preferences.
              </p>
              
              <div className="grid gap-4 mt-6">
                <div className="flex items-start gap-3">
                  <div className="bg-blue-100 rounded-full p-2 mt-0.5">
                    <User className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-800">Complete Your Financial Profile</h4>
                    <p className="text-gray-600 text-sm">Answer a few questions about your income, spending habits, and preferences.</p>
                  </div>
                </div>
                
                <div className="flex items-start gap-3">
                  <div className="bg-blue-100 rounded-full p-2 mt-0.5">
                    <LucideWallet className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-800">Get Personalized Recommendations</h4>
                    <p className="text-gray-600 text-sm">Our AI analyzes your profile to find the best credit cards for your lifestyle.</p>
                  </div>
                </div>
                
                <div className="flex items-start gap-3">
                  <div className="bg-blue-100 rounded-full p-2 mt-0.5">
                    <Coins className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-800">Maximize Your Benefits</h4>
                    <p className="text-gray-600 text-sm">Discover how to get the most value from your credit cards.</p>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
          <CardFooter className="flex justify-center pb-8">
            <Button 
              onClick={handleGetStarted} 
              className="bg-blue-600 hover:bg-blue-700 text-white py-6 px-8 text-lg rounded-full"
            >
              <CheckCircle className="mr-2 h-5 w-5" />
              Complete Your Financial Profile
            </Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
} 