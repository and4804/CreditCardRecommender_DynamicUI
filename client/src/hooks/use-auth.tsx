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
  isNewUser: boolean; // Add flag to track if user is new
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
  const [isNewUser, setIsNewUser] = useState<boolean>(false); // Track if user is new
  
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
      // First, verify the Auth0 login with our server
      console.log("Verifying Auth0 user with backend:", userData.id);
      const verifyResponse = await fetch('/api/auth/verify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include', // Important: send cookies for session
        body: JSON.stringify({ user: {
          sub: userData.id,
          nickname: userData.username,
          email: userData.email,
          name: userData.name,
          picture: userData.pictureUrl
        }}),
      });
      
      if (!verifyResponse.ok) {
        console.error('Failed to verify Auth0 user with backend:', await verifyResponse.text());
        return;
      }
      
      const verifyData = await verifyResponse.json();
      console.log("Auth0 verification successful:", verifyData);
      
      // Check if user is new based on verification response
      if (verifyData.isNewUser !== undefined) {
        setIsNewUser(verifyData.isNewUser);
        console.log("User is new?", verifyData.isNewUser);
        
        // Store in sessionStorage to persist during the session
        sessionStorage.setItem('isNewUser', verifyData.isNewUser.toString());
      }
      
      // Then sync additional user data if needed
      const syncResponse = await fetch('/api/auth/sync', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include', // Important: send cookies for session
        body: JSON.stringify(userData),
      });
      
      if (!syncResponse.ok) {
        console.error('Failed to sync user data with backend');
      }
    } catch (error) {
      console.error('Error syncing user with backend:', error);
    }
  };
  
  // Check session storage for isNewUser on initial load
  useEffect(() => {
    const storedIsNewUser = sessionStorage.getItem('isNewUser');
    if (storedIsNewUser !== null) {
      setIsNewUser(storedIsNewUser === 'true');
    }
  }, []);
  
  // Login function using Auth0
  const login = () => {
    loginWithRedirect();
  };
  
  // Logout function
  const logout = () => {
    // Clear isNewUser status on logout
    sessionStorage.removeItem('isNewUser');
    setIsNewUser(false);
    
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
        isNewUser,
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
  
  // If we're outside of the context provider, throw an error
  if (context === null) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  
  console.log("Auth state in useAuth hook:", {
    isAuthenticated: context.isAuthenticated,
    isLoading: context.isLoading,
    isNewUser: context.isNewUser,
    user: context.user
  });
  
  // Add effect to check for session expiration
  // useEffect(() => {
  //   // If loading for more than 10 seconds, try to recover
  //   let recoveryTimeout: NodeJS.Timeout;
  //   if (context.isLoading) {
  //     recoveryTimeout = setTimeout(() => {
  //       console.log("Auth loading timeout reached, attempting recovery");
        
  //       // Try to fetch status from server as a diagnostic
  //       fetch('/api/auth/status', {
  //         credentials: 'include'
  //       }).then(async (response) => {
  //         if (response.ok) {
  //           const status = await response.json();
  //           console.log("Auth recovery status check:", status);
            
  //           // If session exists on server but client doesn't recognize it,
  //           // try to force a reload to recover
  //           if (status.isAuthenticated && !context.isAuthenticated) {
  //             console.log("Session exists on server but not in client, reloading");
  //             window.location.reload();
  //           }
  //         }
  //       }).catch(error => {
  //         console.error("Error during auth recovery check:", error);
  //       });
  //     }, 10000);
  //   }
    
  //   return () => {
  //     if (recoveryTimeout) {
  //       clearTimeout(recoveryTimeout);
  //     }
  //   };
  // }, [context.isLoading, context.isAuthenticated]);
  
  return context;
}