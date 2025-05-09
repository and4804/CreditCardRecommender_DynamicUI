import { useState, useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertCircle, CreditCard, Edit, Trash2 } from "lucide-react";
import { CreditCard as CreditCardType } from "@shared/schema";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface CardManageDialogProps {
  cardId: number | null;
  isOpen: boolean;
  onClose: () => void;
}

export function CardManageDialog({ cardId, isOpen, onClose }: CardManageDialogProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [card, setCard] = useState<CreditCardType | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  
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
        console.error("Error fetching card details for management:", err);
        setError(err instanceof Error ? err : new Error("Failed to load card information"));
      } finally {
        setIsLoading(false);
      }
    }
    
    fetchCardDetails();
  }, [isOpen, cardId, queryClient]);

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await apiRequest("DELETE", `/api/cards/${id}`);
      return res.json();
    },
    onSuccess: async () => {
      // Don't just invalidate, fetch fresh data to ensure cache is updated correctly
      try {
        // Direct API call to get fresh data
        const response = await apiRequest('GET', '/api/cards');
        const freshCards = await response.json();
        
        // Update the cache with the fresh data
        queryClient.setQueryData(['/api/cards'], freshCards);
        
        // Also update any other cache keys that might be using the cards data
        queryClient.setQueryData(['/api/cards', 0], freshCards);
        queryClient.setQueryData(['/api/cards', 1], freshCards);
        
        console.log("Card deleted. Fetched fresh cards count:", freshCards.length);
        
        toast({
          title: "Card Removed",
          description: "Your credit card has been successfully removed.",
        });
      } catch (error) {
        console.error("Error refreshing cards after deletion:", error);
        // Still notify the user of success since the deletion worked
        toast({
          title: "Card Removed",
          description: "Your credit card was removed, but we couldn't refresh the list automatically.",
        });
      }
      
      onClose();
    },
    onError: (error: Error) => {
      toast({
        title: "Removal Failed",
        description: error.message || "Failed to remove card. Please try again.",
        variant: "destructive",
      });
    },
  });

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

  const handleDeleteCard = () => {
    if (cardId) {
      deleteMutation.mutate(cardId);
    }
  };

  return (
    <>
      <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Manage Card</DialogTitle>
            <DialogDescription>
              Update information or remove the card from your account.
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
                Failed to load card information. Please try again later.
              </AlertDescription>
            </Alert>
          )}

          {card && (
            <div className="space-y-6">
              <div className={`p-4 rounded-lg ${getCardGradient(card.color)} text-white`}>
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <p className="text-xs opacity-80">{card.cardName}</p>
                    <p className="font-semibold">{card.issuer}</p>
                  </div>
                  <CreditCard className={`w-6 h-6 ${card.color === "accent" ? "text-white" : "text-[#FFB700]"}`} />
                </div>
                <div className="mb-3">
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
              </div>

              <div className="grid grid-cols-1 gap-3">
                <Button className="w-full justify-start" variant="outline">
                  <Edit className="mr-2 h-4 w-4" />
                  Edit Card Details
                </Button>
                
                <Button 
                  className="w-full justify-start" 
                  variant="destructive"
                  onClick={() => setIsDeleteDialogOpen(true)}
                  disabled={deleteMutation.isPending}
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  {deleteMutation.isPending ? "Removing..." : "Remove Card"}
                </Button>
              </div>
            </div>
          )}

          <DialogFooter className="sm:justify-start">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Confirmation Dialog for Delete */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove Card</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to remove this card? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDeleteCard}
              className="bg-red-600 hover:bg-red-700 focus:ring-red-600"
            >
              Remove
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}