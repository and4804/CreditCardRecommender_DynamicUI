import React, { useEffect } from 'react';
import { useAuth0 } from '@auth0/auth0-react';
import { useLocation } from 'wouter';

export default function Callback() {
  const { isAuthenticated, isLoading, error } = useAuth0();
  const [, setLocation] = useLocation();

  useEffect(() => {
    // Once authentication is complete and not loading
    if (!isLoading) {
      if (isAuthenticated) {
        // Redirect to home page after successful authentication
        setLocation('/');
      } else if (error) {
        // Redirect to login page if there was an error
        console.error('Authentication error:', error);
        setLocation('/login');
      }
    }
  }, [isAuthenticated, isLoading, error, setLocation]);

  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#1A1F71] mx-auto"></div>
        <p className="mt-4 text-gray-600">Completing authentication...</p>
      </div>
    </div>
  );
}