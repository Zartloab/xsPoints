import React, { useState } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { usePreferredLayout } from '@/hooks/use-mobile';
import MainLayout from '@/components/layout/MainLayout';
import MobileExplorerPage from '@/components/mobile/MobileExplorerPage';
import PointsTranslator from '@/components/PointsTranslator';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  BarChart3,
  LineChart,
  PieChart,
  AreaChart,
  TrendingUp,
  TrendingDown,
  Globe,
  Calendar,
  Download,
  Search,
  Filter,
  RefreshCw
} from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

// Mock conversion data for charts
const mockConversionData = {
  daily: {
    total: 15650,
    change: 8.2,
    trend: 'up',
  },
  programs: [
    { name: 'Qantas', value: 25 },
    { name: 'GYG', value: 18 },
    { name: 'xPoints', value: 27 },
    { name: 'Velocity', value: 10 },
    { name: 'Amex', value: 8 },
    { name: 'Others', value: 12 },
  ],
  rates: [
    // Qantas exchange rates
    { from: 'QANTAS', to: 'XPOINTS', rate: 0.5, change: 0 },
    { from: 'QANTAS', to: 'GYG', rate: 0.4, change: -0.05 },
    { from: 'QANTAS', to: 'VELOCITY', rate: 0.7, change: 0.1 },
    { from: 'QANTAS', to: 'AMEX', rate: 0.35, change: 0 },
    { from: 'QANTAS', to: 'FLYBUYS', rate: 0.45, change: 0.05 },
    { from: 'QANTAS', to: 'HILTON', rate: 0.8, change: 0 },
    { from: 'QANTAS', to: 'MARRIOTT', rate: 0.6, change: -0.1 },
    { from: 'QANTAS', to: 'AIRBNB', rate: 0.3, change: 0 },
    { from: 'QANTAS', to: 'DELTA', rate: 0.7, change: 0.05 },
    
    // GYG exchange rates
    { from: 'GYG', to: 'XPOINTS', rate: 0.8, change: 0.1 },
    { from: 'GYG', to: 'QANTAS', rate: 2.5, change: 0.2 },
    { from: 'GYG', to: 'VELOCITY', rate: 2.1, change: 0 },
    { from: 'GYG', to: 'AMEX', rate: 1.8, change: 0.1 },
    { from: 'GYG', to: 'FLYBUYS', rate: 2.0, change: -0.1 },
    { from: 'GYG', to: 'HILTON', rate: 2.2, change: 0 },
    { from: 'GYG', to: 'MARRIOTT', rate: 1.9, change: 0.05 },
    { from: 'GYG', to: 'AIRBNB', rate: 1.5, change: 0 },
    { from: 'GYG', to: 'DELTA', rate: 2.3, change: 0 },
    
    // xPoints exchange rates
    { from: 'XPOINTS', to: 'QANTAS', rate: 1.8, change: -0.2 },
    { from: 'XPOINTS', to: 'GYG', rate: 1.25, change: 0 },
    { from: 'XPOINTS', to: 'VELOCITY', rate: 1.5, change: 0.1 },
    { from: 'XPOINTS', to: 'AMEX', rate: 1.2, change: 0 },
    { from: 'XPOINTS', to: 'FLYBUYS', rate: 1.3, change: 0.05 },
    { from: 'XPOINTS', to: 'HILTON', rate: 1.7, change: -0.1 },
    { from: 'XPOINTS', to: 'MARRIOTT', rate: 1.4, change: 0 },
    { from: 'XPOINTS', to: 'AIRBNB', rate: 1.0, change: 0.2 },
    { from: 'XPOINTS', to: 'DELTA', rate: 1.6, change: 0 },
    
    // Velocity exchange rates
    { from: 'VELOCITY', to: 'XPOINTS', rate: 0.65, change: 0 },
    { from: 'VELOCITY', to: 'QANTAS', rate: 1.4, change: 0.1 },
    { from: 'VELOCITY', to: 'GYG', rate: 0.55, change: 0 },
    
    // AMEX exchange rates
    { from: 'AMEX', to: 'XPOINTS', rate: 0.85, change: 0.05 },
    { from: 'AMEX', to: 'QANTAS', rate: 1.6, change: 0 },
    { from: 'AMEX', to: 'MARRIOTT', rate: 1.2, change: 0.1 },
    
    // FLYBUYS exchange rates
    { from: 'FLYBUYS', to: 'XPOINTS', rate: 0.75, change: 0 },
    { from: 'FLYBUYS', to: 'QANTAS', rate: 1.45, change: -0.1 },
    
    // HILTON exchange rates
    { from: 'HILTON', to: 'XPOINTS', rate: 0.6, change: 0.05 },
    { from: 'HILTON', to: 'MARRIOTT', rate: 0.9, change: 0 },
    
    // MARRIOTT exchange rates
    { from: 'MARRIOTT', to: 'XPOINTS', rate: 0.7, change: 0 },
    { from: 'MARRIOTT', to: 'HILTON', rate: 1.1, change: 0.05 },
    
    // AIRBNB exchange rates
    { from: 'AIRBNB', to: 'XPOINTS', rate: 0.95, change: 0.1 },
    
    // DELTA exchange rates
    { from: 'DELTA', to: 'XPOINTS', rate: 0.55, change: 0 },
    { from: 'DELTA', to: 'QANTAS', rate: 1.3, change: -0.05 },
  ],
  circulatingPoints: {
    QANTAS: 12500000,
    GYG: 8350000,
    XPOINTS: 2750000,
    VELOCITY: 5250000,
    AMEX: 4120000,
    FLYBUYS: 6830000,
    HILTON: 3950000,
    MARRIOTT: 4780000,
    AIRBNB: 1250000,
    DELTA: 7650000,
  },
};

export default function ExplorerPage() {
  const { user } = useAuth();
  const [dateRange, setDateRange] = useState('30days');
  const { useMobileLayout } = usePreferredLayout();
  
  // Use mobile-optimized layout on mobile devices
  if (useMobileLayout) {
    return <MobileExplorerPage />;
  }

  return (
    <MainLayout>
      <div className="space-y-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Transparency Explorer</h1>
            <p className="text-muted-foreground">Explore platform-wide data and market conversion trends.</p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              <Select 
                defaultValue={dateRange} 
                onValueChange={setDateRange}
              >
                <SelectTrigger className="bg-transparent border-0 px-0 h-auto shadow-none">
                  <SelectValue placeholder="Select range" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="7days">Last 7 days</SelectItem>
                  <SelectItem value="30days">Last 30 days</SelectItem>
                  <SelectItem value="90days">Last 90 days</SelectItem>
                  <SelectItem value="year">Last 12 months</SelectItem>
                </SelectContent>
              </Select>
            </Button>
            <Button variant="outline" className="flex items-center gap-2">
              <Download className="h-4 w-4" />
              <span>Export Data</span>
            </Button>
          </div>
        </div>

        {/* Dashboard Overview */}
        <div className="grid gap-6 md:grid-cols-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Total Conversions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{mockConversionData.daily.total.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground mt-1 flex items-center">
                {mockConversionData.daily.trend === 'up' ? (
                  <>
                    <TrendingUp className="h-3 w-3 text-green-500 mr-1" />
                    <span className="text-green-500">+{mockConversionData.daily.change}%</span>
                  </>
                ) : (
                  <>
                    <TrendingDown className="h-3 w-3 text-red-500 mr-1" />
                    <span className="text-red-500">-{mockConversionData.daily.change}%</span>
                  </>
                )}
                <span className="ml-1">from previous period</span>
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">By Program Distribution</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                {mockConversionData.programs.map((program) => (
                  <div key={program.name} className="text-center">
                    <div className="text-xl font-bold">{program.value}%</div>
                    <p className="text-xs text-muted-foreground">{program.name}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Most Popular Route</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-center">
                <div className="text-center">
                  <div className="bg-primary-100 text-primary-600 font-bold rounded-full w-12 h-12 flex items-center justify-center mx-auto">
                    Q
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">Qantas</div>
                </div>
                <div className="mx-2">
                  <RefreshCw className="h-4 w-4 text-primary" />
                </div>
                <div className="text-center">
                  <div className="bg-primary-100 text-primary-600 font-bold rounded-full w-12 h-12 flex items-center justify-center mx-auto">
                    X
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">xPoints</div>
                </div>
              </div>
              <p className="text-xs text-center mt-3 text-muted-foreground">
                34% of all conversions
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Points in Circulation</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">23.6M</div>
              <p className="text-xs text-muted-foreground mt-1">
                Across all loyalty programs
              </p>
              <div className="mt-2 pt-2 border-t">
                <div className="flex justify-between items-center text-xs">
                  <span>xPoints: {(mockConversionData.circulatingPoints.XPOINTS / 1000000).toFixed(1)}M</span>
                  <span className="text-green-500">+12%</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Explorer Tabs */}
        <Tabs defaultValue="market" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="market">Market Trends</TabsTrigger>
            <TabsTrigger value="rates">Exchange Rates</TabsTrigger>
            <TabsTrigger value="circulation">Points in Circulation</TabsTrigger>
            <TabsTrigger value="translator">Points Translator</TabsTrigger>
          </TabsList>
          
          <TabsContent value="market" className="p-4 border rounded-md mt-4">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-medium">Point Conversion Trends</h3>
              <div className="flex items-center">
                <div className="flex items-center mr-4">
                  <div className="w-3 h-3 bg-blue-500 rounded-full mr-2"></div>
                  <span className="text-sm text-gray-500">Qantas → xPoints</span>
                </div>
                <div className="flex items-center mr-4">
                  <div className="w-3 h-3 bg-yellow-500 rounded-full mr-2"></div>
                  <span className="text-sm text-gray-500">GYG → xPoints</span>
                </div>
                <div className="flex items-center">
                  <div className="w-3 h-3 bg-green-500 rounded-full mr-2"></div>
                  <span className="text-sm text-gray-500">xPoints → Others</span>
                </div>
              </div>
            </div>
            
            {/* Line chart placeholder */}
            <div className="bg-gray-50 rounded-lg p-4 h-80 mb-6 flex items-center justify-center">
              <div className="text-center">
                <LineChart className="h-16 w-16 text-gray-300 mx-auto mb-2" />
                <div className="text-gray-500 text-sm">
                  Interactive trend chart would be rendered here<br />
                  Showing conversion volume over time by program
                </div>
              </div>
            </div>
            
            <div className="grid md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Conversion Volume by Day</CardTitle>
                  <CardDescription>Last 7 days of activity</CardDescription>
                </CardHeader>
                <CardContent>
                  {/* Bar chart placeholder */}
                  <div className="bg-gray-50 rounded-lg p-4 h-48 flex items-center justify-center">
                    <div className="text-center">
                      <BarChart3 className="h-10 w-10 text-gray-300 mx-auto mb-2" />
                      <div className="text-gray-500 text-sm">Daily conversion volume</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Popular Conversion Routes</CardTitle>
                  <CardDescription>Top conversion paths</CardDescription>
                </CardHeader>
                <CardContent>
                  {/* Pie chart placeholder */}
                  <div className="bg-gray-50 rounded-lg p-4 h-48 flex items-center justify-center">
                    <div className="text-center">
                      <PieChart className="h-10 w-10 text-gray-300 mx-auto mb-2" />
                      <div className="text-gray-500 text-sm">Distribution by program pair</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
          
          <TabsContent value="rates" className="p-4 border rounded-md mt-4">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-medium">Current Exchange Rates</h3>
              <div className="flex items-center gap-2">
                <div className="relative">
                  <Search className="h-4 w-4 absolute left-2.5 top-2.5 text-gray-400" />
                  <Input
                    type="search"
                    placeholder="Search rates"
                    className="pl-8 w-60 text-sm"
                  />
                </div>
                <Button variant="outline" size="sm">
                  <Filter className="h-4 w-4 mr-1" />
                  Filter
                </Button>
              </div>
            </div>
            
            <div className="bg-white shadow-sm rounded-lg overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50">
                    <th className="py-3 px-4 text-left font-medium text-gray-500">From</th>
                    <th className="py-3 px-4 text-left font-medium text-gray-500">To</th>
                    <th className="py-3 px-4 text-left font-medium text-gray-500">Rate</th>
                    <th className="py-3 px-4 text-left font-medium text-gray-500">Change (24h)</th>
                    <th className="py-3 px-4 text-left font-medium text-gray-500">Historical</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {mockConversionData.rates.map((rate, index) => (
                    <tr key={index} className="hover:bg-gray-50">
                      <td className="py-3 px-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="w-8 h-8 rounded-full bg-primary-100 flex items-center justify-center mr-2">
                            <span className="font-medium text-primary-700">{rate.from.charAt(0)}</span>
                          </div>
                          <div className="font-medium">{rate.from}</div>
                        </div>
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="w-8 h-8 rounded-full bg-primary-100 flex items-center justify-center mr-2">
                            <span className="font-medium text-primary-700">{rate.to.charAt(0)}</span>
                          </div>
                          <div className="font-medium">{rate.to}</div>
                        </div>
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap font-medium">
                        1 : {rate.rate}
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap">
                        {rate.change === 0 ? (
                          <span className="text-gray-500">No change</span>
                        ) : rate.change > 0 ? (
                          <span className="text-green-500 flex items-center">
                            <TrendingUp className="h-3 w-3 mr-1" />
                            +{rate.change}
                          </span>
                        ) : (
                          <span className="text-red-500 flex items-center">
                            <TrendingDown className="h-3 w-3 mr-1" />
                            {rate.change}
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap">
                        <Button variant="ghost" size="sm">View History</Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            
            <div className="mt-8">
              <h3 className="text-lg font-medium mb-4">Exchange Rate History</h3>
              
              {/* Area chart placeholder */}
              <div className="bg-gray-50 rounded-lg p-4 h-80 flex items-center justify-center">
                <div className="text-center">
                  <AreaChart className="h-16 w-16 text-gray-300 mx-auto mb-2" />
                  <div className="text-gray-500 text-sm">
                    Interactive chart would be rendered here<br />
                    Showing exchange rate fluctuations over time
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="circulation" className="p-4 border rounded-md mt-4">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-medium">Points in Circulation Dashboard</h3>
              <Button variant="outline" size="sm" className="flex items-center gap-2">
                <Globe className="h-4 w-4" />
                <span>View Global Map</span>
              </Button>
            </div>
            
            <div className="grid md:grid-cols-3 lg:grid-cols-5 gap-4 mb-8">
              {/* QANTAS Card */}
              <Card>
                <CardHeader className="pb-2">
                  <div className="flex items-center">
                    <div className="w-8 h-8 rounded-full bg-red-100 flex items-center justify-center mr-2">
                      <span className="font-medium text-red-700">Q</span>
                    </div>
                    <CardTitle className="text-base">Qantas Points</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{(mockConversionData.circulatingPoints.QANTAS / 1000000).toFixed(1)}M</div>
                  <p className="text-xs text-muted-foreground mt-1 flex items-center">
                    <TrendingUp className="h-3 w-3 text-green-500 mr-1" />
                    <span className="text-green-500">+5.3%</span>
                    <span className="ml-1">from previous month</span>
                  </p>
                  <div className="mt-4">
                    <div className="bg-gray-100 h-2 rounded-full w-full overflow-hidden">
                      <div className="bg-red-500 h-full rounded-full" style={{ width: '21%' }}></div>
                    </div>
                    <div className="flex justify-between mt-1 text-xs text-muted-foreground">
                      <span>21% of total circulation</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              {/* GYG Card */}
              <Card>
                <CardHeader className="pb-2">
                  <div className="flex items-center">
                    <div className="w-8 h-8 rounded-full bg-yellow-100 flex items-center justify-center mr-2">
                      <span className="font-medium text-yellow-700">G</span>
                    </div>
                    <CardTitle className="text-base">GYG Points</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{(mockConversionData.circulatingPoints.GYG / 1000000).toFixed(1)}M</div>
                  <p className="text-xs text-muted-foreground mt-1 flex items-center">
                    <TrendingUp className="h-3 w-3 text-green-500 mr-1" />
                    <span className="text-green-500">+8.7%</span>
                    <span className="ml-1">from previous month</span>
                  </p>
                  <div className="mt-4">
                    <div className="bg-gray-100 h-2 rounded-full w-full overflow-hidden">
                      <div className="bg-yellow-500 h-full rounded-full" style={{ width: '14%' }}></div>
                    </div>
                    <div className="flex justify-between mt-1 text-xs text-muted-foreground">
                      <span>14% of total circulation</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              {/* xPoints Card */}
              <Card>
                <CardHeader className="pb-2">
                  <div className="flex items-center">
                    <div className="w-8 h-8 rounded-full bg-primary-100 flex items-center justify-center mr-2">
                      <span className="font-medium text-primary-700">X</span>
                    </div>
                    <CardTitle className="text-base">xPoints</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{(mockConversionData.circulatingPoints.XPOINTS / 1000000).toFixed(1)}M</div>
                  <p className="text-xs text-muted-foreground mt-1 flex items-center">
                    <TrendingUp className="h-3 w-3 text-green-500 mr-1" />
                    <span className="text-green-500">+12.1%</span>
                    <span className="ml-1">from previous month</span>
                  </p>
                  <div className="mt-4">
                    <div className="bg-gray-100 h-2 rounded-full w-full overflow-hidden">
                      <div className="bg-primary h-full rounded-full" style={{ width: '5%' }}></div>
                    </div>
                    <div className="flex justify-between mt-1 text-xs text-muted-foreground">
                      <span>5% of total circulation</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              {/* Velocity Card */}
              <Card>
                <CardHeader className="pb-2">
                  <div className="flex items-center">
                    <div className="w-8 h-8 rounded-full bg-red-100 flex items-center justify-center mr-2">
                      <span className="font-medium text-red-700">V</span>
                    </div>
                    <CardTitle className="text-base">Velocity Points</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{(mockConversionData.circulatingPoints.VELOCITY / 1000000).toFixed(1)}M</div>
                  <p className="text-xs text-muted-foreground mt-1 flex items-center">
                    <TrendingUp className="h-3 w-3 text-green-500 mr-1" />
                    <span className="text-green-500">+3.1%</span>
                    <span className="ml-1">from previous month</span>
                  </p>
                  <div className="mt-4">
                    <div className="bg-gray-100 h-2 rounded-full w-full overflow-hidden">
                      <div className="bg-red-400 h-full rounded-full" style={{ width: '9%' }}></div>
                    </div>
                    <div className="flex justify-between mt-1 text-xs text-muted-foreground">
                      <span>9% of total circulation</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              {/* AMEX Card */}
              <Card>
                <CardHeader className="pb-2">
                  <div className="flex items-center">
                    <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center mr-2">
                      <span className="font-medium text-purple-700">A</span>
                    </div>
                    <CardTitle className="text-base">Amex Points</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{(mockConversionData.circulatingPoints.AMEX / 1000000).toFixed(1)}M</div>
                  <p className="text-xs text-muted-foreground mt-1 flex items-center">
                    <TrendingUp className="h-3 w-3 text-green-500 mr-1" />
                    <span className="text-green-500">+1.8%</span>
                    <span className="ml-1">from previous month</span>
                  </p>
                  <div className="mt-4">
                    <div className="bg-gray-100 h-2 rounded-full w-full overflow-hidden">
                      <div className="bg-purple-500 h-full rounded-full" style={{ width: '7%' }}></div>
                    </div>
                    <div className="flex justify-between mt-1 text-xs text-muted-foreground">
                      <span>7% of total circulation</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              {/* FLYBUYS Card */}
              <Card>
                <CardHeader className="pb-2">
                  <div className="flex items-center">
                    <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center mr-2">
                      <span className="font-medium text-green-700">F</span>
                    </div>
                    <CardTitle className="text-base">Flybuys Points</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{(mockConversionData.circulatingPoints.FLYBUYS / 1000000).toFixed(1)}M</div>
                  <p className="text-xs text-muted-foreground mt-1 flex items-center">
                    <TrendingUp className="h-3 w-3 text-green-500 mr-1" />
                    <span className="text-green-500">+5.2%</span>
                    <span className="ml-1">from previous month</span>
                  </p>
                  <div className="mt-4">
                    <div className="bg-gray-100 h-2 rounded-full w-full overflow-hidden">
                      <div className="bg-green-500 h-full rounded-full" style={{ width: '11%' }}></div>
                    </div>
                    <div className="flex justify-between mt-1 text-xs text-muted-foreground">
                      <span>11% of total circulation</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              {/* HILTON Card */}
              <Card>
                <CardHeader className="pb-2">
                  <div className="flex items-center">
                    <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center mr-2">
                      <span className="font-medium text-blue-700">H</span>
                    </div>
                    <CardTitle className="text-base">Hilton Points</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{(mockConversionData.circulatingPoints.HILTON / 1000000).toFixed(1)}M</div>
                  <p className="text-xs text-muted-foreground mt-1 flex items-center">
                    <TrendingUp className="h-3 w-3 text-green-500 mr-1" />
                    <span className="text-green-500">+2.1%</span>
                    <span className="ml-1">from previous month</span>
                  </p>
                  <div className="mt-4">
                    <div className="bg-gray-100 h-2 rounded-full w-full overflow-hidden">
                      <div className="bg-blue-500 h-full rounded-full" style={{ width: '7%' }}></div>
                    </div>
                    <div className="flex justify-between mt-1 text-xs text-muted-foreground">
                      <span>7% of total circulation</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              {/* MARRIOTT Card */}
              <Card>
                <CardHeader className="pb-2">
                  <div className="flex items-center">
                    <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center mr-2">
                      <span className="font-medium text-indigo-700">M</span>
                    </div>
                    <CardTitle className="text-base">Marriott Points</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{(mockConversionData.circulatingPoints.MARRIOTT / 1000000).toFixed(1)}M</div>
                  <p className="text-xs text-muted-foreground mt-1 flex items-center">
                    <TrendingUp className="h-3 w-3 text-green-500 mr-1" />
                    <span className="text-green-500">+1.9%</span>
                    <span className="ml-1">from previous month</span>
                  </p>
                  <div className="mt-4">
                    <div className="bg-gray-100 h-2 rounded-full w-full overflow-hidden">
                      <div className="bg-indigo-500 h-full rounded-full" style={{ width: '8%' }}></div>
                    </div>
                    <div className="flex justify-between mt-1 text-xs text-muted-foreground">
                      <span>8% of total circulation</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              {/* AIRBNB Card */}
              <Card>
                <CardHeader className="pb-2">
                  <div className="flex items-center">
                    <div className="w-8 h-8 rounded-full bg-pink-100 flex items-center justify-center mr-2">
                      <span className="font-medium text-pink-700">A</span>
                    </div>
                    <CardTitle className="text-base">Airbnb Credits</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{(mockConversionData.circulatingPoints.AIRBNB / 1000000).toFixed(1)}M</div>
                  <p className="text-xs text-muted-foreground mt-1 flex items-center">
                    <TrendingUp className="h-3 w-3 text-green-500 mr-1" />
                    <span className="text-green-500">+7.4%</span>
                    <span className="ml-1">from previous month</span>
                  </p>
                  <div className="mt-4">
                    <div className="bg-gray-100 h-2 rounded-full w-full overflow-hidden">
                      <div className="bg-pink-500 h-full rounded-full" style={{ width: '2%' }}></div>
                    </div>
                    <div className="flex justify-between mt-1 text-xs text-muted-foreground">
                      <span>2% of total circulation</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              {/* DELTA Card */}
              <Card>
                <CardHeader className="pb-2">
                  <div className="flex items-center">
                    <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center mr-2">
                      <span className="font-medium text-blue-700">D</span>
                    </div>
                    <CardTitle className="text-base">Delta SkyMiles</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{(mockConversionData.circulatingPoints.DELTA / 1000000).toFixed(1)}M</div>
                  <p className="text-xs text-muted-foreground mt-1 flex items-center">
                    <TrendingUp className="h-3 w-3 text-green-500 mr-1" />
                    <span className="text-green-500">+3.8%</span>
                    <span className="ml-1">from previous month</span>
                  </p>
                  <div className="mt-4">
                    <div className="bg-gray-100 h-2 rounded-full w-full overflow-hidden">
                      <div className="bg-blue-600 h-full rounded-full" style={{ width: '13%' }}></div>
                    </div>
                    <div className="flex justify-between mt-1 text-xs text-muted-foreground">
                      <span>13% of total circulation</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
            
            <div className="grid md:grid-cols-2 gap-8">
              <div>
                <h3 className="text-base font-medium mb-4">Growth Trends</h3>
                
                {/* Line chart placeholder */}
                <div className="bg-gray-50 rounded-lg p-4 h-64 flex items-center justify-center">
                  <div className="text-center">
                    <LineChart className="h-10 w-10 text-gray-300 mx-auto mb-2" />
                    <div className="text-gray-500 text-sm">
                      Points in circulation over time<br />
                      Showing growth trends for each program
                    </div>
                  </div>
                </div>
              </div>
              
              <div>
                <h3 className="text-base font-medium mb-4">Velocity & Turnover</h3>
                
                <div className="space-y-4">
                  <Card>
                    <CardHeader className="py-3">
                      <div className="flex justify-between items-center">
                        <CardTitle className="text-sm">Point Velocity</CardTitle>
                        <div className="text-sm font-medium flex items-center">
                          <TrendingUp className="h-3 w-3 text-green-500 mr-1" />
                          <span className="text-green-500">+4.2%</span>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="py-0">
                      <div className="flex justify-between pb-3">
                        <div className="text-xs text-muted-foreground">Average transactions per point</div>
                        <div className="text-sm font-medium">2.7</div>
                      </div>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardHeader className="py-3">
                      <div className="flex justify-between items-center">
                        <CardTitle className="text-sm">Turnover Rate</CardTitle>
                        <div className="text-sm font-medium flex items-center">
                          <TrendingUp className="h-3 w-3 text-green-500 mr-1" />
                          <span className="text-green-500">+1.8%</span>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="py-0">
                      <div className="flex justify-between pb-3">
                        <div className="text-xs text-muted-foreground">Points exchanged as % of total</div>
                        <div className="text-sm font-medium">18.5%</div>
                      </div>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardHeader className="py-3">
                      <div className="flex justify-between items-center">
                        <CardTitle className="text-sm">Average Time Between Exchanges</CardTitle>
                        <div className="text-sm font-medium flex items-center">
                          <TrendingDown className="h-3 w-3 text-green-500 mr-1" />
                          <span className="text-green-500">-2.3%</span>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="py-0">
                      <div className="flex justify-between pb-3">
                        <div className="text-xs text-muted-foreground">Days between transactions</div>
                        <div className="text-sm font-medium">22.4 days</div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="translator" className="p-4 border rounded-md mt-4">
            <PointsTranslator className="shadow-none border-0" />
          </TabsContent>
        </Tabs>
      </div>
    </MainLayout>
  );
}