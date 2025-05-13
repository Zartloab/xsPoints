import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/hooks/use-auth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  TrendingUp,
  TrendingDown,
  RefreshCw,
  Info,
  Calendar,
  BarChart3,
  LineChart,
  DollarSign,
  ArrowRight,
  Clock,
  ChevronUp,
  ChevronDown,
  AlertTriangle,
  Zap,
  HelpCircle
} from 'lucide-react';
import {
  AreaChart,
  Area,
  LineChart as RechartsLineChart,
  Line,
  BarChart as RechartsBarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  PieChart,
  Pie,
  Cell
} from 'recharts';

import { LoyaltyProgram } from '@shared/schema';

// Helper for currency formatting
const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 4,
    maximumFractionDigits: 4,
  }).format(value);
};

// Time period options for historical data
const TIME_PERIODS = [
  { value: '7d', label: 'Last 7 Days' },
  { value: '30d', label: 'Last 30 Days' },
  { value: '90d', label: 'Last 90 Days' },
  { value: '1y', label: 'Last Year' },
  { value: 'all', label: 'All Time' }
];

// Mock historical rate data
const generateHistoricalRateData = (days: number, baseCurrency: string, targetCurrency: string, volatility: number = 0.005) => {
  const today = new Date();
  const data = [];
  let baseRate = 0;
  
  // Special case: when converting from same currency to same currency, always show 1:1 ratio
  if (baseCurrency === targetCurrency) {
    for (let i = days; i >= 0; i--) {
      const date = new Date();
      date.setDate(today.getDate() - i);
      data.push({
        date: date.toISOString().split('T')[0],
        rate: "1.000000", // Always 1:1 for same currency
        baseRate: "1.000000",
        volume: Math.floor(Math.random() * 100000) + 50000,
      });
    }
    return data;
  }
  
  // Set base rates depending on currency combinations
  if (baseCurrency === 'XPOINTS') {
    baseRate = 0.01; // 1 cent per xPoint
  } else if (baseCurrency === 'QANTAS') {
    baseRate = 0.007; // 0.7 cents per Qantas point
  } else if (baseCurrency === 'GYG') {
    baseRate = 0.005; // 0.5 cents per GYG point
  } else if (baseCurrency === 'VELOCITY') {
    baseRate = 0.006; // 0.6 cents per Velocity point
  }
  
  // Calculate exchange rate from base currencies to target currencies
  let rate = baseRate;
  if (targetCurrency !== 'USD') {
    // If target is another loyalty program, we need the inverse of its value
    if (targetCurrency === 'XPOINTS') {
      rate = baseRate / 0.01;
    } else if (targetCurrency === 'QANTAS') {
      rate = baseRate / 0.007;
    } else if (targetCurrency === 'GYG') {
      rate = baseRate / 0.005;
    } else if (targetCurrency === 'VELOCITY') {
      rate = baseRate / 0.006;
    }
  }
  
  for (let i = days; i >= 0; i--) {
    const date = new Date();
    date.setDate(today.getDate() - i);
    
    // Add some random fluctuation to create realistic looking data
    const randomFactor = 1 + (Math.random() * 2 - 1) * volatility;
    const dailyRate = rate * randomFactor;
    
    // Add occasional small trend shifts
    if (i % 10 === 0) {
      rate = rate * (1 + (Math.random() * 0.04 - 0.02));
    }
    
    data.push({
      date: date.toISOString().split('T')[0],
      rate: dailyRate.toFixed(6),
      baseRate: baseRate.toFixed(6),
      volume: Math.floor(Math.random() * 100000) + 50000,
    });
  }
  
  return data;
};

// Currency codes to colors mapping
const currencyColors: Record<string, string> = {
  XPOINTS: '#2563eb', // Blue
  QANTAS: '#dc2626', // Red
  GYG: '#eab308', // Yellow
  VELOCITY: '#ef4444', // Red
  USD: '#10b981', // Green
  HILTON: '#6366f1', // Indigo
  MARRIOTT: '#ec4899', // Pink
  AIRBNB: '#f97316', // Orange
  DELTA: '#06b6d4', // Cyan
};

// Currency conversion rates for additional currencies
const additionalRates = {
  XPOINTS: { rate: 0.01, trend: 0.0 }, // Stable baseline
  QANTAS: { rate: 0.0072, trend: 0.12 }, // Slightly up
  GYG: { rate: 0.0053, trend: -0.08 }, // Slightly down
  VELOCITY: { rate: 0.0065, trend: 0.05 }, // Up
  HILTON: { rate: 0.004, trend: -0.02 }, // Down
  MARRIOTT: { rate: 0.0077, trend: 0.15 }, // Up significantly
  AIRBNB: { rate: 0.0058, trend: 0.07 }, // Up
  DELTA: { rate: 0.0081, trend: 0.10 }, // Up
};

// Market insight data
const marketInsights = [
  {
    title: "xPoints Adoption Growing",
    description: "xPoints adoption among merchants has increased by 28% in the last quarter, signaling strong growth for the universal currency.",
    impact: "positive",
    date: "2025-05-01",
  },
  {
    title: "Premium Travel Partnerships",
    description: "New premium airline and hotel partnerships announced. Expected to increase xPoints utility in travel sector by 15%.",
    impact: "positive",
    date: "2025-04-15",
  },
  {
    title: "Seasonal Volatility Expected",
    description: "Historical data suggests increased seasonality in Q2 for travel-related loyalty currencies. Monitor rates if planning conversions.",
    impact: "neutral",
    date: "2025-04-10",
  },
  {
    title: "Retail Sector Integration",
    description: "Major retail chains adopting xPoints as payment and reward method, potentially increasing exchange volume and stability.",
    impact: "positive",
    date: "2025-03-22",
  },
];

const ExchangeRatesPage: React.FC = () => {
  const { user } = useAuth();
  const [timePeriod, setTimePeriod] = useState<string>('30d');
  const [baseCurrency, setBaseCurrency] = useState<string>('XPOINTS');
  const [targetCurrency, setTargetCurrency] = useState<string>('USD');
  const [chartsTab, setChartsTab] = useState<string>('line');
  
  // Fetch exchange rates
  const { data: exchangeRates = [] } = useQuery<any[]>({
    queryKey: ['/api/exchange-rates/all'],
    enabled: !!user,
  });
  
  // Get user wallets
  const { data: wallets = [] } = useQuery<any[]>({
    queryKey: ['/api/wallets'],
    enabled: !!user,
  });
  
  // Get historical data based on selected period
  const days = timePeriod === '7d' ? 7 : timePeriod === '30d' ? 30 : timePeriod === '90d' ? 90 : timePeriod === '1y' ? 365 : 730;
  const historicalData = generateHistoricalRateData(days, baseCurrency, targetCurrency);
  
  // Calculate current rate and changes
  const currentRate = parseFloat(historicalData[historicalData.length - 1].rate);
  const yesterdayRate = parseFloat(historicalData[historicalData.length - 2].rate);
  const weekAgoRate = parseFloat(historicalData[historicalData.length - 8]?.rate || historicalData[0].rate);
  const monthAgoRate = parseFloat(historicalData[historicalData.length - 31]?.rate || historicalData[0].rate);
  
  const dayChange = ((currentRate - yesterdayRate) / yesterdayRate) * 100;
  const weekChange = ((currentRate - weekAgoRate) / weekAgoRate) * 100;
  const monthChange = ((currentRate - monthAgoRate) / monthAgoRate) * 100;
  
  // Calculate dollar value of holdings
  const calculateHoldingsValue = () => {
    return wallets.map((wallet: any) => {
      const currencyRate = additionalRates[wallet.program as keyof typeof additionalRates]?.rate || 0.01;
      return {
        program: wallet.program,
        balance: wallet.balance,
        dollarValue: wallet.balance * currencyRate,
        color: currencyColors[wallet.program] || '#94a3b8'
      };
    });
  };
  
  const holdingsValue = calculateHoldingsValue();
  const totalHoldingsValue = holdingsValue.reduce((sum: number, holding: any) => sum + holding.dollarValue, 0);
  
  // Format the current rate for display based on currencies
  const formatComparisonRate = () => {
    // If converting same currency to same currency, always show 1:1
    if (baseCurrency === targetCurrency) {
      return `1 ${baseCurrency} = 1 ${targetCurrency}`;
    } else if (targetCurrency === 'USD') {
      return `1 ${baseCurrency} = ${formatCurrency(currentRate)}`;
    } else {
      return `1 ${baseCurrency} = ${currentRate.toFixed(4)} ${targetCurrency}`;
    }
  };
  
  // Generate recommendation text based on rate trends
  const generateRecommendation = () => {
    // Special case for same currency conversions
    if (baseCurrency === targetCurrency) {
      return {
        text: `Converting between the same currency always maintains a 1:1 ratio. No exchange fees or rate fluctuations apply.`,
        status: 'positive'
      };
    }
    
    // For demo purposes, provide recommendations based on the exchange direction
    if (baseCurrency === 'XPOINTS') {
      // If converting from xPoints, check if rates are favorable
      if (dayChange > 0.5) {
        return {
          text: `Current rates for ${baseCurrency} to ${targetCurrency} are trending upward, making it a favorable time to convert.`,
          status: 'positive'
        };
      } else if (dayChange < -0.5) {
        return {
          text: `Rates for ${baseCurrency} to ${targetCurrency} have declined recently. Consider waiting for better rates unless immediate conversion is needed.`,
          status: 'negative'
        };
      }
    } else if (targetCurrency === 'XPOINTS') {
      // If converting to xPoints, inverse logic applies
      if (dayChange < -0.5) {
        return {
          text: `Declining rates for ${baseCurrency} mean you can get more ${targetCurrency} through conversion now.`,
          status: 'positive'
        };
      } else if (dayChange > 0.5) {
        return {
          text: `Rising rates for ${baseCurrency} mean you'll get fewer ${targetCurrency}. Consider waiting for a rate correction.`,
          status: 'negative'
        };
      }
    }
    
    return {
      text: `Exchange rates between ${baseCurrency} and ${targetCurrency} have been relatively stable. Standard conversion rates apply.`,
      status: 'neutral'
    };
  };
  
  const recommendation = generateRecommendation();
  
  // Prepare data for the market distribution pie chart
  const marketDistributionData = Object.entries(additionalRates).map(([currency, data]) => ({
    name: currency,
    value: data.rate,
    color: currencyColors[currency] || '#94a3b8'
  }));
  
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-blue-100 via-blue-50 to-white rounded-2xl p-8 mb-8 border border-blue-200 shadow-sm">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Exchange Rate Explorer</h1>
            <p className="text-gray-600 mb-2 max-w-2xl">
              Track real-time and historical exchange rates between xPoints and other loyalty currencies. Make informed decisions for maximum value.
            </p>
            <Button variant="link" className="p-0 h-auto text-primary flex items-center gap-1" asChild>
              <a href="/rate-verification">
                <ShieldCheck className="h-4 w-4" />
                <span>View our Rate Verification Policy</span>
                <ArrowRight className="h-4 w-4 ml-1" />
              </a>
            </Button>
          </div>
          <div className="mt-4 md:mt-0">
            <div className="bg-white rounded-lg shadow-sm p-4 border border-blue-100">
              <div className="text-sm font-medium text-gray-500 mb-1">xPoints Standard Value</div>
              <div className="text-2xl font-bold text-primary">$0.01 USD</div>
              <div className="text-xs text-gray-500">Updated: Today</div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Rate Explorer */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-10">
        <div className="lg:col-span-2">
          <Card className="h-full border-0 shadow-md">
            <CardHeader className="bg-gradient-to-br from-blue-50 to-white border-b">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Rate Explorer</CardTitle>
                  <CardDescription>
                    Compare exchange rates and historical trends
                  </CardDescription>
                </div>
                <div className="flex items-center space-x-3">
                  <Select value={timePeriod} onValueChange={setTimePeriod}>
                    <SelectTrigger className="w-[180px]">
                      <Clock className="h-4 w-4 mr-2 text-muted-foreground" />
                      <SelectValue placeholder="Select period" />
                    </SelectTrigger>
                    <SelectContent>
                      {TIME_PERIODS.map(period => (
                        <SelectItem key={period.value} value={period.value}>
                          {period.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                <div className="flex w-full">
                  <Select value={baseCurrency} onValueChange={setBaseCurrency}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="From Currency" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="XPOINTS">xPoints</SelectItem>
                      <SelectItem value="QANTAS">Qantas</SelectItem>
                      <SelectItem value="GYG">GYG</SelectItem>
                      <SelectItem value="VELOCITY">Velocity</SelectItem>
                      <SelectItem value="HILTON">Hilton</SelectItem>
                      <SelectItem value="MARRIOTT">Marriott</SelectItem>
                      <SelectItem value="AIRBNB">Airbnb</SelectItem>
                      <SelectItem value="DELTA">Delta</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex justify-center items-center">
                  <div className="p-2 bg-blue-50 rounded-full">
                    <RefreshCw className="h-5 w-5 text-blue-600" />
                  </div>
                </div>
                <div className="flex w-full">
                  <Select value={targetCurrency} onValueChange={setTargetCurrency}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="To Currency" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="USD">US Dollar</SelectItem>
                      <SelectItem value="XPOINTS">xPoints</SelectItem>
                      <SelectItem value="QANTAS">Qantas</SelectItem>
                      <SelectItem value="GYG">GYG</SelectItem>
                      <SelectItem value="VELOCITY">Velocity</SelectItem>
                      <SelectItem value="HILTON">Hilton</SelectItem>
                      <SelectItem value="MARRIOTT">Marriott</SelectItem>
                      <SelectItem value="AIRBNB">Airbnb</SelectItem>
                      <SelectItem value="DELTA">Delta</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <div className="p-6">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
                  <div>
                    <div className="text-gray-500 text-sm mb-1">Current Rate</div>
                    <div className="text-3xl font-bold">{formatComparisonRate()}</div>
                  </div>
                  <div className="grid grid-cols-3 gap-4 mt-4 md:mt-0">
                    <div className="text-center">
                      <div className="text-gray-500 text-xs mb-1">24h Change</div>
                      <div className={`text-sm font-bold flex items-center justify-center ${dayChange >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {dayChange >= 0 ? <ChevronUp className="h-3 w-3 mr-1" /> : <ChevronDown className="h-3 w-3 mr-1" />}
                        {Math.abs(dayChange).toFixed(2)}%
                      </div>
                    </div>
                    <div className="text-center">
                      <div className="text-gray-500 text-xs mb-1">7d Change</div>
                      <div className={`text-sm font-bold flex items-center justify-center ${weekChange >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {weekChange >= 0 ? <ChevronUp className="h-3 w-3 mr-1" /> : <ChevronDown className="h-3 w-3 mr-1" />}
                        {Math.abs(weekChange).toFixed(2)}%
                      </div>
                    </div>
                    <div className="text-center">
                      <div className="text-gray-500 text-xs mb-1">30d Change</div>
                      <div className={`text-sm font-bold flex items-center justify-center ${monthChange >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {monthChange >= 0 ? <ChevronUp className="h-3 w-3 mr-1" /> : <ChevronDown className="h-3 w-3 mr-1" />}
                        {Math.abs(monthChange).toFixed(2)}%
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="h-[300px]">
                  <Tabs defaultValue="line" value={chartsTab} onValueChange={setChartsTab}>
                    <TabsList className="mb-4">
                      <TabsTrigger value="line">
                        <LineChart className="h-4 w-4 mr-2" />
                        Line
                      </TabsTrigger>
                      <TabsTrigger value="area">
                        <BarChart3 className="h-4 w-4 mr-2" />
                        Area
                      </TabsTrigger>
                      <TabsTrigger value="volume">
                        <BarChart3 className="h-4 w-4 mr-2" />
                        Volume
                      </TabsTrigger>
                    </TabsList>
                    
                    <TabsContent value="line" className="h-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <RechartsLineChart
                          data={historicalData}
                          margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                        >
                          <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                          <XAxis 
                            dataKey="date" 
                            stroke="#94a3b8"
                            tick={{ fontSize: 12 }}
                            tickFormatter={(value) => {
                              // Format date based on time period
                              if (timePeriod === '7d') {
                                return new Date(value).toLocaleDateString(undefined, { weekday: 'short' });
                              } else if (timePeriod === '30d') {
                                return new Date(value).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
                              } else {
                                return new Date(value).toLocaleDateString(undefined, { month: 'short', year: '2-digit' });
                              }
                            }}
                          />
                          <YAxis 
                            stroke="#94a3b8"
                            tick={{ fontSize: 12 }}
                            domain={['auto', 'auto']}
                            tickFormatter={(value) => {
                              // Format value based on target currency
                              if (targetCurrency === 'USD') {
                                return `$${(value).toFixed(4)}`;
                              } else {
                                return value.toFixed(4);
                              }
                            }}
                          />
                          <Tooltip 
                            formatter={(value) => {
                              if (targetCurrency === 'USD') {
                                return [`$${parseFloat(value as string).toFixed(6)}`, `Rate`];
                              } else {
                                return [`${parseFloat(value as string).toFixed(6)} ${targetCurrency}`, `Rate`];
                              }
                            }}
                            labelFormatter={(label) => {
                              return new Date(label).toLocaleDateString(undefined, { 
                                year: 'numeric', 
                                month: 'long', 
                                day: 'numeric' 
                              });
                            }}
                          />
                          <Line 
                            type="monotone" 
                            dataKey="rate" 
                            stroke={currencyColors[baseCurrency] || '#2563eb'} 
                            strokeWidth={2}
                            dot={false}
                            activeDot={{ r: 6 }}
                          />
                        </RechartsLineChart>
                      </ResponsiveContainer>
                    </TabsContent>
                    
                    <TabsContent value="area" className="h-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart
                          data={historicalData}
                          margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                        >
                          <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                          <XAxis 
                            dataKey="date" 
                            stroke="#94a3b8"
                            tick={{ fontSize: 12 }}
                            tickFormatter={(value) => {
                              // Format date based on time period
                              if (timePeriod === '7d') {
                                return new Date(value).toLocaleDateString(undefined, { weekday: 'short' });
                              } else if (timePeriod === '30d') {
                                return new Date(value).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
                              } else {
                                return new Date(value).toLocaleDateString(undefined, { month: 'short', year: '2-digit' });
                              }
                            }}
                          />
                          <YAxis 
                            stroke="#94a3b8"
                            tick={{ fontSize: 12 }}
                            domain={['auto', 'auto']}
                            tickFormatter={(value) => {
                              // Format value based on target currency
                              if (targetCurrency === 'USD') {
                                return `$${(value).toFixed(4)}`;
                              } else {
                                return value.toFixed(4);
                              }
                            }}
                          />
                          <Tooltip 
                            formatter={(value) => {
                              if (targetCurrency === 'USD') {
                                return [`$${parseFloat(value as string).toFixed(6)}`, `Rate`];
                              } else {
                                return [`${parseFloat(value as string).toFixed(6)} ${targetCurrency}`, `Rate`];
                              }
                            }}
                            labelFormatter={(label) => {
                              return new Date(label).toLocaleDateString(undefined, { 
                                year: 'numeric', 
                                month: 'long', 
                                day: 'numeric' 
                              });
                            }}
                          />
                          <Area 
                            type="monotone" 
                            dataKey="rate" 
                            stroke={currencyColors[baseCurrency] || '#2563eb'} 
                            fill={`${currencyColors[baseCurrency] || '#2563eb'}33`} // Add transparency
                          />
                        </AreaChart>
                      </ResponsiveContainer>
                    </TabsContent>
                    
                    <TabsContent value="volume" className="h-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <RechartsBarChart
                          data={historicalData}
                          margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                        >
                          <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                          <XAxis 
                            dataKey="date" 
                            stroke="#94a3b8"
                            tick={{ fontSize: 12 }}
                            tickFormatter={(value) => {
                              // Format date based on time period
                              if (timePeriod === '7d') {
                                return new Date(value).toLocaleDateString(undefined, { weekday: 'short' });
                              } else if (timePeriod === '30d') {
                                return new Date(value).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
                              } else {
                                return new Date(value).toLocaleDateString(undefined, { month: 'short', year: '2-digit' });
                              }
                            }}
                          />
                          <YAxis 
                            stroke="#94a3b8"
                            tick={{ fontSize: 12 }}
                            tickFormatter={(value) => {
                              return value.toLocaleString();
                            }}
                          />
                          <Tooltip 
                            formatter={(value) => {
                              return [value.toLocaleString(), 'Volume'];
                            }}
                            labelFormatter={(label) => {
                              return new Date(label).toLocaleDateString(undefined, { 
                                year: 'numeric', 
                                month: 'long', 
                                day: 'numeric' 
                              });
                            }}
                          />
                          <Bar dataKey="volume" fill="#4ade80" />
                        </RechartsBarChart>
                      </ResponsiveContainer>
                    </TabsContent>
                  </Tabs>
                </div>
              </div>
              <div className={`p-4 border-t flex items-center ${recommendation.status === 'positive' ? 'bg-green-50 border-green-100' : recommendation.status === 'negative' ? 'bg-red-50 border-red-100' : 'bg-gray-50 border-gray-100'}`}>
                <div className={`p-2 rounded-full mr-3 ${recommendation.status === 'positive' ? 'bg-green-100 text-green-600' : recommendation.status === 'negative' ? 'bg-red-100 text-red-600' : 'bg-gray-100 text-gray-600'}`}>
                  {recommendation.status === 'positive' ? (
                    <TrendingUp className="h-5 w-5" />
                  ) : recommendation.status === 'negative' ? (
                    <TrendingDown className="h-5 w-5" />
                  ) : (
                    <Info className="h-5 w-5" />
                  )}
                </div>
                <div>
                  <div className="text-sm font-medium mb-1">
                    {recommendation.status === 'positive' ? 'Favorable Exchange Rate' : recommendation.status === 'negative' ? 'Unfavorable Exchange Rate' : 'Exchange Rate Information'}
                  </div>
                  <div className="text-sm text-gray-600">{recommendation.text}</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
        
        <div>
          <div className="grid grid-cols-1 gap-6">
            {/* Your Holdings Value */}
            <Card className="border-0 shadow-md">
              <CardHeader className="bg-gradient-to-br from-blue-50 to-white border-b">
                <CardTitle>Your Holdings Value</CardTitle>
                <CardDescription>
                  Current dollar value of your holdings
                </CardDescription>
              </CardHeader>
              <CardContent className="p-4">
                <div className="text-2xl font-bold mb-4">{formatCurrency(totalHoldingsValue)}</div>
                <div className="h-[200px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={holdingsValue}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="dollarValue"
                      >
                        {holdingsValue.map((entry: any, index: number) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip
                        formatter={(value) => [formatCurrency(value as number), 'Value']}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="mt-4 space-y-2">
                  {holdingsValue.map((holding: any) => (
                    <div key={holding.program} className="flex justify-between items-center p-2 rounded-lg hover:bg-gray-50">
                      <div className="flex items-center">
                        <div className="w-3 h-3 rounded-full mr-2" style={{ backgroundColor: holding.color }}></div>
                        <span>{holding.program}</span>
                      </div>
                      <div className="text-sm font-medium">{formatCurrency(holding.dollarValue)}</div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
            
            {/* Market Insights */}
            <Card className="border-0 shadow-md">
              <CardHeader className="bg-gradient-to-br from-blue-50 to-white border-b">
                <CardTitle>Market Insights</CardTitle>
                <CardDescription>
                  Recent developments affecting rates
                </CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                <div className="divide-y">
                  {marketInsights.map((insight, index) => (
                    <div key={index} className="p-4 hover:bg-gray-50">
                      <div className="flex items-start">
                        <div className={`p-2 rounded-full mr-3 flex-shrink-0 ${
                          insight.impact === 'positive' ? 'bg-green-100 text-green-600' : 
                          insight.impact === 'negative' ? 'bg-red-100 text-red-600' : 
                          'bg-amber-100 text-amber-600'
                        }`}>
                          {insight.impact === 'positive' ? (
                            <TrendingUp className="h-4 w-4" />
                          ) : insight.impact === 'negative' ? (
                            <AlertTriangle className="h-4 w-4" />
                          ) : (
                            <Info className="h-4 w-4" />
                          )}
                        </div>
                        <div>
                          <h4 className="text-sm font-medium mb-1">{insight.title}</h4>
                          <p className="text-xs text-gray-600 mb-1">{insight.description}</p>
                          <div className="flex items-center text-xs text-gray-500">
                            <Calendar className="h-3 w-3 mr-1" />
                            {new Date(insight.date).toLocaleDateString()}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
      
      {/* All Currencies Rate Table */}
      <Card className="mb-8 border-0 shadow-md">
        <CardHeader className="bg-gradient-to-br from-blue-50 to-white border-b">
          <CardTitle>All Currencies</CardTitle>
          <CardDescription>
            Compare dollar values and exchange trends across all supported loyalty programs
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50">
                  <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Currency</th>
                  <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Dollar Value</th>
                  <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">xPoints Rate</th>
                  <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">24h Trend</th>
                  <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {Object.entries(additionalRates).map(([currency, data]) => (
                  <tr key={currency} className="hover:bg-gray-50">
                    <td className="py-4 px-4">
                      <div className="flex items-center">
                        <div className="w-8 h-8 rounded-full flex items-center justify-center mr-3" style={{ backgroundColor: `${currencyColors[currency]}33` }}>
                          <span className="font-bold text-sm" style={{ color: currencyColors[currency] }}>{currency.charAt(0)}</span>
                        </div>
                        <div>
                          <div className="font-medium">{currency}</div>
                          <div className="text-xs text-gray-500">
                            {currency === 'XPOINTS' ? 'Universal Currency' : 
                             currency === 'QANTAS' || currency === 'VELOCITY' || currency === 'DELTA' ? 'Airline' :
                             currency === 'HILTON' || currency === 'MARRIOTT' ? 'Hotel' :
                             currency === 'AIRBNB' ? 'Accommodation' :
                             currency === 'GYG' ? 'Travel' : 'Loyalty Program'}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      <div className="font-medium">{formatCurrency(data.rate)}</div>
                      <div className="text-xs text-gray-500">per point</div>
                    </td>
                    <td className="py-4 px-4">
                      {currency === 'XPOINTS' ? (
                        <div className="font-medium">1.0000</div>
                      ) : (
                        <div className="font-medium">{(data.rate / 0.01).toFixed(4)}</div>
                      )}
                      <div className="text-xs text-gray-500">
                        {currency === 'XPOINTS' ? 'Base Currency' : `1 ${currency} = ${(data.rate / 0.01).toFixed(4)} xPoints`}
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      <div className={`flex items-center ${data.trend >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {data.trend >= 0 ? (
                          <>
                            <TrendingUp className="h-4 w-4 mr-1" />
                            <span>+{(data.trend * 100).toFixed(2)}%</span>
                          </>
                        ) : (
                          <>
                            <TrendingDown className="h-4 w-4 mr-1" />
                            <span>{(data.trend * 100).toFixed(2)}%</span>
                          </>
                        )}
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      <Button size="sm" variant="outline" className="mr-2">
                        <RefreshCw className="h-3 w-3 mr-1" />
                        Convert
                      </Button>
                      <Button size="sm" variant="ghost">
                        <HelpCircle className="h-3 w-3" />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
      
      {/* Market Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-10">
        <Card className="border-0 shadow-md">
          <CardHeader className="bg-gradient-to-br from-blue-50 to-white border-b">
            <CardTitle>Market Value Distribution</CardTitle>
            <CardDescription>
              Relative dollar value of different loyalty currencies
            </CardDescription>
          </CardHeader>
          <CardContent className="p-6">
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={marketDistributionData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {marketDistributionData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value) => [formatCurrency(value as number), 'Dollar Value']}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-2">
              {marketDistributionData.map((currency) => (
                <div key={currency.name} className="flex items-center">
                  <div className="w-3 h-3 rounded-full mr-2" style={{ backgroundColor: currency.color }}></div>
                  <span className="text-sm">{currency.name}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
        
        <Card className="border-0 shadow-md">
          <CardHeader className="bg-gradient-to-br from-blue-50 to-white border-b">
            <CardTitle>Value Comparison</CardTitle>
            <CardDescription>
              How much each currency is worth relative to xPoints
            </CardDescription>
          </CardHeader>
          <CardContent className="p-6">
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <RechartsBarChart
                  layout="vertical"
                  data={Object.entries(additionalRates).filter(([currency]) => currency !== 'XPOINTS').map(([currency, data]) => ({
                    name: currency,
                    value: (data.rate / 0.01),
                    color: currencyColors[currency]
                  }))}
                  margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis 
                    type="number"
                    stroke="#94a3b8"
                    tick={{ fontSize: 12 }}
                    domain={[0, 'dataMax']}
                  />
                  <YAxis 
                    type="category"
                    dataKey="name"
                    stroke="#94a3b8"
                    tick={{ fontSize: 12 }}
                  />
                  <Tooltip 
                    formatter={(value) => {
                      return [`${value} xPoints`, 'Value'];
                    }}
                  />
                  <Bar dataKey="value">
                    {Object.entries(additionalRates).filter(([currency]) => currency !== 'XPOINTS').map(([currency]) => (
                      <Cell key={`cell-${currency}`} fill={currencyColors[currency]} />
                    ))}
                  </Bar>
                </RechartsBarChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-4 bg-blue-50 p-4 rounded-lg border border-blue-100">
              <div className="flex items-center mb-2">
                <Info className="h-4 w-4 text-blue-600 mr-2" />
                <div className="font-medium text-sm">xPoints Value Benchmark</div>
              </div>
              <p className="text-sm text-gray-600">
                The chart shows how many xPoints you would receive when converting from other loyalty currencies.
                Higher values mean better conversion rates into xPoints.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
      
      {/* Call to Action */}
      <div className="bg-gradient-to-r from-primary to-blue-600 rounded-2xl p-8 text-white">
        <div className="flex flex-col md:flex-row items-center justify-between">
          <div className="mb-6 md:mb-0">
            <h2 className="text-2xl font-bold mb-2">Ready to maximize your points value?</h2>
            <p className="opacity-90 max-w-xl">
              Use our exchange rates intelligence to convert your loyalty points at the optimal time. xPoints remains the standard for reliable value.
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-4">
            <Button size="lg" className="bg-white text-primary hover:bg-blue-50">
              <RefreshCw className="mr-2 h-4 w-4" />
              Convert Points
            </Button>
            <Button size="lg" variant="outline" className="text-white border-white hover:bg-blue-700">
              <Zap className="mr-2 h-4 w-4" />
              View Opportunities
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ExchangeRatesPage;