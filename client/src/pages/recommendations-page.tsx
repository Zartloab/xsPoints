import { Helmet } from "react-helmet";
import { Sparkles } from "lucide-react";
import RecommendationPanel from "@/components/recommendations/RecommendationPanel";

export default function RecommendationsPage() {
  return (
    <div className="container py-6">
      <Helmet>
        <title>AI Recommendations | xPoints Exchange</title>
        <meta 
          name="description" 
          content="Get AI-powered personalized recommendations to maximize the value of your loyalty points on xPoints Exchange."
        />
      </Helmet>
      
      <div className="flex items-center gap-2 mb-6">
        <Sparkles className="h-6 w-6 text-blue-500" />
        <h1 className="text-2xl font-bold">Smart Recommendations</h1>
      </div>
      
      <div className="grid gap-6">
        <p className="text-muted-foreground">
          Our AI-powered recommendation engine analyzes your loyalty point balances, 
          transaction history, and current exchange rates to provide personalized 
          recommendations that help you maximize the value of your points.
        </p>
        
        <RecommendationPanel />
        
        <div className="mt-8 border rounded-lg p-6 bg-blue-50 border-blue-100">
          <h2 className="text-lg font-medium mb-2 text-blue-700">How it works</h2>
          <p className="text-sm text-blue-600 mb-4">
            Our AI engine analyzes several factors to create personalized recommendations:
          </p>
          
          <div className="grid gap-4 md:grid-cols-3">
            <div className="bg-white p-4 rounded-md border border-blue-100">
              <h3 className="font-medium text-blue-800 mb-1">Your Point Balances</h3>
              <p className="text-xs text-muted-foreground">
                We look at all your loyalty program balances to identify opportunities for 
                point consolidation or strategic conversions.
              </p>
            </div>
            
            <div className="bg-white p-4 rounded-md border border-blue-100">
              <h3 className="font-medium text-blue-800 mb-1">Transaction History</h3>
              <p className="text-xs text-muted-foreground">
                Your past conversions help us understand your preferences and identify 
                patterns to suggest optimal future transactions.
              </p>
            </div>
            
            <div className="bg-white p-4 rounded-md border border-blue-100">
              <h3 className="font-medium text-blue-800 mb-1">Market Rates</h3>
              <p className="text-xs text-muted-foreground">
                Current exchange rates are analyzed to find the best conversion paths
                and opportunities to maximize value through multi-step conversions.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}