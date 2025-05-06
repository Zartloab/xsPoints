import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth } from "./auth";
import { convertPointsSchema, linkAccountSchema } from "@shared/schema";
import { z } from 'zod';

export async function registerRoutes(app: Express): Promise<Server> {
  // Sets up /api/register, /api/login, /api/logout, /api/user
  setupAuth(app);

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
      
      // Update existing wallet
      const updatedWallet = {
        ...existingWallet,
        accountNumber: data.accountNumber,
        accountName: data.accountName
      };
      
      this.wallets.set(existingWallet.id, updatedWallet);
      res.status(200).json(updatedWallet);
    } catch (error) {
      console.error("Error linking account:", error);
      
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid request data", errors: error.errors });
      }
      
      res.status(500).json({ message: "Failed to link account" });
    }
  });

  // Create HTTP server
  const httpServer = createServer(app);
  return httpServer;
}
