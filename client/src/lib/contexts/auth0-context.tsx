import React, { createContext, useContext, ReactNode } from 'react';
import { useAuth0 as useAuth0Hook, Auth0Provider as Auth0ProviderBase } from '@auth0/auth0-react';
import { auth0Config } from '../auth0-config';

// Create context to share Auth0 state and functionality
export const Auth0Context = createContext<any>(null);

// Custom provider component that wraps Auth0Provider with our domain, client ID and redirect URI
export const Auth0Provider = ({ children }: { children: ReactNode }) => {
  return (
    <Auth0ProviderBase
      domain={auth0Config.domain}
      clientId={auth0Config.clientId}
      authorizationParams={{
        redirect_uri: auth0Config.redirectUri,
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