import { useState, useEffect } from "react";
import { Loader2, CreditCard, Award, TrendingUp, CheckCircle2, RefreshCw, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/hooks/use-auth";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";

// Define the shape of our card recommendation data
interface CardRecommendation {
  id?: string;
  userId?: string;
  cardName: string;
  issuer: string;
  cardType: string;
  annualFee: string | number;
  rewardsRate: Record<string, string>;
  signupBonus?: string;
  benefitsSummary: string[];
  primaryBenefits: string[];
  matchScore: number;
  matchReason: string;
  imageUrl?: string;
  applyUrl?: string;
  mitcHighlights?: string[];
}

export default function CreditAdvisor() {
  const [loading, setLoading] = useState(true);
  const [recommendations, setRecommendations] = useState<CardRecommendation[]>([]);
  const [error, setError] = useState("");
  const { isAuthenticated, user } = useAuth();
  const [activeCardIndex, setActiveCardIndex] = useState(0);

  // Automatically fetch recommendations on page load
  useEffect(() => {
    getRecommendations();
  }, []);

  // Function to get recommendations directly from the API
  const getRecommendations = async () => {
    try {
      setLoading(true);
      setError("");
      
      // Call our backend which will call OpenAI API
      const response = await fetch("/api/direct-recommendation", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(user?.id && { "X-Auth-User-ID": user.id }),
        },
        body: JSON.stringify({}), // Empty body - server will look up profile from MongoDB
        credentials: "include",
      });
      
      if (!response.ok) {
        throw new Error(`API returned status ${response.status}`);
      }
      
      const data = await response.json();
      
      // Handle the response structure from the backend
      if (data && data.allRecommendations && Array.isArray(data.allRecommendations)) {
        // Backend returns { allRecommendations: [...] }
        setRecommendations(data.allRecommendations);
      } else if (Array.isArray(data)) {
        // Direct array response
        setRecommendations(data);
      } else if (data && typeof data === 'object') {
        // If it's a single object, wrap it in an array
        setRecommendations([data]);
      } else {
        throw new Error("Invalid response format");
      }
    } catch (error) {
      console.error("Error getting recommendations:", error);
      setError("Failed to get recommendations. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto py-8 px-4">
      <h1 className="text-3xl font-bold mb-2">Credit Card Advisor</h1>
      <p className="text-gray-600 mb-8">Personalized credit card recommendations based on your financial profile</p>
      
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto mb-4" />
            <p className="text-lg font-medium">Finding your perfect card matches...</p>
            <p className="text-gray-500 mt-2">Analyzing your financial profile with AI and our credit card database</p>
          </div>
        </div>
      ) : error ? (
        <Card className="max-w-4xl mx-auto">
          <CardContent className="pt-6">
            <div className="text-center py-8">
              <p className="text-red-500 text-lg mb-4">{error}</p>
              <Button onClick={getRecommendations}>Try Again</Button>
            </div>
          </CardContent>
        </Card>
      ) : recommendations && recommendations.length > 0 ? (
        <div className="max-w-4xl mx-auto">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle className="flex items-center">
                  <Award className="mr-2 h-5 w-5" />
                  Top Card Recommendations
                </CardTitle>
                <Button variant="outline" onClick={getRecommendations} size="sm">
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Refresh
                </Button>
              </div>
              <CardDescription>
                We've analyzed your financial profile and found {recommendations.length} credit cards that match your needs
              </CardDescription>
            </CardHeader>
            
            {recommendations.length > 1 ? (
              <Tabs defaultValue="0" className="w-full" onValueChange={(value) => setActiveCardIndex(parseInt(value))}>
                <div className="px-6">
                  <TabsList className={`grid w-full ${recommendations.length <= 5 ? `grid-cols-${recommendations.length}` : 'grid-cols-4 lg:grid-cols-7'}`}>
                    {recommendations.map((card, index) => (
                      <TabsTrigger key={index} value={index.toString()} className="text-xs sm:text-sm">
                        {index === 0 ? "Top Pick" : `Option ${index + 1}`}
                      </TabsTrigger>
                    ))}
                  </TabsList>
                </div>
                
                {recommendations.map((recommendation, index) => (
                  <TabsContent key={index} value={index.toString()} className="pt-2">
                    <CardContent>
                      <div className="space-y-6">
                        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
                          <div>
                            <h3 className="text-2xl font-bold text-primary">{recommendation.cardName}</h3>
                            <p className="text-gray-600">{recommendation.issuer}</p>
                          </div>
                          
                          {recommendation.matchScore && (
                            <div className="flex flex-col items-center bg-primary/10 rounded-lg p-3 min-w-[120px]">
                              <span className="text-sm text-gray-600">Match Score</span>
                              <div className="flex items-center">
                                <span className="text-2xl font-bold text-primary">{recommendation.matchScore}</span>
                                <span className="text-primary">%</span>
                              </div>
                              <Progress value={recommendation.matchScore} className="w-full mt-1" />
                            </div>
                          )}
                        </div>
                        
                        {recommendation.matchReason && (
                          <div className="bg-primary/5 p-5 rounded-lg">
                            <h4 className="font-medium text-lg mb-2 flex items-center">
                              <CheckCircle2 className="mr-2 h-5 w-5 text-primary" />
                              Why This Card Is Right For You:
                            </h4>
                            <p className="text-gray-700">{recommendation.matchReason}</p>
                          </div>
                        )}
                        
                        {recommendation.mitcHighlights && recommendation.mitcHighlights.length > 0 && (
                          <div className="bg-blue-50 p-5 rounded-lg border border-blue-200">
                            <h4 className="font-medium text-lg mb-2 flex items-center">
                              <FileText className="mr-2 h-5 w-5 text-blue-600" />
                              MITC Highlights:
                            </h4>
                            <ul className="list-disc pl-5 space-y-2">
                              {recommendation.mitcHighlights.map((highlight: string, i: number) => (
                                <li key={i} className="text-gray-700">{highlight}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div className="bg-gray-50 p-4 rounded-lg">
                            <h4 className="font-bold mb-3 text-gray-700">Card Details</h4>
                            <div className="space-y-2">
                              <p><span className="font-medium">Type:</span> {recommendation.cardType}</p>
                              <p><span className="font-medium">Annual Fee:</span> {typeof recommendation.annualFee === 'number' 
                                ? `₹${recommendation.annualFee.toLocaleString()}` 
                                : `₹${recommendation.annualFee}`}
                              </p>
                              
                              {recommendation.primaryBenefits && recommendation.primaryBenefits.length > 0 && (
                                <div className="mt-3">
                                  <p className="font-medium">Primary Benefits:</p>
                                  <div className="flex flex-wrap gap-2 mt-1">
                                    {recommendation.primaryBenefits.map((benefit, i) => (
                                      <Badge key={i} variant="secondary">{benefit}</Badge>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                          
                          {recommendation.rewardsRate && Object.keys(recommendation.rewardsRate).length > 0 && (
                            <div className="bg-gray-50 p-4 rounded-lg">
                              <h4 className="font-bold mb-3 text-gray-700">Rewards</h4>
                              <div className="space-y-2">
                                {Object.entries(recommendation.rewardsRate).map(([category, rate]: [string, any]) => (
                                  <p key={category}><span className="font-medium capitalize">{category}:</span> {rate}</p>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                        
                        {recommendation.signupBonus && (
                          <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
                            <h4 className="font-bold mb-2 text-yellow-800 flex items-center">
                              <TrendingUp className="mr-2 h-5 w-5" />
                              Sign-up Bonus:
                            </h4>
                            <p>{recommendation.signupBonus}</p>
                          </div>
                        )}
                        
                        {recommendation.benefitsSummary && recommendation.benefitsSummary.length > 0 && (
                          <div>
                            <h4 className="font-bold mb-3 text-gray-700">Key Benefits</h4>
                            <ul className="list-disc pl-5 space-y-2">
                              {recommendation.benefitsSummary.map((benefit: string, i: number) => (
                                <li key={i} className="text-gray-700">{benefit}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                        
                        <div className="flex justify-center pt-4">
                          <Button size="lg" className="px-8">
                            <CreditCard className="mr-2 h-5 w-5" />
                            Apply Now
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </TabsContent>
                ))}
              </Tabs>
            ) : (
              // Just display the single card without tabs if only one recommendation
              <CardContent>
                <div className="space-y-6">
                  <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
                    <div>
                      <h3 className="text-2xl font-bold text-primary">{recommendations[0].cardName}</h3>
                      <p className="text-gray-600">{recommendations[0].issuer}</p>
                    </div>
                    
                    {recommendations[0].matchScore && (
                      <div className="flex flex-col items-center bg-primary/10 rounded-lg p-3 min-w-[120px]">
                        <span className="text-sm text-gray-600">Match Score</span>
                        <div className="flex items-center">
                          <span className="text-2xl font-bold text-primary">{recommendations[0].matchScore}</span>
                          <span className="text-primary">%</span>
                        </div>
                        <Progress value={recommendations[0].matchScore} className="w-full mt-1" />
                      </div>
                    )}
                  </div>
                  
                  {recommendations[0].matchReason && (
                    <div className="bg-primary/5 p-5 rounded-lg">
                      <h4 className="font-medium text-lg mb-2 flex items-center">
                        <CheckCircle2 className="mr-2 h-5 w-5 text-primary" />
                        Why This Card Is Right For You:
                      </h4>
                      <p className="text-gray-700">{recommendations[0].matchReason}</p>
                    </div>
                  )}
                  
                  {recommendations[0].mitcHighlights && recommendations[0].mitcHighlights.length > 0 && (
                    <div className="bg-blue-50 p-5 rounded-lg border border-blue-200">
                      <h4 className="font-medium text-lg mb-2 flex items-center">
                        <FileText className="mr-2 h-5 w-5 text-blue-600" />
                        MITC Highlights:
                      </h4>
                      <ul className="list-disc pl-5 space-y-2">
                        {recommendations[0].mitcHighlights.map((highlight: string, i: number) => (
                          <li key={i} className="text-gray-700">{highlight}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <h4 className="font-bold mb-3 text-gray-700">Card Details</h4>
                      <div className="space-y-2">
                        <p><span className="font-medium">Type:</span> {recommendations[0].cardType}</p>
                        <p><span className="font-medium">Annual Fee:</span> {typeof recommendations[0].annualFee === 'number' 
                          ? `₹${recommendations[0].annualFee.toLocaleString()}` 
                          : `₹${recommendations[0].annualFee}`}
                        </p>
                        
                        {recommendations[0].primaryBenefits && recommendations[0].primaryBenefits.length > 0 && (
                          <div className="mt-3">
                            <p className="font-medium">Primary Benefits:</p>
                            <div className="flex flex-wrap gap-2 mt-1">
                              {recommendations[0].primaryBenefits.map((benefit, i) => (
                                <Badge key={i} variant="secondary">{benefit}</Badge>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                    
                    {recommendations[0].rewardsRate && Object.keys(recommendations[0].rewardsRate).length > 0 && (
                      <div className="bg-gray-50 p-4 rounded-lg">
                        <h4 className="font-bold mb-3 text-gray-700">Rewards</h4>
                        <div className="space-y-2">
                          {Object.entries(recommendations[0].rewardsRate).map(([category, rate]: [string, any]) => (
                            <p key={category}><span className="font-medium capitalize">{category}:</span> {rate}</p>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                  
                  {recommendations[0].signupBonus && (
                    <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
                      <h4 className="font-bold mb-2 text-yellow-800 flex items-center">
                        <TrendingUp className="mr-2 h-5 w-5" />
                        Sign-up Bonus:
                      </h4>
                      <p>{recommendations[0].signupBonus}</p>
                    </div>
                  )}
                  
                  {recommendations[0].benefitsSummary && recommendations[0].benefitsSummary.length > 0 && (
                    <div>
                      <h4 className="font-bold mb-3 text-gray-700">Key Benefits</h4>
                      <ul className="list-disc pl-5 space-y-2">
                        {recommendations[0].benefitsSummary.map((benefit: string, i: number) => (
                          <li key={i} className="text-gray-700">{benefit}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                  
                  <div className="flex justify-center pt-4">
                    <Button size="lg" className="px-8">
                      <CreditCard className="mr-2 h-5 w-5" />
                      Apply Now
                    </Button>
                  </div>
                </div>
              </CardContent>
            )}
          </Card>
        </div>
      ) : (
        <Card className="max-w-4xl mx-auto">
          <CardContent>
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <p className="text-lg mb-4">No recommendations available</p>
              <Button onClick={getRecommendations}>Get Recommendations</Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
} 