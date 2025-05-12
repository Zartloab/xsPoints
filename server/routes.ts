import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth } from "./auth";
import apiRouter from "./api";
import docsRouter from "./api/docs";
import { tokenService } from "./blockchain/tokenService";
import { recommendationService } from "./services/recommendationService";
import { 
  convertPointsSchema, 
  linkAccountSchema, 
  insertBusinessSchema,
  insertBusinessProgramSchema,
  insertBusinessPaymentSchema,
  businessIssuePointsSchema,
  createTradeOfferSchema,
  acceptTradeOfferSchema,
  type LoyaltyProgram 
} from "@shared/schema";
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
  
  // Get user stats (for membership tier progress)
  app.get("/api/user-stats", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    try {
      const stats = await storage.getUserStats(req.user!.id);
      res.json(stats);
    } catch (error) {
      console.error("Error fetching user stats:", error);
      res.status(500).json({ message: "Failed to fetch user stats" });
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
  
  // Get all exchange rates
  app.get("/api/exchange-rates/all", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    try {
      // This endpoint would typically return all exchange rates from the database
      // Since we don't have a direct method to get all at once, we'll return a curated list
      // of the most important rates
      
      const programs = ["QANTAS", "GYG", "XPOINTS", "VELOCITY", "AMEX", 
                        "FLYBUYS", "HILTON", "MARRIOTT", "AIRBNB", "DELTA"];
      
      // Get a subset of rates that would be most relevant to the user
      const rates = [];
      for (const from of programs.slice(0, 3)) {
        for (const to of programs.slice(0, 3)) {
          if (from !== to) {
            try {
              const rate = await storage.getExchangeRate(
                from as any, 
                to as any
              );
              if (rate) {
                rates.push(rate);
              }
            } catch (err) {
              // Skip any rate we can't get
              console.error(`Error fetching rate from ${from} to ${to}:`, err);
            }
          }
        }
      }
      
      res.json(rates);
    } catch (error) {
      console.error("Error fetching all exchange rates:", error);
      res.status(500).json({ message: "Failed to fetch exchange rates" });
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
      
      // Calculate fee - free up to 10,000 points, 0.5% after that
      const FREE_CONVERSION_LIMIT = 10000;
      if (data.amount > FREE_CONVERSION_LIMIT) {
        const amountOverLimit = data.amount - FREE_CONVERSION_LIMIT;
        feeApplied = amountOverLimit * 0.005; // 0.5% fee
        console.log(`Applying conversion fee: ${feeApplied} on ${amountOverLimit} points over 10,000 free limit`);
      }
      
      // Calculate amount after fee deduction
      const amountAfterFee = data.amount - feeApplied;
      
      if (data.fromProgram !== "XPOINTS" && data.toProgram !== "XPOINTS") {
        // Convert source -> xPoints -> destination
        const sourceToXpRate = await storage.getExchangeRate(data.fromProgram, "XPOINTS");
        const xpToDestRate = await storage.getExchangeRate("XPOINTS", data.toProgram);
        
        if (!sourceToXpRate || !xpToDestRate) {
          return res.status(404).json({ message: "Exchange rate not found" });
        }
        
        // Calculate conversion using amount after fee
        const xpAmount = amountAfterFee * Number(sourceToXpRate.rate);
        amountTo = xpAmount * Number(xpToDestRate.rate);
      } else {
        // Direct conversion
        const rate = await storage.getExchangeRate(data.fromProgram, data.toProgram);
        if (!rate) {
          return res.status(404).json({ message: "Exchange rate not found" });
        }
        
        amountTo = amountAfterFee * Number(rate.rate);
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
        status: "completed",
        recipientId: 0,
        transactionHash: "",
        blockNumber: 0,
        contractAddress: "",
        tokenAddress: ""
      });
      
      res.status(200).json({
        transaction,
        fromBalance: sourceWallet.balance - data.amount,
        toBalance: destWallet.balance + amountTo,
        fee: feeApplied,
        feePercentage: feeApplied > 0 ? "0.5%" : "0%",
        conversionDetails: {
          originalAmount: data.amount,
          amountAfterFee: amountAfterFee,
          convertedAmount: amountTo,
          freeLimit: FREE_CONVERSION_LIMIT
        }
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
      
      try {
        // Use the token service to mint tokens
        // This will now throw errors instead of returning false
        await tokenService.mintTokens(
          req.user!.id,
          data.program,
          data.amount
        );
        
        // If we reach here, the mint operation was successful (either through blockchain or fallback)
        
        // Get updated wallet balances
        const updatedWallet = await storage.getWallet(req.user!.id, data.program);
        const xPointsWallet = await storage.getWallet(req.user!.id, "XPOINTS");
        
        // Get blockchain wallet address
        const walletAddress = await tokenService.getUserWalletAddress(req.user!.id);
        
        res.status(200).json({
          success: true,
          blockchain: {
            walletAddress,
            tokenBalance: xPointsWallet?.balance || 0
          },
          sourceWallet: {
            program: data.program,
            balance: updatedWallet?.balance || 0
          }
        });
      } catch (processingError: any) { // Type annotation to fix TypeScript error
        console.error("Error in token minting process:", processingError);
        return res.status(500).json({ 
          message: "Failed to convert points to xPoints", 
          error: processingError.message || "Unknown error" 
        });
      }
    } catch (error) {
      console.error("Error converting loyalty points to xPoints:", error);
      
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid request data", errors: error.errors });
      }
      
      res.status(500).json({ message: "Failed to convert loyalty points to xPoints" });
    }
  });
  
  // API endpoint for getting blockchain wallet info
  app.get("/api/blockchain-wallet", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    try {
      // Get or create wallet address for the user
      const walletAddress = await tokenService.getUserWalletAddress(req.user!.id);
      const tokenBalance = await tokenService.getUserBalance(req.user!.id);
      
      // Get token stats
      const totalSupply = await tokenService.getTotalSupply();
      const supportedPrograms = await tokenService.getSupportedPrograms();
      
      // Get reserves for each program
      const reserves = await Promise.all(
        supportedPrograms.map(async (program) => {
          const balance = await tokenService.getLoyaltyPointsReserve(program);
          return { program, balance };
        })
      );
      
      res.status(200).json({
        wallet: {
          address: walletAddress,
          balance: tokenBalance
        },
        token: {
          totalSupply,
          reserves
        }
      });
    } catch (error) {
      console.error("Error getting blockchain wallet:", error);
      res.status(500).json({ message: "Error retrieving blockchain wallet information" });
    }
  });
  
  // API endpoint for converting tokens back to loyalty points
  app.post("/api/detokenize", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    try {
      // Validate request body
      const data = z.object({
        program: z.enum(["QANTAS", "GYG", "XPOINTS", "VELOCITY", "AMEX", "FLYBUYS", "HILTON", "MARRIOTT", "AIRBNB", "DELTA"]),
        amount: z.number().positive()
      }).parse(req.body);
      
      // Get user's XPOINTS wallet
      const xpointsWallet = await storage.getWallet(req.user!.id, "XPOINTS");
      if (!xpointsWallet) {
        return res.status(404).json({ message: "XPOINTS wallet not found" });
      }
      
      // Check if user has enough tokens
      if (xpointsWallet.balance < data.amount) {
        return res.status(400).json({ message: "Insufficient token balance" });
      }
      
      // Get destination wallet (or create it if it doesn't exist)
      let targetWallet = await storage.getWallet(req.user!.id, data.program);
      if (!targetWallet) {
        targetWallet = await storage.createWallet({
          userId: req.user!.id,
          program: data.program,
          balance: 0,
          accountNumber: null,
          accountName: null
        });
      }
      
      // Use the token service to burn tokens and convert back to loyalty points
      const success = await tokenService.burnTokens(
        req.user!.id,
        data.program,
        data.amount
      );
      
      if (!success) {
        return res.status(500).json({ message: "Failed to convert tokens to loyalty points" });
      }
      
      // Get updated wallet balances
      const updatedXpointsWallet = await storage.getWallet(req.user!.id, "XPOINTS");
      const updatedTargetWallet = await storage.getWallet(req.user!.id, data.program);
      
      res.status(200).json({
        success: true,
        xpointsWallet: {
          program: "XPOINTS",
          balance: updatedXpointsWallet?.balance || 0
        },
        targetWallet: {
          program: data.program,
          balance: updatedTargetWallet?.balance || 0
        }
      });
    } catch (error) {
      console.error("Error converting tokens to loyalty points:", error);
      
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid request data", errors: error.errors });
      }
      
      res.status(500).json({ message: "Failed to convert tokens to loyalty points" });
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

  // ===== P2P TRADING FEATURES =====

  // Get all open trade offers
  app.get("/api/trades", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    try {
      // Get all active trade offers excluding the current user's
      const tradeOffers = await storage.getTradeOffers(req.user!.id);
      res.json(tradeOffers);
    } catch (error) {
      console.error("Error fetching trade offers:", error);
      res.status(500).json({ message: "Failed to fetch trade offers" });
    }
  });

  // Get user's trade offers
  app.get("/api/trades/my-offers", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    try {
      // Get the current user's trade offers
      const userOffers = await storage.getUserTradeOffers(req.user!.id);
      res.json(userOffers);
    } catch (error) {
      console.error("Error fetching user's trade offers:", error);
      res.status(500).json({ message: "Failed to fetch your trade offers" });
    }
  });

  // Create a new trade offer
  app.post("/api/trades", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    try {
      // Validate request body
      const data = createTradeOfferSchema.parse(req.body);
      
      // Check that from and to programs are different
      if (data.fromProgram === data.toProgram) {
        return res.status(400).json({ message: "Cannot trade between the same program" });
      }
      
      // Get source wallet to check balance
      const sourceWallet = await storage.getWallet(req.user!.id, data.fromProgram);
      if (!sourceWallet) {
        return res.status(404).json({ message: "Source wallet not found" });
      }
      
      // Check if user has enough balance
      if (sourceWallet.balance < data.amountOffered) {
        return res.status(400).json({ message: "Insufficient balance" });
      }
      
      // Get market rate for comparison
      const marketRate = await storage.getExchangeRate(data.fromProgram, data.toProgram);
      if (!marketRate) {
        return res.status(404).json({ message: "Market rate not found" });
      }
      
      // Calculate custom rate and savings
      const customRate = data.amountRequested / data.amountOffered;
      const marketRateValue = Number(marketRate.rate);
      const savings = ((marketRateValue - customRate) / marketRateValue) * 100;
      
      // Set expiration date
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + data.expiresIn);
      
      // Create the trade offer in the database
      const tradeOffer = await storage.createTradeOffer({
        createdBy: req.user!.id,
        fromProgram: data.fromProgram,
        toProgram: data.toProgram,
        amountOffered: data.amountOffered,
        amountRequested: data.amountRequested,
        customRate: customRate.toString(),
        marketRate: marketRate.rate,
        savings: savings.toString(),
        expiresAt,
        description: data.description || null
      });
      
      // Lock the funds by reducing user's balance
      await storage.updateWalletBalance(
        sourceWallet.id, 
        sourceWallet.balance - data.amountOffered
      );
      
      res.status(201).json(tradeOffer);
    } catch (error) {
      console.error("Error creating trade offer:", error);
      
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid request data", errors: error.errors });
      }
      
      res.status(500).json({ message: "Failed to create trade offer" });
    }
  });

  // Cancel a trade offer
  app.post("/api/trades/:id/cancel", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    try {
      const { id } = req.params;
      const offerId = parseInt(id);
      
      // Validate offer ID
      if (!id || isNaN(offerId)) {
        return res.status(400).json({ message: "Invalid trade offer ID" });
      }
      
      // Check if offer exists and belongs to user
      const offer = await storage.getTradeOffer(offerId);
      
      if (!offer) {
        return res.status(404).json({ message: "Trade offer not found" });
      }
      
      if (offer.createdBy !== req.user!.id) {
        return res.status(403).json({ message: "You can only cancel your own trade offers" });
      }
      
      if (offer.status !== "open") {
        return res.status(400).json({ message: "Can only cancel open trade offers" });
      }
      
      // Update offer status to cancelled
      const updatedOffer = await storage.updateTradeOfferStatus(offerId, "cancelled");
      
      // Return the locked funds to the user's wallet
      const wallet = await storage.getWallet(req.user!.id, offer.fromProgram);
      if (wallet) {
        await storage.updateWalletBalance(
          wallet.id, 
          wallet.balance + offer.amountOffered
        );
      }
      
      res.status(200).json({ 
        message: "Trade offer cancelled successfully", 
        id: offerId,
        status: "cancelled"
      });
    } catch (error) {
      console.error("Error cancelling trade offer:", error);
      res.status(500).json({ message: "Failed to cancel trade offer" });
    }
  });

  // Accept a trade offer
  app.post("/api/trades/:id/accept", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    try {
      const { id } = req.params;
      const offerId = parseInt(id);
      
      // Validate offer ID
      if (!id || isNaN(offerId)) {
        return res.status(400).json({ message: "Invalid trade offer ID" });
      }
      
      // Validate request body
      const data = acceptTradeOfferSchema.parse(req.body);
      
      // Get the trade offer from the database
      const tradeOffer = await storage.getTradeOffer(offerId);
      
      if (!tradeOffer) {
        return res.status(404).json({ message: "Trade offer not found" });
      }
      
      // Check if the offer is still open
      if (tradeOffer.status !== "open") {
        return res.status(400).json({ 
          message: "This trade offer is no longer available",
          status: tradeOffer.status
        });
      }
      
      // Check if the offer has expired
      if (new Date() > new Date(tradeOffer.expiresAt)) {
        // Automatically update the status to expired
        await storage.updateTradeOfferStatus(offerId, "expired");
        
        // Return locked funds to the seller
        const sellerWallet = await storage.getWallet(tradeOffer.createdBy, tradeOffer.fromProgram);
        if (sellerWallet) {
          await storage.updateWalletBalance(
            sellerWallet.id,
            sellerWallet.balance + tradeOffer.amountOffered
          );
        }
        
        return res.status(400).json({ message: "This trade offer has expired" });
      }
      
      // Check if user is trying to accept their own offer
      if (tradeOffer.createdBy === req.user!.id) {
        return res.status(400).json({ message: "Cannot accept your own trade offer" });
      }
      
      // Get buyer's wallet (the current user accepting the offer)
      const buyerWallet = await storage.getWallet(req.user!.id, tradeOffer.toProgram);
      if (!buyerWallet) {
        return res.status(404).json({ message: "Buyer wallet not found" });
      }
      
      // Check if buyer has enough balance
      if (buyerWallet.balance < tradeOffer.amountRequested) {
        return res.status(400).json({ message: "Insufficient balance" });
      }
      
      // Get seller's wallet (the user who created the offer)
      const sellerWallet = await storage.getWallet(tradeOffer.createdBy, tradeOffer.fromProgram);
      if (!sellerWallet) {
        return res.status(404).json({ message: "Seller wallet not found" });
      }
      
      // Calculate fee based on savings (percentage of market advantage)
      const marketRateValue = Number(tradeOffer.marketRate);
      const customRateValue = Number(tradeOffer.customRate);
      
      // Calculate savings percentage (how much better than market rate)
      const savingsPercent = ((marketRateValue - customRateValue) / marketRateValue) * 100;
      
      // Dynamic fee: 10% of the savings, with minimum and maximum caps
      // Higher savings = higher fees, but never more than 3% total
      const feePercentage = Math.min(Math.max(savingsPercent * 0.1, 0.5), 3) / 100;
      
      // Calculate fees for both parties
      // Seller pays a fee on what they receive
      const sellerFee = tradeOffer.amountRequested * feePercentage;
      // Buyer pays no fee to incentivize accepting offers
      const buyerFee = 0;
      
      console.log(`Trade fees - Savings: ${savingsPercent.toFixed(2)}%, Fee rate: ${(feePercentage*100).toFixed(2)}%, Seller fee: ${sellerFee}`);
      
      // Process the trade
      // 1. Update offer status to completed
      await storage.updateTradeOfferStatus(offerId, "completed");
      
      // 2. Update buyer's wallet: add offered amount, subtract requested amount
      await storage.updateWalletBalance(
        buyerWallet.id,
        buyerWallet.balance - tradeOffer.amountRequested + tradeOffer.amountOffered
      );
      
      // 3. Update seller's wallet: add requested amount minus fees
      await storage.updateWalletBalance(
        sellerWallet.id,
        sellerWallet.balance + tradeOffer.amountRequested - sellerFee
      );
      
      // 4. Create a trade transaction record
      const transaction = await storage.createTradeTransaction({
        tradeOfferId: tradeOffer.id,
        sellerId: tradeOffer.createdBy,
        buyerId: req.user!.id,
        sellerWalletId: sellerWallet.id,
        buyerWalletId: buyerWallet.id,
        amountSold: tradeOffer.amountOffered,
        amountBought: tradeOffer.amountRequested,
        rate: tradeOffer.customRate,
        sellerFee: sellerFee,
        buyerFee: buyerFee,
        status: "completed"
      });
      
      res.status(200).json({
        message: "Trade completed successfully",
        transaction
      });
    } catch (error) {
      console.error("Error accepting trade offer:", error);
      
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid request data", errors: error.errors });
      }
      
      res.status(500).json({ message: "Failed to accept trade offer" });
    }
  });

  // Get trade history for user
  app.get("/api/trades/history", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    try {
      // Get the user's trade history (as both buyer and seller)
      const tradeHistory = await storage.getTradeHistory(req.user!.id);
      res.json(tradeHistory);
    } catch (error) {
      console.error("Error fetching trade history:", error);
      res.status(500).json({ message: "Failed to fetch trade history" });
    }
  });

  // ===== BUSINESS LOYALTY PROGRAM FEATURES =====
  
  // Get user's businesses
  app.get("/api/business", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    try {
      // This will be implemented when we add the business storage methods
      // For now, we'll return an empty array
      res.json([]);
    } catch (error) {
      console.error("Error fetching businesses:", error);
      res.status(500).json({ message: "Failed to fetch businesses" });
    }
  });
  
  // Create a new business
  app.post("/api/business", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    try {
      // Validate request body
      const data = insertBusinessSchema.parse(req.body);
      
      // Create business (placeholder for storage implementation)
      const business = {
        ...data,
        userId: req.user!.id,
        id: 1, // This would be auto-generated in the database
        createdAt: new Date(),
        verified: false,
        active: true
      };
      
      res.status(201).json(business);
    } catch (error) {
      console.error("Error creating business:", error);
      
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid request data", errors: error.errors });
      }
      
      res.status(500).json({ message: "Failed to create business" });
    }
  });
  
  // Create a new business loyalty program
  app.post("/api/business/:businessId/program", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    try {
      const { businessId } = req.params;
      
      // Validate business ID
      if (!businessId || isNaN(Number(businessId))) {
        return res.status(400).json({ message: "Invalid business ID" });
      }
      
      // Validate request body
      const data = insertBusinessProgramSchema.parse(req.body);
      
      // Make sure the user owns this business
      // This would be implemented when we add the business storage methods
      
      // Create loyalty program (placeholder for storage implementation)
      const program = {
        ...data,
        businessId: parseInt(businessId),
        id: 1, // This would be auto-generated in the database
        createdAt: new Date(),
        active: true,
        pointsIssued: "0"
      };
      
      res.status(201).json(program);
    } catch (error) {
      console.error("Error creating business program:", error);
      
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid request data", errors: error.errors });
      }
      
      res.status(500).json({ message: "Failed to create business program" });
    }
  });
  
  // Pay to issue points (businesses purchase points from xPoints)
  app.post("/api/business/:businessId/payment", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    try {
      const { businessId } = req.params;
      
      // Validate business ID
      if (!businessId || isNaN(Number(businessId))) {
        return res.status(400).json({ message: "Invalid business ID" });
      }
      
      // Validate request body
      const data = insertBusinessPaymentSchema.parse(req.body);
      
      // Make sure the user owns this business
      // This would be implemented when we add the business storage methods
      
      // For now, let's assume a fixed exchange rate of 100 points per $1
      const pointsIssued = Number(data.amount) * 100;
      
      // Process payment (in a real implementation, we would use Stripe or another payment processor)
      const payment = {
        ...data,
        businessId: parseInt(businessId),
        id: 1, // This would be auto-generated in the database
        paymentDate: new Date(),
        pointsIssued: pointsIssued.toString(),
        status: "completed"
      };
      
      // Update the business program's available points
      // This would be implemented when we add the business storage methods
      
      res.status(201).json(payment);
    } catch (error) {
      console.error("Error processing payment:", error);
      
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid request data", errors: error.errors });
      }
      
      res.status(500).json({ message: "Failed to process payment" });
    }
  });
  
  // Issue points to a user
  app.post("/api/business/program/:programId/issue", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    try {
      const { programId } = req.params;
      
      // Validate program ID
      if (!programId || isNaN(Number(programId))) {
        return res.status(400).json({ message: "Invalid program ID" });
      }
      
      // Validate request body
      const data = businessIssuePointsSchema.parse(req.body);
      
      // Make sure the user owns the business that owns this program
      // This would be implemented when we add the business storage methods
      
      // Check if the business has enough points to issue
      // This would be implemented when we add the business storage methods
      
      // Issue points to the user
      const issuance = {
        ...data,
        businessProgramId: parseInt(programId),
        id: 1, // This would be auto-generated in the database
        issuanceDate: new Date(),
        status: "active"
      };
      
      // Update the user's wallet for this program
      // This would be implemented when we add a custom business program wallet
      
      res.status(201).json(issuance);
    } catch (error) {
      console.error("Error issuing points:", error);
      
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid request data", errors: error.errors });
      }
      
      res.status(500).json({ message: "Failed to issue points" });
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
      const trends: MarketTrend[] = [];
      
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
  // ===== DEVELOPER API ROUTES =====
  
  // Register API routes
  app.use('/api/v1', apiRouter);
  
  // API documentation
  app.use('/api/docs', docsRouter);
  
  // ===== AI RECOMMENDATION ENGINE =====
  
  // Get personalized points recommendations
  app.get("/api/recommendations", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    try {
      const recommendations = await recommendationService.getUserRecommendations(req.user!.id);
      res.json(recommendations);
    } catch (error) {
      console.error("Error generating recommendations:", error);
      res.status(500).json({ message: "Failed to generate recommendations" });
    }
  });
  
  // Test endpoint for AI recommendations - FOR DEVELOPMENT ONLY
  app.get("/api/recommendations/test", async (req, res) => {
    try {
      // Use a hardcoded user ID for testing
      const testUserId = 6; // Our new tester2 user
      console.log(`Generating test recommendations for user ID ${testUserId}`);
      
      // First make sure the user exists
      const user = await storage.getUser(testUserId);
      if (!user) {
        console.error(`Test user with ID ${testUserId} not found`);
        return res.status(404).json({ message: "Test user not found" });
      }
      
      console.log(`Found test user: ${user.username}`);
      
      // Make sure the user has wallets
      const wallets = await storage.getUserWallets(testUserId);
      if (!wallets || wallets.length === 0) {
        console.error(`No wallets found for test user`);
        return res.status(404).json({ message: "No wallets found for test user" });
      }
      
      console.log(`Found ${wallets.length} wallets for test user`);
      
      // Set a timeout for the API call to avoid long-running requests
      const timeout = 5000; // 5 seconds timeout
      const timeoutPromise = new Promise<null>((_, reject) => 
        setTimeout(() => reject(new Error('Recommendation generation timed out')), timeout)
      );
      
      // Generate recommendations with timeout
      try {
        const recommendations = await Promise.race([
          recommendationService.getUserRecommendations(testUserId),
          timeoutPromise
        ]) as any;
        res.json(recommendations);
      } catch (timeoutError) {
        console.log('Recommendation timed out, using rule-based fallback');
        // If timed out, use rule-based recommendations directly
        const wallets = await storage.getUserWallets(testUserId);
        const transactions = await storage.getUserTransactions(testUserId);
        const exchangeRates: { fromProgram: string; toProgram: string; rate: string }[] = [];
        
        res.json({
          userId: testUserId,
          timestamp: new Date(),
          recommendationType: 'program',
          title: 'Rule-Based Recommendations',
          description: 'Here are some rule-based recommendations generated for your loyalty points.',
          programRecommendations: [
            {
              program: wallets[0].program,
              reason: `You have ${wallets[0].balance.toLocaleString()} points in this program. Consider using these points for your next redemption.`,
              potentialValue: 'Variable based on redemption choice'
            }
          ]
        });
      }
    } catch (error) {
      console.error("Error generating test recommendations:", error);
      res.status(500).json({ message: "Failed to generate test recommendations", error: (error as Error).message });
    }
  });
  
  // Create HTTP server
  const httpServer = createServer(app);
  return httpServer;
}
