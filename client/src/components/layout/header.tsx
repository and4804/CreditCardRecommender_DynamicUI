import { useState } from "react";
import { Menu, User, ChevronsUpDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useQuery } from "@tanstack/react-query";

export function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const { data: user } = useQuery({
    queryKey: ["/api/user"],
    staleTime: Infinity,
  });

  return (
    <header className="bg-[#1A1F71] text-white p-4 shadow-md">
      <div className="container mx-auto flex justify-between items-center">
        <div className="flex items-center space-x-2">
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
          <h1 className="font-sf-pro font-bold text-xl">CardConcierge</h1>
        </div>
        
        <div className="hidden md:flex items-center space-x-6">
          <a href="#" className="hover:text-[#FFB700] transition">My Cards</a>
          <a href="#" className="hover:text-[#FFB700] transition">Travel</a>
          <a href="#" className="hover:text-[#FFB700] transition">Shopping</a>
          <a href="#" className="hover:text-[#FFB700] transition">Benefits</a>
        </div>
        
        <div className="flex items-center space-x-4">
          <div className="hidden md:block">
            <span className="text-sm mr-2">{user?.name || "James Wilson"}</span>
            <span className="bg-[#00A4E4] text-white text-xs px-2 py-1 rounded-full">
              {user?.membershipLevel || "Platinum"}
            </span>
          </div>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 rounded-full p-0">
                <User className="h-5 w-5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>My Account</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem>Profile</DropdownMenuItem>
              <DropdownMenuItem>Settings</DropdownMenuItem>
              <DropdownMenuItem>Logout</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          
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
          <a href="#" className="block px-4 py-2 hover:bg-[#2A3080] rounded">My Cards</a>
          <a href="#" className="block px-4 py-2 hover:bg-[#2A3080] rounded">Travel</a>
          <a href="#" className="block px-4 py-2 hover:bg-[#2A3080] rounded">Shopping</a>
          <a href="#" className="block px-4 py-2 hover:bg-[#2A3080] rounded">Benefits</a>
        </div>
      )}
    </header>
  );
}
