import { ReactNode, useState, useEffect } from 'react';
import { useAuth0 } from '@auth0/auth0-react';
import { useLocation } from 'wouter';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useQuery } from '@tanstack/react-query';

interface ProtectedRouteProps {
  children: ReactNode;
}

export const ProtectedRoute = ({ children }: ProtectedRouteProps) => {
  const { isAuthenticated: auth0IsAuthenticated, isLoading: auth0IsLoading } = useAuth0();
  const [, setLocation] = useLocation();
  
  // Check for local storage user from manual authentication
  const [manualAuthenticated, setManualAuthenticated] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  
  // Fetch API user as a potential fallback
  const { data: apiUser, isLoading: apiIsLoading } = useQuery({
    queryKey: ["/api/user"],
    staleTime: Infinity,
  });
  
  // On component mount, check if we have a manual auth user in localStorage
  useEffect(() => {
    const storedIsAuthenticated = localStorage.getItem("auth_is_authenticated");
    if (storedIsAuthenticated === "true") {
      setManualAuthenticated(true);
    }
    setIsInitialized(true);
  }, []);
  
  // Combine authentication methods
  const isAuthenticated = auth0IsAuthenticated || manualAuthenticated || !!apiUser;
  const isLoading = auth0IsLoading || apiIsLoading || !isInitialized;

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#1A1F71] mx-auto"></div>
          <p className="mt-4 text-gray-600">Checking authentication status...</p>
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
              Please log in to access this page.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex justify-center">
            <Button 
              className="w-full bg-[#1A1F71] hover:bg-[#141A5E]"
              onClick={() => setLocation('/login')}
            >
              Go to Login
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return <>{children}</>;
};