import { useAuth0 } from "@auth0/auth0-react";
import { useState, useEffect, createContext, ReactNode, useContext } from "react";
import { useQuery } from "@tanstack/react-query";
import { auth0Config } from "@/lib/auth0-config";

// Create a context for our custom auth
type AuthFallbackContextType = {
  isAuthenticated: boolean;
  isLoading: boolean;
  user: any;
  error: Error | null;
  login: () => void;
  logout: () => void;
};

const AuthFallbackContext = createContext<AuthFallbackContextType | null>(null);

export function AuthFallbackProvider({ children }: { children: ReactNode }) {
  // First try Auth0
  const auth0 = useAuth0();
  
  // State for our fallback auth
  const [fallbackUser, setFallbackUser] = useState<any>(null);
  const [fallbackIsAuthenticated, setFallbackIsAuthenticated] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  
  // Check local storage for our fallback auth
  useEffect(() => {
    const storedUser = localStorage.getItem("auth_user");
    const storedIsAuthenticated = localStorage.getItem("auth_is_authenticated");
    
    if (storedUser && storedIsAuthenticated === "true") {
      try {
        setFallbackUser(JSON.parse(storedUser));
        setFallbackIsAuthenticated(true);
      } catch (error) {
        console.error("Error parsing stored user:", error);
      }
    }
    
    setIsInitialized(true);
  }, []);
  
  // Combine Auth0 and our fallback
  const isAuthenticated = auth0.isAuthenticated || fallbackIsAuthenticated;
  const user = auth0.user || fallbackUser;
  const isLoading = auth0.isLoading || !isInitialized;
  
  // Login function
  const login = () => {
    auth0.loginWithRedirect({
      authorizationParams: {
        redirect_uri: auth0Config.redirectUri
      }
    });
  };
  
  // Logout function
  const logout = () => {
    // Clear our fallback auth
    localStorage.removeItem("auth_user");
    localStorage.removeItem("auth_is_authenticated");
    setFallbackUser(null);
    setFallbackIsAuthenticated(false);
    
    // Also logout from Auth0 if we're using it
    if (auth0.isAuthenticated) {
      auth0.logout({
        logoutParams: {
          returnTo: window.location.origin
        }
      });
    } else {
      // If we're using fallback, redirect to home
      window.location.href = "/";
    }
  };
  
  // Log our auth state for debugging
  useEffect(() => {
    console.log("Auth fallback state:", {
      auth0IsAuthenticated: auth0.isAuthenticated,
      auth0User: auth0.user,
      fallbackIsAuthenticated,
      fallbackUser,
      combinedIsAuthenticated: isAuthenticated,
      combinedUser: user
    });
  }, [auth0.isAuthenticated, auth0.user, fallbackIsAuthenticated, fallbackUser, isAuthenticated, user]);
  
  return (
    <AuthFallbackContext.Provider
      value={{
        isAuthenticated,
        isLoading,
        user,
        error: auth0.error || null,
        login,
        logout
      }}
    >
      {children}
    </AuthFallbackContext.Provider>
  );
}

export function useAuthFallback() {
  const context = useContext(AuthFallbackContext);
  if (!context) {
    throw new Error("useAuthFallback must be used within an AuthFallbackProvider");
  }
  return context;
}