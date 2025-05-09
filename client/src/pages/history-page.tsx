import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/hooks/use-auth';
import { Transaction, LoyaltyProgram } from '@shared/schema';
import { useIsMobile } from '@/hooks/use-mobile';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { 
  ArrowUpRight, ArrowDownRight, Calendar, 
  Download, Filter, Search, SortDesc
} from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from '@/components/ui/badge';

// Helper function to get program name for display
function getProgramName(program: LoyaltyProgram): string {
  const names: Record<LoyaltyProgram, string> = {
    'QANTAS': 'Qantas',
    'GYG': 'GYG',
    'XPOINTS': 'xPoints',
    'VELOCITY': 'Velocity',
    'AMEX': 'Amex',
    'FLYBUYS': 'Flybuys',
    'HILTON': 'Hilton',
    'MARRIOTT': 'Marriott',
    'AIRBNB': 'Airbnb',
    'DELTA': 'Delta',
  };
  return names[program] || program;
}

export default function HistoryPage() {
  const { user } = useAuth();
  const isMobile = useIsMobile();
  const [filterText, setFilterText] = useState<string>('');
  const [selectedType, setSelectedType] = useState<string>('all');
  const [dateRange, setDateRange] = useState<string>('all-time');
  
  // Fetch user transactions
  const { data: transactions = [] } = useQuery<Transaction[]>({
    queryKey: ['/api/transactions'],
    enabled: !!user,
  });
  
  // Process transactions
  const processedTransactions = transactions.map(transaction => ({
    id: transaction.id,
    date: new Date(transaction.timestamp).toLocaleDateString(),
    time: new Date(transaction.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    timestamp: new Date(transaction.timestamp).getTime(),
    fromProgram: getProgramName(transaction.fromProgram as LoyaltyProgram),
    toProgram: getProgramName(transaction.toProgram as LoyaltyProgram),
    amount: transaction.amountFrom,
    fee: transaction.feeApplied,
    isIncoming: transaction.toProgram === 'XPOINTS',
    isOutgoing: transaction.fromProgram === 'XPOINTS',
    type: transaction.toProgram === 'XPOINTS' 
      ? 'incoming' 
      : transaction.fromProgram === 'XPOINTS' 
        ? 'outgoing' 
        : 'convert',
  }));
  
  // Apply filters
  const filteredTransactions = processedTransactions
    .filter(tx => {
      if (filterText) {
        const searchTerm = filterText.toLowerCase();
        return (
          tx.fromProgram.toLowerCase().includes(searchTerm) ||
          tx.toProgram.toLowerCase().includes(searchTerm) ||
          tx.amount.toString().includes(searchTerm)
        );
      }
      return true;
    })
    .filter(tx => {
      if (selectedType === 'all') return true;
      return tx.type === selectedType;
    })
    .filter(tx => {
      const now = new Date();
      
      if (dateRange === 'all-time') return true;
      if (dateRange === 'this-month') {
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        return tx.timestamp >= startOfMonth.getTime();
      }
      if (dateRange === 'last-month') {
        const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        const startOfThisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        return tx.timestamp >= startOfLastMonth.getTime() && tx.timestamp < startOfThisMonth.getTime();
      }
      if (dateRange === 'last-7-days') {
        const last7Days = new Date();
        last7Days.setDate(now.getDate() - 7);
        return tx.timestamp >= last7Days.getTime();
      }
      return true;
    })
    .sort((a, b) => b.timestamp - a.timestamp);
  
  // Transaction type options
  const transactionTypes = [
    { value: 'all', label: 'All Transactions' },
    { value: 'incoming', label: 'Incoming' },
    { value: 'outgoing', label: 'Outgoing' },
    { value: 'convert', label: 'Conversions' },
  ];
  
  // Date range options
  const dateRanges = [
    { value: 'all-time', label: 'All Time' },
    { value: 'this-month', label: 'This Month' },
    { value: 'last-month', label: 'Last Month' },
    { value: 'last-7-days', label: 'Last 7 Days' },
  ];

  return (
    <div className="container mx-auto max-w-7xl p-4 sm:p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">Transaction History</h1>
        <p className="text-muted-foreground">View and track all your point exchanges and transactions</p>
      </div>
      
      {/* Filters */}
      <Card className="mb-6">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="text-sm font-medium text-gray-700 mb-1 block">Transaction Type</label>
              <Select value={selectedType} onValueChange={setSelectedType}>
                <SelectTrigger>
                  <SelectValue placeholder="All Transactions" />
                </SelectTrigger>
                <SelectContent>
                  {transactionTypes.map(type => (
                    <SelectItem key={type.value} value={type.value}>{type.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <label className="text-sm font-medium text-gray-700 mb-1 block">Date Range</label>
              <Select value={dateRange} onValueChange={setDateRange}>
                <SelectTrigger>
                  <SelectValue placeholder="All Time" />
                </SelectTrigger>
                <SelectContent>
                  {dateRanges.map(range => (
                    <SelectItem key={range.value} value={range.value}>{range.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="md:col-span-2">
              <label className="text-sm font-medium text-gray-700 mb-1 block">Search</label>
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
                <Input
                  placeholder="Search by program or amount..."
                  className="pl-9"
                  value={filterText}
                  onChange={(e) => setFilterText(e.target.value)}
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
      
      {/* Transaction History Table */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex justify-between items-center">
            <CardTitle className="text-lg">{filteredTransactions.length} Transactions</CardTitle>
            <Button variant="outline" size="sm" className="hidden md:flex items-center gap-1">
              <Download className="h-4 w-4 mr-1" />
              Export
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {filteredTransactions.length > 0 ? (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[180px]">Date & Time</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>From</TableHead>
                    <TableHead>To</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                    <TableHead className="text-right">Fee</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredTransactions.map((tx) => (
                    <TableRow key={tx.id}>
                      <TableCell className="font-medium">
                        <div>{tx.date}</div>
                        <div className="text-xs text-muted-foreground">{tx.time}</div>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={tx.isIncoming ? "success" : tx.isOutgoing ? "default" : "secondary"}
                          className="flex items-center gap-1 w-fit"
                        >
                          {tx.isIncoming ? (
                            <ArrowDownRight className="h-3 w-3" />
                          ) : (
                            <ArrowUpRight className="h-3 w-3" />
                          )}
                          <span>
                            {tx.isIncoming 
                              ? 'Received' 
                              : tx.isOutgoing 
                                ? 'Sent' 
                                : 'Converted'}
                          </span>
                        </Badge>
                      </TableCell>
                      <TableCell>{tx.fromProgram}</TableCell>
                      <TableCell>{tx.toProgram}</TableCell>
                      <TableCell className="text-right font-medium">
                        {tx.amount.toLocaleString()}
                      </TableCell>
                      <TableCell className="text-right">
                        {tx.fee > 0 ? tx.fee.toLocaleString() : '-'}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="text-center py-10 border rounded-md">
              <p className="text-muted-foreground">No transactions found matching your filters</p>
              <Button 
                variant="link" 
                className="mt-2"
                onClick={() => {
                  setFilterText('');
                  setSelectedType('all');
                  setDateRange('all-time');
                }}
              >
                Clear all filters
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}