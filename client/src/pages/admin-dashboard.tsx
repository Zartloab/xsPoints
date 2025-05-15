import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { Redirect } from 'wouter';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  Table, 
  TableBody, 
  TableCaption, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
  BarChart, 
  UsersIcon, 
  ArrowUpDown, 
  User, 
  RefreshCw,
  Edit, 
  DollarSign
} from "lucide-react";
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';

export default function AdminDashboard() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("users");
  const [users, setUsers] = useState<any[]>([]);
  const [exchangeRates, setExchangeRates] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState<number | null>(null);
  const [userDetails, setUserDetails] = useState<any | null>(null);
  const [isEditingRate, setIsEditingRate] = useState(false);
  const [rateToEdit, setRateToEdit] = useState<any | null>(null);
  
  // For rate editing form
  const [fromProgram, setFromProgram] = useState("");
  const [toProgram, setToProgram] = useState("");
  const [rate, setRate] = useState("");

  // Check if user is admin
  if (user && user.username !== "admin") {
    toast({
      title: "Access Denied",
      description: "You don't have permission to access the admin dashboard",
      variant: "destructive",
    });
    return <Redirect to="/" />;
  }

  // Redirect to login if not authenticated
  if (!user) {
    return <Redirect to="/auth" />;
  }

  // Fetch users and exchange rates
  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        // Fetch users
        const usersResponse = await apiRequest("GET", "/api/admin/users");
        const usersData = await usersResponse.json();
        setUsers(usersData);

        // Fetch exchange rates
        const ratesResponse = await apiRequest("GET", "/api/admin/exchange-rates");
        const ratesData = await ratesResponse.json();
        setExchangeRates(ratesData);
      } catch (error) {
        toast({
          title: "Error",
          description: "Failed to fetch admin data",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  // Fetch user details
  const fetchUserDetails = async (userId: number) => {
    try {
      setSelectedUser(userId);
      const response = await apiRequest("GET", `/api/admin/users/${userId}`);
      const data = await response.json();
      setUserDetails(data);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to fetch user details",
        variant: "destructive",
      });
    }
  };

  // Update user tier or KYC status
  const updateUser = async (userId: number, tierOrKyc: { membershipTier?: string, kycVerified?: string }) => {
    try {
      const response = await apiRequest("PUT", `/api/admin/users/${userId}`, tierOrKyc);
      
      if (response.ok) {
        // Refresh user list
        const usersResponse = await apiRequest("GET", "/api/admin/users");
        const usersData = await usersResponse.json();
        setUsers(usersData);
        
        // Refresh user details if viewing that user
        if (selectedUser === userId) {
          await fetchUserDetails(userId);
        }
        
        toast({
          title: "Success",
          description: "User updated successfully",
        });
      } else {
        const error = await response.json();
        throw new Error(error.message || "Failed to update user");
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to update user",
        variant: "destructive",
      });
    }
  };

  // Update exchange rate
  const handleUpdateRate = async () => {
    try {
      const response = await apiRequest("POST", "/api/admin/exchange-rates", {
        fromProgram,
        toProgram,
        rate: parseFloat(rate)
      });
      
      if (response.ok) {
        // Refresh exchange rates
        const ratesResponse = await apiRequest("GET", "/api/admin/exchange-rates");
        const ratesData = await ratesResponse.json();
        setExchangeRates(ratesData);
        
        toast({
          title: "Success",
          description: "Exchange rate updated successfully",
        });
        setIsEditingRate(false);
      } else {
        const error = await response.json();
        throw new Error(error.message || "Failed to update exchange rate");
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to update exchange rate",
        variant: "destructive",
      });
    }
  };

  const handleEditRate = (rate: any) => {
    setRateToEdit(rate);
    setFromProgram(rate.fromProgram);
    setToProgram(rate.toProgram);
    setRate(rate.rate.toString());
    setIsEditingRate(true);
  };

  const handleCreateNewRate = () => {
    setRateToEdit(null);
    setFromProgram("");
    setToProgram("");
    setRate("");
    setIsEditingRate(true);
  };

  // Format date for display
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="container mx-auto py-6">
      <h1 className="text-3xl font-bold mb-6">Admin Dashboard</h1>
      
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="mb-4">
          <TabsTrigger value="users" className="flex items-center gap-2">
            <UsersIcon className="h-4 w-4" />
            Users
          </TabsTrigger>
          <TabsTrigger value="exchange-rates" className="flex items-center gap-2">
            <ArrowUpDown className="h-4 w-4" />
            Exchange Rates
          </TabsTrigger>
          <TabsTrigger value="statistics" className="flex items-center gap-2">
            <BarChart className="h-4 w-4" />
            Statistics
          </TabsTrigger>
        </TabsList>

        {/* Users Tab */}
        <TabsContent value="users" className="space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>User Management</CardTitle>
                <CardDescription>View and manage all users in the system</CardDescription>
              </div>
              <Button 
                variant="outline" 
                onClick={async () => {
                  try {
                    setIsLoading(true);
                    const usersResponse = await apiRequest("GET", "/api/admin/users");
                    const usersData = await usersResponse.json();
                    setUsers(usersData);
                    
                    // Clear user details if the selected user no longer exists
                    if (selectedUser && !usersData.find((u: any) => u.id === selectedUser)) {
                      setSelectedUser(null);
                      setUserDetails(null);
                    }
                    
                    toast({
                      title: "Success",
                      description: "User list refreshed",
                    });
                  } catch (error) {
                    toast({
                      title: "Error",
                      description: "Failed to refresh user list",
                      variant: "destructive",
                    });
                  } finally {
                    setIsLoading(false);
                  }
                }}
              >
                <RefreshCw className="h-4 w-4 mr-1" />
                Refresh
              </Button>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="flex justify-center p-8">
                  <RefreshCw className="animate-spin h-8 w-8 text-gray-500" />
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="col-span-1">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Username</TableHead>
                          <TableHead>Tier</TableHead>
                          <TableHead>Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {users.map((user: any) => (
                          <TableRow 
                            key={user.id} 
                            className={selectedUser === user.id ? "bg-muted" : ""}
                          >
                            <TableCell>{user.username}</TableCell>
                            <TableCell>{user.membershipTier}</TableCell>
                            <TableCell>
                              <Button 
                                variant="ghost" 
                                size="sm" 
                                onClick={() => fetchUserDetails(user.id)}
                              >
                                <User className="h-4 w-4 mr-1" />
                                Details
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                  
                  <div className="col-span-2">
                    {userDetails ? (
                      <Card>
                        <CardHeader>
                          <CardTitle>User Details: {userDetails.user.username}</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <h3 className="text-lg font-semibold">User Information</h3>
                              <div className="space-y-2 mt-2">
                                <div>
                                  <span className="font-medium">Name:</span> {userDetails.user.firstName} {userDetails.user.lastName}
                                </div>
                                <div>
                                  <span className="font-medium">Email:</span> {userDetails.user.email}
                                </div>
                                <div className="flex justify-between items-center">
                                  <span className="font-medium">Membership Tier:</span> {userDetails.user.membershipTier}
                                  <div className="space-x-1">
                                    <Button 
                                      variant="outline" 
                                      size="sm"
                                      onClick={() => updateUser(userDetails.user.id, { membershipTier: "STANDARD" })}
                                      disabled={userDetails.user.membershipTier === "STANDARD"}
                                    >
                                      Standard
                                    </Button>
                                    <Button 
                                      variant="outline" 
                                      size="sm"
                                      onClick={() => updateUser(userDetails.user.id, { membershipTier: "SILVER" })}
                                      disabled={userDetails.user.membershipTier === "SILVER"}
                                    >
                                      Silver
                                    </Button>
                                    <Button 
                                      variant="outline" 
                                      size="sm"
                                      onClick={() => updateUser(userDetails.user.id, { membershipTier: "GOLD" })}
                                      disabled={userDetails.user.membershipTier === "GOLD"}
                                    >
                                      Gold
                                    </Button>
                                    <Button 
                                      variant="outline" 
                                      size="sm"
                                      onClick={() => updateUser(userDetails.user.id, { membershipTier: "PLATINUM" })}
                                      disabled={userDetails.user.membershipTier === "PLATINUM"}
                                    >
                                      Platinum
                                    </Button>
                                  </div>
                                </div>
                                <div className="flex justify-between items-center">
                                  <span className="font-medium">KYC Status:</span> {userDetails.user.kycVerified}
                                  <div className="space-x-1">
                                    <Button 
                                      variant="outline" 
                                      size="sm"
                                      onClick={() => updateUser(userDetails.user.id, { kycVerified: "unverified" })}
                                      disabled={userDetails.user.kycVerified === "unverified"}
                                    >
                                      Unverified
                                    </Button>
                                    <Button 
                                      variant="outline" 
                                      size="sm"
                                      onClick={() => updateUser(userDetails.user.id, { kycVerified: "pending" })}
                                      disabled={userDetails.user.kycVerified === "pending"}
                                    >
                                      Pending
                                    </Button>
                                    <Button 
                                      variant="outline" 
                                      size="sm"
                                      onClick={() => updateUser(userDetails.user.id, { kycVerified: "verified" })}
                                      disabled={userDetails.user.kycVerified === "verified"}
                                    >
                                      Verified
                                    </Button>
                                  </div>
                                </div>
                                <div>
                                  <span className="font-medium">Created:</span> {formatDate(userDetails.user.createdAt)}
                                </div>
                              </div>
                            </div>
                            
                            <div>
                              <h3 className="text-lg font-semibold">Wallets</h3>
                              <div className="space-y-2 mt-2">
                                {userDetails.wallets.map((wallet: any) => (
                                  <div key={wallet.id} className="border p-2 rounded">
                                    <span className="font-medium">{wallet.program}:</span> {wallet.balance.toLocaleString()} points
                                    {wallet.accountNumber && (
                                      <div className="text-xs text-gray-500">
                                        Account: {wallet.accountNumber}
                                      </div>
                                    )}
                                  </div>
                                ))}
                              </div>
                            </div>
                          </div>
                          
                          <div>
                            <h3 className="text-lg font-semibold">Recent Transactions</h3>
                            <Table>
                              <TableHeader>
                                <TableRow>
                                  <TableHead>Date</TableHead>
                                  <TableHead>From</TableHead>
                                  <TableHead>To</TableHead>
                                  <TableHead>Amount</TableHead>
                                </TableRow>
                              </TableHeader>
                              <TableBody>
                                {userDetails.transactions.slice(0, 5).map((tx: any) => (
                                  <TableRow key={tx.id}>
                                    <TableCell>{formatDate(tx.timestamp)}</TableCell>
                                    <TableCell>{tx.fromProgram}</TableCell>
                                    <TableCell>{tx.toProgram}</TableCell>
                                    <TableCell>{tx.amount.toLocaleString()}</TableCell>
                                  </TableRow>
                                ))}
                                {userDetails.transactions.length === 0 && (
                                  <TableRow>
                                    <TableCell colSpan={4} className="text-center text-muted-foreground">
                                      No transactions found
                                    </TableCell>
                                  </TableRow>
                                )}
                              </TableBody>
                            </Table>
                          </div>
                        </CardContent>
                      </Card>
                    ) : (
                      <div className="flex items-center justify-center h-full">
                        <p className="text-muted-foreground">Select a user to view details</p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Exchange Rates Tab */}
        <TabsContent value="exchange-rates">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Exchange Rates Management</CardTitle>
                <CardDescription>Update rates between loyalty programs</CardDescription>
              </div>
              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  onClick={async () => {
                    try {
                      setIsLoading(true);
                      const response = await apiRequest("GET", "/api/admin/exchange-rates");
                      const data = await response.json();
                      setExchangeRates(data);
                      toast({
                        title: "Success",
                        description: "Exchange rates refreshed",
                      });
                    } catch (error) {
                      toast({
                        title: "Error",
                        description: "Failed to refresh exchange rates",
                        variant: "destructive",
                      });
                    } finally {
                      setIsLoading(false);
                    }
                  }}
                >
                  <RefreshCw className="h-4 w-4 mr-1" />
                  Refresh
                </Button>
                <Button onClick={handleCreateNewRate}>
                  <DollarSign className="h-4 w-4 mr-1" />
                  Add New Rate
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="flex justify-center p-8">
                  <RefreshCw className="animate-spin h-8 w-8 text-gray-500" />
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>From Program</TableHead>
                      <TableHead>To Program</TableHead>
                      <TableHead>Rate</TableHead>
                      <TableHead>Last Updated</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {exchangeRates.map((rate: any) => (
                      <TableRow key={rate.id}>
                        <TableCell>{rate.fromProgram}</TableCell>
                        <TableCell>{rate.toProgram}</TableCell>
                        <TableCell>{rate.rate}</TableCell>
                        <TableCell>{formatDate(rate.lastUpdated)}</TableCell>
                        <TableCell>
                          <Button variant="ghost" size="sm" onClick={() => handleEditRate(rate)}>
                            <Edit className="h-4 w-4 mr-1" />
                            Edit
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Statistics Tab */}
        <TabsContent value="statistics">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>System Statistics</CardTitle>
                <CardDescription>Overview of platform usage and metrics</CardDescription>
              </div>
              <Button 
                variant="outline" 
                onClick={async () => {
                  try {
                    setIsLoading(true);
                    // Fetch fresh data for statistics
                    const usersResponse = await apiRequest("GET", "/api/admin/users");
                    const usersData = await usersResponse.json();
                    setUsers(usersData);
                    
                    const ratesResponse = await apiRequest("GET", "/api/admin/exchange-rates");
                    const ratesData = await ratesResponse.json();
                    setExchangeRates(ratesData);
                    
                    toast({
                      title: "Success",
                      description: "Statistics refreshed",
                    });
                  } catch (error) {
                    toast({
                      title: "Error",
                      description: "Failed to refresh statistics",
                      variant: "destructive",
                    });
                  } finally {
                    setIsLoading(false);
                  }
                }}
              >
                <RefreshCw className="h-4 w-4 mr-1" />
                Refresh
              </Button>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg">Total Users</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-3xl font-bold">{users.length}</p>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg">Exchange Rate Pairs</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-3xl font-bold">{exchangeRates.length}</p>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg">Supported Programs</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-3xl font-bold">10</p>
                  </CardContent>
                </Card>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
      
      {/* Exchange Rate Edit Dialog */}
      <Dialog open={isEditingRate} onOpenChange={setIsEditingRate}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {rateToEdit ? "Edit Exchange Rate" : "Create New Exchange Rate"}
            </DialogTitle>
            <DialogDescription>
              Update the exchange rate between loyalty programs
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="fromProgram" className="text-right">
                From Program
              </Label>
              <Select 
                value={fromProgram} 
                onValueChange={setFromProgram}
                disabled={rateToEdit !== null}
              >
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="Select program" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="XPOINTS">XPOINTS</SelectItem>
                  <SelectItem value="QANTAS">QANTAS</SelectItem>
                  <SelectItem value="GYG">GYG</SelectItem>
                  <SelectItem value="VELOCITY">VELOCITY</SelectItem>
                  <SelectItem value="AMEX">AMEX</SelectItem>
                  <SelectItem value="FLYBUYS">FLYBUYS</SelectItem>
                  <SelectItem value="HILTON">HILTON</SelectItem>
                  <SelectItem value="MARRIOTT">MARRIOTT</SelectItem>
                  <SelectItem value="AIRBNB">AIRBNB</SelectItem>
                  <SelectItem value="DELTA">DELTA</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="toProgram" className="text-right">
                To Program
              </Label>
              <Select 
                value={toProgram} 
                onValueChange={setToProgram}
                disabled={rateToEdit !== null}
              >
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="Select program" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="XPOINTS">XPOINTS</SelectItem>
                  <SelectItem value="QANTAS">QANTAS</SelectItem>
                  <SelectItem value="GYG">GYG</SelectItem>
                  <SelectItem value="VELOCITY">VELOCITY</SelectItem>
                  <SelectItem value="AMEX">AMEX</SelectItem>
                  <SelectItem value="FLYBUYS">FLYBUYS</SelectItem>
                  <SelectItem value="HILTON">HILTON</SelectItem>
                  <SelectItem value="MARRIOTT">MARRIOTT</SelectItem>
                  <SelectItem value="AIRBNB">AIRBNB</SelectItem>
                  <SelectItem value="DELTA">DELTA</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="rate" className="text-right">
                Rate
              </Label>
              <Input
                id="rate"
                type="number"
                step="0.001"
                value={rate}
                onChange={(e) => setRate(e.target.value)}
                className="col-span-3"
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditingRate(false)}>
              Cancel
            </Button>
            <Button onClick={handleUpdateRate}>
              {rateToEdit ? "Update Rate" : "Create Rate"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}