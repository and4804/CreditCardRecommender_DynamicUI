import { createRoot } from "react-dom/client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Auth0Provider } from "@auth0/auth0-react";
import App from "./App";
import "./index.css";
import { auth0Config } from "./lib/auth0-config";
import { AuthFallbackProvider } from "./hooks/use-auth-fallback";

// Create a client
const queryClient = new QueryClient();

// Log Auth0 configuration (without exposing full secrets)
console.log("Using Auth0 Configuration:", { 
  domain: auth0Config.domain,
  clientIdAvailable: !!auth0Config.clientId,
  redirectUri: auth0Config.redirectUri,
  currentOrigin: window.location.origin
});

createRoot(document.getElementById("root")!).render(
  <Auth0Provider
    domain={auth0Config.domain}
    clientId={auth0Config.clientId}
    authorizationParams={{
      redirect_uri: auth0Config.redirectUri,
      scope: "openid profile email"
      // Removed audience to simplify authentication
    }}
    cacheLocation="localstorage"
    useRefreshTokens={true}
  >
    <QueryClientProvider client={queryClient}>
      <App />
    </QueryClientProvider>
  </Auth0Provider>
);
