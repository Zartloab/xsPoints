import React, { useState } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { useMutation, useQuery } from '@tanstack/react-query';
import MainLayout from '@/components/layout/MainLayout';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import {
  ShoppingBag,
  Store,
  BarChart3,
  Users,
  User,
  Code,
  Settings,
  Zap,
  CreditCard,
  Tag,
  Coins,
  ChevronRight,
  Search,
  Upload,
  Download,
  RefreshCw,
  CheckCircle,
  AlertCircle,
  Loader2
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { Textarea } from '@/components/ui/textarea';
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger 
} from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';

// Form schema for merchant promotion
const promotionFormSchema = z.object({
  name: z.string().min(3, "Name must be at least 3 characters"),
  description: z.string().min(10, "Description must be at least 10 characters"),
  program: z.enum(["QANTAS", "GYG", "XPOINTS"]),
  multiplier: z.coerce.number().min(1.1).max(5),
  startDate: z.string(),
  endDate: z.string(),
  isActive: z.boolean().default(false),
});

// Form schema for single customer point issuance
const singleUserPointsSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  points: z.coerce.number().positive("Points must be a positive number"),
  reason: z.string().min(3, "Please provide a reason for the points issuance"),
  expirationDate: z.string().optional(),
  reference: z.string().optional(),
});

// Form schema for bulk point issuance
const bulkPointsSchema = z.object({
  userList: z.string().min(5, "Please enter at least one email address"),
  pointsPerUser: z.coerce.number().positive("Points must be a positive number"),
  reason: z.string().min(3, "Please provide a reason for the points issuance"),
  expirationDate: z.string().optional(),
  reference: z.string().optional(),
});

type PromotionFormValues = z.infer<typeof promotionFormSchema>;
type SingleUserPointsValues = z.infer<typeof singleUserPointsSchema>;
type BulkPointsValues = z.infer<typeof bulkPointsSchema>;

export default function MerchantPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [issueMode, setIssueMode] = useState<'single' | 'bulk'>('single');
  
  // Sample merchant stats
  const merchantStats = {
    totalTransactions: 1243,
    pointsAccepted: 45650,
    activePromotions: 2,
    customerReach: 892,
  };
  
  // Sample API key for display
  const [showApiKey, setShowApiKey] = useState(false);
  const apiKey = "xp_merchant_8a7b6c5d4e3f2g1h";
  
  // Initialize promotion form 
  const promotionForm = useForm<PromotionFormValues>({
    resolver: zodResolver(promotionFormSchema),
    defaultValues: {
      name: "",
      description: "",
      program: "XPOINTS",
      multiplier: 2,
      startDate: new Date().toISOString().substring(0, 10),
      endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().substring(0, 10),
      isActive: true,
    },
  });
  
  // Initialize single user points form
  const singleUserForm = useForm<SingleUserPointsValues>({
    resolver: zodResolver(singleUserPointsSchema),
    defaultValues: {
      email: "",
      points: 100,
      reason: "",
      expirationDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().substring(0, 10),
      reference: "",
    },
  });
  
  // Initialize bulk points form
  const bulkPointsForm = useForm<BulkPointsValues>({
    resolver: zodResolver(bulkPointsSchema),
    defaultValues: {
      userList: "",
      pointsPerUser: 100,
      reason: "",
      expirationDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().substring(0, 10),
      reference: "",
    },
  });
  
  // Mutation for issuing points to a single user
  const singleUserMutation = useMutation({
    mutationFn: async (data: SingleUserPointsValues) => {
      // In a real implementation, this would be a proper API endpoint
      const res = await apiRequest('POST', '/api/merchant/issue-points', {
        userId: 1, // In the real implementation, we would look up the user by email
        points: data.points,
        reason: data.reason,
        expirationDate: data.expirationDate,
        reference: data.reference,
        businessProgramId: 1, // In the real implementation, this would be the merchant's program ID
      });
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: "Points issued",
        description: `Successfully issued points to ${singleUserForm.getValues().email}`,
      });
      singleUserForm.reset({
        email: "",
        points: 100,
        reason: "",
        expirationDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().substring(0, 10),
        reference: "",
      });
    },
    onError: (error) => {
      toast({
        title: "Error issuing points",
        description: error.message,
        variant: "destructive",
      });
    },
  });
  
  // Mutation for issuing points to multiple users
  const bulkUserMutation = useMutation({
    mutationFn: async (data: BulkPointsValues) => {
      // Parse the user list (comma or line separated emails)
      const emails = data.userList
        .split(/[,\n]/)
        .map(email => email.trim())
        .filter(email => email.length > 0);
        
      // In a real implementation, this would be a proper API endpoint
      const res = await apiRequest('POST', '/api/merchant/bulk-issue-points', {
        userIds: [1, 2, 3], // In the real implementation, we would look up the users by email
        pointsPerUser: data.pointsPerUser,
        reason: data.reason,
        expirationDate: data.expirationDate,
        reference: data.reference,
        businessProgramId: 1, // In the real implementation, this would be the merchant's program ID
      });
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: "Bulk points issued",
        description: "Successfully issued points to multiple users",
      });
      bulkPointsForm.reset({
        userList: "",
        pointsPerUser: 100,
        reason: "",
        expirationDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().substring(0, 10),
        reference: "",
      });
    },
    onError: (error) => {
      toast({
        title: "Error issuing points",
        description: error.message,
        variant: "destructive",
      });
    },
  });
  
  // Mock point issuance history data
  const pointIssuanceHistory = [
    {
      id: 1,
      user: "john.doe@example.com",
      points: 500,
      reason: "Welcome bonus",
      date: "2023-05-01",
      status: "active",
    },
    {
      id: 2,
      user: "jane.smith@example.com",
      points: 250,
      reason: "Purchase reward",
      date: "2023-05-05",
      status: "active",
    },
    {
      id: 3,
      user: "multiple-users",
      points: 100,
      reason: "Loyalty program launch",
      date: "2023-04-15",
      status: "active",
      userCount: 45,
    },
  ];

  const onPromotionSubmit = (data: PromotionFormValues) => {
    toast({
      title: "Promotion created",
      description: `Your promotion "${data.name}" has been created.`,
    });
    
    console.log(data);
    // In a production environment, this would call a mutation to create the promotion
    promotionForm.reset();
  };
  
  const onSingleUserSubmit = (data: SingleUserPointsValues) => {
    singleUserMutation.mutate(data);
  };
  
  const onBulkPointsSubmit = (data: BulkPointsValues) => {
    bulkUserMutation.mutate(data);
  };

  return (
    
      <div className="space-y-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Merchant & Brand Portal</h1>
            <p className="text-muted-foreground">Manage your xPoints integration and run promotions.</p>
          </div>
          <Button className="flex items-center gap-2">
            <Store className="h-4 w-4" />
            <span>Register New Brand</span>
          </Button>
        </div>

        {/* Stats Overview */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Total Transactions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{merchantStats.totalTransactions.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground mt-1">
                <span className="text-green-500">+12.5%</span> from last month
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Points Accepted</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{merchantStats.pointsAccepted.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground mt-1">
                Value: ${(merchantStats.pointsAccepted * 1.05).toLocaleString()}
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Active Promotions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{merchantStats.activePromotions}</div>
              <p className="text-xs text-muted-foreground mt-1">
                <span className="text-green-500">+1</span> from last month
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Customer Reach</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{merchantStats.customerReach.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground mt-1">
                <span className="text-green-500">+46</span> new customers
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Merchant Portal Tabs */}
        <Tabs defaultValue="issue-points" className="w-full">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="promotions">Promotions</TabsTrigger>
            <TabsTrigger value="issue-points">Issue Points</TabsTrigger>
            <TabsTrigger value="integration">API Integration</TabsTrigger>
            <TabsTrigger value="settings">Brand Settings</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
          </TabsList>
          
          <TabsContent value="promotions" className="p-4 border rounded-md mt-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Create Promotion Form */}
              <div>
                <h3 className="text-lg font-medium mb-4">Create New Promotion</h3>
                
                <Form {...promotionForm}>
                  <form onSubmit={promotionForm.handleSubmit(onPromotionSubmit)} className="space-y-4">
                    <FormField
                      control={promotionForm.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Promotion Name</FormLabel>
                          <FormControl>
                            <Input placeholder="Summer Special Offer" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={promotionForm.control}
                      name="description"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Description</FormLabel>
                          <FormControl>
                            <Input placeholder="Description of your promotion" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={promotionForm.control}
                        name="program"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Loyalty Program</FormLabel>
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
                                <SelectItem value="QANTAS">Qantas Frequent Flyer</SelectItem>
                                <SelectItem value="GYG">Guzman y Gomez Loyalty</SelectItem>
                                <SelectItem value="XPOINTS">xPoints</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={promotionForm.control}
                        name="multiplier"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Points Multiplier</FormLabel>
                            <FormControl>
                              <Input type="number" step="0.1" min="1.1" max="5" {...field} />
                            </FormControl>
                            <FormDescription>
                              e.g. 2x points value
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={promotionForm.control}
                        name="startDate"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Start Date</FormLabel>
                            <FormControl>
                              <Input type="date" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={promotionForm.control}
                        name="endDate"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>End Date</FormLabel>
                            <FormControl>
                              <Input type="date" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    
                    <FormField
                      control={promotionForm.control}
                      name="isActive"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                          <div className="space-y-0.5">
                            <FormLabel>Activate Immediately</FormLabel>
                            <FormDescription>
                              Toggle to activate this promotion right away
                            </FormDescription>
                          </div>
                          <FormControl>
                            <Switch
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                    
                    <Button type="submit" className="w-full">
                      Create Promotion
                    </Button>
                  </form>
                </Form>
              </div>
              
              {/* Active Promotions */}
              <div>
                <h3 className="text-lg font-medium mb-4">Active Promotions</h3>
                
                <div className="space-y-4">
                  <Card>
                    <CardHeader className="pb-2">
                      <div className="flex justify-between items-start">
                        <div>
                          <CardTitle className="text-base">Mother's Day Special</CardTitle>
                          <CardDescription>Double xPoints value</CardDescription>
                        </div>
                        <div className="inline-flex items-center rounded-md bg-green-50 px-2 py-1 text-xs font-medium text-green-700 ring-1 ring-inset ring-green-600/20">
                          Active
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-3 gap-2 text-sm">
                        <div>
                          <div className="text-muted-foreground">Program</div>
                          <div className="font-medium">xPoints</div>
                        </div>
                        <div>
                          <div className="text-muted-foreground">Multiplier</div>
                          <div className="font-medium">2.0x</div>
                        </div>
                        <div>
                          <div className="text-muted-foreground">End Date</div>
                          <div className="font-medium">May 14, 2023</div>
                        </div>
                      </div>
                    </CardContent>
                    <CardFooter className="border-t pt-4 flex justify-between">
                      <Button variant="outline" size="sm">Edit</Button>
                      <Button variant="destructive" size="sm">Deactivate</Button>
                    </CardFooter>
                  </Card>
                  
                  <Card>
                    <CardHeader className="pb-2">
                      <div className="flex justify-between items-start">
                        <div>
                          <CardTitle className="text-base">Welcome Bonus</CardTitle>
                          <CardDescription>New customers get 1.5x points</CardDescription>
                        </div>
                        <div className="inline-flex items-center rounded-md bg-green-50 px-2 py-1 text-xs font-medium text-green-700 ring-1 ring-inset ring-green-600/20">
                          Active
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-3 gap-2 text-sm">
                        <div>
                          <div className="text-muted-foreground">Program</div>
                          <div className="font-medium">All Programs</div>
                        </div>
                        <div>
                          <div className="text-muted-foreground">Multiplier</div>
                          <div className="font-medium">1.5x</div>
                        </div>
                        <div>
                          <div className="text-muted-foreground">End Date</div>
                          <div className="font-medium">Dec 31, 2023</div>
                        </div>
                      </div>
                    </CardContent>
                    <CardFooter className="border-t pt-4 flex justify-between">
                      <Button variant="outline" size="sm">Edit</Button>
                      <Button variant="destructive" size="sm">Deactivate</Button>
                    </CardFooter>
                  </Card>
                  
                  <Card className="opacity-50">
                    <CardHeader className="pb-2">
                      <div className="flex justify-between items-start">
                        <div>
                          <CardTitle className="text-base">Easter Weekend</CardTitle>
                          <CardDescription>Triple points for Easter weekend</CardDescription>
                        </div>
                        <div className="inline-flex items-center rounded-md bg-gray-50 px-2 py-1 text-xs font-medium text-gray-700 ring-1 ring-inset ring-gray-600/20">
                          Ended
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-3 gap-2 text-sm">
                        <div>
                          <div className="text-muted-foreground">Program</div>
                          <div className="font-medium">Qantas</div>
                        </div>
                        <div>
                          <div className="text-muted-foreground">Multiplier</div>
                          <div className="font-medium">3.0x</div>
                        </div>
                        <div>
                          <div className="text-muted-foreground">End Date</div>
                          <div className="font-medium">Apr 10, 2023</div>
                        </div>
                      </div>
                    </CardContent>
                    <CardFooter className="border-t pt-4 flex justify-between">
                      <Button variant="outline" size="sm">View Details</Button>
                      <Button variant="outline" size="sm">Duplicate</Button>
                    </CardFooter>
                  </Card>
                </div>
              </div>
            </div>
          </TabsContent>
          
          {/* Issue Points Tab */}
          <TabsContent value="issue-points" className="p-4 border rounded-md mt-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Issue Points Form */}
              <div className="space-y-6">
                <div className="flex space-x-4 pb-4 border-b">
                  <Button
                    variant={issueMode === 'single' ? 'default' : 'outline'}
                    onClick={() => setIssueMode('single')}
                    className="flex items-center gap-2"
                  >
                    <Users className="h-4 w-4" />
                    <span>Issue to Single User</span>
                  </Button>
                  <Button
                    variant={issueMode === 'bulk' ? 'default' : 'outline'}
                    onClick={() => setIssueMode('bulk')}
                    className="flex items-center gap-2"
                  >
                    <Upload className="h-4 w-4" />
                    <span>Bulk Issue</span>
                  </Button>
                </div>

                {issueMode === 'single' ? (
                  <div>
                    <h3 className="text-lg font-medium mb-4">Issue Points to a Customer</h3>
                    <Form {...singleUserForm}>
                      <form onSubmit={singleUserForm.handleSubmit(onSingleUserSubmit)} className="space-y-4">
                        <FormField
                          control={singleUserForm.control}
                          name="email"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Customer Email</FormLabel>
                              <FormControl>
                                <Input placeholder="customer@example.com" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={singleUserForm.control}
                          name="points"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Points Amount</FormLabel>
                              <FormControl>
                                <Input type="number" min="1" step="1" {...field} />
                              </FormControl>
                              <FormDescription>
                                Number of xPoints to issue
                              </FormDescription>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={singleUserForm.control}
                          name="reason"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Reason</FormLabel>
                              <FormControl>
                                <Input placeholder="Purchase reward, Welcome bonus, etc." {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <div className="grid grid-cols-2 gap-4">
                          <FormField
                            control={singleUserForm.control}
                            name="expirationDate"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Expiration Date (Optional)</FormLabel>
                                <FormControl>
                                  <Input type="date" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          
                          <FormField
                            control={singleUserForm.control}
                            name="reference"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Reference (Optional)</FormLabel>
                                <FormControl>
                                  <Input placeholder="Order #123456" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                        
                        <Button 
                          type="submit" 
                          className="w-full mt-2" 
                          disabled={singleUserMutation.isPending}
                        >
                          {singleUserMutation.isPending && (
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          )}
                          Issue Points
                        </Button>
                      </form>
                    </Form>
                  </div>
                ) : (
                  <div>
                    <h3 className="text-lg font-medium mb-4">Bulk Issue Points</h3>
                    <Form {...bulkPointsForm}>
                      <form onSubmit={bulkPointsForm.handleSubmit(onBulkPointsSubmit)} className="space-y-4">
                        <FormField
                          control={bulkPointsForm.control}
                          name="userList"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Customer Emails</FormLabel>
                              <FormControl>
                                <Textarea 
                                  placeholder="customer1@example.com&#10;customer2@example.com&#10;customer3@example.com" 
                                  className="min-h-[120px]"
                                  {...field} 
                                />
                              </FormControl>
                              <FormDescription>
                                One email per line or comma-separated
                              </FormDescription>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={bulkPointsForm.control}
                          name="pointsPerUser"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Points Per User</FormLabel>
                              <FormControl>
                                <Input type="number" min="1" step="1" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={bulkPointsForm.control}
                          name="reason"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Reason</FormLabel>
                              <FormControl>
                                <Input placeholder="Marketing campaign, Loyalty program launch, etc." {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <div className="grid grid-cols-2 gap-4">
                          <FormField
                            control={bulkPointsForm.control}
                            name="expirationDate"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Expiration Date (Optional)</FormLabel>
                                <FormControl>
                                  <Input type="date" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          
                          <FormField
                            control={bulkPointsForm.control}
                            name="reference"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Reference (Optional)</FormLabel>
                                <FormControl>
                                  <Input placeholder="Campaign #ABC123" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                        
                        <Button 
                          type="submit" 
                          className="w-full mt-2"
                          disabled={bulkUserMutation.isPending}
                        >
                          {bulkUserMutation.isPending && (
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          )}
                          Issue Points to All Users
                        </Button>
                      </form>
                    </Form>
                  </div>
                )}
              </div>
              
              {/* Recent Points Issuance History */}
              <div>
                <h3 className="text-lg font-medium mb-4">Recent Points Issuance</h3>
                
                <div className="space-y-4">
                  {pointIssuanceHistory.map((issue) => (
                    <Card key={issue.id}>
                      <CardHeader className="pb-2">
                        <div className="flex justify-between items-start">
                          <div>
                            <CardTitle className="text-base">
                              {issue.userCount ? (
                                <span className="flex items-center gap-1">
                                  <Users className="h-4 w-4" /> 
                                  <span>Bulk Issue ({issue.userCount} users)</span>
                                </span>
                              ) : (
                                <span className="flex items-center gap-1">
                                  <User className="h-4 w-4" /> 
                                  <span>{issue.user}</span>
                                </span>
                              )}
                            </CardTitle>
                            <CardDescription>{issue.reason}</CardDescription>
                          </div>
                          <Badge variant={issue.status === 'active' ? 'default' : 'secondary'}>
                            {issue.status}
                          </Badge>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="grid grid-cols-2 gap-2 text-sm">
                          <div>
                            <div className="text-muted-foreground">Points</div>
                            <div className="font-medium">{issue.points.toLocaleString()}</div>
                          </div>
                          <div>
                            <div className="text-muted-foreground">Date</div>
                            <div className="font-medium">{issue.date}</div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="integration" className="p-4 border rounded-md mt-4">
            <div className="space-y-8">
              <div className="flex flex-col md:flex-row gap-8">
                <div className="md:w-1/2">
                  <h3 className="text-lg font-medium mb-4">API Integration</h3>
                  <p className="text-muted-foreground mb-6">
                    Integrate xPoints into your existing systems using our REST API.
                    Follow the documentation to accept xPoints at checkout and manage customer points.
                  </p>
                  
                  <div className="bg-gray-50 p-4 rounded-md mb-4">
                    <h4 className="font-medium mb-2">Your API Key</h4>
                    <div className="flex items-center justify-between">
                      <code className="bg-black/5 p-2 rounded text-sm w-full font-mono">
                        {showApiKey ? apiKey : "••••••••••••••••••••••"}
                      </code>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => setShowApiKey(!showApiKey)}
                        className="ml-2 flex-shrink-0"
                      >
                        {showApiKey ? "Hide" : "Show"}
                      </Button>
                    </div>
                  </div>
                  
                  <div className="flex space-x-2">
                    <Button>
                      <Code className="mr-2 h-4 w-4" />
                      View Documentation
                    </Button>
                    <Button variant="outline">
                      Regenerate API Key
                    </Button>
                  </div>
                </div>
                
                <div className="md:w-1/2">
                  <h3 className="text-lg font-medium mb-4">Sample Code</h3>
                  <div className="bg-black text-white p-4 rounded-md overflow-auto max-h-80">
                    <pre className="text-sm font-mono">
{`// Accept xPoints at checkout
const xpointsApi = require('xpoints-api');

// Initialize with your API key
const client = new xpointsApi('${apiKey}');

// Process a points redemption
async function redeemPoints(customerId, amount) {
  try {
    const result = await client.redeemPoints({
      customerId,
      amount,
      currency: 'XPOINTS',
      merchantId: 'your_merchant_id'
    });
    
    console.log('Redemption successful!', result);
    return result;
  } catch (error) {
    console.error('Error redeeming points:', error);
    throw error;
  }
}

// Get customer points balance
async function getCustomerBalance(customerId) {
  try {
    const balance = await client.getBalance(customerId);
    console.log('Customer balance:', balance);
    return balance;
  } catch (error) {
    console.error('Error fetching balance:', error);
    throw error;
  }
}`}
                    </pre>
                  </div>
                </div>
              </div>
              
              <Separator />
              
              <div>
                <h3 className="text-lg font-medium mb-4">Integration Options</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center text-base">
                        <CreditCard className="mr-2 h-5 w-5 text-blue-500" />
                        Point of Sale
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-muted-foreground">
                        Integrate with your POS system to accept xPoints for in-store purchases.
                      </p>
                    </CardContent>
                    <CardFooter>
                      <Button variant="outline" size="sm" className="w-full">
                        Setup POS
                      </Button>
                    </CardFooter>
                  </Card>
                  
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center text-base">
                        <ShoppingBag className="mr-2 h-5 w-5 text-green-500" />
                        E-commerce
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-muted-foreground">
                        Add xPoints as a payment option on your online store checkout.
                      </p>
                    </CardContent>
                    <CardFooter>
                      <Button size="sm" className="w-full">
                        Get Started
                      </Button>
                    </CardFooter>
                  </Card>
                  
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center text-base">
                        <Zap className="mr-2 h-5 w-5 text-purple-500" />
                        Mobile App
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-muted-foreground">
                        Integrate our SDK into your mobile app for seamless points redemption.
                      </p>
                    </CardContent>
                    <CardFooter>
                      <Button variant="outline" size="sm" className="w-full">
                        View SDK Docs
                      </Button>
                    </CardFooter>
                  </Card>
                </div>
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="settings" className="p-4 border rounded-md mt-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="md:col-span-1">
                <h3 className="text-lg font-medium mb-4">Brand Settings</h3>
                <p className="text-muted-foreground mb-4">
                  Manage your brand information and preferences for the xPoints platform.
                </p>
                
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Brand Profile</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <Label htmlFor="brandName">Brand Name</Label>
                      <Input id="brandName" defaultValue="Sample Brand" />
                    </div>
                    <div>
                      <Label htmlFor="industry">Industry</Label>
                      <Select defaultValue="retail">
                        <SelectTrigger id="industry">
                          <SelectValue placeholder="Select industry" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="retail">Retail</SelectItem>
                          <SelectItem value="hospitality">Hospitality</SelectItem>
                          <SelectItem value="travel">Travel</SelectItem>
                          <SelectItem value="food">Food & Beverage</SelectItem>
                          <SelectItem value="other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="website">Website</Label>
                      <Input id="website" defaultValue="https://www.samplebrand.com" />
                    </div>
                  </CardContent>
                  <CardFooter>
                    <Button className="w-full">Save Changes</Button>
                  </CardFooter>
                </Card>
              </div>
              
              <div className="md:col-span-2">
                <h3 className="text-lg font-medium mb-4">Loyalty Program Configuration</h3>
                
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Points Acceptance Settings</CardTitle>
                    <CardDescription>Configure which loyalty programs you want to accept</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center mr-3">
                          <Tag className="h-4 w-4 text-purple-500" />
                        </div>
                        <div>
                          <div className="font-medium">xPoints</div>
                          <div className="text-xs text-muted-foreground">Universal currency</div>
                        </div>
                      </div>
                      <Switch defaultChecked />
                    </div>
                    
                    <Separator />
                    
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <div className="w-8 h-8 rounded-full bg-red-100 flex items-center justify-center mr-3">
                          <Tag className="h-4 w-4 text-red-500" />
                        </div>
                        <div>
                          <div className="font-medium">Qantas Frequent Flyer</div>
                          <div className="text-xs text-muted-foreground">Airline loyalty program</div>
                        </div>
                      </div>
                      <Switch defaultChecked />
                    </div>
                    
                    <Separator />
                    
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <div className="w-8 h-8 rounded-full bg-yellow-100 flex items-center justify-center mr-3">
                          <Tag className="h-4 w-4 text-yellow-500" />
                        </div>
                        <div>
                          <div className="font-medium">GYG Loyalty</div>
                          <div className="text-xs text-muted-foreground">Food & beverage rewards</div>
                        </div>
                      </div>
                      <Switch defaultChecked />
                    </div>
                    
                    <Separator />
                    
                    <div className="pt-4">
                      <Label htmlFor="conversionRate">Point Conversion Rate (A$1 = X Points)</Label>
                      <div className="grid grid-cols-2 gap-4 mt-2">
                        <Input id="conversionRate" defaultValue="10" type="number" min="1" />
                        <Button>Update Rate</Button>
                      </div>
                      <p className="text-xs text-muted-foreground mt-2">
                        This affects how much each point is worth in your store
                      </p>
                    </div>
                    
                    <div className="pt-4">
                      <Label htmlFor="minRedeem">Minimum Redemption Amount</Label>
                      <div className="grid grid-cols-2 gap-4 mt-2">
                        <Input id="minRedeem" defaultValue="500" type="number" min="0" />
                        <Button variant="outline">Update Minimum</Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="analytics" className="p-4 border rounded-md mt-4">
            <div className="text-center py-12">
              <BarChart3 className="mx-auto h-16 w-16 text-gray-300 mb-4" />
              <h3 className="text-xl font-medium mb-2">Enhanced Analytics Coming Soon</h3>
              <p className="text-gray-600 max-w-md mx-auto mb-8">
                We're building comprehensive analytics to help you track redemptions, 
                customer behavior, and promotion performance.
              </p>
              <div className="inline-flex items-center rounded-md bg-blue-50 px-3 py-1 text-xs font-medium text-blue-700 ring-1 ring-inset ring-blue-600/20">
                Launching June 2023
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>

  );
}