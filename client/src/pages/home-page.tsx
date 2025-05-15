import React from 'react';
import { useAuth } from '@/hooks/use-auth';
import { usePreferredLayout } from '@/hooks/use-mobile';
import { Link } from 'wouter';
import DashboardWallets from '@/components/dashboard/DashboardWallets';
import MembershipTierCard from '@/components/dashboard/MembershipTierCard';
import ConversionForm from '@/components/transaction/ConversionForm';
import ConversionWizard from '@/components/transaction/ConversionWizard';
import TransactionHistory from '@/components/transaction/TransactionHistory';
import LinkAccountForm from '@/components/account/LinkAccountForm';
import ConnectedAccounts from '@/components/account/ConnectedAccounts';
import MobileHomePage from '@/components/mobile/MobileHomePage';
import PointsTranslator from '@/components/PointsTranslator';
import MiniRecommendationPanel from '@/components/recommendations/MiniRecommendationPanel';
import { Banner } from '@/components/ui/banner';
import { Button } from '@/components/ui/button';
import { useQuery } from '@tanstack/react-query';
import { Wallet } from '@shared/schema';
import { ArrowRight, Coins } from 'lucide-react';

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
      {/* Welcome Banner */}
      <Banner
        title={`Welcome back, ${user?.username || 'User'}!`}
        subtitle="Manage your loyalty points, perform conversions, and discover the best value for your points"
        backgroundImage="/images/backgrounds/home.png"
        overlayOpacity={0.5}
        pattern="grid"
        height="md"
        actionButton={
          <Link href="/tutorial">
            <Button className="bg-white/90 text-blue-700 hover:bg-white">
              Discover New Features <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </Link>
        }
      >
        <div className="mt-4 flex space-x-2">
          <div className="flex items-center bg-blue-600/30 backdrop-blur-sm rounded-full pl-2 pr-3 py-1 text-sm text-white">
            <Coins className="h-4 w-4 mr-1.5" /> 
            <span>Earn free points with daily check-ins</span>
          </div>
        </div>
      </Banner>
      
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
