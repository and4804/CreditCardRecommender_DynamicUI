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
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home}/>
      <Route path="/login" component={Login}/>
      <Route path="/profile" component={Profile}/>
      <Route path="/settings" component={Settings}/>
      <Route path="/callback" component={Callback}/>
      <Route path="/cards" component={() => <div className="min-h-screen p-8"><h1 className="text-2xl font-bold mb-4">My Cards Page</h1><p>This page is under construction</p></div>}/>
      <Route path="/travel" component={() => <div className="min-h-screen p-8"><h1 className="text-2xl font-bold mb-4">Travel Page</h1><p>This page is under construction</p></div>}/>
      <Route path="/shopping" component={() => <div className="min-h-screen p-8"><h1 className="text-2xl font-bold mb-4">Shopping Page</h1><p>This page is under construction</p></div>}/>
      <Route path="/benefits" component={() => <div className="min-h-screen p-8"><h1 className="text-2xl font-bold mb-4">Benefits Page</h1><p>This page is under construction</p></div>}/>
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <TooltipProvider>
      <InterfaceContextProvider>
        <ChatContextProvider>
          <div className="flex flex-col min-h-screen">
            <Header />
            <main className="flex-1">
              <Router />
            </main>
            <Footer />
          </div>
          <Toaster />
        </ChatContextProvider>
      </InterfaceContextProvider>
    </TooltipProvider>
  );
}

export default App;
