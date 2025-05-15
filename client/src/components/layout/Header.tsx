import React, { useState } from 'react';
import { Link, useLocation } from 'wouter';
import { useAuth } from '@/hooks/use-auth';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuGroup,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";
import { 
  Bell, 
  ChevronDown, 
  Home, 
  LineChart, 
  RefreshCw, 
  History, 
  ShoppingBag, 
  ShoppingCart, 
  BarChart3, 
  GraduationCap,
  Trophy,
  Sparkles,
  Route,
  Menu,
  BookOpen
} from 'lucide-react';

export default function Header() {
  const { user, logoutMutation } = useAuth();
  const [location] = useLocation();
  
  const handleLogout = () => {
    logoutMutation.mutate();
  };
  
  const getInitials = () => {
    if (!user) return 'U';
    return `${user.firstName?.charAt(0) || ''}${user.lastName?.charAt(0) || ''}`;
  };

  // Active nav item style
  const activeClass = "text-primary";
  // Inactive nav item style
  const inactiveClass = "text-gray-700 hover:text-primary";

  return (
    <header className="bg-white shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex justify-between items-center">
        {/* Logo Section */}
        <div className="flex items-center">
          <Link href="/">
            <div className="flex items-center cursor-pointer">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-blue-500 flex items-center justify-center shadow-md">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
                </svg>
              </div>
              <div className="ml-2">
                <h1 className="text-xl font-bold bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent">xPoints</h1>
                <p className="text-xs text-gray-500">Universal Loyalty Currency</p>
              </div>
            </div>
          </Link>
        </div>
        
        {/* Primary Navigation */}
        <nav className="hidden lg:flex items-center space-x-4">
          {/* Core Features */}
          <Link href="/">
            <span className={`${location === '/' ? activeClass : inactiveClass} font-medium cursor-pointer flex items-center gap-1`}>
              <Home size={16} />
              <span>Dashboard</span>
            </span>
          </Link>
          
          <Link href="/#convert">
            <span className={`${location === '/#convert' ? activeClass : inactiveClass} font-medium cursor-pointer flex items-center gap-1`}>
              <RefreshCw size={16} />
              <span>Convert</span>
            </span>
          </Link>
          
          {/* Market Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger className={`flex items-center font-medium ${
              ['/marketplace', '/trading', '/exchange-rates'].includes(location) ? activeClass : inactiveClass
            } cursor-pointer`}>
              <ShoppingCart size={16} />
              <span className="mx-1">Market</span>
              <ChevronDown size={14} />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="center">
              <Link href="/marketplace">
                <DropdownMenuItem className="cursor-pointer">
                  <span>Marketplace</span>
                  {location !== '/marketplace' && (
                    <span className="ml-2 px-1.5 py-0.5 text-xs bg-blue-100 text-blue-800 rounded-full">New</span>
                  )}
                </DropdownMenuItem>
              </Link>
              <Link href="/trading">
                <DropdownMenuItem className="cursor-pointer">P2P Trading</DropdownMenuItem>
              </Link>
              <Link href="/exchange-rates">
                <DropdownMenuItem className="cursor-pointer">
                  <span>Exchange Rates</span>
                  {location !== '/exchange-rates' && (
                    <span className="ml-2 px-1.5 py-0.5 text-xs bg-blue-100 text-blue-800 rounded-full">New</span>
                  )}
                </DropdownMenuItem>
              </Link>
            </DropdownMenuContent>
          </DropdownMenu>
          
          {/* Explore Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger className={`flex items-center font-medium ${
              ['/explorer', '/loyalty-journey', '/storyteller'].includes(location) ? activeClass : inactiveClass
            } cursor-pointer`}>
              <BarChart3 size={16} />
              <span className="mx-1">Explore</span>
              <ChevronDown size={14} />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="center">
              <Link href="/explorer">
                <DropdownMenuItem className="cursor-pointer">Explorer</DropdownMenuItem>
              </Link>
              <Link href="/loyalty-journey">
                <DropdownMenuItem className="cursor-pointer">Loyalty Journey</DropdownMenuItem>
              </Link>
              <Link href="/storyteller">
                <DropdownMenuItem className="cursor-pointer">
                  <span>Point Value Storyteller</span>
                  <span className="ml-2 px-1.5 py-0.5 text-xs bg-blue-100 text-blue-800 rounded-full">New</span>
                </DropdownMenuItem>
              </Link>
            </DropdownMenuContent>
          </DropdownMenu>
          
          {/* Merchant Portal */}
          <Link href="/merchant">
            <span className={`${location === '/merchant' ? 'bg-primary text-white' : 'bg-blue-50 hover:bg-blue-100 text-gray-900 hover:text-primary'} px-3 py-1 rounded-full font-medium cursor-pointer flex items-center`}>
              <ShoppingBag size={14} className="mr-1" />
              Merchant Portal
            </span>
          </Link>
          
          {/* Earn & Learn Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger className={`flex items-center font-medium ${
              ['/earn', '/tutorial', '/recommendations'].includes(location) ? activeClass : inactiveClass
            } cursor-pointer`}>
              <Trophy size={16} />
              <span className="mx-1">Earn & Learn</span>
              <ChevronDown size={14} />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="center">
              <Link href="/earn">
                <DropdownMenuItem className="cursor-pointer">
                  <Trophy size={16} className="mr-2" />
                  Earn Points
                </DropdownMenuItem>
              </Link>
              <Link href="/tutorial">
                <DropdownMenuItem className="cursor-pointer">
                  <GraduationCap size={16} className="mr-2" />
                  Tutorial
                </DropdownMenuItem>
              </Link>
              <Link href="/recommendations">
                <DropdownMenuItem className="cursor-pointer">
                  <Sparkles size={16} className="mr-2" />
                  AI Recommendations
                </DropdownMenuItem>
              </Link>
            </DropdownMenuContent>
          </DropdownMenu>
        </nav>
        
        {/* Mobile Navigation Toggle */}
        <div className="lg:hidden">
          <DropdownMenu>
            <DropdownMenuTrigger className="flex items-center p-1 rounded-md hover:bg-gray-100">
              <Menu className="h-6 w-6 text-gray-700" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>Navigation</DropdownMenuLabel>
              <DropdownMenuSeparator />
              
              <Link href="/">
                <DropdownMenuItem className="cursor-pointer">
                  <Home size={16} className="mr-2" />
                  Dashboard
                </DropdownMenuItem>
              </Link>
              <Link href="/#convert">
                <DropdownMenuItem className="cursor-pointer">
                  <RefreshCw size={16} className="mr-2" />
                  Convert
                </DropdownMenuItem>
              </Link>
              <Link href="/#history">
                <DropdownMenuItem className="cursor-pointer">
                  <History size={16} className="mr-2" />
                  History
                </DropdownMenuItem>
              </Link>
              
              <DropdownMenuSeparator />
              <DropdownMenuLabel>Market</DropdownMenuLabel>
              <Link href="/marketplace">
                <DropdownMenuItem className="cursor-pointer">
                  <ShoppingCart size={16} className="mr-2" />
                  Marketplace
                </DropdownMenuItem>
              </Link>
              <Link href="/trading">
                <DropdownMenuItem className="cursor-pointer">
                  <Route size={16} className="mr-2" />
                  P2P Trading
                </DropdownMenuItem>
              </Link>
              <Link href="/exchange-rates">
                <DropdownMenuItem className="cursor-pointer">
                  <LineChart size={16} className="mr-2" />
                  Exchange Rates
                </DropdownMenuItem>
              </Link>
              
              <DropdownMenuSeparator />
              <DropdownMenuLabel>Explore</DropdownMenuLabel>
              <Link href="/explorer">
                <DropdownMenuItem className="cursor-pointer">
                  <BarChart3 size={16} className="mr-2" />
                  Explorer
                </DropdownMenuItem>
              </Link>
              <Link href="/loyalty-journey">
                <DropdownMenuItem className="cursor-pointer">
                  <Route size={16} className="mr-2" />
                  Loyalty Journey
                </DropdownMenuItem>
              </Link>
              <Link href="/storyteller">
                <DropdownMenuItem className="cursor-pointer">
                  <BookOpen size={16} className="mr-2" />
                  <div className="flex items-center">
                    <span>Point Value Storyteller</span>
                    <span className="ml-2 px-1.5 py-0.5 text-xs bg-blue-100 text-blue-800 rounded-full">New</span>
                  </div>
                </DropdownMenuItem>
              </Link>
              
              <DropdownMenuSeparator />
              <DropdownMenuLabel>Earn & Learn</DropdownMenuLabel>
              <Link href="/earn">
                <DropdownMenuItem className="cursor-pointer">
                  <Trophy size={16} className="mr-2" />
                  Earn Points
                </DropdownMenuItem>
              </Link>
              <Link href="/tutorial">
                <DropdownMenuItem className="cursor-pointer">
                  <GraduationCap size={16} className="mr-2" />
                  Tutorial
                </DropdownMenuItem>
              </Link>
              <Link href="/recommendations">
                <DropdownMenuItem className="cursor-pointer">
                  <Sparkles size={16} className="mr-2" />
                  AI Recommendations
                </DropdownMenuItem>
              </Link>
              
              <DropdownMenuSeparator />
              <Link href="/merchant">
                <DropdownMenuItem className="cursor-pointer">
                  <ShoppingBag size={16} className="mr-2" />
                  Merchant Portal
                </DropdownMenuItem>
              </Link>
              
              {user && user.username === 'admin' && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuLabel>Administration</DropdownMenuLabel>
                  <Link href="/admin">
                    <DropdownMenuItem className="cursor-pointer">
                      <BarChart3 size={16} className="mr-2" />
                      Admin Dashboard
                    </DropdownMenuItem>
                  </Link>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        
        {/* User Menu */}
        {user && (
          <div className="flex items-center space-x-3">
            <div className="hidden md:block">
              <button className="text-gray-500 hover:text-gray-700 p-1 rounded-full hover:bg-gray-100">
                <Bell className="h-5 w-5" />
              </button>
            </div>
            
            <DropdownMenu>
              <DropdownMenuTrigger className="flex items-center space-x-2 focus:outline-none">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-50 to-blue-100 flex items-center justify-center">
                  <span className="text-primary font-medium">{getInitials()}</span>
                </div>
                <span className="hidden md:inline text-sm font-medium text-gray-700">{user.firstName} {user.lastName}</span>
                <ChevronDown className="hidden md:inline h-4 w-4 text-gray-400" />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuLabel>My Account</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <Link href="/profile">
                  <DropdownMenuItem className="cursor-pointer">
                    Profile
                  </DropdownMenuItem>
                </Link>
                <DropdownMenuItem className="cursor-pointer">
                  Settings
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                {user.username === 'admin' && (
                  <>
                    <Link href="/admin">
                      <DropdownMenuItem className="cursor-pointer">
                        Admin Dashboard
                      </DropdownMenuItem>
                    </Link>
                    <DropdownMenuSeparator />
                  </>
                )}
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
