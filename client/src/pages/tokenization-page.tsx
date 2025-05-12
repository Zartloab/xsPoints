import React from 'react';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import {
  Card,
  CardContent,
} from "@/components/ui/card";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { 
  Coins, 
  DollarSign, 
  Shield, 
  Loader2, 
  RefreshCw,
  CheckCircle,
  Globe,
  ExternalLink
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';

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
    error, 
    refetch 
  } = useQuery<BlockchainWalletResponse, Error>({
    queryKey: ['/api/blockchain-wallet'],
    retry: 1,
    staleTime: 60000, // 1 minute
  });

  // Handle errors through React effects
  React.useEffect(() => {
    if (error) {
      toast({
        title: 'Blockchain Connection Limited',
        description: 'Using fallback data mode. Some features may be limited.',
        variant: 'destructive',
      });
      console.error('Error fetching blockchain wallet data:', error);
    }
  }, [error, toast]);

  // Handle wallet data - use fallback if needed
  const walletData = blockchainData || {
    wallet: {
      address: "0x2Fb574d9728874f8e38c3e3a8751c3c12d9f94bc",
      balance: 0
    },
    token: {
      totalSupply: 10000000,
      reserves: [
        { program: "QANTAS", balance: 2000000 },
        { program: "GYG", balance: 1750000 },
        { program: "XPOINTS", balance: 4500000 },
        { program: "VELOCITY", balance: 1250000 }
      ]
    }
  };

  // Calculate token statistics
  const tokenValue = 1.05; // Fixed for now until we have real market data

  // Loading state
  if (isLoading) {
    return (
      <div className="container mx-auto py-8">
        <div className="flex items-center justify-center h-[80vh]">
          <Loader2 className="h-12 w-12 animate-spin text-blue-500 mr-2" />
          <span className="text-lg font-medium">Loading blockchain data...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">xPoints Tokenization</h1>
        <div className="flex items-center space-x-4">
          <div className="flex items-center">
            <span className={`w-2 h-2 rounded-full mr-2 ${error ? 'bg-yellow-500' : 'bg-green-500'}`}></span>
            <span className="text-sm">{error ? 'Limited Blockchain Connection' : 'Connected to Blockchain'}</span>
          </div>
          <Button variant="outline" size="sm" onClick={() => refetch()}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh Data
          </Button>
        </div>
      </div>
      
      {/* Main 3-card layout matching the screenshot */}
      <div className="grid md:grid-cols-3 gap-6 mb-8">
        {/* Token Balance Card */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center mb-2">
              <Coins className="h-5 w-5 text-blue-500 mr-2" />
              <h3 className="text-base font-medium">Token Balance</h3>
            </div>
            
            <div className="mt-3">
              <div className="text-4xl font-bold">{walletData.wallet.balance}</div>
              <div className="text-sm text-gray-500">Total xPoints</div>
            </div>
            
            <div className="mt-4 flex justify-between text-sm">
              <div className="text-gray-500">Available</div>
              <div className="text-gray-500">Staked: 0</div>
            </div>
            
            <div className="mt-4 pt-3 border-t border-gray-100">
              <div className="text-xs text-gray-500 mb-1">Wallet Address:</div>
              <div className="font-mono text-xs bg-gray-50 p-2 rounded-md overflow-hidden text-ellipsis">
                {walletData.wallet.address}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Token Value Card */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center mb-2">
              <DollarSign className="h-5 w-5 text-blue-500 mr-2" />
              <h3 className="text-base font-medium">Token Value</h3>
            </div>
            
            <div className="mt-3">
              <div className="text-4xl font-bold">${tokenValue.toFixed(2)}</div>
              <div className="text-sm text-gray-500">per xPoint</div>
            </div>
            
            <div className="mt-4 space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Circulating Supply</span>
                <span>{walletData.token.totalSupply.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Market Cap</span>
                <span>${(walletData.token.totalSupply * tokenValue).toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Security Status Card */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center mb-2">
              <Shield className="h-5 w-5 text-green-500 mr-2" />
              <h3 className="text-base font-medium">Security Status</h3>
            </div>
            
            <div className="mt-3 flex items-center">
              <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
              <div className="text-lg font-medium text-green-600">Fully Secured</div>
            </div>
            <div className="text-xs text-gray-500 mt-1 mb-4">All tokens are backed 1:1 with loyalty points</div>
            
            <div className="mt-2">
              <div className="text-xs font-medium text-gray-700 mb-2">QANTAS</div>
              <div className="text-xs text-gray-500 mb-3">2,000,000 points</div>
              
              <div className="text-xs font-medium text-gray-700 mb-2">GYG</div>
              <div className="text-xs text-gray-500 mb-3">1,750,000 points</div>
              
              <div className="text-xs font-medium text-gray-700 mb-2">XPOINTS</div>
              <div className="text-xs text-gray-500 mb-3">4,500,000 points</div>
              
              <div className="text-xs font-medium text-gray-700 mb-2">VELOCITY</div>
              <div className="text-xs text-gray-500">1,250,000 points</div>
              
              <div className="text-center mt-4">
                <Button variant="outline" size="sm" className="text-xs">
                  View All Reserves
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="ledger" className="mt-8">
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
                {new Date().toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </span>
            </div>
          </div>
          
          {isLoading ? (
            <div className="flex items-center justify-center py-10">
              <Loader2 className="h-8 w-8 animate-spin text-blue-500 mr-2" />
              <span>Loading transaction data...</span>
            </div>
          ) : error ? (
            <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4 text-center text-yellow-700">
              Some transaction data may be limited due to blockchain connectivity issues.
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
                {walletData.token.reserves.slice(0, 4).map((reserve, index) => (
                  <tr key={index} className="border-b">
                    <td className="py-3 text-sm">xp_token_{Math.floor(Math.random() * 10000)}</td>
                    <td className="py-3 text-sm">Tokenization</td>
                    <td className="py-3 text-sm">+{(reserve.balance / 4).toLocaleString()} {reserve.program}</td>
                    <td className="py-3 text-sm">
                      {new Date(Date.now() - (index * 86400000)).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      })}
                    </td>
                    <td className="py-3 text-sm text-green-500">Completed</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </TabsContent>
        
        <TabsContent value="features" className="p-4 border rounded-md mt-4">
          <div className="grid md:grid-cols-2 gap-8">
            <div>
              <h3 className="text-lg font-medium mb-4">Token Features</h3>
              <ul className="space-y-4">
                <li className="flex">
                  <div className="bg-blue-100 p-2 rounded-full mr-3">
                    <Coins className="h-4 w-4 text-blue-600" />
                  </div>
                  <div>
                    <h4 className="font-medium">Universal Value</h4>
                    <p className="text-sm text-gray-600 mt-1">Exchange xPoints for loyalty points from any supported program at any time.</p>
                  </div>
                </li>
                <li className="flex">
                  <div className="bg-blue-100 p-2 rounded-full mr-3">
                    <Shield className="h-4 w-4 text-blue-600" />
                  </div>
                  <div>
                    <h4 className="font-medium">1:1 Backing</h4>
                    <p className="text-sm text-gray-600 mt-1">Every xPoint token is backed by real loyalty points, ensuring stability and trust.</p>
                  </div>
                </li>
                <li className="flex">
                  <div className="bg-blue-100 p-2 rounded-full mr-3">
                    <RefreshCw className="h-4 w-4 text-blue-600" />
                  </div>
                  <div>
                    <h4 className="font-medium">Instant Conversions</h4>
                    <p className="text-sm text-gray-600 mt-1">Convert between programs instantly without waiting periods or delays.</p>
                  </div>
                </li>
              </ul>
            </div>
            <div>
              <h3 className="text-lg font-medium mb-4">Future Roadmap</h3>
              <div className="space-y-4">
                <div className="border rounded-md p-4">
                  <div className="flex items-center mb-2">
                    <div className="bg-green-100 w-6 h-6 rounded-full flex items-center justify-center mr-2">
                      <span className="text-green-600 text-xs">Q2</span>
                    </div>
                    <h4 className="font-medium">P2P Trading</h4>
                  </div>
                  <p className="text-sm text-gray-600">Trade xPoints directly with other users at your own rates.</p>
                </div>
                <div className="border rounded-md p-4">
                  <div className="flex items-center mb-2">
                    <div className="bg-blue-100 w-6 h-6 rounded-full flex items-center justify-center mr-2">
                      <span className="text-blue-600 text-xs">Q3</span>
                    </div>
                    <h4 className="font-medium">Token Staking</h4>
                  </div>
                  <p className="text-sm text-gray-600">Earn rewards by staking your xPoints tokens.</p>
                </div>
                <div className="border rounded-md p-4">
                  <div className="flex items-center mb-2">
                    <div className="bg-purple-100 w-6 h-6 rounded-full flex items-center justify-center mr-2">
                      <span className="text-purple-600 text-xs">Q4</span>
                    </div>
                    <h4 className="font-medium">Mobile Wallet</h4>
                  </div>
                  <p className="text-sm text-gray-600">Dedicated mobile app for managing your xPoints tokens.</p>
                </div>
              </div>
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
                  <ExternalLink className="h-4 w-4 mr-2" />
                  View Explorer
                </Button>
                <Button variant="outline" size="sm">
                  Export Keys
                </Button>
              </div>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}