import * as schema from "@shared/schema";
import { 
  users, transactions, type User, type InsertUser, type Wallet, type Transaction, type ExchangeRate, 
  type LoyaltyProgram, type TierBenefit, type InsertTierBenefits, type MembershipTier,
  type BusinessAnalytics, type InsertBusinessAnalytics, type BulkPointIssuanceData,
  type TradeOffer, type TradeTransaction
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
  
  // Session store
  sessionStore: SessionStore;
}

// PostgreSQL Database Storage Implementation
export class DatabaseStorage implements IStorage {
  sessionStore: SessionStore;
  
  constructor() {
    this.sessionStore = new PostgresSessionStore({ 
      pool: schema.pool, 
      createTableIfMissing: true 
    });
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
    this.userPreferences = new Map();
    this.currentUserId = 1;
    this.currentWalletId = 1;
    this.currentTransactionId = 1;
    this.currentExchangeRateId = 1;
    this.currentPreferenceId = 1;
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
  
  // User Preferences Methods
  async getUserPreferences(userId: number): Promise<UserPreference | undefined> {
    return Array.from(this.userPreferences.values()).find(
      (preference) => preference.userId === userId
    );
  }
  
  async createUserPreferences(data: InsertUserPreference): Promise<UserPreference> {
    const id = this.currentPreferenceId++;
    const preference: UserPreference = {
      id,
      userId: data.userId,
      favoritePrograms: data.favoritePrograms || [],
      dashboardLayout: data.dashboardLayout || [],
      updatedAt: new Date()
    };
    
    this.userPreferences.set(id, preference);
    return preference;
  }
  
  async updateUserPreferences(userId: number, data: Partial<InsertUserPreference>): Promise<UserPreference> {
    const existingPrefs = await this.getUserPreferences(userId);
    
    if (existingPrefs) {
      const updatedPrefs: UserPreference = {
        ...existingPrefs,
        favoritePrograms: data.favoritePrograms || existingPrefs.favoritePrograms,
        dashboardLayout: data.dashboardLayout || existingPrefs.dashboardLayout,
        updatedAt: new Date()
      };
      
      this.userPreferences.set(existingPrefs.id, updatedPrefs);
      return updatedPrefs;
    } else {
      return this.createUserPreferences({
        userId,
        favoritePrograms: data.favoritePrograms || [],
        dashboardLayout: data.dashboardLayout || []
      });
    }
  }
  
  // Rest of the methods implementation...
  // ...
}

// Switch to database storage
export const storage = new DatabaseStorage();