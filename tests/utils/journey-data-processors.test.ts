import { describe, it, expect } from 'vitest';
import { Transaction } from '../../shared/schema';

// Import data processing utilities
// These functions are responsible for transforming raw transaction data
// into the formats needed for the Loyalty Journey visualization

/**
 * Calculate favorite programs based on transaction history
 */
function getFavoritePrograms(txns: Partial<Transaction>[]) {
  const programCounts: Record<string, { count: number, points: number }> = {};
  
  txns.forEach(tx => {
    // Count from programs
    if (!programCounts[tx.fromProgram!]) {
      programCounts[tx.fromProgram!] = { count: 0, points: 0 };
    }
    programCounts[tx.fromProgram!].count++;
    programCounts[tx.fromProgram!].points += tx.amountFrom!;
    
    // Count to programs
    if (!programCounts[tx.toProgram!]) {
      programCounts[tx.toProgram!] = { count: 0, points: 0 };
    }
    programCounts[tx.toProgram!].count++;
    programCounts[tx.toProgram!].points += tx.amountTo!;
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
 * Group transactions by month to show conversion trends
 */
function getConversionTrends(txns: Partial<Transaction>[]) {
  // Group transactions by month
  const monthlyTrends: Record<string, number> = {};
  
  txns.forEach(tx => {
    const date = new Date(tx.timestamp!);
    const monthYear = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    
    if (!monthlyTrends[monthYear]) {
      monthlyTrends[monthYear] = 0;
    }
    
    monthlyTrends[monthYear] += tx.amountFrom!;
  });
  
  // Convert to array and sort by date
  return Object.entries(monthlyTrends)
    .map(([month, amount]) => ({ month, amount }))
    .sort((a, b) => a.month.localeCompare(b.month));
}

/**
 * Calculate potential savings based on conversion patterns
 */
function calculatePotentialSavings(txns: Partial<Transaction>[]) {
  let potentialSavings = 0;
  
  // For demo purposes, assume 5% potential savings on conversions not using xPoints as intermediary
  txns.forEach(tx => {
    if (tx.fromProgram !== "XPOINTS" && tx.toProgram !== "XPOINTS") {
      potentialSavings += tx.amountFrom! * 0.05;
    }
  });
  
  return Math.round(potentialSavings);
}

/**
 * Calculate wallet balances with dollar values
 */
function calculateDollarValue(program: string, balance: number) {
  const approximateValues: Record<string, number> = {
    'QANTAS': 0.01,
    'VELOCITY': 0.01,
    'GYG': 0.008,
    'XPOINTS': 0.015,
    'AMEX': 0.007,
    'FLYBUYS': 0.005,
    'HILTON': 0.004,
    'MARRIOTT': 0.006,
    'AIRBNB': 0.009,
    'DELTA': 0.011
  };
  
  const rate = approximateValues[program] || 0.01;
  return Math.round(balance * rate * 100) / 100;
}

describe('Journey Data Processors', () => {
  // Sample test data
  const mockTransactions: Partial<Transaction>[] = [
    {
      id: 1,
      userId: 1,
      fromProgram: 'QANTAS',
      toProgram: 'XPOINTS',
      amountFrom: 10000,
      amountTo: 15000,
      timestamp: '2025-01-15T00:00:00Z',
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
      timestamp: '2025-02-15T00:00:00Z',
      feeApplied: 0,
      status: 'completed',
    },
    {
      id: 3,
      userId: 1,
      fromProgram: 'GYG',
      toProgram: 'QANTAS',
      amountFrom: 3000,
      amountTo: 2500,
      timestamp: '2025-02-20T00:00:00Z',
      feeApplied: 0,
      status: 'completed',
    },
  ];

  describe('getFavoritePrograms', () => {
    it('should count program usage correctly', () => {
      const favorites = getFavoritePrograms(mockTransactions);
      
      // All programs should be included
      expect(favorites.length).toBe(3);
      
      // Should count both from and to usages
      const qantasProgram = favorites.find(p => p.program === 'QANTAS');
      expect(qantasProgram).toBeDefined();
      expect(qantasProgram!.transactionCount).toBe(2); // Used once as source, once as destination
      
      // Should sum points correctly
      const xpointsProgram = favorites.find(p => p.program === 'XPOINTS');
      expect(xpointsProgram).toBeDefined();
      expect(xpointsProgram!.pointsProcessed).toBe(20000); // 15000 received + 5000 sent
    });
    
    it('should sort programs by transaction count', () => {
      const favorites = getFavoritePrograms(mockTransactions);
      
      // Programs should be sorted by transaction count (desc)
      for (let i = 1; i < favorites.length; i++) {
        expect(favorites[i-1].transactionCount).toBeGreaterThanOrEqual(favorites[i].transactionCount);
      }
    });
    
    it('should handle empty transaction lists', () => {
      const favorites = getFavoritePrograms([]);
      expect(favorites).toEqual([]);
    });
  });

  describe('getConversionTrends', () => {
    it('should group transactions by month correctly', () => {
      const trends = getConversionTrends(mockTransactions);
      
      // Should have 2 months (Jan and Feb)
      expect(trends.length).toBe(2);
      
      // First month should be January 2025
      expect(trends[0].month).toBe('2025-01');
      expect(trends[0].amount).toBe(10000); // Single transaction amount
      
      // Second month should be February 2025
      expect(trends[1].month).toBe('2025-02');
      expect(trends[1].amount).toBe(8000); // Sum of two transactions (5000 + 3000)
    });
    
    it('should sort trends chronologically', () => {
      const trends = getConversionTrends(mockTransactions);
      
      // Months should be in ascending order
      for (let i = 1; i < trends.length; i++) {
        expect(trends[i-1].month.localeCompare(trends[i].month)).toBeLessThan(0);
      }
    });
    
    it('should handle empty transaction lists', () => {
      const trends = getConversionTrends([]);
      expect(trends).toEqual([]);
    });
  });

  describe('calculatePotentialSavings', () => {
    it('should calculate savings for direct conversions', () => {
      // Only the GYG -> QANTAS transaction is a direct conversion
      const savings = calculatePotentialSavings(mockTransactions);
      
      // 5% of 3000 = 150
      expect(savings).toBe(150);
    });
    
    it('should not count conversions using XPOINTS as intermediary', () => {
      // Create transactions that all use XPOINTS as intermediary
      const xpointsOnlyTransactions = [
        {
          fromProgram: 'QANTAS',
          toProgram: 'XPOINTS',
          amountFrom: 10000,
        },
        {
          fromProgram: 'XPOINTS',
          toProgram: 'GYG',
          amountFrom: 5000,
        },
      ];
      
      const savings = calculatePotentialSavings(xpointsOnlyTransactions);
      expect(savings).toBe(0); // No direct conversions = no savings
    });
    
    it('should handle empty transaction lists', () => {
      const savings = calculatePotentialSavings([]);
      expect(savings).toBe(0);
    });
  });

  describe('calculateDollarValue', () => {
    it('should calculate dollar values using program-specific rates', () => {
      expect(calculateDollarValue('QANTAS', 10000)).toBe(100); // 1 cent per point
      expect(calculateDollarValue('XPOINTS', 10000)).toBe(150); // 1.5 cents per point
      expect(calculateDollarValue('GYG', 10000)).toBe(80); // 0.8 cents per point
    });
    
    it('should use default rate for unknown programs', () => {
      expect(calculateDollarValue('UNKNOWN', 10000)).toBe(100); // Default 1 cent per point
    });
    
    it('should round to 2 decimal places', () => {
      expect(calculateDollarValue('QANTAS', 10001)).toBe(100.01);
      expect(calculateDollarValue('GYG', 10001)).toBe(80.01);
    });
  });
});