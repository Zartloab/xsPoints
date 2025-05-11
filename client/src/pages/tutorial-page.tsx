import React, { useState } from 'react';
import MainLayout from '@/components/layout/MainLayout';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { 
  ArrowRight, 
  CheckCircle2, 
  ChevronRight,
  CircleDot,
  Gift, 
  GraduationCap, 
  Info, 
  RefreshCw, 
  Star, 
  Wallet,
  Book,
  Coins,
  BadgeDollarSign,
  BarChart4,
  PersonStanding,
  Handshake,
  Award,
  PencilRuler,
} from 'lucide-react';
import { motion } from 'framer-motion';
import { Badge } from '@/components/ui/badge';
import { Link } from 'wouter';
import ProgramIcon from '@/components/loyaltyprograms/ProgramIcon';

const TutorialPage = () => {
  const [currentTab, setCurrentTab] = useState('overview');
  const [completedTutorials, setCompletedTutorials] = useState<Record<string, boolean>>({
    'overview': false,
    'conversion': false,
    'wallet': false,
    'membership': false,
    'trading': false,
    'explorer': false
  });
  
  const markCompleted = (tab: string) => {
    setCompletedTutorials(prev => ({
      ...prev,
      [tab]: true
    }));
  };
  
  const completedCount = Object.values(completedTutorials).filter(v => v).length;
  const totalTutorials = Object.keys(completedTutorials).length;
  const completionPercentage = (completedCount / totalTutorials) * 100;

  return (
    
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Interactive Tutorial</h1>
            <p className="text-muted-foreground">
              Learn how to use the xPoints Exchange platform with step-by-step guides.
            </p>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-sm text-muted-foreground">
              {completedCount} of {totalTutorials} completed
            </div>
            <div className="w-48">
              <Progress value={completionPercentage} className="h-2" />
            </div>
          </div>
        </div>

        <Alert>
          <Info className="h-4 w-4" />
          <AlertTitle>Getting started</AlertTitle>
          <AlertDescription>
            Work through each tutorial section to gain a complete understanding of the platform.
            Each section includes interactive elements to help you learn by doing.
          </AlertDescription>
        </Alert>

        <Tabs value={currentTab} onValueChange={setCurrentTab} className="w-full">
          <TabsList className="grid grid-cols-6 w-full">
            <TabsTrigger value="overview" className="relative">
              <Book className="h-4 w-4 mr-2" />
              <span className="hidden sm:inline">Platform Overview</span>
              <span className="sm:hidden">Overview</span>
              {completedTutorials.overview && (
                <CheckCircle2 className="h-3 w-3 absolute -top-1 -right-1 text-green-500" />
              )}
            </TabsTrigger>
            <TabsTrigger value="wallet" className="relative">
              <Wallet className="h-4 w-4 mr-2" />
              <span className="hidden sm:inline">Managing Wallets</span>
              <span className="sm:hidden">Wallets</span>
              {completedTutorials.wallet && (
                <CheckCircle2 className="h-3 w-3 absolute -top-1 -right-1 text-green-500" />
              )}
            </TabsTrigger>
            <TabsTrigger value="conversion" className="relative">
              <RefreshCw className="h-4 w-4 mr-2" />
              <span className="hidden sm:inline">Point Conversion</span>
              <span className="sm:hidden">Convert</span>
              {completedTutorials.conversion && (
                <CheckCircle2 className="h-3 w-3 absolute -top-1 -right-1 text-green-500" />
              )}
            </TabsTrigger>
            <TabsTrigger value="membership" className="relative">
              <Award className="h-4 w-4 mr-2" />
              <span className="hidden sm:inline">Membership Tiers</span>
              <span className="sm:hidden">Tiers</span>
              {completedTutorials.membership && (
                <CheckCircle2 className="h-3 w-3 absolute -top-1 -right-1 text-green-500" />
              )}
            </TabsTrigger>
            <TabsTrigger value="trading" className="relative">
              <Handshake className="h-4 w-4 mr-2" />
              <span className="hidden sm:inline">P2P Trading</span>
              <span className="sm:hidden">Trading</span>
              {completedTutorials.trading && (
                <CheckCircle2 className="h-3 w-3 absolute -top-1 -right-1 text-green-500" />
              )}
            </TabsTrigger>
            <TabsTrigger value="explorer" className="relative">
              <BarChart4 className="h-4 w-4 mr-2" />
              <span className="hidden sm:inline">Transparency Explorer</span>
              <span className="sm:hidden">Explorer</span>
              {completedTutorials.explorer && (
                <CheckCircle2 className="h-3 w-3 absolute -top-1 -right-1 text-green-500" />
              )}
            </TabsTrigger>
          </TabsList>

          {/* Overview Section */}
          <TabsContent value="overview" className="mt-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Left Column: Introduction */}
              <div className="md:col-span-2 space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-2xl">Welcome to xPoints Exchange</CardTitle>
                    <CardDescription>The universal loyalty point exchange platform</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <p>xPoints Exchange is a platform that lets you convert loyalty points between different programs using a universal currency called xPoints. Here's what you can do:</p>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
                      <div className="flex items-start">
                        <div className="mr-2 mt-1 bg-primary/10 p-2 rounded-full">
                          <RefreshCw className="h-4 w-4 text-primary" />
                        </div>
                        <div>
                          <h4 className="font-medium">Convert Points</h4>
                          <p className="text-sm text-muted-foreground">Exchange between loyalty programs through xPoints</p>
                        </div>
                      </div>
                      
                      <div className="flex items-start">
                        <div className="mr-2 mt-1 bg-primary/10 p-2 rounded-full">
                          <Wallet className="h-4 w-4 text-primary" />
                        </div>
                        <div>
                          <h4 className="font-medium">Manage Wallets</h4>
                          <p className="text-sm text-muted-foreground">Connect and manage multiple loyalty accounts</p>
                        </div>
                      </div>
                      
                      <div className="flex items-start">
                        <div className="mr-2 mt-1 bg-primary/10 p-2 rounded-full">
                          <Handshake className="h-4 w-4 text-primary" />
                        </div>
                        <div>
                          <h4 className="font-medium">Trade P2P</h4>
                          <p className="text-sm text-muted-foreground">Trade directly with other users</p>
                        </div>
                      </div>
                      
                      <div className="flex items-start">
                        <div className="mr-2 mt-1 bg-primary/10 p-2 rounded-full">
                          <Award className="h-4 w-4 text-primary" />
                        </div>
                        <div>
                          <h4 className="font-medium">Tier Benefits</h4>
                          <p className="text-sm text-muted-foreground">Earn benefits with higher membership tiers</p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader>
                    <CardTitle>How It Works</CardTitle>
                    <CardDescription>Understanding the xPoints Exchange ecosystem</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="space-y-6">
                      <div className="flex items-start">
                        <div className="flex-shrink-0 mr-4 bg-gray-100 p-2 rounded-full">
                          <CircleDot className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                          <h4 className="font-medium text-base">xPoints as Universal Currency</h4>
                          <p className="text-muted-foreground">
                            xPoints is our platform's universal currency. When you convert between loyalty programs,
                            your points are first exchanged to xPoints, then to your destination program.
                          </p>
                        </div>
                      </div>
                      
                      <div className="relative pl-8 py-2">
                        <div className="absolute top-0 left-[1.05rem] h-full w-0.5 bg-gray-100"></div>
                      </div>
                      
                      <div className="flex items-start">
                        <div className="flex-shrink-0 mr-4 bg-gray-100 p-2 rounded-full">
                          <CircleDot className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                          <h4 className="font-medium text-base">Exchange Rates</h4>
                          <p className="text-muted-foreground">
                            Each loyalty program has its own exchange rate with xPoints, which determines how many
                            xPoints you get for your original points, and how many destination points you'll receive.
                          </p>
                        </div>
                      </div>
                      
                      <div className="relative pl-8 py-2">
                        <div className="absolute top-0 left-[1.05rem] h-full w-0.5 bg-gray-100"></div>
                      </div>
                      
                      <div className="flex items-start">
                        <div className="flex-shrink-0 mr-4 bg-gray-100 p-2 rounded-full">
                          <CircleDot className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                          <h4 className="font-medium text-base">Membership Tiers</h4>
                          <p className="text-muted-foreground">
                            As you use the platform, you'll progress through membership tiers (Standard, Silver, Gold, Platinum).
                            Higher tiers give you benefits like reduced fees and special features.
                          </p>
                        </div>
                      </div>
                    </div>
                    
                    <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                      <h4 className="font-medium mb-2">Example Conversion:</h4>
                      <div className="flex items-center justify-between flex-wrap">
                        <div className="flex items-center">
                          <div className="h-10 w-10 flex items-center justify-center bg-red-100 rounded-full">
                            <span className="font-bold text-red-700">Q</span>
                          </div>
                          <div className="ml-2">
                            <div className="text-sm font-medium">1,000 Qantas Points</div>
                          </div>
                        </div>
                        
                        <ChevronRight className="h-5 w-5 text-gray-400 mx-2 hidden md:block" />
                        <ArrowRight className="h-5 w-5 text-gray-400 mx-2 md:hidden my-2" />
                        
                        <div className="flex items-center">
                          <div className="h-10 w-10 flex items-center justify-center bg-primary/10 rounded-full">
                            <span className="font-bold text-primary">X</span>
                          </div>
                          <div className="ml-2">
                            <div className="text-sm font-medium">500 xPoints</div>
                            <div className="text-xs text-muted-foreground">(Rate: 0.5 per Qantas point)</div>
                          </div>
                        </div>
                        
                        <ChevronRight className="h-5 w-5 text-gray-400 mx-2 hidden md:block" />
                        <ArrowRight className="h-5 w-5 text-gray-400 mx-2 md:hidden my-2" />
                        
                        <div className="flex items-center">
                          <div className="h-10 w-10 flex items-center justify-center bg-yellow-100 rounded-full">
                            <span className="font-bold text-yellow-700">G</span>
                          </div>
                          <div className="ml-2">
                            <div className="text-sm font-medium">625 GYG Points</div>
                            <div className="text-xs text-muted-foreground">(Rate: 1.25 per xPoint)</div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
              
              {/* Right Column: Supported Programs */}
              <div>
                <Card>
                  <CardHeader>
                    <CardTitle>Supported Loyalty Programs</CardTitle>
                    <CardDescription>We support a wide range of loyalty programs</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="flex items-center p-3 bg-gray-50 rounded-lg">
                        <ProgramIcon program="QANTAS" className="h-8 w-8 mr-2" />
                        <span className="font-medium text-sm">Qantas</span>
                      </div>
                      <div className="flex items-center p-3 bg-gray-50 rounded-lg">
                        <ProgramIcon program="GYG" className="h-8 w-8 mr-2" />
                        <span className="font-medium text-sm">GYG</span>
                      </div>
                      <div className="flex items-center p-3 bg-gray-50 rounded-lg">
                        <ProgramIcon program="VELOCITY" className="h-8 w-8 mr-2" />
                        <span className="font-medium text-sm">Velocity</span>
                      </div>
                      <div className="flex items-center p-3 bg-gray-50 rounded-lg">
                        <ProgramIcon program="AMEX" className="h-8 w-8 mr-2" />
                        <span className="font-medium text-sm">Amex</span>
                      </div>
                      <div className="flex items-center p-3 bg-gray-50 rounded-lg">
                        <ProgramIcon program="FLYBUYS" className="h-8 w-8 mr-2" />
                        <span className="font-medium text-sm">Flybuys</span>
                      </div>
                      <div className="flex items-center p-3 bg-gray-50 rounded-lg">
                        <ProgramIcon program="HILTON" className="h-8 w-8 mr-2" />
                        <span className="font-medium text-sm">Hilton</span>
                      </div>
                      <div className="flex items-center p-3 bg-gray-50 rounded-lg">
                        <ProgramIcon program="MARRIOTT" className="h-8 w-8 mr-2" />
                        <span className="font-medium text-sm">Marriott</span>
                      </div>
                      <div className="flex items-center p-3 bg-gray-50 rounded-lg">
                        <ProgramIcon program="AIRBNB" className="h-8 w-8 mr-2" />
                        <span className="font-medium text-sm">Airbnb</span>
                      </div>
                      <div className="flex items-center p-3 bg-gray-50 rounded-lg">
                        <ProgramIcon program="DELTA" className="h-8 w-8 mr-2" />
                        <span className="font-medium text-sm">Delta</span>
                      </div>
                      <div className="flex items-center p-3 bg-gray-50 rounded-lg">
                        <ProgramIcon program="XPOINTS" className="h-8 w-8 mr-2" />
                        <span className="font-medium text-sm">xPoints</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                
                <Card className="mt-6">
                  <CardHeader>
                    <CardTitle>Practice Module</CardTitle>
                    <CardDescription>Test your understanding</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <p className="text-sm">Answer the following question to complete this tutorial section:</p>
                      
                      <div className="p-4 bg-gray-50 rounded-lg">
                        <h4 className="font-medium">What is the universal currency used in the xPoints Exchange platform?</h4>
                        
                        <div className="mt-4 space-y-2">
                          <Button 
                            variant="outline" 
                            className="w-full justify-start text-left"
                            onClick={() => alert("Not quite! Try again.")}
                          >
                            Qantas Points
                          </Button>
                          <Button 
                            variant="outline" 
                            className="w-full justify-start text-left"
                            onClick={() => markCompleted('overview')}
                          >
                            xPoints
                          </Button>
                          <Button 
                            variant="outline" 
                            className="w-full justify-start text-left"
                            onClick={() => alert("Not quite! Try again.")}
                          >
                            GYG Points
                          </Button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                  <CardFooter>
                    {completedTutorials.overview ? (
                      <div className="w-full flex items-center justify-between">
                        <Badge className="bg-green-100 text-green-800 hover:bg-green-100">
                          <CheckCircle2 className="h-3 w-3 mr-1" /> Completed
                        </Badge>
                        <Button variant="outline" size="sm" onClick={() => setCurrentTab('wallet')}>
                          Next: Managing Wallets <ChevronRight className="h-4 w-4 ml-1" />
                        </Button>
                      </div>
                    ) : (
                      <Button variant="outline" size="sm" className="ml-auto">Skip for now</Button>
                    )}
                  </CardFooter>
                </Card>
              </div>
            </div>
          </TabsContent>

          {/* Wallet Tab */}
          <TabsContent value="wallet" className="mt-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="md:col-span-2 space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Managing Your Loyalty Wallets</CardTitle>
                    <CardDescription>Learn how to connect and manage your loyalty program accounts</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <p>
                      Your dashboard displays all your connected loyalty program wallets. Here's how to manage them:
                    </p>
                    
                    <div className="space-y-6 mt-4">
                      <div className="relative border rounded-lg p-4">
                        <div className="absolute -top-3 left-4 bg-white px-2 text-sm font-medium">Step 1: Connect an Account</div>
                        <p className="text-sm">From your dashboard, click the "Connect Account" button to link a loyalty program account. You'll need to:</p>
                        <ul className="list-disc list-inside text-sm mt-2 space-y-1">
                          <li>Select the loyalty program (Qantas, GYG, etc.)</li>
                          <li>Enter your account number and credentials</li>
                          <li>Authorize the connection</li>
                        </ul>
                        <div className="mt-4 bg-gray-50 p-3 rounded-md text-xs text-muted-foreground">
                          Your account credentials are securely stored and encrypted.
                        </div>
                      </div>
                      
                      <div className="relative border rounded-lg p-4">
                        <div className="absolute -top-3 left-4 bg-white px-2 text-sm font-medium">Step 2: View Point Balances</div>
                        <p className="text-sm">After connecting, you can view your loyalty point balances on the dashboard:</p>
                        <ul className="list-disc list-inside text-sm mt-2 space-y-1">
                          <li>Current point balance</li>
                          <li>Equivalent xPoints value</li>
                          <li>Real-world value using the Points Translator</li>
                        </ul>
                      </div>
                      
                      <div className="relative border rounded-lg p-4">
                        <div className="absolute -top-3 left-4 bg-white px-2 text-sm font-medium">Step 3: Refresh and Monitor</div>
                        <p className="text-sm">The platform syncs your point balances automatically, but you can also:</p>
                        <ul className="list-disc list-inside text-sm mt-2 space-y-1">
                          <li>Manually refresh balances with the "Refresh" button</li>
                          <li>Monitor transaction history through the History tab</li>
                          <li>View potential rewards with the Points Translator</li>
                        </ul>
                      </div>
                    </div>
                    
                    <div className="p-4 bg-gray-50 rounded-lg mt-4">
                      <h4 className="font-medium mb-2">The Points Translator</h4>
                      <p className="text-sm">The Points Translator helps you understand what your points are worth in real-world terms:</p>
                      <div className="grid grid-cols-2 gap-4 mt-3">
                        <div className="bg-white p-3 rounded border">
                          <div className="text-xs text-muted-foreground">8,000 Qantas Points ≈</div>
                          <div className="font-medium">Economy Flight</div>
                          <div className="text-xs">Sydney to Melbourne one-way</div>
                        </div>
                        <div className="bg-white p-3 rounded border">
                          <div className="text-xs text-muted-foreground">7,800 Velocity Points ≈</div>
                          <div className="font-medium">Economy Flight</div>
                          <div className="text-xs">Sydney to Brisbane one-way</div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
              
              <div>
                <Card>
                  <CardHeader>
                    <CardTitle>Interactive Demo</CardTitle>
                    <CardDescription>Click through the steps to see how wallet management works</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="p-4 bg-gray-50 rounded-lg">
                        <div className="mb-4">
                          <h4 className="font-medium">Select a loyalty program to practice connecting:</h4>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-2">
                          <Button variant="outline" className="flex flex-col items-center p-4 h-auto">
                            <ProgramIcon program="QANTAS" className="h-8 w-8 mb-2" />
                            <span className="text-xs">Qantas</span>
                          </Button>
                          <Button variant="outline" className="flex flex-col items-center p-4 h-auto" 
                            onClick={() => markCompleted('wallet')}>
                            <ProgramIcon program="GYG" className="h-8 w-8 mb-2" />
                            <span className="text-xs">GYG</span>
                          </Button>
                        </div>
                      </div>
                      
                      <div className="p-4 bg-gray-50 rounded-lg mt-4">
                        <h4 className="font-medium mb-2">Tips for Wallet Management</h4>
                        <ul className="text-sm space-y-2">
                          <li className="flex items-start">
                            <CheckCircle2 className="h-4 w-4 text-green-500 mr-2 mt-0.5" />
                            <span>You can connect multiple accounts from the same loyalty program</span>
                          </li>
                          <li className="flex items-start">
                            <CheckCircle2 className="h-4 w-4 text-green-500 mr-2 mt-0.5" />
                            <span>Keep your account details updated for seamless synchronization</span>
                          </li>
                          <li className="flex items-start">
                            <CheckCircle2 className="h-4 w-4 text-green-500 mr-2 mt-0.5" />
                            <span>Use the Points Translator to understand your rewards options</span>
                          </li>
                        </ul>
                      </div>
                    </div>
                  </CardContent>
                  <CardFooter>
                    {completedTutorials.wallet ? (
                      <div className="w-full flex items-center justify-between">
                        <Badge className="bg-green-100 text-green-800 hover:bg-green-100">
                          <CheckCircle2 className="h-3 w-3 mr-1" /> Completed
                        </Badge>
                        <Button variant="outline" size="sm" onClick={() => setCurrentTab('conversion')}>
                          Next: Point Conversion <ChevronRight className="h-4 w-4 ml-1" />
                        </Button>
                      </div>
                    ) : (
                      <Button variant="outline" size="sm" className="ml-auto">Skip for now</Button>
                    )}
                  </CardFooter>
                </Card>
              </div>
            </div>
          </TabsContent>

          {/* Conversion Tab */}
          <TabsContent value="conversion" className="mt-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="md:col-span-2 space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Converting Loyalty Points</CardTitle>
                    <CardDescription>Learn how to convert points between different loyalty programs</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <p>
                      Point conversion is the core feature of the xPoints Exchange. Here's how to convert your points:
                    </p>
                    
                    <div className="space-y-6 mt-4">
                      <div className="relative border rounded-lg p-4">
                        <div className="absolute -top-3 left-4 bg-white px-2 text-sm font-medium">Step 1: Initiate a Conversion</div>
                        <p className="text-sm">From your dashboard, click the "Convert" button on any wallet card or navigate to the Convert section.</p>
                        <div className="mt-3">
                          <motion.div 
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="p-3 bg-gray-50 rounded-md flex items-center justify-between">
                            <div className="flex items-center">
                              <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center">
                                <span className="font-medium text-blue-700">X</span>
                              </div>
                              <div className="ml-2">
                                <div className="font-medium">xPoints</div>
                                <div className="text-xs text-gray-500">Universal exchange currency</div>
                              </div>
                            </div>
                            <Button size="sm" variant="ghost">Convert</Button>
                          </motion.div>
                        </div>
                      </div>
                      
                      <div className="relative border rounded-lg p-4">
                        <div className="absolute -top-3 left-4 bg-white px-2 text-sm font-medium">Step 2: Select Programs and Amount</div>
                        <p className="text-sm">Choose the source and destination loyalty programs and enter the amount to convert:</p>
                        <div className="mt-3 grid grid-cols-1 sm:grid-cols-3 gap-3">
                          <div className="p-3 bg-gray-50 rounded-md">
                            <div className="text-xs text-gray-500 mb-1">From</div>
                            <div className="flex items-center">
                              <div className="h-6 w-6 rounded-full bg-red-100 flex items-center justify-center">
                                <span className="font-medium text-red-700 text-xs">Q</span>
                              </div>
                              <div className="ml-2 font-medium text-sm">Qantas</div>
                            </div>
                          </div>
                          <div className="p-3 bg-gray-50 rounded-md">
                            <div className="text-xs text-gray-500 mb-1">Amount</div>
                            <div className="font-medium text-sm">10,000 points</div>
                          </div>
                          <div className="p-3 bg-gray-50 rounded-md">
                            <div className="text-xs text-gray-500 mb-1">To</div>
                            <div className="flex items-center">
                              <div className="h-6 w-6 rounded-full bg-green-100 flex items-center justify-center">
                                <span className="font-medium text-green-700 text-xs">V</span>
                              </div>
                              <div className="ml-2 font-medium text-sm">Velocity</div>
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      <div className="relative border rounded-lg p-4">
                        <div className="absolute -top-3 left-4 bg-white px-2 text-sm font-medium">Step 3: Review Conversion Details</div>
                        <p className="text-sm">Review the conversion details, including:</p>
                        <ul className="list-disc list-inside text-sm mt-2 space-y-1">
                          <li>Exchange rates for both programs</li>
                          <li>How many points you'll receive</li>
                          <li>Any applicable fees</li>
                        </ul>
                        <div className="mt-3 p-3 bg-gray-50 rounded-md">
                          <div className="flex items-center justify-between">
                            <div>
                              <div className="text-xs text-gray-500">Exchange Rate (to xPoints)</div>
                              <div className="font-medium">1 Qantas Point = 0.5 xPoints</div>
                            </div>
                            <div className="text-right">
                              <div className="text-xs text-gray-500">Exchange Rate (from xPoints)</div>
                              <div className="font-medium">1 xPoint = 0.7 Velocity Points</div>
                            </div>
                          </div>
                          <div className="mt-3 pt-3 border-t">
                            <div className="flex items-center justify-between">
                              <div className="text-xs text-gray-500">You'll receive</div>
                              <div className="font-medium">3,500 Velocity Points</div>
                            </div>
                            <div className="flex items-center justify-between mt-1">
                              <div className="text-xs text-gray-500">Fee</div>
                              <div className="font-medium">0 points (Free)</div>
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      <div className="relative border rounded-lg p-4">
                        <div className="absolute -top-3 left-4 bg-white px-2 text-sm font-medium">Step 4: Confirm and Track</div>
                        <p className="text-sm">After confirming, your conversion will be processed:</p>
                        <ul className="list-disc list-inside text-sm mt-2 space-y-1">
                          <li>Points will be deducted from your source program</li>
                          <li>Points will be added to your destination program</li>
                          <li>The transaction will appear in your history</li>
                        </ul>
                        <div className="mt-3 p-3 bg-green-50 rounded-md border border-green-100">
                          <div className="flex items-start">
                            <CheckCircle2 className="h-5 w-5 text-green-500 mt-0.5 mr-2" />
                            <div>
                              <div className="font-medium text-green-800">Conversion Successful</div>
                              <div className="text-xs text-green-700">10,000 Qantas Points → 3,500 Velocity Points</div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
              
              <div>
                <Card>
                  <CardHeader>
                    <CardTitle>Conversion Simulation</CardTitle>
                    <CardDescription>Try a simulated point conversion</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="p-4 bg-gray-50 rounded-lg">
                        <h4 className="font-medium mb-3">Convert 5,000 GYG Points:</h4>
                        
                        <div className="space-y-4">
                          <div>
                            <div className="text-xs text-gray-500 mb-1">Select destination program:</div>
                            <div className="grid grid-cols-2 gap-2">
                              <Button variant="outline" className="flex items-center justify-start">
                                <ProgramIcon program="QANTAS" className="h-5 w-5 mr-2" />
                                <span className="text-xs">Qantas</span>
                              </Button>
                              <Button variant="outline" className="flex items-center justify-start"
                                onClick={() => markCompleted('conversion')}>
                                <ProgramIcon program="XPOINTS" className="h-5 w-5 mr-2" />
                                <span className="text-xs">xPoints</span>
                              </Button>
                            </div>
                          </div>
                          
                          {completedTutorials.conversion && (
                            <div className="p-3 bg-green-50 rounded-md border border-green-100">
                              <div className="flex items-start">
                                <CheckCircle2 className="h-5 w-5 text-green-500 mt-0.5 mr-2" />
                                <div>
                                  <div className="font-medium text-green-800">Conversion Complete!</div>
                                  <div className="text-xs text-green-700">5,000 GYG Points → 4,000 xPoints</div>
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                      
                      <div className="p-4 bg-gray-50 rounded-lg mt-4">
                        <h4 className="font-medium mb-2">Important Conversion Facts</h4>
                        <ul className="text-sm space-y-2">
                          <li className="flex items-start">
                            <Info className="h-4 w-4 text-blue-500 mr-2 mt-0.5" />
                            <span>Conversions under 10,000 points are free</span>
                          </li>
                          <li className="flex items-start">
                            <Info className="h-4 w-4 text-blue-500 mr-2 mt-0.5" />
                            <span>Higher tier members get reduced fees</span>
                          </li>
                          <li className="flex items-start">
                            <Info className="h-4 w-4 text-blue-500 mr-2 mt-0.5" />
                            <span>Exchange rates fluctuate based on market demand</span>
                          </li>
                          <li className="flex items-start">
                            <Info className="h-4 w-4 text-blue-500 mr-2 mt-0.5" />
                            <span>Check the Explorer page for current rates</span>
                          </li>
                        </ul>
                      </div>
                    </div>
                  </CardContent>
                  <CardFooter>
                    {completedTutorials.conversion ? (
                      <div className="w-full flex items-center justify-between">
                        <Badge className="bg-green-100 text-green-800 hover:bg-green-100">
                          <CheckCircle2 className="h-3 w-3 mr-1" /> Completed
                        </Badge>
                        <Button variant="outline" size="sm" onClick={() => setCurrentTab('membership')}>
                          Next: Membership Tiers <ChevronRight className="h-4 w-4 ml-1" />
                        </Button>
                      </div>
                    ) : (
                      <Button variant="outline" size="sm" className="ml-auto">Skip for now</Button>
                    )}
                  </CardFooter>
                </Card>
              </div>
            </div>
          </TabsContent>

          {/* Membership Tab */}
          <TabsContent value="membership" className="mt-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="md:col-span-2 space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Membership Tiers and Benefits</CardTitle>
                    <CardDescription>Learn about membership tiers and their advantages</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <p>
                      xPoints Exchange offers a tiered membership system that rewards active users with increased benefits:
                    </p>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 mt-6">
                      <div className="bg-gray-50 rounded-lg p-4 relative overflow-hidden">
                        <div className="absolute top-0 right-0 bg-gray-200 px-2 py-1 text-xs font-medium rounded-bl-md">
                          Starter
                        </div>
                        <h3 className="font-bold text-lg mt-4">Standard</h3>
                        <div className="mt-2">
                          <div className="h-1 w-full bg-gray-200 rounded-full">
                            <div className="h-1 bg-gray-400 rounded-full" style={{ width: '25%' }}></div>
                          </div>
                        </div>
                        <ul className="mt-4 space-y-2 text-sm">
                          <li className="flex items-start">
                            <CheckCircle2 className="h-4 w-4 text-gray-500 mr-2 mt-0.5 flex-shrink-0" />
                            <span>Basic platform access</span>
                          </li>
                          <li className="flex items-start">
                            <CheckCircle2 className="h-4 w-4 text-gray-500 mr-2 mt-0.5 flex-shrink-0" />
                            <span>Standard conversion rates</span>
                          </li>
                          <li className="flex items-start">
                            <CheckCircle2 className="h-4 w-4 text-gray-500 mr-2 mt-0.5 flex-shrink-0" />
                            <span>Free conversions up to 10,000 points</span>
                          </li>
                          <li className="flex items-start text-gray-400">
                            <svg className="h-4 w-4 mr-2 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                            <span>No fee discounts</span>
                          </li>
                        </ul>
                      </div>
                      
                      <div className="bg-blue-50 rounded-lg p-4 relative overflow-hidden">
                        <div className="absolute top-0 right-0 bg-blue-200 px-2 py-1 text-xs font-medium text-blue-700 rounded-bl-md">
                          10,000 points/month
                        </div>
                        <h3 className="font-bold text-lg text-blue-800 mt-4">Silver</h3>
                        <div className="mt-2">
                          <div className="h-1 w-full bg-blue-200 rounded-full">
                            <div className="h-1 bg-blue-500 rounded-full" style={{ width: '50%' }}></div>
                          </div>
                        </div>
                        <ul className="mt-4 space-y-2 text-sm">
                          <li className="flex items-start">
                            <CheckCircle2 className="h-4 w-4 text-blue-500 mr-2 mt-0.5 flex-shrink-0" />
                            <span>All standard features</span>
                          </li>
                          <li className="flex items-start">
                            <CheckCircle2 className="h-4 w-4 text-blue-500 mr-2 mt-0.5 flex-shrink-0" />
                            <span>10% discount on conversion fees</span>
                          </li>
                          <li className="flex items-start">
                            <CheckCircle2 className="h-4 w-4 text-blue-500 mr-2 mt-0.5 flex-shrink-0" />
                            <span>Free conversions up to 20,000 points</span>
                          </li>
                          <li className="flex items-start">
                            <CheckCircle2 className="h-4 w-4 text-blue-500 mr-2 mt-0.5 flex-shrink-0" />
                            <span>Priority customer support</span>
                          </li>
                        </ul>
                      </div>
                      
                      <div className="bg-yellow-50 rounded-lg p-4 relative overflow-hidden">
                        <div className="absolute top-0 right-0 bg-yellow-200 px-2 py-1 text-xs font-medium text-yellow-700 rounded-bl-md">
                          50,000 points/month
                        </div>
                        <h3 className="font-bold text-lg text-yellow-800 mt-4">Gold</h3>
                        <div className="mt-2">
                          <div className="h-1 w-full bg-yellow-200 rounded-full">
                            <div className="h-1 bg-yellow-500 rounded-full" style={{ width: '75%' }}></div>
                          </div>
                        </div>
                        <ul className="mt-4 space-y-2 text-sm">
                          <li className="flex items-start">
                            <CheckCircle2 className="h-4 w-4 text-yellow-600 mr-2 mt-0.5 flex-shrink-0" />
                            <span>All Silver features</span>
                          </li>
                          <li className="flex items-start">
                            <CheckCircle2 className="h-4 w-4 text-yellow-600 mr-2 mt-0.5 flex-shrink-0" />
                            <span>25% discount on conversion fees</span>
                          </li>
                          <li className="flex items-start">
                            <CheckCircle2 className="h-4 w-4 text-yellow-600 mr-2 mt-0.5 flex-shrink-0" />
                            <span>Free conversions up to 50,000 points</span>
                          </li>
                          <li className="flex items-start">
                            <CheckCircle2 className="h-4 w-4 text-yellow-600 mr-2 mt-0.5 flex-shrink-0" />
                            <span>Preferential exchange rates</span>
                          </li>
                        </ul>
                      </div>
                      
                      <div className="bg-purple-50 rounded-lg p-4 relative overflow-hidden">
                        <div className="absolute top-0 right-0 bg-purple-200 px-2 py-1 text-xs font-medium text-purple-700 rounded-bl-md">
                          100,000 points/month
                        </div>
                        <h3 className="font-bold text-lg text-purple-800 mt-4">Platinum</h3>
                        <div className="mt-2">
                          <div className="h-1 w-full bg-purple-200 rounded-full">
                            <div className="h-1 bg-purple-500 rounded-full" style={{ width: '100%' }}></div>
                          </div>
                        </div>
                        <ul className="mt-4 space-y-2 text-sm">
                          <li className="flex items-start">
                            <CheckCircle2 className="h-4 w-4 text-purple-500 mr-2 mt-0.5 flex-shrink-0" />
                            <span>All Gold features</span>
                          </li>
                          <li className="flex items-start">
                            <CheckCircle2 className="h-4 w-4 text-purple-500 mr-2 mt-0.5 flex-shrink-0" />
                            <span>50% discount on conversion fees</span>
                          </li>
                          <li className="flex items-start">
                            <CheckCircle2 className="h-4 w-4 text-purple-500 mr-2 mt-0.5 flex-shrink-0" />
                            <span>Free conversions up to 100,000 points</span>
                          </li>
                          <li className="flex items-start">
                            <CheckCircle2 className="h-4 w-4 text-purple-500 mr-2 mt-0.5 flex-shrink-0" />
                            <span>VIP exchange rates & concierge</span>
                          </li>
                        </ul>
                      </div>
                    </div>
                    
                    <div className="p-4 bg-gray-50 rounded-lg mt-6">
                      <h4 className="font-medium mb-2">How to Level Up Your Membership</h4>
                      <p className="text-sm">Your membership tier is determined by your monthly point conversion volume:</p>
                      
                      <div className="mt-4 space-y-4">
                        <div className="flex flex-col sm:flex-row sm:items-center">
                          <div className="sm:w-1/3 font-medium text-sm">Standard to Silver</div>
                          <div className="sm:w-2/3 mt-1 sm:mt-0">
                            <div className="h-2 bg-gray-200 rounded-full">
                              <div className="h-2 bg-blue-500 rounded-full" style={{ width: '30%' }}></div>
                            </div>
                            <div className="flex justify-between mt-1 text-xs text-gray-500">
                              <span>0 points</span>
                              <span>10,000 points/month</span>
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex flex-col sm:flex-row sm:items-center">
                          <div className="sm:w-1/3 font-medium text-sm">Silver to Gold</div>
                          <div className="sm:w-2/3 mt-1 sm:mt-0">
                            <div className="h-2 bg-gray-200 rounded-full">
                              <div className="h-2 bg-yellow-500 rounded-full" style={{ width: '60%' }}></div>
                            </div>
                            <div className="flex justify-between mt-1 text-xs text-gray-500">
                              <span>10,000 points</span>
                              <span>50,000 points/month</span>
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex flex-col sm:flex-row sm:items-center">
                          <div className="sm:w-1/3 font-medium text-sm">Gold to Platinum</div>
                          <div className="sm:w-2/3 mt-1 sm:mt-0">
                            <div className="h-2 bg-gray-200 rounded-full">
                              <div className="h-2 bg-purple-500 rounded-full" style={{ width: '75%' }}></div>
                            </div>
                            <div className="flex justify-between mt-1 text-xs text-gray-500">
                              <span>50,000 points</span>
                              <span>100,000 points/month</span>
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      <p className="text-sm mt-4">Your tier is calculated based on your activity over the past 30 days and is updated automatically at the start of each month.</p>
                    </div>
                  </CardContent>
                </Card>
              </div>
              
              <div>
                <Card>
                  <CardHeader>
                    <CardTitle>Tier Benefits Calculator</CardTitle>
                    <CardDescription>See how much you can save</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="p-4 bg-gray-50 rounded-lg">
                        <h4 className="font-medium mb-3">Calculate your savings:</h4>
                        
                        <div className="space-y-3">
                          <div>
                            <div className="text-xs text-gray-500 mb-1">Select your tier:</div>
                            <div className="grid grid-cols-2 gap-2">
                              <Button variant="outline" className="justify-start">Standard</Button>
                              <Button variant="outline" className="justify-start">Silver</Button>
                              <Button variant="outline" className="justify-start">Gold</Button>
                              <Button variant="outline" className="justify-start"
                                onClick={() => markCompleted('membership')}>
                                Platinum
                              </Button>
                            </div>
                          </div>
                          
                          {completedTutorials.membership && (
                            <div className="p-3 bg-purple-50 rounded-md border border-purple-100">
                              <h5 className="font-medium text-purple-800">Platinum Benefits</h5>
                              <div className="mt-2 space-y-1 text-sm">
                                <div className="flex justify-between">
                                  <span className="text-gray-600">Standard Fee:</span>
                                  <span className="font-medium">0.5%</span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-gray-600">Your Fee:</span>
                                  <span className="font-medium text-green-600">0.25%</span>
                                </div>
                                <div className="flex justify-between mt-1 pt-1 border-t">
                                  <span className="text-gray-600">Monthly Savings:</span>
                                  <span className="font-medium text-green-600">~5,000 points</span>
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                      
                      <div className="p-4 bg-gray-50 rounded-lg mt-4">
                        <h4 className="font-medium mb-2">Tips for Tier Management</h4>
                        <ul className="text-sm space-y-2">
                          <li className="flex items-start">
                            <Info className="h-4 w-4 text-blue-500 mr-2 mt-0.5" />
                            <span>Your tier is recalculated at the start of each month</span>
                          </li>
                          <li className="flex items-start">
                            <Info className="h-4 w-4 text-blue-500 mr-2 mt-0.5" />
                            <span>Only points converted in the last 30 days count toward your tier status</span>
                          </li>
                          <li className="flex items-start">
                            <Info className="h-4 w-4 text-blue-500 mr-2 mt-0.5" />
                            <span>Both outgoing and incoming conversions count toward your total</span>
                          </li>
                          <li className="flex items-start">
                            <Star className="h-4 w-4 text-yellow-500 mr-2 mt-0.5" />
                            <span>Platinum members get VIP concierge service for complex conversions</span>
                          </li>
                        </ul>
                      </div>
                    </div>
                  </CardContent>
                  <CardFooter>
                    {completedTutorials.membership ? (
                      <div className="w-full flex items-center justify-between">
                        <Badge className="bg-green-100 text-green-800 hover:bg-green-100">
                          <CheckCircle2 className="h-3 w-3 mr-1" /> Completed
                        </Badge>
                        <Button variant="outline" size="sm" onClick={() => setCurrentTab('trading')}>
                          Next: P2P Trading <ChevronRight className="h-4 w-4 ml-1" />
                        </Button>
                      </div>
                    ) : (
                      <Button variant="outline" size="sm" className="ml-auto">Skip for now</Button>
                    )}
                  </CardFooter>
                </Card>
              </div>
            </div>
          </TabsContent>

          {/* Trading Tab */}
          <TabsContent value="trading" className="mt-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="md:col-span-2 space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Peer-to-Peer Trading</CardTitle>
                    <CardDescription>Learn how to trade loyalty points directly with other users</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <p>
                      P2P Trading lets you exchange points directly with other users, often at better rates than standard conversions.
                    </p>
                    
                    <div className="space-y-6 mt-4">
                      <div className="relative border rounded-lg p-4">
                        <div className="absolute -top-3 left-4 bg-white px-2 text-sm font-medium">Step 1: Browse Available Offers</div>
                        <p className="text-sm">Visit the Trading page to see what offers are available from other users:</p>
                        <div className="mt-3 p-3 bg-gray-50 rounded-md">
                          <div className="space-y-3">
                            <div className="flex justify-between items-center pb-2 border-b">
                              <div className="font-medium">Available Offers</div>
                              <Button variant="outline" size="sm">Create Offer</Button>
                            </div>
                            
                            <div className="flex items-center justify-between p-2 border rounded-md">
                              <div className="flex items-center">
                                <div className="h-8 w-8 rounded-full bg-red-100 flex items-center justify-center">
                                  <span className="font-medium text-red-700">Q</span>
                                </div>
                                <div className="mx-2">
                                  <ArrowRight className="h-4 w-4 text-gray-400" />
                                </div>
                                <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center">
                                  <span className="font-medium text-blue-700">V</span>
                                </div>
                                <div className="ml-3">
                                  <div className="text-sm font-medium">15,000 Qantas → 12,000 Velocity</div>
                                  <div className="text-xs text-gray-500">Rate: 0.8 (Standard: 0.7)</div>
                                </div>
                              </div>
                              <Button size="sm">View</Button>
                            </div>
                            
                            <div className="flex items-center justify-between p-2 border rounded-md">
                              <div className="flex items-center">
                                <div className="h-8 w-8 rounded-full bg-yellow-100 flex items-center justify-center">
                                  <span className="font-medium text-yellow-700">G</span>
                                </div>
                                <div className="mx-2">
                                  <ArrowRight className="h-4 w-4 text-gray-400" />
                                </div>
                                <div className="h-8 w-8 rounded-full bg-purple-100 flex items-center justify-center">
                                  <span className="font-medium text-purple-700">A</span>
                                </div>
                                <div className="ml-3">
                                  <div className="text-sm font-medium">5,000 GYG → 7,500 Amex</div>
                                  <div className="text-xs text-gray-500">Rate: 1.5 (Standard: 1.35)</div>
                                </div>
                              </div>
                              <Button size="sm">View</Button>
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      <div className="relative border rounded-lg p-4">
                        <div className="absolute -top-3 left-4 bg-white px-2 text-sm font-medium">Step 2: Create Your Own Trade Offer</div>
                        <p className="text-sm">If you don't find what you're looking for, create your own trade offer:</p>
                        <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <div className="p-3 bg-gray-50 rounded-md">
                            <div className="text-xs text-gray-500 mb-1">You Give</div>
                            <div className="flex items-center">
                              <div className="h-6 w-6 rounded-full bg-green-100 flex items-center justify-center">
                                <span className="font-medium text-green-700 text-xs">F</span>
                              </div>
                              <div className="ml-2 font-medium text-sm">10,000 Flybuys</div>
                            </div>
                          </div>
                          <div className="p-3 bg-gray-50 rounded-md">
                            <div className="text-xs text-gray-500 mb-1">You Receive</div>
                            <div className="flex items-center">
                              <div className="h-6 w-6 rounded-full bg-indigo-100 flex items-center justify-center">
                                <span className="font-medium text-indigo-700 text-xs">M</span>
                              </div>
                              <div className="ml-2 font-medium text-sm">8,000 Marriott</div>
                            </div>
                          </div>
                        </div>
                        <div className="mt-3 p-3 bg-gray-50 rounded-md">
                          <div className="flex items-center justify-between">
                            <div>
                              <div className="text-xs text-gray-500">Proposed Rate</div>
                              <div className="font-medium">1 Flybuys = 0.8 Marriott</div>
                            </div>
                            <div className="text-right">
                              <div className="text-xs text-gray-500">Standard Rate</div>
                              <div className="font-medium">1 Flybuys = 0.75 Marriott</div>
                            </div>
                          </div>
                          <div className="mt-3 flex justify-between items-center">
                            <div className="text-xs text-green-600 flex items-center">
                              <CheckCircle2 className="h-3 w-3 mr-1" />
                              Better than standard rate
                            </div>
                            <Button size="sm">Create Offer</Button>
                          </div>
                        </div>
                      </div>
                      
                      <div className="relative border rounded-lg p-4">
                        <div className="absolute -top-3 left-4 bg-white px-2 text-sm font-medium">Step 3: Accept a Trade</div>
                        <p className="text-sm">When you find an offer you like, you can accept the trade:</p>
                        <div className="mt-3 p-3 bg-gray-50 rounded-md">
                          <div className="border-b pb-3">
                            <div className="text-sm font-medium">Offer Details</div>
                            <div className="flex items-center mt-2">
                              <div className="h-8 w-8 rounded-full bg-red-100 flex items-center justify-center">
                                <span className="font-medium text-red-700">Q</span>
                              </div>
                              <div className="mx-2">
                                <ArrowRight className="h-4 w-4 text-gray-400" />
                              </div>
                              <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center">
                                <span className="font-medium text-blue-700">V</span>
                              </div>
                              <div className="ml-3">
                                <div className="text-sm font-medium">15,000 Qantas → 12,000 Velocity</div>
                                <div className="text-xs text-gray-500">Rate: 0.8 (Standard: 0.7)</div>
                              </div>
                            </div>
                          </div>
                          <div className="pt-3">
                            <div className="flex items-center justify-between">
                              <div>
                                <div className="text-xs text-gray-500">Your Savings</div>
                                <div className="font-medium text-green-600">+1,500 Velocity Points</div>
                              </div>
                              <div className="text-right">
                                <div className="text-xs text-gray-500">Trading Fee</div>
                                <div className="font-medium">180 Points (1.5%)</div>
                              </div>
                            </div>
                            <div className="mt-3 flex justify-end">
                              <Button size="sm">Accept Trade</Button>
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      <div className="relative border rounded-lg p-4">
                        <div className="absolute -top-3 left-4 bg-white px-2 text-sm font-medium">Step 4: Complete the Transaction</div>
                        <p className="text-sm">When both parties agree, the trade is executed automatically:</p>
                        <ul className="list-disc list-inside text-sm mt-2 space-y-1">
                          <li>Points are securely held in escrow during the transaction</li>
                          <li>Both parties receive their respective points simultaneously</li>
                          <li>The transaction is added to your trading history</li>
                        </ul>
                        <div className="mt-3 p-3 bg-green-50 rounded-md border border-green-100">
                          <div className="flex items-start">
                            <CheckCircle2 className="h-5 w-5 text-green-500 mt-0.5 mr-2" />
                            <div>
                              <div className="font-medium text-green-800">Trade Complete!</div>
                              <div className="text-xs text-green-700">You received 12,000 Velocity Points</div>
                              <div className="text-xs text-green-700 mt-1">Transaction ID: TX78215912</div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
              
              <div>
                <Card>
                  <CardHeader>
                    <CardTitle>Trading Simulator</CardTitle>
                    <CardDescription>Practice creating and accepting trades</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="p-4 bg-gray-50 rounded-lg">
                        <h4 className="font-medium mb-3">Choose an action:</h4>
                        
                        <div className="space-y-3">
                          <Button 
                            variant="outline" 
                            className="w-full justify-start" 
                            onClick={() => markCompleted('trading')}
                          >
                            <Handshake className="h-4 w-4 mr-2" />
                            Accept a trade offer
                          </Button>
                          
                          <Button variant="outline" className="w-full justify-start">
                            <PencilRuler className="h-4 w-4 mr-2" />
                            Create a new trade offer
                          </Button>
                          
                          {completedTutorials.trading && (
                            <div className="p-3 bg-green-50 rounded-md border border-green-100 mt-4">
                              <div className="flex items-start">
                                <CheckCircle2 className="h-5 w-5 text-green-500 mt-0.5 mr-2" />
                                <div>
                                  <div className="font-medium text-green-800">Trade Accepted!</div>
                                  <div className="text-xs text-green-700">You received 7,500 Amex Points</div>
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                      
                      <div className="p-4 bg-gray-50 rounded-lg mt-4">
                        <h4 className="font-medium mb-2">Trading Tips & Benefits</h4>
                        <ul className="text-sm space-y-2">
                          <li className="flex items-start">
                            <BadgeDollarSign className="h-4 w-4 text-green-500 mr-2 mt-0.5" />
                            <span>Trading can offer better rates than standard conversions</span>
                          </li>
                          <li className="flex items-start">
                            <Coins className="h-4 w-4 text-yellow-500 mr-2 mt-0.5" />
                            <span>The platform charges a small fee (typically 1-3% based on your tier)</span>
                          </li>
                          <li className="flex items-start">
                            <PersonStanding className="h-4 w-4 text-blue-500 mr-2 mt-0.5" />
                            <span>Users with higher reputation get priority listing</span>
                          </li>
                          <li className="flex items-start">
                            <Gift className="h-4 w-4 text-purple-500 mr-2 mt-0.5" />
                            <span>Trading activity counts toward your monthly points total for tier progression</span>
                          </li>
                        </ul>
                      </div>
                    </div>
                  </CardContent>
                  <CardFooter>
                    {completedTutorials.trading ? (
                      <div className="w-full flex items-center justify-between">
                        <Badge className="bg-green-100 text-green-800 hover:bg-green-100">
                          <CheckCircle2 className="h-3 w-3 mr-1" /> Completed
                        </Badge>
                        <Button variant="outline" size="sm" onClick={() => setCurrentTab('explorer')}>
                          Next: Transparency Explorer <ChevronRight className="h-4 w-4 ml-1" />
                        </Button>
                      </div>
                    ) : (
                      <Button variant="outline" size="sm" className="ml-auto">Skip for now</Button>
                    )}
                  </CardFooter>
                </Card>
              </div>
            </div>
          </TabsContent>

          {/* Explorer Tab */}
          <TabsContent value="explorer" className="mt-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="md:col-span-2 space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Transparency Explorer</CardTitle>
                    <CardDescription>Learn how to use the Transparency Explorer to track market data</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <p>
                      The Transparency Explorer provides insights into platform-wide data and market trends.
                    </p>
                    
                    <div className="space-y-6 mt-4">
                      <div className="relative border rounded-lg p-4">
                        <div className="absolute -top-3 left-4 bg-white px-2 text-sm font-medium">1. Market Trends</div>
                        <p className="text-sm">View conversion trends and popular exchange routes:</p>
                        <div className="mt-3 p-3 bg-gray-50 rounded-md">
                          <div className="flex justify-between mb-3">
                            <div className="font-medium">Conversion Volume by Program</div>
                            <div className="text-sm text-gray-500">Last 30 days</div>
                          </div>
                          <div className="grid grid-cols-3 gap-3">
                            <div className="bg-white p-2 rounded border">
                              <div className="flex items-center">
                                <div className="h-8 w-8 rounded-full bg-red-100 flex items-center justify-center">
                                  <span className="font-medium text-red-700">Q</span>
                                </div>
                                <div className="ml-2">
                                  <div className="text-xs text-gray-500">Qantas</div>
                                  <div className="font-medium">25%</div>
                                </div>
                              </div>
                            </div>
                            <div className="bg-white p-2 rounded border">
                              <div className="flex items-center">
                                <div className="h-8 w-8 rounded-full bg-primary-100 flex items-center justify-center">
                                  <span className="font-medium text-primary-700">X</span>
                                </div>
                                <div className="ml-2">
                                  <div className="text-xs text-gray-500">xPoints</div>
                                  <div className="font-medium">27%</div>
                                </div>
                              </div>
                            </div>
                            <div className="bg-white p-2 rounded border">
                              <div className="flex items-center">
                                <div className="h-8 w-8 rounded-full bg-yellow-100 flex items-center justify-center">
                                  <span className="font-medium text-yellow-700">G</span>
                                </div>
                                <div className="ml-2">
                                  <div className="text-xs text-gray-500">GYG</div>
                                  <div className="font-medium">18%</div>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      <div className="relative border rounded-lg p-4">
                        <div className="absolute -top-3 left-4 bg-white px-2 text-sm font-medium">2. Exchange Rates</div>
                        <p className="text-sm">Monitor current and historical exchange rates between all programs:</p>
                        <div className="mt-3 p-3 bg-gray-50 rounded-md">
                          <div className="flex justify-between mb-3">
                            <div className="font-medium">Current Exchange Rates</div>
                            <div className="text-sm text-gray-500">Updated: Just now</div>
                          </div>
                          <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200">
                              <thead>
                                <tr>
                                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">From</th>
                                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">To</th>
                                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">Rate</th>
                                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">24h Change</th>
                                </tr>
                              </thead>
                              <tbody className="bg-white divide-y divide-gray-200">
                                <tr>
                                  <td className="px-3 py-2 whitespace-nowrap text-sm">
                                    <div className="flex items-center">
                                      <div className="h-6 w-6 rounded-full bg-red-100 flex items-center justify-center mr-2">
                                        <span className="font-medium text-red-700 text-xs">Q</span>
                                      </div>
                                      <span>QANTAS</span>
                                    </div>
                                  </td>
                                  <td className="px-3 py-2 whitespace-nowrap text-sm">
                                    <div className="flex items-center">
                                      <div className="h-6 w-6 rounded-full bg-primary-100 flex items-center justify-center mr-2">
                                        <span className="font-medium text-primary-700 text-xs">X</span>
                                      </div>
                                      <span>XPOINTS</span>
                                    </div>
                                  </td>
                                  <td className="px-3 py-2 whitespace-nowrap text-sm font-medium">
                                    1 : 0.5
                                  </td>
                                  <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-500">
                                    No change
                                  </td>
                                </tr>
                                <tr>
                                  <td className="px-3 py-2 whitespace-nowrap text-sm">
                                    <div className="flex items-center">
                                      <div className="h-6 w-6 rounded-full bg-yellow-100 flex items-center justify-center mr-2">
                                        <span className="font-medium text-yellow-700 text-xs">G</span>
                                      </div>
                                      <span>GYG</span>
                                    </div>
                                  </td>
                                  <td className="px-3 py-2 whitespace-nowrap text-sm">
                                    <div className="flex items-center">
                                      <div className="h-6 w-6 rounded-full bg-primary-100 flex items-center justify-center mr-2">
                                        <span className="font-medium text-primary-700 text-xs">X</span>
                                      </div>
                                      <span>XPOINTS</span>
                                    </div>
                                  </td>
                                  <td className="px-3 py-2 whitespace-nowrap text-sm font-medium">
                                    1 : 0.8
                                  </td>
                                  <td className="px-3 py-2 whitespace-nowrap text-sm text-green-500">
                                    +0.1
                                  </td>
                                </tr>
                              </tbody>
                            </table>
                          </div>
                        </div>
                      </div>
                      
                      <div className="relative border rounded-lg p-4">
                        <div className="absolute -top-3 left-4 bg-white px-2 text-sm font-medium">3. Points in Circulation</div>
                        <p className="text-sm">See how many points are circulating in each loyalty program:</p>
                        <div className="mt-3 p-3 bg-gray-50 rounded-md">
                          <div className="flex justify-between mb-3">
                            <div className="font-medium">Points Distribution</div>
                            <div className="text-sm text-gray-500">Total: 57.4M</div>
                          </div>
                          <div className="space-y-3">
                            <div>
                              <div className="flex justify-between text-sm">
                                <span>Qantas</span>
                                <span className="font-medium">12.5M (21%)</span>
                              </div>
                              <div className="mt-1 h-2 bg-gray-200 rounded-full">
                                <div className="h-2 bg-red-500 rounded-full" style={{ width: '21%' }}></div>
                              </div>
                            </div>
                            <div>
                              <div className="flex justify-between text-sm">
                                <span>GYG</span>
                                <span className="font-medium">8.4M (14%)</span>
                              </div>
                              <div className="mt-1 h-2 bg-gray-200 rounded-full">
                                <div className="h-2 bg-yellow-500 rounded-full" style={{ width: '14%' }}></div>
                              </div>
                            </div>
                            <div>
                              <div className="flex justify-between text-sm">
                                <span>xPoints</span>
                                <span className="font-medium">2.8M (5%)</span>
                              </div>
                              <div className="mt-1 h-2 bg-gray-200 rounded-full">
                                <div className="h-2 bg-primary rounded-full" style={{ width: '5%' }}></div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="p-4 bg-gray-50 rounded-lg mt-6">
                      <h4 className="font-medium mb-2">How to Use the Explorer</h4>
                      <div className="space-y-3 text-sm">
                        <div className="flex items-start">
                          <div className="h-5 w-5 rounded-full bg-blue-100 flex items-center justify-center mt-0.5 mr-2">
                            <span className="font-medium text-blue-700 text-xs">1</span>
                          </div>
                          <div>
                            <span className="font-medium">Market Timing:</span> Use the Explorer to identify the best times to convert points based on rate trends.
                          </div>
                        </div>
                        <div className="flex items-start">
                          <div className="h-5 w-5 rounded-full bg-blue-100 flex items-center justify-center mt-0.5 mr-2">
                            <span className="font-medium text-blue-700 text-xs">2</span>
                          </div>
                          <div>
                            <span className="font-medium">Rate Comparison:</span> Compare current rates to historical averages to determine if it's a good time to convert.
                          </div>
                        </div>
                        <div className="flex items-start">
                          <div className="h-5 w-5 rounded-full bg-blue-100 flex items-center justify-center mt-0.5 mr-2">
                            <span className="font-medium text-blue-700 text-xs">3</span>
                          </div>
                          <div>
                            <span className="font-medium">Market Analysis:</span> Identify which programs are growing in popularity based on circulation data.
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
              
              <div>
                <Card>
                  <CardHeader>
                    <CardTitle>Explorer Quiz</CardTitle>
                    <CardDescription>Test your knowledge of the Explorer</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="p-4 bg-gray-50 rounded-lg">
                        <h4 className="font-medium mb-3">Answer the following question:</h4>
                        
                        <div className="p-3 bg-white rounded-md border mb-4">
                          <p className="text-sm">Which tab in the Explorer shows the exchange rates between different loyalty programs?</p>
                        </div>
                        
                        <div className="space-y-2">
                          <Button 
                            variant="outline" 
                            className="w-full justify-start text-left"
                            onClick={() => alert("Not quite! Try again.")}
                          >
                            Market Trends
                          </Button>
                          <Button 
                            variant="outline" 
                            className="w-full justify-start text-left"
                            onClick={() => markCompleted('explorer')}
                          >
                            Exchange Rates
                          </Button>
                          <Button 
                            variant="outline" 
                            className="w-full justify-start text-left"
                            onClick={() => alert("Not quite! Try again.")}
                          >
                            Points in Circulation
                          </Button>
                        </div>
                        
                        {completedTutorials.explorer && (
                          <div className="p-3 bg-green-50 rounded-md border border-green-100 mt-4">
                            <div className="flex items-start">
                              <CheckCircle2 className="h-5 w-5 text-green-500 mt-0.5 mr-2" />
                              <div>
                                <div className="font-medium text-green-800">Correct!</div>
                                <div className="text-xs text-green-700">The Exchange Rates tab shows current and historical rates between programs.</div>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                      
                      <div className="p-4 bg-gray-50 rounded-lg mt-4">
                        <h4 className="font-medium mb-2">Explorer Features</h4>
                        <ul className="text-sm space-y-2">
                          <li className="flex items-start">
                            <Info className="h-4 w-4 text-blue-500 mr-2 mt-0.5" />
                            <span>Filter data by time period (7 days to 12 months)</span>
                          </li>
                          <li className="flex items-start">
                            <Info className="h-4 w-4 text-blue-500 mr-2 mt-0.5" />
                            <span>Export data for your own analysis</span>
                          </li>
                          <li className="flex items-start">
                            <Info className="h-4 w-4 text-blue-500 mr-2 mt-0.5" />
                            <span>View global distribution map of loyalty points</span>
                          </li>
                          <li className="flex items-start">
                            <Star className="h-4 w-4 text-yellow-500 mr-2 mt-0.5" />
                            <span>Higher tier members get access to more detailed analytics</span>
                          </li>
                        </ul>
                      </div>
                    </div>
                  </CardContent>
                  <CardFooter>
                    {completedTutorials.explorer ? (
                      <div className="w-full flex items-center justify-between">
                        <Badge className="bg-green-100 text-green-800 hover:bg-green-100">
                          <CheckCircle2 className="h-3 w-3 mr-1" /> Completed
                        </Badge>
                        <Button variant="default" onClick={() => alert("Congratulations! You've completed all the tutorials.")}>
                          Finish Tutorials <GraduationCap className="h-4 w-4 ml-1" />
                        </Button>
                      </div>
                    ) : (
                      <Button variant="outline" size="sm" className="ml-auto">Skip for now</Button>
                    )}
                  </CardFooter>
                </Card>
                
                {completedCount === totalTutorials && (
                  <Card className="mt-6 bg-green-50 border-green-200">
                    <CardHeader>
                      <CardTitle className="text-green-800 flex items-center">
                        <GraduationCap className="h-5 w-5 mr-2" />
                        Tutorial Complete!
                      </CardTitle>
                      <CardDescription className="text-green-700">
                        You've completed all tutorial sections
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-green-800">
                        Congratulations! You now have a comprehensive understanding of the xPoints Exchange platform. 
                        You're ready to start converting and trading loyalty points like a pro.
                      </p>
                    </CardContent>
                    <CardFooter>
                      <Link to="/">
                        <Button className="w-full">
                          Return to Dashboard
                        </Button>
                      </Link>
                    </CardFooter>
                  </Card>
                )}
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>

  );
};

export default TutorialPage;