import { useState } from "react";
import { Menu, User, Settings, LogOut, CreditCard, Map, ShoppingBag, Gift } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Link, useLocation } from "wouter";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useAuth } from "@/hooks/use-auth";

export function HeaderNew() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [location, setLocation] = useLocation();
  
  // Use our auth hook
  const { user, isAuthenticated, logout, isLoading } = useAuth();
  
  const handleLogin = () => {
    setLocation('/auth');
  };
  
  const handleLogout = () => {
    logout();
  };
  
  return (
    <header className="bg-[#1A1F71] text-white p-4 shadow-md">
      <div className="container mx-auto flex justify-between items-center">
        <Link href="/">
          <div className="flex items-center space-x-2 cursor-pointer">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="w-6 h-6 text-[#FFB700]"
            >
              <rect width="20" height="14" x="2" y="5" rx="2" />
              <line x1="2" x2="22" y1="10" y2="10" />
            </svg>
            <h1 className="font-sf-pro font-bold text-xl">CardSavvy</h1>
          </div>
        </Link>
        
        <div className="hidden md:flex items-center space-x-6">
          <Link href="/cards">
            <span className={`hover:text-[#FFB700] transition flex items-center gap-1 ${location === '/cards' ? 'text-[#FFB700]' : ''}`}>
              <CreditCard className="h-4 w-4" />
              <span>My Cards</span>
            </span>
          </Link>
          <Link href="/travel">
            <span className={`hover:text-[#FFB700] transition flex items-center gap-1 ${location === '/travel' ? 'text-[#FFB700]' : ''}`}>
              <Map className="h-4 w-4" />
              <span>Travel</span>
            </span>
          </Link>
          <Link href="/shopping">
            <span className={`hover:text-[#FFB700] transition flex items-center gap-1 ${location === '/shopping' ? 'text-[#FFB700]' : ''}`}>
              <ShoppingBag className="h-4 w-4" />
              <span>Shopping</span>
            </span>
          </Link>
          <Link href="/benefits">
            <span className={`hover:text-[#FFB700] transition flex items-center gap-1 ${location === '/benefits' ? 'text-[#FFB700]' : ''}`}>
              <Gift className="h-4 w-4" />
              <span>Benefits</span>
            </span>
          </Link>
        </div>
        
        <div className="flex items-center space-x-4">
          {isAuthenticated && user ? (
            <>
              <div className="hidden md:block">
                <span className="text-sm mr-2">{user.name}</span>
                <span className="bg-[#00A4E4] text-white text-xs px-2 py-1 rounded-full">
                  {user.membershipLevel || "Premium"}
                </span>
              </div>
              
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="h-8 w-8 rounded-full p-0 overflow-hidden">
                    {user.pictureUrl ? (
                      <Avatar>
                        <AvatarImage src={user.pictureUrl} alt={user.name} />
                        <AvatarFallback>{user.name.charAt(0)}</AvatarFallback>
                      </Avatar>
                    ) : (
                      <Avatar>
                        <AvatarFallback>{user.name.charAt(0)}</AvatarFallback>
                      </Avatar>
                    )}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuLabel>My Account</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => setLocation('/profile')}>
                    <User className="mr-2 h-4 w-4" />
                    <span>Profile</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setLocation('/settings')}>
                    <Settings className="mr-2 h-4 w-4" />
                    <span>Settings</span>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleLogout} disabled={isLoading}>
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>Logout</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </>
          ) : (
            <Button 
              variant="outline" 
              className="bg-transparent border-white text-white hover:bg-white hover:text-[#1A1F71]"
              onClick={handleLogin}
              disabled={isLoading}
            >
              Login
            </Button>
          )}
          
          <Button 
            variant="ghost" 
            size="icon" 
            className="md:hidden"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
          >
            <Menu className="h-5 w-5" />
          </Button>
        </div>
      </div>
      
      {/* Mobile menu */}
      {isMenuOpen && (
        <div className="md:hidden pt-4 pb-2 space-y-2">
          <Link href="/cards">
            <span className="flex items-center px-4 py-2 hover:bg-[#2A3080] rounded">
              <CreditCard className="h-4 w-4 mr-2" />
              <span>My Cards</span>
            </span>
          </Link>
          <Link href="/travel">
            <span className="flex items-center px-4 py-2 hover:bg-[#2A3080] rounded">
              <Map className="h-4 w-4 mr-2" />
              <span>Travel</span>
            </span>
          </Link>
          <Link href="/shopping">
            <span className="flex items-center px-4 py-2 hover:bg-[#2A3080] rounded">
              <ShoppingBag className="h-4 w-4 mr-2" />
              <span>Shopping</span>
            </span>
          </Link>
          <Link href="/benefits">
            <span className="flex items-center px-4 py-2 hover:bg-[#2A3080] rounded">
              <Gift className="h-4 w-4 mr-2" />
              <span>Benefits</span>
            </span>
          </Link>
        </div>
      )}
    </header>
  );
}