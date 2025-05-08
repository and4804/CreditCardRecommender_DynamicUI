import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ChatContextProvider } from "./lib/contexts/chat-context";
import { InterfaceContextProvider } from "./lib/contexts/interface-context";
import NotFound from "@/pages/not-found";
import Home from "@/pages/home";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home}/>
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <InterfaceContextProvider>
          <ChatContextProvider>
            <Toaster />
            <Router />
          </ChatContextProvider>
        </InterfaceContextProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
