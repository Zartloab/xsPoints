import React from 'react';
import { Link, useLocation } from 'wouter';
import { Home, Repeat, Wallet, User, BarChart3, Trophy, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';
import MobileFooter from './MobileFooter';

type MobileLayoutProps = {
  children: React.ReactNode;
};

const MobileLayout: React.FC<MobileLayoutProps> = ({ children }) => {
  const [location] = useLocation();

  const navItems = [
    { icon: Home, label: 'Home', href: '/' },
    { icon: Repeat, label: 'Exchange', href: '/exchange' },
    { icon: BarChart3, label: 'Explorer', href: '/explorer' },
    { icon: Trophy, label: 'Earn', href: '/earn' },
    { icon: Sparkles, label: 'AI Rec', href: '/recommendations' },
    { icon: User, label: 'Profile', href: '/profile' },
  ];

  return (
    <div className="flex flex-col h-screen bg-background">
      {/* Mobile Header */}
      <header className="fixed top-0 left-0 right-0 h-16 border-b bg-background z-50 flex items-center px-4">
        <div className="flex items-center justify-between w-full">
          <div className="flex items-center">
            <div className="font-bold text-xl text-primary">xPoints</div>
          </div>
          <div className="flex items-center space-x-2">
            <button className="p-2 rounded-full hover:bg-muted">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
                <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
              </svg>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 overflow-auto pt-16 pb-40">
        {children}
      </main>

      {/* Mobile Footer */}
      <div className="fixed bottom-16 left-0 right-0 z-40">
        <MobileFooter />
      </div>

      {/* Mobile Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 h-16 border-t bg-background z-50">
        <div className="grid h-full grid-cols-6">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location === item.href;
            
            return (
              <Link 
                key={item.href} 
                href={item.href}
                className={cn(
                  "flex flex-col items-center justify-center transition-colors",
                  isActive 
                    ? "text-primary" 
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                <Icon size={20} />
                <span className="text-xs mt-1">{item.label}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
};

export default MobileLayout;