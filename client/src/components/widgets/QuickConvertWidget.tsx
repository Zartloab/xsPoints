import React, { useState, useEffect } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { apiRequest, getQueryFn, queryClient } from '@/lib/queryClient';
import { Wallet, ConvertPointsData, ExchangeRate } from '@shared/schema';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/use-auth';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";
import {
  Loader2,
  RefreshCw,
  ChevronDown as ChevronDownIcon
} from 'lucide-react';
import { Input } from '@/components/ui/input';

// Helper function to get display name for loyalty programs
const getDisplayProgramName = (program: string): string => {
  switch (program) {
    case 'QANTAS': return 'Qantas';
    case 'GYG': return 'GYG';
    case 'XPOINTS': return 'xPoints';
    case 'VELOCITY': return 'Velocity';
    case 'AMEX': return 'AMEX';
    case 'FLYBUYS': return 'Flybuys';
    case 'HILTON': return 'Hilton';
    case 'MARRIOTT': return 'Marriott';
    case 'AIRBNB': return 'Airbnb';
    case 'DELTA': return 'Delta';
    default: return program;
  }
};

export default function QuickConvertWidget() {
  const { toast } = useToast();
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  
  // State for form
  const [fromProgram, setFromProgram] = useState<string>("QANTAS");
  const [toProgram, setToProgram] = useState<string>("XPOINTS");
  const [amount, setAmount] = useState<number>(0);
  const [calculatedAmount, setCalculatedAmount] = useState<number>(0);
  
  // Get user wallets
  const { data: wallets, isLoading: isLoadingWallets } = useQuery<Wallet[]>({
    queryKey: ['/api/wallets'],
    queryFn: getQueryFn({ on401: "throw" }),
    enabled: !!user && isOpen,
  });
  
  // Get exchange rates
  const { data: directRate, isLoading: isLoadingDirectRate } = useQuery<ExchangeRate>({
    queryKey: [`/api/exchange-rates?from=${fromProgram}&to=${toProgram}`],
    queryFn: getQueryFn({ on401: "throw" }),
    enabled: !!fromProgram && !!toProgram && isOpen,
  });
  
  // Get source and destination wallets
  const sourceWallet = wallets?.find(w => w.program === fromProgram);
  const destWallet = wallets?.find(w => w.program === toProgram);

  // State for fee calculation
  const [conversionFee, setConversionFee] = useState<number>(0);
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
        description: `Successfully converted ${amount} ${getDisplayProgramName(fromProgram)} points to ${calculatedAmount} ${getDisplayProgramName(toProgram)} points`,
      });
      
      // Invalidate cache to refresh wallet balances
      queryClient.invalidateQueries({ queryKey: ['/api/wallets'] });
      queryClient.invalidateQueries({ queryKey: ['/api/transactions'] });
      
      // Reset form and close drawer
      handleReset();
      setIsOpen(false);
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
    if (amount <= 0 || !directRate) {
      setCalculatedAmount(0);
      setConversionFee(0);
      return;
    }
    
    // Calculate fee first
    const fee = calculateFee(amount);
    setConversionFee(fee);
    
    // Calculate amount after fee deduction
    const amountAfterFee = amount - fee;
    
    // Direct conversion
    const calculated = amountAfterFee * Number(directRate.rate);
    setCalculatedAmount(Math.floor(calculated));
  }, [amount, directRate]);

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
        description: `You don't have enough ${getDisplayProgramName(fromProgram)} points for this conversion`,
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
    setCalculatedAmount(0);
    setConversionFee(0);
  };

  const getFromProgramBalance = () => {
    if (isLoadingWallets) return "Loading...";
    return sourceWallet ? sourceWallet.balance.toLocaleString() : "0";
  };

  const getToProgramBalance = () => {
    if (isLoadingWallets) return "Loading...";
    return destWallet ? destWallet.balance.toLocaleString() : "0";
  };

  return (
    <>
      {/* Floating button */}
      <div className="fixed bottom-24 right-6 z-50">
        <Drawer open={isOpen} onOpenChange={setIsOpen}>
          <DrawerTrigger asChild>
            <Button 
              size="lg" 
              className="rounded-full shadow-lg flex items-center gap-2 h-14 w-14 md:w-auto md:px-4"
              onClick={() => setIsOpen(true)}
            >
              <RefreshCw className="h-5 w-5" />
              <span className="hidden md:inline">Quick Convert</span>
            </Button>
          </DrawerTrigger>
          
          <DrawerContent>
            <div className="mx-auto w-full max-w-md">
              <DrawerHeader>
                <DrawerTitle>Quick Convert</DrawerTitle>
                <DrawerDescription>
                  Quickly convert points between your loyalty programs
                </DrawerDescription>
              </DrawerHeader>
              
              <div className="p-4 pb-0">
                <div className="grid grid-cols-2 gap-4 mb-4">
                  {/* From Section */}
                  <div>
                    <label className="text-sm text-gray-500 mb-1 block">From</label>
                    <div className="border rounded-md p-3">
                      <Select 
                        value={fromProgram} 
                        onValueChange={(value) => {
                          if (value === toProgram) {
                            setToProgram(fromProgram);
                          }
                          setFromProgram(value);
                          setAmount(0);
                          setCalculatedAmount(0);
                        }}
                      >
                        <SelectTrigger className="border-0 p-0 h-auto shadow-none focus:ring-0 w-full">
                          <div className="flex items-center justify-between w-full">
                            <SelectValue placeholder="Select program" />
                            <ChevronDownIcon className="h-4 w-4 opacity-50" />
                          </div>
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="QANTAS">Qantas</SelectItem>
                          <SelectItem value="GYG">GYG</SelectItem>
                          <SelectItem value="XPOINTS">xPoints</SelectItem>
                          <SelectItem value="VELOCITY">Velocity</SelectItem>
                          <SelectItem value="AMEX">AMEX</SelectItem>
                          <SelectItem value="FLYBUYS">Flybuys</SelectItem>
                          <SelectItem value="HILTON">Hilton</SelectItem>
                          <SelectItem value="MARRIOTT">Marriott</SelectItem>
                          <SelectItem value="AIRBNB">Airbnb</SelectItem>
                          <SelectItem value="DELTA">Delta</SelectItem>
                        </SelectContent>
                      </Select>
                      
                      <div className="flex items-center mt-2">
                        <div className="text-xs text-gray-500">Balance: {getFromProgramBalance()}</div>
                      </div>
                      
                      <div className="mt-2">
                        <Input
                          type="number"
                          placeholder="0"
                          value={amount || ''}
                          onChange={(e) => setAmount(Number(e.target.value))}
                          min={0}
                          max={sourceWallet?.balance || 0}
                          className="border-0 p-0 h-auto text-lg font-semibold focus-visible:ring-0"
                        />
                      </div>
                    </div>
                  </div>
                  
                  {/* To Section */}
                  <div>
                    <label className="text-sm text-gray-500 mb-1 block">To</label>
                    <div className="border rounded-md p-3">
                      <Select 
                        value={toProgram} 
                        onValueChange={(value) => {
                          if (value === fromProgram) {
                            setFromProgram(toProgram);
                          }
                          setToProgram(value);
                          setAmount(0);
                          setCalculatedAmount(0);
                        }}
                      >
                        <SelectTrigger className="border-0 p-0 h-auto shadow-none focus:ring-0 w-full">
                          <div className="flex items-center justify-between w-full">
                            <SelectValue placeholder="Select program" />
                            <ChevronDownIcon className="h-4 w-4 opacity-50" />
                          </div>
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="QANTAS">Qantas</SelectItem>
                          <SelectItem value="GYG">GYG</SelectItem>
                          <SelectItem value="XPOINTS">xPoints</SelectItem>
                          <SelectItem value="VELOCITY">Velocity</SelectItem>
                          <SelectItem value="AMEX">AMEX</SelectItem>
                          <SelectItem value="FLYBUYS">Flybuys</SelectItem>
                          <SelectItem value="HILTON">Hilton</SelectItem>
                          <SelectItem value="MARRIOTT">Marriott</SelectItem>
                          <SelectItem value="AIRBNB">Airbnb</SelectItem>
                          <SelectItem value="DELTA">Delta</SelectItem>
                        </SelectContent>
                      </Select>
                      
                      <div className="flex items-center mt-2">
                        <div className="text-xs text-gray-500">Balance: {getToProgramBalance()}</div>
                      </div>
                      
                      <div className="mt-2">
                        <div className="text-lg font-semibold">
                          {calculatedAmount ? calculatedAmount.toLocaleString() : '0'}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Rate and Fee Info */}
                {amount > 0 && (
                  <div className="bg-gray-50 rounded-md p-3 mb-4 text-sm">
                    <div className="flex justify-between mb-1">
                      <span className="text-gray-500">Rate:</span>
                      <span>
                        {isLoadingDirectRate ? 
                          <Loader2 className="h-3 w-3 inline animate-spin" /> : 
                          `1 ${getDisplayProgramName(fromProgram)} = ${Number(directRate?.rate).toFixed(4)} ${getDisplayProgramName(toProgram)}`
                        }
                      </span>
                    </div>
                    
                    <div className="flex justify-between mb-1">
                      <span className="text-gray-500">Fee:</span>
                      <span>
                        {conversionFee > 0 ? 
                          `${conversionFee.toLocaleString()} ${getDisplayProgramName(fromProgram)} points (0.5%)` : 
                          'Free'
                        }
                      </span>
                    </div>
                    
                    <div className="flex justify-between">
                      <span className="text-gray-500">You'll receive:</span>
                      <span className="font-semibold">
                        {calculatedAmount.toLocaleString()} {getDisplayProgramName(toProgram)} points
                      </span>
                    </div>
                  </div>
                )}
              </div>
              
              <DrawerFooter>
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
                <DrawerClose asChild>
                  <Button variant="outline">Cancel</Button>
                </DrawerClose>
              </DrawerFooter>
            </div>
          </DrawerContent>
        </Drawer>
      </div>
    </>
  );
}