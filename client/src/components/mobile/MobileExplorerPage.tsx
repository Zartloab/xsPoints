import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import MobilePointsTranslator from './MobilePointsTranslator';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, TrendingDown, ArrowRight } from 'lucide-react';
import { LoyaltyProgram } from '@shared/schema';

// Program color mapping
const programColors: Record<LoyaltyProgram, string> = {
  QANTAS: 'bg-red-600',
  GYG: 'bg-emerald-600',
  XPOINTS: 'bg-blue-600',
  VELOCITY: 'bg-purple-600',
  AMEX: 'bg-slate-800', 
  FLYBUYS: 'bg-indigo-600',
  HILTON: 'bg-blue-800',
  MARRIOTT: 'bg-pink-700',
  AIRBNB: 'bg-pink-600',
  DELTA: 'bg-blue-700'
};

const programLongNames: Record<LoyaltyProgram, string> = {
  QANTAS: 'Qantas Frequent Flyer',
  GYG: 'GetYourGuide Rewards',
  XPOINTS: 'xPoints Universal',
  VELOCITY: 'Virgin Velocity',
  AMEX: 'American Express',
  FLYBUYS: 'Flybuys Rewards',
  HILTON: 'Hilton Honors',
  MARRIOTT: 'Marriott Bonvoy',
  AIRBNB: 'Airbnb Guest',
  DELTA: 'Delta SkyMiles'
};

type ExchangeRateCardProps = {
  fromProgram: LoyaltyProgram;
  toProgram: LoyaltyProgram;
  rate: string;
  trend: 'up' | 'down' | 'neutral';
  percentChange: string;
};

const ExchangeRateCard = ({ 
  fromProgram, 
  toProgram, 
  rate, 
  trend, 
  percentChange 
}: ExchangeRateCardProps) => {
  return (
    <Card className="overflow-hidden border-0 shadow-md">
      <div className="flex h-2">
        <div className={`w-1/2 ${programColors[fromProgram]}`}></div>
        <div className={`w-1/2 ${programColors[toProgram]}`}></div>
      </div>
      <CardContent className="p-4">
        <div className="flex justify-between items-center">
          <div className="flex items-center space-x-2">
            <p className="font-semibold text-sm">{fromProgram}</p>
            <ArrowRight size={14} />
            <p className="font-semibold text-sm">{toProgram}</p>
          </div>
          <div>
            <p className="text-lg font-bold">{rate}</p>
            <div className="flex items-center justify-end">
              {trend === 'up' && (
                <Badge variant="outline" className="text-xs text-green-600">
                  <TrendingUp size={12} className="mr-1" /> +{percentChange}%
                </Badge>
              )}
              {trend === 'down' && (
                <Badge variant="outline" className="text-xs text-red-600">
                  <TrendingDown size={12} className="mr-1" /> -{percentChange}%
                </Badge>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

const MobileExplorerPage = () => {
  const [selectedProgram, setSelectedProgram] = useState<LoyaltyProgram>('XPOINTS');
  
  // Fetch exchange rates
  const { data: rates, isLoading } = useQuery({
    queryKey: ['/api/exchange-rates'],
    staleTime: 60000, // 1 minute
  });

  // Get all rates for selected program (from and to)
  const programRates = React.useMemo(() => {
    if (!rates) return { fromRates: [], toRates: [] };
    
    // Create arrays for "from" and "to" rates
    const fromRates = Array.isArray(rates) 
      ? rates.filter((r: any) => r.fromProgram === selectedProgram) 
      : [];
    
    const toRates = Array.isArray(rates) 
      ? rates.filter((r: any) => r.toProgram === selectedProgram) 
      : [];
    
    return { fromRates, toRates };
  }, [rates, selectedProgram]);

  // Generate mock trend data
  const getTrendData = (seed: number) => {
    const hash = seed % 3;
    if (hash === 0) return { trend: 'up' as const, change: ((seed % 5) + 0.5).toFixed(1) };
    if (hash === 1) return { trend: 'down' as const, change: ((seed % 4) + 0.2).toFixed(1) };
    return { trend: 'neutral' as const, change: '0.0' };
  };

  return (
    <div className="px-4 py-6">
      <h1 className="text-2xl font-bold mb-6">Explorer</h1>
      
      <Card className="mb-6">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg">Select Program</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex overflow-x-auto pb-2 -mx-1 space-x-1">
            {Object.keys(programColors).map((program) => (
              <Badge
                key={program}
                variant={selectedProgram === program ? "default" : "outline"}
                className={`cursor-pointer whitespace-nowrap ${
                  selectedProgram === program ? programColors[program as LoyaltyProgram] : ''
                }`}
                onClick={() => setSelectedProgram(program as LoyaltyProgram)}
              >
                {program}
              </Badge>
            ))}
          </div>
        </CardContent>
      </Card>
      
      <div className="mb-6">
        <h2 className="text-lg font-semibold mb-3">Program Details</h2>
        <Card className="border-0 shadow-md">
          <div className={`h-2 ${programColors[selectedProgram]}`}></div>
          <CardContent className="p-4">
            <h3 className="font-bold text-lg">{programLongNames[selectedProgram]}</h3>
            <div className="mt-2 grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Base Value</p>
                <p className="font-semibold">
                  {selectedProgram === 'XPOINTS' ? '1.00 xp' : `${(Math.random() * 0.5 + 0.3).toFixed(2)} xp`}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Circulation</p>
                <p className="font-semibold">
                  {((Math.random() * 900 + 100) * 1000000).toLocaleString()} points
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Daily Vol.</p>
                <p className="font-semibold">
                  {((Math.random() * 9 + 1) * 1000000).toLocaleString()} points
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Volatility</p>
                <p className="font-semibold">
                  {(Math.random() * 4 + 0.5).toFixed(1)}%
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
      
      <div className="mb-6">
        <Tabs defaultValue="convert-from">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-semibold">Exchange Rates</h2>
            <TabsList>
              <TabsTrigger value="convert-from">From</TabsTrigger>
              <TabsTrigger value="convert-to">To</TabsTrigger>
            </TabsList>
          </div>
          
          <TabsContent value="convert-from" className="mt-0">
            {isLoading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <Card key={i} className="overflow-hidden border-0 shadow-md">
                    <div className="h-2 bg-gray-200"></div>
                    <CardContent className="p-4">
                      <div className="flex justify-between items-center">
                        <Skeleton className="h-5 w-24" />
                        <Skeleton className="h-8 w-16" />
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="space-y-3">
                {programRates.fromRates.map((rate: any, index: number) => {
                  const trendData = getTrendData(index + 1);
                  return (
                    <ExchangeRateCard
                      key={`${rate.fromProgram}-${rate.toProgram}`}
                      fromProgram={rate.fromProgram}
                      toProgram={rate.toProgram}
                      rate={rate.rate}
                      trend={trendData.trend}
                      percentChange={trendData.change}
                    />
                  );
                })}
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="convert-to" className="mt-0">
            {isLoading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <Card key={i} className="overflow-hidden border-0 shadow-md">
                    <div className="h-2 bg-gray-200"></div>
                    <CardContent className="p-4">
                      <div className="flex justify-between items-center">
                        <Skeleton className="h-5 w-24" />
                        <Skeleton className="h-8 w-16" />
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="space-y-3">
                {programRates.toRates.map((rate: any, index: number) => {
                  const trendData = getTrendData(index + 2);
                  return (
                    <ExchangeRateCard
                      key={`${rate.fromProgram}-${rate.toProgram}`}
                      fromProgram={rate.fromProgram}
                      toProgram={rate.toProgram}
                      rate={rate.rate}
                      trend={trendData.trend}
                      percentChange={trendData.change}
                    />
                  );
                })}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default MobileExplorerPage;