import React, { useEffect, useState } from 'react';
import { useAuth0 } from '@auth0/auth0-react';
import { useLocation } from 'wouter';
import { auth0Config } from '@/lib/auth0-config';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export default function Callback() {
  const { isAuthenticated, isLoading, error, user } = useAuth0();
  const [, setLocation] = useLocation();
  const [status, setStatus] = useState("Initializing...");
  const [debugInfo, setDebugInfo] = useState<any>({});
  // Parse search params for additional information
  const searchParams = new URLSearchParams(window.location.search);
  const errorParam = searchParams.get('error');
  const errorDescription = searchParams.get('error_description');

  useEffect(() => {
    // Log debugging information
    console.log("Auth0 Callback Status:", { 
      isAuthenticated, 
      isLoading, 
      error: error ? error.message : null,
      urlErrorParam: errorParam,
      urlErrorDescription: errorDescription,
      user: user ? 'User data available' : 'No user data',
      location: window.location.href,
      redirectUri: auth0Config.redirectUri,
      search: window.location.search
    });

    setDebugInfo({
      isAuthenticated, 
      isLoading, 
      hasError: !!error,
      errorMessage: error ? error.message : null,
      urlError: errorParam,
      urlErrorDescription: errorDescription,
      hasUser: !!user,
      currentUrl: window.location.href,
      currentTime: new Date().toISOString()
    });

    // Once authentication is complete and not loading
    if (!isLoading) {
      if (isAuthenticated && user) {
        // Authentication successful
        setStatus("Authentication successful! Redirecting...");
        // Redirect to home page after successful authentication
        setTimeout(() => setLocation('/'), 1000);
      } else if (error || errorParam) {
        // Authentication error
        const errorMessage = errorDescription || (error ? error.message : 'Unknown error');
        setStatus(`Authentication error: ${errorMessage}`);
        console.error('Authentication error:', error || errorMessage);
      } else {
        // No auth result but no error either - this is unusual
        setStatus("Authentication incomplete. Please try again.");
      }
    } else {
      setStatus("Processing authentication...");
    }
  }, [isAuthenticated, isLoading, error, user, errorParam, errorDescription, setLocation]);

  // Show an error card if there's an authentication error
  if (!isLoading && (error || errorParam)) {
    return (
      <div className="flex min-h-screen items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="bg-red-50">
            <CardTitle className="text-red-600">Authentication Error</CardTitle>
            <CardDescription className="text-red-500">
              {errorDescription || (error ? error.message : 'Failed to authenticate')}
            </CardDescription>
          </CardHeader>
          <CardContent className="mt-4">
            <p className="text-gray-700">
              This could be due to misconfigured Auth0 settings or expired tokens.
            </p>
            
            <div className="mt-4 text-sm p-3 bg-gray-50 rounded border border-gray-200">
              <p className="font-medium">Try the following:</p>
              <ul className="list-disc pl-5 mt-2 space-y-1">
                <li>Verify Auth0 application settings</li>
                <li>Ensure the callback URL matches exactly</li>
                <li>Clear browser cookies and try again</li>
              </ul>
            </div>
          </CardContent>
          <CardFooter className="flex justify-end space-x-2">
            <Button 
              variant="outline" 
              onClick={() => setLocation('/login')}
            >
              Back to Login
            </Button>
          </CardFooter>
        </Card>
        
        {/* Always show debug info for authentication errors */}
        <div className="fixed bottom-4 left-4 right-4 max-w-md mx-auto p-3 bg-gray-800 text-white text-xs rounded-md opacity-80">
          <p className="font-bold mb-1">Debug Information:</p>
          <pre className="overflow-auto max-h-40">{JSON.stringify(debugInfo, null, 2)}</pre>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="text-center max-w-md">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#1A1F71] mx-auto"></div>
        <p className="mt-4 text-gray-600">{status}</p>
        
        {/* Debug information - always visible to help troubleshoot */}
        <div className="mt-8 text-left text-xs bg-gray-100 p-4 rounded">
          <p className="font-bold mb-2">Debug Information:</p>
          <pre className="overflow-auto max-h-40">{JSON.stringify(debugInfo, null, 2)}</pre>
        </div>
      </div>
    </div>
  );
}