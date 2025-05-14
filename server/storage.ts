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
        .values({
          ...walletData,
          createdAt: new Date()
        })
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
          accountName,
          lastSynced: new Date()
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
        .values({
          ...transactionData,
          timestamp: new Date()
        })
        .returning();
      
      return transaction;
    } catch (error) {
      console.error(`Error creating transaction:`, error);
      throw error;
    }
  }
  
  // User operations
  async getUserStats(userId: number): Promise<{ pointsConverted: number, feesPaid: number, monthlyPoints: number, tier: MembershipTier }> {
    try {
      const [user] = await db
        .select({
          pointsConverted: users.pointsConverted,
          monthlyPoints: users.monthlyPoints,
          feesPaid: users.feesPaid,
          tier: users.membershipTier
        })
        .from(users)
        .where(eq(users.id, userId));
      
      return {
        pointsConverted: user?.pointsConverted || 0,
        feesPaid: user?.feesPaid || 0,
        monthlyPoints: user?.monthlyPoints || 0,
        tier: user?.tier || "STANDARD"
      };
    } catch (error) {
      console.error(`Error fetching user stats for user ${userId}:`, error);
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
          monthlyPoints: (user.monthlyPoints || 0) + pointsConverted,
          feesPaid: (user.feesPaid || 0) + fee
        })
        .where(eq(users.id, userId))
        .returning();
      
      return updatedUser;
    } catch (error) {
      console.error(`Error updating stats for user ${userId}:`, error);
      throw error;
    }
  }
  
  // Trading operations
  async getTradeOffers(excludeUserId?: number): Promise<TradeOffer[]> {
    try {
      let query = db
        .select()
        .from(tradeOffers)
        .where(eq(tradeOffers.status, "active"));
      
      if (excludeUserId) {
        query = query.where(ne(tradeOffers.createdBy, excludeUserId));
      }
      
      return await query;
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
          status: "active",
          createdAt: new Date()
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
        .values({
          ...data,
          completedAt: new Date()
        })
        .returning();
      
      return transaction;
    } catch (error) {
      console.error("Error creating trade transaction:", error);
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
        const defaultBenefits = [
          {
            tier: "STANDARD" as MembershipTier,
            feeDiscount: 0,
            maxFreePointsPerMonth: 10000,
            loyaltyBonus: 0
          },
          {
            tier: "SILVER" as MembershipTier,
            feeDiscount: 10,
            maxFreePointsPerMonth: 20000,
            loyaltyBonus: 2
          },
          {
            tier: "GOLD" as MembershipTier,
            feeDiscount: 25,
            maxFreePointsPerMonth: 50000,
            loyaltyBonus: 5
          },
          {
            tier: "PLATINUM" as MembershipTier,
            feeDiscount: 50,
            maxFreePointsPerMonth: 100000,
            loyaltyBonus: 10
          }
        ];
        
        await db.insert(tierBenefits).values(defaultBenefits);
      }
    } catch (error) {
      console.error("Error initializing tier benefits:", error);
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
      // Create the user
      const [user] = await db
        .insert(users)
        .values({
          ...insertUser,
          createdAt: new Date(),
          membershipTier: "STANDARD",
          kycVerified: "unverified",
          pointsConverted: 0,
          monthlyPoints: 0,
          feesPaid: 0
        })
        .returning();
      
      // Create default wallets for the user
      await Promise.all([
        this.createWallet({
          userId: user.id,
          program: "XPOINTS",
          balance: 1000, // Starting bonus
          accountNumber: null,
          accountName: null,
          lastSynced: new Date()
        }),
        this.createWallet({
          userId: user.id,
          program: "QANTAS",
          balance: 0,
          accountNumber: null,
          accountName: null,
          lastSynced: new Date()
        }),
        this.createWallet({
          userId: user.id,
          program: "GYG",
          balance: 0,
          accountNumber: null,
          accountName: null,
          lastSynced: new Date()
        })
      ]);
      
      return user;
    } catch (error) {
      console.error("Error creating user:", error);
      throw error;
    }
  }
  
  // Business analytics operations
  async getBusinessAnalytics(businessId: number): Promise<BusinessAnalytics | undefined> {
    // This is just a stub as we don't have a full implementation
    return undefined;
  }
  
  async updateBusinessAnalytics(businessId: number, data: Partial<InsertBusinessAnalytics>): Promise<BusinessAnalytics> {
    // This is just a stub as we don't have a full implementation
    throw new Error("Not implemented");
  }
  
  async bulkIssuePoints(data: BulkPointIssuanceData): Promise<number> {
    // This is just a stub as we don't have a full implementation
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
        .where(
          ne(users.tokenBalance, null)
        );
      
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
  
  async getUserByWalletAddress(walletAddress: string): Promise<User | undefined> {
    try {
      const [user] = await db
        .select()
        .from(users)
        .where(eq(users.walletAddress, walletAddress));
      
      return user;
    } catch (error) {
      console.error(`Error finding user by wallet address ${walletAddress}:`, error);
      return undefined;
    }
  }
  
  async getUser(id: number): Promise<User | undefined> {
    try {
      const [user] = await db
        .select()
        .from(users)
        .where(eq(users.id, id));
      
      return user;
    } catch (error) {
      console.error(`Error fetching user ${id}:`, error);
      return undefined;
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
      return undefined;
    }
  }
  
  async createUser(insertUser: InsertUser): Promise<User> {
    try {
      const [user] = await db
        .insert(users)
        .values({
          ...insertUser,
          createdAt: new Date(),
          kycVerified: "unverified",
          membershipTier: "STANDARD",
          tierExpiresAt: null,
          pointsConverted: 0,
          monthlyPointsConverted: 0,
          lastMonthReset: null,
          walletAddress: null,
          walletPrivateKey: null,
          tokenBalance: null,
          tokenLedgerSynced: null,
          feesPaid: 0
        })
        .returning();
      
      return user;
    } catch (error) {
      console.error("Error creating user:", error);
      throw error;
    }
  }
  
  // User Preferences Methods removed
  
  // Rest of the methods implementation...
  // ...
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
  }
  
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
      walletAddress: null,
      walletPrivateKey: null,
      tokenBalance: null,
      tokenLedgerSynced: null,
      feesPaid: 0
    };
    this.users.set(id, user);
    return user;
  }
  
  // User Preferences Methods removed
  
  // Rest of the methods implementation...
  // ...
}

// Switch to database storage
export const storage = new DatabaseStorage();