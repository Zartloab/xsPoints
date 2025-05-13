import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Helmet } from 'react-helmet';
import { 
  ShieldCheck, 
  FileText, 
  Book, 
  Shield, 
  RefreshCw, 
  DollarSign 
} from 'lucide-react';
import { VerifiedRatesTable } from '@/components/exchange-rates/VerifiedRatesTable';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import { queryClient } from '@/lib/queryClient';

export default function RateVerificationPage() {
  const { toast } = useToast();
  const [isUpdating, setIsUpdating] = useState(false);

  interface ProgramInfo {
    program: string;
    name: string;
    dollarValue: number;
    isVerified: boolean;
    termsUrl: string;
    lastUpdated: Date;
  }

  // Fetch program info for dollar values
  const { data: programsInfo, isLoading } = useQuery<ProgramInfo[]>({
    queryKey: ['/api/loyalty-programs/info'],
  });

  // Sort programs by verification status
  const sortedPrograms = programsInfo?.sort((a: ProgramInfo, b: ProgramInfo) => {
    // First by verification status
    if (a.isVerified !== b.isVerified) {
      return a.isVerified ? -1 : 1;
    }
    // Then alphabetically by name
    return a.name.localeCompare(b.name);
  });

  const handleUpdateRates = async () => {
    setIsUpdating(true);
    try {
      await apiRequest('POST', '/api/exchange-rates/update');
      toast({
        title: "Success",
        description: "Exchange rates have been updated successfully.",
      });
      
      // Invalidate queries to force refresh
      queryClient.invalidateQueries({queryKey: ['/api/exchange-rates/verified/all']});
      queryClient.invalidateQueries({queryKey: ['/api/loyalty-programs/info']});
      
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update exchange rates. Please try again later.",
        variant: "destructive",
      });
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <Helmet>
        <title>Rate Verification Policy - xPoints Exchange</title>
        <meta 
          name="description" 
          content="Learn how xPoints Exchange verifies exchange rates between loyalty programs to ensure accuracy and transparency." 
        />
      </Helmet>

      <div className="flex flex-col gap-8">
        <div className="flex flex-col gap-2">
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <ShieldCheck className="h-8 w-8 text-primary" />
            <span>Rate Verification Policy</span>
          </h1>
          <p className="text-muted-foreground">
            Our transparent approach to ensuring accurate and factual exchange rates
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="md:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                <span>Our Verification Process</span>
              </CardTitle>
              <CardDescription>
                How we ensure accuracy and compliance
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <p>
                At xPoints Exchange, we're committed to providing accurate, transparent, and legally compliant 
                exchange rates for all loyalty programs on our platform. This document outlines our rigorous 
                verification process.
              </p>

              <h3 className="text-lg font-semibold">Verification Hierarchy</h3>
              <ol className="space-y-2 list-decimal list-inside pl-4">
                <li>
                  <span className="font-medium">Direct API Integration:</span> Whenever possible, we connect directly 
                  to loyalty program APIs to retrieve the most current point values and exchange rates.
                </li>
                <li>
                  <span className="font-medium">Official Documentation:</span> When direct API access is not available, 
                  we refer to the official terms and conditions, redemption charts, and published values from each 
                  loyalty program.
                </li>
                <li>
                  <span className="font-medium">Industry Standards:</span> In cases where neither API nor explicit 
                  documentation is available, we use industry standard valuations based on expert analysis and 
                  redemption studies.
                </li>
                <li>
                  <span className="font-medium">Transparent Fallbacks:</span> If a rate cannot be verified through 
                  the above methods, we clearly mark it as unverified and provide our best estimate with full 
                  transparency.
                </li>
              </ol>

              <h3 className="text-lg font-semibold mt-6">Dollar Value Standardization</h3>
              <p>
                All exchange rates are calculated based on a standardized dollar value for each point type.
                Our system uses xPoints as the base reference currency, with 1 xPoint having a fixed value of $0.01 USD.
                All other loyalty program points are valued relative to this standard based on their published 
                redemption values.
              </p>

              <h3 className="text-lg font-semibold mt-6">Legal Compliance</h3>
              <p>
                We maintain thorough records of our verification sources and regularly update our rates to ensure 
                ongoing accuracy. All rates include links to the official terms and conditions of each loyalty 
                program, allowing users to verify our calculations and understand any program-specific rules 
                that may apply.
              </p>
              
              <h3 className="text-lg font-semibold mt-6">Regular Updates</h3>
              <p>
                Our exchange rates are updated daily to reflect any changes in program valuations or market conditions.
                The verification date is clearly displayed for each rate, ensuring you always know when the rate was 
                last confirmed.
              </p>

              <div className="flex justify-end mt-4">
                <Button 
                  variant="outline" 
                  className="flex items-center gap-2"
                  onClick={handleUpdateRates}
                  disabled={isUpdating}
                >
                  <RefreshCw className={cn("h-4 w-4", isUpdating && "animate-spin")} />
                  <span>{isUpdating ? "Updating Rates..." : "Update Rates Now"}</span>
                </Button>
              </div>
            </CardContent>
          </Card>

          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <DollarSign className="h-5 w-5" />
                  <span>Dollar Values</span>
                </CardTitle>
                <CardDescription>
                  Current dollar value per point
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {isLoading ? (
                    <p>Loading program data...</p>
                  ) : (
                    <div className="space-y-2">
                      {sortedPrograms?.map((program: ProgramInfo) => (
                        <div key={program.program} className="flex justify-between items-center">
                          <div className="flex items-center gap-2">
                            <div className="w-4">
                              {program.isVerified && (
                                <ShieldCheck className="h-3 w-3 text-green-600" />
                              )}
                            </div>
                            <span>{program.name}</span>
                          </div>
                          <span className="font-mono font-medium">
                            ${program.dollarValue.toFixed(4)}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                  <p className="text-xs text-muted-foreground mt-4">
                    Dollar values shown represent the estimated value of 1 point in USD
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Book className="h-5 w-5" />
                  <span>Frequently Asked Questions</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Accordion type="single" collapsible className="w-full">
                  <AccordionItem value="item-1">
                    <AccordionTrigger>How are exchange rates calculated?</AccordionTrigger>
                    <AccordionContent>
                      Exchange rates are calculated based on the relative dollar value of each point type.
                      For example, if Program A points are worth $0.01 each and Program B points are worth $0.02 each,
                      the exchange rate from A to B would be 0.5 (you get 0.5 Program B points per 1 Program A point).
                    </AccordionContent>
                  </AccordionItem>
                  <AccordionItem value="item-2">
                    <AccordionTrigger>Why is verification important?</AccordionTrigger>
                    <AccordionContent>
                      Verification ensures that our exchange rates accurately reflect the true value of points
                      in each loyalty program, providing transparency and protection for our users. It also helps
                      us maintain legal compliance with loyalty program terms and conditions.
                    </AccordionContent>
                  </AccordionItem>
                  <AccordionItem value="item-3">
                    <AccordionTrigger>Why might a rate be unverified?</AccordionTrigger>
                    <AccordionContent>
                      A rate may be unverified if the loyalty program does not provide direct API access or
                      clear documentation of point values. In these cases, we provide our best estimate based on
                      industry standards and redemption analysis, but mark it as unverified for transparency.
                    </AccordionContent>
                  </AccordionItem>
                  <AccordionItem value="item-4">
                    <AccordionTrigger>How often are rates updated?</AccordionTrigger>
                    <AccordionContent>
                      Rates are updated daily through our automated system, which checks for changes in official
                      program values. Admin users can also trigger manual updates when necessary, such as when
                      loyalty programs announce significant changes to their point valuations.
                    </AccordionContent>
                  </AccordionItem>
                </Accordion>
              </CardContent>
            </Card>
          </div>
        </div>

        <VerifiedRatesTable />
      </div>
    </div>
  );
}