import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/hooks/use-auth';
import { LoyaltyProgram, Wallet, Transaction } from '@shared/schema';
import { useIsMobile } from '@/hooks/use-mobile';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import { 
  Wallet as WalletIcon, ArrowUpRight, 
  ArrowDownRight, BarChart3, CircleDollarSign,
  Users, TrendingUp
} from 'lucide-react';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#FF6B6B', '#4CAF50', '#9C27B0', '#3F51B5', '#607D8B'];

// Helper function to get program name for display
function getProgramName(program: LoyaltyProgram): string {
  const names: Record<LoyaltyProgram, string> = {
    'QANTAS': 'Qantas',
    'GYG': 'GYG',
    'XPOINTS': 'xPoints',
    'VELOCITY': 'Velocity',
    'AMEX': 'Amex',
    'FLYBUYS': 'Flybuys',
    'HILTON': 'Hilton',
    'MARRIOTT': 'Marriott',
    'AIRBNB': 'Airbnb',
    'DELTA': 'Delta',
  };
  return names[program] || program;
}

// Helper function to get program color
function getProgramColor(program: LoyaltyProgram): string {
  const colors: Record<LoyaltyProgram, string> = {
    'QANTAS': '#E40000',
    'GYG': '#00AB55',
    'XPOINTS': '#6366F1',
    'VELOCITY': '#D90000',
    'AMEX': '#006FCF',
    'FLYBUYS': '#003E79',
    'HILTON': '#00406A',
    'MARRIOTT': '#B18C50',
    'AIRBNB': '#FF5A5F',
    'DELTA': '#003366',
  };
  return colors[program] || '#6366F1';
}

export default function DashboardPage() {
  const { user } = useAuth();
  const isMobile = useIsMobile();
  const [activeTab, setActiveTab] = useState<string>('overview');
  
  // Fetch user wallets
  const { data: wallets = [] } = useQuery<Wallet[]>({
    queryKey: ['/api/wallets'],
    enabled: !!user,
  });
  
  // Fetch user transactions
  const { data: transactions = [] } = useQuery<Transaction[]>({
    queryKey: ['/api/transactions'],
    enabled: !!user,
  });
  
  // Fetch user stats
  const { data: userStats = { pointsConverted: 0, feesPaid: 0, monthlyPoints: 0, tier: 'STANDARD' } } = useQuery<any>({
    queryKey: ['/api/user-stats'],
    enabled: !!user,
  });
  
  // Prepare wallet data for pie chart
  const walletData = wallets.map((wallet, index) => ({
    name: getProgramName(wallet.program as LoyaltyProgram),
    value: wallet.balance,
    color: COLORS[index % COLORS.length]
  }));
  
  // Calculate total points across all wallets
  const totalPoints = wallets.reduce((sum, wallet) => sum + wallet.balance, 0);
  
  // Prepare transaction data for activity
  const recentTransactions = transactions.slice(0, 5).map(transaction => ({
    id: transaction.id,
    date: new Date(transaction.timestamp).toLocaleDateString(),
    time: new Date(transaction.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    fromProgram: getProgramName(transaction.fromProgram as LoyaltyProgram),
    toProgram: getProgramName(transaction.toProgram as LoyaltyProgram),
    amount: transaction.amountFrom,
    fee: transaction.feeApplied,
    isIncoming: transaction.toProgram === 'XPOINTS',
  }));
  
  // Prepare monthly activity data
  const monthlyActivity = [
    { month: 'Jan', points: 1200 },
    { month: 'Feb', points: 1900 },
    { month: 'Mar', points: 3000 },
    { month: 'Apr', points: 2780 },
    { month: 'May', points: userStats.monthlyPoints || 4000 },
    { month: 'Jun', points: 0 },
  ];
  
  // Formatted tier name
  const tierName = userStats.tier.charAt(0) + userStats.tier.slice(1).toLowerCase();
  
  // Calculate tier progress
  const tierProgress = () => {
    const tiers: Record<MembershipTier, { min: number; max: number }> = {
      STANDARD: { min: 0, max: 10000 },
      SILVER: { min: 10000, max: 50000 },
      GOLD: { min: 50000, max: 100000 },
      PLATINUM: { min: 100000, max: 100000 }
    };
    
    const tier = userStats.tier as MembershipTier;
    const currentTier = tiers[tier];
    
    const nextTierKey = tier === 'STANDARD' ? 'SILVER' : 
                        tier === 'SILVER' ? 'GOLD' : 
                        tier === 'GOLD' ? 'PLATINUM' : 'PLATINUM';
    
    // If at max tier, show 100%
    if (tier === 'PLATINUM') return 100;
    
    const nextTier = tiers[nextTierKey as MembershipTier];
    const progress = ((userStats.monthlyPoints - currentTier.min) / (nextTier.min - currentTier.min)) * 100;
    return Math.min(Math.max(progress, 0), 100);
  };
  
  // Next tier
  const nextTierName = userStats.tier === 'STANDARD' ? 'Silver' : 
                     userStats.tier === 'SILVER' ? 'Gold' : 
                     userStats.tier === 'GOLD' ? 'Platinum' : 'Max tier reached';
  
  // Points needed for next tier
  const pointsForNextTier = () => {
    const thresholds: Record<MembershipTier, number> = {
      STANDARD: 10000,
      SILVER: 50000,
      GOLD: 100000,
      PLATINUM: 0
    };
    
    if (userStats.tier === 'PLATINUM') return 0;
    
    const tier = userStats.tier as MembershipTier;
    const threshold = thresholds[tier];
    return Math.max(threshold - userStats.monthlyPoints, 0);
  };

  return (
    <div className="container mx-auto max-w-7xl p-4 sm:p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">Dashboard</h1>
        <p className="text-muted-foreground">Manage and track your loyalty points across all programs</p>
      </div>
      
      {/* Main Dashboard Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg font-semibold flex items-center">
              <WalletIcon className="h-5 w-5 mr-2 text-primary" />
              Total Points
            </CardTitle>
            <CardDescription>Across all programs</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{totalPoints.toLocaleString()}</div>
            <div className="text-sm text-muted-foreground">
              {wallets.length} active wallets
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg font-semibold flex items-center">
              <TrendingUp className="h-5 w-5 mr-2 text-primary" />
              Membership Tier
            </CardTitle>
            <CardDescription>Monthly activity status</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-end justify-between mb-2">
              <div>
                <div className="text-3xl font-bold">{tierName}</div>
                <div className="text-sm text-muted-foreground">
                  {pointsForNextTier() > 0 
                    ? `${pointsForNextTier().toLocaleString()} more points to ${nextTierName}` 
                    : 'Highest tier achieved!'}
                </div>
              </div>
              <Badge variant="outline" className="mb-1">
                {userStats.monthlyPoints.toLocaleString()} pts this month
              </Badge>
            </div>
            <Progress value={tierProgress()} className="h-2" />
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg font-semibold flex items-center">
              <CircleDollarSign className="h-5 w-5 mr-2 text-primary" />
              Total Converted
            </CardTitle>
            <CardDescription>Lifetime points converted</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{userStats.pointsConverted.toLocaleString()}</div>
            <div className="text-sm text-muted-foreground">
              {userStats.feesPaid > 0 
                ? `${userStats.feesPaid.toLocaleString()} pts paid in fees` 
                : 'No fees paid yet'}
            </div>
          </CardContent>
        </Card>
      </div>
      
      {/* Dashboard Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Portfolio Distribution</CardTitle>
              <CardDescription>Your points across loyalty programs</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col sm:flex-row items-center justify-between">
                <div className="w-full sm:w-1/2 h-[250px]">
                  {walletData.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={walletData}
                          cx="50%"
                          cy="50%"
                          innerRadius={60}
                          outerRadius={80}
                          paddingAngle={2}
                          dataKey="value"
                          label={({ name }) => name}
                          labelLine={false}
                        >
                          {walletData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip 
                          formatter={(value: number) => value.toLocaleString()} 
                          labelFormatter={(label) => label}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="flex items-center justify-center h-full">
                      <p className="text-muted-foreground">No wallet data available</p>
                    </div>
                  )}
                </div>
                <div className="w-full sm:w-1/2 space-y-4 pt-4 sm:pt-0">
                  {wallets.map((wallet) => (
                    <div key={wallet.id} className="flex items-center justify-between">
                      <div className="flex items-center">
                        <div 
                          className="w-3 h-3 rounded-full mr-2" 
                          style={{ backgroundColor: getProgramColor(wallet.program as LoyaltyProgram) }}
                        />
                        <span>{getProgramName(wallet.program as LoyaltyProgram)}</span>
                      </div>
                      <div className="font-medium">{wallet.balance.toLocaleString()}</div>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Monthly Activity</CardTitle>
              <CardDescription>Your points conversion trends</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[250px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={monthlyActivity}
                    margin={{ top: 5, right: 20, left: 10, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip formatter={(value: number) => value.toLocaleString() + " pts"} />
                    <Bar dataKey="points" fill="#6366F1" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </div>
        
        <div className="lg:col-span-1 flex flex-col">
          <Card className="flex-1">
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
              <CardDescription>Your latest transactions</CardDescription>
            </CardHeader>
            <CardContent>
              {recentTransactions.length > 0 ? (
                <div className="space-y-4">
                  {recentTransactions.map((transaction) => (
                    <div key={transaction.id} className="flex items-start gap-3 p-3 rounded-lg border">
                      <div className={`p-2 rounded-full ${transaction.isIncoming ? 'bg-green-100' : 'bg-blue-100'}`}>
                        {transaction.isIncoming ? (
                          <ArrowDownRight className="h-4 w-4 text-green-600" />
                        ) : (
                          <ArrowUpRight className="h-4 w-4 text-blue-600" />
                        )}
                      </div>
                      <div className="flex-1">
                        <div className="flex justify-between">
                          <div className="font-medium">{transaction.isIncoming ? 'Received' : 'Converted'}</div>
                          <div className="font-semibold">{transaction.amount.toLocaleString()} pts</div>
                        </div>
                        <div className="text-sm text-muted-foreground flex justify-between mt-1">
                          <div>{transaction.isIncoming ? `From ${transaction.fromProgram}` : `${transaction.fromProgram} → ${transaction.toProgram}`}</div>
                          <div>{transaction.date}</div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <p className="text-muted-foreground">No recent transactions</p>
                </div>
              )}
            </CardContent>
            {recentTransactions.length > 0 && (
              <CardFooter className="px-6 py-4 border-t">
                <a href="/history" className="text-primary hover:underline text-sm mx-auto">
                  View All Transactions
                </a>
              </CardFooter>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}