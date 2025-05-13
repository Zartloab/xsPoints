import React, { useState } from 'react';
import { Link, useLocation } from 'wouter';
import { useAuth } from '@/hooks/use-auth';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Bell, ChevronDown } from 'lucide-react';

export default function Header() {
  const { user, logoutMutation } = useAuth();
  const [location] = useLocation();
  
  const handleLogout = () => {
    logoutMutation.mutate();
  };
  
  const getInitials = () => {
    if (!user) return 'U';
    return `${user.firstName.charAt(0)}${user.lastName.charAt(0)}`;
  };

  return (
    <header className="bg-white shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
        <div className="flex items-center space-x-4">
          <div className="flex items-center">
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary to-blue-500 flex items-center justify-center shadow-md">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
              </svg>
            </div>
            <div className="ml-3">
              <h1 className="text-2xl font-bold bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent">xPoints</h1>
              <p className="text-xs text-gray-500">The Universal Loyalty Currency</p>
            </div>
          </div>
          
          <nav className="hidden md:flex space-x-6">
            <Link href="/">
              <span className={`${location === '/' ? 'text-primary' : 'text-gray-900 hover:text-primary'} font-medium cursor-pointer`}>Dashboard</span>
            </Link>
            <Link href="/#convert">
              <span className={`${location === '/#convert' ? 'text-primary' : 'text-gray-900 hover:text-primary'} font-medium cursor-pointer`}>Convert</span>
            </Link>
            <Link href="/#history">
              <span className={`${location === '/#history' ? 'text-primary' : 'text-gray-900 hover:text-primary'} font-medium cursor-pointer`}>History</span>
            </Link>
            {/* Tokenization UI is hidden but backend infrastructure is in place for future use */}
            {/* <Link href="/tokenization">
              <span className={`${location === '/tokenization' ? 'text-primary' : 'text-gray-900 hover:text-primary'} font-medium cursor-pointer`}>Tokenization</span>
            </Link> */}
            <Link href="/merchant">
              <span className={`${location === '/merchant' ? 'bg-primary text-white px-3 py-1 rounded-full' : 'text-gray-900 hover:text-primary bg-blue-50 hover:bg-blue-100 px-3 py-1 rounded-full'} font-medium cursor-pointer flex items-center`}>
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="2" y="7" width="20" height="14" rx="2" ry="2" />
                  <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
                </svg>
                Merchant Portal
              </span>
            </Link>
            <Link href="/marketplace">
              <span className={`${location === '/marketplace' ? 'text-primary' : 'text-gray-900 hover:text-primary'} font-medium cursor-pointer flex items-center`}>
                <span>Marketplace</span>
                <span className="ml-1 px-1.5 py-0.5 text-xs bg-blue-100 text-blue-800 rounded-full">New</span>
              </span>
            </Link>
            <Link href="/exchange-rates">
              <span className={`${location === '/exchange-rates' ? 'text-primary' : 'text-gray-900 hover:text-primary'} font-medium cursor-pointer flex items-center`}>
                <span>Exchange Rates</span>
                <span className="ml-1 px-1.5 py-0.5 text-xs bg-blue-100 text-blue-800 rounded-full">New</span>
              </span>
            </Link>
            <Link href="/explorer">
              <span className={`${location === '/explorer' ? 'text-primary' : 'text-gray-900 hover:text-primary'} font-medium cursor-pointer`}>Explorer</span>
            </Link>
            <Link href="/trading">
              <span className={`${location === '/trading' ? 'text-primary' : 'text-gray-900 hover:text-primary'} font-medium cursor-pointer`}>P2P Trading</span>
            </Link>
            <Link href="/tutorial">
              <span className={`${location === '/tutorial' ? 'text-primary' : 'text-gray-900 hover:text-primary'} font-medium cursor-pointer`}>Tutorial</span>
            </Link>
            <Link href="/earn">
              <span className={`${location === '/earn' ? 'text-primary' : 'text-gray-900 hover:text-primary'} font-medium cursor-pointer`}>Earn</span>
            </Link>
            <Link href="/recommendations">
              <span className={`${location === '/recommendations' ? 'text-primary' : 'text-gray-900 hover:text-primary'} font-medium cursor-pointer flex items-center`}>
                <span>AI Recommendations</span>
              </span>
            </Link>
            <Link href="/loyalty-journey">
              <span className={`${location === '/loyalty-journey' ? 'text-primary' : 'text-gray-900 hover:text-primary'} font-medium cursor-pointer`}>
                <span>Loyalty Journey</span>
              </span>
            </Link>
          </nav>
        </div>
        
        {user && (
          <div className="flex items-center space-x-4">
            <div className="hidden md:block">
              <button className="text-gray-500 hover:text-gray-700">
                <Bell className="h-5 w-5" />
              </button>
            </div>
            
            <DropdownMenu>
              <DropdownMenuTrigger className="flex items-center space-x-2 focus:outline-none">
                <div className="w-8 h-8 rounded-full bg-primary-100 flex items-center justify-center">
                  <span className="text-primary-700 font-medium">{getInitials()}</span>
                </div>
                <span className="hidden md:inline text-sm font-medium text-gray-700">{user.firstName} {user.lastName}</span>
                <ChevronDown className="hidden md:inline h-4 w-4 text-gray-400" />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <Link href="/profile">
                  <DropdownMenuItem className="cursor-pointer">
                    Profile
                  </DropdownMenuItem>
                </Link>
                <DropdownMenuItem className="cursor-pointer">
                  Settings
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout} className="cursor-pointer">
                  Log out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        )}
      </div>
    </header>
  );
}
