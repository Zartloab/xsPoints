import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { storage } from '../server/storage';
import type { Transaction, Wallet, User } from '@shared/schema';

// Mock HTTP request and response objects
const mockReq = {
  isAuthenticated: vi.fn(),
  user: {
    id: 1,
    username: 'testuser',
    membershipTier: 'STANDARD',
  },
};

const mockRes = {
  json: vi.fn(),
  status: vi.fn().mockReturnThis(),
  sendStatus: vi.fn(),
};

// Mock storage functions
vi.mock('../server/storage', () => ({
  storage: {
    getUserTransactions: vi.fn(),
    getUserWallets: vi.fn(),
    getUserStats: vi.fn(),
  },
}));

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

// Import the loyalty journey handler function
import { registerRoutes } from '../server/routes';
import express from 'express';
import supertest from 'supertest';

describe('Loyalty Journey API', () => {
  let app: express.Express;
  let server: any;
  let request: supertest.SuperTest<supertest.Test>;
  
  beforeEach(async () => {
    app = express();
    
    // Mock authentication middleware
    app.use((req: any, res, next) => {
      req.isAuthenticated = () => true;
      req.user = mockReq.user;
      next();
    });
    
    server = await registerRoutes(app);
    request = supertest(server);
    
    // Set up mocks
    vi.mocked(storage.getUserTransactions).mockResolvedValue(mockTransactions);
    vi.mocked(storage.getUserWallets).mockResolvedValue(mockWallets);
    vi.mocked(storage.getUserStats).mockResolvedValue(mockUserStats);
  });
  
  afterEach(() => {
    vi.clearAllMocks();
    server.close();
  });

  it('should return 401 if user is not authenticated', async () => {
    vi.mocked(mockReq.isAuthenticated).mockReturnValue(false);
    
    const res = await request.get('/api/loyalty-journey');
    expect(res.status).toBe(401);
  });
  
  it('should return correctly formatted loyalty journey data for authenticated users', async () => {
    const res = await request.get('/api/loyalty-journey');
    
    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({
      userId: 1,
      username: 'testuser',
      membershipTier: 'STANDARD',
      stats: {
        totalTransactions: mockTransactions.length,
        totalPointsConverted: mockUserStats.pointsConverted,
        totalFeesPaid: mockUserStats.feesPaid,
        monthlyActivity: mockUserStats.monthlyPoints,
      },
    });
    
    // Verify the structure and data types
    expect(res.body).toHaveProperty('favoritePrograms');
    expect(Array.isArray(res.body.favoritePrograms)).toBe(true);
    
    expect(res.body).toHaveProperty('conversionTrends');
    expect(Array.isArray(res.body.conversionTrends)).toBe(true);
    
    expect(res.body).toHaveProperty('walletBalances');
    expect(Array.isArray(res.body.walletBalances)).toBe(true);
    
    expect(res.body).toHaveProperty('milestones');
    expect(Array.isArray(res.body.milestones)).toBe(true);
    
    expect(res.body).toHaveProperty('recentTransactions');
    expect(Array.isArray(res.body.recentTransactions)).toBe(true);
  });
  
  it('should correctly calculate favorite programs based on transaction history', async () => {
    const res = await request.get('/api/loyalty-journey');
    
    // Check that favorite programs are calculated and sorted correctly
    const favoritePrograms = res.body.favoritePrograms;
    expect(favoritePrograms.length).toBeGreaterThan(0);
    
    // Programs should be sorted by transaction count (descending)
    if (favoritePrograms.length > 1) {
      expect(favoritePrograms[0].transactionCount).toBeGreaterThanOrEqual(favoritePrograms[1].transactionCount);
    }
    
    // All programs in the mock transactions should be represented
    const programsInTransactions = new Set([
      ...mockTransactions.map(t => t.fromProgram),
      ...mockTransactions.map(t => t.toProgram)
    ]);
    
    // At least one of the favorite programs should be from our transactions
    expect(favoritePrograms.some(p => programsInTransactions.has(p.program))).toBe(true);
  });
  
  it('should correctly calculate conversion trends by month', async () => {
    const res = await request.get('/api/loyalty-journey');
    
    const trends = res.body.conversionTrends;
    expect(trends.length).toBeGreaterThan(0);
    
    // Trends should be sorted chronologically
    if (trends.length > 1) {
      const firstMonth = trends[0].month;
      const secondMonth = trends[1].month;
      expect(firstMonth.localeCompare(secondMonth)).toBeLessThanOrEqual(0);
    }
    
    // Each month from our mock transactions should be represented
    const months = new Set(mockTransactions.map(t => {
      const date = new Date(t.timestamp);
      return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    }));
    
    months.forEach(month => {
      expect(trends.some(t => t.month === month)).toBe(true);
    });
  });
  
  it('should correctly calculate wallet balances with dollar values', async () => {
    const res = await request.get('/api/loyalty-journey');
    
    const walletBalances = res.body.walletBalances;
    expect(walletBalances.length).toBe(mockWallets.length);
    
    // Each wallet should have a dollar value
    walletBalances.forEach((wallet: any) => {
      expect(wallet).toHaveProperty('program');
      expect(wallet).toHaveProperty('balance');
      expect(wallet).toHaveProperty('dollarValue');
      expect(typeof wallet.dollarValue).toBe('number');
      
      // Dollar value should be positive if balance is positive
      if (wallet.balance > 0) {
        expect(wallet.dollarValue).toBeGreaterThan(0);
      }
    });
    
    // Find a mock wallet to compare with
    const qantasWallet = walletBalances.find((w: any) => w.program === 'QANTAS');
    const mockQantasWallet = mockWallets.find(w => w.program === 'QANTAS');
    
    if (qantasWallet && mockQantasWallet) {
      expect(qantasWallet.balance).toBe(mockQantasWallet.balance);
    }
  });
  
  it('should generate appropriate milestones based on user history', async () => {
    const res = await request.get('/api/loyalty-journey');
    
    const milestones = res.body.milestones;
    expect(milestones.length).toBeGreaterThan(0);
    
    // At least one milestone should have a date (completed milestone)
    expect(milestones.some((m: any) => m.date)).toBe(true);
    
    // At least one milestone should have a progress value (in-progress milestone)
    expect(milestones.some((m: any) => m.progress !== undefined)).toBe(true);
    
    // Verify milestone format
    milestones.forEach((milestone: any) => {
      expect(milestone).toHaveProperty('title');
      expect(milestone).toHaveProperty('description');
    });
  });
  
  it('should return only the 5 most recent transactions', async () => {
    // Create a larger set of mock transactions to test pagination
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
    
    vi.mocked(storage.getUserTransactions).mockResolvedValue(manyTransactions);
    
    const res = await request.get('/api/loyalty-journey');
    
    // Should only return 5 transactions
    expect(res.body.recentTransactions.length).toBe(5);
  });
  
  it('should handle errors when storage functions fail', async () => {
    // Mock a storage error
    vi.mocked(storage.getUserTransactions).mockRejectedValue(new Error('Database error'));
    
    const res = await request.get('/api/loyalty-journey');
    
    expect(res.status).toBe(500);
    expect(res.body).toHaveProperty('message');
    expect(res.body.message).toContain('Failed to retrieve loyalty journey data');
  });
});