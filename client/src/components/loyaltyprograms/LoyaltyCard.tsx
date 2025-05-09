import React from 'react';
import { Wallet, ExchangeRate } from '@shared/schema';
import ProgramIcon from './ProgramIcon';
import { Badge } from '@/components/ui/badge';
import { useQuery } from '@tanstack/react-query';
import { getQueryFn } from '@/lib/queryClient';

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
  
  return (
    <div 
      className={`dashboard-card ${
        isXpoints 
          ? 'bg-gradient-to-br from-primary to-accent-500 text-white' 
          : 'bg-white'
      } shadow-md rounded-xl overflow-hidden border ${isXpoints ? '' : 'border-gray-100'} hover:-translate-y-1 transition-transform duration-200`}
    >
      <div className="px-6 py-5">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center">
            <ProgramIcon program={wallet.program} className="w-10 h-10" />
            <div className="ml-3">
              <h3 className={`font-semibold text-lg ${isXpoints ? 'text-white' : ''}`}>{programName}</h3>
              <p className={`text-sm ${isXpoints ? 'text-white text-opacity-75' : 'text-gray-500'}`}>{programDescription}</p>
            </div>
          </div>
          {wallet.accountNumber && !isXpoints && (
            <Badge variant="blue" className="text-xs font-medium px-2 py-1">Connected</Badge>
          )}
        </div>
        
        <div className="mb-3">
          <div className="flex items-baseline">
            <span className={`text-2xl font-bold ${isXpoints ? 'text-white' : ''}`}>
              {wallet.balance.toLocaleString()}
            </span>
            <span className={`ml-1 ${isXpoints ? 'text-white text-opacity-75' : 'text-gray-500'} text-sm`}>
              {isXpoints ? 'xPoints' : 'points'}
            </span>
          </div>
          {!isXpoints && exchangeRate && (
            <div className="text-xs text-gray-500 mt-1">
              ≈ {Math.round(wallet.balance * Number(exchangeRate.rate)).toLocaleString()} xPoints
            </div>
          )}
          {isXpoints && (
            <div className="text-xs text-white text-opacity-75 mt-1">Universal exchange currency</div>
          )}
        </div>
        
        <div className="flex justify-between">
          <button 
            onClick={() => onConvert(wallet.program)}
            className={`${
              isXpoints 
                ? 'text-white hover:text-gray-100' 
                : 'text-primary-600 hover:text-primary-700'
            } text-sm font-medium flex items-center`}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
            </svg>
            Convert
          </button>
          {isXpoints ? (
            <button 
              type="button"
              className="text-white hover:text-gray-100 text-sm font-medium flex items-center"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              History
            </button>
          ) : (
            <button 
              type="button"
              className="text-gray-500 hover:text-gray-700 text-sm font-medium flex items-center"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
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
