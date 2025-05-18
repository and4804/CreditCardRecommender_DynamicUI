import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { Loader2 } from "lucide-react";

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
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";

// Define the spending categories
const SPENDING_CATEGORIES = [
  { id: "groceries", label: "Groceries" },
  { id: "dining", label: "Dining/Restaurants" },
  { id: "travel", label: "Travel (flights, hotels)" },
  { id: "gas", label: "Gas/Fuel" },
  { id: "entertainment", label: "Entertainment" },
  { id: "shopping", label: "Shopping" },
  { id: "utilities", label: "Utilities" },
  { id: "healthcare", label: "Healthcare" },
  { id: "education", label: "Education" },
];

// Define popular benefits
const CARD_BENEFITS = [
  { id: "cashback", label: "Cash Back" },
  { id: "travel_points", label: "Travel Points/Miles" },
  { id: "airport_lounge", label: "Airport Lounge Access" },
  { id: "no_foreign_transaction", label: "No Foreign Transaction Fees" },
  { id: "purchase_protection", label: "Purchase Protection" },
  { id: "extended_warranty", label: "Extended Warranty" },
  { id: "rental_insurance", label: "Rental Car Insurance" },
  { id: "signup_bonus", label: "Sign-up Bonus" },
  { id: "no_annual_fee", label: "No Annual Fee" },
  { id: "travel_insurance", label: "Travel Insurance" },
];

// Define popular airlines
const AIRLINES = [
  { id: "air_india", label: "Air India" },
  { id: "indigo", label: "IndiGo" },
  { id: "vistara", label: "Vistara" },
  { id: "air_asia", label: "AirAsia India" },
  { id: "spicejet", label: "SpiceJet" },
  { id: "emirates", label: "Emirates" },
  { id: "etihad", label: "Etihad Airways" },
  { id: "singapore", label: "Singapore Airlines" },
  { id: "qatar", label: "Qatar Airways" },
  { id: "lufthansa", label: "Lufthansa" },
];

// Define popular credit cards
const POPULAR_CARDS = [
  { id: "hdfc_infinia", label: "HDFC Infinia" },
  { id: "hdfc_diners_club", label: "HDFC Diners Club Black" },
  { id: "icici_emeralde", label: "ICICI Emeralde" },
  { id: "sbi_elite", label: "SBI Elite" },
  { id: "amex_platinum", label: "Amex Platinum" },
  { id: "axis_magnus", label: "Axis Magnus" },
  { id: "hdfc_regalia", label: "HDFC Regalia" },
  { id: "citi_prestige", label: "Citi Prestige" },
  { id: "rbl_icon", label: "RBL Bank ICON" },
  { id: "yes_first", label: "Yes First Exclusive" },
];

// Create form schema
const formSchema = z.object({
  annualIncome: z.string().refine((val) => {
    const num = parseFloat(val.replace(/,/g, ""));
    return !isNaN(num) && num >= 0;
  }, {
    message: "Please enter a valid income amount",
  }),
  creditScore: z.string().refine((val) => {
    const num = parseInt(val);
    return !isNaN(num) && num >= 300 && num <= 850;
  }, {
    message: "Credit score must be between 300 and 850",
  }),
  monthlySpending: z.record(z.string(), z.number()).default({}),
  primarySpendingCategories: z.array(z.string()).min(1, {
    message: "Please select at least one spending category",
  }),
  travelFrequency: z.enum(["rarely", "occasionally", "frequently"]),
  diningFrequency: z.enum(["rarely", "occasionally", "frequently"]),
  preferredBenefits: z.array(z.string()).min(1, {
    message: "Please select at least one preferred benefit",
  }),
  preferredAirlines: z.array(z.string()).optional(),
  existingCards: z.array(z.string()).optional(),
  shoppingHabits: z.object({
    online: z.number(),
    inStore: z.number(),
  }).optional(),
});

type FormValues = z.infer<typeof formSchema>;

export default function FinancialProfileForm() {
  const { toast } = useToast();
  const [_, navigate] = useLocation();
  const { isAuthenticated, user } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const totalSteps = 4;
  const [isLoading, setIsLoading] = useState(false);
  const [onlineShoppingPercentage, setOnlineShoppingPercentage] = useState(50);

  // Default form values
  const defaultValues: Partial<FormValues> = {
    annualIncome: "",
    creditScore: "",
    monthlySpending: {},
    primarySpendingCategories: [],
    travelFrequency: "occasionally",
    diningFrequency: "occasionally",
    preferredBenefits: [],
    preferredAirlines: [],
    existingCards: [],
    shoppingHabits: {
      online: 50,
      inStore: 50,
    },
  };

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues,
  });

  // Effect to load existing profile if user is authenticated
  useEffect(() => {
    if (isAuthenticated && !form.formState.isDirty) {
      setIsLoading(true);
      fetch('/api/financial-profile/user', {
        credentials: 'include' // Include cookies for authentication
      })
        .then(res => {
          if (res.ok) return res.json();
          if (res.status === 404) {
            console.log("No existing financial profile found for user");
            return null;
          }
          throw new Error(`Failed to fetch profile: ${res.status}`);
        })
        .then(data => {
          if (data && data.profile) {
            console.log("Preloading existing financial profile data");
            
            // Format the data for the form
            const formData = {
              ...data.profile,
              // Format annualIncome as string with commas
              annualIncome: data.profile.annualIncome.toLocaleString(),
              // Format creditScore as string
              creditScore: data.profile.creditScore.toString()
            };
            
            // Reset form with existing data
            form.reset(formData);
            
            // Set the shoppingHabits slider values
            setOnlineShoppingPercentage(data.profile.shoppingHabits?.online || 50);
            
            // Set form values for spending categories
            form.setValue("monthlySpending", data.profile.monthlySpending);
            
            toast({
              title: "Profile Loaded",
              description: "Your existing financial profile has been loaded",
            });
          }
        })
        .catch(error => {
          console.error("Error loading financial profile:", error);
        })
        .finally(() => {
          setIsLoading(false);
        });
    }
  }, [isAuthenticated, form, toast]);

  // When a spending category is selected, initialize it with default amount
  const handleCategorySelection = (checked: boolean, categoryId: string) => {
    const updatedCategories = checked
      ? [...form.getValues("primarySpendingCategories"), categoryId]
      : form.getValues("primarySpendingCategories").filter((value) => value !== categoryId);
    
    form.setValue("primarySpendingCategories", updatedCategories);
    
    // Update monthly spending for this category
    const currentSpending = form.getValues("monthlySpending");
    if (checked) {
      // Initialize with default value if selected
      form.setValue("monthlySpending", {
        ...currentSpending,
        [categoryId]: currentSpending[categoryId] || 3000
      });
    } else {
      // If unchecked, keep the value but set to 0
      form.setValue("monthlySpending", {
        ...currentSpending,
        [categoryId]: 0
      });
    }
  };

  // Form submission handler
  const onSubmit = async (formData: FormValues) => {
    if (!isAuthenticated) {
      toast({
        title: "Not Authenticated",
        description: "Please sign in to continue",
        variant: "destructive",
      });
      navigate("/auth");
      return;
    }
    
    // Debug auth state
    console.log("Auth state before submission:", { isAuthenticated, user });

    setIsSubmitting(true);

    try {
      // Convert annual income string to number
      const annualIncome = parseFloat(formData.annualIncome.replace(/,/g, ""));
      // Convert credit score string to number
      const creditScore = parseInt(formData.creditScore);

      // Prepare spending data - ensure only selected categories have non-zero values
      const monthlySpending: Record<string, number> = {};
      
      // Initialize all categories with 0
      SPENDING_CATEGORIES.forEach(category => {
        monthlySpending[category.id] = 0;
      });
      
      // Set values for selected categories
      formData.primarySpendingCategories.forEach(categoryId => {
        monthlySpending[categoryId] = formData.monthlySpending[categoryId] || 0;
      });

      // Prepare data for submission
      const profileData = {
        ...formData,
        annualIncome,
        creditScore,
        monthlySpending
      };

      // Debug data being sent
      console.log("Submitting profile data:", JSON.stringify(profileData, null, 2));

      // Use the /api/financial-profile endpoint for saving
      const response = await fetch("/api/financial-profile", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          // Include auth info in headers as a fallback
          "X-Auth-User-ID": user?.id || "",
          "X-Auth-Session": "true"
        },
        body: JSON.stringify({
          ...profileData,
          // Include auth0Id in the request body as well
          auth0UserId: user?.id
        }),
        credentials: "include" // Include cookies for authentication
      });

      if (!response.ok) {
        // Try to get detailed error information
        let errorText = await response.text();
        let errorData;
        
        try {
          // Try to parse as JSON
          errorData = JSON.parse(errorText);
        } catch (e) {
          // If not valid JSON, use the raw text
          console.error("Server returned non-JSON response:", errorText);
          errorData = { message: errorText };
        }
        
        console.error("Server response:", response.status, errorData);
        
        // Display more specific error message if available
        if (errorData && errorData.details) {
          toast({
            title: "Validation Error",
            description: "There was an issue with your submission. Please check your data and try again.",
            variant: "destructive",
          });
          console.error("Validation errors:", errorData.details);
        } else {
          let errorMessage = "Failed to save profile";
          
          // Show MongoDB-specific error messages
          if (errorData && errorData.message) {
            if (errorData.message.includes("ObjectId")) {
              errorMessage = "Database ID error - Please try again";
              console.error("MongoDB ObjectId error:", errorData.message);
            } else {
              errorMessage = `Error: ${errorData.message.substring(0, 100)}`;
            }
          }
          
          toast({
            title: "Submission Error",
            description: errorMessage,
            variant: "destructive",
          });
        }
        return;
      }

      toast({
        title: "Profile Saved",
        description: "Your financial profile has been saved successfully",
      });

      // Show the result from the server
      const responseData = await response.json();
      console.log("Server response:", responseData);
      
      // Reset form after successful submission
      form.reset();
      setCurrentStep(1);
      
    } catch (error) {
      console.error("Profile submission error:", error);
      toast({
        title: "Submission Error",
        description: "Failed to save your financial profile. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle next step
  const handleNextStep = () => {
    // Validate the current step fields before proceeding
    switch (currentStep) {
      case 1:
        if (!form.getValues("annualIncome") || !form.getValues("creditScore")) {
          form.trigger(["annualIncome", "creditScore"]);
          return;
        }
        break;
      case 2:
        if (form.getValues("primarySpendingCategories").length === 0) {
          form.trigger("primarySpendingCategories");
          return;
        }
        break;
      case 3:
        // No validation needed for step 3 fields
        break;
    }

    // Move to the next step if validation passed
    setCurrentStep((prev) => Math.min(prev + 1, totalSteps));
  };

  // Handle previous step
  const handlePrevStep = () => {
    setCurrentStep((prev) => Math.max(prev - 1, 1));
  };

  // Format a number as currency
  const formatCurrency = (value: string) => {
    // Remove any existing commas
    const plainNumber = value.replace(/,/g, "");
    
    // Format with commas
    return plainNumber.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  };

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle className="text-2xl font-bold text-center">Financial Profile</CardTitle>
        <CardDescription className="text-center">
          Tell us about your finances to get personalized credit card recommendations
        </CardDescription>
        
        {/* Progress indicator */}
        <div className="w-full mt-4">
          <div className="flex justify-between mb-2">
            {Array.from({ length: totalSteps }, (_, i) => (
              <div 
                key={i} 
                className={`w-8 h-8 rounded-full flex items-center justify-center ${
                  i + 1 === currentStep 
                    ? "bg-primary text-white" 
                    : i + 1 < currentStep 
                      ? "bg-primary/20 text-primary" 
                      : "bg-gray-200 text-gray-500"
                }`}
              >
                {i + 1}
              </div>
            ))}
          </div>
          <div className="w-full bg-gray-200 h-2 rounded-full">
            <div 
              className="bg-primary h-2 rounded-full transition-all"
              style={{ width: `${(currentStep / totalSteps) * 100}%` }}
            />
          </div>
        </div>
      </CardHeader>

      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Step 1: Basic Financial Information */}
            {currentStep === 1 && (
              <div className="space-y-4">
                <h3 className="text-lg font-medium">Basic Financial Information</h3>
                
                <FormField
                  control={form.control}
                  name="annualIncome"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Annual Income (₹)</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="e.g., 1,200,000"
                          {...field}
                          onChange={(e) => {
                            const formattedValue = formatCurrency(e.target.value);
                            field.onChange(formattedValue);
                          }}
                        />
                      </FormControl>
                      <FormDescription>Your annual income before taxes</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="creditScore"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Credit Score</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="e.g., 750"
                          {...field}
                          onChange={(e) => {
                            // Only allow numbers
                            const value = e.target.value.replace(/\D/g, "");
                            field.onChange(value);
                          }}
                        />
                      </FormControl>
                      <FormDescription>Your credit score between 300-850</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            )}

            {/* Step 2: Spending Habits */}
            {currentStep === 2 && (
              <div className="space-y-4">
                <h3 className="text-lg font-medium">Spending Habits</h3>
                
                <FormField
                  control={form.control}
                  name="primarySpendingCategories"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Primary Spending Categories</FormLabel>
                      <FormDescription>
                        Select the categories where you spend the most money
                      </FormDescription>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-2 mt-2">
                        {SPENDING_CATEGORIES.map((category) => (
                          <div key={category.id} className="flex items-center space-x-2">
                            <Checkbox
                              id={category.id}
                              checked={field.value?.includes(category.id)}
                              onCheckedChange={(checked) => {
                                handleCategorySelection(!!checked, category.id);
                              }}
                            />
                            <label htmlFor={category.id} className="text-sm font-medium leading-none">
                              {category.label}
                            </label>
                          </div>
                        ))}
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Monthly spending for selected categories */}
                <div className="space-y-4 mt-6">
                  <h4 className="text-md font-medium">Monthly Spending (₹)</h4>
                  <FormDescription>
                    Adjust your monthly spending for each selected category
                  </FormDescription>

                  {form.watch("primarySpendingCategories").map((categoryId) => {
                    const category = SPENDING_CATEGORIES.find(c => c.id === categoryId);
                    if (!category) return null;

                    return (
                      <FormField
                        key={categoryId}
                        control={form.control}
                        name={`monthlySpending.${categoryId}`}
                        render={({ field }) => (
                          <FormItem className="space-y-1">
                            <div className="flex justify-between">
                              <FormLabel>{category.label}</FormLabel>
                              <span>₹{field.value?.toLocaleString() || 0}</span>
                            </div>
                            <FormControl>
                              <Slider
                                min={1000}
                                max={50000}
                                step={1000}
                                value={[field.value || 3000]}
                                onValueChange={(values) => {
                                  field.onChange(values[0]);
                                }}
                              />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                    );
                  })}
                </div>

                <FormField
                  control={form.control}
                  name="shoppingHabits"
                  render={({ field }) => (
                    <FormItem className="space-y-1">
                      <FormLabel>Shopping Habits</FormLabel>
                      <FormDescription>
                        Adjust the balance between online and in-store shopping
                      </FormDescription>
                      <div className="flex justify-between text-sm text-gray-500">
                        <span>Online: {field.value?.online || 50}%</span>
                        <span>In-store: {field.value?.inStore || 50}%</span>
                      </div>
                      <FormControl>
                        <Slider
                          min={0}
                          max={100}
                          step={5}
                          value={[field.value?.online || 50]}
                          onValueChange={(values) => {
                            const online = values[0];
                            field.onChange({
                              online,
                              inStore: 100 - online,
                            });
                          }}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </div>
            )}

            {/* Step 3: Travel & Dining */}
            {currentStep === 3 && (
              <div className="space-y-4">
                <h3 className="text-lg font-medium">Travel & Dining</h3>
                
                <FormField
                  control={form.control}
                  name="travelFrequency"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Travel Frequency</FormLabel>
                      <Select 
                        onValueChange={field.onChange} 
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select how often you travel" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="rarely">Rarely (0-1 trips per year)</SelectItem>
                          <SelectItem value="occasionally">Occasionally (2-4 trips per year)</SelectItem>
                          <SelectItem value="frequently">Frequently (5+ trips per year)</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormDescription>
                        How often do you travel domestically or internationally?
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="diningFrequency"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Dining Out Frequency</FormLabel>
                      <Select 
                        onValueChange={field.onChange} 
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select how often you dine out" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="rarely">Rarely (0-2 times per month)</SelectItem>
                          <SelectItem value="occasionally">Occasionally (3-8 times per month)</SelectItem>
                          <SelectItem value="frequently">Frequently (9+ times per month)</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormDescription>
                        How often do you dine at restaurants?
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {form.watch("travelFrequency") !== "rarely" && (
                  <FormField
                    control={form.control}
                    name="preferredAirlines"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Preferred Airlines (Optional)</FormLabel>
                        <FormDescription>
                          Select any airlines you frequently fly with
                        </FormDescription>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-2 mt-2">
                          {AIRLINES.map((airline) => (
                            <div key={airline.id} className="flex items-center space-x-2">
                              <Checkbox
                                id={airline.id}
                                checked={field.value?.includes(airline.id)}
                                onCheckedChange={(checked) => {
                                  const updatedAirlines = checked
                                    ? [...(field.value || []), airline.id]
                                    : (field.value || []).filter((value) => value !== airline.id);
                                  field.onChange(updatedAirlines);
                                }}
                              />
                              <label htmlFor={airline.id} className="text-sm font-medium leading-none">
                                {airline.label}
                              </label>
                            </div>
                          ))}
                        </div>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}
              </div>
            )}

            {/* Step 4: Card Preferences */}
            {currentStep === 4 && (
              <div className="space-y-4">
                <h3 className="text-lg font-medium">Card Preferences</h3>
                
                <FormField
                  control={form.control}
                  name="preferredBenefits"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Preferred Card Benefits</FormLabel>
                      <FormDescription>
                        Select the benefits that are most important to you
                      </FormDescription>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-2 mt-2">
                        {CARD_BENEFITS.map((benefit) => (
                          <div key={benefit.id} className="flex items-center space-x-2">
                            <Checkbox
                              id={benefit.id}
                              checked={field.value?.includes(benefit.id)}
                              onCheckedChange={(checked) => {
                                const updatedBenefits = checked
                                  ? [...field.value, benefit.id]
                                  : field.value.filter((value) => value !== benefit.id);
                                field.onChange(updatedBenefits);
                              }}
                            />
                            <label htmlFor={benefit.id} className="text-sm font-medium leading-none">
                              {benefit.label}
                            </label>
                          </div>
                        ))}
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="existingCards"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Existing Credit Cards (Optional)</FormLabel>
                      <FormDescription>
                        Select any credit cards you already own
                      </FormDescription>
                      <div className="flex flex-wrap gap-2 mt-2">
                        {POPULAR_CARDS.map((card) => {
                          const isSelected = field.value?.includes(card.id);
                          return (
                            <Badge
                              key={card.id}
                              variant={isSelected ? "default" : "outline"}
                              className={`cursor-pointer ${isSelected ? "bg-primary" : ""}`}
                              onClick={() => {
                                const updatedCards = isSelected
                                  ? (field.value || []).filter((value) => value !== card.id)
                                  : [...(field.value || []), card.id];
                                field.onChange(updatedCards);
                              }}
                            >
                              {card.label}
                            </Badge>
                          );
                        })}
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            )}

            {/* Navigation buttons */}
            <div className="flex justify-between pt-4">
              {currentStep > 1 ? (
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={handlePrevStep}
                >
                  Previous
                </Button>
              ) : (
                <div>{/* Empty div for spacing */}</div>
              )}

              {currentStep === totalSteps ? (
                <Button 
                  type="submit" 
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Processing
                    </>
                  ) : (
                    "Save Financial Profile"
                  )}
                </Button>
              ) : (
                <Button 
                  type="button" 
                  onClick={handleNextStep}
                >
                  Next
                </Button>
              )}
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
} 