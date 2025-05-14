import { createContext, useState, useEffect, useContext, ReactNode } from "react";
import { useQuery, useMutation, QueryClient } from "@tanstack/react-query";
import { useToast } from "./use-toast";
import { useAuth0 } from "@auth0/auth0-react";

// Define the user type
interface User {
  id: string;  // Changed from number to string for Auth0 sub
  username: string;
  name: string;
  email: string;
  membershipLevel: string;
  pictureUrl?: string;
  createdAt: string;
  lastLogin?: string;
}

// Define authentication context types
interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  error: Error | null;
  login: () => void;
  logout: () => void;
}

// Create the auth context
const AuthContext = createContext<AuthContextType | null>(null);

// Create the auth provider
export function AuthProvider({ 
  children,
  queryClient 
}: { 
  children: ReactNode;
  queryClient: QueryClient;
}) {
  const { toast } = useToast();
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [user, setUser] = useState<User | null>(null);
  const [error, setError] = useState<Error | null>(null);
  
  // Use Auth0
  const { 
    user: auth0User, 
    isAuthenticated: auth0IsAuthenticated, 
    isLoading: auth0IsLoading,
    loginWithRedirect,
    logout: auth0Logout,
    error: auth0Error
  } = useAuth0();
  
  // Update auth state when Auth0 state changes
  useEffect(() => {
    if (auth0IsAuthenticated && auth0User) {
      // Map Auth0 user to our User type
      const mappedUser: User = {
        id: auth0User.sub || '',
        username: auth0User.nickname || auth0User.email || '',
        name: auth0User.name || '',
        email: auth0User.email || '',
        membershipLevel: 'Premium', // Default membership level
        pictureUrl: auth0User.picture,
        createdAt: auth0User.updated_at || new Date().toISOString(),
        lastLogin: new Date().toISOString()
      };
      
      setUser(mappedUser);
      setIsAuthenticated(true);
      
      // Also update the user in React Query cache
      queryClient.setQueryData(['/api/auth/me'], mappedUser);
      
      // Sync the user with our backend if needed
      syncUserWithBackend(mappedUser);
    } else {
      setUser(null);
      setIsAuthenticated(false);
    }
    
    if (auth0Error) {
      setError(auth0Error);
      toast({
        title: "Authentication Error",
        description: auth0Error.message,
        variant: "destructive",
      });
    }
  }, [auth0User, auth0IsAuthenticated, auth0IsLoading, auth0Error, queryClient, toast]);
  
  // Function to sync user data with our backend
  const syncUserWithBackend = async (userData: User) => {
    try {
      const response = await fetch('/api/auth/sync', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(userData),
      });
      
      if (!response.ok) {
        console.error('Failed to sync user data with backend');
      }
    } catch (error) {
      console.error('Error syncing user with backend:', error);
    }
  };
  
  // Login function using Auth0
  const login = () => {
    loginWithRedirect();
  };
  
  // Logout function
  const logout = () => {
    auth0Logout({ 
      logoutParams: {
        returnTo: window.location.origin 
      }
    });
  };
  
  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading: auth0IsLoading,
        isAuthenticated,
        error,
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

// Custom hook to use the auth context
export function useAuth() {
  const context = useContext(AuthContext);
  if (context === null) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}