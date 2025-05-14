import React from 'react';
import { Banknote, ShoppingBag, Plane, Coffee, Hotel, Car, Gift } from 'lucide-react';
import { LoyaltyProgram } from '@shared/schema';
import { 
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface ProgramIllustration {
  icon: React.ElementType;
  color: string;
  label: string;
  dollarValue: number;
  examples: {
    icon: React.ElementType;
    label: string;
    value: number;
  }[];
}

// Map of loyalty programs and their associated illustrations and examples
const programIllustrations: Record<string, ProgramIllustration> = {
  QANTAS: {
    icon: Plane,
    color: 'rgb(218, 18, 31)',
    label: 'Qantas Points',
    dollarValue: 0.01,
    examples: [
      { icon: Plane, label: 'Short flight', value: 8000 },
      { icon: Coffee, label: 'Airport lounge access', value: 3500 },
      { icon: ShoppingBag, label: 'Gift card', value: 6500 }
    ]
  },
  GYG: {
    icon: ShoppingBag,
    color: 'rgb(249, 78, 50)',
    label: 'GYG Points',
    dollarValue: 0.005,
    examples: [
      { icon: Gift, label: 'Store voucher', value: 2000 },
      { icon: ShoppingBag, label: 'Merchandise', value: 5000 },
      { icon: Coffee, label: 'Free beverage', value: 1500 }
    ]
  },
  XPOINTS: {
    icon: Banknote,
    color: 'rgb(59, 130, 246)',
    label: 'xPoints',
    dollarValue: 0.01,
    examples: [
      { icon: ShoppingBag, label: 'Retail discount', value: 1000 },
      { icon: Plane, label: 'Travel credit', value: 10000 },
      { icon: Hotel, label: 'Hotel stay', value: 15000 }
    ]
  },
  VELOCITY: {
    icon: Plane,
    color: 'rgb(227, 28, 121)',
    label: 'Velocity Points',
    dollarValue: 0.012,
    examples: [
      { icon: Plane, label: 'Domestic flight', value: 7800 },
      { icon: Car, label: 'Car rental', value: 3000 },
      { icon: Hotel, label: 'Hotel discount', value: 12000 }
    ]
  },
  AMEX: {
    icon: Banknote,
    color: 'rgb(0, 114, 206)',
    label: 'Amex Points',
    dollarValue: 0.015,
    examples: [
      { icon: ShoppingBag, label: 'Shopping rebate', value: 5000 },
      { icon: Plane, label: 'Travel rewards', value: 25000 },
      { icon: Gift, label: 'Gift card', value: 10000 }
    ]
  },
  FLYBUYS: {
    icon: ShoppingBag,
    color: 'rgb(39, 111, 78)',
    label: 'Flybuys',
    dollarValue: 0.005,
    examples: [
      { icon: ShoppingBag, label: 'Grocery discount', value: 2000 },
      { icon: Gift, label: 'Movie tickets', value: 1000 },
      { icon: Coffee, label: 'Gift card', value: 4000 }
    ]
  },
  HILTON: {
    icon: Hotel,
    color: 'rgb(0, 64, 122)',
    label: 'Hilton Honors',
    dollarValue: 0.004,
    examples: [
      { icon: Hotel, label: 'Standard room', value: 20000 },
      { icon: Coffee, label: 'Food & beverage', value: 10000 },
      { icon: Gift, label: 'Room upgrade', value: 5000 }
    ]
  },
  MARRIOTT: {
    icon: Hotel,
    color: 'rgb(189, 19, 0)',
    label: 'Marriott Bonvoy',
    dollarValue: 0.007,
    examples: [
      { icon: Hotel, label: 'One night stay', value: 25000 },
      { icon: Coffee, label: 'Hotel dining', value: 6000 },
      { icon: Gift, label: 'Gift shop', value: 3000 }
    ]
  },
  AIRBNB: {
    icon: Hotel,
    color: 'rgb(255, 56, 92)',
    label: 'Airbnb Credits',
    dollarValue: 0.01,
    examples: [
      { icon: Hotel, label: 'Weekend stay', value: 10000 },
      { icon: Gift, label: 'Experience', value: 5000 },
      { icon: Coffee, label: 'Host gift', value: 2000 }
    ]
  },
  DELTA: {
    icon: Plane,
    color: 'rgb(186, 39, 52)',
    label: 'Delta SkyMiles',
    dollarValue: 0.011,
    examples: [
      { icon: Plane, label: 'Domestic flight', value: 15000 },
      { icon: Coffee, label: 'In-flight purchase', value: 2500 },
      { icon: Gift, label: 'Seat upgrade', value: 5000 }
    ]
  }
};

// Function to get the program illustration or use a default if not found
function getProgramIllustration(program: LoyaltyProgram | string): ProgramIllustration {
  return programIllustrations[program] || {
    icon: Banknote,
    color: 'rgb(59, 130, 246)',
    label: 'Points',
    dollarValue: 0.01,
    examples: [{ icon: ShoppingBag, label: 'Reward', value: 1000 }]
  };
}

interface AnimatedValueTooltipProps {
  program: LoyaltyProgram | string;
  points: number;
  children: React.ReactNode;
}

export const AnimatedValueTooltip: React.FC<AnimatedValueTooltipProps> = ({
  program,
  points,
  children
}) => {
  // Get the program illustration
  const illustration = getProgramIllustration(program as LoyaltyProgram);
  
  // Calculate the dollar value
  const dollarValue = (points * illustration.dollarValue).toLocaleString('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2
  });
  
  // Find the most relevant examples
  const relevantExamples = illustration.examples
    .sort((a, b) => Math.abs(a.value - points) - Math.abs(b.value - points))
    .slice(0, 2);
  
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <span className="cursor-help">
            {children}
          </span>
        </TooltipTrigger>
        <TooltipContent 
          side="top" 
          className="w-72 p-0 bg-white shadow-lg rounded-xl border-0"
          sideOffset={5}
        >
          <div className="overflow-hidden rounded-xl">
            {/* Header */}
            <div
              className="p-4 text-white flex items-center"
              style={{ background: illustration.color }}
            >
              <div className="bg-white/20 p-2 rounded-full mr-3">
                {React.createElement(illustration.icon, { size: 20 })}
              </div>
              <div>
                <h3 className="font-bold text-sm">{illustration.label}</h3>
                <p className="text-xs opacity-90">Estimated value</p>
              </div>
            </div>
            
            {/* Value */}
            <div className="p-4 bg-gray-50 border-b">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-gray-500 text-sm">Points</span>
                  <div className="font-bold text-xl">{points.toLocaleString()}</div>
                </div>
                <div className="text-right">
                  <span className="text-gray-500 text-sm">Value</span>
                  <div className="font-bold text-xl text-green-600">
                    {dollarValue}
                  </div>
                </div>
              </div>
            </div>
            
            {/* Examples section */}
            <div className="p-4">
              <h4 className="text-sm text-gray-500 mb-2">What you could get:</h4>
              
              <div className="space-y-3">
                {relevantExamples.map((example, index) => (
                  <div 
                    key={index}
                    className="flex items-center"
                  >
                    <div 
                      className="p-2 rounded-full mr-3 text-white" 
                      style={{ background: illustration.color }}
                    >
                      {React.createElement(example.icon, { size: 16 })}
                    </div>
                    <div className="flex-1">
                      <div className="text-sm font-medium">{example.label}</div>
                      <div className="text-xs text-gray-500">
                        ~{example.value.toLocaleString()} points
                      </div>
                    </div>
                    {points >= example.value ? (
                      <div className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full">
                        Enough!
                      </div>
                    ) : (
                      <div className="bg-gray-100 text-gray-800 text-xs px-2 py-1 rounded-full">
                        {Math.floor((points / example.value) * 100)}% there
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};