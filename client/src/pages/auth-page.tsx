import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, CreditCard } from "lucide-react";

export default function AuthPage() {
  const { login, isLoading, isAuthenticated } = useAuth();
  const [, setLocation] = useLocation();

  // Use useEffect for navigation instead of conditional rendering
  useEffect(() => {
    if (isAuthenticated) {
      setLocation("/");
    }
  }, [isAuthenticated, setLocation]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <div className="w-full max-w-6xl flex flex-col md:flex-row rounded-lg shadow-lg overflow-hidden">
        <div className="w-full md:w-1/2 flex-shrink-0 bg-gradient-to-br from-blue-900 to-indigo-800 text-white p-12 flex flex-col justify-center">
          <div className="mb-6">
            <CreditCard className="w-16 h-16 mb-6 text-white/90" />
            <h2 className="text-3xl font-bold mb-4">CardSavvy</h2>
            <p className="text-lg text-white/80 mb-6">
              Your AI-powered credit card assistant. Get personalized recommendations, track your rewards, and maximize your benefits.
            </p>
          </div>
          <ul className="space-y-3 text-white/80">
            <li className="flex items-center">
              <div className="mr-2 w-6 h-6 rounded-full bg-white/20 flex items-center justify-center text-white">✓</div>
              <span>Personalized card recommendations</span>
            </li>
            <li className="flex items-center">
              <div className="mr-2 w-6 h-6 rounded-full bg-white/20 flex items-center justify-center text-white">✓</div>
              <span>Track rewards and points</span>
            </li>
            <li className="flex items-center">
              <div className="mr-2 w-6 h-6 rounded-full bg-white/20 flex items-center justify-center text-white">✓</div>
              <span>Maximize travel benefits</span>
            </li>
            <li className="flex items-center">
              <div className="mr-2 w-6 h-6 rounded-full bg-white/20 flex items-center justify-center text-white">✓</div>
              <span>AI-powered spending insights</span>
            </li>
          </ul>
        </div>

        <div className="w-full md:w-1/2 flex-shrink-0 bg-white p-12 flex flex-col justify-center items-center">
          <div className="w-full max-w-md">
            <h1 className="text-3xl font-bold text-[#1A1F71] mb-2">Welcome to CardSavvy</h1>
            <p className="text-gray-600 mb-8">Sign in to continue</p>
                  
                  <Button 
              onClick={login}
              className="w-full bg-[#1A1F71] hover:bg-[#2A3080] text-white py-3 h-auto text-lg mb-4"
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Connecting...
                      </>
                    ) : (
                "Sign in"
                    )}
                  </Button>
            
            <p className="text-sm text-gray-500 text-center mt-6">
              By signing in, you agree to our Terms of Service and Privacy Policy.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}