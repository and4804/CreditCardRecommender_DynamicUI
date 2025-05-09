import { Switch, Route } from "wouter";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ChatContextProvider } from "./lib/contexts/chat-context";
import { InterfaceContextProvider } from "./lib/contexts/interface-context";
import NotFound from "@/pages/not-found";
import Home from "@/pages/home";
import Login from "@/pages/login";
import Profile from "@/pages/profile";
import Settings from "@/pages/settings";
import Callback from "@/pages/callback";
import Cards from "@/pages/cards";
import Benefits from "@/pages/benefits";
import Travel from "@/pages/travel";
import Shopping from "@/pages/shopping";
import AuthPage from "@/pages/auth-page";
import { HeaderNew } from "@/components/layout/header-new";
import { Footer } from "@/components/layout/footer";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AuthProvider } from "@/hooks/use-auth";

// Import ProtectedRoute component
import { ProtectedRouteNew } from "@/components/auth/protected-route-new";

// Create a query client for React Query
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: true,
      staleTime: 0, // Consider data stale immediately
      gcTime: 10000, // Cache for 10 seconds (using gcTime instead of cacheTime for v5)
    },
  },
});

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home}/>
      <Route path="/login" component={Login}/>
      <Route path="/auth" component={AuthPage}/>
      <Route path="/callback" component={Callback}/>
      
      {/* Protected Routes */}
      <Route path="/profile" component={() => (
        <ProtectedRouteNew>
          <Profile />
        </ProtectedRouteNew>
      )}/>
      <Route path="/settings" component={() => (
        <ProtectedRouteNew>
          <Settings />
        </ProtectedRouteNew>
      )}/>
      <Route path="/cards" component={() => (
        <ProtectedRouteNew>
          <Cards />
        </ProtectedRouteNew>
      )}/>
      <Route path="/travel" component={() => (
        <ProtectedRouteNew>
          <Travel />
        </ProtectedRouteNew>
      )}/>
      <Route path="/shopping" component={() => (
        <ProtectedRouteNew>
          <Shopping />
        </ProtectedRouteNew>
      )}/>
      <Route path="/benefits" component={() => (
        <ProtectedRouteNew>
          <Benefits />
        </ProtectedRouteNew>
      )}/>
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider queryClient={queryClient}>
        <TooltipProvider>
          <InterfaceContextProvider>
            <ChatContextProvider>
              <div className="flex flex-col min-h-screen">
                <HeaderNew />
                <main className="flex-1">
                  <Router />
                </main>
                <Footer />
              </div>
              <Toaster />
            </ChatContextProvider>
          </InterfaceContextProvider>
        </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
