import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

export default function HomePage() {
  return (
    <div className="container mx-auto p-6">
      <div className="flex flex-col items-center justify-center min-h-[70vh] text-center">
        <h1 className="text-4xl md:text-6xl font-bold mb-6">Welcome to CardSavvy</h1>
        <p className="text-xl md:text-2xl mb-8 max-w-2xl">
          Your AI-powered credit card assistant for personalized recommendations
        </p>
        
        <div className="flex gap-4 mb-12">
          <Button asChild size="lg" className="font-bold">
            <a href="/recommendations">Get Personalized Card Recommendation</a>
          </Button>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 w-full max-w-5xl">
          <Card className="p-6">
            <h3 className="text-xl font-bold mb-2">Smart Recommendations</h3>
            <p>Find the perfect credit card based on your income, spending habits, and preferences</p>
          </Card>
          
          <Card className="p-6">
            <h3 className="text-xl font-bold mb-2">AI-Powered Analysis</h3>
            <p>Advanced algorithms evaluate thousands of options to find your ideal card match</p>
          </Card>
          
          <Card className="p-6">
            <h3 className="text-xl font-bold mb-2">Maximize Benefits</h3>
            <p>Get the most value from your spending with targeted rewards and cashback</p>
          </Card>
        </div>
      </div>
    </div>
  );
} 