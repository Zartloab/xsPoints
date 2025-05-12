import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Loader2, ArrowRight, Lightbulb, BarChart3, ArrowRightLeft } from "lucide-react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

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

export default function RecommendationPanel() {
  const [activeTab, setActiveTab] = useState<string>("all");
  
  const { data: recommendations, isLoading, error, refetch } = useQuery<UserRecommendation>({
    queryKey: ["/api/recommendations"],
    refetchOnWindowFocus: false,
  });

  // Format date to a readable string
  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

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

  // Generate an icon based on recommendation type
  const getRecommendationIcon = (type: string) => {
    switch (type) {
      case "program": return <Lightbulb className="h-5 w-5 text-amber-500" />;
      case "conversion": return <ArrowRightLeft className="h-5 w-5 text-green-500" />;
      case "general": return <BarChart3 className="h-5 w-5 text-blue-500" />;
      default: return <Lightbulb className="h-5 w-5 text-amber-500" />;
    }
  };

  if (isLoading) {
    return (
      <Card className="w-full">
        <CardContent className="pt-6 flex items-center justify-center min-h-[200px]">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle>AI Recommendations</CardTitle>
          <CardDescription>
            Get personalized advice to maximize the value of your loyalty points
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-red-500">Unable to load recommendations. Please try again later.</p>
        </CardContent>
        <CardFooter>
          <Button variant="outline" onClick={() => refetch()}>Try Again</Button>
        </CardFooter>
      </Card>
    );
  }

  if (!recommendations) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle>AI Recommendations</CardTitle>
          <CardDescription>
            Get personalized advice to maximize the value of your loyalty points
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">No recommendations available yet.</p>
        </CardContent>
        <CardFooter>
          <Button variant="outline" onClick={() => refetch()}>Get Recommendations</Button>
        </CardFooter>
      </Card>
    );
  }

  // Both types of recommendations
  const hasProgramRecommendations = recommendations.programRecommendations && recommendations.programRecommendations.length > 0;
  const hasTransactionRecommendations = recommendations.transactionRecommendations && recommendations.transactionRecommendations.length > 0;

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              {getRecommendationIcon(recommendations.recommendationType)}
              {recommendations.title}
            </CardTitle>
            <CardDescription>
              Last updated: {recommendations.timestamp ? formatDate(new Date(recommendations.timestamp)) : 'Just now'}
            </CardDescription>
          </div>
          <Button size="sm" variant="outline" onClick={() => refetch()}>
            Refresh
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <p className="mb-6 text-sm text-muted-foreground">{recommendations.description}</p>

        {(hasProgramRecommendations || hasTransactionRecommendations) && (
          <Tabs defaultValue="all" value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="all">All Recommendations</TabsTrigger>
              {hasProgramRecommendations && <TabsTrigger value="programs">Program Focus</TabsTrigger>}
              {hasTransactionRecommendations && <TabsTrigger value="transactions">Suggested Trades</TabsTrigger>}
            </TabsList>
            
            <TabsContent value="all" className="mt-4 space-y-4">
              {hasProgramRecommendations && recommendations.programRecommendations!.slice(0, 2).map((rec, idx) => (
                <Card key={`program-${idx}`} className="overflow-hidden">
                  <div className={`h-1 ${getProgramColor(rec.program).split(' ')[0]} bg-opacity-100`}></div>
                  <CardHeader className="py-4">
                    <CardTitle className="text-base flex justify-between">
                      <span>Focus on {rec.program}</span>
                      <Badge variant="outline" className={getProgramColor(rec.program)}>
                        {rec.program}
                      </Badge>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="py-2">
                    <p className="text-sm">{rec.reason}</p>
                    {rec.conversionPath && (
                      <div className="mt-2 flex items-center gap-1 text-xs text-muted-foreground">
                        <span>Conversion path:</span>
                        <div className="flex items-center">
                          {rec.conversionPath.split('->').map((program, idx, arr) => (
                            <span key={idx} className="flex items-center">
                              <Badge variant="outline" className={`${getProgramColor(program.trim())} text-[10px]`}>
                                {program.trim()}
                              </Badge>
                              {idx < arr.length - 1 && <ArrowRight className="h-3 w-3 mx-1" />}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </CardContent>
                  <CardFooter className="bg-muted/20 py-2">
                    <p className="text-xs font-medium">Potential value: {rec.potentialValue}</p>
                  </CardFooter>
                </Card>
              ))}
              
              {hasTransactionRecommendations && recommendations.transactionRecommendations!.slice(0, 2).map((rec, idx) => (
                <Card key={`transaction-${idx}`} className="overflow-hidden">
                  <div className="h-1 bg-green-400"></div>
                  <CardHeader className="py-4">
                    <CardTitle className="text-base flex justify-between">
                      <span>Convert {rec.amount.toLocaleString()} points</span>
                      <div className="flex items-center gap-1">
                        <Badge variant="outline" className={getProgramColor(rec.fromProgram)}>
                          {rec.fromProgram}
                        </Badge>
                        <ArrowRight className="h-3 w-3" />
                        <Badge variant="outline" className={getProgramColor(rec.toProgram)}>
                          {rec.toProgram}
                        </Badge>
                      </div>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="py-2">
                    <p className="text-sm">{rec.reasoning}</p>
                  </CardContent>
                  <CardFooter className="bg-muted/20 py-2">
                    <p className="text-xs font-medium">Estimated value: {rec.estimatedValue}</p>
                  </CardFooter>
                </Card>
              ))}
            </TabsContent>
            
            {hasProgramRecommendations && (
              <TabsContent value="programs" className="mt-4 space-y-4">
                {recommendations.programRecommendations!.map((rec, idx) => (
                  <Card key={`program-full-${idx}`} className="overflow-hidden">
                    <div className={`h-1 ${getProgramColor(rec.program).split(' ')[0]} bg-opacity-100`}></div>
                    <CardHeader className="py-4">
                      <CardTitle className="text-base flex justify-between">
                        <span>Focus on {rec.program}</span>
                        <Badge variant="outline" className={getProgramColor(rec.program)}>
                          {rec.program}
                        </Badge>
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="py-2">
                      <p className="text-sm">{rec.reason}</p>
                      {rec.conversionPath && (
                        <div className="mt-2 flex items-center gap-1 text-xs text-muted-foreground">
                          <span>Conversion path:</span>
                          <div className="flex items-center">
                            {rec.conversionPath.split('->').map((program, idx, arr) => (
                              <span key={idx} className="flex items-center">
                                <Badge variant="outline" className={`${getProgramColor(program.trim())} text-[10px]`}>
                                  {program.trim()}
                                </Badge>
                                {idx < arr.length - 1 && <ArrowRight className="h-3 w-3 mx-1" />}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </CardContent>
                    <CardFooter className="bg-muted/20 py-2">
                      <p className="text-xs font-medium">Potential value: {rec.potentialValue}</p>
                    </CardFooter>
                  </Card>
                ))}
              </TabsContent>
            )}
            
            {hasTransactionRecommendations && (
              <TabsContent value="transactions" className="mt-4 space-y-4">
                {recommendations.transactionRecommendations!.map((rec, idx) => (
                  <Card key={`transaction-full-${idx}`} className="overflow-hidden">
                    <div className="h-1 bg-green-400"></div>
                    <CardHeader className="py-4">
                      <CardTitle className="text-base flex justify-between">
                        <span>Convert {rec.amount.toLocaleString()} points</span>
                        <div className="flex items-center gap-1">
                          <Badge variant="outline" className={getProgramColor(rec.fromProgram)}>
                            {rec.fromProgram}
                          </Badge>
                          <ArrowRight className="h-3 w-3" />
                          <Badge variant="outline" className={getProgramColor(rec.toProgram)}>
                            {rec.toProgram}
                          </Badge>
                        </div>
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="py-2">
                      <p className="text-sm">{rec.reasoning}</p>
                    </CardContent>
                    <CardFooter className="bg-muted/20 py-2">
                      <p className="text-xs font-medium">Estimated value: {rec.estimatedValue}</p>
                    </CardFooter>
                  </Card>
                ))}
              </TabsContent>
            )}
          </Tabs>
        )}
      </CardContent>
    </Card>
  );
}