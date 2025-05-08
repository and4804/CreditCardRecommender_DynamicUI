import { createContext, useState, useEffect, useContext, ReactNode } from "react";
import { useQuery, useMutation, QueryClient } from "@tanstack/react-query";
import { useToast } from "./use-toast";

// Define the user type
interface User {
  id: number;
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
  login: (username: string, password: string) => Promise<void>;
  register: (userData: RegisterData) => Promise<void>;
  logout: () => Promise<void>;
}

// Register data type
interface RegisterData {
  username: string;
  name: string;
  email: string;
  password: string;
  pictureUrl?: string;
}

// Login data type
interface LoginData {
  username: string;
  password: string;
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
  
  // Fetch the current user
  const { 
    data: user, 
    isLoading: isUserLoading,
    error: userError,
    refetch: refetchUser 
  } = useQuery<User>({
    queryKey: ['/api/auth/me'],
    retry: false
  });
  
  // Update authentication state when user data changes
  useEffect(() => {
    if (user) {
      setIsAuthenticated(true);
    }
  }, [user]);
  
  // Login mutation
  const loginMutation = useMutation({
    mutationFn: async (credentials: LoginData) => {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(credentials),
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Login failed');
      }
      
      return await response.json();
    },
    onSuccess: (data) => {
      setIsAuthenticated(true);
      queryClient.setQueryData(['/api/auth/me'], data);
      toast({
        title: "Login Successful",
        description: `Welcome back, ${data.name}!`,
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Login Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });
  
  // Register mutation
  const registerMutation = useMutation({
    mutationFn: async (userData: RegisterData) => {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(userData),
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Registration failed');
      }
      
      return await response.json();
    },
    onSuccess: (data) => {
      setIsAuthenticated(true);
      queryClient.setQueryData(['/api/auth/me'], data);
      toast({
        title: "Registration Successful",
        description: `Welcome, ${data.name}!`,
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Registration Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });
  
  // Logout mutation
  const logoutMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch('/api/auth/logout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Logout failed');
      }
      
      return await response.json();
    },
    onSuccess: () => {
      setIsAuthenticated(false);
      queryClient.setQueryData(['/api/auth/me'], null);
      queryClient.invalidateQueries({ queryKey: ['/api/auth/me'] });
      toast({
        title: "Logged Out",
        description: "You have been logged out successfully.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Logout Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });
  
  // Login function
  const login = async (username: string, password: string) => {
    await loginMutation.mutateAsync({ username, password });
  };
  
  // Register function
  const register = async (userData: RegisterData) => {
    await registerMutation.mutateAsync(userData);
  };
  
  // Logout function
  const logout = async () => {
    await logoutMutation.mutateAsync();
  };
  
  return (
    <AuthContext.Provider
      value={{
        user: user || null,
        isLoading: isUserLoading || loginMutation.isPending || registerMutation.isPending || logoutMutation.isPending,
        isAuthenticated,
        error: userError instanceof Error ? userError : null,
        login,
        register,
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