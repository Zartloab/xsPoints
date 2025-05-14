import * as schema from "@shared/schema";
import { 
  users, wallets, transactions, exchangeRates, tierBenefits, tradeOffers, tradeTransactions,
  type User, type InsertUser, type Wallet, type Transaction, type ExchangeRate, 
  type LoyaltyProgram, type TierBenefit, type InsertTierBenefits, type MembershipTier,
  type BusinessAnalytics, type InsertBusinessAnalytics, type BulkPointIssuanceData,
  type TradeOffer, type TradeTransaction
} from "@shared/schema";
import session from "express-session";
import createMemoryStore from "memorystore";
import connectPg from "connect-pg-simple";
import { db, pool } from "./db";
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
  
  // Session store
  sessionStore: SessionStore;
}

// PostgreSQL Database Storage Implementation
export class DatabaseStorage implements IStorage {
  sessionStore: SessionStore;
  
  constructor() {
    this.sessionStore = new PostgresSessionStore({ 
      pool, 
      createTableIfMissing: true 
    });
  }
  
  // User operations
  async getUser(id: number): Promise<User | undefined> {
    try {
      const [user] = await db
        .select()
        .from(users)
        .where(eq(users.id, id));
      
      return user;
    } catch (error) {
      console.error(`Error fetching user ${id}:`, error);
      throw error;
    }
  }
  
  async getUserByUsername(username: string): Promise<User | undefined> {
    try {
      const [user] = await db
        .select()
        .from(users)
        .where(eq(users.username, username));
      
      return user;
    } catch (error) {
      console.error(`Error fetching user by username ${username}:`, error);
      throw error;
    }
  }
  
  async createUser(insertUser: InsertUser): Promise<User> {
    try {
      // Create the user with default values for required fields
      const [user] = await db
        .insert(users)
        .values({
          ...insertUser
        })
        .returning();
      
      // Create default wallets for the user
      await Promise.all([
        this.createWallet({
          userId: user.id,
          program: "XPOINTS",
          balance: 1000, // Starting bonus
          accountNumber: null,
          accountName: null
        }),
        this.createWallet({
          userId: user.id,
          program: "QANTAS",
          balance: 0,
          accountNumber: null,
          accountName: null
        }),
        this.createWallet({
          userId: user.id,
          program: "GYG",
          balance: 0,
          accountNumber: null,
          accountName: null
        })
      ]);
      
      return user;
    } catch (error) {
      console.error("Error creating user:", error);
      throw error;
    }
  }
  
  async updateUserTier(userId: number, tier: MembershipTier, expiresAt?: Date): Promise<User> {
    try {
      const [updatedUser] = await db
        .update(users)
        .set({ 
          membershipTier: tier,
          tierExpiresAt: expiresAt || null
        })
        .where(eq(users.id, userId))
        .returning();
      
      return updatedUser;
    } catch (error) {
      console.error(`Error updating tier for user ${userId}:`, error);
      throw error;
    }
  }
  
  async updateUserStats(userId: number, pointsConverted: number, fee: number): Promise<User> {
    try {
      const [user] = await db
        .select()
        .from(users)
        .where(eq(users.id, userId));
      
      if (!user) {
        throw new Error(`User with ID ${userId} not found`);
      }
      
      const [updatedUser] = await db
        .update(users)
        .set({ 
          pointsConverted: (user.pointsConverted || 0) + pointsConverted,
          monthlyPointsConverted: (user.monthlyPointsConverted || 0) + pointsConverted,
          totalFeesPaid: (user.totalFeesPaid || 0) + fee
        })
        .where(eq(users.id, userId))
        .returning();
      
      return updatedUser;
    } catch (error) {
      console.error(`Error updating stats for user ${userId}:`, error);
      throw error;
    }
  }
  
  async getUserStats(userId: number): Promise<{ pointsConverted: number, feesPaid: number, monthlyPoints: number, tier: MembershipTier }> {
    try {
      const [user] = await db
        .select()
        .from(users)
        .where(eq(users.id, userId));
      
      if (!user) {
        throw new Error(`User with ID ${userId} not found`);
      }
      
      return {
        pointsConverted: user.pointsConverted || 0,
        feesPaid: user.totalFeesPaid || 0,
        monthlyPoints: user.monthlyPointsConverted || 0,
        tier: user.membershipTier
      };
    } catch (error) {
      console.error(`Error fetching user stats for user ${userId}:`, error);
      // Return default values as fallback
      return {
        pointsConverted: 0,
        feesPaid: 0,
        monthlyPoints: 0,
        tier: "STANDARD"
      };
    }
  }
  
  // Wallet operations
  async getUserWallets(userId: number): Promise<Wallet[]> {
    try {
      const userWallets = await db
        .select()
        .from(wallets)
        .where(eq(wallets.userId, userId));
      
      return userWallets;
    } catch (error) {
      console.error(`Error fetching wallets for user ${userId}:`, error);
      throw error;
    }
  }
  
  async getWallet(userId: number, program: LoyaltyProgram): Promise<Wallet | undefined> {
    try {
      const [wallet] = await db
        .select()
        .from(wallets)
        .where(
          and(
            eq(wallets.userId, userId),
            eq(wallets.program, program)
          )
        );
      
      return wallet;
    } catch (error) {
      console.error(`Error fetching wallet for user ${userId} and program ${program}:`, error);
      throw error;
    }
  }
  
  async createWallet(walletData: Omit<Wallet, "id" | "createdAt">): Promise<Wallet> {
    try {
      const [wallet] = await db
        .insert(wallets)
        .values(walletData)
        .returning();
      
      return wallet;
    } catch (error) {
      console.error(`Error creating wallet:`, error);
      throw error;
    }
  }
  
  async updateWalletBalance(id: number, balance: number): Promise<Wallet> {
    try {
      const [updatedWallet] = await db
        .update(wallets)
        .set({ balance })
        .where(eq(wallets.id, id))
        .returning();
      
      return updatedWallet;
    } catch (error) {
      console.error(`Error updating wallet balance for wallet ${id}:`, error);
      throw error;
    }
  }
  
  async updateWalletAccount(id: number, accountNumber: string | null, accountName: string | null): Promise<Wallet> {
    try {
      const [updatedWallet] = await db
        .update(wallets)
        .set({ 
          accountNumber, 
          accountName
        })
        .where(eq(wallets.id, id))
        .returning();
      
      return updatedWallet;
    } catch (error) {
      console.error(`Error updating wallet account for wallet ${id}:`, error);
      throw error;
    }
  }
  
  // Transaction operations
  async getUserTransactions(userId: number): Promise<Transaction[]> {
    try {
      const userTransactions = await db
        .select()
        .from(transactions)
        .where(eq(transactions.userId, userId))
        .orderBy(desc(transactions.timestamp));
      
      return userTransactions;
    } catch (error) {
      console.error(`Error fetching transactions for user ${userId}:`, error);
      throw error;
    }
  }
  
  async createTransaction(transactionData: Omit<Transaction, "id" | "timestamp">): Promise<Transaction> {
    try {
      const [transaction] = await db
        .insert(transactions)
        .values(transactionData)
        .returning();
      
      return transaction;
    } catch (error) {
      console.error(`Error creating transaction:`, error);
      throw error;
    }
  }
  
  // Exchange rates operations
  async getExchangeRate(fromProgram: LoyaltyProgram, toProgram: LoyaltyProgram): Promise<ExchangeRate | undefined> {
    try {
      const [rate] = await db
        .select()
        .from(exchangeRates)
        .where(
          and(
            eq(exchangeRates.fromProgram, fromProgram),
            eq(exchangeRates.toProgram, toProgram)
          )
        );
      
      return rate;
    } catch (error) {
      console.error(`Error fetching exchange rate from ${fromProgram} to ${toProgram}:`, error);
      throw error;
    }
  }
  
  // Tier benefits operations
  async getTierBenefits(tier: MembershipTier): Promise<TierBenefit | undefined> {
    try {
      const [benefits] = await db
        .select()
        .from(tierBenefits)
        .where(eq(tierBenefits.tier, tier));
      
      return benefits;
    } catch (error) {
      console.error(`Error fetching benefits for tier ${tier}:`, error);
      throw error;
    }
  }
  
  async createTierBenefits(benefits: InsertTierBenefits): Promise<TierBenefit> {
    try {
      const [newBenefits] = await db
        .insert(tierBenefits)
        .values(benefits)
        .returning();
      
      return newBenefits;
    } catch (error) {
      console.error("Error creating tier benefits:", error);
      throw error;
    }
  }
  
  async initializeTierBenefits(): Promise<void> {
    try {
      const existingBenefits = await db.select().from(tierBenefits);
      
      if (existingBenefits.length === 0) {
        await db.insert(tierBenefits).values([
          {
            tier: "STANDARD",
            monthlyPointsThreshold: 0,
            freeConversionLimit: 10000,
            conversionFeeRate: "0.005",
            p2pMinimumFee: "0.005",
            p2pMaximumFee: "0.03",
            monthlyExpiryDays: 30
          },
          {
            tier: "SILVER",
            monthlyPointsThreshold: 20000,
            freeConversionLimit: 20000,
            conversionFeeRate: "0.0045",
            p2pMinimumFee: "0.004",
            p2pMaximumFee: "0.025",
            monthlyExpiryDays: 45
          },
          {
            tier: "GOLD",
            monthlyPointsThreshold: 50000,
            freeConversionLimit: 50000,
            conversionFeeRate: "0.0035",
            p2pMinimumFee: "0.003",
            p2pMaximumFee: "0.02",
            monthlyExpiryDays: 60
          },
          {
            tier: "PLATINUM",
            monthlyPointsThreshold: 100000,
            freeConversionLimit: 100000,
            conversionFeeRate: "0.0025",
            p2pMinimumFee: "0.002",
            p2pMaximumFee: "0.015",
            monthlyExpiryDays: 90
          }
        ]);
      }
    } catch (error) {
      console.error("Error initializing tier benefits:", error);
      throw error;
    }
  }
  
  // Trading operations
  async getTradeOffers(excludeUserId?: number): Promise<TradeOffer[]> {
    try {
      if (excludeUserId) {
        return await db
          .select()
          .from(tradeOffers)
          .where(
            and(
              eq(tradeOffers.status, "open"),
              ne(tradeOffers.createdBy, excludeUserId)
            )
          );
      } else {
        return await db
          .select()
          .from(tradeOffers)
          .where(eq(tradeOffers.status, "open"));
      }
    } catch (error) {
      console.error("Error fetching trade offers:", error);
      throw error;
    }
  }
  
  async getUserTradeOffers(userId: number): Promise<TradeOffer[]> {
    try {
      const offers = await db
        .select()
        .from(tradeOffers)
        .where(eq(tradeOffers.createdBy, userId));
      
      return offers;
    } catch (error) {
      console.error(`Error fetching trade offers for user ${userId}:`, error);
      throw error;
    }
  }
  
  async getTradeOffer(id: number): Promise<TradeOffer | undefined> {
    try {
      const [offer] = await db
        .select()
        .from(tradeOffers)
        .where(eq(tradeOffers.id, id));
      
      return offer;
    } catch (error) {
      console.error(`Error fetching trade offer ${id}:`, error);
      throw error;
    }
  }
  
  async createTradeOffer(data: Omit<TradeOffer, "id" | "createdAt" | "status">): Promise<TradeOffer> {
    try {
      const [offer] = await db
        .insert(tradeOffers)
        .values({
          ...data,
          status: "open"
        })
        .returning();
      
      return offer;
    } catch (error) {
      console.error("Error creating trade offer:", error);
      throw error;
    }
  }
  
  async updateTradeOfferStatus(id: number, status: string): Promise<TradeOffer | undefined> {
    try {
      const [updatedOffer] = await db
        .update(tradeOffers)
        .set({ status })
        .where(eq(tradeOffers.id, id))
        .returning();
      
      return updatedOffer;
    } catch (error) {
      console.error(`Error updating trade offer ${id} status:`, error);
      throw error;
    }
  }
  
  async getTradeHistory(userId: number): Promise<TradeTransaction[]> {
    try {
      const transactions = await db
        .select()
        .from(tradeTransactions)
        .where(
          or(
            eq(tradeTransactions.buyerId, userId),
            eq(tradeTransactions.sellerId, userId)
          )
        );
      
      return transactions;
    } catch (error) {
      console.error(`Error fetching trade history for user ${userId}:`, error);
      throw error;
    }
  }
  
  async createTradeTransaction(data: Omit<TradeTransaction, "id" | "completedAt">): Promise<TradeTransaction> {
    try {
      const [transaction] = await db
        .insert(tradeTransactions)
        .values(data)
        .returning();
      
      return transaction;
    } catch (error) {
      console.error("Error creating trade transaction:", error);
      throw error;
    }
  }
  
  // Blockchain wallet management methods
  async updateUserWallet(userId: number, walletAddress: string, walletPrivateKey: string): Promise<User> {
    try {
      const [updatedUser] = await db
        .update(users)
        .set({ walletAddress, walletPrivateKey, tokenLedgerSynced: new Date() })
        .where(eq(users.id, userId))
        .returning();
      
      return updatedUser;
    } catch (error) {
      console.error(`Error updating wallet for user ${userId}:`, error);
      throw error;
    }
  }
  
  async updateTokenBalance(userId: number, balance: number): Promise<User> {
    try {
      const [updatedUser] = await db
        .update(users)
        .set({ tokenBalance: balance, tokenLedgerSynced: new Date() })
        .where(eq(users.id, userId))
        .returning();
      
      return updatedUser;
    } catch (error) {
      console.error(`Error updating token balance for user ${userId}:`, error);
      throw error;
    }
  }
  
  async getUserByWalletAddress(walletAddress: string): Promise<User | undefined> {
    try {
      const [user] = await db
        .select()
        .from(users)
        .where(eq(users.walletAddress, walletAddress));
      
      return user;
    } catch (error) {
      console.error(`Error finding user by wallet address ${walletAddress}:`, error);
      throw error;
    }
  }
  
  // Business analytics operations
  async getBusinessAnalytics(businessId: number): Promise<BusinessAnalytics | undefined> {
    // Simplified implementation
    return undefined;
  }
  
  async updateBusinessAnalytics(businessId: number, data: Partial<InsertBusinessAnalytics>): Promise<BusinessAnalytics> {
    // Simplified implementation
    throw new Error("Not implemented");
  }
  
  async bulkIssuePoints(data: BulkPointIssuanceData): Promise<number> {
    // Simplified implementation
    return 0;
  }
  
  // Blockchain and tokenization operations
  async getAllUserTokenBalances(): Promise<{ id: number, tokenBalance: number | null }[]> {
    try {
      const userBalances = await db
        .select({
          id: users.id,
          tokenBalance: users.tokenBalance
        })
        .from(users)
        .where(sql`${users.tokenBalance} is not null`);
      
      return userBalances;
    } catch (error) {
      console.error("Error fetching all user token balances:", error);
      throw error;
    }
  }
  
  async getAllConversionTransactions(fromProgram: LoyaltyProgram, toProgram: LoyaltyProgram): Promise<Transaction[]> {
    try {
      const conversionTransactions = await db
        .select()
        .from(transactions)
        .where(
          and(
            eq(transactions.fromProgram, fromProgram),
            eq(transactions.toProgram, toProgram)
          )
        );
      
      return conversionTransactions;
    } catch (error) {
      console.error(`Error fetching conversion transactions from ${fromProgram} to ${toProgram}:`, error);
      throw error;
    }
  }
}

// In-Memory Storage Implementation
export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private wallets: Map<number, Wallet>;
  private transactions: Map<number, Transaction>;
  private exchangeRates: Map<string, ExchangeRate>;
  private tierBenefits: Map<string, TierBenefit>;
  private tradeOffers: Map<number, TradeOffer>;
  private tradeTransactions: Map<number, TradeTransaction>;
  currentUserId: number;
  currentWalletId: number;
  currentTransactionId: number;
  currentExchangeRateId: number;
  currentTradeOfferId: number;
  currentTradeTransactionId: number;
  sessionStore: SessionStore;
  
  constructor() {
    this.users = new Map();
    this.wallets = new Map();
    this.transactions = new Map();
    this.exchangeRates = new Map();
    this.tierBenefits = new Map();
    this.tradeOffers = new Map();
    this.tradeTransactions = new Map();
    this.currentUserId = 1;
    this.currentWalletId = 1;
    this.currentTransactionId = 1;
    this.currentExchangeRateId = 1;
    this.currentTradeOfferId = 1;
    this.currentTradeTransactionId = 1;
    this.sessionStore = new MemoryStore({
      checkPeriod: 86400000,
    });
    
    // Initialize tier benefits
    this.initializeTierBenefits();
  }
  
  // Add implementation for all required methods...
  // Keeping the implementation simple as we're focused on database storage
  
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }
  
  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(user => user.username === username);
  }
  
  async createUser(insertUser: InsertUser): Promise<User> {
    const userId = this.currentUserId++;
    const now = new Date();
    
    const user = { 
      id: userId, 
      ...insertUser,
      createdAt: now,
      membershipTier: "STANDARD" as MembershipTier,
      kycVerified: "unverified",
      pointsConverted: 0,
      monthlyPointsConverted: 0,
      totalFeesPaid: 0,
      tokenBalance: 0,
      tokenLedgerSynced: null,
      tierExpiresAt: null,
      walletAddress: null,
      walletPrivateKey: null,
      lastMonthReset: null,
    };
    
    this.users.set(userId, user);
    
    // Create default wallets
    await this.createWallet({
      userId: user.id,
      program: "XPOINTS",
      balance: 1000,
      accountNumber: null,
      accountName: null
    });
    
    await this.createWallet({
      userId: user.id,
      program: "QANTAS",
      balance: 0,
      accountNumber: null,
      accountName: null
    });
    
    await this.createWallet({
      userId: user.id,
      program: "GYG",
      balance: 0,
      accountNumber: null,
      accountName: null
    });
    
    return user;
  }
  
  // Implement other methods as needed...
  
  async updateUserWallet(userId: number, walletAddress: string, walletPrivateKey: string): Promise<User> {
    const user = await this.getUser(userId);
    if (!user) throw new Error(`User with ID ${userId} not found`);
    
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
    const user = await this.getUser(userId);
    if (!user) throw new Error(`User with ID ${userId} not found`);
    
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
  
  async updateUserTier(userId: number, tier: MembershipTier, expiresAt?: Date): Promise<User> {
    const user = await this.getUser(userId);
    if (!user) throw new Error(`User with ID ${userId} not found`);
    
    const updatedUser = {
      ...user,
      membershipTier: tier,
      tierExpiresAt: expiresAt || null
    };
    
    this.users.set(userId, updatedUser);
    return updatedUser;
  }
  
  async updateUserStats(userId: number, pointsConverted: number, fee: number): Promise<User> {
    const user = await this.getUser(userId);
    if (!user) throw new Error(`User with ID ${userId} not found`);
    
    const updatedUser = {
      ...user,
      pointsConverted: (user.pointsConverted || 0) + pointsConverted,
      monthlyPointsConverted: (user.monthlyPointsConverted || 0) + pointsConverted,
      totalFeesPaid: (user.totalFeesPaid || 0) + fee
    };
    
    this.users.set(userId, updatedUser);
    return updatedUser;
  }
  
  async getUserStats(userId: number): Promise<{ pointsConverted: number; feesPaid: number; monthlyPoints: number; tier: MembershipTier; }> {
    const user = await this.getUser(userId);
    if (!user) throw new Error(`User with ID ${userId} not found`);
    
    return {
      pointsConverted: user.pointsConverted || 0,
      feesPaid: user.totalFeesPaid || 0,
      monthlyPoints: user.monthlyPointsConverted || 0,
      tier: user.membershipTier
    };
  }
  
  // Implementing other interface methods would follow a similar pattern
  
  // Implement storage methods
  async getUserWallets(userId: number): Promise<Wallet[]> {
    return Array.from(this.wallets.values()).filter(wallet => wallet.userId === userId);
  }
  
  async getWallet(userId: number, program: LoyaltyProgram): Promise<Wallet | undefined> {
    return Array.from(this.wallets.values()).find(wallet => 
      wallet.userId === userId && wallet.program === program
    );
  }
  
  async createWallet(walletData: Omit<Wallet, "id" | "createdAt">): Promise<Wallet> {
    const id = this.currentWalletId++;
    const wallet: Wallet = {
      id,
      ...walletData,
      createdAt: new Date()
    };
    
    this.wallets.set(id, wallet);
    return wallet;
  }
  
  async updateWalletBalance(id: number, balance: number): Promise<Wallet> {
    const wallet = this.wallets.get(id);
    if (!wallet) throw new Error(`Wallet with ID ${id} not found`);
    
    const updatedWallet = { ...wallet, balance };
    this.wallets.set(id, updatedWallet);
    return updatedWallet;
  }
  
  async updateWalletAccount(id: number, accountNumber: string | null, accountName: string | null): Promise<Wallet> {
    const wallet = this.wallets.get(id);
    if (!wallet) throw new Error(`Wallet with ID ${id} not found`);
    
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
      .filter(tx => tx.userId === userId)
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  }
  
  async createTransaction(transactionData: Omit<Transaction, "id" | "timestamp">): Promise<Transaction> {
    const id = this.currentTransactionId++;
    const transaction: Transaction = {
      id,
      ...transactionData,
      timestamp: new Date()
    };
    
    this.transactions.set(id, transaction);
    return transaction;
  }
  
  async getExchangeRate(fromProgram: LoyaltyProgram, toProgram: LoyaltyProgram): Promise<ExchangeRate | undefined> {
    const key = `${fromProgram}-${toProgram}`;
    return this.exchangeRates.get(key);
  }
  
  async getTierBenefits(tier: MembershipTier): Promise<TierBenefit | undefined> {
    return this.tierBenefits.get(tier);
  }
  
  async createTierBenefits(benefits: InsertTierBenefits): Promise<TierBenefit> {
    const id = this.tierBenefits.size + 1;
    const tierBenefit: TierBenefit = {
      id,
      ...benefits
    };
    
    this.tierBenefits.set(benefits.tier, tierBenefit);
    return tierBenefit;
  }
  
  async initializeTierBenefits(): Promise<void> {
    if (this.tierBenefits.size === 0) {
      await this.createTierBenefits({
        tier: "STANDARD",
        monthlyPointsThreshold: 0,
        freeConversionLimit: 10000,
        conversionFeeRate: "0.005",
        p2pMinimumFee: "0.005",
        p2pMaximumFee: "0.03",
        monthlyExpiryDays: 30
      });
      
      await this.createTierBenefits({
        tier: "SILVER",
        monthlyPointsThreshold: 20000,
        freeConversionLimit: 20000,
        conversionFeeRate: "0.0045",
        p2pMinimumFee: "0.004",
        p2pMaximumFee: "0.025",
        monthlyExpiryDays: 45
      });
      
      await this.createTierBenefits({
        tier: "GOLD",
        monthlyPointsThreshold: 50000,
        freeConversionLimit: 50000,
        conversionFeeRate: "0.0035",
        p2pMinimumFee: "0.003",
        p2pMaximumFee: "0.02",
        monthlyExpiryDays: 60
      });
      
      await this.createTierBenefits({
        tier: "PLATINUM",
        monthlyPointsThreshold: 100000,
        freeConversionLimit: 100000,
        conversionFeeRate: "0.0025",
        p2pMinimumFee: "0.002",
        p2pMaximumFee: "0.015",
        monthlyExpiryDays: 90
      });
    }
  }
  
  // Simplified stubs for trading
  async getTradeOffers(excludeUserId?: number): Promise<TradeOffer[]> {
    let offers = Array.from(this.tradeOffers.values()).filter(o => o.status === "open");
    
    if (excludeUserId) {
      offers = offers.filter(o => o.createdBy !== excludeUserId);
    }
    
    return offers;
  }
  
  async getUserTradeOffers(userId: number): Promise<TradeOffer[]> {
    return Array.from(this.tradeOffers.values()).filter(o => o.createdBy === userId);
  }
  
  async getTradeOffer(id: number): Promise<TradeOffer | undefined> {
    return this.tradeOffers.get(id);
  }
  
  async createTradeOffer(data: Omit<TradeOffer, "id" | "createdAt" | "status">): Promise<TradeOffer> {
    const id = this.currentTradeOfferId++;
    const offer: TradeOffer = {
      id,
      ...data,
      status: "open",
      createdAt: new Date()
    };
    
    this.tradeOffers.set(id, offer);
    return offer;
  }
  
  async updateTradeOfferStatus(id: number, status: string): Promise<TradeOffer | undefined> {
    const offer = this.tradeOffers.get(id);
    if (!offer) return undefined;
    
    const updatedOffer = { ...offer, status };
    this.tradeOffers.set(id, updatedOffer);
    return updatedOffer;
  }
  
  async getTradeHistory(userId: number): Promise<TradeTransaction[]> {
    return Array.from(this.tradeTransactions.values()).filter(
      t => t.buyerId === userId || t.sellerId === userId
    );
  }
  
  async createTradeTransaction(data: Omit<TradeTransaction, "id" | "completedAt">): Promise<TradeTransaction> {
    const id = this.currentTradeTransactionId++;
    const transaction: TradeTransaction = {
      id,
      ...data,
      completedAt: new Date()
    };
    
    this.tradeTransactions.set(id, transaction);
    return transaction;
  }
  
  // Simple stubs for business analytics
  async getBusinessAnalytics(businessId: number): Promise<BusinessAnalytics | undefined> {
    return undefined; 
  }
  
  async updateBusinessAnalytics(businessId: number, data: Partial<InsertBusinessAnalytics>): Promise<BusinessAnalytics> {
    throw new Error("Not implemented");
  }
  
  async bulkIssuePoints(data: BulkPointIssuanceData): Promise<number> {
    return 0;
  }
  
  // Simple stubs for blockchain operations
  async getAllUserTokenBalances(): Promise<{ id: number; tokenBalance: number | null; }[]> {
    return Array.from(this.users.values())
      .filter(u => u.tokenBalance !== null && u.tokenBalance !== undefined)
      .map(u => ({ id: u.id, tokenBalance: u.tokenBalance }));
  }
  
  async getAllConversionTransactions(fromProgram: LoyaltyProgram, toProgram: LoyaltyProgram): Promise<Transaction[]> {
    return Array.from(this.transactions.values()).filter(
      t => t.fromProgram === fromProgram && t.toProgram === toProgram
    );
  }
}

// Use the PostgreSQL implementation
export const storage = new DatabaseStorage();