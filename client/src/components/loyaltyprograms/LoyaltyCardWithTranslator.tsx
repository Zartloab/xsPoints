import React, { useState } from 'react';
import { Wallet, LoyaltyProgram } from '@shared/schema';
import LoyaltyCard from './LoyaltyCard';
import PointsTranslator from '../loyalty/PointsTranslator';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { GiftIcon, ChevronDownIcon, ChevronUpIcon } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface LoyaltyCardWithTranslatorProps {
  wallet: Wallet;
  onConvert: (program: string) => void;
}

export default function LoyaltyCardWithTranslator({ wallet, onConvert }: LoyaltyCardWithTranslatorProps) {
  const [showTranslator, setShowTranslator] = useState(false);
  
  // Animation variants
  const cardVariants = {
    open: { height: 'auto', opacity: 1, scale: 1 },
    closed: { height: 0, opacity: 0, scale: 0.95 }
  };

  // Get program-specific colors
  const getProgramColor = (program: LoyaltyProgram) => {
    switch (program) {
      case 'QANTAS': return 'bg-red-100 text-red-600 hover:bg-red-200';
      case 'GYG': return 'bg-green-100 text-green-600 hover:bg-green-200';
      case 'XPOINTS': return 'bg-blue-100 text-blue-600 hover:bg-blue-200';
      case 'VELOCITY': return 'bg-purple-100 text-purple-600 hover:bg-purple-200';
      case 'AMEX': return 'bg-blue-100 text-blue-600 hover:bg-blue-200';
      case 'FLYBUYS': return 'bg-yellow-100 text-yellow-600 hover:bg-yellow-200';
      case 'HILTON': return 'bg-blue-100 text-blue-600 hover:bg-blue-200';
      case 'MARRIOTT': return 'bg-indigo-100 text-indigo-600 hover:bg-indigo-200';
      case 'AIRBNB': return 'bg-pink-100 text-pink-600 hover:bg-pink-200';
      case 'DELTA': return 'bg-violet-100 text-violet-600 hover:bg-violet-200';
      default: return 'bg-gray-100 text-gray-600 hover:bg-gray-200';
    }
  };

  const programButtonColor = getProgramColor(wallet.program);
  
  return (
    <div className="flex flex-col">
      <div className="relative group">
        <LoyaltyCard wallet={wallet} onConvert={onConvert} />
        
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button 
                onClick={(e) => {
                  e.stopPropagation();
                  setShowTranslator(!showTranslator);
                }}
                className={`absolute top-3 right-3 h-8 w-8 rounded-full p-0 flex items-center justify-center shadow-sm opacity-90 hover:opacity-100 transition-all ${programButtonColor}`}
                variant="ghost"
                size="sm"
              >
                {showTranslator ? (
                  <ChevronUpIcon className="h-4 w-4" />
                ) : (
                  <GiftIcon className="h-4 w-4" />
                )}
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>{showTranslator ? "Hide Points Translator" : "See what your points are worth"}</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>
      
      <AnimatePresence initial={false}>
        {showTranslator && (
          <motion.div
            key="translator-content"
            initial="closed"
            animate="open"
            exit="closed"
            variants={cardVariants}
            transition={{ duration: 0.3, ease: "easeInOut" }}
            className="overflow-hidden"
          >
            <PointsTranslator wallet={wallet} />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}