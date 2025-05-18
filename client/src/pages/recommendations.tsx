import { useState, useEffect } from "react";
import { Loader2, CreditCard, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useAuth } from "@/hooks/use-auth";

// Define the card recommendation type
interface CardRecommendation {
  cardName: string;
  issuer: string;
  cardType: string;
  annualFee?: number;
  matchScore?: number;
  matchReason?: string;
  benefitsSummary?: string[];
  rewardsRate?: Record<string, string>;
  signupBonus?: string;
  primaryBenefits?: string[];
  imageUrl?: string;
  applyUrl?: string;
}

// Fallback data to use when API fails
const FALLBACK_DATA: CardRecommendation[] = [
  {
    cardName: "HDFC Diners Club Black",
    issuer: "HDFC Bank",
    cardType: "Travel Rewards",
    annualFee: 10000,
    matchScore: 95,
    matchReason: "High rewards on travel and dining with premium travel benefits",
    benefitsSummary: [
      "Airport lounge access worldwide",
      "Milestone benefits up to ₹10,000", 
      "10X rewards on select merchants"
    ]
  },
  {
    cardName: "Amazon Pay ICICI Card",
    issuer: "ICICI Bank",
    cardType: "Cashback",
    annualFee: 0,
    matchScore: 90,
    matchReason: "Strong cashback benefits with no annual fee",
    benefitsSummary: [
      "5% cashback on Amazon.in",
      "2% cashback on partner merchants",
      "1% cashback on all other spends"
    ]
  }
];

// Function to safely parse JSON and log details if it fails
async function safeJsonParse(response: Response): Promise<any> {
  try {
    const text = await response.text();
    console.log("Raw API response text:", text);
    
    try {
      return JSON.parse(text);
    } catch (parseError) {
      console.error("JSON parse error:", parseError);
      console.log("Invalid JSON response:", text);
      throw new Error("Invalid JSON response from server");
    }
  } catch (error) {
    console.error("Error reading response:", error);
    throw error;
  }
}

// Simple component to show recommendations
export default function Recommendations() {
  const [data, setData] = useState<CardRecommendation[]>([]);
  const [loading, setLoading] = useState(false); // Don't start in loading state
  const [error, setError] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [authStatus, setAuthStatus] = useState<any>(null);
  const [serverAuthenticated, setServerAuthenticated] = useState(false);
  const [hasLoaded, setHasLoaded] = useState(false);
  const { isAuthenticated, user, login, isLoading } = useAuth();

  // Initial data setup - do not load from API automatically
  useEffect(() => {
    // Just set fallback data to avoid the loading state
    setData(FALLBACK_DATA);
    setLoading(false);
  }, []); // Empty deps - runs once on mount only

  // Function to check auth status and fix session if needed
  const checkAuthStatus = async () => {
    try {
      console.log("Manual auth check initiated");
      const response = await fetch('/api/auth/status', {
        credentials: 'include',
        headers: {
          'X-Auth-User-ID': user?.id || '',
        }
      });
      
      if (response.ok) {
        const status = await response.json();
        console.log("Auth status check result:", status);
        setAuthStatus(status);
        
        // If server thinks we're authenticated but client doesn't,
        // set a local flag to override the auth state
        if (status.isAuthenticated && !isAuthenticated) {
          console.log("Server session is authenticated but client isn't - using server auth state");
          setServerAuthenticated(true);
        }
        
        return status;
      }
    } catch (error) {
      console.error("Error checking auth status:", error);
    }
    return null;
  };

  // Function to load recommendations, using server auth state if needed
  async function loadRecommendations(showRefreshing = false, statusOverride: any = null) {
    // Prevent duplicate loads unless explicitly refreshing
    if (hasLoaded && !showRefreshing) {
      console.log("Already loaded recommendations, skipping duplicate load");
      return;
    }
    
    if (showRefreshing) {
      setIsRefreshing(true);
    }
    
    console.log("Starting to load recommendations...");
    console.log("Authentication state:", { 
      clientAuth: isAuthenticated, 
      serverAuth: serverAuthenticated,
      isLoading, 
      userId: user?.id,
      statusOverride: !!statusOverride
    });
    
    // Use fallback data regardless of auth state
    // This ensures users always see something while auth issues are being resolved
    try {
      // Check if we're authenticated either on client or server
      // Use override if provided
      const effectivelyAuthenticated = isAuthenticated || 
                                       serverAuthenticated || 
                                       (statusOverride?.isAuthenticated === true) || 
                                       (authStatus?.isAuthenticated === true);
      
      console.log("Effective authentication:", effectivelyAuthenticated);
      
      if (effectivelyAuthenticated) {
        // Try to load from API only if authenticated
        const apiUrl = '/api/recommendations';
        console.log(`Fetching from API with effective auth: ${effectivelyAuthenticated}`);
        
        // Use auth ID from various possible sources
        const authId = user?.id || 
                       (statusOverride?.sessionAuth0Id) || 
                       authStatus?.sessionAuth0Id || 
                       statusOverride?.sessionUserId ||
                       authStatus?.sessionUserId ||
                       '';
                       
        console.log("Using auth ID:", authId);
        
        const response = await fetch(apiUrl, {
          credentials: 'include',
          cache: 'no-store',
          headers: {
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            'Pragma': 'no-cache',
            'X-Auth-User-ID': authId,
          }
        });
        console.log(`API response status: ${response.status}`);
        
        if (!response.ok) {
          throw new Error(`API returned error status: ${response.status}`);
        }
        
        const responseData = await safeJsonParse(response);
        console.log("API response data:", responseData);
        
        if (responseData) {
          if (Array.isArray(responseData) && responseData.length > 0) {
            console.log(`Found ${responseData.length} recommendations from API`);
            setData(responseData);
            setLoading(false);
            setIsRefreshing(false);
            setHasLoaded(true);
            return;
          } else if (responseData.recommendations && Array.isArray(responseData.recommendations)) {
            console.log("API returned recommendations in object:", responseData.recommendations.length);
            setData(responseData.recommendations);
            setLoading(false);
            setIsRefreshing(false);
            setHasLoaded(true);
            return;
          }
        }
      } else {
        console.log("Not effectively authenticated, will use fallback data");
      }
      
      // Fallback for any other case
      console.log("Using fallback data");
      setData(FALLBACK_DATA);
    } catch (error) {
      console.error("Error loading recommendations:", error);
      setError(`Failed to load recommendations: ${error instanceof Error ? error.message : String(error)}`);
      
      // Use fallback data when there's an error
      console.log("Using fallback data due to error");
      setData(FALLBACK_DATA);
    } finally {
      console.log("Finished loading process, setting loading to false");
      setLoading(false);
      setIsRefreshing(false);
      setHasLoaded(true); // Mark as loaded
    }
  }

  // Handle refresh button click
  const handleRefresh = async () => {
    // Clear existing recommendations first
    try {
      // Check if we're authenticated either on client or server
      const effectivelyAuthenticated = isAuthenticated || serverAuthenticated || (authStatus?.isAuthenticated);
      
      if (!effectivelyAuthenticated) {
        console.log("Not authenticated, can't refresh");
        return;
      }
      
      setIsRefreshing(true);
      
      // Get auth ID from various possible sources
      const authId = user?.id || authStatus?.sessionAuth0Id || '';
      
      await fetch('/api/recommendations/regenerate', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          'X-Auth-User-ID': authId,
        }
      });
      
      // Then load new recommendations
      loadRecommendations(true);
    } catch (error) {
      console.error("Error regenerating recommendations:", error);
      loadRecommendations(true);
    }
  };

  // Show loading state for minimal time
  if (loading && data.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <Loader2 className="h-12 w-12 mx-auto animate-spin" />
          <p className="mt-4">Loading recommendations...</p>
        </div>
      </div>
    );
  }

  // Show error state if we have an error but no data
  if (error && data.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <p className="text-red-500 font-bold">Error:</p>
          <p className="mt-2">{error}</p>
          <Button 
            className="mt-4"
            onClick={() => window.location.reload()}
          >
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  console.log("Rendering recommendations page with data:", data);
  
  // Show recommendations (we should always have data here)
  return (
    <div className="container mx-auto py-6 px-4">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Your Credit Card Recommendations</h1>
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button 
                variant="outline" 
                size="icon" 
                onClick={handleRefresh} 
                disabled={isRefreshing}
              >
                <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Refresh recommendations</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>
      
      {!isAuthenticated && !serverAuthenticated && !authStatus?.isAuthenticated && (
        <div className="mb-6 p-4 bg-purple-50 border border-purple-200 rounded-md flex flex-col sm:flex-row justify-between items-center gap-4">
          <div>
            <p className="text-purple-800 font-medium">
              Showing default recommendations
            </p>
            <p className="text-sm text-purple-600 mt-1">
              Log in or use the button to see personalized recommendations
            </p>
          </div>
          <Button 
            className="whitespace-nowrap"
            variant="default" 
            onClick={() => {
              // Check auth status and load recommendations if authenticated
              checkAuthStatus().then(status => {
                if (status?.isAuthenticated) {
                  loadRecommendations(true, status);
                } else {
                  login();
                }
              });
            }}
          >
            Get Personalized Recommendations
          </Button>
        </div>
      )}
      
      {error && (
        <div className="mb-6 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
          <p className="text-yellow-800 text-sm">
            Note: Using fallback recommendations due to an error.
          </p>
        </div>
      )}
      
      {/* Small diagnostic info at the top */}
      <div className="mb-6 p-2 bg-gray-50 border border-gray-200 rounded-md text-xs">
        <details>
          <summary className="cursor-pointer font-medium">
            Diagnostic Info (Click to expand)
          </summary>
          <div className="mt-2 text-gray-700">
            <p><b>Client Auth:</b> {isAuthenticated ? 'Authenticated ✅' : 'Not authenticated ❌'} 
              {isLoading ? ' (Loading...)' : ''}</p>
            <p><b>Server Auth:</b> {serverAuthenticated || (authStatus?.isAuthenticated) ? 'Authenticated ✅' : 'Not authenticated ❌'}</p>
            <p><b>Effective Auth:</b> {(isAuthenticated || serverAuthenticated || (authStatus?.isAuthenticated)) ? 'Authenticated ✅' : 'Not authenticated ❌'}</p>
            <p><b>Client User ID:</b> {user?.id || 'None'}</p>
            <p><b>Server User ID:</b> {authStatus?.sessionAuth0Id || authStatus?.sessionUserId || 'None'}</p>
            <p><b>Server Auth Status:</b> </p>
            {authStatus ? (
              <pre className="mt-1 p-2 bg-gray-100 overflow-auto text-xs">
                {JSON.stringify(authStatus, null, 2)}
              </pre>
            ) : (
              <p>Not available</p>
            )}
            <div className="mt-2 flex flex-wrap gap-2">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => {
                  // Just check status without triggering loads
                  checkAuthStatus().then(status => {
                    console.log("Manual auth check completed");
                  });
                }}
                className="text-xs h-7"
              >
                Check Auth Status
              </Button>
              <Button 
                variant="default" 
                size="sm" 
                onClick={() => {
                  const status = authStatus;
                  if (status?.isAuthenticated) {
                    console.log("Force loading with server auth...");
                    // Set refresh to true to explicitly force a reload
                    loadRecommendations(true, status);
                  } else {
                    // Re-check auth first
                    checkAuthStatus().then(newStatus => {
                      if (newStatus?.isAuthenticated) {
                        console.log("Force loading with new server auth...");
                        loadRecommendations(true, newStatus);
                      } else {
                        console.log("No auth available, using fallback");
                        setData(FALLBACK_DATA);
                        setLoading(false);
                      }
                    });
                  }
                }}
                className="text-xs h-7"
              >
                Force Load with Server Auth
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => window.location.reload()}
                className="text-xs h-7"
              >
                Reload Page
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => {
                  document.cookie = "auth0.is.authenticated=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
                  login();
                }}
                className="text-xs h-7"
              >
                Login Again
              </Button>
            </div>
          </div>
        </details>
      </div>
      
      <div className="space-y-6">
        {data.map((card, index) => (
          <Card key={index} className="overflow-hidden">
            <CardContent className="p-6">
              <div className="flex flex-col gap-4">
                {/* Card header */}
                <div className="flex items-center gap-3">
                  <CreditCard className="h-10 w-10 text-purple-600" />
                  <div>
                    <h2 className="text-xl font-bold">{card.cardName}</h2>
                    <p className="text-gray-600">{card.issuer}</p>
                  </div>
                  {card.matchScore && (
                    <div className="ml-auto bg-purple-100 text-purple-800 px-3 py-1 rounded-full text-sm font-medium">
                      {card.matchScore}% Match
                    </div>
                  )}
                </div>
                
                {/* Card details */}
                <div className="space-y-2">
                  <p><span className="font-medium">Card Type:</span> {card.cardType}</p>
                  {card.annualFee !== undefined && (
                    <p><span className="font-medium">Annual Fee:</span> ₹{card.annualFee.toLocaleString()}</p>
                  )}
                  {card.matchReason && (
                    <p><span className="font-medium">Why this card:</span> {card.matchReason}</p>
                  )}
                </div>
                
                {/* Rewards rates if available */}
                {card.rewardsRate && Object.keys(card.rewardsRate).length > 0 && (
                  <div>
                    <h3 className="font-medium mb-2">Rewards Rates:</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-1">
                      {Object.entries(card.rewardsRate).map(([category, rate], i) => (
                        <p key={i} className="text-sm">
                          <span className="font-medium capitalize">{category}:</span> {rate}
                        </p>
                      ))}
                    </div>
                  </div>
                )}
                
                {/* Signup bonus if available */}
                {card.signupBonus && (
                  <div>
                    <h3 className="font-medium mb-1">Signup Bonus:</h3>
                    <p className="text-sm">{card.signupBonus}</p>
                  </div>
                )}
                
                {/* Benefits */}
                {card.benefitsSummary && card.benefitsSummary.length > 0 && (
                  <div>
                    <h3 className="font-medium mb-2">Key Benefits:</h3>
                    <ul className="list-disc pl-5 space-y-1">
                      {card.benefitsSummary.map((benefit: string, i: number) => (
                        <li key={i}>{benefit}</li>
                      ))}
                    </ul>
                  </div>
                )}
                
                {/* Apply button with external link if available */}
                <div className="mt-4">
                  <Button 
                    className="bg-purple-700 hover:bg-purple-800"
                    onClick={() => card.applyUrl ? window.open(card.applyUrl, '_blank') : null}
                  >
                    Apply Now
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
} 