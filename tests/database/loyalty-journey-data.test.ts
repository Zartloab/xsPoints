import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { Transaction, Wallet, User } from '@shared/schema';
import { storage } from '../../server/storage';
import { db } from '../../server/db';

// Mock the database
vi.mock('../../server/db', () => ({
  db: {
    select: vi.fn().mockReturnThis(),
    from: vi.fn().mockReturnThis(),
    where: vi.fn().mockReturnThis(),
    orderBy: vi.fn().mockReturnThis(),
    limit: vi.fn().mockReturnThis(),
  }
}));

// Sample test data
const mockUser: Partial<User> = {
  id: 1,
  username: 'testuser',
  email: 'test@example.com',
  firstName: 'Test',
  lastName: 'User',
  membershipTier: 'SILVER',
  pointsConverted: 15000,
  monthlyPointsConverted: 5000,
};

const mockTransactions: Partial<Transaction>[] = [
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
];

const mockUserStats = {
  pointsConverted: 15000,
  feesPaid: 0,
  monthlyPoints: 5000,
  tier: 'SILVER',
};

describe('Loyalty Journey Database Operations', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });
  
  afterEach(() => {
    vi.clearAllMocks();
  });
  
  describe('getUserTransactions', () => {
    it('should fetch transactions from the database', async () => {
      // Mock the database response
      vi.mocked(db.select).mockReturnThis();
      vi.mocked(db.from).mockReturnThis();
      vi.mocked(db.where).mockResolvedValue(mockTransactions);
      
      const result = await storage.getUserTransactions(1);
      
      expect(result).toEqual(mockTransactions);
      expect(db.select).toHaveBeenCalled();
      expect(db.from).toHaveBeenCalled();
      expect(db.where).toHaveBeenCalled();
    });
    
    it('should order transactions by timestamp', async () => {
      // Set up spy on the orderBy method
      const orderBySpy = vi.fn().mockResolvedValue(mockTransactions);
      vi.mocked(db.where).mockReturnValue({ orderBy: orderBySpy });
      
      await storage.getUserTransactions(1);
      
      expect(orderBySpy).toHaveBeenCalledWith('timestamp', 'desc');
    });
    
    it('should handle database errors gracefully', async () => {
      // Mock a database error
      vi.mocked(db.where).mockRejectedValue(new Error('Database connection failed'));
      
      await expect(storage.getUserTransactions(1)).rejects.toThrow('Database connection failed');
    });
  });
  
  describe('getUserWallets', () => {
    it('should fetch wallets from the database', async () => {
      // Mock the database response
      vi.mocked(db.select).mockReturnThis();
      vi.mocked(db.from).mockReturnThis();
      vi.mocked(db.where).mockResolvedValue(mockWallets);
      
      const result = await storage.getUserWallets(1);
      
      expect(result).toEqual(mockWallets);
      expect(db.select).toHaveBeenCalled();
      expect(db.from).toHaveBeenCalled();
      expect(db.where).toHaveBeenCalled();
    });
    
    it('should handle users with no wallets', async () => {
      // Mock empty result
      vi.mocked(db.where).mockResolvedValue([]);
      
      const result = await storage.getUserWallets(1);
      
      expect(result).toEqual([]);
    });
    
    it('should handle database errors gracefully', async () => {
      // Mock a database error
      vi.mocked(db.where).mockRejectedValue(new Error('Database connection failed'));
      
      await expect(storage.getUserWallets(1)).rejects.toThrow('Database connection failed');
    });
  });
  
  describe('getUserStats', () => {
    it('should fetch user stats from the database', async () => {
      // Mock the database response to return user with stats
      vi.mocked(db.select).mockReturnThis();
      vi.mocked(db.from).mockReturnThis();
      vi.mocked(db.where).mockResolvedValue([mockUser]);
      
      const result = await storage.getUserStats(1);
      
      expect(result).toEqual(
        expect.objectContaining({
          pointsConverted: mockUser.pointsConverted,
          monthlyPoints: mockUser.monthlyPointsConverted,
          tier: mockUser.membershipTier,
        })
      );
      expect(db.select).toHaveBeenCalled();
      expect(db.from).toHaveBeenCalled();
      expect(db.where).toHaveBeenCalled();
    });
    
    it('should return default stats for new users', async () => {
      // Mock empty result (user not found)
      vi.mocked(db.where).mockResolvedValue([]);
      
      const result = await storage.getUserStats(999);
      
      // Should return default values
      expect(result).toEqual(
        expect.objectContaining({
          pointsConverted: 0,
          feesPaid: 0,
          monthlyPoints: 0,
          tier: 'STANDARD',
        })
      );
    });
    
    it('should handle database errors gracefully', async () => {
      // Mock a database error
      vi.mocked(db.where).mockRejectedValue(new Error('Database connection failed'));
      
      await expect(storage.getUserStats(1)).rejects.toThrow('Database connection failed');
    });
  });
  
  describe('Loyalty Journey Data Integration', () => {
    it('should fetch all required data for the loyalty journey', async () => {
      // Mock successful database responses
      vi.mocked(db.where)
        .mockResolvedValueOnce(mockTransactions) // getUserTransactions
        .mockResolvedValueOnce(mockWallets) // getUserWallets
        .mockResolvedValueOnce([mockUser]); // getUserStats (via getUser)
      
      // Call all three methods
      const transactions = await storage.getUserTransactions(1);
      const wallets = await storage.getUserWallets(1);
      const stats = await storage.getUserStats(1);
      
      // Verify all data is fetched correctly
      expect(transactions).toEqual(mockTransactions);
      expect(wallets).toEqual(mockWallets);
      expect(stats).toEqual(
        expect.objectContaining({
          pointsConverted: mockUser.pointsConverted,
          tier: mockUser.membershipTier,
        })
      );
      
      // Check that database was called 3 times (once for each fetch)
      expect(db.select).toHaveBeenCalledTimes(3);
      expect(db.from).toHaveBeenCalledTimes(3);
      expect(db.where).toHaveBeenCalledTimes(3);
    });
    
    it('should handle empty results in some tables', async () => {
      // Mock mixed database responses
      vi.mocked(db.where)
        .mockResolvedValueOnce([]) // getUserTransactions (empty)
        .mockResolvedValueOnce(mockWallets) // getUserWallets
        .mockResolvedValueOnce([mockUser]); // getUserStats (via getUser)
      
      // Call all three methods
      const transactions = await storage.getUserTransactions(1);
      const wallets = await storage.getUserWallets(1);
      const stats = await storage.getUserStats(1);
      
      // Verify data handling
      expect(transactions).toEqual([]);
      expect(wallets).toEqual(mockWallets);
      expect(stats).toEqual(
        expect.objectContaining({
          pointsConverted: mockUser.pointsConverted,
          tier: mockUser.membershipTier,
        })
      );
    });
    
    it('should handle transactions with different statuses', async () => {
      // Mix of completed and pending transactions
      const transactionsWithStatuses = [
        ...mockTransactions,
        {
          id: 3,
          userId: 1,
          fromProgram: 'GYG',
          toProgram: 'QANTAS',
          amountFrom: 3000,
          amountTo: 2500,
          timestamp: new Date('2025-03-10').toISOString(),
          feeApplied: 0,
          status: 'pending', // Pending status
        }
      ];
      
      vi.mocked(db.where).mockResolvedValueOnce(transactionsWithStatuses);
      
      const transactions = await storage.getUserTransactions(1);
      
      expect(transactions).toEqual(transactionsWithStatuses);
      expect(transactions.length).toBe(3);
    });
    
    it('should handle transaction fee calculation for the user stats', async () => {
      // Add a transaction with fees
      const transactionsWithFees = [
        ...mockTransactions,
        {
          id: 3,
          userId: 1,
          fromProgram: 'GYG',
          toProgram: 'QANTAS',
          amountFrom: 30000,
          amountTo: 25000,
          timestamp: new Date('2025-03-10').toISOString(),
          feeApplied: 100, // Fee of 100 points
          status: 'completed',
        }
      ];
      
      // Mock user with fees paid
      const userWithFees = {
        ...mockUser,
        feesPaid: 100,
      };
      
      vi.mocked(db.where)
        .mockResolvedValueOnce(transactionsWithFees) // getUserTransactions
        .mockResolvedValueOnce(mockWallets) // getUserWallets
        .mockResolvedValueOnce([userWithFees]); // getUserStats (via getUser)
      
      // Call all three methods
      const transactions = await storage.getUserTransactions(1);
      const stats = await storage.getUserStats(1);
      
      // Check fees are included
      expect(transactions[2].feeApplied).toBe(100);
      expect(stats.feesPaid).toBe(100);
    });
  });
});