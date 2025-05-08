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
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Badge } from "@/components/ui/badge";
import { Wallet } from "@shared/schema";
import { Loader2, Clock, RefreshCw, TrendingDown, Check, X } from "lucide-react";
import MainLayout from "@/components/layout/MainLayout";

// Define schemas for form validation
const createTradeSchema = z.object({
  fromProgram: z.enum(["QANTAS", "GYG", "XPOINTS"]),
  toProgram: z.enum(["QANTAS", "GYG", "XPOINTS"]),
  amountOffered: z.coerce.number().positive(),
  amountRequested: z.coerce.number().positive(),
  expiresIn: z.coerce.number().int().min(1).max(30).default(7),
  description: z.string().max(500).optional(),
}).refine(data => data.fromProgram !== data.toProgram, {
  message: "Cannot trade between the same program",
  path: ["toProgram"],
});

// Interface for trade offers
interface TradeOffer {
  id: number;
  createdBy: number;
  fromProgram: "QANTAS" | "GYG" | "XPOINTS";
  toProgram: "QANTAS" | "GYG" | "XPOINTS";
  amountOffered: number;
  amountRequested: number;
  customRate: string;
  marketRate: string;
  savings: string;
  createdAt: string;
  expiresAt: string;
  status: string;
  description: string | null;
}

// Interface for trade transactions
interface TradeTransaction {
  id: number;
  tradeOfferId: number;
  sellerId: number;
  buyerId: number;
  completedAt: string;
  amountSold: number;
  amountBought: number;
  rate: string;
  sellerFee: string;
  buyerFee: string;
  status: string;
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
      fromProgram: "QANTAS",
      toProgram: "XPOINTS",
      amountOffered: 1000,
      amountRequested: 500,
      expiresIn: 7,
      description: "",
    },
  });

  // Query to get user wallets for balance display
  const { data: wallets = [] } = useQuery<Wallet[]>({
    queryKey: ["/api/wallets"],
  });

  // Query to get all available trade offers (excluding the user's own)
  const { data: tradeOffers = [], isLoading: isLoadingOffers } = useQuery<TradeOffer[]>({
    queryKey: ["/api/trades"],
    // Placeholder since we don't have real data yet
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/trades");
      return await res.json();
    },
  });

  // Query to get user's own trade offers
  const { data: myOffers = [], isLoading: isLoadingMyOffers } = useQuery<TradeOffer[]>({
    queryKey: ["/api/trades/my-offers"],
    // Placeholder since we don't have real data yet
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/trades/my-offers");
      return await res.json();
    },
  });

  // Query to get trade history (completed trades)
  const { data: tradeHistory = [], isLoading: isLoadingHistory } = useQuery<TradeTransaction[]>({
    queryKey: ["/api/trades/history"],
    // Placeholder since we don't have real data yet
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/trades/history");
      return await res.json();
    },
  });

  // Mutation for creating a new trade offer
  const createTradeMutation = useMutation({
    mutationFn: async (data: z.infer<typeof createTradeSchema>) => {
      const res = await apiRequest("POST", "/api/trades", data);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/trades"] });
      queryClient.invalidateQueries({ queryKey: ["/api/trades/my-offers"] });
      queryClient.invalidateQueries({ queryKey: ["/api/wallets"] });
      setCreateTradeOpen(false);
      form.reset();
      toast({
        title: "Trade offer created",
        description: "Your trade offer has been published successfully.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to create trade offer",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Mutation for accepting a trade offer
  const acceptTradeMutation = useMutation({
    mutationFn: async (tradeId: number) => {
      const res = await apiRequest("POST", `/api/trades/${tradeId}/accept`, { tradeOfferId: tradeId });
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/trades"] });
      queryClient.invalidateQueries({ queryKey: ["/api/trades/history"] });
      queryClient.invalidateQueries({ queryKey: ["/api/wallets"] });
      setViewOfferDetails(null);
      toast({
        title: "Trade completed",
        description: "You have successfully completed the trade.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to accept trade",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Mutation for cancelling a trade offer
  const cancelTradeMutation = useMutation({
    mutationFn: async (tradeId: number) => {
      const res = await apiRequest("POST", `/api/trades/${tradeId}/cancel`);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/trades/my-offers"] });
      queryClient.invalidateQueries({ queryKey: ["/api/wallets"] });
      toast({
        title: "Trade cancelled",
        description: "Your trade offer has been cancelled.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to cancel trade",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Form submission handler
  const onSubmit = (data: z.infer<typeof createTradeSchema>) => {
    createTradeMutation.mutate(data);
  };

  // Helper function to get wallet balance
  const getWalletBalance = (program: string) => {
    const wallet = wallets.find(w => w.program === program);
    return wallet ? wallet.balance : 0;
  };

  // Helper function to format date
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  // Helper function to format a badge color based on program
  const getProgramColor = (program: string) => {
    switch (program) {
      case "QANTAS": return "text-red-500 bg-red-100";
      case "GYG": return "text-green-500 bg-green-100";
      case "XPOINTS": return "text-blue-500 bg-blue-100";
      default: return "text-gray-500 bg-gray-100";
    }
  };

  return (
    <MainLayout>
      <div className="container mx-auto py-6">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold">P2P Trading</h1>
            <p className="text-muted-foreground">
              Trade loyalty points directly with other users at custom rates
            </p>
            <div className="mt-2 text-xs text-amber-600 flex items-center gap-1 font-medium">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
                <path fillRule="evenodd" d="M12 1.5a5.25 5.25 0 00-5.25 5.25v3a3 3 0 00-3 3v6.75a3 3 0 003 3h10.5a3 3 0 003-3v-6.75a3 3 0 00-3-3v-3c0-2.9-2.35-5.25-5.25-5.25zm3.75 8.25v-3a3.75 3.75 0 10-7.5 0v3h7.5z" clipRule="evenodd" />
              </svg>
              Dynamic Fee Structure: 10% of your savings rate, capped at 3% (minimum 0.5%)
            </div>
          </div>
          <Dialog open={createTradeOpen} onOpenChange={setCreateTradeOpen}>
            <DialogTrigger asChild>
              <Button>Create Trade Offer</Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
              <DialogHeader>
                <DialogTitle>Create a New Trade Offer</DialogTitle>
                <DialogDescription>
                  Set your own rate and trade points directly with other users.
                </DialogDescription>
              </DialogHeader>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="fromProgram"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>I'm Offering</FormLabel>
                          <Select
                            onValueChange={field.onChange}
                            defaultValue={field.value}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select program" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="QANTAS">Qantas Points</SelectItem>
                              <SelectItem value="GYG">GetYourGuide</SelectItem>
                              <SelectItem value="XPOINTS">xPoints</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormDescription>
                            Balance: {getWalletBalance(field.value)}
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="toProgram"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>I Want</FormLabel>
                          <Select
                            onValueChange={field.onChange}
                            defaultValue={field.value}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select program" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="QANTAS">Qantas Points</SelectItem>
                              <SelectItem value="GYG">GetYourGuide</SelectItem>
                              <SelectItem value="XPOINTS">xPoints</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="amountOffered"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Amount Offered</FormLabel>
                          <FormControl>
                            <Input type="number" placeholder="Amount" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="amountRequested"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Amount Requested</FormLabel>
                          <FormControl>
                            <Input type="number" placeholder="Amount" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  <FormField
                    control={form.control}
                    name="expiresIn"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Expires In (days)</FormLabel>
                        <FormControl>
                          <Input type="number" min={1} max={30} {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Description (optional)</FormLabel>
                        <FormControl>
                          <Textarea placeholder="Add any notes about this trade offer" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <DialogFooter>
                    <Button 
                      type="submit" 
                      disabled={createTradeMutation.isPending}
                    >
                      {createTradeMutation.isPending ? 
                        <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Creating...</> : 
                        'Create Offer'}
                    </Button>
                  </DialogFooter>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        </div>

        <Tabs defaultValue="market">
          <TabsList className="mb-6">
            <TabsTrigger value="market">Trade Market</TabsTrigger>
            <TabsTrigger value="my-offers">My Offers</TabsTrigger>
            <TabsTrigger value="history">Trade History</TabsTrigger>
          </TabsList>

          {/* Market tab - shows all available trade offers */}
          <TabsContent value="market">
            {isLoadingOffers ? (
              <div className="flex justify-center p-10">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : tradeOffers.length === 0 ? (
              <div className="text-center p-10 bg-muted rounded-md">
                <h3 className="text-lg font-medium">No trade offers available</h3>
                <p className="text-muted-foreground mt-2">
                  Be the first to create a trade offer and set your own rate!
                </p>
                <Button className="mt-4" onClick={() => setCreateTradeOpen(true)}>
                  Create Trade Offer
                </Button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {tradeOffers.map((offer) => (
                  <Card key={offer.id} className="hover:shadow-md transition-shadow">
                    <CardHeader className="pb-2">
                      <div className="flex justify-between items-start">
                        <div>
                          <CardTitle className="text-lg">
                            {offer.fromProgram} → {offer.toProgram}
                          </CardTitle>
                          <CardDescription>
                            Offer by User #{offer.createdBy}
                          </CardDescription>
                        </div>
                        <Badge variant="outline" className={`${getProgramColor(offer.fromProgram)}`}>
                          {offer.fromProgram}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="pb-2">
                      <div className="grid grid-cols-2 gap-2 mb-3">
                        <div>
                          <p className="text-sm text-muted-foreground">Offering</p>
                          <p className="text-lg font-semibold">{offer.amountOffered.toLocaleString()}</p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Requesting</p>
                          <p className="text-lg font-semibold">{offer.amountRequested.toLocaleString()}</p>
                        </div>
                      </div>
                      <div className="mb-3">
                        <div className="flex items-center justify-between mb-1">
                          <p className="text-sm text-muted-foreground">Custom Rate</p>
                          <p className="font-medium">{parseFloat(offer.customRate).toFixed(4)}</p>
                        </div>
                        <div className="flex items-center justify-between mb-1">
                          <p className="text-sm text-muted-foreground">Market Rate</p>
                          <p className="font-medium">{parseFloat(offer.marketRate).toFixed(4)}</p>
                        </div>
                        <div className="flex items-center justify-between">
                          <p className="text-sm text-muted-foreground">Savings</p>
                          <Badge className="bg-green-100 text-green-700 hover:bg-green-200">
                            <TrendingDown className="h-3 w-3 mr-1" />
                            {parseFloat(offer.savings).toFixed(2)}%
                          </Badge>
                        </div>
                      </div>
                      {offer.description && (
                        <p className="text-sm italic border-t pt-2 mt-2">
                          "{offer.description}"
                        </p>
                      )}
                    </CardContent>
                    <CardFooter className="pt-2 flex justify-between">
                      <div className="flex items-center text-sm text-muted-foreground">
                        <Clock className="h-3 w-3 mr-1" />
                        Expires {formatDate(offer.expiresAt)}
                      </div>
                      <Button
                        size="sm"
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

          {/* My Offers tab - shows user's own trade offers */}
          <TabsContent value="my-offers">
            {isLoadingMyOffers ? (
              <div className="flex justify-center p-10">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : myOffers.length === 0 ? (
              <div className="text-center p-10 bg-muted rounded-md">
                <h3 className="text-lg font-medium">You haven't created any offers yet</h3>
                <p className="text-muted-foreground mt-2">
                  Create your first trade offer and set your own custom rate!
                </p>
                <Button className="mt-4" onClick={() => setCreateTradeOpen(true)}>
                  Create Trade Offer
                </Button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {myOffers.map((offer) => (
                  <Card key={offer.id} className="hover:shadow-md transition-shadow">
                    <CardHeader className="pb-2">
                      <div className="flex justify-between items-start">
                        <CardTitle className="text-lg">
                          {offer.fromProgram} → {offer.toProgram}
                        </CardTitle>
                        <Badge 
                          variant={offer.status === "open" ? "default" : "outline"}
                          className={
                            offer.status === "open" 
                              ? "bg-green-100 text-green-700 hover:bg-green-200" 
                              : "text-yellow-700 bg-yellow-100"
                          }
                        >
                          {offer.status.toUpperCase()}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="pb-2">
                      <div className="grid grid-cols-2 gap-2 mb-3">
                        <div>
                          <p className="text-sm text-muted-foreground">Offering</p>
                          <p className="text-lg font-semibold">{offer.amountOffered.toLocaleString()}</p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Requesting</p>
                          <p className="text-lg font-semibold">{offer.amountRequested.toLocaleString()}</p>
                        </div>
                      </div>
                      <div className="mb-3">
                        <div className="flex items-center justify-between mb-1">
                          <p className="text-sm text-muted-foreground">Custom Rate</p>
                          <p className="font-medium">{parseFloat(offer.customRate).toFixed(4)}</p>
                        </div>
                        <div className="flex items-center justify-between mb-1">
                          <p className="text-sm text-muted-foreground">Market Rate</p>
                          <p className="font-medium">{parseFloat(offer.marketRate).toFixed(4)}</p>
                        </div>
                      </div>
                    </CardContent>
                    <CardFooter className="pt-2 flex justify-between">
                      <div className="flex items-center text-sm text-muted-foreground">
                        <Clock className="h-3 w-3 mr-1" />
                        Expires {formatDate(offer.expiresAt)}
                      </div>
                      {offer.status === "open" && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => cancelTradeMutation.mutate(offer.id)}
                          disabled={cancelTradeMutation.isPending}
                        >
                          {cancelTradeMutation.isPending ? 
                            <Loader2 className="h-3 w-3 animate-spin" /> : 
                            'Cancel'}
                        </Button>
                      )}
                    </CardFooter>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          {/* History tab - shows completed trades */}
          <TabsContent value="history">
            {isLoadingHistory ? (
              <div className="flex justify-center p-10">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : tradeHistory.length === 0 ? (
              <div className="text-center p-10 bg-muted rounded-md">
                <h3 className="text-lg font-medium">No trade history yet</h3>
                <p className="text-muted-foreground mt-2">
                  Your completed trades will appear here.
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
                        Fees
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                        Status
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {tradeHistory.map((trade) => (
                      <tr key={trade.id}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          {formatDate(trade.completedAt)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          {trade.sellerId === user?.id ? 
                            <span>Sold to User #{trade.buyerId}</span> : 
                            <span>Bought from User #{trade.sellerId}</span>}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          {trade.sellerId === user?.id ? 
                            <span>{trade.amountSold.toLocaleString()} → {trade.amountBought.toLocaleString()}</span> : 
                            <span>{trade.amountBought.toLocaleString()} ← {trade.amountSold.toLocaleString()}</span>}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          {parseFloat(trade.rate).toFixed(4)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          {trade.sellerId === user?.id ? (
                            <span className="text-amber-600">
                              {Number(trade.sellerFee) > 0 ? 
                                `${Number(trade.sellerFee).toFixed(2)} points` : 
                                "No fee"}
                            </span>
                          ) : (
                            <span className="text-amber-600">
                              {Number(trade.buyerFee) > 0 ? 
                                `${Number(trade.buyerFee).toFixed(2)} points` : 
                                "No fee"}
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          <Badge 
                            variant="outline"
                            className={
                              trade.status === "completed" 
                                ? "bg-green-100 text-green-700" 
                                : "bg-yellow-100 text-yellow-700"
                            }
                          >
                            {trade.status === "completed" ? 
                              <Check className="h-3 w-3 mr-1" /> : 
                              <Clock className="h-3 w-3 mr-1" />}
                            {trade.status.toUpperCase()}
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
      </div>

      {/* View Offer Details Dialog */}
      {viewOfferDetails && (
        <Dialog open={!!viewOfferDetails} onOpenChange={() => setViewOfferDetails(null)}>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Trade Offer Details</DialogTitle>
              <DialogDescription>
                Review this trade offer from User #{viewOfferDetails.createdBy}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="text-lg font-semibold">
                    {viewOfferDetails.fromProgram} → {viewOfferDetails.toProgram}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    Created {formatDate(viewOfferDetails.createdAt)}
                  </p>
                </div>
                <Badge 
                  variant="outline" 
                  className={`${getProgramColor(viewOfferDetails.fromProgram)}`}
                >
                  {viewOfferDetails.fromProgram}
                </Badge>
              </div>

              <div className="grid grid-cols-2 gap-4 bg-muted p-4 rounded-md">
                <div>
                  <p className="text-sm text-muted-foreground">Offering</p>
                  <p className="text-2xl font-bold">{viewOfferDetails.amountOffered.toLocaleString()}</p>
                  <p className="text-sm">{viewOfferDetails.fromProgram} points</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Requesting</p>
                  <p className="text-2xl font-bold">{viewOfferDetails.amountRequested.toLocaleString()}</p>
                  <p className="text-sm">{viewOfferDetails.toProgram} points</p>
                </div>
              </div>

              <div className="space-y-2 border-t border-b py-3">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Custom Rate</span>
                  <span className="font-medium">{parseFloat(viewOfferDetails.customRate).toFixed(4)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Market Rate</span>
                  <span className="font-medium">{parseFloat(viewOfferDetails.marketRate).toFixed(4)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Your Savings</span>
                  <Badge className="bg-green-100 text-green-700 hover:bg-green-200">
                    <TrendingDown className="h-3 w-3 mr-1" />
                    {parseFloat(viewOfferDetails.savings).toFixed(2)}%
                  </Badge>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Platform Fee</span>
                  <span className="text-amber-600">
                    {/* Calculate estimated fee (10% of savings, max 3%) */}
                    {Math.min(
                      Math.max(parseFloat(viewOfferDetails.savings) * 0.1, 0.5), 
                      3
                    ).toFixed(2)}% of trade
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Expires</span>
                  <span>{formatDate(viewOfferDetails.expiresAt)}</span>
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

              <div className="bg-yellow-50 p-3 rounded-md">
                <h4 className="text-sm font-medium flex items-center text-yellow-800">
                  <RefreshCw className="h-4 w-4 mr-1" />
                  Your Available Balance
                </h4>
                <p className="text-sm mt-1">
                  You have <span className="font-semibold">{getWalletBalance(viewOfferDetails.toProgram).toLocaleString()}</span> {viewOfferDetails.toProgram} points available.
                </p>
                {getWalletBalance(viewOfferDetails.toProgram) < viewOfferDetails.amountRequested && (
                  <p className="text-xs text-red-600 mt-1">
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
    </MainLayout>
  );
}