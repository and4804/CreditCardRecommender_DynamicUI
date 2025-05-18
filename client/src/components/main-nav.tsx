import { cn } from "@/lib/utils";
import { Link, useLocation } from "wouter";

interface MainNavProps {
  className?: string;
}

export function MainNav({ className }: MainNavProps) {
  const [location] = useLocation();
  
  return (
    <nav className={cn("flex items-center space-x-4 lg:space-x-6", className)}>
      <Link 
        href="/dashboard"
        className={cn(
          "text-sm font-medium transition-colors hover:text-primary",
          location === "/dashboard" ? "text-primary" : "text-muted-foreground"
        )}
      >
        Dashboard
      </Link>
      <Link 
        href="/cards"
        className={cn(
          "text-sm font-medium transition-colors hover:text-primary",
          location.startsWith("/cards") ? "text-primary" : "text-muted-foreground"
        )}
      >
        Cards
      </Link>
      <Link 
        href="/travel"
        className={cn(
          "text-sm font-medium transition-colors hover:text-primary",
          location.startsWith("/travel") ? "text-primary" : "text-muted-foreground"
        )}
      >
        Travel
      </Link>
      <Link 
        href="/shopping"
        className={cn(
          "text-sm font-medium transition-colors hover:text-primary",
          location.startsWith("/shopping") ? "text-primary" : "text-muted-foreground"
        )}
      >
        Shopping
      </Link>
      <Link 
        href="/chat"
        className={cn(
          "text-sm font-medium transition-colors hover:text-primary",
          location === "/chat" ? "text-primary" : "text-muted-foreground"
        )}
      >
        Chat
      </Link>
    </nav>
  );
} 