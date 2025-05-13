import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { 
  ShieldCheck, 
  AlertTriangle, 
  ExternalLink, 
  Search, 
  Check, 
  Clock,
  Info,
  X
} from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';

interface RateVerification {
  isVerified: boolean;
  source: string;
  pointValue: number;
  lastVerified: Date;
  termsUrl: string;
  notes: string;
}

interface VerifiedExchangeRate {
  id: number;
  fromProgram: string;
  toProgram: string;
  rate: string;
  updatedAt: Date;
  verification: RateVerification;
}

export function VerifiedRatesTable() {
  const [searchQuery, setSearchQuery] = useState('');
  
  // Fetch verified exchange rates
  const { data: verifiedRates, isLoading } = useQuery<VerifiedExchangeRate[]>({
    queryKey: ['/api/exchange-rates/verified/all'],
  });
  
  // Filter rates based on search query
  const filteredRates = verifiedRates?.filter((rate) => {
    if (!searchQuery) return true;
    const lowerQuery = searchQuery.toLowerCase();
    return (
      rate.fromProgram.toLowerCase().includes(lowerQuery) ||
      rate.toProgram.toLowerCase().includes(lowerQuery)
    );
  });
  
  // Format date to readable format
  const formatDate = (date: Date) => {
    return format(new Date(date), 'MMM d, yyyy');
  };
  
  // Calculate days since verification
  const getDaysSince = (date: Date) => {
    const now = new Date();
    const verifiedDate = new Date(date);
    const diffTime = Math.abs(now.getTime() - verifiedDate.getTime());
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };
  
  // Determine verification status badge
  const getVerificationBadge = (verification: RateVerification) => {
    if (!verification.isVerified) {
      return (
        <Badge variant="destructive" className="flex items-center gap-1">
          <AlertTriangle className="h-3 w-3" />
          <span>Unverified</span>
        </Badge>
      );
    }
    
    const daysSince = getDaysSince(verification.lastVerified);
    
    if (daysSince <= 1) {
      return (
        <Badge variant="success" className="flex items-center gap-1 bg-green-500">
          <Check className="h-3 w-3" />
          <span>Verified Today</span>
        </Badge>
      );
    } else if (daysSince <= 7) {
      return (
        <Badge variant="outline" className="flex items-center gap-1 border-green-500 text-green-600">
          <ShieldCheck className="h-3 w-3" />
          <span>Verified {daysSince} days ago</span>
        </Badge>
      );
    } else {
      return (
        <Badge variant="outline" className="flex items-center gap-1">
          <Clock className="h-3 w-3" />
          <span>Verified {daysSince} days ago</span>
        </Badge>
      );
    }
  };
  
  return (
    <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
      <div className="px-6 py-5 border-b">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <h2 className="text-xl font-semibold flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-primary" />
            <span>Verified Exchange Rates</span>
          </h2>
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search programs..."
              className="pl-9"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>
      </div>
      
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>From Program</TableHead>
              <TableHead>To Program</TableHead>
              <TableHead>Rate</TableHead>
              <TableHead>Dollar Value</TableHead>
              <TableHead>Verification</TableHead>
              <TableHead>Source</TableHead>
              <TableHead className="text-right">Terms</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array(5).fill(0).map((_, index) => (
                <TableRow key={index}>
                  <TableCell><Skeleton className="h-6 w-24" /></TableCell>
                  <TableCell><Skeleton className="h-6 w-24" /></TableCell>
                  <TableCell><Skeleton className="h-6 w-16" /></TableCell>
                  <TableCell><Skeleton className="h-6 w-20" /></TableCell>
                  <TableCell><Skeleton className="h-6 w-32" /></TableCell>
                  <TableCell><Skeleton className="h-6 w-28" /></TableCell>
                  <TableCell><Skeleton className="h-6 w-10 ml-auto" /></TableCell>
                </TableRow>
              ))
            ) : filteredRates?.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                  {searchQuery ? (
                    <div className="flex flex-col items-center gap-2">
                      <AlertTriangle className="h-5 w-5" />
                      <p>No exchange rates found matching "{searchQuery}"</p>
                      <Button variant="ghost" size="sm" onClick={() => setSearchQuery('')}>
                        Clear search
                      </Button>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center gap-2">
                      <Info className="h-5 w-5" />
                      <p>No exchange rates available</p>
                    </div>
                  )}
                </TableCell>
              </TableRow>
            ) : (
              filteredRates?.map((rate) => (
                <TableRow key={`${rate.fromProgram}-${rate.toProgram}`} className="hover:bg-muted/50">
                  <TableCell className="font-medium">{rate.fromProgram}</TableCell>
                  <TableCell>{rate.toProgram}</TableCell>
                  <TableCell className="font-mono">{parseFloat(rate.rate).toFixed(6)}</TableCell>
                  <TableCell>${rate.verification.pointValue.toFixed(4)}</TableCell>
                  <TableCell>
                    <div className="flex flex-col gap-1">
                      {getVerificationBadge(rate.verification)}
                      <span className="text-xs text-muted-foreground">
                        Last checked: {formatDate(rate.verification.lastVerified)}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <div className={cn(
                            "max-w-[140px] truncate text-sm", 
                            !rate.verification.isVerified && "text-muted-foreground line-through"
                          )}>
                            {rate.verification.source || "Not verified"}
                          </div>
                        </TooltipTrigger>
                        <TooltipContent>
                          <div className="max-w-[300px]">
                            {rate.verification.notes || "No additional information available"}
                          </div>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </TableCell>
                  <TableCell className="text-right">
                    {rate.verification.termsUrl ? (
                      <Button variant="ghost" size="icon" asChild>
                        <a 
                          href={rate.verification.termsUrl} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          aria-label="View terms and conditions"
                        >
                          <ExternalLink className="h-4 w-4" />
                        </a>
                      </Button>
                    ) : (
                      <span className="text-muted-foreground">
                        <X className="h-4 w-4 inline-block" />
                      </span>
                    )}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
      
      <div className="px-6 py-4 bg-muted/30 border-t text-sm text-muted-foreground">
        <div className="flex items-center gap-2">
          <ShieldCheck className="h-4 w-4 text-green-600" />
          <span>
            All exchange rates are verified using official program documentation or direct API integrations. 
            View our <a href="/rate-verification" className="text-primary hover:underline">Rate Verification Policy</a> for more information.
          </span>
        </div>
      </div>
    </div>
  );
}