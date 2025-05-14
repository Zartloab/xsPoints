import React from 'react';
import Header from './Header';
import Footer from './Footer';
import MobileNav from './MobileNav';
import MobileFooter from './MobileFooter';
import QuickConvertWidget from '../widgets/QuickConvertWidget';
import { useAuth } from '@/hooks/use-auth';

interface MainLayoutProps {
  children: React.ReactNode;
}

export default function MainLayout({ children }: MainLayoutProps) {
  const { user } = useAuth();
  
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-grow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {children}
        </div>
      </main>
      {user && <QuickConvertWidget />}
      <MobileFooter />
      <MobileNav />
      <Footer />
    </div>
  );
}
