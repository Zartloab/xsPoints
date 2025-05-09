import React, { useState } from 'react';
import { useAuth } from '@/hooks/use-auth';
import MainLayout from '@/components/layout/MainLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { User, Check, Shield, RefreshCw, Clock, CreditCard, UserCheck, UserCircle, Upload, AlertCircle } from 'lucide-react';
import ConnectedAccounts from '@/components/account/ConnectedAccounts';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

// Profile update schema
const profileFormSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  email: z.string().email("Invalid email address"),
  username: z.string().min(3, "Username must be at least 3 characters"),
});

// KYC verification schema
const kycFormSchema = z.object({
  fullName: z.string().min(1, "Full legal name is required"),
  dateOfBirth: z.string().min(1, "Date of birth is required"),
  country: z.string().min(1, "Country is required"),
  idType: z.enum(["passport", "drivingLicense", "nationalId"], {
    required_error: "ID type is required",
  }),
  idNumber: z.string().min(1, "ID number is required"),
  address: z.string().min(1, "Address is required"),
  city: z.string().min(1, "City is required"),
  zipCode: z.string().min(1, "Zip/postal code is required"),
  phoneNumber: z.string().min(1, "Phone number is required"),
});

type ProfileFormValues = z.infer<typeof profileFormSchema>;
type KycFormValues = z.infer<typeof kycFormSchema>;

export default function ProfilePage() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'profile' | 'kyc' | 'security' | 'payments' | 'history'>('profile');
  const [kycSubmitted, setKycSubmitted] = useState(false);
  
  const profileForm = useForm<ProfileFormValues>({
    resolver: zodResolver(profileFormSchema),
    defaultValues: {
      firstName: user?.firstName || "",
      lastName: user?.lastName || "",
      email: user?.email || "",
      username: user?.username || "",
    },
  });
  
  const kycForm = useForm<KycFormValues>({
    resolver: zodResolver(kycFormSchema),
    defaultValues: {
      fullName: "",
      dateOfBirth: "",
      country: "",
      idType: "passport",
      idNumber: "",
      address: "",
      city: "",
      zipCode: "",
      phoneNumber: "",
    },
  });

  const onProfileSubmit = (data: ProfileFormValues) => {
    // In a real implementation, this would call a mutation to update the user profile
    console.log("Profile update:", data);
  };
  
  const onKycSubmit = (data: KycFormValues) => {
    // In a real implementation, this would call a mutation to submit KYC data
    console.log("KYC submission:", data);
    setKycSubmitted(true);
    // Simulate API call delay
    setTimeout(() => {
      setKycSubmitted(false);
    }, 5000);
  };

  return (
    <MainLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold tracking-tight">Profile Settings</h1>
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-500">KYC Status:</span>
            <span className="inline-flex items-center rounded-full bg-yellow-100 px-2.5 py-0.5 text-xs font-medium text-yellow-800">
              {user?.kycVerified || "Unverified"}
            </span>
          </div>
        </div>
        
        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          {/* Sidebar */}
          <Card className="md:col-span-1">
            <CardHeader>
              <CardTitle className="text-lg">Account</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <nav className="flex flex-col space-y-1 px-4 py-2">
                <button 
                  onClick={() => setActiveTab('profile')}
                  className={`flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-left ${activeTab === 'profile' ? 'bg-gray-100' : 'text-gray-600 hover:bg-gray-100'}`}
                >
                  <UserCircle className="h-4 w-4" />
                  <span>Profile</span>
                </button>
                <button 
                  onClick={() => setActiveTab('kyc')}
                  className={`flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-left ${activeTab === 'kyc' ? 'bg-gray-100' : 'text-gray-600 hover:bg-gray-100'}`}
                >
                  <UserCheck className="h-4 w-4" />
                  <span>KYC Verification</span>
                </button>
                <button 
                  onClick={() => setActiveTab('security')}
                  className={`flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-left ${activeTab === 'security' ? 'bg-gray-100' : 'text-gray-600 hover:bg-gray-100'}`}
                >
                  <Shield className="h-4 w-4" />
                  <span>Security</span>
                </button>
                <button 
                  onClick={() => setActiveTab('payments')}
                  className={`flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-left ${activeTab === 'payments' ? 'bg-gray-100' : 'text-gray-600 hover:bg-gray-100'}`}
                >
                  <CreditCard className="h-4 w-4" />
                  <span>Payments</span>
                </button>
                <button 
                  onClick={() => setActiveTab('history')}
                  className={`flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-left ${activeTab === 'history' ? 'bg-gray-100' : 'text-gray-600 hover:bg-gray-100'}`}
                >
                  <Clock className="h-4 w-4" />
                  <span>Transaction History</span>
                </button>
              </nav>
            </CardContent>
          </Card>
          
          {/* Main content */}
          <div className="md:col-span-2 space-y-6">
            {/* Profile Tab Content */}
            {activeTab === 'profile' && (
              <>
                <Card>
                  <CardHeader>
                    <CardTitle>Your Profile</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Form {...profileForm}>
                      <form onSubmit={profileForm.handleSubmit(onProfileSubmit)} className="space-y-6">
                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                          <FormField
                            control={profileForm.control}
                            name="firstName"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>First Name</FormLabel>
                                <FormControl>
                                  <Input placeholder="First name" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          
                          <FormField
                            control={profileForm.control}
                            name="lastName"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Last Name</FormLabel>
                                <FormControl>
                                  <Input placeholder="Last name" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                        
                        <FormField
                          control={profileForm.control}
                          name="email"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Email</FormLabel>
                              <FormControl>
                                <Input type="email" placeholder="Your email" {...field} />
                              </FormControl>
                              <FormDescription>
                                We'll use this email to send you notifications about your account
                              </FormDescription>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={profileForm.control}
                          name="username"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Username</FormLabel>
                              <FormControl>
                                <Input placeholder="Username" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <Button type="submit">
                          <Check className="mr-2 h-4 w-4" />
                          Save Changes
                        </Button>
                      </form>
                    </Form>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader>
                    <CardTitle>Password</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <p className="text-sm text-gray-500">
                        Update your password to keep your account secure.
                      </p>
                      <Button variant="outline">
                        Change Password
                      </Button>
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader>
                    <CardTitle>Connected Loyalty Programs</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ConnectedAccounts />
                  </CardContent>
                </Card>
              </>
            )}
            
            {/* KYC Verification Tab Content */}
            {activeTab === 'kyc' && (
              <Card>
                <CardHeader>
                  <CardTitle>KYC Verification</CardTitle>
                  <CardDescription>
                    Complete your identity verification to unlock higher transaction limits and additional platform features.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {kycSubmitted ? (
                    <Alert className="mb-6">
                      <AlertCircle className="h-4 w-4" />
                      <AlertTitle>Verification in progress</AlertTitle>
                      <AlertDescription>
                        We've received your information and are currently verifying it. This process typically takes 1-3 business days.
                      </AlertDescription>
                    </Alert>
                  ) : (
                    <Form {...kycForm}>
                      <form onSubmit={kycForm.handleSubmit(onKycSubmit)} className="space-y-6">
                        <FormField
                          control={kycForm.control}
                          name="fullName"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Full Legal Name</FormLabel>
                              <FormControl>
                                <Input placeholder="Enter your full legal name" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={kycForm.control}
                          name="dateOfBirth"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Date of Birth</FormLabel>
                              <FormControl>
                                <Input type="date" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={kycForm.control}
                          name="country"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Country of Residence</FormLabel>
                              <Select onValueChange={field.onChange} defaultValue={field.value}>
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Select country" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  <SelectItem value="australia">Australia</SelectItem>
                                  <SelectItem value="canada">Canada</SelectItem>
                                  <SelectItem value="united_kingdom">United Kingdom</SelectItem>
                                  <SelectItem value="united_states">United States</SelectItem>
                                  <SelectItem value="other">Other</SelectItem>
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                          <FormField
                            control={kycForm.control}
                            name="idType"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>ID Type</FormLabel>
                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                  <FormControl>
                                    <SelectTrigger>
                                      <SelectValue placeholder="Select ID type" />
                                    </SelectTrigger>
                                  </FormControl>
                                  <SelectContent>
                                    <SelectItem value="passport">Passport</SelectItem>
                                    <SelectItem value="drivingLicense">Driving License</SelectItem>
                                    <SelectItem value="nationalId">National ID</SelectItem>
                                  </SelectContent>
                                </Select>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          
                          <FormField
                            control={kycForm.control}
                            name="idNumber"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>ID Number</FormLabel>
                                <FormControl>
                                  <Input placeholder="Enter your ID number" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                        
                        <FormField
                          control={kycForm.control}
                          name="address"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Address</FormLabel>
                              <FormControl>
                                <Input placeholder="Enter your street address" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                          <FormField
                            control={kycForm.control}
                            name="city"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>City</FormLabel>
                                <FormControl>
                                  <Input placeholder="City" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          
                          <FormField
                            control={kycForm.control}
                            name="zipCode"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Zip/Postal Code</FormLabel>
                                <FormControl>
                                  <Input placeholder="Zip/Postal Code" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                        
                        <FormField
                          control={kycForm.control}
                          name="phoneNumber"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Phone Number</FormLabel>
                              <FormControl>
                                <Input type="tel" placeholder="Phone number with country code" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <div className="space-y-4">
                          <p className="text-sm text-gray-500">
                            Please upload clear images of your ID document (front and back)
                          </p>
                          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                            <div className="flex flex-col items-center justify-center rounded-md border border-dashed border-gray-300 p-6">
                              <Upload className="h-8 w-8 text-gray-400" />
                              <p className="mt-2 text-sm text-gray-500">Front of ID</p>
                              <Button variant="outline" size="sm" className="mt-2">
                                Upload
                              </Button>
                            </div>
                            <div className="flex flex-col items-center justify-center rounded-md border border-dashed border-gray-300 p-6">
                              <Upload className="h-8 w-8 text-gray-400" />
                              <p className="mt-2 text-sm text-gray-500">Back of ID</p>
                              <Button variant="outline" size="sm" className="mt-2">
                                Upload
                              </Button>
                            </div>
                          </div>
                        </div>
                        
                        <div className="space-y-2">
                          <p className="text-sm text-gray-500">
                            Please upload a selfie holding your ID document
                          </p>
                          <div className="flex flex-col items-center justify-center rounded-md border border-dashed border-gray-300 p-6">
                            <Upload className="h-8 w-8 text-gray-400" />
                            <p className="mt-2 text-sm text-gray-500">Selfie with ID</p>
                            <Button variant="outline" size="sm" className="mt-2">
                              Upload
                            </Button>
                          </div>
                        </div>
                        
                        <Button type="submit" className="w-full">
                          Submit Verification
                        </Button>
                      </form>
                    </Form>
                  )}
                </CardContent>
              </Card>
            )}
            
            {/* Security Tab Content */}
            {activeTab === 'security' && (
              <Card>
                <CardHeader>
                  <CardTitle>Security Settings</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-500 mb-6">
                    Manage your account security settings and preferences.
                  </p>
                  <div className="space-y-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-medium">Two-Factor Authentication</h3>
                        <p className="text-sm text-gray-500">Add an extra layer of security to your account</p>
                      </div>
                      <Button variant="outline">Enable</Button>
                    </div>
                    <Separator />
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-medium">Password</h3>
                        <p className="text-sm text-gray-500">Change your password regularly for better security</p>
                      </div>
                      <Button variant="outline">Change</Button>
                    </div>
                    <Separator />
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-medium">Device Management</h3>
                        <p className="text-sm text-gray-500">Manage devices that have access to your account</p>
                      </div>
                      <Button variant="outline">Manage</Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
            
            {/* Payments Tab Content */}
            {activeTab === 'payments' && (
              <Card>
                <CardHeader>
                  <CardTitle>Payment Methods</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-500 mb-6">
                    Manage your payment methods and billing information.
                  </p>
                  <div className="rounded-md border border-gray-200 p-4 mb-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <CreditCard className="h-6 w-6 text-gray-500" />
                        <div>
                          <p className="font-medium">Credit/Debit Card</p>
                          <p className="text-sm text-gray-500">No cards added yet</p>
                        </div>
                      </div>
                      <Button variant="outline" size="sm">Add Card</Button>
                    </div>
                  </div>
                  <div className="rounded-md border border-gray-200 p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <CreditCard className="h-6 w-6 text-gray-500" />
                        <div>
                          <p className="font-medium">Bank Account</p>
                          <p className="text-sm text-gray-500">Add a bank account for direct deposits</p>
                        </div>
                      </div>
                      <Button variant="outline" size="sm">Link Account</Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
            
            {/* Transaction History Tab Content */}
            {activeTab === 'history' && (
              <Card>
                <CardHeader>
                  <CardTitle>Transaction History</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="rounded-md border">
                    <div className="grid grid-cols-5 gap-4 p-4 font-medium border-b">
                      <div>Date</div>
                      <div>Type</div>
                      <div>From</div>
                      <div>To</div>
                      <div>Amount</div>
                    </div>
                    <div className="p-4 text-center text-gray-500">
                      No transactions yet
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </MainLayout>
  );
}