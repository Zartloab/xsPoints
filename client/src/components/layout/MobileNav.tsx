import React, { useState } from 'react';
import { Link, useLocation } from 'wouter';
import { Home, RefreshCw, History, Coins, ShoppingBag, BarChart3, GraduationCap } from 'lucide-react';

export default function MobileNav() {
  const [location] = useLocation();
  const [activeTab, setActiveTab] = useState('dashboard');
  
  const tabs = [
    { id: 'dashboard', href: '/', icon: Home, label: 'Dashboard' },
    { id: 'convert', href: '/#convert', icon: RefreshCw, label: 'Convert' },
    { id: 'history', href: '/#history', icon: History, label: 'History' },
    { id: 'tokenization', href: '/tokenization', icon: Coins, label: 'Tokens' },
    { id: 'merchant', href: '/merchant', icon: ShoppingBag, label: 'Merchant' },
    { id: 'tutorial', href: '/tutorial', icon: GraduationCap, label: 'Tutorial' },
  ];
  
  const handleTabClick = (tabId: string) => {
    setActiveTab(tabId);
  };

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-10">
      <div className="flex justify-around">
        {tabs.map((tab) => (
          <Link key={tab.id} href={tab.href}>
            <div
              className={`flex flex-col items-center py-3 ${activeTab === tab.id ? 'text-primary' : 'text-gray-500'} cursor-pointer`}
              onClick={() => handleTabClick(tab.id)}
            >
              <tab.icon className="h-5 w-5" />
              <span className="text-xs mt-1">{tab.label}</span>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
