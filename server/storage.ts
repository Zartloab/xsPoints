import { users, wallets, transactions, exchangeRates, type User, type InsertUser, type Wallet, type Transaction, type ExchangeRate, type LoyaltyProgram } from "@shared/schema";
import session from "express-session";
import createMemoryStore from "memorystore";
import connectPg from "connect-pg-simple";
import { db } from "./db";
import { eq, and, desc } from "drizzle-orm";

// Session store options
const MemoryStore = createMemoryStore(session);
const PostgresSessionStore = connectPg(session);

export interface IStorage {
  // User operations
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
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
  
  // Session store
  sessionStore: any; // Using 'any' to avoid type errors with session.SessionStore
}

// PostgreSQL Database Storage Implementation
export class DatabaseStorage implements IStorage {
  sessionStore: session.SessionStore;

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
    // Insert the user with kycVerified field
    const userWithKyc = {
      ...insertUser,
      kycVerified: "unverified"
    };
    
    const [user] = await db.insert(users).values(userWithKyc).returning();
    
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
      
    return newTransaction;
  }

  async getExchangeRate(fromProgram: LoyaltyProgram, toProgram: LoyaltyProgram): Promise<ExchangeRate | undefined> {
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
  sessionStore: session.SessionStore;

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
}

// Switch to database storage
export const storage = new DatabaseStorage();
