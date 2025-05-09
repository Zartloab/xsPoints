import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Wallet, LoyaltyProgram } from '@shared/schema';
import { GiftIcon, PlaneIcon, UtensilsIcon, BedDoubleIcon, CoffeeIcon, ShoppingBagIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';

interface PointsTranslatorProps {
  wallet: Wallet;
}

interface RedeemableItem {
  name: string;
  description: string;
  pointsRequired: number;
  icon: React.ReactNode;
}

// Define redeemable items based on loyalty program
const getRedeemableItems = (program: LoyaltyProgram, balance: number): RedeemableItem[] => {
  switch(program) {
    case 'QANTAS':
      return [
        { 
          name: 'Economy Class Flight',
          description: 'Sydney to Melbourne one-way',
          pointsRequired: 8000,
          icon: <PlaneIcon className="h-5 w-5" />
        },
        { 
          name: 'Business Class Upgrade',
          description: 'Domestic flight upgrade',
          pointsRequired: 12000,
          icon: <PlaneIcon className="h-5 w-5" />
        },
        { 
          name: 'International Economy',
          description: 'Sydney to Auckland return',
          pointsRequired: 18000,
          icon: <PlaneIcon className="h-5 w-5" />
        },
        { 
          name: 'Premium Gift Card',
          description: '$50 retail voucher',
          pointsRequired: 10500,
          icon: <GiftIcon className="h-5 w-5" />
        }
      ];
    
    case 'GYG':
      return [
        { 
          name: 'Free Burrito',
          description: 'Any regular burrito',
          pointsRequired: 1200,
          icon: <UtensilsIcon className="h-5 w-5" />
        },
        { 
          name: 'Nachos + Drink',
          description: 'Regular nachos with soft drink',
          pointsRequired: 900,
          icon: <UtensilsIcon className="h-5 w-5" />
        },
        { 
          name: 'Family Meal',
          description: '4 burritos + nachos',
          pointsRequired: 4500,
          icon: <UtensilsIcon className="h-5 w-5" />
        },
        { 
          name: 'Catering Package',
          description: 'Party pack for 8-10 people',
          pointsRequired: 10000,
          icon: <UtensilsIcon className="h-5 w-5" />
        }
      ];
    
    case 'VELOCITY':
      return [
        { 
          name: 'Economy Flight',
          description: 'Sydney to Brisbane one-way',
          pointsRequired: 7800,
          icon: <PlaneIcon className="h-5 w-5" />
        },
        { 
          name: 'Lounge Access',
          description: 'Single visit pass',
          pointsRequired: 9500,
          icon: <CoffeeIcon className="h-5 w-5" />
        },
        { 
          name: 'Flight Upgrade',
          description: 'Economy to Business',
          pointsRequired: 15000,
          icon: <PlaneIcon className="h-5 w-5" />
        }
      ];
    
    case 'AMEX':
      return [
        { 
          name: 'Premium Headphones',
          description: 'Noise-cancelling wireless',
          pointsRequired: 22000,
          icon: <GiftIcon className="h-5 w-5" />
        },
        { 
          name: 'Shopping Voucher',
          description: '$100 department store voucher',
          pointsRequired: 20000,
          icon: <ShoppingBagIcon className="h-5 w-5" />
        },
        { 
          name: 'Restaurant Credit',
          description: '$50 dining credit',
          pointsRequired: 10000,
          icon: <UtensilsIcon className="h-5 w-5" />
        }
      ];
    
    case 'HILTON':
      return [
        { 
          name: 'Standard Room Night',
          description: 'One night at Hilton Sydney',
          pointsRequired: 30000,
          icon: <BedDoubleIcon className="h-5 w-5" />
        },
        { 
          name: 'Premium Room Night',
          description: 'Executive room with lounge access',
          pointsRequired: 50000,
          icon: <BedDoubleIcon className="h-5 w-5" />
        },
        { 
          name: 'Resort Credit',
          description: '$100 dining/spa credit',
          pointsRequired: 25000,
          icon: <GiftIcon className="h-5 w-5" />
        }
      ];
    
    case 'MARRIOTT':
      return [
        { 
          name: 'Standard Room Night',
          description: 'One night at Marriott Sydney',
          pointsRequired: 35000,
          icon: <BedDoubleIcon className="h-5 w-5" />
        },
        { 
          name: 'Weekend Getaway',
          description: 'Two nights at a Category 4 hotel',
          pointsRequired: 60000,
          icon: <BedDoubleIcon className="h-5 w-5" />
        },
        { 
          name: 'Hotel Credit',
          description: '$75 property credit',
          pointsRequired: 25000,
          icon: <GiftIcon className="h-5 w-5" />
        }
      ];
    
    case 'AIRBNB':
      return [
        { 
          name: 'Weekend Stay',
          description: '$150 credit towards a booking',
          pointsRequired: 15000,
          icon: <BedDoubleIcon className="h-5 w-5" />
        },
        { 
          name: 'Week-long Vacation',
          description: '$500 credit towards a booking',
          pointsRequired: 50000,
          icon: <BedDoubleIcon className="h-5 w-5" />
        }
      ];
    
    case 'DELTA':
      return [
        { 
          name: 'Domestic Flight',
          description: 'Main Cabin within US',
          pointsRequired: 25000,
          icon: <PlaneIcon className="h-5 w-5" />
        },
        { 
          name: 'International Economy',
          description: 'US to Europe',
          pointsRequired: 60000,
          icon: <PlaneIcon className="h-5 w-5" />
        },
        { 
          name: 'First Class Upgrade',
          description: 'Domestic flight upgrade',
          pointsRequired: 15000,
          icon: <PlaneIcon className="h-5 w-5" />
        }
      ];
    
    case 'FLYBUYS':
      return [
        { 
          name: 'Grocery Voucher',
          description: '$20 supermarket voucher',
          pointsRequired: 2000,
          icon: <ShoppingBagIcon className="h-5 w-5" />
        },
        { 
          name: 'Kitchen Appliance',
          description: 'Mid-range blender or toaster',
          pointsRequired: 8000,
          icon: <GiftIcon className="h-5 w-5" />
        },
        { 
          name: 'Premium Cookware',
          description: 'High-quality pan set',
          pointsRequired: 17000,
          icon: <GiftIcon className="h-5 w-5" />
        }
      ];
    
    case 'XPOINTS':
      return [
        { 
          name: 'Universal Voucher',
          description: '$25 credit for any partner',
          pointsRequired: 2500,
          icon: <GiftIcon className="h-5 w-5" />
        },
        { 
          name: 'Premium Experience',
          description: 'Dining, travel, or shopping',
          pointsRequired: 10000,
          icon: <ShoppingBagIcon className="h-5 w-5" />
        },
        { 
          name: 'Luxury Weekend',
          description: 'Hotel stay + dining credit',
          pointsRequired: 25000,
          icon: <BedDoubleIcon className="h-5 w-5" />
        }
      ];
    
    default:
      return [];
  }
};

// Get program display name
const getProgramDisplayName = (program: LoyaltyProgram): string => {
  switch (program) {
    case 'QANTAS': return 'Qantas';
    case 'GYG': return 'GYG';
    case 'XPOINTS': return 'xPoints';
    case 'VELOCITY': return 'Velocity';
    case 'AMEX': return 'American Express';
    case 'FLYBUYS': return 'Flybuys';
    case 'HILTON': return 'Hilton';
    case 'MARRIOTT': return 'Marriott';
    case 'AIRBNB': return 'Airbnb';
    case 'DELTA': return 'Delta';
    default: return program;
  }
};

export default function PointsTranslator({ wallet }: PointsTranslatorProps) {
  const { program, balance } = wallet;
  const [items, setItems] = useState<RedeemableItem[]>([]);
  
  useEffect(() => {
    setItems(getRedeemableItems(program as LoyaltyProgram, balance));
  }, [program, balance]);

  // Get unique redeemable items that can be obtained with current balance
  const getObtainableItems = () => {
    return items.filter(item => item.pointsRequired <= balance)
      .sort((a, b) => b.pointsRequired - a.pointsRequired);
  };
  
  // Get items that require more points
  const getUnobtainableItems = () => {
    return items.filter(item => item.pointsRequired > balance)
      .sort((a, b) => a.pointsRequired - b.pointsRequired);
  };
  
  const obtainableItems = getObtainableItems();
  const unobtainableItems = getUnobtainableItems();
  
  return (
    <Card className="bg-white shadow-md border border-gray-100 overflow-hidden">
      <CardHeader className="bg-gradient-to-r from-primary-50 to-white p-6">
        <CardTitle className="text-xl font-bold text-gray-900">
          Points Translator
        </CardTitle>
        <CardDescription>
          What your {getProgramDisplayName(program as LoyaltyProgram)} points can get you in the real world
        </CardDescription>
      </CardHeader>
      
      <CardContent className="p-6">
        <div className="mb-4">
          <p className="text-sm font-medium text-gray-700">
            Current balance: <span className="font-bold text-primary-600">{balance.toLocaleString()} points</span>
          </p>
        </div>
        
        {obtainableItems.length > 0 ? (
          <div className="mb-6">
            <h3 className="text-sm font-semibold text-gray-800 mb-3">You have enough points for:</h3>
            <div className="grid grid-cols-1 gap-3">
              {obtainableItems.map((item, index) => (
                <motion.div 
                  key={index}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="flex items-start p-3 bg-gradient-to-r from-green-50 to-transparent border border-green-100 rounded-lg"
                >
                  <div className="flex-shrink-0 mr-3 w-10 h-10 bg-green-100 rounded-full flex items-center justify-center text-green-700">
                    {item.icon}
                  </div>
                  <div className="flex-grow">
                    <h4 className="font-medium text-gray-900">{item.name}</h4>
                    <p className="text-sm text-gray-600">{item.description}</p>
                    <div className="mt-1 text-xs text-gray-500">
                      <span className="font-medium">{item.pointsRequired.toLocaleString()} points</span>
                    </div>
                  </div>
                  <Button className="ml-2 bg-primary-500 text-white text-xs px-3 py-1 h-auto rounded-md" variant="default" size="sm">
                    Redeem
                  </Button>
                </motion.div>
              ))}
            </div>
          </div>
        ) : (
          <div className="mb-6 p-4 bg-gray-50 rounded-lg text-center">
            <p className="text-gray-600">You need more points to redeem rewards</p>
          </div>
        )}
        
        {unobtainableItems.length > 0 && (
          <div>
            <h3 className="text-sm font-semibold text-gray-800 mb-3">Keep earning for these rewards:</h3>
            <div className="grid grid-cols-1 gap-3">
              {unobtainableItems.slice(0, 3).map((item, index) => (
                <motion.div 
                  key={index}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 + (index * 0.1) }}
                  className="flex items-start p-3 bg-gray-50 border border-gray-200 rounded-lg"
                >
                  <div className="flex-shrink-0 mr-3 w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center text-gray-600">
                    {item.icon}
                  </div>
                  <div className="flex-grow">
                    <h4 className="font-medium text-gray-800">{item.name}</h4>
                    <p className="text-sm text-gray-600">{item.description}</p>
                    <div className="mt-1 flex items-center text-xs">
                      <div className="flex-grow bg-gray-200 h-2 rounded-full overflow-hidden">
                        <div 
                          className="bg-primary-300 h-full rounded-full"
                          style={{ 
                            width: `${Math.min(100, (balance / item.pointsRequired) * 100)}%` 
                          }}
                        />
                      </div>
                      <span className="ml-2 text-gray-600">
                        {balance.toLocaleString()} / {item.pointsRequired.toLocaleString()} points
                      </span>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}