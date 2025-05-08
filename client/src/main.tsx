import { createRoot } from "react-dom/client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Auth0Provider } from "@auth0/auth0-react";
import App from "./App";
import "./index.css";

// Create a client
const queryClient = new QueryClient();

// Log Auth0 configuration values (without exposing actual secrets)
console.log("Auth0 Domain available:", !!import.meta.env.VITE_AUTH0_DOMAIN);
console.log("Auth0 Client ID available:", !!import.meta.env.VITE_AUTH0_CLIENT_ID);
console.log("Auth0 Redirect URI available:", !!import.meta.env.VITE_AUTH0_REDIRECT_URI);

// Use explicit Auth0 domain and client ID values from environment
const auth0Domain = import.meta.env.VITE_AUTH0_DOMAIN || "";
const auth0ClientId = import.meta.env.VITE_AUTH0_CLIENT_ID || "";
const auth0RedirectUri = import.meta.env.VITE_AUTH0_REDIRECT_URI || window.location.origin;

createRoot(document.getElementById("root")!).render(
  <Auth0Provider
    domain={auth0Domain}
    clientId={auth0ClientId}
    authorizationParams={{
      redirect_uri: auth0RedirectUri,
    }}
  >
    <QueryClientProvider client={queryClient}>
      <App />
    </QueryClientProvider>
  </Auth0Provider>
);
