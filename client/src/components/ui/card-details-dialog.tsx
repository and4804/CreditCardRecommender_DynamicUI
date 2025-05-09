import { useState, useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertCircle, CreditCard } from "lucide-react";
import { CreditCard as CreditCardType } from "@shared/schema";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { apiRequest } from "@/lib/queryClient";

interface CardDetailsDialogProps {
  cardId: number | null;
  isOpen: boolean;
  onClose: () => void;
}

export function CardDetailsDialog({ cardId, isOpen, onClose }: CardDetailsDialogProps) {
  const [card, setCard] = useState<CreditCardType | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const queryClient = useQueryClient();
  
  // Fetch card data directly when dialog opens
  useEffect(() => {
    async function fetchCardDetails() {
      if (!isOpen || cardId === null) return;
      
      setIsLoading(true);
      setError(null);
      
      try {
        // Try to get from cache first
        const cachedCard = queryClient.getQueryData<CreditCardType>([`/api/cards/${cardId}`]);
        
        if (cachedCard) {
          setCard(cachedCard);
          setIsLoading(false);
          return;
        }
        
        // If not in cache, fetch directly
        const response = await apiRequest('GET', `/api/cards/${cardId}`);
        const cardData = await response.json();
        
        // Update cache and state
        queryClient.setQueryData([`/api/cards/${cardId}`], cardData);
        setCard(cardData);
      } catch (err) {
        console.error("Error fetching card details:", err);
        setError(err instanceof Error ? err : new Error("Failed to load card details"));
      } finally {
        setIsLoading(false);
      }
    }
    
    fetchCardDetails();
  }, [isOpen, cardId, queryClient]);

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
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Card Details</DialogTitle>
          <DialogDescription>
            View detailed information about your credit card.
          </DialogDescription>
        </DialogHeader>

        {isLoading && (
          <div className="space-y-4 py-4">
            <Skeleton className="h-40 w-full rounded-lg" />
            <div className="space-y-2">
              <Skeleton className="h-4 w-1/2" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-3/4" />
            </div>
          </div>
        )}

        {error && (
          <Alert variant="destructive" className="my-4">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>
              Failed to load card details. Please try again later.
            </AlertDescription>
          </Alert>
        )}

        {card && (
          <div className="space-y-6">
            <div className={`p-6 rounded-lg ${getCardGradient(card.color)} text-white`}>
              <div className="flex justify-between items-start mb-4">
                <div>
                  <p className="text-xs opacity-80">{card.cardName}</p>
                  <p className="font-semibold text-lg">{card.issuer}</p>
                </div>
                <CreditCard className={`w-8 h-8 ${card.color === "accent" ? "text-white" : "text-[#FFB700]"}`} />
              </div>
              <div className="mb-6">
                <p className="font-mono text-lg tracking-wider">{card.cardNumber}</p>
              </div>
              <div className="flex justify-between text-sm">
                <div>
                  <p className="opacity-80">Points Balance</p>
                  <p className="font-semibold">{card.pointsBalance.toLocaleString()}</p>
                </div>
                <div className="text-right">
                  <p className="opacity-80">Expire Date</p>
                  <p className="font-semibold">{card.expireDate}</p>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <div>
                <p className="text-sm font-medium text-gray-500">Card Type</p>
                <p className="font-medium">{card.cardType}</p>
              </div>
              <Separator />
              <div>
                <p className="text-sm font-medium text-gray-500">Rewards</p>
                <p className="font-medium">{card.pointsBalance.toLocaleString()} points</p>
                <p className="text-sm text-gray-500">
                  Approximate value: ₹{(card.pointsBalance * 0.25).toLocaleString()}
                </p>
              </div>
              <Separator />
              <div>
                <p className="text-sm font-medium text-gray-500">Card Status</p>
                <div className="flex items-center mt-1">
                  <div className="w-2 h-2 rounded-full bg-green-500 mr-2"></div>
                  <p className="font-medium">Active</p>
                </div>
              </div>
            </div>
          </div>
        )}

        <DialogFooter className="sm:justify-center">
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}