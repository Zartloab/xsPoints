import React from 'react';
import { LoyaltyProgram } from '@shared/schema';
import { Plane, Utensils, Wallet } from 'lucide-react';

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
      default:
        return {
          bg: 'bg-gray-400',
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
