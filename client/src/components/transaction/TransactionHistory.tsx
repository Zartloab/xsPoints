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
      <div className="bg-white rounded-xl shadow-md overflow-hidden border-0">
        {/* Header with gradient background */}
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-blue-100 p-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between">
            <div className="flex items-center gap-3 mb-4 md:mb-0">
              <div className="p-2 rounded-full bg-blue-100 text-blue-600">
                <Loader2 className="h-5 w-5" />
              </div>
              <h2 className="text-xl font-bold text-gray-900">Transaction History</h2>
            </div>
            
            <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-3">
              <div className="relative">
                <Select value={filter} onValueChange={(value) => setFilter(value as FilterType)}>
                  <SelectTrigger className="w-full rounded-md border-blue-100 shadow-sm text-sm bg-white">
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
                  <SelectTrigger className="w-full rounded-md border-blue-100 shadow-sm text-sm bg-white">
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
        </div>
        
        <div className="overflow-x-auto">
          {isLoading ? (
            <div className="flex justify-center items-center py-16">
              <div className="text-center">
                <Loader2 className="h-10 w-10 animate-spin text-primary mx-auto mb-3" />
                <p className="text-gray-500">Loading transaction history...</p>
              </div>
            </div>
          ) : filteredTransactions.length === 0 ? (
            <div className="text-center py-16 px-4">
              <div className="p-3 bg-blue-50 rounded-full w-14 h-14 flex items-center justify-center mx-auto mb-3">
                <Loader2 className="h-8 w-8 text-blue-400" />
              </div>
              <h3 className="text-lg font-medium text-gray-800 mb-1">No transactions found</h3>
              <p className="text-gray-500 max-w-md mx-auto">
                Try adjusting your filters or convert some points to see transactions here.
              </p>
            </div>
          ) : (
            <table className="min-w-full divide-y divide-gray-100">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">From</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">To</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-100">
                {filteredTransactions.map((transaction) => (
                  <tr key={transaction.id} className="hover:bg-blue-50/30 transition-colors duration-150">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{formatDate(transaction.timestamp)}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10 rounded-full overflow-hidden bg-gray-100 border border-gray-200 flex items-center justify-center">
                          <ProgramIcon program={transaction.fromProgram} className="h-8 w-8" />
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-semibold text-gray-900">{getProgramName(transaction.fromProgram)}</div>
                          <div className="text-xs text-gray-500 mt-0.5">{transaction.amountFrom.toLocaleString()} points</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10 rounded-full overflow-hidden bg-gray-100 border border-gray-200 flex items-center justify-center">
                          <ProgramIcon program={transaction.toProgram} className="h-8 w-8" />
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-semibold text-gray-900">{getProgramName(transaction.toProgram)}</div>
                          <div className="text-xs text-gray-500 mt-0.5">{transaction.amountTo.toLocaleString()} points</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="font-medium text-sm text-gray-900">
                        {transaction.amountFrom.toLocaleString()} 
                        <span className="mx-1 text-gray-400">→</span> 
                        {transaction.amountTo.toLocaleString()}
                      </div>
                      <div className="text-xs text-gray-500 mt-0.5 flex items-center">
                        <span className="bg-blue-50 text-blue-600 rounded-full px-1.5 py-0.5 text-xs font-medium mr-1">Fee:</span> 
                        {transaction.feeApplied} xPoints
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <Badge 
                        variant={transaction.status === 'completed' ? 'success' : 
                                transaction.status === 'pending' ? 'outline' : 
                                transaction.status === 'failed' ? 'destructive' : 'default'} 
                        className="px-2 py-1 text-xs font-medium capitalize"
                      >
                        {transaction.status}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
        
        <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex items-center justify-between">
          <div className="text-sm text-gray-500">
            Showing <span className="font-medium">1</span> to <span className="font-medium">{filteredTransactions.length}</span> of <span className="font-medium">{filteredTransactions.length}</span> transactions
          </div>
          
          <div className="flex space-x-2">
            <button disabled className="px-3 py-1 border border-gray-200 bg-white text-gray-500 rounded-md text-sm disabled:opacity-50 disabled:cursor-not-allowed shadow-sm hover:bg-gray-50 transition-colors">
              Previous
            </button>
            <button disabled className="px-3 py-1 border border-gray-200 bg-white text-gray-500 rounded-md text-sm disabled:opacity-50 disabled:cursor-not-allowed shadow-sm hover:bg-gray-50 transition-colors">
              Next
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
