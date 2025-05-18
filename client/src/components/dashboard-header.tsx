import { useEffect, useState } from "react";
import { Link } from "wouter";
import { Button } from "./ui/button";
import { ArrowRight, CreditCard, Landmark, Bell, Settings, User } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { UserNav } from "./user-nav";
import { CalendarDateRangePicker } from "./date-range-picker";
import { MainNav } from "./main-nav";
import { MobileSidebar } from "@/components/mobile-sidebar";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { Info } from "lucide-react";

export function DashboardHeader() {
  const { isAuthenticated, user, isNewUser } = useAuth();
  const [hasFinancialProfile, setHasFinancialProfile] = useState<boolean | null>(null);
  const [isCheckingProfile, setIsCheckingProfile] = useState(false);

  // Check if user has completed their financial profile
  useEffect(() => {
    if (isAuthenticated && user) {
      setIsCheckingProfile(true);
      
      fetch('/api/financial-profile/user', {
        credentials: 'include'
      })
        .then(res => {
          if (res.ok) {
            setHasFinancialProfile(true);
            return;
          }
          if (res.status === 404) {
            setHasFinancialProfile(false);
            return;
          }
          console.error("Error checking financial profile:", res.status);
        })
        .catch(error => {
          console.error("Failed to check financial profile:", error);
        })
        .finally(() => {
          setIsCheckingProfile(false);
        });
    }
  }, [isAuthenticated, user]);

  return (
    <>
      <div className="border-b">
        <div className="flex h-16 items-center px-4 lg:px-6">
          <MobileSidebar />
          <MainNav className="mx-6" />
          <div className="ml-auto flex items-center space-x-4">
            {isAuthenticated && !isCheckingProfile && (hasFinancialProfile === false || isNewUser) && (
              <Alert className="bg-orange-50 border-orange-200 max-w-lg mr-4">
                <Info className="h-4 w-4 text-orange-500" />
                <AlertTitle className="text-orange-700">{isNewUser ? "Welcome to CardSavvy!" : "Complete your profile"}</AlertTitle>
                <AlertDescription className="text-orange-600">
                  {isNewUser 
                    ? "Get started by filling out your financial profile to receive personalized recommendations."
                    : "Fill out your financial profile to get personalized card recommendations."
                  }
                  <Button variant="link" asChild className="p-0 h-auto text-orange-800 font-medium">
                    <Link to={isNewUser ? "/onboarding" : "/financial-profile"}>
                      Get started <ArrowRight className="ml-1 h-3 w-3" />
                    </Link>
                  </Button>
                </AlertDescription>
              </Alert>
            )}
            <CalendarDateRangePicker />
            <UserNav />
          </div>
        </div>
      </div>
    </>
  );
} 