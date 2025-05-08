import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth } from "./auth";
import { convertPointsSchema, linkAccountSchema, type LoyaltyProgram } from "@shared/schema";
import { z } from 'zod';

// Define interfaces for tokenization and explorer features
interface TokenLedgerEntry {
  id: string;
  userId: number;
  program: LoyaltyProgram;
  amount: number;
  timestamp: Date;
  status: string;
}

interface MarketTrend {
  timestamp: Date;
  xpointsRate: number;
  qantasRate: number;
  gygRate: number;
  volume: number;
}

// Schema for tokenization feature
const tokenizeSchema = z.object({
  program: z.enum(["QANTAS", "GYG", "XPOINTS"]),
  amount: z.number().positive(),
});

// Schema for merchant portal
const promotionSchema = z.object({
  title: z.string().min(1),
  description: z.string().min(1),
  pointsRequired: z.number().positive(),
  program: z.enum(["QANTAS", "GYG", "XPOINTS"]),
  startDate: z.string().transform(str => new Date(str)),
  endDate: z.string().transform(str => new Date(str)),
  rewardValue: z.number().positive(),
  merchantId: z.number().optional(),
});

export async function registerRoutes(app: Express): Promise<Server> {
  // Sets up /api/register, /api/login, /api/logout, /api/user
  setupAuth(app);

  // ===== CORE FEATURES =====

  // Get user wallets
  app.get("/api/wallets", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    try {
      const wallets = await storage.getUserWallets(req.user!.id);
      res.json(wallets);
    } catch (error) {
      console.error("Error fetching wallets:", error);
      res.status(500).json({ message: "Failed to fetch wallets" });
    }
  });

  // Get user transactions
  app.get("/api/transactions", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    try {
      const transactions = await storage.getUserTransactions(req.user!.id);
      res.json(transactions);
    } catch (error) {
      console.error("Error fetching transactions:", error);
      res.status(500).json({ message: "Failed to fetch transactions" });
    }
  });

  // Get exchange rates
  app.get("/api/exchange-rates", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    const { from, to } = req.query;
    
    try {
      // Validate input
      if (!from || !to || typeof from !== 'string' || typeof to !== 'string') {
        return res.status(400).json({ message: "Invalid parameters" });
      }
      
      const rate = await storage.getExchangeRate(
        from as "QANTAS" | "GYG" | "XPOINTS", 
        to as "QANTAS" | "GYG" | "XPOINTS"
      );
      
      if (!rate) {
        return res.status(404).json({ message: "Exchange rate not found" });
      }
      
      res.json(rate);
    } catch (error) {
      console.error("Error fetching exchange rate:", error);
      res.status(500).json({ message: "Failed to fetch exchange rate" });
    }
  });

  // Convert points between programs
  app.post("/api/convert", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    try {
      // Validate request body
      const data = convertPointsSchema.parse(req.body);
      
      // Check that from and to programs are different
      if (data.fromProgram === data.toProgram) {
        return res.status(400).json({ message: "Cannot convert between the same program" });
      }
      
      // Get source wallet
      const sourceWallet = await storage.getWallet(req.user!.id, data.fromProgram);
      if (!sourceWallet) {
        return res.status(404).json({ message: "Source wallet not found" });
      }
      
      // Check if user has enough balance
      if (sourceWallet.balance < data.amount) {
        return res.status(400).json({ message: "Insufficient balance" });
      }
      
      // Get destination wallet
      const destWallet = await storage.getWallet(req.user!.id, data.toProgram);
      if (!destWallet) {
        return res.status(404).json({ message: "Destination wallet not found" });
      }
      
      // Direct conversion or via xPoints?
      let amountTo = 0;
      let feeApplied = 0;
      
      if (data.fromProgram !== "XPOINTS" && data.toProgram !== "XPOINTS") {
        // Convert source -> xPoints -> destination
        const sourceToXpRate = await storage.getExchangeRate(data.fromProgram, "XPOINTS");
        const xpToDestRate = await storage.getExchangeRate("XPOINTS", data.toProgram);
        
        if (!sourceToXpRate || !xpToDestRate) {
          return res.status(404).json({ message: "Exchange rate not found" });
        }
        
        // Calculate conversion
        const xpAmount = data.amount * Number(sourceToXpRate.rate);
        amountTo = xpAmount * Number(xpToDestRate.rate);
      } else {
        // Direct conversion
        const rate = await storage.getExchangeRate(data.fromProgram, data.toProgram);
        if (!rate) {
          return res.status(404).json({ message: "Exchange rate not found" });
        }
        
        amountTo = data.amount * Number(rate.rate);
      }
      
      // Update wallet balances
      await storage.updateWalletBalance(sourceWallet.id, sourceWallet.balance - data.amount);
      await storage.updateWalletBalance(destWallet.id, destWallet.balance + amountTo);
      
      // Create transaction record
      const transaction = await storage.createTransaction({
        userId: req.user!.id,
        fromProgram: data.fromProgram,
        toProgram: data.toProgram,
        amountFrom: data.amount,
        amountTo,
        feeApplied,
        status: "completed"
      });
      
      res.status(200).json({
        transaction,
        fromBalance: sourceWallet.balance - data.amount,
        toBalance: destWallet.balance + amountTo
      });
    } catch (error) {
      console.error("Error converting points:", error);
      
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid request data", errors: error.errors });
      }
      
      res.status(500).json({ message: "Failed to convert points" });
    }
  });

  // Link loyalty account
  app.post("/api/link-account", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    try {
      // Validate request body
      const data = linkAccountSchema.parse(req.body);
      
      // Check if wallet exists
      const existingWallet = await storage.getWallet(req.user!.id, data.program);
      if (!existingWallet) {
        // Create new wallet
        const wallet = await storage.createWallet({
          userId: req.user!.id,
          program: data.program,
          balance: 0,
          accountNumber: data.accountNumber,
          accountName: data.accountName
        });
        
        return res.status(201).json(wallet);
      }
      
      // Update existing wallet with new account details
      const updatedWallet = await storage.updateWalletAccount(
        existingWallet.id, 
        data.accountNumber, 
        data.accountName
      );
      
      res.status(200).json(updatedWallet);
    } catch (error) {
      console.error("Error linking account:", error);
      
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid request data", errors: error.errors });
      }
      
      res.status(500).json({ message: "Failed to link account" });
    }
  });

  // ===== TOKENIZATION FEATURES =====

  // Get token ledger for user
  app.get("/api/tokens", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    try {
      // NOTE: This will be updated in the future to query a token_ledger table
      // For now we'll return an empty array
      const tokenLedger: TokenLedgerEntry[] = [];
      res.json(tokenLedger);
    } catch (error) {
      console.error("Error fetching token ledger:", error);
      res.status(500).json({ message: "Failed to fetch token ledger" });
    }
  });

  // Tokenize points
  app.post("/api/tokenize", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    try {
      // Validate request body
      const data = tokenizeSchema.parse(req.body);
      
      // Get user wallet
      const wallet = await storage.getWallet(req.user!.id, data.program);
      if (!wallet) {
        return res.status(404).json({ message: "Wallet not found" });
      }
      
      // Check if user has enough balance
      if (wallet.balance < data.amount) {
        return res.status(400).json({ message: "Insufficient balance" });
      }
      
      // For now, just create a transaction to represent the tokenization
      // Later, we'll create a token_ledger entry
      const transaction = await storage.createTransaction({
        userId: req.user!.id,
        fromProgram: data.program,
        toProgram: data.program,
        amountFrom: data.amount,
        amountTo: data.amount,
        feeApplied: 0,
        status: "tokenized"
      });
      
      // Update wallet balance
      await storage.updateWalletBalance(wallet.id, wallet.balance - data.amount);
      
      res.status(200).json({
        transaction,
        newBalance: wallet.balance - data.amount,
        tokenId: `TOK${Date.now()}${req.user!.id}`,
        status: "minted"
      });
    } catch (error) {
      console.error("Error tokenizing points:", error);
      
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid request data", errors: error.errors });
      }
      
      res.status(500).json({ message: "Failed to tokenize points" });
    }
  });

  // ===== MERCHANT PORTAL FEATURES =====
  
  // Get merchant statistics
  app.get("/api/merchant/stats", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    try {
      // For now, just return some stats for the UI
      res.json({
        totalTransactions: 0,
        totalPoints: 0,
        activePromotions: 0,
        redeemRate: 0,
        customerReach: 0
      });
    } catch (error) {
      console.error("Error fetching merchant stats:", error);
      res.status(500).json({ message: "Failed to fetch merchant statistics" });
    }
  });

  // Create a new promotion
  app.post("/api/merchant/promotions", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    try {
      // Validate request body
      const data = promotionSchema.parse(req.body);
      
      // Use the merchant ID from the user if not provided
      const merchantId = data.merchantId || req.user!.id;
      
      // Create promotion
      const promotion = {
        ...data,
        merchantId,
        id: 1, // This would be auto-generated in the database
        createdAt: new Date(),
        status: "active"
      };
      
      res.status(201).json(promotion);
    } catch (error) {
      console.error("Error creating promotion:", error);
      
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid request data", errors: error.errors });
      }
      
      res.status(500).json({ message: "Failed to create promotion" });
    }
  });

  // ===== EXPLORER FEATURES =====
  
  // Get market trends
  app.get("/api/explorer/trends", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    const { period } = req.query;
    
    try {
      // For now, return placeholder data for the UI
      // This would eventually query transaction data with time-series analysis
      const trends = [];
      
      res.json(trends);
    } catch (error) {
      console.error("Error fetching market trends:", error);
      res.status(500).json({ message: "Failed to fetch market trends" });
    }
  });
  
  // Get circulation stats
  app.get("/api/explorer/circulation", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    try {
      // Return placeholder data for now
      // This would calculate total points in circulation across all wallets
      res.json({
        xpoints: 0,
        qantas: 0,
        gyg: 0,
        total: 0,
        tokenized: 0
      });
    } catch (error) {
      console.error("Error fetching circulation stats:", error);
      res.status(500).json({ message: "Failed to fetch circulation statistics" });
    }
  });

  // Create HTTP server
  const httpServer = createServer(app);
  return httpServer;
}
