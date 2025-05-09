import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { CreditCard, Copy, CheckCircle2 } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

// Card form schema
const cardFormSchema = z.object({
  cardName: z.string().min(1, { message: "Card name is required" }),
  issuer: z.string().min(1, { message: "Issuer is required" }),
  cardNumber: z
    .string()
    .min(16, { message: "Card number must be at least 16 digits" })
    .max(19, { message: "Card number must not exceed 19 digits" }),
  expireDate: z.string().regex(/^(0[1-9]|1[0-2])\/\d{2}$/, {
    message: "Expire date must be in format MM/YY",
  }),
  cardType: z.string().min(1, { message: "Card type is required" }),
  pointsBalance: z.coerce.number().min(0),
  color: z.string().default("primary"),
});

// Form values type
type CardFormValues = z.infer<typeof cardFormSchema>;

interface AddCardDialogProps {
  children?: React.ReactNode;
  trigger?: React.ReactNode;
}

export function AddCardDialog({ children, trigger }: AddCardDialogProps) {
  const [open, setOpen] = useState(false);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  // Define form
  const form = useForm<CardFormValues>({
    resolver: zodResolver(cardFormSchema),
    defaultValues: {
      cardName: "",
      issuer: "",
      cardNumber: "",
      expireDate: "",
      cardType: "Signature",
      pointsBalance: 0,
      color: "primary",
    },
  });

  // Create mutation
  const createCardMutation = useMutation({
    mutationFn: async (data: CardFormValues) => {
      const response = await apiRequest(
        "POST",
        "/api/cards",
        { ...data, userId: 1 } // For now, hardcode userId as 1
      );
      return response.json();
    },
    onSuccess: async (newCard) => {
      // Reset form and close dialog first for better UX
      setOpen(false);
      form.reset();
      
      // Simplified and more reliable update approach
      
      try {
        // Directly fetch the latest cards
        const response = await apiRequest('GET', '/api/cards');
        const freshCards = await response.json();
        
        // Update the cache with fresh data (more reliable than invalidation)
        queryClient.setQueryData(["/api/cards"], freshCards);
        
        // Also set data for any queries that might use refreshKey
        for (let i = 0; i < 10; i++) {
          queryClient.setQueryData(["/api/cards", i], freshCards);
        }
        
        console.log("Successfully fetched fresh cards after adding:", freshCards.length);
      } catch (error) {
        console.error("Error refreshing cards after adding:", error);
      }
      
      toast({
        title: "Card Added Successfully",
        description: `Your card was added. You now have ${newCard ? 
          "multiple cards in your account" : 
          "a new card in your account"}.`,
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to add card: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  // Submit handler
  function onSubmit(values: CardFormValues) {
    createCardMutation.mutate(values);
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || children || (
          <Button className="bg-[#1A1F71] hover:bg-[#141A5E]">
            <CreditCard className="mr-2 h-4 w-4" /> Add New Card
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Add a New Credit Card</DialogTitle>
          <DialogDescription>
            Enter your credit card details to add it to your account. All
            information is secure and encrypted.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="issuer"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Card Issuer</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select issuer" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="HDFC Bank">HDFC Bank</SelectItem>
                        <SelectItem value="ICICI Bank">ICICI Bank</SelectItem>
                        <SelectItem value="SBI Card">SBI Card</SelectItem>
                        <SelectItem value="Axis Bank">Axis Bank</SelectItem>
                        <SelectItem value="Kotak Mahindra">
                          Kotak Mahindra
                        </SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="cardName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Card Name</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select card" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="Infinia">Infinia</SelectItem>
                        <SelectItem value="Diners Black">Diners Black</SelectItem>
                        <SelectItem value="Regalia">Regalia</SelectItem>
                        <SelectItem value="Emeralde">Emeralde</SelectItem>
                        <SelectItem value="Elite">Elite</SelectItem>
                        <SelectItem value="Luxury">Luxury</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="cardNumber"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Card Number</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="•••• •••• •••• ••••"
                      {...field}
                      maxLength={19}
                      onChange={(e) => {
                        // Format card number with spaces
                        const value = e.target.value
                          .replace(/\s/g, "")
                          .replace(/[^0-9]/g, "");
                        const formattedValue = value
                          .replace(/(.{4})/g, "$1 ")
                          .trim();
                        field.onChange(formattedValue);
                      }}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="expireDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Expiry Date</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="MM/YY"
                        {...field}
                        maxLength={5}
                        onChange={(e) => {
                          const value = e.target.value.replace(/[^0-9]/g, "");
                          if (value.length <= 4) {
                            let formattedValue = value;
                            if (value.length > 2) {
                              formattedValue =
                                value.slice(0, 2) + "/" + value.slice(2);
                            }
                            field.onChange(formattedValue);
                          }
                        }}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="cardType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Card Type</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="Signature">Signature</SelectItem>
                        <SelectItem value="Platinum">Platinum</SelectItem>
                        <SelectItem value="Titanium">Titanium</SelectItem>
                        <SelectItem value="Gold">Gold</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="pointsBalance"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Initial Points Balance</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        placeholder="0"
                        {...field}
                        onChange={(e) => {
                          field.onChange(e.target.valueAsNumber || 0);
                        }}
                      />
                    </FormControl>
                    <FormDescription className="text-xs">
                      Enter your current reward points
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="color"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Card Color</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select color" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="primary">Primary (Blue)</SelectItem>
                        <SelectItem value="accent">Accent (Cyan)</SelectItem>
                        <SelectItem value="gray">Gray</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <DialogFooter className="pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setOpen(false)}
                className="mr-2"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="bg-[#1A1F71] hover:bg-[#141A5E]"
                disabled={createCardMutation.isPending}
              >
                {createCardMutation.isPending ? (
                  <>
                    <div className="animate-spin mr-2 h-4 w-4 border-2 border-white border-t-transparent rounded-full" />
                    Adding...
                  </>
                ) : (
                  <>Add Card</>
                )}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}