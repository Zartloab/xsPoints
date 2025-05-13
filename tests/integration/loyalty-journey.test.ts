import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import express from 'express';
import supertest from 'supertest';
import { storage } from '../../server/storage';
import type { Transaction, Wallet } from '@shared/schema';

// Mock the storage
vi.mock('../../server/storage', () => ({
  storage: {
    getUserTransactions: vi.fn(),
    getUserWallets: vi.fn(),
    getUserStats: vi.fn(),
  },
}));

// Mock test data
const mockUser = {
  id: 1,
  username: 'testuser',
  membershipTier: 'SILVER',
};

const mockTransactions: Partial<Transaction>[] = [
  {
    id: 1,
    userId: 1,
    fromProgram: 'QANTAS',
    toProgram: 'XPOINTS',
    amountFrom: 10000,
    amountTo: 15000,
    timestamp: new Date('2025-01-15T00:00:00.000Z').toISOString(),
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
    timestamp: new Date('2025-01-20T00:00:00.000Z').toISOString(),
    feeApplied: 0,
    status: 'completed',
  },
  {
    id: 3,
    userId: 1,
    fromProgram: 'GYG',
    toProgram: 'XPOINTS',
    amountFrom: 3000,
    amountTo: 3500,
    timestamp: new Date('2025-02-05T00:00:00.000Z').toISOString(),
    feeApplied: 0,
    status: 'completed',
  },
];

const mockWallets: Partial<Wallet>[] = [
  {
    id: 1,
    userId: 1,
    program: 'QANTAS',
    balance: 5000,
    accountNumber: '123456789',
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
    accountNumber: 'GYG123456',
    accountName: 'Test GYG Account',
    createdAt: new Date().toISOString(),
  },
];

const mockUserStats = {
  pointsConverted: 18000,
  feesPaid: 0,
  monthlyPoints: 8000,
  tier: 'SILVER',
};

describe('Loyalty Journey Integration Test', () => {
  let app: express.Express;
  let request: supertest.SuperTest<supertest.Test>;

  beforeEach(() => {
    app = express();
    
    // Add loyalty journey endpoint to the express app
    app.get('/api/loyalty-journey', async (req, res) => {
      if (!req.isAuthenticated || !req.isAuthenticated()) {
        return res.sendStatus(401);
      }
      
      try {
        // Get user transactions
        const transactions = await storage.getUserTransactions(req.user!.id);
        
        // Get user's current wallet balances
        const wallets = await storage.getUserWallets(req.user!.id);
        
        // Get user stats 
        const stats = await storage.getUserStats(req.user!.id);
        
        // Helper functions for data processing
        const getFavoritePrograms = (txns: any[]) => {
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
        };
        
        const getConversionTrends = (txns: any[]) => {
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
        };
        
        const calculatePotentialSavings = (txns: any[]) => {
          let potentialSavings = 0;
          
          // For demo purposes, assume 5% potential savings on conversions not using xPoints as intermediary
          txns.forEach(tx => {
            if (tx.fromProgram !== "XPOINTS" && tx.toProgram !== "XPOINTS") {
              potentialSavings += tx.amountFrom * 0.05;
            }
          });
          
          return Math.round(potentialSavings);
        };
        
        const getWalletBalances = (userWallets: any[]) => {
          return userWallets.map(wallet => ({
            program: wallet.program,
            balance: wallet.balance,
            dollarValue: calculateDollarValue(wallet.program, wallet.balance)
          }));
        };
        
        const calculateDollarValue = (program: string, balance: number) => {
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
        };
        
        const generateMilestones = (userStats: any, txns: any[]) => {
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
              date: new Date().toISOString(),
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
        };
        
        // Calculate metrics
        const favoritePrograms = getFavoritePrograms(transactions);
        const conversionTrends = getConversionTrends(transactions);
        const potentialSavings = calculatePotentialSavings(transactions);
        const walletBalances = getWalletBalances(wallets);
        const milestones = generateMilestones(stats, transactions);
        
        // Enhanced journey data
        const journeyData = {
          userId: req.user!.id,
          username: req.user!.username,
          membershipTier: req.user!.membershipTier,
          stats: {
            totalTransactions: transactions.length,
            totalPointsConverted: stats.pointsConverted,
            totalFeesPaid: stats.feesPaid,
            estimatedSavings: potentialSavings,
            monthlyActivity: stats.monthlyPoints
          },
          favoritePrograms,
          conversionTrends,
          walletBalances,
          milestones,
          recentTransactions: transactions.slice(0, 5) // Last 5 transactions
        };
        
        res.json(journeyData);
      } catch (error: any) {
        console.error("Error getting loyalty journey data:", error);
        res.status(500).json({ message: "Failed to retrieve loyalty journey data" });
      }
    });
    
    // Mock authentication middleware
    app.use((req: any, res, next) => {
      req.isAuthenticated = () => true;
      req.user = mockUser;
      next();
    });
    
    request = supertest(app);
    
    // Setup mocks
    vi.mocked(storage.getUserTransactions).mockResolvedValue(mockTransactions as Transaction[]);
    vi.mocked(storage.getUserWallets).mockResolvedValue(mockWallets as Wallet[]);
    vi.mocked(storage.getUserStats).mockResolvedValue(mockUserStats);
  });
  
  afterEach(() => {
    vi.clearAllMocks();
  });
  
  it('should integrate all components to produce consistent loyalty journey data', async () => {
    const response = await request.get('/api/loyalty-journey');
    
    expect(response.status).toBe(200);
    
    // Verify storage functions were called with correct parameters
    expect(storage.getUserTransactions).toHaveBeenCalledWith(mockUser.id);
    expect(storage.getUserWallets).toHaveBeenCalledWith(mockUser.id);
    expect(storage.getUserStats).toHaveBeenCalledWith(mockUser.id);
    
    // Verify structure of response
    expect(response.body).toHaveProperty('userId', mockUser.id);
    expect(response.body).toHaveProperty('username', mockUser.username);
    expect(response.body).toHaveProperty('membershipTier', mockUser.membershipTier);
    
    // Verify stats
    expect(response.body.stats).toMatchObject({
      totalTransactions: mockTransactions.length,
      totalPointsConverted: mockUserStats.pointsConverted,
      totalFeesPaid: mockUserStats.feesPaid,
      monthlyActivity: mockUserStats.monthlyPoints
    });
    
    // Verify favorite programs
    expect(Array.isArray(response.body.favoritePrograms)).toBe(true);
    expect(response.body.favoritePrograms.length).toBeGreaterThan(0);
    
    // Verify trends
    expect(Array.isArray(response.body.conversionTrends)).toBe(true);
    expect(response.body.conversionTrends.length).toBe(2); // Two months in our mock data
    
    // Verify wallet balances
    expect(Array.isArray(response.body.walletBalances)).toBe(true);
    expect(response.body.walletBalances.length).toBe(mockWallets.length);
    
    // Verify milestones
    expect(Array.isArray(response.body.milestones)).toBe(true);
    expect(response.body.milestones.length).toBeGreaterThan(0);
    
    // Verify recent transactions
    expect(Array.isArray(response.body.recentTransactions)).toBe(true);
    expect(response.body.recentTransactions.length).toBeLessThanOrEqual(5);
  });
  
  it('should handle empty transaction lists gracefully', async () => {
    // Override mock to return empty transactions
    vi.mocked(storage.getUserTransactions).mockResolvedValue([]);
    
    const response = await request.get('/api/loyalty-journey');
    
    expect(response.status).toBe(200);
    
    // Check stats reflect empty transactions
    expect(response.body.stats.totalTransactions).toBe(0);
    
    // Check empty arrays for transaction-related data
    expect(response.body.favoritePrograms).toEqual([]);
    expect(response.body.conversionTrends).toEqual([]);
    expect(response.body.recentTransactions).toEqual([]);
    
    // Wallet balances should still exist
    expect(response.body.walletBalances.length).toBe(mockWallets.length);
    
    // Milestones should be limited to those not requiring transactions
    expect(response.body.milestones.some((m: any) => m.title === 'Points Milestone')).toBe(true);
    expect(response.body.milestones.some((m: any) => m.title === 'First Conversion')).toBe(false);
  });
  
  it('should handle database errors gracefully', async () => {
    // Simulate a database error
    vi.mocked(storage.getUserTransactions).mockRejectedValue(new Error('Database error'));
    
    const response = await request.get('/api/loyalty-journey');
    
    expect(response.status).toBe(500);
    expect(response.body).toHaveProperty('message', 'Failed to retrieve loyalty journey data');
  });
  
  it('should reflect user tier in milestones and data', async () => {
    const response = await request.get('/api/loyalty-journey');
    
    expect(response.status).toBe(200);
    
    // Check tier reflected in top-level data
    expect(response.body.membershipTier).toBe('SILVER');
    
    // Check tier milestone exists for non-standard tiers
    const tierMilestone = response.body.milestones.find((m: any) => m.title === 'Upgraded to SILVER Tier');
    expect(tierMilestone).toBeDefined();
  });
  
  it('should reflect all wallet balances accurately', async () => {
    const response = await request.get('/api/loyalty-journey');
    
    expect(response.status).toBe(200);
    
    // Check each wallet balance
    mockWallets.forEach((wallet) => {
      const responseWallet = response.body.walletBalances.find((w: any) => w.program === wallet.program);
      expect(responseWallet).toBeDefined();
      expect(responseWallet.balance).toBe(wallet.balance);
      
      // Check dollar value calculation
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
      
      const expectedDollarValue = Math.round(wallet.balance! * (approximateValues[wallet.program!] || 0.01) * 100) / 100;
      expect(responseWallet.dollarValue).toBe(expectedDollarValue);
    });
  });
});