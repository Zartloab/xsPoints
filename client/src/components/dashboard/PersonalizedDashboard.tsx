import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'wouter';
import { useAuth } from '@/hooks/use-auth';
import { format } from 'date-fns';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  BarChart3,
  TrendingUp,
  TrendingDown,
  ArrowRight,
  ThumbsUp,
  Lightbulb,
  Calendar,
  RefreshCw,
  ExternalLink,
} from 'lucide-react';
import { Wallet, Transaction, LoyaltyProgram } from '@shared/schema';

type OpportunityCardProps = {
  title: string;
  description: string;
  icon: React.ReactNode;
  action: string;
  onClick: () => void;
  badgeText?: string;
  badgeVariant?: 'default' | 'secondary' | 'destructive' | 'outline';
};

const OpportunityCard = ({
  title,
  description,
  icon,
  action,
  onClick,
  badgeText,
  badgeVariant = 'default',
}: OpportunityCardProps) => {
  return (
    <Card className="overflow-hidden transition-all hover:border-primary/50 hover:shadow-md">
      <CardContent className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-primary/10 rounded-full text-primary">
              {icon}
            </div>
            <div>
              <h3 className="font-semibold">{title}</h3>
              <p className="text-sm text-muted-foreground">{description}</p>
            </div>
          </div>
          {badgeText && (
            <Badge variant={badgeVariant}>{badgeText}</Badge>
          )}
        </div>
        <Button
          variant="outline"
          size="sm"
          className="w-full justify-between"
          onClick={onClick}
        >
          {action}
          <ArrowRight className="h-4 w-4 ml-2" />
        </Button>
      </CardContent>
    </Card>
  );
};

const getProgramColor = (program: LoyaltyProgram) => {
  switch (program) {
    case 'QANTAS': return 'text-blue-600 bg-blue-100';
    case 'GYG': return 'text-yellow-600 bg-yellow-100';
    case 'XPOINTS': return 'text-violet-600 bg-violet-100';
    case 'VELOCITY': return 'text-red-600 bg-red-100';
    case 'AMEX': return 'text-green-600 bg-green-100';
    case 'FLYBUYS': return 'text-orange-600 bg-orange-100';
    case 'HILTON': return 'text-indigo-600 bg-indigo-100';
    case 'MARRIOTT': return 'text-pink-600 bg-pink-100';
    case 'AIRBNB': return 'text-rose-600 bg-rose-100';
    case 'DELTA': return 'text-cyan-600 bg-cyan-100';
    default: return 'text-gray-600 bg-gray-100';
  }
};

export default function PersonalizedDashboard() {
  const { user } = useAuth();
  
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
  
  // Fetch exchange rates 
  const { data: exchangeRates = [] } = useQuery<any[]>({
    queryKey: ['/api/exchange-rates/all'],
    enabled: !!user,
  });
  
  // Get user statistics
  const { data: userStats } = useQuery<any>({
    queryKey: ['/api/user-stats'],
    enabled: !!user,
  });
  
  // Calculate total points across all programs
  const totalPoints = wallets.reduce((sum, wallet) => sum + wallet.balance, 0);
  
  // Find the most recently used program (from transactions)
  const mostRecentTransaction = transactions.length > 0 
    ? transactions.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())[0] 
    : null;
  
  // Get the last active date
  const lastActiveDate = mostRecentTransaction 
    ? format(new Date(mostRecentTransaction.timestamp), 'MMM dd, yyyy') 
    : 'Never';
  
  // Identify opportunities based on wallet balances and exchange rates
  const getOpportunities = () => {
    const opportunities = [];
    
    // Check if any wallet is close to expiry (placeholder logic, would need real expiration dates)
    const expiringWallet = wallets.find(w => w.accountName?.includes('expiry'));
    if (expiringWallet) {
      opportunities.push({
        title: 'Points Expiring Soon',
        description: `${expiringWallet.balance.toLocaleString()} ${expiringWallet.program} points expiring this month`,
        icon: <Calendar className="h-5 w-5" />,
        action: 'Convert Now',
        onClick: () => window.location.href = '#convert',
        badgeText: 'Urgent',
        badgeVariant: 'destructive',
      });
    }
    
    // Suggest trying out trading if they have fewer than 2 transactions
    if (transactions.length < 2) {
      opportunities.push({
        title: 'Try P2P Trading',
        description: 'Trade directly with other users for better rates',
        icon: <RefreshCw className="h-5 w-5" />,
        action: 'Explore Trading',
        onClick: () => window.location.href = '/trading',
        badgeText: 'New',
        badgeVariant: 'default',
      });
    }
    
    // If user has points in multiple programs, suggest consolidation
    if (wallets.filter(w => w.balance > 0).length > 1) {
      opportunities.push({
        title: 'Consolidate Your Points',
        description: 'Combine points from multiple programs for bigger rewards',
        icon: <ThumbsUp className="h-5 w-5" />,
        action: 'View Strategy',
        onClick: () => window.location.href = '/tutorial',
      });
    }
    
    // Find the best conversion rate opportunity
    if (wallets.length > 0 && exchangeRates.length > 0) {
      opportunities.push({
        title: 'Rate Alert',
        description: 'Current rates are favorable for conversions',
        icon: <Lightbulb className="h-5 w-5" />,
        action: 'See Best Rates',
        onClick: () => window.location.href = '/explorer',
        badgeText: 'Trending',
        badgeVariant: 'secondary',
      });
    }
    
    return opportunities.slice(0, 3); // Limit to 3 opportunities
  };

  // Today's date for greeting
  const today = new Date();
  const hours = today.getHours();
  
  // Personalized greeting based on time of day
  let greeting = '';
  if (hours < 12) greeting = 'Good morning';
  else if (hours < 18) greeting = 'Good afternoon';
  else greeting = 'Good evening';
  
  return (
    <section className="mb-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent">
          {greeting}, {user?.firstName || user?.username || 'User'}!
        </h1>
        <p className="text-muted-foreground">
          Welcome to your personalized xPoints dashboard
        </p>
      </div>
      
      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardContent className="p-4">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm text-muted-foreground">Total Points</p>
                <h3 className="text-2xl font-bold">{totalPoints.toLocaleString()}</h3>
              </div>
              <div className="p-2 bg-primary/10 rounded-full text-primary">
                <BarChart3 className="h-5 w-5" />
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm text-muted-foreground">Monthly Activity</p>
                <h3 className="text-2xl font-bold">{userStats?.monthlyPoints || 0}</h3>
              </div>
              <div className="p-2 bg-primary/10 rounded-full text-primary">
                <TrendingUp className="h-5 w-5" />
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm text-muted-foreground">Last Active</p>
                <h3 className="text-lg font-bold">{lastActiveDate}</h3>
              </div>
              <div className="p-2 bg-primary/10 rounded-full text-primary">
                <Calendar className="h-5 w-5" />
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm text-muted-foreground">Programs Linked</p>
                <h3 className="text-2xl font-bold">{wallets.filter(w => w.accountName || w.accountNumber).length} / {wallets.length}</h3>
              </div>
              <div className="p-2 bg-primary/10 rounded-full text-primary">
                <ExternalLink className="h-5 w-5" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
      
      {/* Top Programs */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Your Top Programs</CardTitle>
          <CardDescription>
            Summary of your highest-value loyalty program wallets
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {wallets
              .sort((a, b) => b.balance - a.balance)
              .slice(0, 3)
              .map((wallet) => (
                <div key={wallet.id} className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${getProgramColor(wallet.program as LoyaltyProgram)}`}>
                      {wallet.program.charAt(0)}
                    </div>
                    <div>
                      <h4 className="font-medium">{wallet.program}</h4>
                      <p className="text-sm text-muted-foreground">
                        {wallet.accountName ? `Connected to ${wallet.accountName}` : 'Not connected'}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="font-bold">{wallet.balance.toLocaleString()}</span>
                    <p className="text-xs text-muted-foreground">points</p>
                  </div>
                </div>
              ))}
          </div>
        </CardContent>
        <CardFooter>
          <Button variant="outline" className="w-full">
            <Link href="#link">Manage All Programs</Link>
          </Button>
        </CardFooter>
      </Card>
      
      {/* Personalized Opportunities */}
      <div>
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">Personalized Opportunities</h2>
          <Link href="/explorer">
            <Button variant="ghost" size="sm">
              View All
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </Link>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {getOpportunities().map((opportunity, index) => (
            <OpportunityCard
              key={index}
              title={opportunity.title}
              description={opportunity.description}
              icon={opportunity.icon}
              action={opportunity.action}
              onClick={opportunity.onClick}
              badgeText={opportunity.badgeText}
              badgeVariant={opportunity.badgeVariant as "default" | "secondary" | "destructive" | "outline"}
            />
          ))}
        </div>
      </div>
    </section>
  );
}