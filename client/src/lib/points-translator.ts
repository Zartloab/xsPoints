import { LoyaltyProgram } from '@shared/schema';

// Type for translated value items
export interface PointTranslation {
  title: string;
  description: string;
  icon: string;
  category: 'travel' | 'dining' | 'shopping' | 'entertainment' | 'services';
  points: number;
}

// Translation thresholds by program
interface TranslationThresholds {
  [key: string]: {
    flight: number;
    hotel: number;
    meal: number;
    shopping: number;
    entertainment: number;
  };
}

const translationThresholds: TranslationThresholds = {
  QANTAS: {
    flight: 8000,    // Economy domestic flight
    hotel: 15000,    // One night at a standard hotel
    meal: 3500,      // Restaurant meal
    shopping: 5000,  // $50 retail voucher
    entertainment: 6000, // Movie tickets
  },
  GYG: {
    flight: 11000,
    hotel: 18000,
    meal: 4000,
    shopping: 5500,
    entertainment: 7000,
  },
  XPOINTS: {
    flight: 10000,
    hotel: 16000,
    meal: 3000,
    shopping: 4500,
    entertainment: 5500,
  },
  VELOCITY: {
    flight: 7500,
    hotel: 14000,
    meal: 3200,
    shopping: 4800,
    entertainment: 5800,
  },
  AMEX: {
    flight: 9000,
    hotel: 16000,
    meal: 3500,
    shopping: 5000,
    entertainment: 6500,
  },
  FLYBUYS: {
    flight: 20000,
    hotel: 35000,
    meal: 8000,
    shopping: 10000,
    entertainment: 15000,
  },
  HILTON: {
    flight: 25000,
    hotel: 10000,
    meal: 5000,
    shopping: 12000,
    entertainment: 15000,
  },
  MARRIOTT: {
    flight: 25000,
    hotel: 12000,
    meal: 5500,
    shopping: 13000,
    entertainment: 16000,
  },
  AIRBNB: {
    flight: 30000,
    hotel: 15000, // For Airbnb stay
    meal: 7000,
    shopping: 12000,
    entertainment: 18000,
  },
  DELTA: {
    flight: 12500,
    hotel: 20000,
    meal: 5000,
    shopping: 8000,
    entertainment: 10000,
  },
};

// Main translations database by category
const translations: { [category: string]: PointTranslation[] } = {
  travel: [
    {
      title: 'Domestic Flight',
      description: 'Economy class domestic return flight',
      icon: '✈️',
      category: 'travel',
      points: 0, // Placeholder, filled dynamically
    },
    {
      title: 'Hotel Stay',
      description: 'One night at a standard hotel',
      icon: '🏨',
      category: 'travel',
      points: 0,
    },
    {
      title: 'Weekend Getaway',
      description: 'Two nights accommodation and activities',
      icon: '🧳',
      category: 'travel',
      points: 0,
    },
    {
      title: 'Flight Upgrade',
      description: 'Economy to business class upgrade',
      icon: '🥂',
      category: 'travel',
      points: 0,
    },
  ],
  dining: [
    {
      title: 'Restaurant Meal',
      description: 'Dinner for two at a casual restaurant',
      icon: '🍽️',
      category: 'dining',
      points: 0,
    },
    {
      title: 'Coffee for a Month',
      description: 'Daily coffee for 30 days',
      icon: '☕',
      category: 'dining',
      points: 0,
    },
    {
      title: 'Fine Dining Experience',
      description: 'Premium dinner for two',
      icon: '🍷',
      category: 'dining',
      points: 0,
    },
  ],
  shopping: [
    {
      title: 'Gift Card',
      description: '$50 retail shopping voucher',
      icon: '🎁',
      category: 'shopping',
      points: 0,
    },
    {
      title: 'Electronics',
      description: 'Headphones or small gadget',
      icon: '🎧',
      category: 'shopping',
      points: 0,
    },
    {
      title: 'Fashion Item',
      description: 'Clothing or accessories',
      icon: '👕',
      category: 'shopping',
      points: 0,
    },
  ],
  entertainment: [
    {
      title: 'Movie Night',
      description: 'Two cinema tickets with snacks',
      icon: '🎬',
      category: 'entertainment',
      points: 0,
    },
    {
      title: 'Streaming Subscription',
      description: 'One year of streaming service',
      icon: '📺',
      category: 'entertainment',
      points: 0,
    },
    {
      title: 'Concert Tickets',
      description: 'Two tickets to a live performance',
      icon: '🎵',
      category: 'entertainment',
      points: 0,
    },
  ],
  services: [
    {
      title: 'Airport Lounge',
      description: 'Single visit to an airport lounge',
      icon: '🛋️',
      category: 'services',
      points: 0,
    },
    {
      title: 'Spa Treatment',
      description: 'Massage or facial treatment',
      icon: '💆',
      category: 'services',
      points: 0,
    },
    {
      title: 'Rideshare Credits',
      description: 'Credit for taxi or rideshare services',
      icon: '🚕',
      category: 'services',
      points: 0,
    },
  ],
};

// Function to get translations for a specific program and an optional category
export function getPointTranslations(
  program: LoyaltyProgram,
  category?: string,
  pointBalance?: number
): PointTranslation[] {
  const thresholds = translationThresholds[program];
  
  if (!thresholds) {
    return [];
  }
  
  // Update points values based on the program's thresholds
  const updatedTranslations = Object.entries(translations).flatMap(([cat, items]) => {
    return items.map(item => {
      const newItem = { ...item };
      
      // Set points based on category
      if (item.title === 'Domestic Flight') {
        newItem.points = thresholds.flight;
      } else if (item.title === 'Hotel Stay') {
        newItem.points = thresholds.hotel;
      } else if (item.title === 'Weekend Getaway') {
        newItem.points = thresholds.hotel * 2.5;
      } else if (item.title === 'Flight Upgrade') {
        newItem.points = thresholds.flight * 1.8;
      } else if (item.category === 'dining') {
        newItem.points = thresholds.meal * (item.title === 'Fine Dining Experience' ? 2.5 : 
                                           item.title === 'Coffee for a Month' ? 3 : 1);
      } else if (item.category === 'shopping') {
        newItem.points = thresholds.shopping * (item.title === 'Electronics' ? 2 : 
                                               item.title === 'Fashion Item' ? 1.5 : 1);
      } else if (item.category === 'entertainment') {
        newItem.points = thresholds.entertainment * (item.title === 'Concert Tickets' ? 2.5 : 
                                                    item.title === 'Streaming Subscription' ? 2 : 1);
      } else if (item.category === 'services') {
        newItem.points = thresholds.entertainment * (item.title === 'Spa Treatment' ? 1.8 : 
                                                    item.title === 'Airport Lounge' ? 1.2 : 1.5);
      }
      
      return newItem;
    });
  });
  
  // Filter by category if specified
  let result = category 
    ? updatedTranslations.filter(item => item.category === category)
    : updatedTranslations;
    
  // If point balance is provided, only return items the user can afford
  if (pointBalance !== undefined) {
    result = result.filter(item => item.points <= pointBalance);
  }
    
  // Sort by points required (ascending)
  return result.sort((a, b) => a.points - b.points);
}

// Function to get a single translation at the closest threshold to the provided points
export function getClosestTranslation(
  program: LoyaltyProgram,
  points: number
): PointTranslation | null {
  const translations = getPointTranslations(program);
  
  if (!translations.length) return null;
  
  // Find item with closest points value (either just below or just above)
  return translations.reduce((closest, current) => {
    // If we haven't found any translation yet, return the current one
    if (!closest) return current;
    
    // Calculate the absolute differences
    const closestDiff = Math.abs(closest.points - points);
    const currentDiff = Math.abs(current.points - points);
    
    // Return the translation with the smallest difference
    return currentDiff < closestDiff ? current : closest;
  }, null as PointTranslation | null);
}

// Function to calculate how many more points are needed to reach a specific reward
export function getPointsNeeded(
  program: LoyaltyProgram, 
  currentPoints: number, 
  targetTranslation: PointTranslation
): number {
  return Math.max(0, targetTranslation.points - currentPoints);
}

// Function to get all rewards the user can afford with their point balance
export function getAffordableRewards(
  program: LoyaltyProgram,
  pointBalance: number
): PointTranslation[] {
  return getPointTranslations(program)
    .filter(translation => translation.points <= pointBalance)
    .sort((a, b) => b.points - a.points); // Sort by most expensive first
}

// Function to suggest the best value redemption options
export function getBestValueRedemptions(
  program: LoyaltyProgram,
  pointBalance: number
): PointTranslation[] {
  // Get all affordable rewards
  const affordable = getAffordableRewards(program, pointBalance);
  
  // If there are less than 3 affordable rewards, return all of them
  if (affordable.length <= 3) return affordable;
  
  // Otherwise, return the 3 highest-value rewards
  return affordable.slice(0, 3);
}