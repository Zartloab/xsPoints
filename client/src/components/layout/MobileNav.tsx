import React, { useState } from 'react';
import { Link, useLocation } from 'wouter';
import { Home, RefreshCw, History, Link as LinkIcon } from 'lucide-react';

export default function MobileNav() {
  const [location] = useLocation();
  const [activeTab, setActiveTab] = useState('dashboard');
  
  const tabs = [
    { id: 'dashboard', href: '/', icon: Home, label: 'Dashboard' },
    { id: 'convert', href: '/#convert', icon: RefreshCw, label: 'Convert' },
    { id: 'history', href: '/#history', icon: History, label: 'History' },
    { id: 'link', href: '/#link', icon: LinkIcon, label: 'Link' },
  ];
  
  const handleTabClick = (tabId: string) => {
    setActiveTab(tabId);
  };

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-10">
      <div className="flex justify-around">
        {tabs.map((tab) => (
          <Link key={tab.id} href={tab.href}>
            <a
              className={`flex flex-col items-center py-3 ${activeTab === tab.id ? 'text-primary' : 'text-gray-500'}`}
              onClick={() => handleTabClick(tab.id)}
            >
              <tab.icon className="h-5 w-5" />
              <span className="text-xs mt-1">{tab.label}</span>
            </a>
          </Link>
        ))}
      </div>
    </div>
  );
}
