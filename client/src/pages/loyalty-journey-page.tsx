import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Helmet } from "react-helmet";
import { Loader2, Trophy, TrendingUp, LineChart, ChevronRight } from "lucide-react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { 
  Area, 
  AreaChart, 
  ResponsiveContainer, 
  XAxis, 
  YAxis, 
  Tooltip, 
  PieChart, 
  Pie, 
  Cell,
  Legend,
  BarChart,
  Bar
} from "recharts";
import { useToast } from "@/hooks/use-toast";

// Types for the loyalty journey data
interface LoyaltyJourneyData {
  userId: number;
  username: string;
  membershipTier: string;
  stats: {
    totalTransactions: number;
    totalPointsConverted: number;
    totalFeesPaid: number;
    estimatedSavings: number;
    monthlyActivity: number;
  };
  favoritePrograms: {
    program: string;
    transactionCount: number;
    pointsProcessed: number;
  }[];
  conversionTrends: {
    month: string;
    amount: number;
  }[];
  walletBalances: {
    program: string;
    balance: number;
    dollarValue: number;
  }[];
  milestones: {
    title: string;
    date?: string;
    description: string;
    progress?: number;
  }[];
  recentTransactions: {
    id: number;
    fromProgram: string;
    toProgram: string;
    amountFrom: number;
    amountTo: number;
    timestamp: string;
    feeApplied: number;
    status: string;
  }[];
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d'];

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(value);
};

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
};

const formatMonth = (monthStr: string) => {
  const [year, month] = monthStr.split('-');
  return new Date(parseInt(year), parseInt(month) - 1).toLocaleDateString('en-US', {
    month: 'short',
    year: 'numeric'
  });
};

export default function LoyaltyJourneyPage() {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("overview");
  
  const { data: journeyData, isLoading, error } = useQuery<LoyaltyJourneyData>({
    queryKey: ["/api/loyalty-journey"],
    retry: 1,
  });
  
  useEffect(() => {
    if (error) {
      toast({
        title: "Error loading journey data",
        description: "Unable to load your loyalty journey data. Please try again later.",
        variant: "destructive",
      });
    }
  }, [error, toast]);
  
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="flex flex-col items-center gap-2">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">Loading your loyalty journey...</p>
        </div>
      </div>
    );
  }
  
  if (!journeyData) {
    return <div className="p-4">No journey data available</div>;
  }
  
  return (
    <>
      <Helmet>
        <title>Your Loyalty Journey | xPoints Exchange</title>
        <meta name="description" content="Visualize your loyalty points journey, track milestones, and optimize your rewards across all your loyalty programs." />
      </Helmet>
      
      <div className="container max-w-6xl mx-auto py-10 px-4">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold mb-3">Your Loyalty Journey</h1>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Track your progress, visualize trends, and discover insights to optimize your loyalty points.
          </p>
        </div>
        
        <Tabs defaultValue="overview" value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-5 mb-6">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="milestones">Milestones</TabsTrigger>
            <TabsTrigger value="trends">Conversion Trends</TabsTrigger>
            <TabsTrigger value="programs">Programs</TabsTrigger>
            <TabsTrigger value="wallets">Wallet Value</TabsTrigger>
          </TabsList>
          
          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <StatsCard 
                title="Total Transactions" 
                value={journeyData.stats.totalTransactions.toString()} 
                description="All-time loyalty point exchanges"
                icon={<TrendingUp className="h-5 w-5" />}
              />
              <StatsCard 
                title="Points Converted" 
                value={journeyData.stats.totalPointsConverted.toLocaleString()} 
                description="Total points processed through xPoints"
                icon={<LineChart className="h-5 w-5" />}
              />
              <StatsCard 
                title="Estimated Savings" 
                value={formatCurrency(journeyData.stats.estimatedSavings)} 
                description="Value saved through optimal conversions"
                icon={<Trophy className="h-5 w-5" />}
              />
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <Card className="border-0 shadow-md overflow-hidden">
                <CardHeader className="bg-gradient-to-br from-blue-50 to-white border-b pb-4">
                  <CardTitle>Favorite Programs</CardTitle>
                  <CardDescription>Your most used loyalty programs</CardDescription>
                </CardHeader>
                <CardContent className="h-80 pt-6">
                  {journeyData.favoritePrograms.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={journeyData.favoritePrograms}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          outerRadius={90}
                          fill="#8884d8"
                          dataKey="pointsProcessed"
                          nameKey="program"
                          label={({ program, pointsProcessed }) => `${program}: ${pointsProcessed.toLocaleString()}`}
                        >
                          {journeyData.favoritePrograms.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Legend layout="horizontal" verticalAlign="bottom" align="center" />
                        <Tooltip 
                          formatter={(value) => value.toLocaleString()} 
                          contentStyle={{ 
                            borderRadius: '8px', 
                            boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                            border: 'none' 
                          }}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="flex h-full items-center justify-center">
                      <p className="text-muted-foreground">No program data available yet</p>
                    </div>
                  )}
                </CardContent>
              </Card>
              
              <Card className="border-0 shadow-md overflow-hidden">
                <CardHeader className="bg-gradient-to-br from-blue-50 to-white border-b pb-4">
                  <CardTitle>Recent Activity</CardTitle>
                  <CardDescription>Your latest point conversions</CardDescription>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="divide-y">
                    {journeyData.recentTransactions.length > 0 ? (
                      journeyData.recentTransactions.map((tx) => (
                        <div key={tx.id} className="flex justify-between items-center p-4 hover:bg-gray-50 transition-colors">
                          <div>
                            <div className="flex items-center">
                              <div className="w-2 h-2 rounded-full bg-blue-500 mr-2"></div>
                              <p className="font-medium">
                                {tx.fromProgram} → {tx.toProgram}
                              </p>
                            </div>
                            <p className="text-sm text-muted-foreground mt-1">
                              {formatDate(tx.timestamp)}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="font-medium text-gray-900">
                              {tx.amountFrom.toLocaleString()} → {tx.amountTo.toLocaleString()}
                            </p>
                            <p className="text-sm text-muted-foreground mt-1">
                              {tx.feeApplied > 0 ? `Fee: ${tx.feeApplied.toLocaleString()}` : 'No fee'}
                            </p>
                          </div>
                        </div>
                      ))
                    ) : (
                      <p className="text-muted-foreground text-center py-10">No recent transactions</p>
                    )}
                  </div>
                </CardContent>
                <CardFooter className="bg-gray-50 border-t py-3">
                  <button
                    onClick={() => setActiveTab("trends")}
                    className="flex items-center text-blue-600 text-sm font-medium mx-auto hover:text-blue-800 transition-colors"
                  >
                    View all transactions
                    <ChevronRight className="ml-1 h-4 w-4" />
                  </button>
                </CardFooter>
              </Card>
            </div>
          </TabsContent>
          
          {/* Milestones Tab */}
          <TabsContent value="milestones" className="space-y-6">
            <Card className="border-0 shadow-md overflow-hidden">
              <CardHeader className="bg-gradient-to-br from-blue-50 to-white border-b">
                <CardTitle>Your Loyalty Milestones</CardTitle>
                <CardDescription>Track your achievements and progress</CardDescription>
              </CardHeader>
              <CardContent className="p-6">
                <div className="space-y-8">
                  {journeyData.milestones.length > 0 ? (
                    journeyData.milestones.map((milestone, index) => (
                      <div key={index} className="relative pl-8 pb-8">
                        {/* Timeline connector */}
                        {index < journeyData.milestones.length - 1 && (
                          <div className="absolute left-3 top-6 h-full w-0.5 bg-blue-100"></div>
                        )}
                        
                        {/* Milestone dot */}
                        <div className="absolute left-0 top-1">
                          {milestone.date ? (
                            <div className="h-6 w-6 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center shadow-sm">
                              <CheckIcon className="h-3 w-3 text-white" />
                            </div>
                          ) : milestone.progress !== undefined ? (
                            <div className="h-6 w-6 rounded-full bg-gradient-to-br from-amber-300 to-amber-500 flex items-center justify-center shadow-sm">
                              <Clock className="h-3 w-3 text-white" />
                            </div>
                          ) : (
                            <div className="h-6 w-6 rounded-full border-2 border-gray-200 bg-gray-100"></div>
                          )}
                        </div>
                        
                        {/* Milestone content */}
                        <div className="bg-white rounded-lg border border-gray-100 p-4 shadow-sm hover:shadow-md transition-shadow">
                          <div className="flex justify-between items-center mb-2">
                            <h3 className="font-semibold text-gray-800 flex items-center">
                              <Trophy className="mr-2 h-5 w-5 text-amber-500" />
                              {milestone.title}
                            </h3>
                            {milestone.date && (
                              <span className="text-sm font-medium text-blue-600 flex items-center">
                                <Calendar className="h-4 w-4 mr-1" />
                                {formatDate(milestone.date)}
                              </span>
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground">{milestone.description}</p>
                          {milestone.progress !== undefined && (
                            <div className="mt-4">
                              <div className="flex justify-between text-xs text-gray-500 mb-1">
                                <span>Progress</span>
                                <span>{Math.round(milestone.progress * 100)}%</span>
                              </div>
                              <Progress value={milestone.progress * 100} className="h-2" />
                            </div>
                          )}
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-12">
                      <Award className="h-12 w-12 mx-auto text-gray-300 mb-3" />
                      <h3 className="text-lg font-medium text-gray-600">No milestones yet</h3>
                      <p className="text-muted-foreground mt-1">Start converting points to unlock achievements</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
            
            <Card className="border-0 shadow-md overflow-hidden">
              <CardHeader className="bg-gradient-to-br from-blue-50 to-white border-b">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Membership Level</CardTitle>
                    <CardDescription>Your tier benefits and privileges</CardDescription>
                  </div>
                  <div className="flex items-center">
                    <span className="bg-gradient-to-r from-blue-500 to-blue-700 text-white px-3 py-1 rounded-full text-sm font-medium shadow-sm">
                      {journeyData.membershipTier}
                    </span>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {journeyData.membershipTier === "STANDARD" && (
                    <>
                      <div className="bg-white border border-blue-100 p-5 rounded-xl shadow-sm hover:shadow-md transition-shadow">
                        <div className="flex items-center mb-3">
                          <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center mr-3">
                            <Star className="h-4 w-4 text-blue-600" />
                          </div>
                          <h3 className="font-semibold text-blue-800">Standard Benefits</h3>
                        </div>
                        <ul className="text-sm space-y-2 pl-5">
                          <li className="flex items-start">
                            <CheckIcon className="h-4 w-4 text-blue-500 mr-2 mt-0.5" />
                            <span>Basic conversion rates</span>
                          </li>
                          <li className="flex items-start">
                            <CheckIcon className="h-4 w-4 text-blue-500 mr-2 mt-0.5" />
                            <span>Free conversions up to 10,000 points</span>
                          </li>
                          <li className="flex items-start">
                            <CheckIcon className="h-4 w-4 text-blue-500 mr-2 mt-0.5" />
                            <span>0.5% fee on amounts over the free limit</span>
                          </li>
                        </ul>
                      </div>
                      <div className="bg-white border border-gray-200 p-5 rounded-xl shadow-sm hover:shadow-md transition-shadow opacity-70">
                        <div className="flex items-center mb-3">
                          <div className="h-8 w-8 rounded-full bg-gray-100 flex items-center justify-center mr-3">
                            <Medal className="h-4 w-4 text-gray-500" />
                          </div>
                          <h3 className="font-semibold text-gray-700">Silver Benefits (Next Tier)</h3>
                        </div>
                        <ul className="text-sm space-y-2 pl-5">
                          <li className="flex items-start">
                            <CheckIcon className="h-4 w-4 text-gray-400 mr-2 mt-0.5" />
                            <span className="text-gray-600">Improved conversion rates</span>
                          </li>
                          <li className="flex items-start">
                            <CheckIcon className="h-4 w-4 text-gray-400 mr-2 mt-0.5" />
                            <span className="text-gray-600">Free conversions up to 25,000 points</span>
                          </li>
                          <li className="flex items-start">
                            <CheckIcon className="h-4 w-4 text-gray-400 mr-2 mt-0.5" />
                            <span className="text-gray-600">0.4% fee on amounts over the free limit</span>
                          </li>
                        </ul>
                      </div>
                      <div className="bg-white border border-gray-200 p-5 rounded-xl shadow-sm hover:shadow-md transition-shadow opacity-60">
                        <div className="flex items-center mb-3">
                          <div className="h-8 w-8 rounded-full bg-gray-100 flex items-center justify-center mr-3">
                            <Award className="h-4 w-4 text-gray-500" />
                          </div>
                          <h3 className="font-semibold text-gray-700">Gold Benefits</h3>
                        </div>
                        <ul className="text-sm space-y-2 pl-5">
                          <li className="flex items-start">
                            <CheckIcon className="h-4 w-4 text-gray-400 mr-2 mt-0.5" />
                            <span className="text-gray-600">Premium conversion rates</span>
                          </li>
                          <li className="flex items-start">
                            <CheckIcon className="h-4 w-4 text-gray-400 mr-2 mt-0.5" />
                            <span className="text-gray-600">Free conversions up to 50,000 points</span>
                          </li>
                          <li className="flex items-start">
                            <CheckIcon className="h-4 w-4 text-gray-400 mr-2 mt-0.5" />
                            <span className="text-gray-600">0.3% fee on amounts over the free limit</span>
                          </li>
                        </ul>
                      </div>
                    </>
                  )}
                  
                  {journeyData.membershipTier === "SILVER" && (
                    <>
                      <div className="bg-gray-50 p-4 rounded-lg opacity-60">
                        <h3 className="font-semibold mb-2">Standard Benefits</h3>
                        <ul className="text-sm space-y-1">
                          <li>• Basic conversion rates</li>
                          <li>• Free conversions up to 10,000 points</li>
                          <li>• 0.5% fee on amounts over the free limit</li>
                        </ul>
                      </div>
                      <div className="bg-blue-50 p-4 rounded-lg">
                        <h3 className="font-semibold mb-2">Silver Benefits (Current)</h3>
                        <ul className="text-sm space-y-1">
                          <li>• Improved conversion rates</li>
                          <li>• Free conversions up to 25,000 points</li>
                          <li>• 0.4% fee on amounts over the free limit</li>
                        </ul>
                      </div>
                      <div className="bg-gray-50 p-4 rounded-lg opacity-60">
                        <h3 className="font-semibold mb-2">Gold Benefits (Next Tier)</h3>
                        <ul className="text-sm space-y-1">
                          <li>• Premium conversion rates</li>
                          <li>• Free conversions up to 50,000 points</li>
                          <li>• 0.3% fee on amounts over the free limit</li>
                        </ul>
                      </div>
                    </>
                  )}
                  
                  {journeyData.membershipTier === "GOLD" && (
                    <>
                      <div className="bg-gray-50 p-4 rounded-lg opacity-40">
                        <h3 className="font-semibold mb-2">Standard Benefits</h3>
                        <ul className="text-sm space-y-1">
                          <li>• Basic conversion rates</li>
                          <li>• Free conversions up to 10,000 points</li>
                          <li>• 0.5% fee on amounts over the free limit</li>
                        </ul>
                      </div>
                      <div className="bg-gray-50 p-4 rounded-lg opacity-60">
                        <h3 className="font-semibold mb-2">Silver Benefits</h3>
                        <ul className="text-sm space-y-1">
                          <li>• Improved conversion rates</li>
                          <li>• Free conversions up to 25,000 points</li>
                          <li>• 0.4% fee on amounts over the free limit</li>
                        </ul>
                      </div>
                      <div className="bg-blue-50 p-4 rounded-lg">
                        <h3 className="font-semibold mb-2">Gold Benefits (Current)</h3>
                        <ul className="text-sm space-y-1">
                          <li>• Premium conversion rates</li>
                          <li>• Free conversions up to 50,000 points</li>
                          <li>• 0.3% fee on amounts over the free limit</li>
                        </ul>
                      </div>
                    </>
                  )}
                  
                  {journeyData.membershipTier === "PLATINUM" && (
                    <>
                      <div className="bg-gray-50 p-4 rounded-lg opacity-40">
                        <h3 className="font-semibold mb-2">Silver Benefits</h3>
                        <ul className="text-sm space-y-1">
                          <li>• Improved conversion rates</li>
                          <li>• Free conversions up to 25,000 points</li>
                          <li>• 0.4% fee on amounts over the free limit</li>
                        </ul>
                      </div>
                      <div className="bg-gray-50 p-4 rounded-lg opacity-60">
                        <h3 className="font-semibold mb-2">Gold Benefits</h3>
                        <ul className="text-sm space-y-1">
                          <li>• Premium conversion rates</li>
                          <li>• Free conversions up to 50,000 points</li>
                          <li>• 0.3% fee on amounts over the free limit</li>
                        </ul>
                      </div>
                      <div className="bg-blue-50 p-4 rounded-lg">
                        <h3 className="font-semibold mb-2">Platinum Benefits (Current)</h3>
                        <ul className="text-sm space-y-1">
                          <li>• Elite conversion rates</li>
                          <li>• Free conversions up to 100,000 points</li>
                          <li>• 0.2% fee on amounts over the free limit</li>
                          <li>• Priority support</li>
                        </ul>
                      </div>
                    </>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          {/* Trends Tab */}
          <TabsContent value="trends" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Conversion Trends</CardTitle>
                <CardDescription>Monthly point conversion activity</CardDescription>
              </CardHeader>
              <CardContent className="h-80">
                {journeyData.conversionTrends.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart
                      data={journeyData.conversionTrends.map(item => ({
                        ...item,
                        formattedMonth: formatMonth(item.month)
                      }))}
                      margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
                    >
                      <XAxis dataKey="formattedMonth" />
                      <YAxis />
                      <Tooltip 
                        formatter={(value) => value.toLocaleString()}
                        labelFormatter={(label) => `Month: ${label}`}
                      />
                      <Area 
                        type="monotone" 
                        dataKey="amount" 
                        stroke="#0065FF" 
                        fill="#0065FF" 
                        fillOpacity={0.3} 
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex h-full items-center justify-center">
                    <p className="text-muted-foreground">No trend data available yet</p>
                  </div>
                )}
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Transaction History</CardTitle>
                <CardDescription>Complete record of your point conversions</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {journeyData.recentTransactions.length > 0 ? (
                    journeyData.recentTransactions.map((tx) => (
                      <div key={tx.id} className="flex flex-col sm:flex-row sm:justify-between items-start sm:items-center border-b pb-4">
                        <div>
                          <div className="flex items-center">
                            <div className="w-3 h-3 rounded-full bg-blue-500 mr-2"></div>
                            <p className="font-medium">
                              {tx.fromProgram} → {tx.toProgram}
                            </p>
                          </div>
                          <p className="text-sm text-muted-foreground">
                            {formatDate(tx.timestamp)}
                          </p>
                        </div>
                        <div className="mt-2 sm:mt-0 sm:text-right">
                          <p className="font-medium">
                            {tx.amountFrom.toLocaleString()} → {tx.amountTo.toLocaleString()}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            Rate: {(tx.amountTo / tx.amountFrom).toFixed(4)}
                            {tx.feeApplied > 0 && ` | Fee: ${tx.feeApplied.toLocaleString()}`}
                          </p>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-muted-foreground text-center py-8">No transaction history available</p>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          {/* Programs Tab */}
          <TabsContent value="programs" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Program Usage</CardTitle>
                <CardDescription>Breakdown of your loyalty program activity</CardDescription>
              </CardHeader>
              <CardContent className="h-80">
                {journeyData.favoritePrograms.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={journeyData.favoritePrograms}
                      margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                    >
                      <XAxis dataKey="program" />
                      <YAxis />
                      <Tooltip formatter={(value) => value.toLocaleString()} />
                      <Legend />
                      <Bar dataKey="pointsProcessed" name="Points Processed" fill="#8884d8" />
                      <Bar dataKey="transactionCount" name="Transaction Count" fill="#82ca9d" />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex h-full items-center justify-center">
                    <p className="text-muted-foreground">No program data available yet</p>
                  </div>
                )}
              </CardContent>
            </Card>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Most Used Programs</CardTitle>
                  <CardDescription>Programs with most transaction volume</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {journeyData.favoritePrograms.length > 0 ? (
                      journeyData.favoritePrograms.map((program, index) => (
                        <div key={index} className="flex justify-between items-center">
                          <div className="flex items-center">
                            <div 
                              className="w-4 h-4 rounded-full mr-2" 
                              style={{ backgroundColor: COLORS[index % COLORS.length] }}
                            ></div>
                            <span className="font-medium">{program.program}</span>
                          </div>
                          <div className="text-right">
                            <p className="font-medium">{program.pointsProcessed.toLocaleString()} points</p>
                            <p className="text-sm text-muted-foreground">
                              {program.transactionCount} transactions
                            </p>
                          </div>
                        </div>
                      ))
                    ) : (
                      <p className="text-muted-foreground text-center py-8">No program data available</p>
                    )}
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle>Program Recommendations</CardTitle>
                  <CardDescription>Personalized suggestions based on your activity</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {journeyData.favoritePrograms.length > 0 ? (
                      <>
                        <div className="p-4 border border-blue-100 bg-blue-50 rounded-lg">
                          <h3 className="font-semibold text-blue-800 mb-1">Optimize Your Conversions</h3>
                          <p className="text-sm text-blue-700">
                            Based on your transaction history, converting {journeyData.favoritePrograms[0]?.program} 
                            points through xPoints could save you approximately {formatCurrency(journeyData.stats.estimatedSavings)} in value.
                          </p>
                        </div>
                        
                        <div className="p-4 border border-green-100 bg-green-50 rounded-lg">
                          <h3 className="font-semibold text-green-800 mb-1">Increase Your Tier Status</h3>
                          <p className="text-sm text-green-700">
                            You're currently on the {journeyData.membershipTier} tier. 
                            Convert {Math.max(0, 50000 - journeyData.stats.monthlyActivity).toLocaleString()} more points 
                            this month to reach the next tier and unlock better rates.
                          </p>
                        </div>
                        
                        <div className="p-4 border border-amber-100 bg-amber-50 rounded-lg">
                          <h3 className="font-semibold text-amber-800 mb-1">Diversify Your Portfolio</h3>
                          <p className="text-sm text-amber-700">
                            Consider exploring more options with {
                              ['QANTAS', 'GYG', 'XPOINTS', 'VELOCITY', 'AMEX']
                                .filter(p => !journeyData.favoritePrograms.some(fp => fp.program === p))[0]
                            } to unlock additional value from their unique redemption options.
                          </p>
                        </div>
                      </>
                    ) : (
                      <p className="text-muted-foreground text-center py-8">Complete some transactions to get personalized recommendations</p>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
          
          {/* Wallets Tab */}
          <TabsContent value="wallets" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Wallet Value Distribution</CardTitle>
                <CardDescription>Dollar value of your loyalty point balances</CardDescription>
              </CardHeader>
              <CardContent className="h-80">
                {journeyData.walletBalances.filter(w => w.balance > 0).length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={journeyData.walletBalances.filter(w => w.balance > 0)}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="dollarValue"
                        nameKey="program"
                        label={({ program, dollarValue }) => `${program}: ${formatCurrency(dollarValue)}`}
                      >
                        {journeyData.walletBalances.filter(w => w.balance > 0).map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Legend />
                      <Tooltip formatter={(value) => formatCurrency(value as number)} />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex h-full items-center justify-center">
                    <p className="text-muted-foreground">No wallet balances available</p>
                  </div>
                )}
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Your Loyalty Wallets</CardTitle>
                <CardDescription>Current balances and estimated values</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {journeyData.walletBalances.filter(w => w.balance > 0).length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {journeyData.walletBalances
                        .filter(wallet => wallet.balance > 0)
                        .sort((a, b) => b.balance - a.balance)
                        .map((wallet, index) => (
                          <div key={index} className="border rounded-lg p-4">
                            <div className="flex justify-between items-start mb-2">
                              <h3 className="font-semibold">{wallet.program}</h3>
                              <div 
                                className="w-3 h-3 rounded-full" 
                                style={{ backgroundColor: COLORS[index % COLORS.length] }}
                              ></div>
                            </div>
                            <div className="flex justify-between text-sm text-muted-foreground mb-2">
                              <span>Current Balance</span>
                              <span>Estimated Value</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="font-medium">{wallet.balance.toLocaleString()} points</span>
                              <span className="font-medium">{formatCurrency(wallet.dollarValue)}</span>
                            </div>
                          </div>
                        ))
                      }
                    </div>
                  ) : (
                    <p className="text-muted-foreground text-center py-8">No wallet balances available</p>
                  )}
                </div>
              </CardContent>
              <CardFooter>
                <p className="text-sm text-muted-foreground">
                  Note: Estimated values are based on typical redemption rates and may vary.
                </p>
              </CardFooter>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </>
  );
}

// Stats card component
function StatsCard({ title, value, description, icon }: { 
  title: string;
  value: string;
  description: string;
  icon: React.ReactNode;
}) {
  return (
    <Card className="overflow-hidden border-0 shadow-md">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 bg-gradient-to-br from-blue-50 to-slate-50">
        <CardTitle className="text-sm font-medium text-blue-800">{title}</CardTitle>
        <div className="h-10 w-10 rounded-lg bg-blue-600 p-2 text-white shadow-sm">
          {icon}
        </div>
      </CardHeader>
      <CardContent className="pt-4">
        <div className="text-3xl font-bold text-gray-800">{value}</div>
        <p className="text-xs text-muted-foreground mt-1">{description}</p>
      </CardContent>
    </Card>
  );
}