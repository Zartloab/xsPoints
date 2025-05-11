import React from 'react';
import { useAuth } from '@/hooks/use-auth';
import { usePreferredLayout } from '@/hooks/use-mobile';
import MainLayout from '@/components/layout/MainLayout';
import DashboardWallets from '@/components/dashboard/DashboardWallets';
import MembershipTierCard from '@/components/dashboard/MembershipTierCard';
import ConversionForm from '@/components/transaction/ConversionForm';
import TransactionHistory from '@/components/transaction/TransactionHistory';
import LinkAccountForm from '@/components/account/LinkAccountForm';
import ConnectedAccounts from '@/components/account/ConnectedAccounts';
import MobileHomePage from '@/components/mobile/MobileHomePage';
import PointsTranslator from '@/components/PointsTranslator';
import { useQuery } from '@tanstack/react-query';

export default function HomePage() {
  const { user } = useAuth();
  const { useMobileLayout } = usePreferredLayout();
  
  // Fetch user wallets for the points translator
  const { data: wallets } = useQuery({
    queryKey: ['/api/wallets'],
    enabled: !!user,
  });
  
  // Get the highest balance wallet for the Points Translator
  const primaryWallet = wallets?.length ? 
    wallets.reduce((highest, current) => 
      current.balance > highest.balance ? current : highest
    ) : null;

  // Use mobile-optimized layout on mobile devices
  if (useMobileLayout) {
    return <MobileHomePage />;
  }

  // Desktop layout
  return (
    <>
      <DashboardWallets />
      
      <div className="mb-8">
        <MembershipTierCard />
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <div>
          <ConversionForm />
        </div>
        <div>
          {primaryWallet && (
            <PointsTranslator 
              selectedProgram={primaryWallet.program as any} 
              pointsBalance={primaryWallet.balance} 
            />
          )}
        </div>
      </div>
      
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
    </>
  );
}
