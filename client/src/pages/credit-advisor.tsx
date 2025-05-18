import { useState, useEffect } from "react";
import { Loader2, Send, CreditCard } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/hooks/use-auth";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function CreditAdvisor() {
  const [loading, setLoading] = useState(true);
  const [recommendation, setRecommendation] = useState<any>(null);
  const [error, setError] = useState("");
  const { isAuthenticated, user } = useAuth();

  // Automatically fetch recommendation on page load
  useEffect(() => {
    getRecommendation();
  }, []);

  // Function to get a recommendation directly from OpenAI using profile data from MongoDB
  const getRecommendation = async () => {
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
      setRecommendation(data);
    } catch (error) {
      console.error("Error getting recommendation:", error);
      setError("Failed to get recommendation. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto py-8 px-4">
      <h1 className="text-3xl font-bold mb-8">Credit Card Advisor</h1>
      
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto mb-4" />
            <p className="text-lg font-medium">Finding your perfect card match...</p>
            <p className="text-gray-500 mt-2">Analyzing your financial profile with AI</p>
          </div>
        </div>
      ) : error ? (
        <Card className="max-w-3xl mx-auto">
          <CardContent className="pt-6">
            <div className="text-center py-8">
              <p className="text-red-500 text-lg mb-4">{error}</p>
              <Button onClick={getRecommendation}>Try Again</Button>
            </div>
          </CardContent>
        </Card>
      ) : recommendation ? (
        <Card className="max-w-3xl mx-auto">
          <CardHeader>
            <CardTitle className="flex items-center">
              <CreditCard className="mr-2 h-5 w-5" />
              Your Recommended Credit Card
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              <div>
                <h3 className="text-2xl font-bold text-primary">{recommendation.cardName}</h3>
                <p className="text-gray-600 text-lg">{recommendation.issuer}</p>
              </div>
              
              {recommendation.matchReason && (
                <div className="bg-primary/5 p-5 rounded-lg">
                  <h4 className="font-medium text-lg mb-2">Why This Card Is Right For You:</h4>
                  <p className="text-gray-700">{recommendation.matchReason}</p>
                </div>
              )}
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="font-bold mb-3 text-gray-700">Card Details</h4>
                  <div className="space-y-2">
                    <p><span className="font-medium">Type:</span> {recommendation.cardType}</p>
                    <p><span className="font-medium">Annual Fee:</span> ₹{recommendation.annualFee}</p>
                    {recommendation.matchScore && (
                      <p><span className="font-medium">Match Score:</span> {recommendation.matchScore}%</p>
                    )}
                  </div>
                </div>
                
                {recommendation.rewardsRate && (
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
                  <h4 className="font-bold mb-2 text-yellow-800">Sign-up Bonus:</h4>
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
                <Button size="lg" className="px-8">Apply Now</Button>
              </div>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card className="max-w-3xl mx-auto">
          <CardContent>
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <p className="text-lg mb-4">No recommendation available</p>
              <Button onClick={getRecommendation}>Get Recommendation</Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
} 