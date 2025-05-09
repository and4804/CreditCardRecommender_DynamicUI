import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { CreditCard } from "@shared/schema";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { 
  CreditCard as CreditCardIcon, 
  Eye, 
  LogIn, 
  MoreVertical, 
  Settings, 
  Trash2
} from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { Link } from "wouter";
import { CardDetailsDialog } from "./card-details-dialog";
import { CardManageDialog } from "./card-manage-dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export function CardDisplay() {
  const { isAuthenticated } = useAuth();
  const [selectedCardId, setSelectedCardId] = useState<number | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [isManageOpen, setIsManageOpen] = useState(false);
  
  const { data: cards, isLoading } = useQuery<CreditCard[]>({
    queryKey: ["/api/cards"],
    // Skip query if not authenticated
    enabled: isAuthenticated,
  });

  const openCardDetails = (cardId: number) => {
    setSelectedCardId(cardId);
    setIsDetailsOpen(true);
  };

  const openCardManage = (cardId: number) => {
    setSelectedCardId(cardId);
    setIsManageOpen(true);
  };

  if (!isAuthenticated) {
    return (
      <div className="mb-6 bg-white p-6 rounded-lg shadow-md">
        <h2 className="font-sf-pro text-lg font-semibold mb-3">Your Active Credit Cards</h2>
        <div className="bg-slate-50 border border-slate-200 rounded-lg p-6 text-center">
          <div className="mx-auto w-12 h-12 bg-blue-50 rounded-full flex items-center justify-center mb-3">
            <CreditCardIcon className="h-6 w-6 text-[#1A1F71]" />
          </div>
          <h3 className="text-lg font-medium mb-2">Login to view your cards</h3>
          <p className="text-slate-600 mb-4">
            Sign in or register to unlock personalized credit card offers and maximize your rewards.
          </p>
          <div className="flex justify-center space-x-4">
            <Button asChild variant="outline">
              <Link to="/auth">
                <LogIn className="h-4 w-4 mr-2" />
                Login
              </Link>
            </Button>
            <Button asChild>
              <Link to="/auth">Register</Link>
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="mb-6 bg-white p-4 rounded-lg shadow-md">
        <h2 className="font-sf-pro text-lg font-semibold mb-3">Your Active Credit Cards</h2>
        <div className="flex overflow-x-auto space-x-4 pb-2">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex-shrink-0 w-64 h-36 rounded-lg">
              <Skeleton className="h-full w-full" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  const getCardGradient = (color: string) => {
    switch (color) {
      case "primary":
        return "bg-gradient-to-r from-[#1A1F71] to-[#141A5E]";
      case "accent":
        return "bg-gradient-to-r from-[#00A4E4] to-[#0082B6]";
      case "gray":
        return "bg-gradient-to-r from-gray-700 to-gray-900";
      default:
        return "bg-gradient-to-r from-[#1A1F71] to-[#141A5E]";
    }
  };

  return (
    <>
      <div className="mb-6 bg-white p-4 rounded-lg shadow-md">
        <h2 className="font-sf-pro text-lg font-semibold mb-3">Your Active Credit Cards</h2>
        <div className="flex overflow-x-auto space-x-4 pb-2">
          {cards?.map((card) => (
            <div
              key={card.id}
              className={`flex-shrink-0 w-64 p-3 rounded-lg ${getCardGradient(card.color)} text-white relative group`}
            >
              {/* Card dropdown menu */}
              <div className="absolute right-2 top-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button size="icon" variant="ghost" className="h-7 w-7 text-white">
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => openCardDetails(card.id)}>
                      <Eye className="mr-2 h-4 w-4" />
                      <span>View Details</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => openCardManage(card.id)}>
                      <Settings className="mr-2 h-4 w-4" />
                      <span>Manage</span>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
              
              <div className="flex justify-between items-start mb-3">
                <div>
                  <p className="text-xs opacity-80">{card.cardName}</p>
                  <p className="font-semibold">{card.issuer}</p>
                </div>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className={`w-5 h-5 ${card.color === "accent" ? "text-white" : "text-[#FFB700]"}`}
                >
                  <rect width="20" height="14" x="2" y="5" rx="2" />
                  <line x1="2" x2="22" y1="10" y2="10" />
                </svg>
              </div>
              <div className="mb-4">
                <p className="font-mono text-sm tracking-wider">{card.cardNumber}</p>
              </div>
              <div className="flex justify-between text-xs">
                <div>
                  <p className="opacity-80">Points Balance</p>
                  <p className="font-semibold">{card.pointsBalance.toLocaleString()}</p>
                </div>
                <div className="text-right">
                  <p className="opacity-80">Expire Date</p>
                  <p className="font-semibold">{card.expireDate}</p>
                </div>
              </div>
              
              {/* Action buttons on hover */}
              <div className="absolute inset-x-0 bottom-0 p-3 bg-gradient-to-t from-black/70 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex justify-between rounded-b-lg">
                <Button 
                  size="sm" 
                  variant="outline" 
                  className="text-white border-white/50 hover:bg-white/20 hover:text-white hover:border-white mr-1 flex-1"
                  onClick={() => openCardDetails(card.id)}
                >
                  <Eye className="mr-1 h-3 w-3" />
                  Details
                </Button>
                <Button 
                  size="sm" 
                  variant="outline" 
                  className="text-white border-white/50 hover:bg-white/20 hover:text-white hover:border-white flex-1"
                  onClick={() => openCardManage(card.id)}
                >
                  <Settings className="mr-1 h-3 w-3" />
                  Manage
                </Button>
              </div>
            </div>
          ))}
        </div>
      </div>
      
      {/* Card Details Dialog */}
      <CardDetailsDialog 
        cardId={selectedCardId} 
        isOpen={isDetailsOpen} 
        onClose={() => setIsDetailsOpen(false)} 
      />
      
      {/* Card Manage Dialog */}
      <CardManageDialog 
        cardId={selectedCardId} 
        isOpen={isManageOpen} 
        onClose={() => {
          setIsManageOpen(false);
          // Add a small delay before nullifying the selected card ID to prevent flickering
          setTimeout(() => setSelectedCardId(null), 200);
        }} 
      />
    </>
  );
}
