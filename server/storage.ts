import { 
  users, wallets, transactions, exchangeRates, tierBenefits, businessAnalytics,
  type User, type InsertUser, type Wallet, type Transaction, type ExchangeRate, 
  type LoyaltyProgram, type TierBenefit, type InsertTierBenefits, type MembershipTier,
  type BusinessAnalytics, type InsertBusinessAnalytics, type BulkPointIssuanceData
} from "@shared/schema";
import session from "express-session";
import createMemoryStore from "memorystore";
import connectPg from "connect-pg-simple";
import { db } from "./db";
import { eq, and, desc } from "drizzle-orm";

// Define a SessionStore type to avoid the namespace error
type SessionStore = session.Store;

// Session store options
const MemoryStore = createMemoryStore(session);
const PostgresSessionStore = connectPg(session);

export interface IStorage {
  // User operations
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUserTier(userId: number, tier: MembershipTier, expiresAt?: Date): Promise<User>;
  updateUserStats(userId: number, pointsConverted: number, fee: number): Promise<User>;
  getUserStats(userId: number): Promise<{ pointsConverted: number, feesPaid: number, monthlyPoints: number, tier: MembershipTier }>;
  
  // Wallet operations
  getUserWallets(userId: number): Promise<Wallet[]>;
  getWallet(userId: number, program: LoyaltyProgram): Promise<Wallet | undefined>;
  createWallet(wallet: Omit<Wallet, "id" | "createdAt">): Promise<Wallet>;
  updateWalletBalance(id: number, balance: number): Promise<Wallet>;
  updateWalletAccount(id: number, accountNumber: string | null, accountName: string | null): Promise<Wallet>;
  
  // Transaction operations
  getUserTransactions(userId: number): Promise<Transaction[]>;
  createTransaction(transaction: Omit<Transaction, "id" | "timestamp">): Promise<Transaction>;
  
  // Exchange rates operations
  getExchangeRate(fromProgram: LoyaltyProgram, toProgram: LoyaltyProgram): Promise<ExchangeRate | undefined>;
  
  // Tier benefits operations
  getTierBenefits(tier: MembershipTier): Promise<TierBenefit | undefined>;
  createTierBenefits(benefits: InsertTierBenefits): Promise<TierBenefit>;
  initializeTierBenefits(): Promise<void>;
  
  // Business analytics operations
  getBusinessAnalytics(businessId: number): Promise<BusinessAnalytics | undefined>;
  updateBusinessAnalytics(businessId: number, data: Partial<InsertBusinessAnalytics>): Promise<BusinessAnalytics>;
  bulkIssuePoints(data: BulkPointIssuanceData): Promise<number>; // Returns number of successful issuances
  
  // Session store
  sessionStore: SessionStore;
}

// PostgreSQL Database Storage Implementation
export class DatabaseStorage implements IStorage {
  sessionStore: SessionStore;

  constructor() {
    // Initialize session store with PostgreSQL
    this.sessionStore = new PostgresSessionStore({
      conObject: {
        connectionString: process.env.DATABASE_URL,
      },
      createTableIfMissing: true
    });
    
    // Set up initial exchange rates if they don't exist
    this.initializeExchangeRates();
    
    // Set up initial tier benefits if they don't exist
    this.initializeTierBenefits();
  }

  private async initializeExchangeRates() {
    try {
      // Check if exchange rates exist
      const existingRates = await db.select().from(exchangeRates);
      
      if (existingRates.length === 0) {
        // Initial rates to set up
        const initialRates = [
          {
            fromProgram: 'QANTAS' as LoyaltyProgram,
            toProgram: 'XPOINTS' as LoyaltyProgram,
            rate: "0.5", 
            lastUpdated: new Date(),
          },
          {
            fromProgram: 'XPOINTS' as LoyaltyProgram,
            toProgram: 'QANTAS' as LoyaltyProgram,
            rate: "1.8",
            lastUpdated: new Date(),
          },
          {
            fromProgram: 'GYG' as LoyaltyProgram,
            toProgram: 'XPOINTS' as LoyaltyProgram,
            rate: "0.8",
            lastUpdated: new Date(),
          },
          {
            fromProgram: 'XPOINTS' as LoyaltyProgram,
            toProgram: 'GYG' as LoyaltyProgram,
            rate: "1.25",
            lastUpdated: new Date(),
          }
        ];
        
        // Insert initial exchange rates
        await db.insert(exchangeRates).values(initialRates);
      }
    } catch (error) {
      console.error("Error initializing exchange rates:", error);
    }
  }

  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    // Insert the user, kycVerified defaults to 'unverified'
    const [user] = await db.insert(users).values(insertUser).returning();
    
    // Create default wallets for new user
    await this.createWallet({
      userId: user.id,
      program: "QANTAS",
      balance: 0,
      accountNumber: null,
      accountName: null,
    });
    
    await this.createWallet({
      userId: user.id,
      program: "GYG",
      balance: 0,
      accountNumber: null,
      accountName: null,
    });
    
    await this.createWallet({
      userId: user.id,
      program: "XPOINTS",
      balance: 1000, // Give new users some starting xPoints
      accountNumber: null,
      accountName: null,
    });
    
    return user;
  }

  async getUserWallets(userId: number): Promise<Wallet[]> {
    return db.select().from(wallets).where(eq(wallets.userId, userId));
  }

  async getWallet(userId: number, program: LoyaltyProgram): Promise<Wallet | undefined> {
    const [wallet] = await db.select().from(wallets).where(
      and(
        eq(wallets.userId, userId),
        eq(wallets.program, program)
      )
    );
    return wallet;
  }

  async createWallet(wallet: Omit<Wallet, "id" | "createdAt">): Promise<Wallet> {
    const [newWallet] = await db.insert(wallets).values(wallet).returning();
    return newWallet;
  }

  async updateWalletBalance(id: number, balance: number): Promise<Wallet> {
    const [updatedWallet] = await db
      .update(wallets)
      .set({ balance })
      .where(eq(wallets.id, id))
      .returning();
      
    if (!updatedWallet) {
      throw new Error("Wallet not found");
    }
    
    return updatedWallet;
  }
  
  async updateWalletAccount(id: number, accountNumber: string | null, accountName: string | null): Promise<Wallet> {
    const [updatedWallet] = await db
      .update(wallets)
      .set({ 
        accountNumber, 
        accountName 
      })
      .where(eq(wallets.id, id))
      .returning();
      
    if (!updatedWallet) {
      throw new Error("Wallet not found");
    }
    
    return updatedWallet;
  }

  async getUserTransactions(userId: number): Promise<Transaction[]> {
    return db
      .select()
      .from(transactions)
      .where(eq(transactions.userId, userId))
      .orderBy(desc(transactions.timestamp));
  }

  async createTransaction(transaction: Omit<Transaction, "id" | "timestamp">): Promise<Transaction> {
    const [newTransaction] = await db
      .insert(transactions)
      .values(transaction)
      .returning();
    
    // Update user's stats when a transaction is created with fees
    if (transaction.feeApplied > 0) {
      await this.updateUserStats(transaction.userId, transaction.amountFrom, transaction.feeApplied);
    } else {
      // Even if no fee, update conversion amount stats
      await this.updateUserStats(transaction.userId, transaction.amountFrom, 0);
    }
      
    return newTransaction;
  }
  
  async updateUserStats(userId: number, pointsConverted: number, fee: number): Promise<User> {
    const user = await this.getUser(userId);
    if (!user) {
      throw new Error(`User with ID ${userId} not found`);
    }
    
    // Get current date for comparison
    const now = new Date();
    
    // Check if we need to reset monthly stats
    let monthlyPointsConverted = user.monthlyPointsConverted || 0;
    let lastReset = user.lastMonthReset;
    
    // If last reset is null or more than a month ago, reset monthly points
    if (!lastReset || new Date(lastReset).getMonth() !== now.getMonth() || 
        new Date(lastReset).getFullYear() !== now.getFullYear()) {
      monthlyPointsConverted = 0;
      lastReset = now;
    }
    
    // Update user's stats
    const [updatedUser] = await db
      .update(users)
      .set({
        pointsConverted: (user.pointsConverted || 0) + pointsConverted,
        monthlyPointsConverted: monthlyPointsConverted + pointsConverted,
        totalFeesPaid: (user.totalFeesPaid || 0) + fee,
        lastMonthReset: lastReset
      })
      .where(eq(users.id, userId))
      .returning();
    
    // Check if the user qualifies for a tier upgrade
    await this.checkAndUpdateUserTier(userId);
    
    return updatedUser;
  }
  
  async getUserStats(userId: number): Promise<{ pointsConverted: number, feesPaid: number, monthlyPoints: number, tier: MembershipTier }> {
    const user = await this.getUser(userId);
    if (!user) {
      throw new Error(`User with ID ${userId} not found`);
    }
    
    return {
      pointsConverted: user.pointsConverted || 0,
      feesPaid: user.totalFeesPaid || 0,
      monthlyPoints: user.monthlyPointsConverted || 0,
      tier: user.membershipTier || 'STANDARD'
    };
  }
  
  async updateUserTier(userId: number, tier: MembershipTier, expiresAt?: Date): Promise<User> {
    const [updatedUser] = await db
      .update(users)
      .set({
        membershipTier: tier,
        tierExpiresAt: expiresAt || null
      })
      .where(eq(users.id, userId))
      .returning();
      
    if (!updatedUser) {
      throw new Error(`User with ID ${userId} not found`);
    }
    
    return updatedUser;
  }
  
  private async checkAndUpdateUserTier(userId: number): Promise<void> {
    const user = await this.getUser(userId);
    if (!user) return;
    
    // Get all tier benefits ordered by threshold (descending)
    const allTiers = await db
      .select()
      .from(tierBenefits)
      .orderBy(desc(tierBenefits.monthlyPointsThreshold));
    
    // Start with the highest tier and move down
    let newTier: MembershipTier = 'STANDARD';
    let expiryDays = 30; // Default
    
    for (const tier of allTiers) {
      if (user.monthlyPointsConverted >= tier.monthlyPointsThreshold) {
        newTier = tier.tier;
        expiryDays = tier.monthlyExpiryDays;
        break;
      }
    }
    
    // If tier is different or expiry date needs updating
    if (newTier !== user.membershipTier || !user.tierExpiresAt) {
      const now = new Date();
      const expiryDate = new Date(now);
      expiryDate.setDate(expiryDate.getDate() + expiryDays);
      
      await this.updateUserTier(userId, newTier, expiryDate);
    }
  }
  
  async getTierBenefits(tier: MembershipTier): Promise<TierBenefit | undefined> {
    const [benefits] = await db
      .select()
      .from(tierBenefits)
      .where(eq(tierBenefits.tier, tier));
    
    return benefits;
  }
  
  async createTierBenefits(benefits: InsertTierBenefits): Promise<TierBenefit> {
    // Check if tier already exists
    const existingTier = await this.getTierBenefits(benefits.tier);
    
    if (existingTier) {
      // Update existing tier
      const [updatedTier] = await db
        .update(tierBenefits)
        .set(benefits)
        .where(eq(tierBenefits.tier, benefits.tier))
        .returning();
      
      return updatedTier;
    } else {
      // Create new tier
      const [newTier] = await db
        .insert(tierBenefits)
        .values(benefits)
        .returning();
      
      return newTier;
    }
  }
  
  async initializeTierBenefits(): Promise<void> {
    try {
      // Check if tier benefits exist
      const existingBenefits = await db.select().from(tierBenefits);
      
      if (existingBenefits.length === 0) {
        console.log("Initializing tier benefits...");
        // Define initial tiers
        const initialTiers: InsertTierBenefits[] = [
          {
            tier: 'STANDARD',
            monthlyPointsThreshold: 0, // No minimum
            freeConversionLimit: 10000, // 10k free points
            conversionFeeRate: "0.005", // 0.5%
            p2pMinimumFee: "0.005", // 0.5% minimum fee
            p2pMaximumFee: "0.03", // 3% max fee
            monthlyExpiryDays: 30, // Expires after 30 days
          },
          {
            tier: 'SILVER',
            monthlyPointsThreshold: 50000, // 50k points in a month
            freeConversionLimit: 25000, // 25k free points
            conversionFeeRate: "0.004", // 0.4%
            p2pMinimumFee: "0.004", // 0.4% minimum fee
            p2pMaximumFee: "0.025", // 2.5% max fee
            monthlyExpiryDays: 60, // Expires after 60 days
          },
          {
            tier: 'GOLD',
            monthlyPointsThreshold: 100000, // 100k points in a month
            freeConversionLimit: 50000, // 50k free points
            conversionFeeRate: "0.003", // 0.3%
            p2pMinimumFee: "0.003", // 0.3% minimum fee
            p2pMaximumFee: "0.02", // 2% max fee
            monthlyExpiryDays: 90, // Expires after 90 days
          },
          {
            tier: 'PLATINUM',
            monthlyPointsThreshold: 250000, // 250k points in a month
            freeConversionLimit: 100000, // 100k free points
            conversionFeeRate: "0.002", // 0.2%
            p2pMinimumFee: "0.002", // 0.2% minimum fee
            p2pMaximumFee: "0.015", // 1.5% max fee
            monthlyExpiryDays: 120, // Expires after 120 days
          }
        ];
        
        // Insert initial tier benefits
        for (const tier of initialTiers) {
          await this.createTierBenefits(tier);
        }
      }
    } catch (error) {
      console.error("Error initializing tier benefits:", error);
    }
  }

  async getExchangeRate(fromProgram: LoyaltyProgram, toProgram: LoyaltyProgram): Promise<ExchangeRate | undefined> {
    try {
      // First check our database for the most recent rate
      const [rate] = await db
        .select()
        .from(exchangeRates)
        .where(
          and(
            eq(exchangeRates.fromProgram, fromProgram),
            eq(exchangeRates.toProgram, toProgram)
          )
        );
      
      // Check if the rate exists and is recent (less than 1 hour old)
      const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
      
      if (rate && rate.lastUpdated > oneHourAgo) {
        // Rate is recent enough, return it
        return rate;
      }
      
      // Rate doesn't exist or is too old, fetch a fresh rate from external API
      const updatedRate = await this.fetchRealTimeRate(fromProgram, toProgram);
      
      if (updatedRate) {
        // Update the database with the new rate
        if (rate) {
          // Update existing rate
          const [updated] = await db
            .update(exchangeRates)
            .set({ 
              rate: updatedRate.rate,
              lastUpdated: new Date()
            })
            .where(
              and(
                eq(exchangeRates.fromProgram, fromProgram),
                eq(exchangeRates.toProgram, toProgram)
              )
            )
            .returning();
          
          return updated;
        } else {
          // Insert new rate
          const [newRate] = await db
            .insert(exchangeRates)
            .values({
              fromProgram,
              toProgram,
              rate: updatedRate.rate,
              lastUpdated: new Date()
            })
            .returning();
          
          return newRate;
        }
      }
      
      // If we couldn't fetch a new rate, return the old one (if it exists)
      return rate;
    } catch (error) {
      console.error("Error fetching exchange rate:", error);
      // Fall back to database rate if API call fails
      const [fallbackRate] = await db
        .select()
        .from(exchangeRates)
        .where(
          and(
            eq(exchangeRates.fromProgram, fromProgram),
            eq(exchangeRates.toProgram, toProgram)
          )
        );
      
      return fallbackRate;
    }
  }
  
  // Helper method to fetch real-time exchange rates from external APIs
  private async fetchRealTimeRate(fromProgram: LoyaltyProgram, toProgram: LoyaltyProgram): Promise<{ rate: string } | null> {
    try {
      // This is a placeholder for real API integration
      // In a production environment, we would:
      // 1. Make API calls to the respective loyalty programs
      // 2. Parse the response to get current rates
      // 3. Apply any business rules or adjustments
      
      // For now, simulate an API call with some realistic rates
      // with slight variations to simulate market movement
      
      // Base rates
      const baseRates: Record<string, number> = {
        'QANTAS-XPOINTS': 0.5,
        'XPOINTS-QANTAS': 1.8,
        'GYG-XPOINTS': 0.8,
        'XPOINTS-GYG': 1.25
      };
      
      const key = `${fromProgram}-${toProgram}`;
      
      if (baseRates[key]) {
        // Add a small random variation (-5% to +5%)
        const variation = (Math.random() * 0.1) - 0.05;
        const newRate = baseRates[key] * (1 + variation);
        return { rate: newRate.toFixed(4) };
      }
      
      return null;
    } catch (error) {
      console.error("Error fetching real-time rate:", error);
      return null;
    }
  }
  
  // Business analytics methods
  async getBusinessAnalytics(businessId: number): Promise<BusinessAnalytics | undefined> {
    const [analytics] = await db
      .select()
      .from(businessAnalytics)
      .where(eq(businessAnalytics.businessId, businessId));
    
    return analytics;
  }
  
  async updateBusinessAnalytics(businessId: number, data: Partial<InsertBusinessAnalytics>): Promise<BusinessAnalytics> {
    const existingAnalytics = await this.getBusinessAnalytics(businessId);
    
    if (existingAnalytics) {
      // Update existing analytics
      const [updated] = await db
        .update(businessAnalytics)
        .set(data)
        .where(eq(businessAnalytics.businessId, businessId))
        .returning();
      
      return updated;
    } else {
      // Create new analytics record
      const [newAnalytics] = await db
        .insert(businessAnalytics)
        .values({
          businessId,
          totalPointsIssued: data.totalPointsIssued || 0,
          totalCustomers: data.totalCustomers || 0,
          totalIssuances: data.totalIssuances || 0,
          lastIssuanceDate: data.lastIssuanceDate || new Date()
        })
        .returning();
      
      return newAnalytics;
    }
  }
  
  async bulkIssuePoints(data: BulkPointIssuanceData): Promise<number> {
    let successCount = 0;
    
    // Begin transaction for consistency
    const tx = await db.transaction();
    
    try {
      // Get user IDs
      const userIds = data.userIds;
      
      for (const userId of userIds) {
        // Get the user
        const user = await this.getUser(userId);
        
        if (user) {
          // Get the user's xPoints wallet
          const wallet = await this.getWallet(user.id, 'XPOINTS');
          
          if (wallet) {
            // Update wallet balance
            await this.updateWalletBalance(wallet.id, wallet.balance + data.pointsPerUser);
            
            // Record the transaction
            await this.createTransaction({
              userId: user.id,
              fromProgram: 'XPOINTS',
              toProgram: 'XPOINTS',
              amountFrom: data.pointsPerUser,
              amountTo: data.pointsPerUser,
              feeApplied: 0,
              description: `Points issued by business program ${data.businessProgramId}: ${data.reason || 'Bulk issuance'}`
            });
            
            successCount++;
          }
        }
      }
      
      // Update business analytics
      const businessId = await this.getBusinessIdFromProgram(data.businessProgramId);
      
      if (businessId) {
        const analytics = await this.getBusinessAnalytics(businessId);
        
        // If we have analytics, update them
        if (analytics) {
          await this.updateBusinessAnalytics(businessId, {
            totalPointsIssued: (parseInt(analytics.totalPointsIssued || "0") + 
              (data.pointsPerUser * successCount)).toString(),
            totalUsers: analytics.totalUsers + successCount,
            activeUsers: analytics.activeUsers + successCount
          });
        } else {
          // Create new analytics record
          await db.insert(businessAnalytics).values({
            businessId,
            totalUsers: successCount,
            activeUsers: successCount,
            totalPointsIssued: (data.pointsPerUser * successCount).toString(),
            totalPointsRedeemed: "0",
            averagePointsPerUser: data.pointsPerUser.toString(),
            lastUpdated: new Date()
          });
        }
      }
      
      await tx.commit();
      return successCount;
    } catch (error) {
      console.error("Error in bulk point issuance:", error);
      await tx.rollback();
      throw error;
    }
  }
  
  // Helper method to get business ID from a program ID
  private async getBusinessIdFromProgram(businessProgramId: number): Promise<number | null> {
    const [program] = await db
      .select()
      .from(businessPrograms)
      .where(eq(businessPrograms.id, businessProgramId));
    
    return program ? program.businessId : null;
  }
}

// In-memory storage implementation - keeping for reference but not using
export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private wallets: Map<number, Wallet>;
  private transactions: Map<number, Transaction>;
  private exchangeRates: Map<string, ExchangeRate>;
  currentUserId: number;
  currentWalletId: number;
  currentTransactionId: number;
  currentExchangeRateId: number;
  sessionStore: SessionStore;

  constructor() {
    this.users = new Map();
    this.wallets = new Map();
    this.transactions = new Map();
    this.exchangeRates = new Map();
    this.currentUserId = 1;
    this.currentWalletId = 1;
    this.currentTransactionId = 1;
    this.currentExchangeRateId = 1;
    this.sessionStore = new MemoryStore({
      checkPeriod: 86400000,
    });

    // Initialize exchange rates
    this.setupExchangeRates();
  }

  // Initialize default exchange rates
  private setupExchangeRates() {
    const rates = [
      { fromProgram: "QANTAS" as LoyaltyProgram, toProgram: "XPOINTS" as LoyaltyProgram, rate: "0.5" },
      { fromProgram: "XPOINTS" as LoyaltyProgram, toProgram: "QANTAS" as LoyaltyProgram, rate: "1.8" },
      { fromProgram: "GYG" as LoyaltyProgram, toProgram: "XPOINTS" as LoyaltyProgram, rate: "0.8" },
      { fromProgram: "XPOINTS" as LoyaltyProgram, toProgram: "GYG" as LoyaltyProgram, rate: "1.25" },
    ];

    rates.forEach(rate => {
      const id = this.currentExchangeRateId++;
      const key = `${rate.fromProgram}-${rate.toProgram}`;
      this.exchangeRates.set(key, {
        id,
        fromProgram: rate.fromProgram,
        toProgram: rate.toProgram,
        rate: rate.rate,
        lastUpdated: new Date(),
      });
    });
  }

  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.currentUserId++;
    const user: User = { 
      ...insertUser, 
      id, 
      createdAt: new Date(),
      kycVerified: "unverified"
    };
    this.users.set(id, user);
    
    // Create default wallets for new user
    await this.createWallet({ 
      userId: id, 
      program: "QANTAS", 
      balance: 0, 
      accountNumber: null, 
      accountName: null
    });
    
    await this.createWallet({ 
      userId: id, 
      program: "GYG", 
      balance: 0, 
      accountNumber: null, 
      accountName: null
    });
    
    await this.createWallet({ 
      userId: id, 
      program: "XPOINTS", 
      balance: 1000, 
      accountNumber: null, 
      accountName: null
    });
    
    return user;
  }

  async getUserWallets(userId: number): Promise<Wallet[]> {
    return Array.from(this.wallets.values()).filter(
      (wallet) => wallet.userId === userId,
    );
  }

  async getWallet(userId: number, program: LoyaltyProgram): Promise<Wallet | undefined> {
    return Array.from(this.wallets.values()).find(
      (wallet) => wallet.userId === userId && wallet.program === program,
    );
  }

  async createWallet(wallet: Omit<Wallet, "id" | "createdAt">): Promise<Wallet> {
    const id = this.currentWalletId++;
    const newWallet: Wallet = { 
      ...wallet, 
      id, 
      createdAt: new Date()
    };
    this.wallets.set(id, newWallet);
    return newWallet;
  }

  async updateWalletBalance(id: number, balance: number): Promise<Wallet> {
    const wallet = this.wallets.get(id);
    if (!wallet) {
      throw new Error("Wallet not found");
    }
    
    const updatedWallet = { 
      ...wallet, 
      balance 
    };
    this.wallets.set(id, updatedWallet);
    return updatedWallet;
  }
  
  async updateWalletAccount(id: number, accountNumber: string | null, accountName: string | null): Promise<Wallet> {
    const wallet = this.wallets.get(id);
    if (!wallet) {
      throw new Error("Wallet not found");
    }
    
    const updatedWallet = { 
      ...wallet, 
      accountNumber,
      accountName
    };
    this.wallets.set(id, updatedWallet);
    return updatedWallet;
  }

  async getUserTransactions(userId: number): Promise<Transaction[]> {
    return Array.from(this.transactions.values())
      .filter((transaction) => transaction.userId === userId)
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime()); // Sort by timestamp desc
  }

  async createTransaction(transaction: Omit<Transaction, "id" | "timestamp">): Promise<Transaction> {
    const id = this.currentTransactionId++;
    const newTransaction: Transaction = { 
      ...transaction, 
      id, 
      timestamp: new Date() 
    };
    this.transactions.set(id, newTransaction);
    return newTransaction;
  }

  async getExchangeRate(fromProgram: LoyaltyProgram, toProgram: LoyaltyProgram): Promise<ExchangeRate | undefined> {
    const key = `${fromProgram}-${toProgram}`;
    return this.exchangeRates.get(key);
  }
  
  // Tier benefits methods
  async updateUserTier(userId: number, tier: MembershipTier, expiresAt?: Date): Promise<User> {
    // Not implemented in MemStorage
    throw new Error("Not implemented in MemStorage");
  }
  
  async updateUserStats(userId: number, pointsConverted: number, fee: number): Promise<User> {
    // Not implemented in MemStorage
    throw new Error("Not implemented in MemStorage");
  }
  
  async getUserStats(userId: number): Promise<{ pointsConverted: number, feesPaid: number, monthlyPoints: number, tier: MembershipTier }> {
    // Not implemented in MemStorage
    throw new Error("Not implemented in MemStorage");
  }
  
  async getTierBenefits(tier: MembershipTier): Promise<TierBenefit | undefined> {
    // Not implemented in MemStorage
    throw new Error("Not implemented in MemStorage");
  }
  
  async createTierBenefits(benefits: InsertTierBenefits): Promise<TierBenefit> {
    // Not implemented in MemStorage
    throw new Error("Not implemented in MemStorage");
  }
  
  async initializeTierBenefits(): Promise<void> {
    // Not implemented in MemStorage
    throw new Error("Not implemented in MemStorage");
  }
  
  // Business analytics methods
  async getBusinessAnalytics(businessId: number): Promise<BusinessAnalytics | undefined> {
    // Not implemented in MemStorage
    throw new Error("Not implemented in MemStorage");
  }
  
  async updateBusinessAnalytics(businessId: number, data: Partial<InsertBusinessAnalytics>): Promise<BusinessAnalytics> {
    // Not implemented in MemStorage
    throw new Error("Not implemented in MemStorage");
  }
  
  async bulkIssuePoints(data: BulkPointIssuanceData): Promise<number> {
    // Not implemented in MemStorage
    throw new Error("Not implemented in MemStorage");
  }
}

// Switch to database storage
export const storage = new DatabaseStorage();
