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
  ArrowRightLeft 
} from 'lucide-react';

export default function TokenizationPage() {
  const { user } = useAuth();

  // Mock data for tokenization dashboard
  const tokenStats = {
    totalTokens: 2450,
    availableTokens: 1850,
    stakedTokens: 600,
    tokenValue: 1.05,
    circulatingSupply: 250000,
    marketCap: 262500,
  };

  return (
    <MainLayout>
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
                <Progress value={(tokenStats.availableTokens / tokenStats.totalTokens) * 100} className="h-2" />
                <div className="flex justify-between mt-2 text-xs text-muted-foreground">
                  <div>Available</div>
                  <div>Staked: {tokenStats.stakedTokens}</div>
                </div>
              </div>
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
                  <div className="font-medium">${tokenStats.marketCap.toLocaleString()}</div>
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
              <div className="mt-4 grid grid-cols-1 gap-2">
                <div className="bg-gray-50 p-2 rounded-md">
                  <div className="text-xs font-medium">Last Audit: May 1, 2023</div>
                  <div className="text-xs text-muted-foreground">By: TokenSafe Audit</div>
                </div>
                <Button variant="outline" size="sm" className="w-full mt-2">
                  View Certificate
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
                <span className="text-sm font-medium">May 6, 2023 • 09:42 AM</span>
              </div>
            </div>
            
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
                <tr className="border-b">
                  <td className="py-3 text-sm">xp_token_78912345</td>
                  <td className="py-3 text-sm">Tokenization</td>
                  <td className="py-3 text-sm">+500 xPoints</td>
                  <td className="py-3 text-sm">May 5, 2023</td>
                  <td className="py-3 text-sm text-green-500">Completed</td>
                </tr>
                <tr className="border-b">
                  <td className="py-3 text-sm">xp_token_78912341</td>
                  <td className="py-3 text-sm">Staking</td>
                  <td className="py-3 text-sm">-200 xPoints</td>
                  <td className="py-3 text-sm">May 3, 2023</td>
                  <td className="py-3 text-sm text-green-500">Completed</td>
                </tr>
                <tr className="border-b">
                  <td className="py-3 text-sm">xp_token_78912337</td>
                  <td className="py-3 text-sm">Redemption</td>
                  <td className="py-3 text-sm">-150 xPoints</td>
                  <td className="py-3 text-sm">May 1, 2023</td>
                  <td className="py-3 text-sm text-green-500">Completed</td>
                </tr>
                <tr className="border-b">
                  <td className="py-3 text-sm">xp_token_78912330</td>
                  <td className="py-3 text-sm">Tokenization</td>
                  <td className="py-3 text-sm">+1000 xPoints</td>
                  <td className="py-3 text-sm">Apr 28, 2023</td>
                  <td className="py-3 text-sm text-green-500">Completed</td>
                </tr>
              </tbody>
            </table>
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
            <div className="text-center py-12">
              <Globe className="mx-auto h-16 w-16 text-gray-300 mb-4" />
              <h3 className="text-xl font-medium mb-2">Blockchain Integration Coming Soon</h3>
              <p className="text-gray-600 max-w-md mx-auto mb-8">
                We're working on integrating xPoints with Polygon and Solana blockchains to offer enhanced security, 
                transparency, and new functionality.
              </p>
              <div className="inline-flex items-center rounded-md bg-blue-50 px-3 py-1 text-xs font-medium text-blue-700 ring-1 ring-inset ring-blue-600/20">
                Estimated Q3 2023
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </MainLayout>
  );
}