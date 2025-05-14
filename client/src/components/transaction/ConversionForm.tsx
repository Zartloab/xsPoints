import React, { useState, useEffect } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { apiRequest, getQueryFn, queryClient } from '@/lib/queryClient';
import { Wallet, ConvertPointsData, ExchangeRate } from '@shared/schema';
import { useToast } from '@/hooks/use-toast';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuth } from '@/hooks/use-auth';
import ProgramIcon from '../loyaltyprograms/ProgramIcon';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';
import { AnimatedValueTooltip } from '@/components/ui/tooltip/AnimatedValueTooltip';

// Helper function to get display name for loyalty programs
const getDisplayProgramName = (program: string): string => {
  switch (program) {
    case 'QANTAS':
      return 'Qantas';
    case 'GYG':
      return 'GYG';
    case 'XPOINTS':
      return 'xPoints';
    case 'VELOCITY':
      return 'Velocity';
    case 'AMEX':
      return 'American Express';
    case 'FLYBUYS':
      return 'Flybuys';
    case 'HILTON':
      return 'Hilton';
    case 'MARRIOTT':
      return 'Marriott';
    case 'AIRBNB':
      return 'Airbnb';
    case 'DELTA':
      return 'Delta';
    default:
      return program;
  }
};

export default function ConversionForm() {
  const { toast } = useToast();
  const { user } = useAuth();
  

  
  // State for form
  const [fromProgram, setFromProgram] = useState<string>("QANTAS");
  const [toProgram, setToProgram] = useState<string>("GYG");
  const [amount, setAmount] = useState<number>(0);
  const [calculatedAmount, setCalculatedAmount] = useState<number>(0);
  
  // Get user wallets
  const { data: wallets, isLoading: isLoadingWallets } = useQuery<Wallet[]>({
    queryKey: ['/api/wallets'],
    queryFn: getQueryFn({ on401: "throw" }),
    enabled: !!user,
  });
  
  // Get exchange rates
  const { data: directRate, isLoading: isLoadingDirectRate } = useQuery<ExchangeRate>({
    queryKey: [`/api/exchange-rates?from=${fromProgram}&to=${toProgram}`],
    queryFn: getQueryFn({ on401: "throw" }),
    enabled: !!fromProgram && !!toProgram,
  });
  
  // For indirect conversion: fromProgram -> xPoints -> toProgram
  const { data: fromToXpRate } = useQuery<ExchangeRate>({
    queryKey: [`/api/exchange-rates?from=${fromProgram}&to=XPOINTS`],
    queryFn: getQueryFn({ on401: "throw" }),
    enabled: !!fromProgram && toProgram !== "XPOINTS" && fromProgram !== "XPOINTS",
  });
  
  const { data: xpToDestRate } = useQuery<ExchangeRate>({
    queryKey: [`/api/exchange-rates?from=XPOINTS&to=${toProgram}`],
    queryFn: getQueryFn({ on401: "throw" }),
    enabled: !!toProgram && fromProgram !== "XPOINTS" && toProgram !== "XPOINTS",
  });
  
  // Get source and destination wallets
  const sourceWallet = wallets?.find(w => w.program === fromProgram);
  const destWallet = wallets?.find(w => w.program === toProgram);

  // State for fee calculation
  const [conversionFee, setConversionFee] = useState<number>(0);
  const [feePercentage, setFeePercentage] = useState<string>("0%");
  const FREE_CONVERSION_LIMIT = 10000;
  
  // Conversion mutation
  const convertMutation = useMutation({
    mutationFn: async (data: ConvertPointsData) => {
      const res = await apiRequest("POST", "/api/convert", data);
      return await res.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Conversion successful",
        description: `Successfully converted ${amount} ${
          (() => {
            switch (fromProgram) {
              case 'QANTAS': return 'Qantas';
              case 'GYG': return 'GYG';
              case 'XPOINTS': return 'xPoints';
              case 'VELOCITY': return 'Velocity';
              case 'AMEX': return 'American Express';
              case 'FLYBUYS': return 'Flybuys';
              case 'HILTON': return 'Hilton';
              case 'MARRIOTT': return 'Marriott';
              case 'AIRBNB': return 'Airbnb';
              case 'DELTA': return 'Delta';
              default: return fromProgram;
            }
          })()
        } points to ${calculatedAmount} ${
          (() => {
            switch (toProgram) {
              case 'QANTAS': return 'Qantas';
              case 'GYG': return 'GYG';
              case 'XPOINTS': return 'xPoints';
              case 'VELOCITY': return 'Velocity';
              case 'AMEX': return 'American Express';
              case 'FLYBUYS': return 'Flybuys';
              case 'HILTON': return 'Hilton';
              case 'MARRIOTT': return 'Marriott';
              case 'AIRBNB': return 'Airbnb';
              case 'DELTA': return 'Delta';
              default: return toProgram;
            }
          })()
        } points`,
      });
      // Invalidate cache to refresh wallet balances
      queryClient.invalidateQueries({ queryKey: ['/api/wallets'] });
      queryClient.invalidateQueries({ queryKey: ['/api/transactions'] });
      
      // Reset form
      setAmount(0);
      setCalculatedAmount(0);
      setConversionFee(0);
      setFeePercentage("0%");
    },
    onError: (error: Error) => {
      toast({
        title: "Conversion failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Function to calculate the conversion fee
  const calculateFee = (amountValue: number): number => {
    if (amountValue <= FREE_CONVERSION_LIMIT) {
      return 0;
    }
    
    const amountOverLimit = amountValue - FREE_CONVERSION_LIMIT;
    return amountOverLimit * 0.005; // 0.5% fee for amount over limit
  };

  // Calculate conversion rate, fee, and amount
  useEffect(() => {
    if (amount <= 0) {
      setCalculatedAmount(0);
      setConversionFee(0);
      setFeePercentage("0%");
      return;
    }
    
    // Calculate fee first
    const fee = calculateFee(amount);
    setConversionFee(fee);
    
    if (fee > 0) {
      setFeePercentage("0.5%");
    } else {
      setFeePercentage("0%");
    }
    
    // Calculate amount after fee deduction
    const amountAfterFee = amount - fee;
    
    // Direct conversion or via xPoints
    if (fromProgram !== "XPOINTS" && toProgram !== "XPOINTS" && fromToXpRate && xpToDestRate) {
      // Convert via xPoints
      const xpAmount = amountAfterFee * Number(fromToXpRate.rate);
      const calculated = xpAmount * Number(xpToDestRate.rate);
      setCalculatedAmount(Math.floor(calculated));
    } else if (directRate) {
      // Direct conversion
      const calculated = amountAfterFee * Number(directRate.rate);
      setCalculatedAmount(Math.floor(calculated));
    }
  }, [amount, fromProgram, toProgram, directRate, fromToXpRate, xpToDestRate]);

  const handleConvert = () => {
    if (fromProgram === toProgram) {
      toast({
        title: "Invalid conversion",
        description: "Cannot convert to the same program",
        variant: "destructive",
      });
      return;
    }
    
    if (amount <= 0) {
      toast({
        title: "Invalid amount",
        description: "Please enter a valid amount to convert",
        variant: "destructive",
      });
      return;
    }
    
    if (!sourceWallet || sourceWallet.balance < amount) {
      toast({
        title: "Insufficient balance",
        description: `You don't have enough ${
          (() => {
            switch (fromProgram) {
              case 'QANTAS': return 'Qantas';
              case 'GYG': return 'GYG';
              case 'XPOINTS': return 'xPoints';
              case 'VELOCITY': return 'Velocity';
              case 'AMEX': return 'American Express';
              case 'FLYBUYS': return 'Flybuys';
              case 'HILTON': return 'Hilton';
              case 'MARRIOTT': return 'Marriott';
              case 'AIRBNB': return 'Airbnb';
              case 'DELTA': return 'Delta';
              default: return fromProgram;
            }
          })()
        } points for this conversion`,
        variant: "destructive",
      });
      return;
    }
    
    convertMutation.mutate({
      fromProgram: fromProgram as any,
      toProgram: toProgram as any,
      amount
    });
  };

  const handleReset = () => {
    setAmount(0);
    setFromProgram("QANTAS");
    setToProgram("GYG");
    setCalculatedAmount(0);
    setConversionFee(0);
    setFeePercentage("0%");
  };

  const getConversionRate = () => {
    if (fromProgram !== "XPOINTS" && toProgram !== "XPOINTS" && fromToXpRate && xpToDestRate) {
      return `1 ${fromProgram} = ${Number(fromToXpRate.rate)} xPoints = ${Number(fromToXpRate.rate) * Number(xpToDestRate.rate)} ${toProgram}`;
    } else if (directRate) {
      return `1 ${fromProgram} = ${Number(directRate.rate)} ${toProgram}`;
    }
    return "Loading rates...";
  };

  return (
    <section id="convert" className="mb-12 bg-white rounded-xl shadow-md p-6 border border-gray-100">
      <h2 className="text-xl font-bold text-gray-900 mb-6">Convert Points</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-10">
        {/* From Section */}
        <div className="conversion-arrow relative">
          <label className="block text-sm font-medium text-gray-700 mb-2">From</label>
          <div className="border border-gray-300 rounded-lg overflow-hidden">
            <div className="flex items-center p-3 border-b border-gray-200">
              <div className="flex-grow">
                <Select 
                  value={fromProgram} 
                  onValueChange={(value) => {
                    if (value === toProgram) {
                      // Swap values
                      setToProgram(fromProgram);
                    }
                    setFromProgram(value);
                    setAmount(0);
                    setCalculatedAmount(0);
                    setConversionFee(0);
                    setFeePercentage("0%");
                  }}
                >
                  <SelectTrigger className="w-full text-sm bg-transparent border-0 shadow-none focus:ring-0 p-0 h-auto">
                    <SelectValue placeholder="Select program" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="QANTAS">Qantas Frequent Flyer</SelectItem>
                    <SelectItem value="GYG">Guzman y Gomez Loyalty</SelectItem>
                    <SelectItem value="XPOINTS">xPoints</SelectItem>
                    <SelectItem value="VELOCITY">Velocity Frequent Flyer</SelectItem>
                    <SelectItem value="AMEX">American Express Rewards</SelectItem>
                    <SelectItem value="FLYBUYS">Flybuys Rewards</SelectItem>
                    <SelectItem value="HILTON">Hilton Honors</SelectItem>
                    <SelectItem value="MARRIOTT">Marriott Bonvoy</SelectItem>
                    <SelectItem value="AIRBNB">Airbnb Credits</SelectItem>
                    <SelectItem value="DELTA">Delta SkyMiles</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="ml-3 px-2 py-1 bg-gray-100 rounded-md text-xs text-gray-700">
                <AnimatedValueTooltip program={fromProgram} points={sourceWallet?.balance || 0}>
                  <span className="cursor-help hover:text-blue-600 transition-colors">
                    {sourceWallet?.balance.toLocaleString() || 0}
                  </span>
                </AnimatedValueTooltip> points
              </div>
            </div>
            <div className="p-4">
              <div className="mb-2">
                <label className="block text-xs text-gray-500 mb-1">Amount to convert</label>
                <div className="flex items-center">
                  <input 
                    type="number" 
                    className="w-full text-lg font-semibold focus:outline-none"
                    placeholder="0"
                    value={amount || ''}
                    onChange={(e) => setAmount(Number(e.target.value))}
                    min={0}
                    max={sourceWallet?.balance || 0}
                  />
                  <span className="text-gray-500 ml-2">points</span>
                </div>
              </div>
              <div className="text-xs text-gray-500">
                {isLoadingDirectRate || isLoadingWallets ? (
                  <span className="flex items-center">
                    <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                    Loading rates...
                  </span>
                ) : (
                  fromProgram === 'XPOINTS' 
                    ? `Rate: 1 xPoint = ${directRate?.rate || '-'} ${toProgram} Points` 
                    : `Rate: 1 ${fromProgram} Point = ${fromToXpRate?.rate || '-'} xPoints`
                )}
              </div>
            </div>
          </div>
        </div>
        
        {/* To Section */}
        <div className="relative">
          <label className="block text-sm font-medium text-gray-700 mb-2">To</label>
          <div className="border border-gray-300 rounded-lg overflow-hidden">
            <div className="flex items-center p-3 border-b border-gray-200">
              <div className="flex-grow">
                <Select 
                  value={toProgram} 
                  onValueChange={(value) => {
                    if (value === fromProgram) {
                      // Swap values
                      setFromProgram(toProgram);
                    }
                    setToProgram(value);
                    setAmount(0);
                    setCalculatedAmount(0);
                    setConversionFee(0);
                    setFeePercentage("0%");
                  }}
                >
                  <SelectTrigger className="w-full text-sm bg-transparent border-0 shadow-none focus:ring-0 p-0 h-auto">
                    <SelectValue placeholder="Select program" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="QANTAS">Qantas Frequent Flyer</SelectItem>
                    <SelectItem value="GYG">Guzman y Gomez Loyalty</SelectItem>
                    <SelectItem value="XPOINTS">xPoints</SelectItem>
                    <SelectItem value="VELOCITY">Velocity Frequent Flyer</SelectItem>
                    <SelectItem value="AMEX">American Express Rewards</SelectItem>
                    <SelectItem value="FLYBUYS">Flybuys Rewards</SelectItem>
                    <SelectItem value="HILTON">Hilton Honors</SelectItem>
                    <SelectItem value="MARRIOTT">Marriott Bonvoy</SelectItem>
                    <SelectItem value="AIRBNB">Airbnb Credits</SelectItem>
                    <SelectItem value="DELTA">Delta SkyMiles</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="ml-3 px-2 py-1 bg-gray-100 rounded-md text-xs text-gray-700">
                <AnimatedValueTooltip program={toProgram} points={destWallet?.balance || 0}>
                  <span className="cursor-help hover:text-blue-600 transition-colors">
                    {destWallet?.balance.toLocaleString() || 0}
                  </span>
                </AnimatedValueTooltip> points
              </div>
            </div>
            <div className="p-4">
              <div className="mb-2">
                <label className="block text-xs text-gray-500 mb-1">You'll receive</label>
                <div className="flex items-center">
                  {calculatedAmount > 0 ? (
                    <AnimatedValueTooltip program={toProgram} points={calculatedAmount}>
                      <div className="w-full text-lg font-semibold cursor-help hover:text-opacity-80 transition-all">
                        {calculatedAmount.toLocaleString()}
                      </div>
                    </AnimatedValueTooltip>
                  ) : (
                    <div className="w-full text-lg font-semibold">0</div>
                  )}
                  <span className="text-gray-500 ml-2">points</span>
                </div>
              </div>
              <div className="text-xs text-gray-500">
                {isLoadingDirectRate || isLoadingWallets ? (
                  <span className="flex items-center">
                    <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                    Loading rates...
                  </span>
                ) : (
                  toProgram === 'XPOINTS' 
                    ? `Rate: 1 ${fromProgram} Point = ${fromToXpRate?.rate || '-'} xPoints` 
                    : `Rate: 1 xPoint = ${xpToDestRate?.rate || '-'} ${toProgram} Points`
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <div className="mt-8 border-t border-gray-200 pt-6">
        <div className="mb-6">
          <h3 className="text-sm font-medium text-gray-700 mb-3">Conversion Summary</h3>
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="flex justify-between mb-2">
              <span className="text-sm text-gray-600">Amount</span>
              {amount > 0 ? (
                <AnimatedValueTooltip program={fromProgram} points={amount}>
                  <span className="text-sm font-medium cursor-help hover:text-blue-600 transition-colors">
                    {amount.toLocaleString()} {getDisplayProgramName(fromProgram)} Points
                  </span>
                </AnimatedValueTooltip>
              ) : (
                <span className="text-sm font-medium">
                  0 {getDisplayProgramName(fromProgram)} Points
                </span>
              )}
            </div>
            <div className="flex justify-between mb-2">
              <span className="text-sm text-gray-600">Exchange Rate</span>
              <span className="text-sm font-medium">
                {isLoadingDirectRate ? <Loader2 className="h-3 w-3 animate-spin inline mr-1" /> : getConversionRate()}
              </span>
            </div>
            <div className="flex justify-between mb-2">
              <span className="text-sm text-gray-600">Conversion Fee</span>
              <span className="text-sm font-medium">
                {conversionFee.toLocaleString()} {
                  (() => {
                    switch (fromProgram) {
                      case 'QANTAS': return 'Qantas';
                      case 'GYG': return 'GYG';
                      case 'XPOINTS': return 'xPoints';
                      case 'VELOCITY': return 'Velocity';
                      case 'AMEX': return 'American Express';
                      case 'FLYBUYS': return 'Flybuys';
                      case 'HILTON': return 'Hilton';
                      case 'MARRIOTT': return 'Marriott';
                      case 'AIRBNB': return 'Airbnb';
                      case 'DELTA': return 'Delta';
                      default: return fromProgram;
                    }
                  })()
                } Points ({feePercentage})
                {conversionFee > 0 && (
                  <span className="ml-1 text-xs text-gray-500">
                    (Free up to {FREE_CONVERSION_LIMIT.toLocaleString()} points)
                  </span>
                )}
              </span>
            </div>
            <div className="flex justify-between pt-2 border-t border-gray-200 mt-2">
              <span className="text-sm font-medium text-gray-700">You'll receive</span>
              {calculatedAmount > 0 ? (
                <AnimatedValueTooltip program={toProgram} points={calculatedAmount}>
                  <span className="text-sm font-bold text-primary-600 cursor-help hover:text-opacity-80 transition-all">
                    {calculatedAmount.toLocaleString()} {getDisplayProgramName(toProgram)} Points
                  </span>
                </AnimatedValueTooltip>
              ) : (
                <span className="text-sm font-bold text-primary-600">
                  0 {getDisplayProgramName(toProgram)} Points
                </span>
              )}
            </div>
          </div>
        </div>
        
        <div className="flex justify-end">
          <Button 
            variant="outline" 
            className="mr-3" 
            onClick={handleReset}
          >
            Reset
          </Button>
          <Button 
            disabled={amount <= 0 || fromProgram === toProgram || convertMutation.isPending || !sourceWallet || sourceWallet.balance < amount}
            onClick={handleConvert}
          >
            {convertMutation.isPending ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Converting...
              </>
            ) : (
              'Convert Points'
            )}
          </Button>
        </div>
      </div>
    </section>
  );
}
