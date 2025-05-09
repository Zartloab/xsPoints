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
  
  return (
    <Card className="border border-gray-100 bg-white/50 backdrop-blur-sm overflow-hidden">
      <CardContent className="p-4">
        <h3 className="font-semibold text-gray-900 mb-2">
          Your {programDisplayName} points could get you:
        </h3>
        
        {redeemableItems.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-3">
            {redeemableItems.map((item, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: index * 0.1 }}
                className={`p-3 rounded-lg border flex items-center gap-3 ${
                  item.pointsRequired <= wallet.balance 
                    ? 'border-green-100 bg-green-50' 
                    : 'border-amber-100 bg-amber-50'
                }`}
              >
                <div className={`p-2 rounded-full ${
                  item.pointsRequired <= wallet.balance 
                    ? 'bg-green-100 text-green-600' 
                    : 'bg-amber-100 text-amber-600'
                }`}>
                  {item.icon}
                </div>
                <div>
                  <p className="font-medium text-gray-900">{item.name}</p>
                  <p className="text-xs text-gray-500">{item.description}</p>
                  <div className="flex items-center mt-1">
                    <span className={`text-xs font-semibold ${
                      item.pointsRequired <= wallet.balance 
                        ? 'text-green-600' 
                        : 'text-amber-600'
                    }`}>
                      {item.pointsRequired.toLocaleString()} points
                    </span>
                    {item.pointsRequired > wallet.balance && (
                      <span className="text-xs text-gray-500 ml-2">
                        (Need {(item.pointsRequired - wallet.balance).toLocaleString()} more)
                      </span>
                    )}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-gray-500 py-2">
            Your balance isn't enough for standard rewards yet. Keep collecting points!
          </p>
        )}
      </CardContent>
    </Card>
  );
}