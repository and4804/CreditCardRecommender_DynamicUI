import React, { useEffect, useState } from 'react';
import { useAuth0 } from '@auth0/auth0-react';
import { useLocation } from 'wouter';
import { auth0Config } from '@/lib/auth0-config';

export default function Callback() {
  const { isAuthenticated, isLoading, error, user } = useAuth0();
  const [, setLocation] = useLocation();
  const [status, setStatus] = useState("Initializing...");
  const [debugInfo, setDebugInfo] = useState<any>({});

  useEffect(() => {
    // Log debugging information
    console.log("Auth0 Callback Status:", { 
      isAuthenticated, 
      isLoading, 
      error: error ? error.message : null,
      user: user ? 'User data available' : 'No user data',
      location: window.location.href,
      redirectUri: auth0Config.redirectUri
    });

    setDebugInfo({
      isAuthenticated, 
      isLoading, 
      hasError: !!error,
      hasUser: !!user,
      currentUrl: window.location.href
    });

    // Once authentication is complete and not loading
    if (!isLoading) {
      if (isAuthenticated && user) {
        // Authentication successful
        setStatus("Authentication successful! Redirecting...");
        // Redirect to home page after successful authentication
        setTimeout(() => setLocation('/'), 1000);
      } else if (error) {
        // Authentication error
        setStatus(`Authentication error: ${error.message}`);
        console.error('Authentication error:', error);
        // Redirect to login page after a delay
        setTimeout(() => setLocation('/login'), 3000);
      } else {
        // No auth result but no error either
        setStatus("Authentication incomplete. Please try again.");
        // Redirect to login page after a delay
        setTimeout(() => setLocation('/login'), 3000);
      }
    } else {
      setStatus("Processing authentication...");
    }
  }, [isAuthenticated, isLoading, error, user, setLocation]);

  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="text-center max-w-md">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#1A1F71] mx-auto"></div>
        <p className="mt-4 text-gray-600">{status}</p>
        
        {/* Debug information - only visible during development */}
        {import.meta.env.DEV && (
          <div className="mt-8 text-left text-xs bg-gray-100 p-4 rounded">
            <p className="font-bold mb-2">Debug Information:</p>
            <pre className="overflow-auto">{JSON.stringify(debugInfo, null, 2)}</pre>
          </div>
        )}
      </div>
    </div>
  );
}