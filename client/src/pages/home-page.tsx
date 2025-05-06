import React from 'react';
import { useAuth } from '@/hooks/use-auth';
import MainLayout from '@/components/layout/MainLayout';
import DashboardWallets from '@/components/dashboard/DashboardWallets';
import ConversionForm from '@/components/transaction/ConversionForm';
import TransactionHistory from '@/components/transaction/TransactionHistory';
import LinkAccountForm from '@/components/account/LinkAccountForm';
import ConnectedAccounts from '@/components/account/ConnectedAccounts';

export default function HomePage() {
  const { user } = useAuth();

  return (
    <MainLayout>
      <DashboardWallets />
      
      <ConversionForm />
      
      <TransactionHistory />
      
      <section id="link" className="mb-12">
        <div className="bg-white rounded-xl shadow-md p-6 border border-gray-100">
          <h2 className="text-xl font-bold text-gray-900 mb-6">Link Loyalty Programs</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <LinkAccountForm />
            <ConnectedAccounts />
          </div>
        </div>
      </section>
    </MainLayout>
  );
}
