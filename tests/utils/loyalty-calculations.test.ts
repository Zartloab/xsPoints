import { describe, it, expect, beforeEach } from 'vitest';
import type { Transaction, Wallet } from '@shared/schema';

// Utility functions to test (extracted from the loyalty-journey API endpoint)
// In a real application, these would be in separate utility files

/**
 * Gets favorite programs based on transaction history
 */
function getFavoritePrograms(txns: Transaction[]) {
  const programCounts: Record<string, { count: number, points: number }> = {};
  
  txns.forEach(tx => {
    // Count from programs
    if (!programCounts[tx.fromProgram]) {
      programCounts[tx.fromProgram] = { count: 0, points: 0 };
    }
    programCounts[tx.fromProgram].count++;
    programCounts[tx.fromProgram].points += tx.amountFrom;
    
    // Count to programs
    if (!programCounts[tx.toProgram]) {
      programCounts[tx.toProgram] = { count: 0, points: 0 };
    }
    programCounts[tx.toProgram].count++;
    programCounts[tx.toProgram].points += tx.amountTo;
  });
  
  // Convert to sorted array
  return Object.entries(programCounts)
    .map(([program, data]) => ({ 
      program, 
      transactionCount: data.count,
      pointsProcessed: data.points 
    }))
    .sort((a, b) => b.transactionCount - a.transactionCount)
    .slice(0, 3); // Top 3 programs
}

/**
 * Gets conversion trends by month
 */
function getConversionTrends(txns: Transaction[]) {
  // Group transactions by month
  const monthlyTrends: Record<string, number> = {};
  
  txns.forEach(tx => {
    const date = new Date(tx.timestamp);
    const monthYear = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    
    if (!monthlyTrends[monthYear]) {
      monthlyTrends[monthYear] = 0;
    }
    
    monthlyTrends[monthYear] += tx.amountFrom;
  });
  
  // Convert to array and sort by date
  return Object.entries(monthlyTrends)
    .map(([month, amount]) => ({ month, amount }))
    .sort((a, b) => a.month.localeCompare(b.month));
}

/**
 * Calculates potential savings based on transaction history
 */
function calculatePotentialSavings(txns: Transaction[]) {
  // This is a simplified version - in a real app this would use more 
  // sophisticated algorithms to calculate optimal conversion paths
  let potentialSavings = 0;
  
  // For demo purposes, assume 5% potential savings on conversions not using xPoints as intermediary
  txns.forEach(tx => {
    if (tx.fromProgram !== "XPOINTS" && tx.toProgram !== "XPOINTS") {
      potentialSavings += tx.amountFrom * 0.05;
    }
  });
  
  return Math.round(potentialSavings);
}

/**
 * Calculates dollar value of loyalty points
 */
function calculateDollarValue(program: string, balance: number) {
  // Very simplified dollar value calculation
  // In a real app, this would use real-time redemption rates or a more complex formula
  const approximateValues: Record<string, number> = {
    'QANTAS': 0.01,    // 1 cent per point
    'VELOCITY': 0.01,  // 1 cent per point
    'GYG': 0.008,      // 0.8 cents per point
    'XPOINTS': 0.015,  // 1.5 cents per point
    'AMEX': 0.007,     // 0.7 cents per point
    'FLYBUYS': 0.005,  // 0.5 cents per point
    'HILTON': 0.004,   // 0.4 cents per point
    'MARRIOTT': 0.006, // 0.6 cents per point
    'AIRBNB': 0.009,   // 0.9 cents per point
    'DELTA': 0.011     // 1.1 cents per point
  };
  
  const rate = approximateValues[program] || 0.01;
  return Math.round(balance * rate * 100) / 100; // Rounded to 2 decimal places
}

/**
 * Gets wallet balances with dollar values
 */
function getWalletBalances(userWallets: Wallet[]) {
  return userWallets.map(wallet => ({
    program: wallet.program,
    balance: wallet.balance,
    dollarValue: calculateDollarValue(wallet.program, wallet.balance)
  }));
}

/**
 * Generates loyalty milestones
 */
function generateMilestones(userStats: any, txns: Transaction[]) {
  const milestones = [];
  
  // Milestone 1: First transaction
  if (txns.length > 0) {
    const firstTx = [...txns].sort((a, b) => 
      new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
    )[0];
    
    milestones.push({
      title: "First Conversion",
      date: firstTx.timestamp,
      description: `Converted ${firstTx.amountFrom} ${firstTx.fromProgram} to ${firstTx.amountTo} ${firstTx.toProgram}`
    });
  }
  
  // Milestone 2: Membership tier upgrades
  if (userStats.tier !== "STANDARD") {
    milestones.push({
      title: `Upgraded to ${userStats.tier} Tier`,
      date: new Date().toISOString(), // In reality this would be the actual upgrade date
      description: `Achieved ${userStats.tier} membership tier with improved conversion rates`
    });
  }
  
  // Milestone 3: Largest conversion
  if (txns.length > 0) {
    const largestTx = [...txns].sort((a, b) => b.amountFrom - a.amountFrom)[0];
    
    milestones.push({
      title: "Largest Conversion",
      date: largestTx.timestamp,
      description: `Converted ${largestTx.amountFrom} ${largestTx.fromProgram} to ${largestTx.amountTo} ${largestTx.toProgram}`
    });
  }
  
  // Milestone 4: Total points milestone
  const pointsThresholds = [10000, 50000, 100000, 500000, 1000000];
  const nextThreshold = pointsThresholds.find(t => t > userStats.pointsConverted) || 0;
  const percentToNextThreshold = nextThreshold ? (userStats.pointsConverted / nextThreshold) * 100 : 100;
  
  milestones.push({
    title: `Points Milestone`,
    description: `Converted ${userStats.pointsConverted} points. ${nextThreshold ? `${Math.round(percentToNextThreshold)}% to next milestone of ${nextThreshold}` : 'Reached maximum milestone!'}`,
    progress: Math.min(percentToNextThreshold, 100) / 100
  });
  
  return milestones;
}

// Sample test data
const mockTransactions: Transaction[] = [
  {
    id: 1,
    userId: 1,
    fromProgram: 'QANTAS',
    toProgram: 'XPOINTS',
    amountFrom: 10000,
    amountTo: 15000,
    timestamp: new Date('2025-01-15').toISOString(),
    feeApplied: 0,
    status: 'completed',
  },
  {
    id: 2,
    userId: 1,
    fromProgram: 'XPOINTS',
    toProgram: 'GYG',
    amountFrom: 5000,
    amountTo: 4000,
    timestamp: new Date('2025-02-20').toISOString(),
    feeApplied: 0,
    status: 'completed',
  },
  {
    id: 3,
    userId: 1,
    fromProgram: 'VELOCITY',
    toProgram: 'XPOINTS',
    amountFrom: 20000,
    amountTo: 18000,
    timestamp: new Date('2025-03-10').toISOString(),
    feeApplied: 50,
    status: 'completed',
  }
];

const mockWallets: Wallet[] = [
  {
    id: 1,
    userId: 1,
    program: 'QANTAS',
    balance: 5000,
    accountNumber: '12345678',
    accountName: 'Test Account',
    createdAt: new Date().toISOString(),
  },
  {
    id: 2,
    userId: 1,
    program: 'XPOINTS',
    balance: 10000,
    accountNumber: null,
    accountName: null,
    createdAt: new Date().toISOString(),
  },
  {
    id: 3,
    userId: 1,
    program: 'GYG',
    balance: 2000,
    accountNumber: 'GYG12345',
    accountName: 'Test GYG',
    createdAt: new Date().toISOString(),
  }
];

const mockUserStats = {
  pointsConverted: 35000,
  feesPaid: 50,
  monthlyPoints: 20000,
  tier: 'STANDARD',
};

describe('Loyalty Journey Calculation Utilities', () => {
  describe('getFavoritePrograms', () => {
    it('should return programs sorted by transaction count', () => {
      const result = getFavoritePrograms(mockTransactions);
      
      // XPOINTS appears in 2 transactions
      expect(result[0].program).toBe('XPOINTS');
      expect(result[0].transactionCount).toBe(2);
      
      // Check all programs are present
      const programNames = result.map(p => p.program);
      expect(programNames).toContain('QANTAS');
      expect(programNames).toContain('XPOINTS');
      expect(programNames).toContain('GYG');
      expect(programNames).toContain('VELOCITY');
    });
    
    it('should calculate total points processed correctly', () => {
      const result = getFavoritePrograms(mockTransactions);
      
      // Find QANTAS program
      const qantas = result.find(p => p.program === 'QANTAS');
      expect(qantas).toBeDefined();
      expect(qantas?.pointsProcessed).toBe(10000); // Only in one transaction
      
      // Find XPOINTS program (appears in two transactions)
      const xpoints = result.find(p => p.program === 'XPOINTS');
      expect(xpoints).toBeDefined();
      expect(xpoints?.pointsProcessed).toBe(5000 + 18000); // Sum of points from both transactions
    });
    
    it('should handle empty transaction list', () => {
      const result = getFavoritePrograms([]);
      expect(result).toEqual([]);
    });
  });
  
  describe('getConversionTrends', () => {
    it('should group transactions by month', () => {
      const result = getConversionTrends(mockTransactions);
      
      // Should have an entry for each month in our mock data
      expect(result.length).toBe(3);
      
      // Check months are in correct order
      expect(result[0].month).toBe('2025-01');
      expect(result[1].month).toBe('2025-02');
      expect(result[2].month).toBe('2025-03');
    });
    
    it('should sum transaction amounts for each month', () => {
      const result = getConversionTrends(mockTransactions);
      
      // January: 10000
      expect(result[0].amount).toBe(10000);
      
      // February: 5000
      expect(result[1].amount).toBe(5000);
      
      // March: 20000
      expect(result[2].amount).toBe(20000);
    });
    
    it('should handle empty transaction list', () => {
      const result = getConversionTrends([]);
      expect(result).toEqual([]);
    });
    
    it('should handle multiple transactions in the same month', () => {
      // Add another transaction in March
      const transactions = [
        ...mockTransactions,
        {
          id: 4,
          userId: 1,
          fromProgram: 'GYG',
          toProgram: 'QANTAS',
          amountFrom: 3000,
          amountTo: 2800,
          timestamp: new Date('2025-03-20').toISOString(),
          feeApplied: 0,
          status: 'completed',
        }
      ];
      
      const result = getConversionTrends(transactions);
      
      // March should now be 20000 + 3000 = 23000
      const march = result.find(t => t.month === '2025-03');
      expect(march).toBeDefined();
      expect(march?.amount).toBe(23000);
    });
  });
  
  describe('calculatePotentialSavings', () => {
    it('should calculate savings for direct conversions', () => {
      // Add a direct conversion (not using XPOINTS)
      const transactions = [
        ...mockTransactions,
        {
          id: 4,
          userId: 1,
          fromProgram: 'QANTAS',
          toProgram: 'GYG',
          amountFrom: 10000,
          amountTo: 8000,
          timestamp: new Date('2025-03-20').toISOString(),
          feeApplied: 0,
          status: 'completed',
        }
      ];
      
      const result = calculatePotentialSavings(transactions);
      
      // 5% of 10000 = 500
      expect(result).toBe(500);
    });
    
    it('should return 0 for conversions already using XPOINTS', () => {
      // All our mock transactions use XPOINTS
      const result = calculatePotentialSavings(mockTransactions);
      
      expect(result).toBe(0);
    });
    
    it('should handle empty transaction list', () => {
      const result = calculatePotentialSavings([]);
      expect(result).toBe(0);
    });
  });
  
  describe('calculateDollarValue', () => {
    it('should calculate correct dollar values based on program rates', () => {
      // QANTAS at 1 cent per point
      expect(calculateDollarValue('QANTAS', 10000)).toBe(100);
      
      // XPOINTS at 1.5 cents per point
      expect(calculateDollarValue('XPOINTS', 10000)).toBe(150);
      
      // GYG at 0.8 cents per point
      expect(calculateDollarValue('GYG', 10000)).toBe(80);
    });
    
    it('should use default rate for unknown programs', () => {
      // Unknown program should use default of 1 cent per point
      expect(calculateDollarValue('UNKNOWN', 10000)).toBe(100);
    });
    
    it('should handle zero balance', () => {
      expect(calculateDollarValue('QANTAS', 0)).toBe(0);
    });
  });
  
  describe('getWalletBalances', () => {
    it('should return wallet balances with dollar values', () => {
      const result = getWalletBalances(mockWallets);
      
      expect(result.length).toBe(mockWallets.length);
      
      // Check structure
      result.forEach(wallet => {
        expect(wallet).toHaveProperty('program');
        expect(wallet).toHaveProperty('balance');
        expect(wallet).toHaveProperty('dollarValue');
      });
      
      // Check values for specific wallets
      const qantas = result.find(w => w.program === 'QANTAS');
      expect(qantas).toBeDefined();
      expect(qantas?.balance).toBe(5000);
      expect(qantas?.dollarValue).toBe(50); // 5000 * 0.01
      
      const xpoints = result.find(w => w.program === 'XPOINTS');
      expect(xpoints).toBeDefined();
      expect(xpoints?.balance).toBe(10000);
      expect(xpoints?.dollarValue).toBe(150); // 10000 * 0.015
    });
    
    it('should handle empty wallet list', () => {
      const result = getWalletBalances([]);
      expect(result).toEqual([]);
    });
  });
  
  describe('generateMilestones', () => {
    it('should include first transaction milestone', () => {
      const result = generateMilestones(mockUserStats, mockTransactions);
      
      // First transaction milestone
      const firstConversion = result.find(m => m.title === 'First Conversion');
      expect(firstConversion).toBeDefined();
      expect(firstConversion?.date).toBe(mockTransactions[0].timestamp);
      expect(firstConversion?.description).toContain('Converted 10000 QANTAS to 15000 XPOINTS');
    });
    
    it('should include largest transaction milestone', () => {
      const result = generateMilestones(mockUserStats, mockTransactions);
      
      // Largest transaction milestone
      const largestConversion = result.find(m => m.title === 'Largest Conversion');
      expect(largestConversion).toBeDefined();
      expect(largestConversion?.date).toBe(mockTransactions[2].timestamp); // The VELOCITY transaction
      expect(largestConversion?.description).toContain('Converted 20000 VELOCITY to 18000 XPOINTS');
    });
    
    it('should include points milestone with progress', () => {
      const result = generateMilestones(mockUserStats, mockTransactions);
      
      // Points milestone
      const pointsMilestone = result.find(m => m.title === 'Points Milestone');
      expect(pointsMilestone).toBeDefined();
      expect(pointsMilestone?.description).toContain('Converted 35000 points');
      expect(pointsMilestone?.progress).toBeDefined();
      
      // 35000 / 50000 = 70%
      expect(pointsMilestone?.progress).toBe(0.7);
    });
    
    it('should include tier upgrade milestone for non-standard tiers', () => {
      // Create stats with GOLD tier
      const goldStats = { ...mockUserStats, tier: 'GOLD' };
      
      const result = generateMilestones(goldStats, mockTransactions);
      
      // Tier upgrade milestone
      const tierUpgrade = result.find(m => m.title === 'Upgraded to GOLD Tier');
      expect(tierUpgrade).toBeDefined();
      expect(tierUpgrade?.description).toContain('Achieved GOLD membership tier');
    });
    
    it('should not include tier upgrade milestone for standard tier', () => {
      const result = generateMilestones(mockUserStats, mockTransactions);
      
      // Should not have tier upgrade milestone
      const tierUpgrade = result.find(m => m.title?.includes('Upgraded to'));
      expect(tierUpgrade).toBeUndefined();
    });
    
    it('should handle empty transaction list', () => {
      const result = generateMilestones(mockUserStats, []);
      
      // Should still have points milestone
      expect(result.length).toBe(1);
      expect(result[0].title).toBe('Points Milestone');
    });
  });
});