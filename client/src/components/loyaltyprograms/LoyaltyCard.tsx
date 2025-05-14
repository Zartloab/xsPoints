import React from 'react';
import { Wallet, ExchangeRate } from '@shared/schema';
import ProgramIcon from './ProgramIcon';
import { Badge } from '@/components/ui/badge';
import { useQuery } from '@tanstack/react-query';
import { getQueryFn } from '@/lib/queryClient';
import { AnimatedValueTooltip } from '@/components/ui/tooltip/AnimatedValueTooltip';

interface LoyaltyCardProps {
  wallet: Wallet;
  onConvert: (program: string) => void;
}

export default function LoyaltyCard({ wallet, onConvert }: LoyaltyCardProps) {
  // Get program name and description based on program type
  const getProgramInfo = () => {
    switch (wallet.program) {
      case 'QANTAS':
        return { name: 'Qantas', description: 'Frequent Flyer' };
      case 'GYG':
        return { name: 'GYG', description: 'Loyalty Program' };
      case 'XPOINTS':
        return { name: 'xPoints', description: 'Exchange Currency' };
      case 'VELOCITY':
        return { name: 'Velocity', description: 'Frequent Flyer' };
      case 'AMEX':
        return { name: 'American Express', description: 'Membership Rewards' };
      case 'FLYBUYS':
        return { name: 'Flybuys', description: 'Shopping Rewards' };
      case 'HILTON':
        return { name: 'Hilton', description: 'Honors Points' };
      case 'MARRIOTT':
        return { name: 'Marriott', description: 'Bonvoy Points' };
      case 'AIRBNB':
        return { name: 'Airbnb', description: 'Travel Credits' };
      case 'DELTA':
        return { name: 'Delta', description: 'SkyMiles' };
      default:
        return { name: wallet.program, description: 'Loyalty Program' };
    }
  };
  
  const { name: programName, description: programDescription } = getProgramInfo();
  
  // Get exchange rate to xPoints if not already xPoints
  const { data: exchangeRate } = useQuery<{rate: string}>({
    queryKey: [
      `/api/exchange-rates?from=${wallet.program}&to=XPOINTS`,
    ],
    queryFn: getQueryFn({ on401: "throw" }),
    enabled: wallet.program !== 'XPOINTS',
  });
  
  // For xPoints card, use special gradient style
  const isXpoints = wallet.program === 'XPOINTS';
  
  // Get a color scheme based on the loyalty program
  const getCardDesign = () => {
    switch (wallet.program) {
      case 'QANTAS':
        return {
          headerGradient: 'from-red-500 to-red-600',
          iconBg: 'bg-red-100',
          iconColor: 'text-red-600',
          buttonColor: 'text-red-600 hover:text-red-700',
          buttonBg: 'hover:bg-red-50'
        };
      case 'GYG':
        return {
          headerGradient: 'from-green-500 to-green-600',
          iconBg: 'bg-green-100',
          iconColor: 'text-green-600',
          buttonColor: 'text-green-600 hover:text-green-700',
          buttonBg: 'hover:bg-green-50'
        };
      case 'VELOCITY':
        return {
          headerGradient: 'from-purple-500 to-purple-600',
          iconBg: 'bg-purple-100',
          iconColor: 'text-purple-600',
          buttonColor: 'text-purple-600 hover:text-purple-700',
          buttonBg: 'hover:bg-purple-50'
        };
      case 'AMEX':
        return {
          headerGradient: 'from-blue-600 to-blue-700',
          iconBg: 'bg-blue-100',
          iconColor: 'text-blue-600',
          buttonColor: 'text-blue-600 hover:text-blue-700',
          buttonBg: 'hover:bg-blue-50'
        };
      case 'FLYBUYS':
        return {
          headerGradient: 'from-yellow-500 to-yellow-600',
          iconBg: 'bg-yellow-100',
          iconColor: 'text-yellow-600',
          buttonColor: 'text-yellow-600 hover:text-yellow-700',
          buttonBg: 'hover:bg-yellow-50'
        };
      case 'HILTON':
        return {
          headerGradient: 'from-blue-500 to-blue-600',
          iconBg: 'bg-blue-100',
          iconColor: 'text-blue-600',
          buttonColor: 'text-blue-600 hover:text-blue-700',
          buttonBg: 'hover:bg-blue-50'
        };
      case 'MARRIOTT':
        return {
          headerGradient: 'from-indigo-500 to-indigo-600',
          iconBg: 'bg-indigo-100',
          iconColor: 'text-indigo-600',
          buttonColor: 'text-indigo-600 hover:text-indigo-700',
          buttonBg: 'hover:bg-indigo-50'
        };
      case 'AIRBNB':
        return {
          headerGradient: 'from-pink-500 to-pink-600',
          iconBg: 'bg-pink-100',
          iconColor: 'text-pink-600',
          buttonColor: 'text-pink-600 hover:text-pink-700',
          buttonBg: 'hover:bg-pink-50'
        };
      case 'DELTA':
        return {
          headerGradient: 'from-violet-500 to-violet-600',
          iconBg: 'bg-violet-100',
          iconColor: 'text-violet-600',
          buttonColor: 'text-violet-600 hover:text-violet-700',
          buttonBg: 'hover:bg-violet-50'
        };
      case 'XPOINTS':
        return {
          headerGradient: 'from-primary to-blue-600',
          iconBg: 'bg-blue-400',
          iconColor: 'text-white',
          buttonColor: 'text-white hover:text-white',
          buttonBg: 'hover:bg-blue-600'
        };
      default:
        return {
          headerGradient: 'from-gray-500 to-gray-600',
          iconBg: 'bg-gray-100',
          iconColor: 'text-gray-600',
          buttonColor: 'text-gray-600 hover:text-gray-700',
          buttonBg: 'hover:bg-gray-50'
        };
    }
  };
  
  const cardDesign = getCardDesign();
  
  return (
    <div className="dashboard-card bg-white shadow-md rounded-xl overflow-hidden border-0 hover:-translate-y-1 transition-all duration-200 hover:shadow-lg">
      {/* Colored header section */}
      <div className={`bg-gradient-to-r ${isXpoints ? 'from-primary to-blue-600' : cardDesign.headerGradient} h-2.5`}></div>
      
      <div className="px-6 py-5">
        <div className="flex items-start justify-between mb-5">
          <div className="flex items-center">
            <div className={`w-12 h-12 rounded-full flex items-center justify-center ${isXpoints ? 'bg-blue-100' : cardDesign.iconBg} p-2.5`}>
              <ProgramIcon program={wallet.program} className={`w-full h-full ${isXpoints ? 'text-blue-600' : cardDesign.iconColor}`} />
            </div>
            <div className="ml-3">
              <h3 className="font-semibold text-lg text-gray-800">{programName}</h3>
              <p className="text-sm text-gray-500">{programDescription}</p>
            </div>
          </div>
          {wallet.accountNumber && (
            <Badge variant="blue" className="text-xs font-medium px-2 py-1 bg-blue-50 text-blue-600 border border-blue-200">
              <span className="flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Connected
              </span>
            </Badge>
          )}
          {!wallet.accountNumber && !isXpoints && (
            <Badge variant="outline" className="text-xs font-medium px-2 py-1 bg-gray-50 text-gray-600 border border-gray-200">
              <span className="flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Not Connected
              </span>
            </Badge>
          )}
        </div>
        
        <div className="mb-5">
          <div className="flex items-baseline">
            <AnimatedValueTooltip
              program={wallet.program}
              points={wallet.balance}
            >
              <span className="text-2xl font-bold text-gray-800 cursor-help hover:text-opacity-80 transition-all">
                {wallet.balance.toLocaleString()}
              </span>
            </AnimatedValueTooltip>
            <span className="ml-1 text-gray-500 text-sm">
              {isXpoints ? 'xPoints' : 'points'}
            </span>
          </div>
          {!isXpoints && exchangeRate && (
            <div className="text-xs text-gray-500 mt-1 flex items-center">
              <div className="bg-blue-50 text-blue-600 rounded-full px-1.5 py-0.5 text-xs font-medium mr-1">≈</div>
              <AnimatedValueTooltip
                program="XPOINTS"
                points={Math.round(wallet.balance * Number(exchangeRate.rate))}
              >
                <span className="cursor-help hover:text-blue-600 transition-all">
                  {Math.round(wallet.balance * Number(exchangeRate.rate)).toLocaleString()} xPoints
                </span>
              </AnimatedValueTooltip>
            </div>
          )}
          {isXpoints && (
            <div className="text-xs text-gray-500 mt-1 flex items-center">
              <div className="bg-blue-50 text-blue-600 rounded-full px-1.5 py-0.5 text-xs font-medium mr-1">🌐</div>
              Universal exchange currency
            </div>
          )}
        </div>
        
        <div className="flex justify-between">
          <button 
            onClick={() => onConvert(wallet.program)}
            className={`${isXpoints ? 'text-blue-600 hover:text-blue-700' : cardDesign.buttonColor} 
              ${isXpoints ? 'hover:bg-blue-50' : cardDesign.buttonBg} 
              text-sm font-medium flex items-center px-3 py-1.5 rounded-lg transition-colors`}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
            </svg>
            Convert
          </button>
          {isXpoints ? (
            <button 
              type="button"
              className="text-blue-600 hover:text-blue-700 hover:bg-blue-50 text-sm font-medium flex items-center px-3 py-1.5 rounded-lg transition-colors"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              History
            </button>
          ) : (
            <button 
              type="button"
              className={`${cardDesign.buttonColor} ${cardDesign.buttonBg} text-sm font-medium flex items-center px-3 py-1.5 rounded-lg transition-colors`}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Refresh
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
