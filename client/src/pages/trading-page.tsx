import React, { useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { z } from "zod";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Banner } from "@/components/ui/banner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Plus,
  ArrowRight,
  CheckCircle,
  Clock,
  Zap,
  PackageOpen,
  History,
  Loader2,
  X,
  Check,
} from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Badge } from "@/components/ui/badge";
import { Wallet } from "@shared/schema";


// Define schemas for form validation
const createTradeSchema = z.object({
  fromProgram: z.enum(["QANTAS", "GYG", "XPOINTS"]),
  toProgram: z.enum(["QANTAS", "GYG", "XPOINTS"]),
  amountOffered: z.number().min(100, "Minimum amount is 100 points").optional(),
  amountRequested: z.number().min(100, "Minimum amount is 100 points").optional(),
  description: z.string().max(250, "Maximum 250 characters").optional(),
  expiresAt: z.date().min(new Date(), "Expiry must be in the future").optional(),
});

type CreateTradeValues = z.infer<typeof createTradeSchema>;

// Type for trade offers
interface TradeOffer {
  id: number;
  createdBy: number;
  fromProgram: string;
  toProgram: string;
  amountOffered: number;
  amountRequested: number;
  description: string | null;
  status: string;
  createdAt: Date;
  expiresAt: Date;
}

// Type for trade history
interface TradeTransaction {
  id: number;
  userId: number;
  tradedWithUserId: number;
  tradeOfferId: number;
  fromProgram: string;
  toProgram: string;
  amountSent: number;
  amountReceived: number;
  completedAt: Date | null;
}

export default function TradingPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [createTradeOpen, setCreateTradeOpen] = useState(false);
  const [viewOfferDetails, setViewOfferDetails] = useState<TradeOffer | null>(null);

  // Form for creating a new trade
  const form = useForm<z.infer<typeof createTradeSchema>>({
    resolver: zodResolver(createTradeSchema),
    defaultValues: {
      fromProgram: "XPOINTS",
      toProgram: "QANTAS",
      amountOffered: 1000,
      amountRequested: 1500,
      description: "",
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
    },
  });

  // Fetch trade offers, excluding user's own offers
  const tradeOfferData = useQuery<TradeOffer[]>({
    queryKey: ["/api/trades"],
    enabled: !!user,
  });

  // Fetch user's trade offers
  const myOffersData = useQuery<TradeOffer[]>({
    queryKey: ["/api/trades/my-offers"],
    enabled: !!user,
  });

  // Fetch trade history
  const tradeHistoryData = useQuery<TradeTransaction[]>({
    queryKey: ["/api/trades/history"],
    enabled: !!user,
  });

  // Fetch user wallets
  const walletsData = useQuery<Wallet[]>({
    queryKey: ["/api/wallets"],
    enabled: !!user,
  });

  // Mutation for creating a trade offer
  const createTradeMutation = useMutation({
    mutationFn: async (data: CreateTradeValues) => {
      const response = await apiRequest("POST", "/api/trades/create", data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/trades"] });
      queryClient.invalidateQueries({ queryKey: ["/api/trades/my-offers"] });
      setCreateTradeOpen(false);
      toast({
        title: "Trade Offer Created",
        description: "Your trade offer has been posted to the marketplace.",
        variant: "default",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to Create Offer",
        description: error.message || "There was an error creating your trade offer.",
        variant: "destructive",
      });
    },
  });

  // Mutation for accepting a trade
  const acceptTradeMutation = useMutation({
    mutationFn: async (offerId: number) => {
      const response = await apiRequest("POST", "/api/trades/accept", { offerId });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/trades"] });
      queryClient.invalidateQueries({ queryKey: ["/api/trades/history"] });
      queryClient.invalidateQueries({ queryKey: ["/api/wallets"] });
      setViewOfferDetails(null);
      toast({
        title: "Trade Completed",
        description: "The trade has been successfully completed.",
        variant: "default",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Trade Failed",
        description: error.message || "There was an error completing the trade.",
        variant: "destructive",
      });
    },
  });

  // Mutation for cancelling a trade offer
  const cancelTradeMutation = useMutation({
    mutationFn: async (offerId: number) => {
      const response = await apiRequest("POST", "/api/trades/cancel", { offerId });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/trades/my-offers"] });
      toast({
        title: "Trade Offer Cancelled",
        description: "Your trade offer has been removed from the marketplace.",
        variant: "default",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to Cancel",
        description: error.message || "There was an error cancelling your trade offer.",
        variant: "destructive",
      });
    },
  });

  // Helper function to format dates
  const formatDate = (date: Date) => {
    if (!date) return "N/A";
    return new Date(date).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  // Helper function to calculate exchange rate
  const calculateRate = (offer: TradeOffer) => {
    const rate = (offer.amountRequested / offer.amountOffered).toFixed(2);
    return `1:${rate}`;
  };

  // Get badge color by program
  const getBadgeColor = (program: string) => {
    switch (program) {
      case "QANTAS": return "text-blue-600 bg-blue-100";
      case "GYG": return "text-yellow-600 bg-yellow-100";
      case "XPOINTS": return "text-violet-600 bg-violet-100";
      case "VELOCITY": return "text-red-600 bg-red-100";
      case "AMEX": return "text-green-600 bg-green-100";
      default: return "text-gray-500 bg-gray-100";
    }
  };

  // Get the balance of a specific wallet
  const getWalletBalance = (program: string): number => {
    if (!walletsData.data) return 0;
    const wallet = walletsData.data.find(w => w.program === program);
    return wallet ? wallet.balance : 0;
  };

  return (
    <div className="container mx-auto py-6">
      <Banner
        title="P2P Trading Marketplace"
        subtitle="Exchange your loyalty points directly with other users at your preferred rates"
        gradientColors={['from-purple-700', 'to-indigo-500']}
        pattern="dots"
        height="md"
        align="center"
        actionButton={
          <Button 
            onClick={() => setCreateTradeOpen(true)}
            className="bg-white/90 text-purple-700 hover:bg-white flex items-center"
          >
            <Plus className="mr-2 h-4 w-4" />
            Create Trade Offer
          </Button>
        }
      >
        <div className="mt-4 flex flex-wrap gap-2 justify-center">
          <div className="bg-purple-600/30 backdrop-blur-sm px-3 py-1 rounded-full text-sm text-white">
            Set custom rates
          </div>
          <div className="bg-purple-600/30 backdrop-blur-sm px-3 py-1 rounded-full text-sm text-white">
            No platform fees
          </div>
          <div className="bg-purple-600/30 backdrop-blur-sm px-3 py-1 rounded-full text-sm text-white">
            Secure transaction
          </div>
        </div>
      </Banner>
      

      <Tabs defaultValue="marketplace" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="marketplace">Marketplace</TabsTrigger>
          <TabsTrigger value="my-offers">My Offers</TabsTrigger>
          <TabsTrigger value="history">Trade History</TabsTrigger>
        </TabsList>
        
        <TabsContent value="marketplace" className="py-4">
          <div className="bg-muted/50 p-4 rounded-lg mb-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex gap-2">
                <Input 
                  placeholder="Search offers..." 
                  className="w-full md:w-[300px]" 
                />
                <Select defaultValue="all">
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Filter by program" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Programs</SelectItem>
                    <SelectItem value="qantas">Qantas</SelectItem>
                    <SelectItem value="gyg">GYG</SelectItem>
                    <SelectItem value="velocity">Velocity</SelectItem>
                    <SelectItem value="amex">Amex</SelectItem>
                    <SelectItem value="flybuys">Flybuys</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex gap-2">
                <Badge variant="outline" className="flex items-center">
                  <CheckCircle className="h-3 w-3 mr-1 text-green-500" />
                  Best Rate
                </Badge>
                <Badge variant="outline" className="flex items-center">
                  <Clock className="h-3 w-3 mr-1 text-amber-500" />
                  Ending Soon
                </Badge>
                <Badge variant="outline" className="flex items-center">
                  <Zap className="h-3 w-3 mr-1 text-blue-500" />
                  New
                </Badge>
              </div>
            </div>
          </div>

          {tradeOfferData.isLoading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : tradeOfferData.data?.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-md shadow-sm">
              <PackageOpen className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
              <h3 className="text-lg font-medium mb-2">No Trade Offers Available</h3>
              <p className="text-muted-foreground max-w-md mx-auto mb-6">
                There are currently no trade offers available. Be the first to create an offer!
              </p>
              <Button onClick={() => setCreateTradeOpen(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Create Trade Offer
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {tradeOfferData.data?.map((offer) => (
                <Card key={offer.id} className="overflow-hidden">
                  <CardHeader className="pb-2">
                    <div className="flex justify-between items-start">
                      <div className="flex items-center">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center mr-3 ${getBadgeColor(offer.fromProgram)}`}>
                          {offer.fromProgram.charAt(0)}
                        </div>
                        <div>
                          <p className="font-medium">{offer.fromProgram}</p>
                          <p className="text-sm text-muted-foreground">Offering</p>
                        </div>
                      </div>
                      <ArrowRight className="h-5 w-5 text-muted-foreground" />
                      <div className="flex items-center">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center mr-3 ${getBadgeColor(offer.toProgram)}`}>
                          {offer.toProgram.charAt(0)}
                        </div>
                        <div>
                          <p className="font-medium">{offer.toProgram}</p>
                          <p className="text-sm text-muted-foreground">Requesting</p>
                        </div>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="pb-3">
                    <div className="flex justify-between text-center p-3 bg-muted/50 rounded-lg mb-3">
                      <div>
                        <p className="text-xl font-bold">{offer.amountOffered.toLocaleString()}</p>
                        <p className="text-xs text-muted-foreground">Points offered</p>
                      </div>
                      <div>
                        <p className="text-xl font-bold">{calculateRate(offer)}</p>
                        <p className="text-xs text-muted-foreground">Rate</p>
                      </div>
                      <div>
                        <p className="text-xl font-bold">{offer.amountRequested.toLocaleString()}</p>
                        <p className="text-xs text-muted-foreground">Points requested</p>
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Seller</span>
                        <span className="font-medium">{offer.createdBy === user?.id ? 'You' : `User #${offer.createdBy}`}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Expires</span>
                        <span>{formatDate(offer.expiresAt)}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Posted</span>
                        <span>{formatDate(offer.createdAt)}</span>
                      </div>
                    </div>
                  </CardContent>
                  <CardFooter>
                    <Button
                      variant="outline"
                      className="w-full"
                      onClick={() => setViewOfferDetails(offer)}
                    >
                      View Details
                    </Button>
                  </CardFooter>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
        
        <TabsContent value="my-offers" className="py-4">
          {myOffersData.isLoading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : myOffersData.data?.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-md shadow-sm">
              <PackageOpen className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
              <h3 className="text-lg font-medium mb-2">No Active Offers</h3>
              <p className="text-muted-foreground max-w-md mx-auto mb-6">
                You don't have any active trade offers. Create one to start trading!
              </p>
              <Button onClick={() => setCreateTradeOpen(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Create Trade Offer
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {myOffersData.data?.map((offer) => (
                <Card key={offer.id} className="overflow-hidden">
                  <CardHeader className="pb-2">
                    <div className="flex justify-between items-start">
                      <div className="flex items-center">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center mr-3 ${getBadgeColor(offer.fromProgram)}`}>
                          {offer.fromProgram.charAt(0)}
                        </div>
                        <div>
                          <p className="font-medium">{offer.fromProgram}</p>
                          <p className="text-sm text-muted-foreground">Offering</p>
                        </div>
                      </div>
                      <ArrowRight className="h-5 w-5 text-muted-foreground" />
                      <div className="flex items-center">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center mr-3 ${getBadgeColor(offer.toProgram)}`}>
                          {offer.toProgram.charAt(0)}
                        </div>
                        <div>
                          <p className="font-medium">{offer.toProgram}</p>
                          <p className="text-sm text-muted-foreground">Requesting</p>
                        </div>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="pb-3">
                    <div className="flex justify-between text-center p-3 bg-muted/50 rounded-lg mb-3">
                      <div>
                        <p className="text-xl font-bold">{offer.amountOffered.toLocaleString()}</p>
                        <p className="text-xs text-muted-foreground">Points offered</p>
                      </div>
                      <div>
                        <p className="text-xl font-bold">{calculateRate(offer)}</p>
                        <p className="text-xs text-muted-foreground">Rate</p>
                      </div>
                      <div>
                        <p className="text-xl font-bold">{offer.amountRequested.toLocaleString()}</p>
                        <p className="text-xs text-muted-foreground">Points requested</p>
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Status</span>
                        <Badge variant={offer.status === 'ACTIVE' ? 'default' : 'secondary'}>
                          {offer.status}
                        </Badge>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Expires</span>
                        <span>{formatDate(offer.expiresAt)}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Posted</span>
                        <span>{formatDate(offer.createdAt)}</span>
                      </div>
                    </div>
                  </CardContent>
                  <CardFooter>
                    <Button
                      variant="destructive"
                      className="w-full"
                      onClick={() => cancelTradeMutation.mutate(offer.id)}
                      disabled={cancelTradeMutation.isPending || offer.status !== 'ACTIVE'}
                    >
                      {cancelTradeMutation.isPending ? (
                        <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Cancelling...</>
                      ) : (
                        <><X className="h-4 w-4 mr-2" /> Cancel Offer</>
                      )}
                    </Button>
                  </CardFooter>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
        
        <TabsContent value="history" className="py-4">
          {tradeHistoryData.isLoading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : tradeHistoryData.data?.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-md shadow-sm">
              <History className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
              <h3 className="text-lg font-medium mb-2">No Trade History</h3>
              <p className="text-muted-foreground max-w-md mx-auto">
                You haven't completed any trades yet. Browse the marketplace to find trades!
              </p>
            </div>
          ) : (
            <div className="bg-white rounded-md shadow overflow-hidden">
              <table className="min-w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      Transaction
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      Amount
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      Rate
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      Partner
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {tradeHistoryData.data?.map((trade) => (
                    <tr key={trade.id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        {formatDate(trade.completedAt || new Date())}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <div className="flex items-center">
                          <div className={`w-7 h-7 rounded-full flex items-center justify-center mr-2 ${getBadgeColor(trade.fromProgram)}`}>
                            {trade.fromProgram.charAt(0)}
                          </div>
                          <ArrowRight className="h-4 w-4 mx-1" />
                          <div className={`w-7 h-7 rounded-full flex items-center justify-center ml-1 ${getBadgeColor(trade.toProgram)}`}>
                            {trade.toProgram.charAt(0)}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <div>
                          <div className="font-medium">{trade.amountSent.toLocaleString()} points</div>
                          <div className="text-xs text-muted-foreground">Sent</div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        1:{(trade.amountReceived / trade.amountSent).toFixed(2)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        User #{trade.tradedWithUserId}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                          Completed
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Create Trade Dialog */}
      <Dialog open={createTradeOpen} onOpenChange={setCreateTradeOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Create Trade Offer</DialogTitle>
            <DialogDescription>
              Set up your trade offer to exchange points with other users.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={form.handleSubmit((data) => createTradeMutation.mutate(data))}>
            <div className="grid gap-4 py-4">
              <div className="flex items-center">
                <div className="flex-1">
                  <h4 className="text-sm font-medium mb-1">You Offer</h4>
                  <Select
                    defaultValue={form.watch('fromProgram')}
                    onValueChange={(value) => form.setValue('fromProgram', value as any)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select program" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="QANTAS">Qantas</SelectItem>
                      <SelectItem value="GYG">GYG</SelectItem>
                      <SelectItem value="XPOINTS">xPoints</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <ArrowRight className="mx-4 text-gray-400" />
                <div className="flex-1">
                  <h4 className="text-sm font-medium mb-1">You Want</h4>
                  <Select
                    defaultValue={form.watch('toProgram')}
                    onValueChange={(value) => form.setValue('toProgram', value as any)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select program" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="QANTAS">Qantas</SelectItem>
                      <SelectItem value="GYG">GYG</SelectItem>
                      <SelectItem value="XPOINTS">xPoints</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="flex items-center">
                <div className="flex-1">
                  <h4 className="text-sm font-medium mb-1">Amount to Offer</h4>
                  <Input
                    type="number"
                    placeholder="Amount"
                    {...form.register('amountOffered', { valueAsNumber: true })}
                  />
                </div>
                <div className="mx-4 text-xs text-gray-500">
                  {form.watch('amountRequested') && form.watch('amountOffered') ?
                    `Rate: 1:${(form.watch('amountRequested') / form.watch('amountOffered')).toFixed(2)}` :
                    'Set both amounts'
                  }
                </div>
                <div className="flex-1">
                  <h4 className="text-sm font-medium mb-1">Amount to Receive</h4>
                  <Input
                    type="number"
                    placeholder="Amount"
                    {...form.register('amountRequested', { valueAsNumber: true })}
                  />
                </div>
              </div>

              <div>
                <h4 className="text-sm font-medium mb-1">Your Balance</h4>
                <div className="bg-muted p-3 rounded-md">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center mr-2 ${getBadgeColor(form.watch('fromProgram'))}`}>
                        {form.watch('fromProgram')?.charAt(0)}
                      </div>
                      <span className="font-medium">{form.watch('fromProgram')}</span>
                    </div>
                    <div>
                      <span className="font-bold">{getWalletBalance(form.watch('fromProgram')).toLocaleString()}</span> points
                    </div>
                  </div>
                </div>
                {getWalletBalance(form.watch('fromProgram')) < form.watch('amountOffered') && (
                  <p className="text-sm text-red-500 mt-2">
                    You don't have enough points to create this offer.
                  </p>
                )}
              </div>

              <div>
                <h4 className="text-sm font-medium mb-1">Description (Optional)</h4>
                <textarea
                  className="w-full rounded-md border border-border p-2 text-sm"
                  placeholder="Add any details about your trade offer"
                  {...form.register('description')}
                  rows={3}
                />
              </div>

              <div>
                <h4 className="text-sm font-medium mb-1">Expires In</h4>
                <Select
                  defaultValue="7days"
                  onValueChange={(value) => {
                    const now = new Date();
                    let expiryDate = new Date();
                    
                    if (value === '1day') expiryDate.setDate(now.getDate() + 1);
                    if (value === '3days') expiryDate.setDate(now.getDate() + 3);
                    if (value === '7days') expiryDate.setDate(now.getDate() + 7);
                    if (value === '14days') expiryDate.setDate(now.getDate() + 14);
                    if (value === '30days') expiryDate.setDate(now.getDate() + 30);
                    
                    form.setValue('expiresAt', expiryDate);
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select expiry" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1day">24 hours</SelectItem>
                    <SelectItem value="3days">3 days</SelectItem>
                    <SelectItem value="7days">7 days</SelectItem>
                    <SelectItem value="14days">14 days</SelectItem>
                    <SelectItem value="30days">30 days</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setCreateTradeOpen(false)}>
                Cancel
              </Button>
              <Button 
                type="submit" 
                disabled={
                  createTradeMutation.isPending || 
                  getWalletBalance(form.watch('fromProgram')) < form.watch('amountOffered') ||
                  form.watch('fromProgram') === form.watch('toProgram')
                }
              >
                {createTradeMutation.isPending ? (
                  <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Creating...</>
                ) : (
                  'Create Offer'
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* View Offer Details Dialog */}
      {viewOfferDetails && (
        <Dialog open={!!viewOfferDetails} onOpenChange={() => setViewOfferDetails(null)}>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Trade Offer Details</DialogTitle>
              <DialogDescription>
                Review the details of this trade offer before accepting.
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4">
              <div className="bg-muted p-4 rounded-lg">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex items-center">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center mr-3 ${getBadgeColor(viewOfferDetails.fromProgram)}`}>
                      {viewOfferDetails.fromProgram.charAt(0)}
                    </div>
                    <div>
                      <p className="font-medium">{viewOfferDetails.fromProgram}</p>
                      <p className="text-sm text-muted-foreground">
                        {viewOfferDetails.amountOffered.toLocaleString()} points
                      </p>
                    </div>
                  </div>
                  <div className="bg-background rounded-full p-2 shadow-sm">
                    <ArrowRight className="h-5 w-5 text-primary" />
                  </div>
                  <div className="flex items-center">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center mr-3 ${getBadgeColor(viewOfferDetails.toProgram)}`}>
                      {viewOfferDetails.toProgram.charAt(0)}
                    </div>
                    <div>
                      <p className="font-medium">{viewOfferDetails.toProgram}</p>
                      <p className="text-sm text-muted-foreground">
                        {viewOfferDetails.amountRequested.toLocaleString()} points
                      </p>
                    </div>
                  </div>
                </div>
                
                <div className="bg-background rounded-md p-3 mb-3">
                  <div className="flex justify-between text-center">
                    <div>
                      <p className="text-xl font-bold">{viewOfferDetails.amountOffered.toLocaleString()}</p>
                      <p className="text-xs text-muted-foreground">Points offered</p>
                    </div>
                    <Separator orientation="vertical" className="mx-2" />
                    <div>
                      <p className="text-xl font-bold">1:{(viewOfferDetails.amountRequested / viewOfferDetails.amountOffered).toFixed(2)}</p>
                      <p className="text-xs text-muted-foreground">Exchange rate</p>
                    </div>
                    <Separator orientation="vertical" className="mx-2" />
                    <div>
                      <p className="text-xl font-bold">{viewOfferDetails.amountRequested.toLocaleString()}</p>
                      <p className="text-xs text-muted-foreground">Points requested</p>
                    </div>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Seller</span>
                    <span className="font-medium">{viewOfferDetails.createdBy === user?.id ? 'You' : `User #${viewOfferDetails.createdBy}`}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Status</span>
                    <Badge variant={viewOfferDetails.status === 'ACTIVE' ? 'default' : 'secondary'}>
                      {viewOfferDetails.status}
                    </Badge>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Created</span>
                    <span>{formatDate(viewOfferDetails.createdAt)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Expires</span>
                    <span>{formatDate(viewOfferDetails.expiresAt)}</span>
                  </div>
                </div>
              </div>

              {viewOfferDetails.description && (
                <div>
                  <h4 className="text-sm font-medium mb-1">Seller's Note:</h4>
                  <p className="text-sm italic bg-muted p-3 rounded-md">
                    "{viewOfferDetails.description}"
                  </p>
                </div>
              )}
              
              <div>
                <h4 className="text-sm font-medium mb-1">Your Points Balance:</h4>
                <div className="bg-muted p-3 rounded-md">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center mr-2 ${getBadgeColor(viewOfferDetails.toProgram)}`}>
                        {viewOfferDetails.toProgram.charAt(0)}
                      </div>
                      <span className="font-medium">{viewOfferDetails.toProgram}</span>
                    </div>
                    <div>
                      <span className="font-bold">{getWalletBalance(viewOfferDetails.toProgram).toLocaleString()}</span> points
                    </div>
                  </div>
                </div>
                
                {getWalletBalance(viewOfferDetails.toProgram) < viewOfferDetails.amountRequested && (
                  <p className="text-sm text-red-500 mt-2">
                    You don't have enough points to complete this trade.
                  </p>
                )}
              </div>
            </div>
            <DialogFooter className="flex justify-between">
              <Button variant="outline" onClick={() => setViewOfferDetails(null)}>
                <X className="h-4 w-4 mr-2" />
                Cancel
              </Button>
              <Button 
                onClick={() => acceptTradeMutation.mutate(viewOfferDetails.id)}
                disabled={
                  acceptTradeMutation.isPending || 
                  getWalletBalance(viewOfferDetails.toProgram) < viewOfferDetails.amountRequested
                }
              >
                {acceptTradeMutation.isPending ? (
                  <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Processing...</>
                ) : (
                  <><Check className="h-4 w-4 mr-2" /> Accept Trade</>
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}