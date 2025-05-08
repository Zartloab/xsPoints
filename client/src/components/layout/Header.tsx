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
            <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
              </svg>
            </div>
            <h1 className="ml-3 text-2xl font-bold text-gray-900">xPoints</h1>
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
            <Link href="/tokenization">
              <span className={`${location === '/tokenization' ? 'text-primary' : 'text-gray-900 hover:text-primary'} font-medium cursor-pointer`}>Tokenization</span>
            </Link>
            <Link href="/merchant">
              <span className={`${location === '/merchant' ? 'text-primary' : 'text-gray-900 hover:text-primary'} font-medium cursor-pointer`}>Merchant</span>
            </Link>
            <Link href="/explorer">
              <span className={`${location === '/explorer' ? 'text-primary' : 'text-gray-900 hover:text-primary'} font-medium cursor-pointer`}>Explorer</span>
            </Link>
            <Link href="/trading">
              <span className={`${location === '/trading' ? 'text-primary' : 'text-gray-900 hover:text-primary'} font-medium cursor-pointer`}>P2P Trading</span>
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
