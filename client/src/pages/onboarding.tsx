import { useEffect } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { Welcome } from "@/components/onboarding/welcome";
import { Loader2 } from "lucide-react";

export default function Onboarding() {
  const { isAuthenticated, isLoading, isNewUser } = useAuth();
  const [_, navigate] = useLocation();
  
  useEffect(() => {
    // If loading, do nothing yet
    if (isLoading) return;
    
    // If not authenticated, redirect to login
    if (!isAuthenticated) {
      navigate("/auth");
      return;
    }
    
    // If authenticated but not a new user, redirect to home
    if (isAuthenticated && !isNewUser) {
      navigate("/");
      return;
    }
  }, [isAuthenticated, isLoading, isNewUser, navigate]);
  
  // Show loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
        <span className="ml-2 text-lg text-gray-700">Loading your profile...</span>
      </div>
    );
  }
  
  return <Welcome />;
} 