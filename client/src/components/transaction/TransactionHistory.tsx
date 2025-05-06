import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getQueryFn } from '@/lib/queryClient';
import { Transaction } from '@shared/schema';
import { useAuth } from '@/hooks/use-auth';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import ProgramIcon from '../loyaltyprograms/ProgramIcon';
import { Loader2 } from 'lucide-react';

type FilterType = 'all' | 'QANTAS' | 'GYG' | 'XPOINTS';
type DateRangeType = '7days' | '30days' | '90days' | 'all';

export default function TransactionHistory() {
  const { user } = useAuth();
  const [filter, setFilter] = useState<FilterType>('all');
  const [dateRange, setDateRange] = useState<DateRangeType>('7days');
  
  const { data: transactions, isLoading } = useQuery<Transaction[]>({
    queryKey: ['/api/transactions'],
    queryFn: getQueryFn({ on401: "throw" }),
    enabled: !!user,
  });
  
  const getFilteredTransactions = () => {
    if (!transactions) return [];
    
    // Filter by program if applicable
    let filtered = transactions;
    if (filter !== 'all') {
      filtered = transactions.filter(t => 
        t.fromProgram === filter || t.toProgram === filter
      );
    }
    
    // Filter by date range
    const now = new Date();
    let dateLimit = new Date();
    
    switch (dateRange) {
      case '7days':
        dateLimit.setDate(now.getDate() - 7);
        break;
      case '30days':
        dateLimit.setDate(now.getDate() - 30);
        break;
      case '90days':
        dateLimit.setDate(now.getDate() - 90);
        break;
      case 'all':
      default:
        dateLimit = new Date(0); // Beginning of time
        break;
    }
    
    return filtered.filter(t => new Date(t.timestamp) >= dateLimit);
  };

  const filteredTransactions = getFilteredTransactions();
  
  const formatDate = (timestamp: Date) => {
    const date = new Date(timestamp);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    });
  };
  
  const getProgramName = (program: string) => {
    switch (program) {
      case 'QANTAS': return 'Qantas';
      case 'GYG': return 'GYG';
      case 'XPOINTS': return 'xPoints';
      default: return program;
    }
  };

  return (
    <section id="history" className="mb-12">
      <div className="bg-white rounded-xl shadow-md p-6 border border-gray-100">
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-gray-900 mb-2 md:mb-0">Transaction History</h2>
          
          <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2">
            <div className="relative">
              <Select value={filter} onValueChange={(value) => setFilter(value as FilterType)}>
                <SelectTrigger className="w-full rounded-md border text-sm">
                  <SelectValue placeholder="All Programs" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Programs</SelectItem>
                  <SelectItem value="QANTAS">Qantas</SelectItem>
                  <SelectItem value="GYG">GYG</SelectItem>
                  <SelectItem value="XPOINTS">xPoints</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="relative">
              <Select value={dateRange} onValueChange={(value) => setDateRange(value as DateRangeType)}>
                <SelectTrigger className="w-full rounded-md border text-sm">
                  <SelectValue placeholder="Last 7 days" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="7days">Last 7 days</SelectItem>
                  <SelectItem value="30days">Last 30 days</SelectItem>
                  <SelectItem value="90days">Last 90 days</SelectItem>
                  <SelectItem value="all">All time</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
        
        <div className="overflow-x-auto">
          {isLoading ? (
            <div className="flex justify-center items-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : filteredTransactions.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No transactions found for the selected filters.
            </div>
          ) : (
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">From</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">To</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredTransactions.map((transaction) => (
                  <tr key={transaction.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatDate(transaction.timestamp)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <ProgramIcon program={transaction.fromProgram} className="h-8 w-8" />
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">{getProgramName(transaction.fromProgram)}</div>
                          <div className="text-xs text-gray-500">{transaction.amountFrom.toLocaleString()} points</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <ProgramIcon program={transaction.toProgram} className="h-8 w-8" />
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">{getProgramName(transaction.toProgram)}</div>
                          <div className="text-xs text-gray-500">{transaction.amountTo.toLocaleString()} points</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <div className="font-medium">
                        {transaction.amountFrom.toLocaleString()} → {transaction.amountTo.toLocaleString()}
                      </div>
                      <div className="text-xs text-gray-500">
                        Fee: {transaction.feeApplied} xPoints
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <Badge variant="success" className="px-2 py-1 text-xs">
                        {transaction.status.charAt(0).toUpperCase() + transaction.status.slice(1)}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
        
        <div className="mt-4 flex items-center justify-between">
          <div className="text-sm text-gray-500">
            Showing <span className="font-medium">1</span> to <span className="font-medium">{filteredTransactions.length}</span> of <span className="font-medium">{filteredTransactions.length}</span> transactions
          </div>
          
          <div className="flex space-x-2">
            <button disabled className="px-3 py-1 border border-gray-300 bg-white text-gray-500 rounded-md text-sm disabled:opacity-50 disabled:cursor-not-allowed">
              Previous
            </button>
            <button disabled className="px-3 py-1 border border-gray-300 bg-white text-gray-500 rounded-md text-sm disabled:opacity-50 disabled:cursor-not-allowed">
              Next
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
