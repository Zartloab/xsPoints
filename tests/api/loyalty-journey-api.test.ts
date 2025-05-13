import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import express from 'express';
import supertest from 'supertest';
import { storage } from '../../server/storage';
import { Transaction, Wallet, User } from '@shared/schema';

// Mock the storage
vi.mock('../../server/storage', () => ({
  storage: {
    getUserTransactions: vi.fn(),
    getUserWallets: vi.fn(),
    getUserStats: vi.fn(),
  },
}));

// Mock test data
const mockUser: Partial<User> = {
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

describe('Loyalty Journey API Endpoint', () => {
  let app: express.Express;
  let request: supertest.SuperTest<supertest.Test>;

  beforeEach(() => {
    app = express();
    
    // Set up route handler
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
  
  it('should return 401 when user is not authenticated', async () => {
    // Override the isAuthenticated function for this test
    app.use((req: any, res, next) => {
      req.isAuthenticated = () => false;
      next();
    });
    
    const response = await request.get('/api/loyalty-journey');
    expect(response.status).toBe(401);
  });
  
  it('should return correctly formatted loyalty journey data for authenticated users', async () => {
    const response = await request.get('/api/loyalty-journey');
    
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('userId', mockUser.id);
    expect(response.body).toHaveProperty('username', mockUser.username);
    expect(response.body).toHaveProperty('membershipTier', mockUser.membershipTier);
    
    // Check stats
    expect(response.body.stats).toHaveProperty('totalTransactions', mockTransactions.length);
    expect(response.body.stats).toHaveProperty('totalPointsConverted', mockUserStats.pointsConverted);
    expect(response.body.stats).toHaveProperty('totalFeesPaid', mockUserStats.feesPaid);
    expect(response.body.stats).toHaveProperty('monthlyActivity', mockUserStats.monthlyPoints);
    
    // Check data structures
    expect(Array.isArray(response.body.favoritePrograms)).toBe(true);
    expect(Array.isArray(response.body.conversionTrends)).toBe(true);
    expect(Array.isArray(response.body.walletBalances)).toBe(true);
    expect(Array.isArray(response.body.milestones)).toBe(true);
    expect(Array.isArray(response.body.recentTransactions)).toBe(true);
    
    // Check that favorite programs are properly calculated
    expect(response.body.favoritePrograms.length).toBeGreaterThan(0);
    expect(response.body.favoritePrograms[0]).toHaveProperty('program');
    expect(response.body.favoritePrograms[0]).toHaveProperty('transactionCount');
    expect(response.body.favoritePrograms[0]).toHaveProperty('pointsProcessed');
    
    // Check that wallet balances include dollar values
    expect(response.body.walletBalances.length).toBe(mockWallets.length);
    expect(response.body.walletBalances[0]).toHaveProperty('dollarValue');
    
    // Check that conversion trends are correctly grouped by month
    const uniqueMonths = new Set(mockTransactions.map(t => {
      const date = new Date(t.timestamp!);
      return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    }));
    expect(response.body.conversionTrends.length).toBe(uniqueMonths.size);
    
    // Check that milestones are generated
    expect(response.body.milestones.length).toBeGreaterThan(0);
    expect(response.body.milestones.some((m: any) => m.title === 'First Conversion')).toBe(true);
    
    // Check that recent transactions are returned
    expect(response.body.recentTransactions.length).toBeLessThanOrEqual(5);
  });
  
  it('should handle empty transaction history', async () => {
    // Override the mock to return empty arrays
    vi.mocked(storage.getUserTransactions).mockResolvedValue([]);
    
    const response = await request.get('/api/loyalty-journey');
    
    expect(response.status).toBe(200);
    expect(response.body.stats.totalTransactions).toBe(0);
    expect(response.body.favoritePrograms).toEqual([]);
    expect(response.body.conversionTrends).toEqual([]);
    expect(response.body.recentTransactions).toEqual([]);
    
    // Should still have wallet balances
    expect(response.body.walletBalances.length).toBe(mockWallets.length);
    
    // Should still have milestones, but fewer of them
    expect(response.body.milestones.length).toBeGreaterThan(0);
    expect(response.body.milestones.some((m: any) => m.title === 'First Conversion')).toBe(false);
  });
  
  it('should handle database errors gracefully', async () => {
    // Mock a database error
    vi.mocked(storage.getUserTransactions).mockRejectedValue(new Error('Database error'));
    
    const response = await request.get('/api/loyalty-journey');
    
    expect(response.status).toBe(500);
    expect(response.body).toHaveProperty('message', 'Failed to retrieve loyalty journey data');
  });
  
  it('should limit recent transactions to 5', async () => {
    // Create a list of 10 mock transactions
    const manyTransactions = Array.from({ length: 10 }, (_, i) => ({
      id: i + 1,
      userId: 1,
      fromProgram: 'QANTAS',
      toProgram: 'XPOINTS',
      amountFrom: 1000 * (i + 1),
      amountTo: 1500 * (i + 1),
      timestamp: new Date(2025, 0, i + 1).toISOString(),
      feeApplied: 0,
      status: 'completed',
    }));
    
    vi.mocked(storage.getUserTransactions).mockResolvedValue(manyTransactions as Transaction[]);
    
    const response = await request.get('/api/loyalty-journey');
    
    expect(response.status).toBe(200);
    expect(response.body.recentTransactions.length).toBe(5);
  });
  
  it('should calculate estimated savings correctly', async () => {
    // Add a direct conversion not using XPOINTS (which should generate savings)
    const transactionsWithDirectConversion = [
      ...mockTransactions, 
      {
        id: 4,
        userId: 1,
        fromProgram: 'QANTAS',
        toProgram: 'GYG', // Direct conversion without XPOINTS
        amountFrom: 10000,
        amountTo: 8000,
        timestamp: new Date('2025-03-01T00:00:00.000Z').toISOString(),
        feeApplied: 0,
        status: 'completed',
      }
    ];
    
    vi.mocked(storage.getUserTransactions).mockResolvedValue(transactionsWithDirectConversion as Transaction[]);
    
    const response = await request.get('/api/loyalty-journey');
    
    expect(response.status).toBe(200);
    expect(response.body.stats.estimatedSavings).toBe(500); // 5% of 10000
  });
});