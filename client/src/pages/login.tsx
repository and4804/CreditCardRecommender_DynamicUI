import React from 'react';
import { Button } from '@/components/ui/button';
import { useAuth0 } from '@auth0/auth0-react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Link } from 'wouter';
import { auth0Config } from '@/lib/auth0-config';

export default function Login() {
  const { loginWithRedirect, isAuthenticated, isLoading } = useAuth0();

  // If already authenticated, show a different message
  if (isAuthenticated) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Card className="w-[400px]">
          <CardHeader>
            <CardTitle className="text-center">You're Logged In</CardTitle>
            <CardDescription className="text-center">
              You're already logged in to your account.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex justify-center">
            <Link href="/">
              <Button className="w-full">
                Go to Dashboard
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  const handleLogin = async () => {
    // Log authentication attempt
    console.log("Attempting Auth0 login with redirect URI:", auth0Config.redirectUri);
    
    await loginWithRedirect({
      authorizationParams: {
        redirect_uri: auth0Config.redirectUri
      }
    });
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50">
      <div className="mx-auto max-w-md w-full px-4">
        <Card>
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <img 
                src="/logo.png" 
                alt="CardSavvy Logo" 
                className="h-12"
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.onerror = null;
                  target.src = 'https://placehold.co/200x60/1A1F71/FFFFFF?text=CardSavvy';
                }}
              />
            </div>
            <CardTitle>Welcome to CardSavvy</CardTitle>
            <CardDescription>
              Log in to access your personalized credit card recommendations
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <Button 
                className="w-full bg-[#1A1F71] hover:bg-[#141A5E]" 
                onClick={handleLogin} 
                disabled={isLoading}
              >
                {isLoading ? "Loading..." : "Sign in with Auth0"}
              </Button>
              
              <div className="text-center text-sm text-muted-foreground">
                <span>By continuing, you agree to our </span>
                <Link href="/terms" className="underline underline-offset-4 hover:text-primary">
                  Terms of Service
                </Link>
                <span> and </span>
                <Link href="/privacy" className="underline underline-offset-4 hover:text-primary">
                  Privacy Policy
                </Link>
              </div>
            </div>
          </CardContent>
          <CardFooter className="flex flex-col space-y-2">
            <div className="text-center text-sm text-muted-foreground">
              <span>Don't have an account? </span>
              <button
                onClick={handleLogin}
                className="text-[#1A1F71] underline underline-offset-4 hover:text-[#141A5E]"
              >
                Sign up
              </button>
            </div>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}