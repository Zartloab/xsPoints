import { useQuery } from "@tanstack/react-query";
import { Loader2, ArrowRight, Sparkles } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Link } from "wouter";

// Types for recommendations
interface ProgramRecommendation {
  program: string;
  reason: string;
  potentialValue: string;
  conversionPath?: string;
}

interface TransactionRecommendation {
  fromProgram: string;
  toProgram: string;
  amount: number;
  estimatedValue: string;
  reasoning: string;
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

export default function MiniRecommendationPanel() {
  const { data: recommendations, isLoading, error } = useQuery<UserRecommendation>({
    queryKey: ["/api/recommendations"],
    refetchOnWindowFocus: false,
  });

  // Get program color based on name
  const getProgramColor = (program: string) => {
    switch (program.toUpperCase()) {
      case "QANTAS": return "bg-red-100 text-red-800 border-red-200";
      case "GYG": return "bg-emerald-100 text-emerald-800 border-emerald-200";
      case "XPOINTS": return "bg-blue-100 text-blue-800 border-blue-200";
      case "VELOCITY": return "bg-purple-100 text-purple-800 border-purple-200";
      case "AMEX": return "bg-indigo-100 text-indigo-800 border-indigo-200";
      case "FLYBUYS": return "bg-amber-100 text-amber-800 border-amber-200";
      case "HILTON": return "bg-teal-100 text-teal-800 border-teal-200";
      case "MARRIOTT": return "bg-sky-100 text-sky-800 border-sky-200";
      case "AIRBNB": return "bg-pink-100 text-pink-800 border-pink-200";
      case "DELTA": return "bg-purple-100 text-purple-800 border-purple-200";
      default: return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  if (isLoading) {
    return (
      <Card className="w-full">
        <CardContent className="pt-6 flex items-center justify-center h-[200px]">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  if (error || !recommendations) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Sparkles className="h-5 w-5 text-blue-500" />
            AI Recommendations
            <Badge className="ml-1 bg-blue-100 text-blue-800 border border-blue-200">New</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <p className="text-sm text-muted-foreground">
            Get personalized AI-powered recommendations to maximize the value of your loyalty points.
          </p>
        </CardContent>
        <CardFooter>
          <Link href="/recommendations">
            <Button className="w-full">View Recommendations</Button>
          </Link>
        </CardFooter>
      </Card>
    );
  }

  // Check if we have any recommendations
  const hasProgramRecs = recommendations.programRecommendations && recommendations.programRecommendations.length > 0;
  const hasTransactionRecs = recommendations.transactionRecommendations && recommendations.transactionRecommendations.length > 0;
  
  // Get top recommendation to display
  const topProgramRec = hasProgramRecs ? recommendations.programRecommendations![0] : null;
  const topTransactionRec = hasTransactionRecs ? recommendations.transactionRecommendations![0] : null;

  return (
    <Card className="w-full">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Sparkles className="h-5 w-5 text-blue-500" />
          AI Recommendations
          <Badge className="ml-1 bg-blue-100 text-blue-800 border border-blue-200">New</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0 space-y-4">
        <p className="text-sm text-muted-foreground">
          {recommendations.description}
        </p>

        {topProgramRec && (
          <div className="rounded-md border p-3 space-y-1">
            <div className="flex justify-between items-center">
              <h4 className="font-medium text-sm">Focus on {topProgramRec.program}</h4>
              <Badge variant="outline" className={getProgramColor(topProgramRec.program)}>
                {topProgramRec.program}
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground line-clamp-2">{topProgramRec.reason}</p>
          </div>
        )}

        {topTransactionRec && (
          <div className="rounded-md border p-3 space-y-1">
            <div className="flex justify-between items-center">
              <h4 className="font-medium text-sm">Recommended Conversion</h4>
              <div className="flex items-center gap-1">
                <Badge variant="outline" className={getProgramColor(topTransactionRec.fromProgram)}>
                  {topTransactionRec.fromProgram}
                </Badge>
                <ArrowRight className="h-3 w-3" />
                <Badge variant="outline" className={getProgramColor(topTransactionRec.toProgram)}>
                  {topTransactionRec.toProgram}
                </Badge>
              </div>
            </div>
            <p className="text-xs text-muted-foreground line-clamp-2">
              Convert {topTransactionRec.amount.toLocaleString()} points for {topTransactionRec.estimatedValue}
            </p>
          </div>
        )}
      </CardContent>
      <CardFooter>
        <Link href="/recommendations">
          <Button className="w-full">View All Recommendations</Button>
        </Link>
      </CardFooter>
    </Card>
  );
}