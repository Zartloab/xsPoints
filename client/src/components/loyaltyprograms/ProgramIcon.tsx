import React from 'react';
import { LoyaltyProgram } from '@shared/schema';
import { 
  Plane, 
  Utensils, 
  Wallet, 
  CreditCard, 
  Building, 
  Home, 
  Rocket, 
  ShoppingBag
} from 'lucide-react';

interface ProgramIconProps {
  program: LoyaltyProgram;
  className?: string;
}

export default function ProgramIcon({ program, className = 'w-8 h-8' }: ProgramIconProps) {
  const getIconContent = () => {
    switch (program) {
      case 'QANTAS':
        return {
          bg: 'bg-red-600',
          icon: <Plane className="text-white h-5 w-5" />
        };
      case 'GYG':
        return {
          bg: 'bg-yellow-500',
          icon: <Utensils className="text-white h-5 w-5" />
        };
      case 'XPOINTS':
        return {
          bg: 'bg-primary bg-opacity-20',
          icon: <Wallet className="text-white h-5 w-5" />
        };
      case 'VELOCITY':
        return {
          bg: 'bg-purple-600',
          icon: <Plane className="text-white h-5 w-5" />
        };
      case 'AMEX':
        return {
          bg: 'bg-blue-800',
          icon: <CreditCard className="text-white h-5 w-5" />
        };
      case 'FLYBUYS':
        return {
          bg: 'bg-indigo-500',
          icon: <ShoppingBag className="text-white h-5 w-5" />
        };
      case 'HILTON':
        return {
          bg: 'bg-blue-600',
          icon: <Building className="text-white h-5 w-5" />
        };
      case 'MARRIOTT':
        return {
          bg: 'bg-red-800',
          icon: <Building className="text-white h-5 w-5" />
        };
      case 'AIRBNB':
        return {
          bg: 'bg-pink-600',
          icon: <Home className="text-white h-5 w-5" />
        };
      case 'DELTA':
        return {
          bg: 'bg-red-700',
          icon: <Rocket className="text-white h-5 w-5" />
        };
      default:
        return {
          bg: 'bg-gray-500',
          icon: <Wallet className="text-white h-5 w-5" />
        };
    }
  };

  const { bg, icon } = getIconContent();

  return (
    <div className={`${className} rounded-full overflow-hidden ${bg} flex items-center justify-center`}>
      {icon}
    </div>
  );
}
