import React, { useState, useEffect } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useAuth } from '@/hooks/use-auth';
import { LoyaltyProgram, ExchangeRate, Wallet, ConvertPointsData } from '@shared/schema';
import { useIsMobile } from '@/hooks/use-mobile';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Loader2, ArrowRight, RefreshCw, AlertTriangle, CheckCircle2 } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useToast } from '@/hooks/use-toast';
import { queryClient, apiRequest } from '@/lib/queryClient';

// Helper function to get program name for display
function getProgramName(program: LoyaltyProgram): string {
  const names: Record<LoyaltyProgram, string> = {
    'QANTAS': 'Qantas',
    'GYG': 'GYG',
    'XPOINTS': 'xPoints',
    'VELOCITY': 'Velocity',
    'AMEX': 'Amex',
    'FLYBUYS': 'Flybuys',
    'HILTON': 'Hilton',
    'MARRIOTT': 'Marriott',
    'AIRBNB': 'Airbnb',
    'DELTA': 'Delta',
  };
  return names[program] || program;
}

// Helper function to get program color
function getProgramColor(program: LoyaltyProgram): string {
  const colors: Record<LoyaltyProgram, string> = {
    'QANTAS': '#E40000',
    'GYG': '#00AB55',
    'XPOINTS': '#6366F1',
    'VELOCITY': '#D90000',
    'AMEX': '#006FCF',
    'FLYBUYS': '#003E79',
    'HILTON': '#00406A',
    'MARRIOTT': '#B18C50',
    'AIRBNB': '#FF5A5F',
    'DELTA': '#003366',
  };
  return colors[program] || '#6366F1';
}

// Helper function to get program logo
function getProgramLogo(program: LoyaltyProgram): React.ReactNode {
  // This is a simplified version - in a real app, you'd import actual SVG logos
  return (
    <div 
      className="h-10 w-10 rounded-full flex items-center justify-center text-white font-bold text-sm"
      style={{ backgroundColor: getProgramColor(program) }}
    >
      {program === 'XPOINTS' ? 'XP' : program.substring(0, 2)}
    </div>
  );
}

export default function ConvertPage() {
  const { user } = useAuth();
  const isMobile = useIsMobile();
  const { toast } = useToast();
  
  // State for conversion form
  const [fromProgram, setFromProgram] = useState<LoyaltyProgram | ''>('');
  const [toProgram, setToProgram] = useState<LoyaltyProgram | ''>('');
  const [amount, setAmount] = useState<string>('');
  const [isConfirmDialogOpen, setIsConfirmDialogOpen] = useState(false);
  
  // Fetch user wallets
  const { 
    data: wallets = [],
    isLoading: walletsLoading
  } = useQuery<Wallet[]>({
    queryKey: ['/api/wallets'],
    enabled: !!user,
  });
  
  // Fetch exchange rate based on selected programs
  const {
    data: exchangeRate,
    isLoading: rateLoading,
    isError: rateError
  } = useQuery<ExchangeRate>({
    queryKey: ['/api/exchange-rates', fromProgram, toProgram],
    enabled: !!fromProgram && !!toProgram && fromProgram !== toProgram,
  });
  
  // Convert the points
  const convertMutation = useMutation({
    mutationFn: async (data: ConvertPointsData) => {
      const res = await apiRequest('POST', '/api/convert', data);
      return await res.json();
    },
    onSuccess: () => {
      // Reset form and close dialog
      setAmount('');
      setIsConfirmDialogOpen(false);
      
      // Show success toast
      toast({
        title: "Conversion Successful",
        description: "Your points have been successfully converted",
        variant: "success",
      });
      
      // Refresh wallets data and transactions
      queryClient.invalidateQueries({ queryKey: ['/api/wallets'] });
      queryClient.invalidateQueries({ queryKey: ['/api/transactions'] });
      queryClient.invalidateQueries({ queryKey: ['/api/user-stats'] });
    },
    onError: (error: Error) => {
      setIsConfirmDialogOpen(false);
      toast({
        title: "Conversion Failed",
        description: error.message || "There was an error converting your points",
        variant: "destructive",
      });
    },
  });
  
  // Get the source wallet for the selected program
  const sourceWallet = fromProgram ? wallets.find(w => w.program === fromProgram) : undefined;
  
  // Calculate the conversion result
  const calculateResult = () => {
    if (!fromProgram || !toProgram || !amount || !exchangeRate) return null;
    
    const amountNum = parseFloat(amount);
    if (isNaN(amountNum) || amountNum <= 0) return null;
    
    const result = amountNum * parseFloat(exchangeRate.rate);
    return result;
  };
  
  // Calculate fees (if any)
  const calculateFee = () => {
    const amountNum = parseFloat(amount);
    if (isNaN(amountNum)) return 0;
    
    // Simple fee calculation example - adjust based on your business logic
    if (amountNum <= 10000) return 0;
    
    // 0.5% fee for amounts over 10,000
    return Math.round(amountNum * 0.005);
  };
  
  // Format the exchange rate for display
  const getExchangeRateDisplay = () => {
    if (!exchangeRate) return '-';
    
    const rate = parseFloat(exchangeRate.rate);
    return `1 ${getProgramName(fromProgram as LoyaltyProgram)} = ${rate.toFixed(4)} ${getProgramName(toProgram as LoyaltyProgram)}`;
  };
  
  // Handle conversion submission
  const handleConvert = () => {
    if (!fromProgram || !toProgram || !amount) return;
    
    const amountNum = parseFloat(amount);
    if (isNaN(amountNum) || amountNum <= 0) {
      toast({
        title: "Invalid Amount",
        description: "Please enter a valid amount",
        variant: "destructive",
      });
      return;
    }
    
    if (sourceWallet && sourceWallet.balance < amountNum) {
      toast({
        title: "Insufficient Balance",
        description: `You don't have enough ${getProgramName(fromProgram)} points`,
        variant: "destructive",
      });
      return;
    }
    
    setIsConfirmDialogOpen(true);
  };
  
  // Perform the conversion after confirmation
  const confirmConversion = () => {
    if (!fromProgram || !toProgram || !amount) return;
    
    const amountNum = parseFloat(amount);
    convertMutation.mutate({
      fromProgram,
      toProgram,
      amount: amountNum
    });
  };
  
  // Available programs for source selection (ones we have wallets for)
  const sourcePrograms = wallets.map(wallet => wallet.program);
  
  // Available programs for destination selection (excluding source)
  const destPrograms = ['XPOINTS', 'QANTAS', 'GYG', 'VELOCITY', 'AMEX', 'FLYBUYS', 'HILTON', 'MARRIOTT', 'AIRBNB', 'DELTA']
    .filter(program => program !== fromProgram);
  
  const conversionResult = calculateResult();
  const fee = calculateFee();
  const finalAmount = conversionResult !== null ? conversionResult - fee : null;

  return (
    <div className="container mx-auto max-w-7xl p-4 sm:p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">Convert Points</h1>
        <p className="text-muted-foreground">Exchange points between different loyalty programs</p>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Point Conversion</CardTitle>
              <CardDescription>
                Convert points between your linked loyalty programs
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                {/* Source Program */}
                <div>
                  <label className="font-medium text-sm mb-2 block">From</label>
                  <Select value={fromProgram} onValueChange={(val) => {
                    setFromProgram(val as LoyaltyProgram);
                    if (val === toProgram) setToProgram('');
                  }}>
                    <SelectTrigger className="h-14">
                      {fromProgram ? (
                        <div className="flex items-center gap-3">
                          {getProgramLogo(fromProgram as LoyaltyProgram)}
                          <div>
                            <div className="font-medium">{getProgramName(fromProgram as LoyaltyProgram)}</div>
                            <div className="text-xs text-muted-foreground">
                              Balance: {sourceWallet?.balance.toLocaleString() || 0}
                            </div>
                          </div>
                        </div>
                      ) : (
                        <SelectValue placeholder="Select source program" />
                      )}
                    </SelectTrigger>
                    <SelectContent>
                      {walletsLoading ? (
                        <div className="flex items-center justify-center p-4">
                          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                        </div>
                      ) : sourcePrograms.length > 0 ? (
                        sourcePrograms.map((program) => {
                          const wallet = wallets.find(w => w.program === program);
                          return (
                            <SelectItem key={program} value={program}>
                              <div className="flex items-center gap-3">
                                {getProgramLogo(program as LoyaltyProgram)}
                                <div>
                                  <div className="font-medium">{getProgramName(program as LoyaltyProgram)}</div>
                                  <div className="text-xs text-muted-foreground">
                                    Balance: {wallet?.balance.toLocaleString() || 0}
                                  </div>
                                </div>
                              </div>
                            </SelectItem>
                          );
                        })
                      ) : (
                        <div className="p-2 text-center text-muted-foreground text-sm">
                          No wallets available
                        </div>
                      )}
                    </SelectContent>
                  </Select>
                </div>
                
                {/* Destination Program */}
                <div>
                  <label className="font-medium text-sm mb-2 block">To</label>
                  <Select
                    value={toProgram}
                    onValueChange={(val) => setToProgram(val as LoyaltyProgram)}
                    disabled={!fromProgram}
                  >
                    <SelectTrigger className="h-14">
                      {toProgram ? (
                        <div className="flex items-center gap-3">
                          {getProgramLogo(toProgram as LoyaltyProgram)}
                          <div className="font-medium">{getProgramName(toProgram as LoyaltyProgram)}</div>
                        </div>
                      ) : (
                        <SelectValue placeholder={fromProgram ? "Select destination program" : "Select source program first"} />
                      )}
                    </SelectTrigger>
                    <SelectContent>
                      {destPrograms.map((program) => (
                        <SelectItem key={program} value={program}>
                          <div className="flex items-center gap-3">
                            {getProgramLogo(program as LoyaltyProgram)}
                            <div className="font-medium">{getProgramName(program as LoyaltyProgram)}</div>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              {/* Amount */}
              <div className="mb-6">
                <label className="font-medium text-sm mb-2 block">Amount</label>
                <div className="flex gap-3">
                  <div className="flex-1">
                    <Input
                      type="number"
                      placeholder="Enter amount to convert"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      disabled={!fromProgram || !toProgram}
                      className="h-12"
                    />
                    {sourceWallet && (
                      <div className="text-xs text-muted-foreground mt-1">
                        Available Balance: {sourceWallet.balance.toLocaleString()} pts
                      </div>
                    )}
                  </div>
                  <Button
                    variant="outline"
                    className="h-12 px-6"
                    onClick={() => sourceWallet && setAmount(sourceWallet.balance.toString())}
                    disabled={!sourceWallet}
                  >
                    Max
                  </Button>
                </div>
              </div>
              
              {/* Rate Display */}
              {fromProgram && toProgram && (
                <div className="mb-6 p-4 border rounded-lg">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Exchange Rate</span>
                    <span className="font-medium">{rateLoading ? 'Loading...' : getExchangeRateDisplay()}</span>
                  </div>
                  {fee > 0 && (
                    <div className="flex items-center justify-between mt-2">
                      <span className="text-sm text-muted-foreground">Fee</span>
                      <span className="font-medium">{fee.toLocaleString()} pts</span>
                    </div>
                  )}
                </div>
              )}
              
              {/* Result Summary */}
              {conversionResult !== null && (
                <div className="border rounded-lg p-4 mb-6 bg-muted/30">
                  <div className="flex justify-between items-center">
                    <div className="font-medium">You will receive:</div>
                    <div className="text-xl font-bold">{finalAmount?.toLocaleString()} {getProgramName(toProgram as LoyaltyProgram)} points</div>
                  </div>
                </div>
              )}
              
              {/* Error Message */}
              {rateError && (
                <div className="border border-destructive rounded-lg p-4 mb-6 bg-destructive/10 flex items-center gap-2 text-destructive">
                  <AlertTriangle className="h-5 w-5" />
                  <div>Unable to fetch exchange rate. Please try again later.</div>
                </div>
              )}
            </CardContent>
            <CardFooter className="flex justify-end">
              <Button
                size="lg"
                onClick={handleConvert}
                disabled={
                  !fromProgram || 
                  !toProgram || 
                  !amount || 
                  parseFloat(amount) <= 0 || 
                  (sourceWallet && parseFloat(amount) > sourceWallet.balance) ||
                  rateLoading || 
                  rateError || 
                  convertMutation.isPending
                }
              >
                {convertMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Converting...
                  </>
                ) : (
                  <>Convert Points</>
                )}
              </Button>
            </CardFooter>
          </Card>
        </div>
        
        <div>
          <Card>
            <CardHeader>
              <CardTitle>Conversion Guide</CardTitle>
              <CardDescription>How the conversion process works</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="p-3 border rounded-lg">
                  <div className="font-medium mb-1">Step 1: Select Programs</div>
                  <p className="text-sm text-muted-foreground">
                    Choose the loyalty program you want to convert points from and to. You can only convert from programs where you have linked accounts.
                  </p>
                </div>
                
                <div className="p-3 border rounded-lg">
                  <div className="font-medium mb-1">Step 2: Enter Amount</div>
                  <p className="text-sm text-muted-foreground">
                    Enter the number of points you wish to convert. The system will automatically calculate how many points you'll receive based on current exchange rates.
                  </p>
                </div>
                
                <div className="p-3 border rounded-lg">
                  <div className="font-medium mb-1">Step 3: Review & Confirm</div>
                  <p className="text-sm text-muted-foreground">
                    Review the conversion details, including any applicable fees, and confirm the transaction.
                  </p>
                </div>
                
                <div className="p-3 border rounded-lg">
                  <div className="font-medium mb-1">Fees & Rates</div>
                  <p className="text-sm text-muted-foreground">
                    Conversions up to 10,000 points are free. Beyond that, a 0.5% fee applies. Exchange rates are updated in real-time to ensure fair conversions.
                  </p>
                </div>
              </div>
            </CardContent>
            <CardFooter className="flex justify-center border-t">
              <Button variant="link" asChild>
                <a href="/tutorial">View Full Tutorial</a>
              </Button>
            </CardFooter>
          </Card>
        </div>
      </div>
      
      {/* Confirmation Dialog */}
      <Dialog open={isConfirmDialogOpen} onOpenChange={setIsConfirmDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Confirm Conversion</DialogTitle>
            <DialogDescription>
              Please review the details below before converting your points.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="flex justify-between border-b pb-2">
              <span className="text-muted-foreground">From:</span>
              <span className="font-medium">{fromProgram && `${amount} ${getProgramName(fromProgram as LoyaltyProgram)} points`}</span>
            </div>
            <div className="flex justify-between border-b pb-2">
              <span className="text-muted-foreground">To:</span>
              <span className="font-medium">{toProgram && `${conversionResult?.toLocaleString()} ${getProgramName(toProgram as LoyaltyProgram)} points`}</span>
            </div>
            {fee > 0 && (
              <div className="flex justify-between border-b pb-2">
                <span className="text-muted-foreground">Fee:</span>
                <span className="font-medium">{fee.toLocaleString()} points</span>
              </div>
            )}
            <div className="flex justify-between font-medium">
              <span>You will receive:</span>
              <span>{finalAmount?.toLocaleString()} {toProgram && getProgramName(toProgram as LoyaltyProgram)} points</span>
            </div>
          </div>
          <DialogFooter className="sm:justify-between">
            <Button
              variant="outline"
              onClick={() => setIsConfirmDialogOpen(false)}
              disabled={convertMutation.isPending}
            >
              Cancel
            </Button>
            <Button
              onClick={confirmConversion}
              disabled={convertMutation.isPending}
            >
              {convertMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Processing...
                </>
              ) : (
                <>Confirm Conversion</>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}