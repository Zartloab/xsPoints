import React from 'react';
import { useAuth } from '@/hooks/use-auth';
import { Redirect } from 'wouter';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import IntuitiveConversionWizard from '@/components/transaction/IntuitiveConversionWizard';
import { Banner } from '@/components/ui/banner';
import { ArrowRightLeft, Info, Lightbulb, Check, ChevronRight } from 'lucide-react';

export default function ConversionWizardPage() {
  const { user } = useAuth();
  
  // Redirect to auth page if not logged in
  if (!user) {
    return <Redirect to="/auth" />;
  }
  
  return (
    <div className="container mx-auto py-6">
      <Banner
        title="Intuitive Point Conversion"
        subtitle="Convert your loyalty points between programs with our step-by-step wizard"
        gradientColors={['from-blue-600', 'to-indigo-500']}
        pattern="dots"
        height="md"
        actionButton={
          <Button className="bg-white text-blue-600 hover:bg-blue-50">
            Learn About Conversions <ChevronRight className="ml-2 h-4 w-4" />
          </Button>
        }
      />
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main conversion wizard */}
        <div className="lg:col-span-2">
          <IntuitiveConversionWizard />
        </div>
        
        {/* Sidebar with helpful information */}
        <div className="space-y-6">
          {/* How It Works Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Info className="mr-2 h-5 w-5 text-primary" />
                How It Works
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex">
                  <div className="mr-3 h-7 w-7 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <span className="font-bold text-primary text-sm">1</span>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium">Select Programs</h3>
                    <p className="text-xs text-muted-foreground">
                      Choose which programs you want to convert between
                    </p>
                  </div>
                </div>
                
                <div className="flex">
                  <div className="mr-3 h-7 w-7 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <span className="font-bold text-primary text-sm">2</span>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium">Enter Amount</h3>
                    <p className="text-xs text-muted-foreground">
                      Specify how many points you want to convert
                    </p>
                  </div>
                </div>
                
                <div className="flex">
                  <div className="mr-3 h-7 w-7 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <span className="font-bold text-primary text-sm">3</span>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium">Review Details</h3>
                    <p className="text-xs text-muted-foreground">
                      Verify conversion details and exchange rates
                    </p>
                  </div>
                </div>
                
                <div className="flex">
                  <div className="mr-3 h-7 w-7 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <span className="font-bold text-primary text-sm">4</span>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium">Confirm Conversion</h3>
                    <p className="text-xs text-muted-foreground">
                      Complete your conversion and see the results
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
          
          {/* Tips Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Lightbulb className="mr-2 h-5 w-5 text-amber-500" />
                Conversion Tips
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3">
                <li className="flex">
                  <Check className="h-5 w-5 mr-2 text-green-500 flex-shrink-0" />
                  <p className="text-sm">
                    Convert to xPoints first for the best rates between other programs
                  </p>
                </li>
                <li className="flex">
                  <Check className="h-5 w-5 mr-2 text-green-500 flex-shrink-0" />
                  <p className="text-sm">
                    Check for special rate promotions that change monthly
                  </p>
                </li>
                <li className="flex">
                  <Check className="h-5 w-5 mr-2 text-green-500 flex-shrink-0" />
                  <p className="text-sm">
                    Avoid multiple conversions to minimize potential value loss
                  </p>
                </li>
                <li className="flex">
                  <Check className="h-5 w-5 mr-2 text-green-500 flex-shrink-0" />
                  <p className="text-sm">
                    Convert amounts under 10,000 points to avoid fees
                  </p>
                </li>
              </ul>
            </CardContent>
          </Card>
          
          {/* Did You Know Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Info className="mr-2 h-5 w-5 text-blue-500" />
                Did You Know?
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="bg-blue-50 p-4 rounded-lg text-sm text-blue-700">
                <p className="mb-2">
                  <span className="font-medium">Point Value Insight:</span> 1 xPoint is equal to approximately $0.01 USD.
                </p>
                <p>
                  This means 10,000 xPoints is worth about $100 in redemption value across our supported loyalty programs.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}