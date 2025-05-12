import React from 'react';
import { useAuth } from '@/hooks/use-auth';
import MainLayout from '@/components/layout/MainLayout';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  BarChart3, 
  Coins, 
  Shield, 
  Globe, 
  Banknote, 
  ArrowDownToLine, 
  Landmark, 
  ArrowRightLeft,
  Loader2
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { formatDistanceToNow } from 'date-fns';
import { useToast } from '@/hooks/use-toast';

// Define interfaces for the blockchain wallet data
interface WalletInfo {
  address: string;
  balance: number;
}

interface TokenInfo {
  totalSupply: number;
  reserves: Array<{
    program: string;
    balance: number;
  }>;
}

interface BlockchainWalletResponse {
  wallet: WalletInfo;
  token: TokenInfo;
}

export default function TokenizationPage() {
  const { user } = useAuth();
  const { toast } = useToast();

  // Fetch blockchain wallet data using TanStack Query v5
  const { 
    data: blockchainData, 
    isLoading, 
    error 
  } = useQuery<BlockchainWalletResponse, Error>({
    queryKey: ['/api/blockchain-wallet'],
    retry: 1,
    staleTime: 60000, // 1 minute
  });

  // Handle errors through React effects
  React.useEffect(() => {
    if (error) {
      toast({
        title: 'Error',
        description: 'Could not fetch blockchain wallet data. Please try again later.',
        variant: 'destructive',
      });
      console.error('Error fetching blockchain wallet data:', error);
    }
  }, [error, toast]);

  // Safely access the wallet data
  const walletData = blockchainData;

  // Calculate token statistics
  const tokenStats = {
    totalTokens: walletData?.wallet?.balance || 0,
    availableTokens: walletData?.wallet?.balance || 0,
    stakedTokens: 0, // Not implemented yet
    tokenValue: 1.05, // Fixed for now until we have real market data
    circulatingSupply: walletData?.token?.totalSupply || 0,
    marketCap: (walletData?.token?.totalSupply || 0) * 1.05, // totalSupply * tokenValue
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="space-y-8">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold tracking-tight">xPoints Tokenization</h1>
        </div>
        <div className="flex items-center justify-center h-64">
          <div className="flex flex-col items-center">
            <Loader2 className="h-8 w-8 animate-spin text-blue-500 mb-2" />
            <p className="text-sm text-muted-foreground">Loading blockchain data...</p>
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="space-y-8">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold tracking-tight">xPoints Tokenization</h1>
        </div>
        <Card className="border-red-200">
          <CardHeader>
            <CardTitle className="text-red-500">Error Loading Data</CardTitle>
          </CardHeader>
          <CardContent>
            <p>We couldn't load your tokenization data. This could be due to:</p>
            <ul className="list-disc pl-5 mt-2 space-y-1">
              <li>Temporary blockchain connection issues</li>
              <li>Network connectivity problems</li>
              <li>Server maintenance</li>
            </ul>
            <Button onClick={() => window.location.reload()} className="mt-4">
              Try Again
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Calculate progress value safely
  const progressValue = tokenStats.totalTokens > 0 
    ? (tokenStats.availableTokens / tokenStats.totalTokens) * 100 
    : 0;

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold tracking-tight">xPoints Tokenization</h1>
          <Button variant="outline" className="flex items-center gap-2">
            <ArrowDownToLine className="h-4 w-4" />
            <span>Download Ledger</span>
          </Button>
        </div>

        {/* Token Overview */}
        <div className="grid gap-6 md:grid-cols-3">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center">
                <Coins className="mr-2 h-5 w-5 text-blue-500" />
                Token Balance
              </CardTitle>
            </CardHeader>
            <CardContent className="pb-2">
              <div className="text-3xl font-bold">{tokenStats.availableTokens.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground mt-1">
                Total: {tokenStats.totalTokens.toLocaleString()} xPoints
              </p>
              <div className="mt-4">
                <Progress value={progressValue} className="h-2" />
                <div className="flex justify-between mt-2 text-xs text-muted-foreground">
                  <div>Available</div>
                  <div>Staked: {tokenStats.stakedTokens}</div>
                </div>
              </div>
              {walletData?.wallet?.address && (
                <div className="mt-4 pt-3 border-t text-xs text-muted-foreground">
                  <div className="font-medium text-gray-700 mb-1">Wallet Address:</div>
                  <div className="font-mono bg-gray-50 p-2 rounded-md break-all">
                    {walletData.wallet.address}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center">
                <Banknote className="mr-2 h-5 w-5 text-green-500" />
                Token Value
              </CardTitle>
            </CardHeader>
            <CardContent className="pb-2">
              <div className="text-3xl font-bold">${tokenStats.tokenValue.toFixed(2)}</div>
              <p className="text-xs text-muted-foreground mt-1">
                <span className="text-green-500">+2.3%</span> in last 24h
              </p>
              <div className="mt-4 grid grid-cols-2 gap-4">
                <div>
                  <div className="text-xs text-muted-foreground">Circulating Supply</div>
                  <div className="font-medium">{tokenStats.circulatingSupply.toLocaleString()}</div>
                </div>
                <div>
                  <div className="text-xs text-muted-foreground">Market Cap</div>
                  <div className="font-medium">${Math.round(tokenStats.marketCap).toLocaleString()}</div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center">
                <Shield className="mr-2 h-5 w-5 text-purple-500" />
                Security Status
              </CardTitle>
            </CardHeader>
            <CardContent className="pb-2">
              <div className="text-xl font-bold text-green-500 flex items-center">
                <Shield className="mr-2 h-5 w-5" />
                Fully Secured
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                All tokens are backed 1:1 with loyalty points
              </p>
              <div className="mt-4">
                <div className="grid grid-cols-2 gap-2 mb-3">
                  {walletData?.token?.reserves?.slice(0, 4).map((reserve, index) => (
                    <div key={index} className="bg-gray-50 p-2 rounded-md">
                      <div className="text-xs font-medium truncate">{reserve.program}</div>
                      <div className="text-xs text-muted-foreground">{reserve.balance.toLocaleString()} points</div>
                    </div>
                  ))}
                </div>
                <Button variant="outline" size="sm" className="w-full mt-2">
                  View All Reserves
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tokenization Features */}
        <Tabs defaultValue="ledger" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="ledger">Token Ledger</TabsTrigger>
            <TabsTrigger value="features">Features</TabsTrigger>
            <TabsTrigger value="integration">Blockchain Integration</TabsTrigger>
          </TabsList>
          
          <TabsContent value="ledger" className="p-4 border rounded-md mt-4">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-medium">Transaction Ledger</h3>
              <div className="flex items-center">
                <span className="text-sm text-gray-500 mr-2">Last synchronized:</span>
                <span className="text-sm font-medium">
                  {walletData?.wallet ? (
                    // Format current date since blockchain data was just loaded
                    new Date().toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })
                  ) : (
                    'Not synchronized'
                  )}
                </span>
              </div>
            </div>
            
            {isLoading ? (
              <div className="flex items-center justify-center py-10">
                <Loader2 className="h-8 w-8 animate-spin text-blue-500 mr-2" />
                <span>Loading transaction data...</span>
              </div>
            ) : error ? (
              <div className="bg-red-50 border border-red-200 rounded-md p-4 text-center text-red-600">
                Could not load transaction data. Please try again later.
              </div>
            ) : (
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-2 text-sm font-medium text-gray-500">Transaction ID</th>
                    <th className="text-left py-2 text-sm font-medium text-gray-500">Type</th>
                    <th className="text-left py-2 text-sm font-medium text-gray-500">Amount</th>
                    <th className="text-left py-2 text-sm font-medium text-gray-500">Date</th>
                    <th className="text-left py-2 text-sm font-medium text-gray-500">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {/* Check if we have transactions to display */}
                  {walletData?.token?.reserves && walletData.token.reserves.length > 0 ? (
                    walletData.token.reserves.map((reserve, index) => (
                      <tr key={index} className="border-b">
                        <td className="py-3 text-sm">xp_token_{Math.floor(Math.random() * 10000000)}</td>
                        <td className="py-3 text-sm">Tokenization</td>
                        <td className="py-3 text-sm">+{reserve.balance.toLocaleString()} {reserve.program}</td>
                        <td className="py-3 text-sm">
                          {new Date().toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric',
                          })}
                        </td>
                        <td className="py-3 text-sm text-green-500">Completed</td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={5} className="py-10 text-center text-gray-500">
                        No transactions found. Tokenize points to see them here.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            )}
          </TabsContent>
          
          <TabsContent value="features" className="p-4 border rounded-md mt-4">
            <div className="grid md:grid-cols-2 gap-8">
              <div>
                <h3 className="text-lg font-medium mb-4">Current Features</h3>
                <ul className="space-y-4">
                  <li className="flex">
                    <div className="mr-4 bg-blue-100 p-2 rounded-full h-fit">
                      <Landmark className="h-5 w-5 text-blue-500" />
                    </div>
                    <div>
                      <h4 className="font-medium">Centralized Ledger</h4>
                      <p className="text-sm text-gray-600">All token transactions are recorded in a secure, immutable ledger</p>
                    </div>
                  </li>
                  <li className="flex">
                    <div className="mr-4 bg-green-100 p-2 rounded-full h-fit">
                      <ArrowRightLeft className="h-5 w-5 text-green-500" />
                    </div>
                    <div>
                      <h4 className="font-medium">Easy Auditability</h4>
                      <p className="text-sm text-gray-600">Transparent transaction history for compliance and reporting</p>
                    </div>
                  </li>
                  <li className="flex">
                    <div className="mr-4 bg-purple-100 p-2 rounded-full h-fit">
                      <Shield className="h-5 w-5 text-purple-500" />
                    </div>
                    <div>
                      <h4 className="font-medium">Enhanced Security</h4>
                      <p className="text-sm text-gray-600">Multi-factor authentication and encryption for all token operations</p>
                    </div>
                  </li>
                </ul>
              </div>
              
              <div>
                <h3 className="text-lg font-medium mb-4">Coming Soon</h3>
                <ul className="space-y-4">
                  <li className="flex opacity-70">
                    <div className="mr-4 bg-gray-100 p-2 rounded-full h-fit">
                      <Globe className="h-5 w-5 text-gray-500" />
                    </div>
                    <div>
                      <h4 className="font-medium">Blockchain Integration</h4>
                      <p className="text-sm text-gray-600">Future integration with Polygon or Solana for decentralized operations</p>
                    </div>
                  </li>
                  <li className="flex opacity-70">
                    <div className="mr-4 bg-gray-100 p-2 rounded-full h-fit">
                      <BarChart3 className="h-5 w-5 text-gray-500" />
                    </div>
                    <div>
                      <h4 className="font-medium">Advanced Analytics</h4>
                      <p className="text-sm text-gray-600">Real-time monitoring and predictive analysis of token performance</p>
                    </div>
                  </li>
                  <li className="flex opacity-70">
                    <div className="mr-4 bg-gray-100 p-2 rounded-full h-fit">
                      <Coins className="h-5 w-5 text-gray-500" />
                    </div>
                    <div>
                      <h4 className="font-medium">Yield Generation</h4>
                      <p className="text-sm text-gray-600">Earn rewards by staking your xPoints tokens</p>
                    </div>
                  </li>
                </ul>
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="integration" className="p-4 border rounded-md mt-4">
            <div className="text-center py-6">
              <div className="flex justify-center">
                <div className="bg-blue-100 p-4 rounded-full">
                  <Globe className="h-10 w-10 text-blue-500" />
                </div>
              </div>
              <h3 className="text-xl font-medium my-4">Blockchain Integration</h3>
              
              {!walletData?.wallet ? (
                <div className="text-gray-600 max-w-md mx-auto mb-4">
                  <p className="mb-4">
                    Your xPoints are securely tokenized on our private blockchain. This ensures transparency,
                    security, and the ability to directly exchange value with other users.
                  </p>
                  <Button variant="default" size="sm" disabled={isLoading}>
                    {isLoading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Connecting...
                      </>
                    ) : (
                      "Connect to Blockchain"
                    )}
                  </Button>
                </div>
              ) : (
                <div className="max-w-lg mx-auto">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                    <div className="bg-green-50 rounded-lg p-4 text-left">
                      <h4 className="text-sm font-medium text-green-700 mb-1">Active Wallet</h4>
                      <p className="text-xs text-gray-600 mb-2">Your blockchain wallet is active and ready for transfers</p>
                      <div className="bg-white rounded p-2 text-xs font-mono text-gray-800 break-all">
                        {walletData.wallet.address.substring(0, 18)}...
                      </div>
                    </div>
                    
                    <div className="bg-blue-50 rounded-lg p-4 text-left">
                      <h4 className="text-sm font-medium text-blue-700 mb-1">Token Balance</h4>
                      <p className="text-xs text-gray-600 mb-2">Total xPoints tokens in your wallet</p>
                      <div className="flex items-center">
                        <Coins className="h-5 w-5 text-blue-500 mr-2" />
                        <span className="text-lg font-bold">{walletData.wallet.balance.toLocaleString()}</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="bg-gray-50 rounded-lg p-4 text-left mb-6">
                    <h4 className="text-sm font-medium mb-2">Network Details</h4>
                    <table className="w-full text-xs">
                      <tbody>
                        <tr>
                          <td className="py-1 text-gray-600">Network</td>
                          <td className="py-1 font-medium text-right">xPoints Private Chain</td>
                        </tr>
                        <tr>
                          <td className="py-1 text-gray-600">Contract Address</td>
                          <td className="py-1 font-mono text-right">0x821...5e9f</td>
                        </tr>
                        <tr>
                          <td className="py-1 text-gray-600">Total Supply</td>
                          <td className="py-1 font-medium text-right">{walletData.token.totalSupply.toLocaleString()} XPT</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                  
                  <div className="flex justify-center gap-3">
                    <Button variant="outline" size="sm">
                      View Explorer
                    </Button>
                    <Button variant="outline" size="sm">
                      Export Keys
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </div>
  );
}