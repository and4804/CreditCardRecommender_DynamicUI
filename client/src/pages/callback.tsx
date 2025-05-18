import React, { useEffect, useState } from 'react';
import { useAuth0 } from '@auth0/auth0-react';
import { useLocation } from 'wouter';
import { auth0Config } from '@/lib/auth0-config';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/use-auth';

export default function Callback() {
  const { isAuthenticated, isLoading, error, user } = useAuth0();
  const { isNewUser } = useAuth();
  const [, setLocation] = useLocation();
  const [status, setStatus] = useState("Initializing...");
  const [debugInfo, setDebugInfo] = useState<any>({});
  // Parse search params for additional information
  const searchParams = new URLSearchParams(window.location.search);
  const errorParam = searchParams.get('error');
  const errorDescription = searchParams.get('error_description');

  // Get code from URL to check if Auth0 redirected properly
  const code = searchParams.get('code');
  const state = searchParams.get('state');
  const hasAuthParams = !!code && !!state;

  useEffect(() => {
    // Log debugging information
    const currentOrigin = window.location.origin;
    const fullCallbackUrl = `${currentOrigin}/callback`;
    
    console.log("Auth0 Callback Status:", { 
      isAuthenticated, 
      isLoading, 
      isNewUser,
      error: error ? error.message : null,
      urlErrorParam: errorParam,
      urlErrorDescription: errorDescription,
      user: user ? 'User data available' : 'No user data',
      location: window.location.href,
      origin: currentOrigin,
      fullCallbackUrl: fullCallbackUrl,
      redirectUri: auth0Config.redirectUri,
      search: window.location.search,
      hasAuthParams: hasAuthParams
    });

    // Detect if we're in the "Unauthorized" error case
    const isUnauthorizedError = error && error.message === "Unauthorized";

    // Special handling for the "Unauthorized" error which typically means
    // the Auth0 configuration isn't accepting our redirect URL correctly
    if (isUnauthorizedError && hasAuthParams) {
      console.log("Detected Unauthorized error with valid auth params - this usually means:");
      console.log("1. Auth0 application settings may not have the correct callback URL");
      console.log("2. Auth0 may require an API configuration for the audience");
      
      // We'll try direct verification with the API as an alternative approach
      fetch('/api/auth/verify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ code, state })
      })
      .then(response => {
        console.log("Manual verification response:", response.status);
        if (response.ok) {
          return response.json();
        }
        throw new Error(`Manual verification failed: ${response.status}`);
      })
      .then(data => {
        console.log("Manual verification successful:", data);
        
        // Store the mock user in localStorage to simulate Auth0 session
        if (data.user) {
          localStorage.setItem('auth_user', JSON.stringify(data.user));
          localStorage.setItem('auth_is_authenticated', 'true');
          
          // Check if user is new
          if (data.isNewUser) {
            localStorage.setItem('isNewUser', 'true');
            setStatus("New user detected! Redirecting to onboarding...");
            setTimeout(() => {
              window.location.href = '/onboarding';
            }, 1000);
          } else {
            // Update status and redirect
            setStatus("Successfully authenticated! Redirecting...");
            setTimeout(() => {
              window.location.href = '/';
            }, 1000);
          }
        } else {
          throw new Error('No user data received');
        }
      })
      .catch(err => {
        console.error("Manual verification error:", err);
        setStatus(`Alternative authentication failed: ${err.message}`);
      });
    }

    // Updated debug info to include origin information
    setDebugInfo({
      isAuthenticated, 
      isLoading, 
      isNewUser,
      hasError: !!error,
      errorMessage: error ? error.message : null,
      urlError: errorParam,
      urlErrorDescription: errorDescription,
      hasUser: !!user,
      currentUrl: window.location.href,
      origin: currentOrigin,
      callbackUrl: fullCallbackUrl,
      configuredRedirect: auth0Config.redirectUri,
      hasAuthParams: hasAuthParams,
      currentTime: new Date().toISOString()
    });

    // Once authentication is complete and not loading
    if (!isLoading) {
      if (isAuthenticated && user) {
        // Authentication successful
        if (isNewUser) {
          setStatus("New user detected! Redirecting to onboarding...");
          setTimeout(() => setLocation('/onboarding'), 1000);
        } else {
          setStatus("Authentication successful! Redirecting...");
          setTimeout(() => setLocation('/'), 1000);
        }
      } else if (error || errorParam) {
        // Authentication error
        const errorMessage = errorDescription || (error ? error.message : 'Unknown error');
        
        if (isUnauthorizedError && hasAuthParams) {
          setStatus("Trying alternative authentication method...");
        } else {
          setStatus(`Authentication error: ${errorMessage}`);
          console.error('Authentication error:', error || errorMessage);
        }
      } else if (hasAuthParams && !isAuthenticated) {
        // We have auth params but no authentication yet
        setStatus("Received authentication code. Processing...");
      } else {
        // No auth result but no error either - this is unusual
        setStatus("Authentication incomplete. Please try again.");
      }
    } else {
      setStatus("Processing authentication...");
    }
  }, [isAuthenticated, isLoading, error, user, errorParam, errorDescription, setLocation, code, state, hasAuthParams, isNewUser]);

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