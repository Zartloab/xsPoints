import * as schema from "@shared/schema";
import { 
  users, transactions, userPreferences, type User, type InsertUser, type Wallet, type Transaction, type ExchangeRate, 
  type LoyaltyProgram, type TierBenefit, type InsertTierBenefits, type MembershipTier,
  type BusinessAnalytics, type InsertBusinessAnalytics, type BulkPointIssuanceData,
  type TradeOffer, type TradeTransaction, type UserPreference, type InsertUserPreference
} from "@shared/schema";
import session from "express-session";
import createMemoryStore from "memorystore";
import connectPg from "connect-pg-simple";
import { db } from "./db";
import { eq, and, desc, sql, ne, or } from "drizzle-orm";

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
  
  // Blockchain wallet operations
  updateUserWallet(userId: number, walletAddress: string, walletPrivateKey: string): Promise<User>;
  updateTokenBalance(userId: number, balance: number): Promise<User>;
  getUserByWalletAddress(walletAddress: string): Promise<User | undefined>;
  
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
  
  // Trading operations
  getTradeOffers(excludeUserId?: number): Promise<TradeOffer[]>;
  getUserTradeOffers(userId: number): Promise<TradeOffer[]>;
  getTradeOffer(id: number): Promise<TradeOffer | undefined>;
  createTradeOffer(data: Omit<TradeOffer, "id" | "createdAt" | "status">): Promise<TradeOffer>;
  updateTradeOfferStatus(id: number, status: string): Promise<TradeOffer | undefined>;
  getTradeHistory(userId: number): Promise<TradeTransaction[]>;
  createTradeTransaction(data: Omit<TradeTransaction, "id" | "completedAt">): Promise<TradeTransaction>;
  
  // Business analytics operations
  getBusinessAnalytics(businessId: number): Promise<BusinessAnalytics | undefined>;
  updateBusinessAnalytics(businessId: number, data: Partial<InsertBusinessAnalytics>): Promise<BusinessAnalytics>;
  bulkIssuePoints(data: BulkPointIssuanceData): Promise<number>; // Returns number of successful issuances
  
  // Blockchain and tokenization operations
  getAllUserTokenBalances(): Promise<{ id: number, tokenBalance: number | null }[]>;
  getAllConversionTransactions(fromProgram: LoyaltyProgram, toProgram: LoyaltyProgram): Promise<Transaction[]>;
  
  // User preferences operations
  getUserPreferences(userId: number): Promise<UserPreference | undefined>;
  createUserPreferences(data: InsertUserPreference): Promise<UserPreference>;
  updateUserPreferences(userId: number, data: Partial<InsertUserPreference>): Promise<UserPreference>;
  
  // Session store
  sessionStore: SessionStore;
}

// PostgreSQL Database Storage Implementation
export class DatabaseStorage implements IStorage {
  sessionStore: SessionStore;

  constructor() {
    try {
      // Log connection attempt
      console.log("Initializing database connection for session store and storage services");
      
      if (!process.env.DATABASE_URL) {
        throw new Error("DATABASE_URL environment variable is not set");
      }
      
      // Initialize session store with PostgreSQL
      this.sessionStore = new PostgresSessionStore({
        conObject: {
          connectionString: process.env.DATABASE_URL,
        },
        createTableIfMissing: true
      });
      
      // Set up initial data in background without blocking startup
      Promise.all([
        // Initialize exchange rates
        this.initializeExchangeRates().catch(err => {
          console.error('Non-critical error initializing exchange rates:', err);
        }),
        
        // Initialize tier benefits
        this.initializeTierBenefits().catch(err => {
          console.error('Non-critical error initializing tier benefits:', err);
        })
      ]).then(() => {
        console.log("Database initialization completed successfully");
      }).catch(err => {
        console.error("Database initialization encountered errors:", err);
      });
      
    } catch (error) {
      console.error('Critical error in database initialization:', error);
      
      // Fall back to memory store for better resilience
      console.warn('⚠️ Using fallback in-memory session store');
      this.sessionStore = new MemoryStore({
        checkPeriod: 86400000 // Prune expired entries every 24h
      });
    }
  }
  
  // Blockchain wallet management methods
  async updateUserWallet(userId: number, walletAddress: string, walletPrivateKey: string): Promise<User> {
    const [updatedUser] = await db
      .update(schema.users)
      .set({
        walletAddress,
        walletPrivateKey,
        tokenLedgerSynced: new Date()
      })
      .where(eq(schema.users.id, userId))
      .returning();
    return updatedUser;
  }
  
  async updateTokenBalance(userId: number, balance: number): Promise<User> {
    const [updatedUser] = await db
      .update(schema.users)
      .set({
        tokenBalance: balance,
        tokenLedgerSynced: new Date()
      })
      .where(eq(schema.users.id, userId))
      .returning();
    return updatedUser;
  }
  
  async getUserByWalletAddress(walletAddress: string): Promise<User | undefined> {
    const [user] = await db
      .select()
      .from(schema.users)
      .where(eq(schema.users.walletAddress, walletAddress));
    return user || undefined;
  }

  private async initializeExchangeRates() {
    try {
      // Check if exchange rates exist
      const existingRates = await db.select().from(schema.exchangeRates);
      
      // Define all supported loyalty programs
      const allPrograms: LoyaltyProgram[] = [
        'QANTAS', 
        'GYG', 
        'XPOINTS', 
        'VELOCITY', 
        'AMEX', 
        'FLYBUYS', 
        'HILTON', 
        'MARRIOTT',
        'AIRBNB',
        'DELTA'
      ];
      
      if (existingRates.length === 0) {
        // Define base exchange rates to XPOINTS (our universal currency)
        // Using a standard where 1 xPoint = $0.01 USD (1 cent)
        // These rates are calculated based on the dollar value of each loyalty point
        const baseRatesToXPoints: Record<LoyaltyProgram, number> = {
          'QANTAS': 0.6,    // 1 Qantas point = $0.006 → 0.6 xPoints
          'GYG': 0.8,       // 1 GYG point = $0.008 → 0.8 xPoints
          'XPOINTS': 1.0,   // 1 xPoint = $0.01 (fixed value)
          'VELOCITY': 0.7,  // 1 Velocity point = $0.007 → 0.7 xPoints
          'AMEX': 0.9,      // 1 Amex point = $0.009 → 0.9 xPoints
          'FLYBUYS': 0.5,   // 1 Flybuys point = $0.005 → 0.5 xPoints
          'HILTON': 0.4,    // 1 Hilton point = $0.004 → 0.4 xPoints
          'MARRIOTT': 0.6,  // 1 Marriott point = $0.006 → 0.6 xPoints
          'AIRBNB': 0.95,   // 1 Airbnb credit = $0.0095 → 0.95 xPoints
          'DELTA': 0.65     // 1 Delta point = $0.0065 → 0.65 xPoints
        };
        
        const baseRatesFromXPoints: Record<LoyaltyProgram, number> = {
          'QANTAS': 1.667,    // 1 xPoint ($0.01) = 1.667 Qantas points
          'GYG': 1.25,        // 1 xPoint ($0.01) = 1.25 GYG points
          'XPOINTS': 1.0,     // 1 xPoint = 1 xPoint
          'VELOCITY': 1.429,  // 1 xPoint ($0.01) = 1.429 Velocity points
          'AMEX': 1.111,      // 1 xPoint ($0.01) = 1.111 Amex points
          'FLYBUYS': 2.0,     // 1 xPoint ($0.01) = 2 Flybuys points
          'HILTON': 2.5,      // 1 xPoint ($0.01) = 2.5 Hilton points
          'MARRIOTT': 1.667,  // 1 xPoint ($0.01) = 1.667 Marriott points
          'AIRBNB': 1.053,    // 1 xPoint ($0.01) = 1.053 Airbnb credits
          'DELTA': 1.538      // 1 xPoint ($0.01) = 1.538 Delta points
        };
        
        const initialRates = [];
        
        // Generate all possible program-to-program combinations
        for (const fromProgram of allPrograms) {
          for (const toProgram of allPrograms) {
            let rate: string;
            
            if (fromProgram === toProgram) {
              // Same program conversion rate is always 1.0
              rate = "1.0";
            } else if (fromProgram === 'XPOINTS') {
              // Direct conversion from XPOINTS to another program
              rate = baseRatesFromXPoints[toProgram].toString();
            } else if (toProgram === 'XPOINTS') {
              // Direct conversion from another program to XPOINTS
              rate = baseRatesToXPoints[fromProgram].toString();
            } else {
              // Indirect conversion: fromProgram → XPOINTS → toProgram
              const rateViaXPoints = baseRatesToXPoints[fromProgram] * baseRatesFromXPoints[toProgram];
              rate = rateViaXPoints.toString();
            }
            
            initialRates.push({
              fromProgram: fromProgram as LoyaltyProgram,
              toProgram: toProgram as LoyaltyProgram,
              rate,
              lastUpdated: new Date()
            });
          }
        }
        
        // Insert initial exchange rates
        await db.insert(schema.exchangeRates).values(initialRates);
      } else {
        // Generate all required combinations between programs
        const requiredCombinations = [];
        
        for (const fromProgram of allPrograms) {
          for (const toProgram of allPrograms) {
            requiredCombinations.push({
              from: fromProgram,
              to: toProgram
            });
          }
        }
        
        // Define base rates to use for missing combinations
        // Using a standard where 1 xPoint = $0.01 USD (1 cent)
        // These rates are calculated based on the dollar value of each loyalty point
        const baseRatesToXPoints: Record<LoyaltyProgram, number> = {
          'QANTAS': 0.6,    // 1 Qantas point = $0.006 → 0.6 xPoints
          'GYG': 0.8,       // 1 GYG point = $0.008 → 0.8 xPoints
          'XPOINTS': 1.0,   // 1 xPoint = $0.01 (fixed value)
          'VELOCITY': 0.7,  // 1 Velocity point = $0.007 → 0.7 xPoints
          'AMEX': 0.9,      // 1 Amex point = $0.009 → 0.9 xPoints
          'FLYBUYS': 0.5,   // 1 Flybuys point = $0.005 → 0.5 xPoints
          'HILTON': 0.4,    // 1 Hilton point = $0.004 → 0.4 xPoints
          'MARRIOTT': 0.6,  // 1 Marriott point = $0.006 → 0.6 xPoints
          'AIRBNB': 0.95,   // 1 Airbnb credit = $0.0095 → 0.95 xPoints
          'DELTA': 0.65     // 1 Delta point = $0.0065 → 0.65 xPoints
        };
        
        const baseRatesFromXPoints: Record<LoyaltyProgram, number> = {
          'QANTAS': 1.667,    // 1 xPoint ($0.01) = 1.667 Qantas points
          'GYG': 1.25,        // 1 xPoint ($0.01) = 1.25 GYG points
          'XPOINTS': 1.0,     // 1 xPoint = 1 xPoint
          'VELOCITY': 1.429,  // 1 xPoint ($0.01) = 1.429 Velocity points
          'AMEX': 1.111,      // 1 xPoint ($0.01) = 1.111 Amex points
          'FLYBUYS': 2.0,     // 1 xPoint ($0.01) = 2 Flybuys points
          'HILTON': 2.5,      // 1 xPoint ($0.01) = 2.5 Hilton points
          'MARRIOTT': 1.667,  // 1 xPoint ($0.01) = 1.667 Marriott points
          'AIRBNB': 1.053,    // 1 xPoint ($0.01) = 1.053 Airbnb credits
          'DELTA': 1.538      // 1 xPoint ($0.01) = 1.538 Delta points
        };
        
        // Check which combinations are missing
        for (const combo of requiredCombinations) {
          const exists = existingRates.some(
            rate => rate.fromProgram === combo.from && rate.toProgram === combo.to
          );
          
          if (!exists) {
            console.log(`Adding missing exchange rate: ${combo.from} to ${combo.to}`);
            let rate: string;
            
            if (combo.from === combo.to) {
              // Same program conversion rate is always 1.0
              rate = "1.0";
            } else if (combo.from === 'XPOINTS') {
              // Direct conversion from XPOINTS to another program
              rate = baseRatesFromXPoints[combo.to].toString();
            } else if (combo.to === 'XPOINTS') {
              // Direct conversion from another program to XPOINTS
              rate = baseRatesToXPoints[combo.from].toString();
            } else {
              // Indirect conversion: fromProgram → XPOINTS → toProgram
              const rateViaXPoints = baseRatesToXPoints[combo.from] * baseRatesFromXPoints[combo.to];
              rate = rateViaXPoints.toFixed(4);
            }
            
            await db.insert(schema.exchangeRates).values({
              fromProgram: combo.from as LoyaltyProgram,
              toProgram: combo.to as LoyaltyProgram,
              rate,
              lastUpdated: new Date()
            });
          }
        }
      }
    } catch (error) {
      console.error("Error initializing exchange rates:", error);
    }
  }

  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(schema.users).where(eq(schema.users.id, id));
    return user;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(schema.users).where(eq(schema.users.username, username));
    return user;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    // Insert the user, kycVerified defaults to 'unverified'
    const [user] = await db.insert(schema.users).values(insertUser).returning();
    
    // All supported loyalty programs
    const allPrograms: LoyaltyProgram[] = [
      'QANTAS', 
      'GYG', 
      'XPOINTS', 
      'VELOCITY', 
      'AMEX', 
      'FLYBUYS', 
      'HILTON', 
      'MARRIOTT',
      'AIRBNB',
      'DELTA'
    ];
    
    // Create wallets for all loyalty programs
    for (const program of allPrograms) {
      const balance = program === "XPOINTS" ? 1000 : 0; // Only XPOINTS starts with a balance
      
      await this.createWallet({
        userId: user.id,
        program,
        balance,
        accountNumber: null,
        accountName: null,
      });
    }
    
    return user;
  }

  async getUserWallets(userId: number): Promise<Wallet[]> {
    return db.select().from(schema.wallets).where(eq(schema.wallets.userId, userId));
  }

  async getWallet(userId: number, program: LoyaltyProgram): Promise<Wallet | undefined> {
    // Get all wallets for this user and program, ordered by balance (descending)
    // so if there are duplicate wallets, we get the one with the highest balance
    const wallets = await db.select().from(schema.wallets)
      .where(
        and(
          eq(schema.wallets.userId, userId),
          eq(schema.wallets.program, program)
        )
      )
      .orderBy(desc(schema.wallets.balance), desc(schema.wallets.id));
    
    return wallets[0]; // Return the wallet with highest balance or most recently created
  }

  async createWallet(wallet: Omit<Wallet, "id" | "createdAt">): Promise<Wallet> {
    const [newWallet] = await db.insert(schema.wallets).values(wallet).returning();
    return newWallet;
  }

  async updateWalletBalance(id: number, balance: number): Promise<Wallet> {
    const [updatedWallet] = await db
      .update(schema.wallets)
      .set({ balance })
      .where(eq(schema.wallets.id, id))
      .returning();
      
    if (!updatedWallet) {
      throw new Error("Wallet not found");
    }
    
    return updatedWallet;
  }
  
  async updateWalletAccount(id: number, accountNumber: string | null, accountName: string | null): Promise<Wallet> {
    const [updatedWallet] = await db
      .update(schema.wallets)
      .set({ 
        accountNumber, 
        accountName 
      })
      .where(eq(schema.wallets.id, id))
      .returning();
      
    if (!updatedWallet) {
      throw new Error("Wallet not found");
    }
    
    return updatedWallet;
  }

  async getUserTransactions(userId: number): Promise<Transaction[]> {
    return db
      .select()
      .from(schema.transactions)
      .where(eq(schema.transactions.userId, userId))
      .orderBy(desc(schema.transactions.timestamp));
  }

  async createTransaction(transaction: Omit<Transaction, "id" | "timestamp">): Promise<Transaction> {
    const [newTransaction] = await db
      .insert(schema.transactions)
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
      .update(schema.users)
      .set({
        pointsConverted: (user.pointsConverted || 0) + pointsConverted,
        monthlyPointsConverted: monthlyPointsConverted + pointsConverted,
        totalFeesPaid: (user.totalFeesPaid || 0) + fee,
        lastMonthReset: lastReset
      })
      .where(eq(schema.users.id, userId))
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
      .update(schema.users)
      .set({
        membershipTier: tier,
        tierExpiresAt: expiresAt || null
      })
      .where(eq(schema.users.id, userId))
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
      .from(schema.tierBenefits)
      .orderBy(desc(schema.tierBenefits.monthlyPointsThreshold));
    
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
      .from(schema.tierBenefits)
      .where(eq(schema.tierBenefits.tier, tier));
    
    return benefits;
  }
  
  async createTierBenefits(benefits: InsertTierBenefits): Promise<TierBenefit> {
    // Check if tier already exists
    const existingTier = await this.getTierBenefits(benefits.tier);
    
    if (existingTier) {
      // Update existing tier
      const [updatedTier] = await db
        .update(schema.tierBenefits)
        .set(benefits)
        .where(eq(schema.tierBenefits.tier, benefits.tier))
        .returning();
      
      return updatedTier;
    } else {
      // Create new tier
      const [newTier] = await db
        .insert(schema.tierBenefits)
        .values(benefits)
        .returning();
      
      return newTier;
    }
  }
  
  async initializeTierBenefits(): Promise<void> {
    try {
      // Check if tier benefits exist
      const existingBenefits = await db.select().from(schema.tierBenefits);
      
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
        .from(schema.exchangeRates)
        .where(
          and(
            eq(schema.exchangeRates.fromProgram, fromProgram),
            eq(schema.exchangeRates.toProgram, toProgram)
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
            .update(schema.exchangeRates)
            .set({ 
              rate: updatedRate.rate,
              lastUpdated: new Date()
            })
            .where(
              and(
                eq(schema.exchangeRates.fromProgram, fromProgram),
                eq(schema.exchangeRates.toProgram, toProgram)
              )
            )
            .returning();
          
          return updated;
        } else {
          // Insert new rate
          const [newRate] = await db
            .insert(schema.exchangeRates)
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
        .from(schema.exchangeRates)
        .where(
          and(
            eq(schema.exchangeRates.fromProgram, fromProgram),
            eq(schema.exchangeRates.toProgram, toProgram)
          )
        );
      
      return fallbackRate;
    }
  }
  
  // Helper method to fetch real-time exchange rates from external APIs
  private async fetchRealTimeRate(fromProgram: LoyaltyProgram, toProgram: LoyaltyProgram): Promise<{ rate: string } | null> {
    try {
      // Each loyalty program has a fixed value relative to xPoints based on its real-world value
      // Where 1 xPoint = $0.01 USD (1 cent)
      
      // Base rates for conversion TO xPoints (how many xPoints per 1 unit of the program)
      const ratesToXPoints: Record<LoyaltyProgram, number> = {
        'QANTAS': 0.6,    // 1 Qantas point = $0.006 → 0.6 xPoints
        'GYG': 0.8,       // 1 GYG point = $0.008 → 0.8 xPoints
        'XPOINTS': 1.0,   // 1 xPoint = $0.01 (fixed value)
        'VELOCITY': 0.7,  // 1 Velocity point = $0.007 → 0.7 xPoints
        'AMEX': 0.9,      // 1 Amex point = $0.009 → 0.9 xPoints
        'FLYBUYS': 0.5,   // 1 Flybuys point = $0.005 → 0.5 xPoints
        'HILTON': 0.4,    // 1 Hilton point = $0.004 → 0.4 xPoints
        'MARRIOTT': 0.6,  // 1 Marriott point = $0.006 → 0.6 xPoints
        'AIRBNB': 0.95,   // 1 Airbnb credit = $0.0095 → 0.95 xPoints
        'DELTA': 0.65     // 1 Delta point = $0.0065 → 0.65 xPoints
      };
      
      // Base rates for conversion FROM xPoints (how many points per 1 xPoint)
      const ratesFromXPoints: Record<LoyaltyProgram, number> = {
        'QANTAS': 1.667,    // 1 xPoint ($0.01) = 1.667 Qantas points
        'GYG': 1.25,        // 1 xPoint ($0.01) = 1.25 GYG points
        'XPOINTS': 1.0,     // 1 xPoint = 1 xPoint
        'VELOCITY': 1.429,  // 1 xPoint ($0.01) = 1.429 Velocity points
        'AMEX': 1.111,      // 1 xPoint ($0.01) = 1.111 Amex points
        'FLYBUYS': 2.0,     // 1 xPoint ($0.01) = 2 Flybuys points
        'HILTON': 2.5,      // 1 xPoint ($0.01) = 2.5 Hilton points
        'MARRIOTT': 1.667,  // 1 xPoint ($0.01) = 1.667 Marriott points
        'AIRBNB': 1.053,    // 1 xPoint ($0.01) = 1.053 Airbnb credits
        'DELTA': 1.538      // 1 xPoint ($0.01) = 1.538 Delta points
      };
      
      let rate: number;
      
      // Direct conversions
      if (fromProgram === toProgram) {
        // Same program conversion rate is always 1.0
        rate = 1.0;
      } else if (fromProgram === 'XPOINTS') {
        // Direct conversion from XPOINTS to another program
        rate = ratesFromXPoints[toProgram];
      } else if (toProgram === 'XPOINTS') {
        // Direct conversion from another program to XPOINTS
        rate = ratesToXPoints[fromProgram];
      } else {
        // Cross-program conversion, calculated via xPoints as intermediary
        // This maintains the relationship: 1 fromProgram point = X xPoints = Y toProgram points
        rate = (ratesToXPoints[fromProgram] / ratesToXPoints[toProgram]) * ratesFromXPoints[toProgram];
      }
      
      // Add a tiny market variation (+/- 1%) to simulate real market conditions
      // but ensure the core valuation remains stable
      const marketVariation = 1 + ((Math.random() * 0.02) - 0.01); // +/- 1%
      
      // Apply market variation but maintain the fixed value relationship
      const finalRate = rate * marketVariation;
      
      // Return rate with 6 decimal places for precision
      return { rate: finalRate.toFixed(6) };
    } catch (error) {
      console.error("Error calculating exchange rate:", error);
      return null;
    }
  }
  
  // Business analytics methods
  async getBusinessAnalytics(businessId: number): Promise<BusinessAnalytics | undefined> {
    const [analytics] = await db
      .select()
      .from(schema.businessAnalytics)
      .where(eq(schema.businessAnalytics.businessId, businessId));
    
    return analytics;
  }
  
  async updateBusinessAnalytics(businessId: number, data: Partial<InsertBusinessAnalytics>): Promise<BusinessAnalytics> {
    const existingAnalytics = await this.getBusinessAnalytics(businessId);
    
    if (existingAnalytics) {
      // Update existing analytics
      const [updated] = await db
        .update(schema.businessAnalytics)
        .set(data)
        .where(eq(schema.businessAnalytics.businessId, businessId))
        .returning();
      
      return updated;
    } else {
      // Create new analytics record
      const [newAnalytics] = await db
        .insert(schema.businessAnalytics)
        .values({
          businessId,
          totalUsers: data.totalUsers || 0,
          activeUsers: data.activeUsers || 0,
          totalPointsIssued: data.totalPointsIssued || "0",
          totalPointsRedeemed: data.totalPointsRedeemed || "0",
          averagePointsPerUser: data.averagePointsPerUser || "0",
          lastUpdated: new Date()
        })
        .returning();
      
      return newAnalytics;
    }
  }
  
  async bulkIssuePoints(data: BulkPointIssuanceData): Promise<number> {
    let successCount = 0;
    
    // Begin transaction for consistency
    const tx = db.transaction(async (tx) => {
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
              status: "COMPLETED",
              recipientId: 0,
              transactionHash: "bulk-issuance-" + Date.now(),
              blockNumber: 0,
              contractAddress: "",
              tokenAddress: ""
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
          await db.insert(schema.businessAnalytics).values({
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
      
      return successCount;
    });
    
    try {
      return await tx;
    } catch (error) {
      console.error("Error in bulk point issuance:", error);
      throw error;
    }
  }
  
  // Helper method to get business ID from a program ID
  private async getBusinessIdFromProgram(businessProgramId: number): Promise<number | null> {
    const [program] = await db
      .select()
      .from(schema.businessPrograms)
      .where(eq(schema.businessPrograms.id, businessProgramId));
    
    return program ? program.businessId : null;
  }
  
  // Trading operations implementation
  async getTradeOffers(excludeUserId?: number): Promise<TradeOffer[]> {
    let query = db
      .select()
      .from(schema.tradeOffers)
      .where(eq(schema.tradeOffers.status, "open"));
    
    if (excludeUserId) {
      return db
        .select()
        .from(schema.tradeOffers)
        .where(
          and(
            eq(schema.tradeOffers.status, "open"),
            ne(schema.tradeOffers.createdBy, excludeUserId)
          )
        )
        .orderBy(desc(schema.tradeOffers.createdAt));
    }
    
    return query.orderBy(desc(schema.tradeOffers.createdAt));
  }
  
  async getUserTradeOffers(userId: number): Promise<TradeOffer[]> {
    return db
      .select()
      .from(schema.tradeOffers)
      .where(eq(schema.tradeOffers.createdBy, userId))
      .orderBy(desc(schema.tradeOffers.createdAt));
  }
  
  async getTradeOffer(id: number): Promise<TradeOffer | undefined> {
    const [offer] = await db
      .select()
      .from(schema.tradeOffers)
      .where(eq(schema.tradeOffers.id, id));
    
    return offer;
  }
  
  async createTradeOffer(data: Omit<TradeOffer, "id" | "createdAt" | "status">): Promise<TradeOffer> {
    const offerData = {
      createdBy: data.createdBy,
      fromProgram: data.fromProgram,
      toProgram: data.toProgram,
      amountOffered: data.amountOffered,
      amountRequested: data.amountRequested,
      customRate: data.customRate,
      marketRate: data.marketRate,
      savings: data.savings,
      expiresAt: data.expiresAt,
      description: data.description,
      status: "open"
    };
    
    const [tradeOffer] = await db
      .insert(schema.tradeOffers)
      .values(offerData)
      .returning();
    
    return tradeOffer;
  }
  
  async updateTradeOfferStatus(id: number, status: string): Promise<TradeOffer | undefined> {
    const [updatedOffer] = await db
      .update(schema.tradeOffers)
      .set({ status })
      .where(eq(schema.tradeOffers.id, id))
      .returning();
    
    return updatedOffer;
  }
  
  async getTradeHistory(userId: number): Promise<TradeTransaction[]> {
    return db
      .select()
      .from(schema.tradeTransactions)
      .where(
        or(
          eq(schema.tradeTransactions.buyerId, userId),
          eq(schema.tradeTransactions.sellerId, userId)
        )
      )
      .orderBy(desc(schema.tradeTransactions.completedAt));
  }
  
  async createTradeTransaction(data: Omit<TradeTransaction, "id" | "completedAt">): Promise<TradeTransaction> {
    const transactionData = {
      tradeOfferId: data.tradeOfferId,
      sellerId: data.sellerId,
      buyerId: data.buyerId,
      sellerWalletId: data.sellerWalletId,
      buyerWalletId: data.buyerWalletId,
      amountSold: data.amountSold,
      amountBought: data.amountBought,
      rate: data.rate,
      sellerFee: data.sellerFee,
      buyerFee: data.buyerFee,
      status: data.status
    };
    
    const [transaction] = await db
      .insert(schema.tradeTransactions)
      .values(transactionData)
      .returning();
    
    return transaction;
  }
  
  async getAllUserTokenBalances(): Promise<{ id: number, tokenBalance: number | null }[]> {
    try {
      const results = await db.select({
        id: users.id,
        tokenBalance: users.tokenBalance
      }).from(users);
      return results;
    } catch (error) {
      console.error("Error getting all user token balances:", error);
      return [];
    }
  }
  
  async getAllConversionTransactions(fromProgram: LoyaltyProgram, toProgram: LoyaltyProgram): Promise<Transaction[]> {
    try {
      return await db.select().from(transactions)
        .where(and(
          eq(transactions.fromProgram, fromProgram),
          eq(transactions.toProgram, toProgram),
          eq(transactions.status, "completed")
        ));
    } catch (error) {
      console.error(`Error getting conversion transactions from ${fromProgram} to ${toProgram}:`, error);
      return [];
    }
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
  
  // Blockchain wallet management methods
  async updateUserWallet(userId: number, walletAddress: string, walletPrivateKey: string): Promise<User> {
    const user = this.users.get(userId);
    if (!user) {
      throw new Error(`User with ID ${userId} not found`);
    }
    
    const updatedUser = {
      ...user,
      walletAddress,
      walletPrivateKey,
      tokenLedgerSynced: new Date()
    };
    
    this.users.set(userId, updatedUser);
    return updatedUser;
  }
  
  async updateTokenBalance(userId: number, balance: number): Promise<User> {
    const user = this.users.get(userId);
    if (!user) {
      throw new Error(`User with ID ${userId} not found`);
    }
    
    const updatedUser = {
      ...user,
      tokenBalance: balance,
      tokenLedgerSynced: new Date()
    };
    
    this.users.set(userId, updatedUser);
    return updatedUser;
  }
  
  async getUserByWalletAddress(walletAddress: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(user => user.walletAddress === walletAddress);
  }

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
      kycVerified: "unverified",
      membershipTier: "STANDARD",
      tierExpiresAt: null,
      pointsConverted: 0,
      monthlyPointsConverted: 0,
      lastMonthReset: null,
      totalFeesPaid: 0
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
  
  // Trading operations (stub implementations)
  async getTradeOffers(excludeUserId?: number): Promise<TradeOffer[]> {
    throw new Error("Not implemented in MemStorage");
  }
  
  async getUserTradeOffers(userId: number): Promise<TradeOffer[]> {
    throw new Error("Not implemented in MemStorage");
  }
  
  async getTradeOffer(id: number): Promise<TradeOffer | undefined> {
    throw new Error("Not implemented in MemStorage");
  }
  
  async createTradeOffer(data: Omit<TradeOffer, "id" | "createdAt" | "status">): Promise<TradeOffer> {
    throw new Error("Not implemented in MemStorage");
  }
  
  async updateTradeOfferStatus(id: number, status: string): Promise<TradeOffer | undefined> {
    throw new Error("Not implemented in MemStorage");
  }
  
  async getTradeHistory(userId: number): Promise<TradeTransaction[]> {
    throw new Error("Not implemented in MemStorage");
  }
  
  async createTradeTransaction(data: Omit<TradeTransaction, "id" | "completedAt">): Promise<TradeTransaction> {
    throw new Error("Not implemented in MemStorage");
  }
  
  async getAllUserTokenBalances(): Promise<{ id: number, tokenBalance: number | null }[]> {
    const result: { id: number, tokenBalance: number | null }[] = [];
    this.users.forEach((user) => {
      result.push({
        id: user.id,
        tokenBalance: user.tokenBalance || null
      });
    });
    return result;
  }
  
  async getAllConversionTransactions(fromProgram: LoyaltyProgram, toProgram: LoyaltyProgram): Promise<Transaction[]> {
    const result: Transaction[] = [];
    this.transactions.forEach((tx) => {
      if (tx.fromProgram === fromProgram && tx.toProgram === toProgram && tx.status === 'completed') {
        result.push(tx);
      }
    });
    return result;
  }
  
  // User Preferences Methods
  async getUserPreferences(userId: number): Promise<UserPreference | undefined> {
    try {
      const [preferences] = await db
        .select()
        .from(schema.userPreferences)
        .where(eq(schema.userPreferences.userId, userId));
      
      return preferences;
    } catch (error) {
      console.error("Error fetching user preferences:", error);
      return undefined;
    }
  }
  
  async createUserPreferences(data: InsertUserPreference): Promise<UserPreference> {
    const [preferences] = await db
      .insert(schema.userPreferences)
      .values(data)
      .returning();
    
    return preferences;
  }
  
  async updateUserPreferences(userId: number, data: Partial<InsertUserPreference>): Promise<UserPreference> {
    // First check if preferences exist
    const existingPrefs = await this.getUserPreferences(userId);
    
    if (existingPrefs) {
      // Update existing preferences
      const [updated] = await db
        .update(schema.userPreferences)
        .set({
          ...data,
          updatedAt: new Date()
        })
        .where(eq(schema.userPreferences.userId, userId))
        .returning();
      
      return updated;
    } else {
      // Create new preferences if they don't exist
      return this.createUserPreferences({
        userId,
        ...data,
        favoritePrograms: data.favoritePrograms || [],
        dashboardLayout: data.dashboardLayout || []
      });
    }
  }
}

// Switch to database storage
export const storage = new DatabaseStorage();
