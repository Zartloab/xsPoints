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
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Your Wallet</h2>
        <div className="flex items-center">
          <span className="text-sm text-gray-500 mr-2">Last updated:</span>
          <span className="text-sm font-medium">
            {new Date().toLocaleDateString()} {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </span>
        </div>
      </div>
      
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-white shadow-md rounded-xl border border-gray-100 p-6 animate-pulse">
              <div className="flex items-center mb-4">
                <div className="w-10 h-10 rounded-full bg-gray-200 mr-3"></div>
                <div>
                  <div className="h-4 bg-gray-200 w-24 mb-2 rounded"></div>
                  <div className="h-3 bg-gray-200 w-32 rounded"></div>
                </div>
              </div>
              <div className="mb-3">
                <div className="h-6 bg-gray-200 w-20 mb-2 rounded"></div>
                <div className="h-3 bg-gray-200 w-24 rounded"></div>
              </div>
              <div className="flex justify-between">
                <div className="h-4 bg-gray-200 w-16 rounded"></div>
                <div className="h-4 bg-gray-200 w-16 rounded"></div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {wallets?.map((wallet) => (
            <LoyaltyCardWithTranslator
              key={wallet.id} 
              wallet={wallet} 
              onConvert={handleConvert}
            />
          ))}
        </div>
      )}
    </section>
  );
}
