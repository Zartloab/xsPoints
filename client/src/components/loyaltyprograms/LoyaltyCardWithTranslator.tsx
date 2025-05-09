import React, { useState } from 'react';
import { Wallet } from '@shared/schema';
import { useQuery } from '@tanstack/react-query';
import { getQueryFn } from '@/lib/queryClient';
import LoyaltyCard from './LoyaltyCard';
import PointsTranslator from '../loyalty/PointsTranslator';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { AlertCircle } from 'lucide-react';

interface LoyaltyCardWithTranslatorProps {
  wallet: Wallet;
  onConvert: (program: string) => void;
}

export default function LoyaltyCardWithTranslator({ wallet, onConvert }: LoyaltyCardWithTranslatorProps) {
  const [showTranslator, setShowTranslator] = useState(false);
  
  // Animation variants
  const cardVariants = {
    open: { height: 'auto', opacity: 1 },
    closed: { height: 0, opacity: 0 }
  };

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
  
  const { name: programName } = getProgramInfo();
  
  return (
    <div className="flex flex-col">
      <div className="relative">
        <LoyaltyCard wallet={wallet} onConvert={onConvert} />
        
        <Button 
          onClick={() => setShowTranslator(!showTranslator)}
          className="absolute top-2 right-2 h-8 w-8 rounded-full p-0 flex items-center justify-center"
          variant={showTranslator ? "secondary" : "default"}
          size="sm"
          title={showTranslator ? "Hide Points Translator" : "Show Points Translator"}
        >
          <AlertCircle className="h-4 w-4" />
        </Button>
      </div>
      
      <AnimatePresence>
        {showTranslator && (
          <motion.div
            key="content"
            initial="closed"
            animate="open"
            exit="closed"
            variants={cardVariants}
            transition={{ duration: 0.3 }}
            className="overflow-hidden mt-3"
          >
            <PointsTranslator wallet={wallet} />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}