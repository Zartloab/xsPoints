import React, { useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getQueryFn } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/use-auth';
import { Wallet } from '@shared/schema';
import LoyaltyCardWithTranslator from '../loyaltyprograms/LoyaltyCardWithTranslator';
import { useLocation } from 'wouter';

export default function DashboardWallets() {
  const { toast } = useToast();
  const { user } = useAuth();
  const [_, setLocation] = useLocation();

  const { data: wallets, isLoading, error } = useQuery<Wallet[]>({
    queryKey: ['/api/wallets'],
    queryFn: getQueryFn({ on401: "throw" }),
    enabled: !!user,
  });

  useEffect(() => {
    if (error) {
      toast({
        title: 'Error',
        description: 'Failed to load wallet data',
        variant: 'destructive',
      });
    }
  }, [error, toast]);

  const handleConvert = (program: string) => {
    setLocation('/#convert');
    // Scroll to convert section
    document.getElementById('convert')?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <section id="dashboard" className="mb-12">
      <div className="bg-white rounded-xl shadow-md overflow-hidden border-0 mb-8">
        {/* Header with gradient background */}
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-blue-100 p-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between">
            <div className="flex items-center gap-3 mb-4 sm:mb-0">
              <div className="p-2 rounded-full bg-blue-100 text-blue-600">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 6h18M3 12h18M3 18h18" />
                </svg>
              </div>
              <h2 className="text-xl font-bold text-gray-900">Your Wallet</h2>
            </div>
            <div className="flex items-center bg-white px-3 py-1.5 rounded-full shadow-sm border border-blue-100">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-blue-500 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="text-xs text-gray-500 mr-2">Last updated:</span>
              <span className="text-xs font-medium text-gray-700">
                {new Date().toLocaleDateString()} {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>
          </div>
        </div>
        
        <div className="p-6">
          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[1, 2, 3].map((i) => (
                <div key={i} className="bg-gray-50 shadow-md rounded-xl border border-gray-100 p-6 animate-pulse">
                  <div className="flex items-center mb-6">
                    <div className="w-12 h-12 rounded-full bg-gray-200 mr-4"></div>
                    <div>
                      <div className="h-5 bg-gray-200 w-28 mb-2 rounded"></div>
                      <div className="h-3 bg-gray-200 w-36 rounded"></div>
                    </div>
                  </div>
                  <div className="mb-6">
                    <div className="h-7 bg-gray-200 w-32 mb-2 rounded"></div>
                    <div className="h-3 bg-gray-200 w-24 rounded"></div>
                  </div>
                  <div className="flex justify-between">
                    <div className="h-9 bg-gray-200 w-24 rounded-md"></div>
                    <div className="h-9 bg-gray-200 w-24 rounded-md"></div>
                  </div>
                </div>
              ))}
            </div>
          ) : wallets && wallets.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {wallets.map((wallet) => (
                <LoyaltyCardWithTranslator
                  key={wallet.id} 
                  wallet={wallet} 
                  onConvert={handleConvert}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-12 px-4">
              <div className="p-3 bg-blue-50 rounded-full w-14 h-14 flex items-center justify-center mx-auto mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-800 mb-2">No wallets found</h3>
              <p className="text-gray-500 max-w-md mx-auto mb-6">
                Connect your loyalty program accounts to start managing and converting points.
              </p>
              <button 
                onClick={() => setLocation('/account/link')}
                className="px-4 py-2 bg-blue-600 text-white rounded-md shadow-sm hover:bg-blue-700 transition-colors"
              >
                Link Loyalty Accounts
              </button>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
