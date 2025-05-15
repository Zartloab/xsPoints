import React, { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import { queryClient, apiRequest } from '@/lib/queryClient';
import { useMutation, useQuery } from '@tanstack/react-query';
import { Wallet, LoyaltyProgram } from '@shared/schema';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription,
  DialogTrigger,
  DialogFooter
} from '@/components/ui/dialog';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { AnimatedValueTooltip } from '@/components/ui/tooltip/AnimatedValueTooltip';
import { Sparkline } from '@/components/ui/charts/Sparkline';
import {
  HelpCircle,
  RefreshCw,
  ArrowRight,
  ChevronsRight,
  Check,
  Save,
  AlertCircle,
  Calculator,
  ArrowRightLeft,
  CreditCard,
  History,
  ChevronRight,
  TrendingUp
} from 'lucide-react';

interface StepProps {
  title: string;
  description: string;
  children: React.ReactNode;
  onNext?: () => void;
  onBack?: () => void;
  isLastStep?: boolean;
  isFirstStep?: boolean;
  isPending?: boolean;
}

// Step component for wizard steps
const Step: React.FC<StepProps> = ({ 
  title, 
  description, 
  children, 
  onNext, 
  onBack, 
  isLastStep = false,
  isFirstStep = false,
  isPending = false
}) => {
  return (
    <div className="space-y-6 py-4">
      <div>
        <h3 className="text-lg font-medium">{title}</h3>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>
      
      <div className="space-y-4">
        {children}
      </div>
      
      <div className="flex justify-between pt-4">
        {!isFirstStep && (
          <Button variant="outline" onClick={onBack} disabled={isPending}>
            Back
          </Button>
        )}
        {isFirstStep && <div />}
        
        <Button 
          onClick={onNext} 
          disabled={isPending}
          className="relative group"
        >
          {isPending ? (
            <span className="flex items-center">
              <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
              Processing...
            </span>
          ) : (
            <>
              {isLastStep ? 'Complete Conversion' : 'Next Step'}
              {isLastStep ? <Save className="ml-2 h-4 w-4" /> : <ChevronRight className="ml-2 h-4 w-4" />}
            </>
          )}
          
          {!isPending && !isLastStep && (
            <span className="absolute -right-1 -top-1 flex h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-primary"></span>
            </span>
          )}
        </Button>
      </div>
    </div>
  );
};

// Main component
const IntuitiveConversionWizard: React.FC = () => {
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState(0);
  const { toast } = useToast();
  const { user } = useAuth();
  
  // Form state
  const [fromProgram, setFromProgram] = useState<LoyaltyProgram>('XPOINTS');
  const [toProgram, setToProgram] = useState<LoyaltyProgram>('QANTAS');
  const [amount, setAmount] = useState<string>('1000');
  const [conversionComplete, setConversionComplete] = useState(false);
  
  // Reset form when dialog closes
  useEffect(() => {
    if (!open) {
      // Reset after a short delay to avoid animation issues
      const timer = setTimeout(() => {
        if (conversionComplete) {
          setStep(0);
          setFromProgram('XPOINTS');
          setToProgram('QANTAS');
          setAmount('1000');
          setConversionComplete(false);
        }
      }, 300);
      
      return () => clearTimeout(timer);
    }
  }, [open, conversionComplete]);
  
  // Fetch user wallets
  const { data: userWallets = [] } = useQuery<Wallet[]>({
    queryKey: ['/api/wallets'],
    enabled: !!user && open,
  });
  
  // Get exchange rate based on selected programs
  const { data: exchangeRate, isLoading: isRateLoading } = useQuery({
    queryKey: ['/api/exchange-rates', { from: fromProgram, to: toProgram }],
    queryFn: async () => {
      const res = await apiRequest('GET', `/api/exchange-rates?from=${fromProgram}&to=${toProgram}`);
      if (!res.ok) throw new Error('Failed to fetch exchange rate');
      return res.json();
    },
    enabled: !!fromProgram && !!toProgram && fromProgram !== toProgram && open && step >= 1,
  });
  
  // Get historical rate data for sparkline
  const { data: rateHistory, isLoading: isHistoryLoading } = useQuery({
    queryKey: ['/api/exchange-rates/history', { from: fromProgram, to: toProgram }],
    queryFn: async () => {
      const res = await apiRequest('GET', `/api/exchange-rates/history?from=${fromProgram}&to=${toProgram}&days=30`);
      if (!res.ok) throw new Error('Failed to fetch rate history');
      return res.json();
    },
    enabled: !!fromProgram && !!toProgram && fromProgram !== toProgram && open && step >= 1,
  });
  
  // Calculate destination amount
  const getToAmount = () => {
    if (!exchangeRate || !amount) return '0';
    const numAmount = parseFloat(amount);
    if (isNaN(numAmount)) return '0';
    return Math.floor(numAmount * exchangeRate.rate).toLocaleString();
  };
  
  // Estimate the fee (if any)
  const estimateFee = () => {
    const numAmount = parseFloat(amount);
    if (isNaN(numAmount)) return { fee: 0, isFreeTier: true };
    
    // Free tier up to 10,000 points per month
    const isFreeTier = numAmount <= 10000;
    
    // Fee calculation (0.5% for amounts over 10,000)
    const fee = isFreeTier ? 0 : numAmount * 0.005;
    
    return { fee, isFreeTier };
  };
  
  // Find relevant wallet
  const getWallet = (program: LoyaltyProgram) => {
    return userWallets.find(wallet => wallet.program === program);
  };
  
  // Check if conversion is valid
  const isValidConversion = () => {
    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 0) return false;
    
    const fromWallet = getWallet(fromProgram);
    if (!fromWallet) return false;
    
    return fromWallet.balance >= numAmount;
  };
  
  // Mutation for converting points
  const convertMutation = useMutation({
    mutationFn: async () => {
      const numAmount = parseFloat(amount);
      if (isNaN(numAmount)) throw new Error('Invalid amount');
      
      const res = await apiRequest('POST', '/api/convert', {
        fromProgram,
        toProgram,
        amount: numAmount
      });
      
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || 'Conversion failed');
      }
      
      return res.json();
    },
    onSuccess: () => {
      // Invalidate cached data that needs to be refreshed
      queryClient.invalidateQueries({ queryKey: ['/api/wallets'] });
      queryClient.invalidateQueries({ queryKey: ['/api/transactions'] });
      
      // Mark conversion as complete and move to success step
      setConversionComplete(true);
      setStep(3);
      
      toast({
        title: 'Points Converted Successfully',
        description: `You've converted ${parseFloat(amount).toLocaleString()} ${fromProgram} points to ${toProgram}.`,
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Conversion Failed',
        description: error.message,
        variant: 'destructive',
      });
    }
  });
  
  // Handle conversion
  const handleConvert = () => {
    if (!isValidConversion()) {
      toast({
        title: 'Invalid Conversion',
        description: 'Please check your input and try again.',
        variant: 'destructive',
      });
      return;
    }
    
    convertMutation.mutate();
  };
  
  // Calculate step progress
  const progress = Math.round((step / 3) * 100);
  
  // Define the steps
  const steps = [
    // Step 1: Select programs
    <Step 
      key="select-programs"
      title="Select Loyalty Programs"
      description="Choose which programs you want to convert between"
      onNext={() => setStep(1)}
      isFirstStep
    >
      <div className="grid grid-cols-1 gap-6">
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="fromProgram">Convert From</Label>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-5 w-5">
                    <HelpCircle className="h-3.5 w-3.5 text-muted-foreground" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="right" className="w-80">
                  <div className="space-y-2">
                    <h4 className="font-medium">Source Program</h4>
                    <p className="text-sm text-muted-foreground">
                      This is the loyalty program you'll be converting points from.
                      You can only convert from programs where you have available balance.
                    </p>
                  </div>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
          
          <Select value={fromProgram} onValueChange={(value) => setFromProgram(value as LoyaltyProgram)}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select source program" />
            </SelectTrigger>
            <SelectContent>
              {userWallets.map((wallet) => (
                <SelectItem 
                  key={wallet.id} 
                  value={wallet.program}
                  disabled={wallet.program === toProgram || wallet.balance <= 0}
                >
                  <div className="flex justify-between w-full">
                    <span>{wallet.program}</span>
                    <span className="text-xs text-muted-foreground">
                      {wallet.balance.toLocaleString()} points
                    </span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          {getWallet(fromProgram) && (
            <div className="text-sm text-muted-foreground flex items-center">
              <CreditCard className="h-3.5 w-3.5 mr-1.5" />
              Available: <AnimatedValueTooltip program={fromProgram} points={getWallet(fromProgram)?.balance || 0}>
                <span className="font-medium ml-1 text-foreground underline decoration-dotted">
                  {getWallet(fromProgram)?.balance.toLocaleString()} points
                </span>
              </AnimatedValueTooltip>
            </div>
          )}
        </div>
        
        <div className="flex justify-center">
          <div className="relative">
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="border-t w-full border-dashed border-muted"></div>
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-2 text-muted-foreground">Convert To</span>
            </div>
          </div>
        </div>
        
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="toProgram">Destination</Label>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-5 w-5">
                    <HelpCircle className="h-3.5 w-3.5 text-muted-foreground" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="right" className="w-80">
                  <div className="space-y-2">
                    <h4 className="font-medium">Destination Program</h4>
                    <p className="text-sm text-muted-foreground">
                      This is the loyalty program you'll be converting points to.
                      The exchange rate between programs determines how many points you'll receive.
                    </p>
                  </div>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
          
          <Select value={toProgram} onValueChange={(value) => setToProgram(value as LoyaltyProgram)}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select destination program" />
            </SelectTrigger>
            <SelectContent>
              {userWallets.map((wallet) => (
                <SelectItem 
                  key={wallet.id} 
                  value={wallet.program}
                  disabled={wallet.program === fromProgram}
                >
                  {wallet.program}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          {getWallet(toProgram) && (
            <div className="text-sm text-muted-foreground flex items-center">
              <CreditCard className="h-3.5 w-3.5 mr-1.5" />
              Current balance: <AnimatedValueTooltip program={toProgram} points={getWallet(toProgram)?.balance || 0}>
                <span className="font-medium ml-1 text-foreground underline decoration-dotted">
                  {getWallet(toProgram)?.balance.toLocaleString()} points
                </span>
              </AnimatedValueTooltip>
            </div>
          )}
        </div>
      </div>
    </Step>,
    
    // Step 2: Enter amount
    <Step 
      key="enter-amount"
      title="Enter Conversion Amount"
      description="Specify how many points you want to convert"
      onNext={() => setStep(2)}
      onBack={() => setStep(0)}
    >
      <div className="space-y-6">
        {isRateLoading ? (
          <div className="flex items-center justify-center py-6">
            <RefreshCw className="h-5 w-5 animate-spin text-muted-foreground" />
            <span className="ml-2 text-sm text-muted-foreground">Loading exchange rate...</span>
          </div>
        ) : exchangeRate ? (
          <div className="bg-muted/50 border rounded-lg p-4 space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Current Exchange Rate:</span>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <span className="font-medium flex items-center cursor-help">
                      1 {fromProgram} = {exchangeRate.rate} {toProgram}
                      <HelpCircle className="h-3.5 w-3.5 ml-1 text-muted-foreground" />
                    </span>
                  </TooltipTrigger>
                  <TooltipContent side="right" className="w-80">
                    <div className="space-y-2">
                      <h4 className="font-medium">About This Rate</h4>
                      <p className="text-sm text-muted-foreground">
                        Exchange rates are updated daily based on market values.
                        Rates reflect the relative value of different loyalty program points.
                      </p>
                      
                      <div className="mt-3">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs flex items-center text-muted-foreground">
                            <TrendingUp className="h-3 w-3 mr-1" /> 
                            Rate Trend (30 days)
                          </span>
                          {!isHistoryLoading && rateHistory && rateHistory.length > 0 && (
                            <div className="flex items-center text-xs">
                              <span className={
                                rateHistory[0].rate <= rateHistory[rateHistory.length-1].rate 
                                  ? "text-green-600" 
                                  : "text-red-600"
                              }>
                                {Math.abs(((rateHistory[rateHistory.length-1].rate / rateHistory[0].rate) - 1) * 100).toFixed(2)}%
                                {rateHistory[0].rate <= rateHistory[rateHistory.length-1].rate ? " ↑" : " ↓"}
                              </span>
                            </div>
                          )}
                        </div>
                        {isHistoryLoading ? (
                          <div className="h-10 w-full bg-gray-100 rounded animate-pulse" />
                        ) : (
                          <Sparkline 
                            data={rateHistory || []} 
                            height={30} 
                            showTooltip={true}
                            className="rounded-md"
                          />
                        )}
                      </div>
                      
                      <div className="text-xs bg-primary/10 p-2 rounded-sm mt-3">
                        Last updated: {new Date().toLocaleDateString()}
                      </div>
                    </div>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
            
            <div className="flex justify-between items-center text-sm">
              <span className="text-muted-foreground">Dollar Value:</span>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <span className="flex items-center cursor-help text-green-600 font-medium">
                      ${(parseFloat(amount || '0') * 0.01).toFixed(2)} USD
                      <HelpCircle className="h-3.5 w-3.5 ml-1 text-muted-foreground" />
                    </span>
                  </TooltipTrigger>
                  <TooltipContent side="right" className="w-80">
                    <div className="space-y-2">
                      <h4 className="font-medium">Dollar Value</h4>
                      <p className="text-sm text-muted-foreground">
                        This is the estimated dollar value of your points.
                        Values are approximate and may vary based on redemption options.
                      </p>
                    </div>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
          </div>
        ) : (
          <div className="bg-amber-50 border-amber-200 border rounded-lg p-4">
            <div className="flex items-start text-amber-800">
              <AlertCircle className="h-5 w-5 mr-2 flex-shrink-0" />
              <p className="text-sm">
                Could not load exchange rate. Please try selecting different programs.
              </p>
            </div>
          </div>
        )}
        
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Label htmlFor="amount">
              Amount to Convert 
              <span className="ml-2 text-xs text-muted-foreground">
                from {fromProgram}
              </span>
            </Label>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-5 w-5">
                    <Calculator className="h-3.5 w-3.5 text-muted-foreground" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="top" className="w-80">
                  <div className="space-y-2">
                    <h4 className="font-medium">Conversion Calculator</h4>
                    <p className="text-sm text-muted-foreground">
                      Enter the amount of points you want to convert.
                      The calculator will show how many points you'll receive in return.
                    </p>
                  </div>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
          
          <Input
            id="amount"
            type="number"
            min="1"
            placeholder="0"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="text-lg"
          />
          
          {getWallet(fromProgram) && parseFloat(amount) > (getWallet(fromProgram)?.balance || 0) && (
            <div className="text-sm text-red-500 flex items-center">
              <AlertCircle className="h-3.5 w-3.5 mr-1.5" />
              Insufficient balance. You have {getWallet(fromProgram)?.balance.toLocaleString()} points available.
            </div>
          )}
          
          <div className="flex justify-between items-center mt-4 bg-muted/30 rounded-lg p-3">
            <div className="text-sm font-medium">You'll receive:</div>
            <div className="text-lg font-bold text-green-600">
              {getToAmount()} {toProgram}
            </div>
          </div>
          
          <div className="text-xs text-muted-foreground pt-2">
            <div className="flex items-center">
              <CreditCard className="h-3.5 w-3.5 mr-1.5" />
              <span>Source balance: {getWallet(fromProgram)?.balance.toLocaleString() || 0} {fromProgram}</span>
            </div>
            <div className="flex items-center mt-1">
              <ArrowRightLeft className="h-3.5 w-3.5 mr-1.5" />
              <span>Conversion rate: 1 {fromProgram} = {exchangeRate?.rate || '?'} {toProgram}</span>
            </div>
            <div className="flex items-center mt-1">
              <History className="h-3.5 w-3.5 mr-1.5" />
              <span>
                Fees: {estimateFee().isFreeTier ? 'No fee' : `${estimateFee().fee.toLocaleString()} points (0.5%)`}
              </span>
            </div>
          </div>
        </div>
      </div>
    </Step>,
    
    // Step 3: Review and confirm
    <Step 
      key="review"
      title="Review Conversion"
      description="Verify the details before completing the conversion"
      onNext={handleConvert}
      onBack={() => setStep(1)}
      isLastStep
      isPending={convertMutation.isPending}
    >
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="rounded-lg border bg-card p-4">
            <div className="text-sm font-medium mb-3">From</div>
            <div className="flex items-center">
              <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                <span className="font-semibold text-xs">{fromProgram.substring(0, 2)}</span>
              </div>
              <div className="ml-3">
                <div className="font-medium">{fromProgram}</div>
                <div className="text-sm text-muted-foreground">
                  {parseFloat(amount).toLocaleString()} points
                </div>
              </div>
            </div>
          </div>
          
          <div className="rounded-lg border bg-card p-4">
            <div className="text-sm font-medium mb-3">To</div>
            <div className="flex items-center">
              <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                <span className="font-semibold text-xs">{toProgram.substring(0, 2)}</span>
              </div>
              <div className="ml-3">
                <div className="font-medium">{toProgram}</div>
                <div className="text-sm text-muted-foreground">
                  {getToAmount()} points
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <div className="bg-primary/5 border rounded-lg p-4">
          <div className="text-sm font-medium mb-2">Conversion Summary</div>
          <ul className="space-y-2 text-sm">
            <li className="flex justify-between">
              <span className="text-muted-foreground">Points to convert:</span>
              <span>{parseFloat(amount).toLocaleString()} {fromProgram}</span>
            </li>
            <li className="flex justify-between">
              <span className="text-muted-foreground">Exchange rate:</span>
              <span>1 {fromProgram} = {exchangeRate?.rate || '?'} {toProgram}</span>
            </li>
            <li className="pt-2">
              <div className="flex items-center justify-between mb-1">
                <span className="text-muted-foreground text-sm flex items-center">
                  <TrendingUp className="h-3 w-3 mr-1" /> 
                  Rate Trend (30 days)
                </span>
                {!isHistoryLoading && rateHistory && rateHistory.length > 0 && (
                  <div className="flex items-center text-xs">
                    <span className={
                      rateHistory[0].rate <= rateHistory[rateHistory.length-1].rate 
                        ? "text-green-600" 
                        : "text-red-600"
                    }>
                      {Math.abs(((rateHistory[rateHistory.length-1].rate / rateHistory[0].rate) - 1) * 100).toFixed(2)}%
                      {rateHistory[0].rate <= rateHistory[rateHistory.length-1].rate ? " ↑" : " ↓"}
                    </span>
                  </div>
                )}
              </div>
              {isHistoryLoading ? (
                <div className="h-10 w-full bg-gray-100 rounded animate-pulse" />
              ) : (
                <Sparkline 
                  data={rateHistory || []} 
                  height={40} 
                  showTooltip={true}
                  className="rounded-md border border-gray-100"
                />
              )}
            </li>
            <li className="flex justify-between">
              <span className="text-muted-foreground">Conversion fee:</span>
              <span>
                {estimateFee().isFreeTier ? 'Free' : `${estimateFee().fee.toLocaleString()} points`}
              </span>
            </li>
            <li className="flex justify-between font-medium border-t pt-2 mt-2">
              <span>You'll receive:</span>
              <span className="text-green-600">{getToAmount()} {toProgram}</span>
            </li>
          </ul>
        </div>
        
        <div className="bg-amber-50 border-amber-100 border rounded-lg p-4">
          <div className="flex items-start">
            <AlertCircle className="h-5 w-5 text-amber-600 mr-3 flex-shrink-0" />
            <div className="text-sm text-amber-800">
              <p className="font-medium mb-1">Important Information</p>
              <ul className="list-disc pl-4 space-y-1">
                <li>Conversions are typically processed instantly</li>
                <li>This transaction cannot be reversed once confirmed</li>
                <li>Free conversions up to 10,000 points/month</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </Step>,
    
    // Step 4: Conversion success
    <Step
      key="success"
      title="Conversion Complete"
      description="Your points have been successfully converted"
      onNext={() => setOpen(false)}
      isLastStep
      isFirstStep
    >
      <div className="py-6 text-center space-y-6">
        <div className="mx-auto w-16 h-16 rounded-full bg-green-100 flex items-center justify-center">
          <Check className="h-8 w-8 text-green-600" />
        </div>
        
        <div>
          <h3 className="text-xl font-medium mb-2">Points Converted Successfully!</h3>
          <p className="text-muted-foreground">
            You've successfully converted {parseFloat(amount).toLocaleString()} {fromProgram} points to {getToAmount()} {toProgram} points.
          </p>
        </div>
        
        <div className="bg-green-50 border border-green-100 rounded-lg p-4 max-w-md mx-auto">
          <div className="text-sm font-medium mb-2 text-left">Transaction Summary</div>
          <ul className="space-y-2 text-sm text-left">
            <li className="flex justify-between">
              <span className="text-muted-foreground">From:</span>
              <span>{parseFloat(amount).toLocaleString()} {fromProgram}</span>
            </li>
            <li className="flex justify-between">
              <span className="text-muted-foreground">To:</span>
              <span>{getToAmount()} {toProgram}</span>
            </li>
            <li className="flex justify-between">
              <span className="text-muted-foreground">Date:</span>
              <span>{new Date().toLocaleDateString()}</span>
            </li>
            <li className="flex justify-between">
              <span className="text-muted-foreground">Status:</span>
              <span className="text-green-600 font-medium">Completed</span>
            </li>
          </ul>
        </div>
        
        <div>
          <Button variant="outline" className="mr-2" onClick={() => setOpen(false)}>
            Close
          </Button>
          <Button onClick={() => setStep(0)}>
            New Conversion
          </Button>
        </div>
      </div>
    </Step>
  ];
  
  return (
    <Card className="shadow-md hover:shadow-lg transition-shadow">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center">
          <ArrowRightLeft className="mr-2 h-5 w-5 text-primary" />
          Convert Points
        </CardTitle>
        <CardDescription>
          Exchange points between your loyalty program accounts with our intuitive wizard
        </CardDescription>
      </CardHeader>
      
      <CardContent className="pt-0">
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button className="w-full" size="lg">
              <ArrowRightLeft className="mr-2 h-5 w-5" /> 
              Start Point Conversion
            </Button>
          </DialogTrigger>
          
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Point Conversion Wizard</DialogTitle>
              <DialogDescription>
                Convert your loyalty points in a few simple steps
              </DialogDescription>
            </DialogHeader>
            
            <div className="mb-6 mt-2">
              <Progress value={progress} className="h-2" />
              <div className="flex justify-between mt-1 text-xs text-muted-foreground">
                <div>Step {step + 1} of 4</div>
                <div>{progress}% Complete</div>
              </div>
            </div>
            
            {steps[step]}
          </DialogContent>
        </Dialog>
        
        <p className="text-sm text-muted-foreground mt-4">
          Convert your points between different loyalty programs with our simple step-by-step wizard.
          Get real-time exchange rates and see the exact value of your points.
        </p>
      </CardContent>
      
      <CardFooter className="flex justify-between border-t pt-4 text-xs text-muted-foreground">
        <div className="flex items-center">
          <Check className="h-3 w-3 mr-1 text-green-500" />
          Instant conversions
        </div>
        <div className="flex items-center">
          <Check className="h-3 w-3 mr-1 text-green-500" />
          Real-time rates
        </div>
        <div className="flex items-center">
          <Check className="h-3 w-3 mr-1 text-green-500" />
          No hidden fees
        </div>
      </CardFooter>
    </Card>
  );
};

export default IntuitiveConversionWizard;