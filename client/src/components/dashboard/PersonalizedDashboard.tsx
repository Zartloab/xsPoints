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
  Trophy,
  Check as CheckIcon,
  Clock,
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
  // Define background colors for different badge variants
  const getBadgeClasses = () => {
    switch (badgeVariant) {
      case 'destructive':
        return 'bg-red-50 text-red-600 border border-red-200';
      case 'secondary':
        return 'bg-purple-50 text-purple-600 border border-purple-200';
      case 'outline':
        return 'bg-gray-50 text-gray-600 border border-gray-200';
      default:
        return 'bg-blue-50 text-blue-600 border border-blue-200';
    }
  };
  
  // Define background gradient for the card based on badge variant
  const getCardGradient = () => {
    switch (badgeVariant) {
      case 'destructive':
        return 'from-red-50 to-white';
      case 'secondary':
        return 'from-purple-50 to-white';
      case 'outline':
        return 'from-gray-50 to-white';
      default:
        return 'from-blue-50 to-white';
    }
  };
  
  return (
    <Card className="border-0 shadow-md overflow-hidden transition-all hover:-translate-y-1 duration-300">
      <div className={`h-1.5 bg-gradient-to-r ${
        badgeVariant === 'destructive' ? 'from-red-400 to-red-300' :
        badgeVariant === 'secondary' ? 'from-purple-400 to-purple-300' :
        badgeVariant === 'outline' ? 'from-gray-400 to-gray-300' :
        'from-blue-400 to-blue-300'
      }`}></div>
      <CardContent className="p-6">
        <div className="flex items-start justify-between mb-5">
          <div className="flex items-start space-x-3">
            <div className={`p-3 rounded-full ${
              badgeVariant === 'destructive' ? 'bg-red-100 text-red-500' :
              badgeVariant === 'secondary' ? 'bg-purple-100 text-purple-500' :
              badgeVariant === 'outline' ? 'bg-gray-100 text-gray-500' :
              'bg-blue-100 text-blue-500'
            }`}>
              {icon}
            </div>
            <div>
              <h3 className="font-semibold text-gray-800 text-lg">{title}</h3>
              <p className="text-sm text-muted-foreground mt-1">{description}</p>
            </div>
          </div>
          {badgeText && (
            <Badge className={`${getBadgeClasses()} font-medium px-2.5 py-0.5 text-xs`}>
              {badgeText}
            </Badge>
          )}
        </div>
        <Button
          variant="outline"
          size="sm"
          className={`w-full justify-between border shadow-sm ${
            badgeVariant === 'destructive' ? 'text-red-600 hover:text-red-700 border-red-200 hover:bg-red-50' :
            badgeVariant === 'secondary' ? 'text-purple-600 hover:text-purple-700 border-purple-200 hover:bg-purple-50' :
            badgeVariant === 'outline' ? 'text-gray-600 hover:text-gray-700 border-gray-200 hover:bg-gray-50' :
            'text-blue-600 hover:text-blue-700 border-blue-200 hover:bg-blue-50'
          }`}
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
      <div className="mb-8 p-8 bg-gradient-to-r from-blue-100 via-blue-50 to-indigo-50 rounded-2xl border border-blue-200 shadow-md">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent">
              {greeting}, {user?.firstName || user?.username || 'User'}!
            </h1>
            <p className="text-muted-foreground mt-2 text-lg">
              Welcome to <span className="font-semibold text-primary">xPoints</span> - The Universal Loyalty Currency
            </p>
            <p className="text-sm text-gray-600 mt-2">
              Convert, manage, and maximize your loyalty points with our unified platform
            </p>
          </div>
          <div className="mt-4 md:mt-0 bg-white/80 p-4 rounded-lg border border-blue-100 shadow-sm">
            <div className="text-center">
              <div className="text-xs uppercase tracking-wider text-gray-500 font-medium">xPoints Value</div>
              <div className="text-3xl font-bold text-blue-600 mt-1">$0.01</div>
              <div className="text-xs text-gray-500 mt-1">per point</div>
            </div>
          </div>
        </div>
      </div>
      
      {/* xPoints Focus Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {/* xPoints Balance - First and highlighted */}
        <Card className="border-0 shadow-lg overflow-hidden bg-gradient-to-br from-blue-50 to-white col-span-1 sm:col-span-2 order-1">
          <CardContent className="p-0">
            <div className="bg-gradient-to-r from-primary to-blue-400 h-2"></div>
            <div className="p-6">
              <div className="flex flex-col">
                <div className="flex items-center mb-3">
                  <div className="p-3 bg-blue-100 rounded-full text-primary mr-3">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-600">Your xPoints Balance</h3>
                    <p className="text-sm text-gray-500">The universal loyalty currency</p>
                  </div>
                </div>
                <div className="flex items-end justify-between mt-1">
                  <div>
                    <h2 className="text-4xl font-bold text-primary">
                      {wallets.find(w => w.program === 'XPOINTS')?.balance.toLocaleString() || 0}
                    </h2>
                    <p className="text-sm text-gray-500 mt-1">
                      Value: ${((wallets.find(w => w.program === 'XPOINTS')?.balance || 0) * 0.01).toFixed(2)} USD
                    </p>
                  </div>
                  <Button className="bg-primary hover:bg-blue-700" size="sm">
                    <Link href="/merchant" className="text-white">
                      Buy More
                    </Link>
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Total Points - Now less prominent */}
        <Card className="border-0 shadow-md overflow-hidden order-2 sm:order-3 lg:order-2">
          <CardContent className="p-0">
            <div className="bg-gradient-to-br from-blue-50 to-blue-100 h-2"></div>
            <div className="p-5">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-sm text-muted-foreground font-medium">Total Points</p>
                  <h3 className="text-2xl font-bold mt-1 text-gray-800">{totalPoints.toLocaleString()}</h3>
                  <p className="text-xs text-gray-500 mt-1">Across all programs</p>
                </div>
                <div className="p-3 bg-blue-100 rounded-full text-blue-600">
                  <BarChart3 className="h-5 w-5" />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
        
        {/* Monthly Activity */}
        <Card className="border-0 shadow-md overflow-hidden order-3 sm:order-4 lg:order-3">
          <CardContent className="p-0">
            <div className="bg-gradient-to-br from-green-50 to-green-100 h-2"></div>
            <div className="p-5">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-sm text-muted-foreground font-medium">Monthly Activity</p>
                  <h3 className="text-2xl font-bold mt-1 text-gray-800">{userStats?.monthlyPoints || 0}</h3>
                  <p className="text-xs text-gray-500 mt-1">Points this month</p>
                </div>
                <div className="p-3 bg-green-100 rounded-full text-green-600">
                  <TrendingUp className="h-5 w-5" />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
        
        {/* Merchant Insights - New card focused on business potential */}
        <Card className="border-0 shadow-md overflow-hidden order-4 sm:order-2 lg:order-4">
          <CardContent className="p-0">
            <div className="bg-gradient-to-br from-purple-50 to-purple-100 h-2"></div>
            <div className="p-5">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-sm text-muted-foreground font-medium">For Businesses</p>
                  <h3 className="text-lg font-bold mt-1 text-gray-800">Issue xPoints</h3>
                  <p className="text-xs text-gray-500 mt-1">Reward your customers</p>
                </div>
                <div className="p-3 bg-purple-100 rounded-full text-purple-600">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                    <circle cx="9" cy="7" r="4" />
                    <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
                    <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                  </svg>
                </div>
              </div>
              <div className="mt-2">
                <Button variant="outline" size="sm" className="w-full">
                  <Link href="/merchant" className="flex items-center w-full justify-center">
                    Merchant Portal
                  </Link>
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
      
      {/* Loyalty Programs with xPoints Emphasis */}
      <Card className="mb-8 border-0 shadow-md overflow-hidden">
        <CardHeader className="bg-gradient-to-br from-blue-50 to-white border-b">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-full bg-blue-100 text-blue-600">
              <Trophy className="h-5 w-5" />
            </div>
            <div>
              <CardTitle>Your Loyalty Programs</CardTitle>
              <CardDescription>
                Manage all your programs with xPoints as your central currency
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-5">
          <div className="space-y-6">
            {/* Always show xPoints first */}
            {(() => {
              const xPointsWallet = wallets.find(w => w.program === 'XPOINTS');
              if (xPointsWallet) {
                return (
                  <div className="flex items-center justify-between p-4 rounded-lg transition-colors bg-gradient-to-r from-blue-50 to-white border border-blue-100 shadow-sm">
                    <div className="flex items-center gap-4">
                      <div className="w-14 h-14 rounded-full flex items-center justify-center bg-blue-100 text-primary border-2 border-blue-200">
                        <span className="text-xl font-bold">X</span>
                      </div>
                      <div>
                        <h4 className="font-bold text-lg text-primary">XPOINTS</h4>
                        <p className="text-sm text-blue-600 mt-1 flex items-center">
                          <span className="flex items-center">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 mr-1" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <path d="m9 12 2 2 4-4" />
                              <circle cx="12" cy="12" r="10" />
                            </svg>
                            Universal Loyalty Currency
                          </span>
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-2xl text-primary">{xPointsWallet.balance.toLocaleString()}</div>
                      <div className="text-xs text-blue-600 mt-1">Worth ${(xPointsWallet.balance * 0.01).toFixed(2)} USD</div>
                    </div>
                  </div>
                );
              }
              return null;
            })()}
            
            {/* Other programs */}
            {wallets
              .filter(w => w.program !== 'XPOINTS')
              .sort((a, b) => b.balance - a.balance)
              .slice(0, 3)
              .map((wallet) => (
                <div key={wallet.id} className="flex items-center justify-between hover:bg-gray-50 p-3 rounded-lg transition-colors">
                  <div className="flex items-center gap-4">
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center ${getProgramColor(wallet.program as LoyaltyProgram)}`}>
                      {wallet.program.charAt(0)}
                    </div>
                    <div>
                      <h4 className="font-medium text-gray-800">{wallet.program}</h4>
                      <p className="text-sm text-muted-foreground mt-1 flex items-center">
                        {wallet.accountName ? (
                          <>
                            <CheckIcon className="h-3 w-3 mr-1 text-green-500" />
                            <span>Connected to {wallet.accountName}</span>
                          </>
                        ) : (
                          <>
                            <Clock className="h-3 w-3 mr-1 text-amber-500" />
                            <span>Not connected</span>
                          </>
                        )}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-bold text-xl text-gray-800">{wallet.balance.toLocaleString()}</div>
                    <div className="flex items-center justify-end text-xs text-gray-500 mt-1">
                      <RefreshCw className="h-3 w-3 mr-1" />
                      <Link href="#convert" className="text-blue-600 hover:underline">Convert to xPoints</Link>
                    </div>
                  </div>
                </div>
              ))}
          </div>
        </CardContent>
        <CardFooter className="border-t bg-gray-50 py-3 flex justify-between">
          <Button variant="outline" className="flex-1 mr-2">
            <Link href="#link" className="flex items-center w-full justify-center">
              <ExternalLink className="h-4 w-4 mr-2" />
              Link Programs
            </Link>
          </Button>
          <Button className="flex-1 bg-primary hover:bg-blue-700">
            <Link href="#convert" className="flex items-center w-full justify-center text-white">
              <RefreshCw className="h-4 w-4 mr-2" />
              Convert Points
            </Link>
          </Button>
        </CardFooter>
      </Card>
      
      {/* xPoints Opportunities Section */}
      <div>
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold flex items-center gap-2 text-gray-800">
            <Lightbulb className="h-5 w-5 text-amber-500" />
            <span>xPoints <span className="text-primary">Opportunities</span></span>
          </h2>
          <Link href="/explorer">
            <Button variant="outline" size="sm" className="border border-blue-200 shadow-sm">
              View All
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </Link>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
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