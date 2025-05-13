import { LoyaltyProgram } from '@shared/schema';

// Define types of rewards that points can be translated to
export type PointTranslation = {
  type: 'flight' | 'hotel' | 'dining' | 'shopping' | 'experience';
  description: string;
  pointsRequired: number;
  cashValue: number;  // Approximate value in dollars
};

// Mapping of loyalty programs to their reward value per point (in dollars)
const pointValueMap: Record<LoyaltyProgram, number> = {
  QANTAS: 0.006,    // Exactly $0.006 per Qantas point (0.6 cents)
  GYG: 0.008,       // Exactly $0.008 per GYG point (0.8 cents)
  XPOINTS: 0.01,    // Exactly $0.01 per xPoint (1 cent) - our standardized value
  VELOCITY: 0.007,  // Exactly $0.007 per Velocity point (0.7 cents)
  AMEX: 0.009,      // Exactly $0.009 per AMEX point (0.9 cents)
  FLYBUYS: 0.005,   // Exactly $0.005 per Flybuys point (0.5 cents)
  HILTON: 0.004,    // Exactly $0.004 per Hilton point (0.4 cents)
  MARRIOTT: 0.006,  // Exactly $0.006 per Marriott point (0.6 cents)
  AIRBNB: 0.0095,   // Exactly $0.0095 per Airbnb point (0.95 cents)
  DELTA: 0.0065,    // Exactly $0.0065 per Delta point (0.65 cents)
};

// Standard rewards catalog that applies across all programs
// Points required will be adjusted based on the program's point value
const standardRewards: PointTranslation[] = [
  {
    type: 'flight',
    description: 'A domestic one-way flight',
    pointsRequired: 12500,
    cashValue: 250,
  },
  {
    type: 'flight',
    description: 'A return trip to Bali',
    pointsRequired: 50000,
    cashValue: 800,
  },
  {
    type: 'hotel',
    description: 'One night at a luxury hotel',
    pointsRequired: 25000,
    cashValue: 400,
  },
  {
    type: 'hotel',
    description: 'A weekend getaway (2 nights)',
    pointsRequired: 40000,
    cashValue: 600,
  },
  {
    type: 'dining',
    description: 'A fancy dinner for two',
    pointsRequired: 10000,
    cashValue: 150,
  },
  {
    type: 'dining',
    description: 'A free lunch',
    pointsRequired: 2000,
    cashValue: 30,
  },
  {
    type: 'shopping',
    description: 'A $100 shopping voucher',
    pointsRequired: 5000,
    cashValue: 100,
  },
  {
    type: 'shopping',
    description: 'A new premium smartphone',
    pointsRequired: 60000,
    cashValue: 1000,
  },
  {
    type: 'experience',
    description: 'Movie tickets for two',
    pointsRequired: 2000,
    cashValue: 40,
  },
  {
    type: 'experience',
    description: 'A hot air balloon ride',
    pointsRequired: 20000,
    cashValue: 350,
  },
];

/**
 * Get possible translations for the given points amount in a specific loyalty program
 * @param points The number of points to translate
 * @param program The loyalty program the points belong to
 * @returns An array of reward translations that are achievable with the points
 */
export function translatePoints(points: number, program: LoyaltyProgram): PointTranslation[] {
  if (points <= 0) return [];
  
  // Get the value per point for this program
  const pointValue = pointValueMap[program] || 0.01; // Default to $0.01 (1 cent) if program not found
  
  // Calculate the cash equivalent of the points
  const cashEquivalent = points * pointValue;
  
  // Adjust standard rewards based on the program's point value
  const programAdjustedRewards = standardRewards.map(reward => {
    // Calculate how many points in this program would be needed for the cash value
    const adjustedPointsRequired = Math.round(reward.cashValue / pointValue);
    
    return {
      ...reward,
      pointsRequired: adjustedPointsRequired,
    };
  });
  
  // Filter rewards that are achievable with the points amount
  return programAdjustedRewards
    .filter(reward => reward.pointsRequired <= points)
    .sort((a, b) => b.pointsRequired - a.pointsRequired); // Sort by highest points first
}

/**
 * Get how many more points are needed to reach a specific reward
 * @param points Current points balance
 * @param reward The reward to check against
 * @returns The number of additional points needed, or 0 if already achievable
 */
export function pointsNeededForReward(points: number, reward: PointTranslation): number {
  if (points >= reward.pointsRequired) return 0;
  return reward.pointsRequired - points;
}

/**
 * Get custom point translations for specific use cases like the explorer page
 * This allows for more tailored messaging and dynamic content
 * @param points The number of points
 * @param program The loyalty program
 * @returns Custom translations for specific point ranges
 */
/**
 * Calculate the dollar value of points in a specific loyalty program
 * @param points The number of points
 * @param program The loyalty program
 * @returns Dollar value of the points (e.g., 100 xPoints = $1.00)
 */
export function getPointsDollarValue(points: number, program: LoyaltyProgram): number {
  const pointValue = pointValueMap[program] || 0.01;
  return points * pointValue;
}

/**
 * Format dollar value with currency symbol
 * @param value Dollar value to format
 * @returns Formatted dollar string with $ symbol and 2 decimal places
 */
export function formatDollarValue(value: number): string {
  return `$${value.toFixed(2)}`;
}

export function getCustomTranslation(points: number, program: LoyaltyProgram): string {
  const cashValue = Math.round(getPointsDollarValue(points, program));
  
  if (points < 1000) {
    return `Your ${points} ${program} points are worth about $${cashValue} - maybe grab a coffee or snack.`;
  } else if (points < 5000) {
    return `With ${points} ${program} points (about $${cashValue}) you could get a nice meal or movie tickets.`;
  } else if (points < 15000) {
    return `Your ${points} ${program} points are valued around $${cashValue} - enough for a quality restaurant dinner for two.`;
  } else if (points < 30000) {
    return `Those ${points} ${program} points are worth approximately $${cashValue} - consider a weekend getaway or a nice shopping spree.`;
  } else if (points < 60000) {
    return `With ${points} ${program} points (valued at ~$${cashValue}), you could enjoy a domestic flight or a short vacation package.`;
  } else {
    return `Your impressive ${points} ${program} points balance is worth around $${cashValue} - enough for an international flight or luxury hotel stay.`;
  }
}