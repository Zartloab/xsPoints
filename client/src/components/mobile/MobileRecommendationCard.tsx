import React from 'react';
import { Link } from 'wouter';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Sparkles, ArrowRight, Loader2 } from 'lucide-react';

// Types for recommendations
interface ProgramRecommendation {
  program: string;
  reason: string;
  potentialValue: string;
}

interface TransactionRecommendation {
  fromProgram: string;
  toProgram: string;
  amount: number;
  estimatedValue: string;
}

interface UserRecommendation {
  userId: number;
  timestamp: Date;
  recommendationType: 'program' | 'conversion' | 'general';
  title: string;
  description: string;
  programRecommendations?: ProgramRecommendation[];
  transactionRecommendations?: TransactionRecommendation[];
}

const MobileRecommendationCard = () => {
  const { data: recommendations, isLoading } = useQuery<UserRecommendation>({
    queryKey: ['/api/recommendations'],
    refetchOnWindowFocus: false,
  });
  
  // Get program color based on name
  const getProgramColor = (program: string) => {
    switch (program.toUpperCase()) {
      case "QANTAS": return "bg-red-100 text-red-800";
      case "GYG": return "bg-emerald-100 text-emerald-800";
      case "XPOINTS": return "bg-blue-100 text-blue-800";
      case "VELOCITY": return "bg-purple-100 text-purple-800";
      case "AMEX": return "bg-indigo-100 text-indigo-800";
      case "FLYBUYS": return "bg-amber-100 text-amber-800";
      case "HILTON": return "bg-teal-100 text-teal-800";
      case "MARRIOTT": return "bg-sky-100 text-sky-800";
      case "AIRBNB": return "bg-pink-100 text-pink-800";
      case "DELTA": return "bg-purple-100 text-purple-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  if (isLoading) {
    return (
      <Card className="border-none overflow-hidden bg-gradient-to-r from-blue-50 to-indigo-50">
        <CardContent className="p-4">
          <div className="flex items-center justify-center py-4">
            <Loader2 className="h-5 w-5 animate-spin text-blue-500" />
          </div>
        </CardContent>
      </Card>
    );
  }

  // Check if we have recommendations
  const hasRecommendations = recommendations && 
    ((recommendations.programRecommendations && recommendations.programRecommendations.length > 0) || 
     (recommendations.transactionRecommendations && recommendations.transactionRecommendations.length > 0));
  
  if (!hasRecommendations) {
    return (
      <Card className="border-none overflow-hidden bg-gradient-to-r from-blue-50 to-indigo-50">
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-full bg-blue-100 text-blue-500">
                <Sparkles size={16} />
              </div>
              <div>
                <div className="text-sm font-medium">AI Recommendations</div>
                <Badge className="mt-1 text-[10px] bg-blue-100 text-blue-700 hover:bg-blue-100">NEW</Badge>
              </div>
            </div>
          </div>
          <div className="mt-3 text-xs text-muted-foreground">
            Get personalized AI recommendations to maximize your loyalty points value
          </div>
          <div className="mt-3">
            <Link href="/recommendations">
              <Button size="sm" className="w-full">View Recommendations</Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Get top recommendation to display
  const topProgramRec = recommendations.programRecommendations?.[0];
  const topTransactionRec = recommendations.transactionRecommendations?.[0];
  
  // Determine which recommendation to show (prefer transaction if available)
  const showTransactionRec = topTransactionRec !== undefined;
  const recommendationToShow = showTransactionRec ? topTransactionRec : topProgramRec;

  if (!recommendationToShow) {
    return null;
  }

  return (
    <Card className="border-none overflow-hidden bg-gradient-to-r from-blue-50 to-indigo-50">
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-full bg-blue-100 text-blue-500">
              <Sparkles size={16} />
            </div>
            <div>
              <div className="text-sm font-medium">AI Recommendations</div>
              <Badge className="mt-1 text-[10px] bg-blue-100 text-blue-700 hover:bg-blue-100">NEW</Badge>
            </div>
          </div>
        </div>
        
        {showTransactionRec ? (
          <div className="mt-3">
            <div className="flex justify-between items-center">
              <div className="text-xs font-medium">Recommended Conversion</div>
              <div className="flex items-center gap-1">
                <Badge variant="outline" className={`text-[10px] ${getProgramColor(topTransactionRec.fromProgram)}`}>
                  {topTransactionRec.fromProgram}
                </Badge>
                <ArrowRight className="h-3 w-3" />
                <Badge variant="outline" className={`text-[10px] ${getProgramColor(topTransactionRec.toProgram)}`}>
                  {topTransactionRec.toProgram}
                </Badge>
              </div>
            </div>
            <div className="mt-1 text-xs">
              Convert <span className="font-medium">{topTransactionRec.amount.toLocaleString()}</span> points for an estimated value of <span className="font-medium">{topTransactionRec.estimatedValue}</span>
            </div>
          </div>
        ) : (
          <div className="mt-3">
            <div className="flex justify-between items-center">
              <div className="text-xs font-medium">Focus on {topProgramRec?.program}</div>
              {topProgramRec && (
                <Badge variant="outline" className={`text-[10px] ${getProgramColor(topProgramRec.program)}`}>
                  {topProgramRec.program}
                </Badge>
              )}
            </div>
            <div className="mt-1 text-xs line-clamp-2">
              {topProgramRec?.reason}
            </div>
          </div>
        )}
        
        <div className="mt-3">
          <Link href="/recommendations">
            <Button size="sm" className="w-full">View All Recommendations</Button>
          </Link>
        </div>
      </CardContent>
    </Card>
  );
};

export default MobileRecommendationCard;