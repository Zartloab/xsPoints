import React from 'react';
import { Wallet, LoyaltyProgram } from '@shared/schema';
import { motion } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { PlaneIcon, Coffee, Gift, Car, Hotel, ShoppingBag, UtensilsCrossed, Palmtree } from 'lucide-react';

interface PointsTranslatorProps {
  wallet: Wallet;
}

interface RedeemableItem {
  name: string;
  description: string;
  pointsRequired: number;
  icon: React.ReactNode;
}

const getRedeemableItems = (program: LoyaltyProgram, balance: number): RedeemableItem[] => {
  // Define program-specific redemption options with real-world equivalents
  switch (program) {
    case 'QANTAS':
      return [
        { 
          name: 'Economy Flight', 
          description: 'Sydney to Melbourne one-way',
          pointsRequired: 8000,
          icon: <PlaneIcon />
        },
        { 
          name: 'Business Class Upgrade', 
          description: 'Domestic flight',
          pointsRequired: 12000,
          icon: <PlaneIcon />
        },
        { 
          name: 'International Economy', 
          description: 'Sydney to Singapore',
          pointsRequired: 25000,
          icon: <PlaneIcon />
        },
        { 
          name: 'Gift Card', 
          description: '$50 David Jones Voucher',
          pointsRequired: 9500,
          icon: <Gift /> 
        }
      ].filter(item => item.pointsRequired <= balance * 1.5); // Show items even if slightly out of reach
      
    case 'VELOCITY':
      return [
        { 
          name: 'Economy Flight', 
          description: 'Sydney to Brisbane one-way',
          pointsRequired: 7800,
          icon: <PlaneIcon />
        },
        { 
          name: 'Lounge Access', 
          description: 'One-time pass',
          pointsRequired: 8000,
          icon: <Coffee />
        },
        { 
          name: 'Gift Card', 
          description: '$50 Myer Voucher',
          pointsRequired: 9000,
          icon: <ShoppingBag />
        }
      ].filter(item => item.pointsRequired <= balance * 1.5);
      
    case 'AMEX':
      return [
        { 
          name: 'Statement Credit', 
          description: '$100 off your bill',
          pointsRequired: 15000,
          icon: <Gift />
        },
        { 
          name: 'Wine Voucher', 
          description: '$50 at selected stores',
          pointsRequired: 7500,
          icon: <UtensilsCrossed />
        }
      ].filter(item => item.pointsRequired <= balance * 1.5);
      
    case 'HILTON':
      return [
        { 
          name: 'Free Night', 
          description: 'Standard room at Hilton Sydney',
          pointsRequired: 60000,
          icon: <Hotel />
        },
        { 
          name: 'Resort Discount', 
          description: '$50 dining credit',
          pointsRequired: 10000,
          icon: <UtensilsCrossed />
        }
      ].filter(item => item.pointsRequired <= balance * 1.5);
      
    case 'MARRIOTT':
      return [
        { 
          name: 'Free Night', 
          description: 'Standard room at Category 4 property',
          pointsRequired: 25000,
          icon: <Hotel />
        },
        { 
          name: 'Room Upgrade', 
          description: 'To Deluxe room for a 5-night stay',
          pointsRequired: 15000,
          icon: <Hotel />
        }
      ].filter(item => item.pointsRequired <= balance * 1.5);
      
    case 'AIRBNB':
      return [
        { 
          name: 'Travel Credit', 
          description: '$100 towards your next stay',
          pointsRequired: 10000,
          icon: <Palmtree />
        }
      ].filter(item => item.pointsRequired <= balance * 1.5);
      
    case 'FLYBUYS':
      return [
        { 
          name: 'Grocery Voucher', 
          description: '$50 at Coles',
          pointsRequired: 5000,
          icon: <ShoppingBag />
        },
        { 
          name: 'Fuel Discount', 
          description: '4¢ off per liter',
          pointsRequired: 2000,
          icon: <Car />
        }
      ].filter(item => item.pointsRequired <= balance * 1.5);
      
    case 'DELTA':
      return [
        { 
          name: 'Economy Flight', 
          description: 'LA to New York one-way',
          pointsRequired: 15000,
          icon: <PlaneIcon />
        },
        { 
          name: 'Comfort+ Upgrade', 
          description: 'Domestic flight',
          pointsRequired: 5000,
          icon: <PlaneIcon />
        }
      ].filter(item => item.pointsRequired <= balance * 1.5);
      
    case 'GYG':
      return [
        { 
          name: 'Free Burrito', 
          description: 'Any regular burrito',
          pointsRequired: 200,
          icon: <UtensilsCrossed />
        },
        { 
          name: 'Meal Deal', 
          description: 'Burrito, drink & nachos',
          pointsRequired: 350,
          icon: <UtensilsCrossed />
        },
        { 
          name: 'GYG Voucher', 
          description: '$50 gift card',
          pointsRequired: 550,
          icon: <Gift />
        }
      ].filter(item => item.pointsRequired <= balance * 1.5);
      
    case 'XPOINTS':
      // For xPoints, we'll show generic redemption options
      return [
        { 
          name: 'Economy Flight', 
          description: 'Short domestic route',
          pointsRequired: 10000,
          icon: <PlaneIcon />
        },
        { 
          name: 'Hotel Stay', 
          description: 'One night at 4-star hotel',
          pointsRequired: 15000,
          icon: <Hotel />
        },
        { 
          name: 'Shopping Voucher', 
          description: '$100 gift card',
          pointsRequired: 20000,
          icon: <ShoppingBag />
        },
        { 
          name: 'Meal Voucher', 
          description: '$50 dining credit',
          pointsRequired: 10000,
          icon: <UtensilsCrossed />
        }
      ].filter(item => item.pointsRequired <= balance * 1.5);
      
    default:
      return [];
  }
};

const getProgramDisplayName = (program: LoyaltyProgram): string => {
  switch (program) {
    case 'QANTAS': return 'Qantas';
    case 'GYG': return 'GYG';
    case 'XPOINTS': return 'xPoints';
    case 'VELOCITY': return 'Velocity';
    case 'AMEX': return 'American Express';
    case 'FLYBUYS': return 'Flybuys';
    case 'HILTON': return 'Hilton Honors';
    case 'MARRIOTT': return 'Marriott Bonvoy';
    case 'AIRBNB': return 'Airbnb';
    case 'DELTA': return 'Delta SkyMiles';
    default: return program;
  }
};

export default function PointsTranslator({ wallet }: PointsTranslatorProps) {
  const redeemableItems = getRedeemableItems(wallet.program, wallet.balance);
  const programDisplayName = getProgramDisplayName(wallet.program);
  
  // Get program-specific colors
  const getProgramColors = (program: LoyaltyProgram) => {
    switch (program) {
      case 'QANTAS':
        return {
          primary: 'text-red-600',
          secondary: 'text-red-800',
          bgLight: 'bg-red-50',
          bgMedium: 'bg-red-100',
          border: 'border-red-200',
          gradient: 'from-red-50 to-white'
        };
      case 'GYG':
        return {
          primary: 'text-green-600',
          secondary: 'text-green-800',
          bgLight: 'bg-green-50',
          bgMedium: 'bg-green-100',
          border: 'border-green-200',
          gradient: 'from-green-50 to-white'
        };
      case 'XPOINTS':
        return {
          primary: 'text-blue-600',
          secondary: 'text-blue-800',
          bgLight: 'bg-blue-50',
          bgMedium: 'bg-blue-100',
          border: 'border-blue-200',
          gradient: 'from-blue-50 to-white'
        };
      case 'VELOCITY':
        return {
          primary: 'text-purple-600',
          secondary: 'text-purple-800',
          bgLight: 'bg-purple-50',
          bgMedium: 'bg-purple-100',
          border: 'border-purple-200',
          gradient: 'from-purple-50 to-white'
        };
      case 'AMEX':
        return {
          primary: 'text-blue-600',
          secondary: 'text-blue-800',
          bgLight: 'bg-blue-50',
          bgMedium: 'bg-blue-100',
          border: 'border-blue-200',
          gradient: 'from-blue-50 to-white'
        };
      case 'FLYBUYS':
        return {
          primary: 'text-yellow-600',
          secondary: 'text-yellow-800',
          bgLight: 'bg-yellow-50',
          bgMedium: 'bg-yellow-100',
          border: 'border-yellow-200',
          gradient: 'from-yellow-50 to-white'
        };
      case 'HILTON':
        return {
          primary: 'text-blue-600',
          secondary: 'text-blue-800',
          bgLight: 'bg-blue-50',
          bgMedium: 'bg-blue-100',
          border: 'border-blue-200',
          gradient: 'from-blue-50 to-white'
        };
      case 'MARRIOTT':
        return {
          primary: 'text-indigo-600',
          secondary: 'text-indigo-800',
          bgLight: 'bg-indigo-50',
          bgMedium: 'bg-indigo-100',
          border: 'border-indigo-200',
          gradient: 'from-indigo-50 to-white'
        };
      case 'AIRBNB':
        return {
          primary: 'text-pink-600',
          secondary: 'text-pink-800',
          bgLight: 'bg-pink-50',
          bgMedium: 'bg-pink-100',
          border: 'border-pink-200',
          gradient: 'from-pink-50 to-white'
        };
      case 'DELTA':
        return {
          primary: 'text-violet-600',
          secondary: 'text-violet-800',
          bgLight: 'bg-violet-50',
          bgMedium: 'bg-violet-100',
          border: 'border-violet-200',
          gradient: 'from-violet-50 to-white'
        };
      default:
        return {
          primary: 'text-gray-600',
          secondary: 'text-gray-800',
          bgLight: 'bg-gray-50',
          bgMedium: 'bg-gray-100',
          border: 'border-gray-200',
          gradient: 'from-gray-50 to-white'
        };
    }
  };
  
  const colors = getProgramColors(wallet.program);
  
  return (
    <Card className="border-0 shadow-md overflow-hidden mt-2">
      <div className={`h-1.5 bg-gradient-to-r ${colors.gradient}`}></div>
      <CardContent className="p-5">
        <div className="flex items-center gap-2 mb-4">
          <div className={`p-1.5 rounded-full ${colors.bgMedium} ${colors.primary}`}>
            <Gift className="h-4 w-4" />
          </div>
          <h3 className="font-semibold text-gray-800">
            Your {programDisplayName} points could get you:
          </h3>
        </div>
        
        {redeemableItems.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {redeemableItems.map((item, index) => {
              const canAfford = item.pointsRequired <= wallet.balance;
              return (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.1 }}
                  className={`p-4 rounded-lg border shadow-sm flex items-start gap-3 hover:shadow-md transition-shadow ${
                    canAfford 
                      ? 'border-green-200 bg-gradient-to-br from-green-50 to-white' 
                      : 'border-amber-200 bg-gradient-to-br from-amber-50 to-white'
                  }`}
                >
                  <div className={`p-2.5 rounded-full flex-shrink-0 ${
                    canAfford 
                      ? 'bg-green-100 text-green-600' 
                      : 'bg-amber-100 text-amber-600'
                  }`}>
                    {item.icon}
                  </div>
                  <div>
                    <p className="font-medium text-gray-800">{item.name}</p>
                    <p className="text-sm text-gray-500 mt-0.5">{item.description}</p>
                    <div className="flex items-center mt-2">
                      <span className={`text-xs font-semibold px-2 py-1 rounded-full ${
                        canAfford 
                          ? 'bg-green-100 text-green-700' 
                          : 'bg-amber-100 text-amber-700'
                      }`}>
                        {item.pointsRequired.toLocaleString()} points
                      </span>
                      {item.pointsRequired > wallet.balance && (
                        <span className="text-xs text-gray-500 ml-2 flex items-center">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 mr-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v3m0 0v3m0-3h3m-3 0H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          Need {(item.pointsRequired - wallet.balance).toLocaleString()} more
                        </span>
                      )}
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        ) : (
          <div className="rounded-lg border border-blue-100 bg-blue-50 p-4 text-center">
            <div className="p-2 bg-blue-100 text-blue-600 rounded-full w-10 h-10 flex items-center justify-center mx-auto mb-2">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <p className="text-sm text-blue-800 font-medium">
              Your balance isn't enough for standard rewards yet.
            </p>
            <p className="text-xs text-blue-600 mt-1">
              Keep collecting points to unlock these rewards!
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}