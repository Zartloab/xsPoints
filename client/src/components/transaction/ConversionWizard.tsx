import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { LoyaltyProgram } from '@shared/schema';
import { useQuery } from '@tanstack/react-query';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/use-auth';
import {
  ArrowRightCircle,
  Calculator,
  ChevronsRight,
  DollarSign,
  HelpCircle,
  LightbulbIcon,
  RefreshCw,
  Save,
  Sparkles,
} from 'lucide-react';
import { useMutation } from '@tanstack/react-query';
import { Progress } from '@/components/ui/progress';

// Step interface
interface WizardStep {
  title: string;
  subtitle: string;
  content: React.ReactNode;
}

const ConversionWizard: React.FC = () => {
  const [open, setOpen] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const { toast } = useToast();
  const { user } = useAuth();

  // Form state
  const [fromProgram, setFromProgram] = useState<LoyaltyProgram>('XPOINTS');
  const [toProgram, setToProgram] = useState<LoyaltyProgram>('QANTAS');
  const [amount, setAmount] = useState<string>('1000');
  
  // Fetch user wallets
  const { data: wallets = [] } = useQuery<Wallet[]>({
    queryKey: ['/api/wallets'],
    enabled: !!user,
  });
  
  // Get exchange rate
  const { data: exchangeRate } = useQuery({
    queryKey: ['/api/exchange-rates', { from: fromProgram, to: toProgram }],
    queryFn: async () => {
      const res = await apiRequest('GET', `/api/exchange-rates?from=${fromProgram}&to=${toProgram}`);
      return res.json();
    },
    enabled: !!fromProgram && !!toProgram && fromProgram !== toProgram,
  });
  
  // Mutation for converting points
  const convertMutation = useMutation({
    mutationFn: async (data: { fromProgram: string; toProgram: string; amount: number }) => {
      const res = await apiRequest('POST', '/api/convert', data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/wallets'] });
      queryClient.invalidateQueries({ queryKey: ['/api/transactions'] });
      toast({
        title: 'Points Converted',
        description: `Successfully converted ${amount} ${fromProgram} points to ${toProgram}`,
      });
      setCurrentStep(currentStep + 1);
    },
    onError: (error: Error) => {
      toast({
        title: 'Conversion Failed',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  // Calculate converted amount
  const calculateConvertedAmount = () => {
    if (!exchangeRate || !amount) return 0;
    return (parseFloat(amount) * parseFloat(exchangeRate.rate)).toFixed(0);
  };
  
  // Get wallet balance for a program
  const getWalletBalance = (program: string) => {
    const wallet = wallets.find((w: any) => w.program === program);
    return wallet ? wallet.balance : 0;
  };
  
  // Handle form submission
  const handleConvert = () => {
    if (!fromProgram || !toProgram || !amount) {
      toast({
        title: 'Invalid Form',
        description: 'Please fill in all fields',
        variant: 'destructive',
      });
      return;
    }
    
    const amountValue = parseFloat(amount);
    if (isNaN(amountValue) || amountValue <= 0) {
      toast({
        title: 'Invalid Amount',
        description: 'Please enter a valid amount',
        variant: 'destructive',
      });
      return;
    }
    
    // Check wallet balance
    const balance = getWalletBalance(fromProgram);
    if (balance < amountValue) {
      toast({
        title: 'Insufficient Balance',
        description: `You only have ${balance} ${fromProgram} points`,
        variant: 'destructive',
      });
      return;
    }
    
    convertMutation.mutate({
      fromProgram,
      toProgram,
      amount: amountValue,
    });
  };
  
  // Reset wizard
  const resetWizard = () => {
    setCurrentStep(0);
    setFromProgram('XPOINTS');
    setToProgram('QANTAS');
    setAmount('1000');
    setOpen(false);
  };

  // Define the wizard steps
  const steps: WizardStep[] = [
    {
      title: 'Welcome to Point Conversion',
      subtitle: 'Let\'s start converting your loyalty points',
      content: (
        <div className="space-y-6 py-4">
          <div className="bg-blue-50 p-4 rounded-lg border border-blue-100">
            <div className="flex">
              <LightbulbIcon className="h-6 w-6 text-blue-500 mr-3 flex-shrink-0" />
              <div className="text-sm">
                <p className="font-medium text-blue-800 mb-1">How Point Conversion Works</p>
                <p className="text-blue-700">
                  This wizard will guide you through converting points from one loyalty program to another.
                  xPoints acts as a universal exchange currency, allowing you to move value between different programs.
                </p>
              </div>
            </div>
          </div>
          
          <div className="grid grid-cols-3 gap-4 text-center">
            <div className="bg-muted p-4 rounded-lg">
              <div className="bg-primary-100 text-primary rounded-full w-10 h-10 flex items-center justify-center mx-auto mb-2">1</div>
              <h4 className="font-medium">Select Programs</h4>
              <p className="text-xs text-muted-foreground">Choose source and destination</p>
            </div>
            <div className="bg-muted p-4 rounded-lg">
              <div className="bg-primary-100 text-primary rounded-full w-10 h-10 flex items-center justify-center mx-auto mb-2">2</div>
              <h4 className="font-medium">Enter Amount</h4>
              <p className="text-xs text-muted-foreground">Specify points to convert</p>
            </div>
            <div className="bg-muted p-4 rounded-lg">
              <div className="bg-primary-100 text-primary rounded-full w-10 h-10 flex items-center justify-center mx-auto mb-2">3</div>
              <h4 className="font-medium">Confirm & Convert</h4>
              <p className="text-xs text-muted-foreground">Review and complete</p>
            </div>
          </div>
          
          <div className="flex items-center justify-center">
            <Button onClick={() => setCurrentStep(currentStep + 1)}>
              Start the Conversion Process
              <ArrowRightCircle className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </div>
      ),
    },
    {
      title: 'Select Loyalty Programs',
      subtitle: 'Choose which programs to convert between',
      content: (
        <div className="space-y-6 py-4">
          <div className="bg-muted p-4 rounded-lg mb-4">
            <h4 className="font-medium mb-2">Your Available Programs</h4>
            <div className="grid grid-cols-2 gap-2">
              {wallets.map((wallet: any) => (
                <div key={wallet.id} className="flex items-center p-2 border rounded-md bg-card">
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center mr-2">
                    {wallet.program.charAt(0)}
                  </div>
                  <div>
                    <div className="font-medium">{wallet.program}</div>
                    <div className="text-xs text-muted-foreground">{wallet.balance.toLocaleString()} points</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
          
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-1 block">Convert From</label>
              <Select 
                defaultValue={fromProgram} 
                onValueChange={(value) => setFromProgram(value as LoyaltyProgram)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select program" />
                </SelectTrigger>
                <SelectContent>
                  {wallets.map((wallet: any) => (
                    <SelectItem key={wallet.id} value={wallet.program}>
                      {wallet.program} ({wallet.balance.toLocaleString()} points)
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground mt-1">
                Balance: {getWalletBalance(fromProgram).toLocaleString()} points
              </p>
            </div>
            
            <div className="flex justify-center">
              <RefreshCw className="text-muted-foreground h-5 w-5" />
            </div>
            
            <div>
              <label className="text-sm font-medium mb-1 block">Convert To</label>
              <Select 
                defaultValue={toProgram} 
                onValueChange={(value) => setToProgram(value as LoyaltyProgram)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select program" />
                </SelectTrigger>
                <SelectContent>
                  {wallets.map((wallet: any) => (
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
            </div>
          </div>
          
          <div className="flex justify-between">
            <Button variant="outline" onClick={() => setCurrentStep(currentStep - 1)}>
              Back
            </Button>
            <Button onClick={() => setCurrentStep(currentStep + 1)}>
              Next Step
              <ChevronsRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </div>
      ),
    },
    {
      title: 'Enter Conversion Amount',
      subtitle: 'Specify how many points you want to convert',
      content: (
        <div className="space-y-6 py-4">
          <div className="bg-muted p-4 rounded-lg">
            <div className="flex justify-between items-center mb-2">
              <h4 className="font-medium">Current Exchange Rate</h4>
              <div className="text-xs bg-primary/10 text-primary px-2 py-1 rounded-full">
                Updated {new Date().toLocaleDateString()}
              </div>
            </div>
            
            <div className="flex items-center justify-center space-x-4 p-3 bg-card rounded-md">
              <div className="text-center">
                <div className="text-lg font-bold">1</div>
                <div className="text-xs text-muted-foreground">{fromProgram}</div>
              </div>
              <div>
                <ChevronsRight className="h-5 w-5 text-muted-foreground" />
              </div>
              <div className="text-center">
                <div className="text-lg font-bold">
                  {exchangeRate ? parseFloat(exchangeRate.rate).toFixed(2) : '...'}
                </div>
                <div className="text-xs text-muted-foreground">{toProgram}</div>
              </div>
            </div>
          </div>
          
          <div>
            <label className="text-sm font-medium mb-1 block">Amount to Convert</label>
            <div className="relative">
              <Input
                type="number"
                placeholder="Enter amount"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="pr-20"
              />
              <div className="absolute right-3 top-2 text-sm text-muted-foreground">
                {fromProgram}
              </div>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Max: {getWalletBalance(fromProgram).toLocaleString()} points
            </p>
          </div>
          
          <div className="bg-blue-50 p-4 rounded-lg border border-blue-100">
            <div className="flex">
              <Calculator className="h-5 w-5 text-blue-500 mr-3 flex-shrink-0" />
              <div>
                <p className="text-sm font-medium text-blue-800">Conversion Preview</p>
                <div className="mt-2 p-3 bg-white rounded-md">
                  <div className="flex justify-between items-center">
                    <div>
                      <span className="text-lg font-bold">{amount || 0}</span>
                      <span className="text-sm ml-1">{fromProgram}</span>
                    </div>
                    <div>
                      <ChevronsRight className="h-5 w-5 text-muted-foreground" />
                    </div>
                    <div>
                      <span className="text-lg font-bold">
                        {calculateConvertedAmount()}
                      </span>
                      <span className="text-sm ml-1">{toProgram}</span>
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center mt-3">
                  <DollarSign className="h-4 w-4 text-green-500 mr-1" />
                  <p className="text-xs text-green-700">
                    Estimated Value: ${(parseFloat(calculateConvertedAmount() || '0') * 0.015).toFixed(2)} USD
                  </p>
                </div>
              </div>
            </div>
          </div>
          
          <div className="flex justify-between">
            <Button variant="outline" onClick={() => setCurrentStep(currentStep - 1)}>
              Back
            </Button>
            <Button onClick={() => setCurrentStep(currentStep + 1)}>
              Review Conversion
              <ChevronsRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </div>
      ),
    },
    {
      title: 'Review & Confirm',
      subtitle: 'Check conversion details before proceeding',
      content: (
        <div className="space-y-6 py-4">
          <div className="border rounded-lg overflow-hidden">
            <div className="bg-muted p-4">
              <h4 className="font-medium">Conversion Summary</h4>
            </div>
            
            <div className="p-4 space-y-4">
              <div className="flex justify-between items-center">
                <div className="text-sm text-muted-foreground">From</div>
                <div className="font-medium">{fromProgram}</div>
              </div>
              
              <div className="flex justify-between items-center">
                <div className="text-sm text-muted-foreground">To</div>
                <div className="font-medium">{toProgram}</div>
              </div>
              
              <div className="flex justify-between items-center">
                <div className="text-sm text-muted-foreground">Amount</div>
                <div className="font-medium">{amount} points</div>
              </div>
              
              <div className="flex justify-between items-center">
                <div className="text-sm text-muted-foreground">You'll Receive</div>
                <div className="font-medium">{calculateConvertedAmount()} points</div>
              </div>
              
              <div className="flex justify-between items-center">
                <div className="text-sm text-muted-foreground">Exchange Rate</div>
                <div className="font-medium">
                  1:{exchangeRate ? parseFloat(exchangeRate.rate).toFixed(2) : '...'}
                </div>
              </div>
              
              <Separator />
              
              <div className="flex justify-between items-center">
                <div className="text-sm text-muted-foreground">Fee</div>
                <div className="font-medium text-green-600">Free</div>
              </div>
            </div>
          </div>
          
          <div className="bg-amber-50 p-4 rounded-lg border border-amber-100">
            <div className="flex">
              <HelpCircle className="h-5 w-5 text-amber-500 mr-3 flex-shrink-0" />
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
          
          <div className="flex justify-between">
            <Button variant="outline" onClick={() => setCurrentStep(currentStep - 1)}>
              Back
            </Button>
            <Button 
              onClick={handleConvert}
              disabled={convertMutation.isPending}
            >
              {convertMutation.isPending ? (
                <>Processing...</>
              ) : (
                <>
                  Confirm Conversion
                  <Save className="ml-2 h-4 w-4" />
                </>
              )}
            </Button>
          </div>
        </div>
      ),
    },
    {
      title: 'Conversion Complete',
      subtitle: 'Your points have been successfully converted',
      content: (
        <div className="space-y-6 py-8 text-center">
          <div className="mx-auto w-16 h-16 rounded-full bg-green-100 flex items-center justify-center">
            <Sparkles className="h-8 w-8 text-green-600" />
          </div>
          
          <div>
            <h3 className="text-xl font-bold mb-1">Conversion Successful!</h3>
            <p className="text-muted-foreground">
              You've successfully converted {amount} {fromProgram} points to {calculateConvertedAmount()} {toProgram} points.
            </p>
          </div>
          
          <div className="bg-muted p-4 rounded-lg">
            <div className="flex justify-between items-center mb-3">
              <div className="text-sm">From</div>
              <div className="font-medium">{fromProgram}</div>
            </div>
            <div className="flex justify-between items-center">
              <div className="text-sm">To</div>
              <div className="font-medium">{toProgram}</div>
            </div>
          </div>
          
          <div className="pt-4">
            <Button onClick={resetWizard} className="mr-2">
              Done
            </Button>
            <Button variant="outline" onClick={() => setCurrentStep(0)}>
              Convert More Points
            </Button>
          </div>
        </div>
      ),
    },
  ];

  return (
    <Card className="overflow-hidden">
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <Button variant="outline" className="w-full p-8 h-auto flex flex-col items-center justify-center gap-4 border-dashed">
            <div className="rounded-full bg-primary/10 p-4">
              <RefreshCw className="h-6 w-6 text-primary" />
            </div>
            <div className="space-y-1 text-center">
              <h3 className="font-medium">New to Point Conversion?</h3>
              <p className="text-sm text-muted-foreground">
                Use our step-by-step guide to convert your first points
              </p>
            </div>
          </Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>{steps[currentStep].title}</DialogTitle>
            <DialogDescription>{steps[currentStep].subtitle}</DialogDescription>
          </DialogHeader>
          
          <div className="mb-4">
            <Progress value={(currentStep / (steps.length - 1)) * 100} className="h-2" />
            <div className="flex justify-between mt-1 text-xs text-muted-foreground">
              <div>Start</div>
              <div>Complete</div>
            </div>
          </div>
          
          {steps[currentStep].content}
        </DialogContent>
      </Dialog>
    </Card>
  );
};

export default ConversionWizard;