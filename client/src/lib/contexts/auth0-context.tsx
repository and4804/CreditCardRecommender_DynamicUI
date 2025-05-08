import React, { createContext, useContext, ReactNode } from 'react';
import { useAuth0 as useAuth0Hook, Auth0Provider as Auth0ProviderBase } from '@auth0/auth0-react';

// Create context to share Auth0 state and functionality
export const Auth0Context = createContext<any>(null);

// Custom provider component that wraps Auth0Provider with our domain, client ID and redirect URI
export const Auth0Provider = ({ children }: { children: ReactNode }) => {
  return (
    <Auth0ProviderBase
      domain={import.meta.env.VITE_AUTH0_DOMAIN || ''}
      clientId={import.meta.env.VITE_AUTH0_CLIENT_ID || ''}
      authorizationParams={{
        redirect_uri: import.meta.env.VITE_AUTH0_REDIRECT_URI,
      }}
    >
      {children}
    </Auth0ProviderBase>
  );
};

// Custom hook to access Auth0 functionality
export const useAuth0 = () => {
  const context = useContext(Auth0Context);
  
  // If there's no Auth0Context, use the Auth0 hook directly
  if (!context) {
    return useAuth0Hook();
  }
  
  return context;
};