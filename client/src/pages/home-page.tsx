import React from 'react';
import { useAuth } from '@/hooks/use-auth';
import { usePreferredLayout } from '@/hooks/use-mobile';
import DashboardWallets from '@/components/dashboard/DashboardWallets';
import MembershipTierCard from '@/components/dashboard/MembershipTierCard';
import PersonalizedDashboard from '@/components/dashboard/PersonalizedDashboard';
import ConversionForm from '@/components/transaction/ConversionForm';
import ConversionWizard from '@/components/transaction/ConversionWizard';
import TransactionHistory from '@/components/transaction/TransactionHistory';
import LinkAccountForm from '@/components/account/LinkAccountForm';
import ConnectedAccounts from '@/components/account/ConnectedAccounts';
import MobileHomePage from '@/components/mobile/MobileHomePage';
import PointsTranslator from '@/components/PointsTranslator';
import MiniRecommendationPanel from '@/components/recommendations/MiniRecommendationPanel';
import { useQuery } from '@tanstack/react-query';
import { Wallet } from '@shared/schema';

export default function HomePage() {
  const { user } = useAuth();
  const { useMobileLayout } = usePreferredLayout();
  
  // Fetch user wallets for the points translator
  const { data: wallets = [] } = useQuery<Wallet[]>({
    queryKey: ['/api/wallets'],
    enabled: !!user,
  });
  
  // Get the highest balance wallet for the Points Translator
  const primaryWallet = wallets.length > 0 ? 
    wallets.reduce((highest: Wallet, current: Wallet) => 
      current.balance > highest.balance ? current : highest
    ) : null;

  // Use mobile-optimized layout on mobile devices
  if (useMobileLayout) {
    return <MobileHomePage />;
  }

  // Desktop layout
  return (
    <>
      {/* Dashboard Header with personalized greeting and insights */}
      <PersonalizedDashboard />
      
      {/* Wallet Cards Section */}
      <section className="mb-8">
        <DashboardWallets />
      </section>
      
      {/* Core Features Section */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="md:col-span-2">
          <MembershipTierCard />
        </div>
        <div>
          <MiniRecommendationPanel />
        </div>
      </div>
      
      {/* Points Conversion & Value Section */}
      <div id="convert" className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <div className="space-y-6">
          <ConversionForm />
          <ConversionWizard />
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
      
      {/* Recent Activity Section */}
      <section className="mb-8">
        <TransactionHistory />
      </section>
      
      {/* Account Management Section */}
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
