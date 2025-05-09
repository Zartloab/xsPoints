import { pgTable, text, serial, pgEnum, timestamp, numeric, real, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Membership tiers enum
export const membershipTierEnum = pgEnum("membership_tier", ["STANDARD", "SILVER", "GOLD", "PLATINUM"]);

// Tier Benefits table - defines benefits for each membership tier
export const tierBenefits = pgTable("tier_benefits", {
  id: serial("id").primaryKey(),
  tier: membershipTierEnum("tier").notNull(),
  monthlyPointsThreshold: real("monthly_points_threshold").notNull(), // Points needed for this tier
  freeConversionLimit: real("free_conversion_limit").default(10000).notNull(), // Free conversion up to this amount
  conversionFeeRate: numeric("conversion_fee_rate").default("0.005").notNull(), // 0.5% for standard
  p2pMinimumFee: numeric("p2p_minimum_fee").default("0.005").notNull(), // Minimum fee rate for P2P trades
  p2pMaximumFee: numeric("p2p_maximum_fee").default("0.03").notNull(), // Maximum fee cap for P2P trades
  monthlyExpiryDays: serial("monthly_expiry_days").default(30).notNull(), // How many days tier lasts after qualifying
});

// Users table
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  email: text("email").notNull().unique(),
  firstName: text("first_name").notNull(),
  lastName: text("last_name").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  kycVerified: pgEnum("kyc_status", ["unverified", "pending", "verified"])("kyc_verified").default("unverified").notNull(),
  membershipTier: membershipTierEnum("membership_tier").default("STANDARD").notNull(),
  tierExpiresAt: timestamp("tier_expires_at"),
  pointsConverted: real("points_converted").default(0).notNull(), // Lifetime points converted
  monthlyPointsConverted: real("monthly_points_converted").default(0).notNull(), // Monthly points converted
  lastMonthReset: timestamp("last_month_reset"), // Last time monthly points were reset
  totalFeesPaid: real("total_fees_paid").default(0).notNull(), // Lifetime fees paid
});

// Programs enum for loyalty programs
export const loyaltyProgramEnum = pgEnum("loyalty_program", ["QANTAS", "GYG", "XPOINTS"]);

// Business table - for merchants/businesses that want to issue their own points
export const businesses = pgTable("businesses", {
  id: serial("id").primaryKey(),
  userId: serial("user_id").references(() => users.id), // The account owner/admin
  name: text("name").notNull(),
  description: text("description"),
  website: text("website"),
  logo: text("logo_url"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  verified: boolean("verified").default(false).notNull(),
  active: boolean("active").default(true).notNull(),
});

// Business Programs table - for custom loyalty programs created by businesses
export const businessPrograms = pgTable("business_programs", {
  id: serial("id").primaryKey(),
  businessId: serial("business_id").references(() => businesses.id),
  programName: text("program_name").notNull(),
  programCode: text("program_code").notNull().unique(), // Used in the program enum
  description: text("description"),
  conversionRate: numeric("conversion_rate").notNull(), // Rate to convert to/from xPoints
  pointsIssued: numeric("points_issued").default("0").notNull(), // Total points issued
  createdAt: timestamp("created_at").defaultNow().notNull(),
  active: boolean("active").default(true).notNull(),
});

// Wallets table
export const wallets = pgTable("wallets", {
  id: serial("id").primaryKey(),
  userId: serial("user_id").references(() => users.id),
  program: loyaltyProgramEnum("program").notNull(),
  balance: real("balance").default(0).notNull(),
  accountNumber: text("account_number"),
  accountName: text("account_name"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Exchange rates table
export const exchangeRates = pgTable("exchange_rates", {
  id: serial("id").primaryKey(),
  fromProgram: loyaltyProgramEnum("from_program").notNull(),
  toProgram: loyaltyProgramEnum("to_program").notNull(),
  rate: numeric("rate").notNull(),
  lastUpdated: timestamp("last_updated").defaultNow().notNull(),
});

// Transactions table
export const transactions = pgTable("transactions", {
  id: serial("id").primaryKey(),
  userId: serial("user_id").references(() => users.id),
  fromProgram: loyaltyProgramEnum("from_program").notNull(),
  toProgram: loyaltyProgramEnum("to_program").notNull(),
  amountFrom: real("amount_from").notNull(),
  amountTo: real("amount_to").notNull(),
  timestamp: timestamp("timestamp").defaultNow().notNull(),
  feeApplied: real("fee_applied").default(0).notNull(),
  status: text("status").default("completed").notNull(),
});

// Zod schemas
export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
  email: true,
  firstName: true,
  lastName: true,
});

export const insertWalletSchema = createInsertSchema(wallets).pick({
  userId: true,
  program: true,
  balance: true,
  accountNumber: true,
  accountName: true,
});

export const insertTransactionSchema = createInsertSchema(transactions).pick({
  userId: true,
  fromProgram: true,
  toProgram: true,
  amountFrom: true,
  amountTo: true,
  feeApplied: true,
  status: true,
});

export const convertPointsSchema = z.object({
  fromProgram: z.enum(["QANTAS", "GYG", "XPOINTS"]),
  toProgram: z.enum(["QANTAS", "GYG", "XPOINTS"]),
  amount: z.number().positive(),
});

export const linkAccountSchema = z.object({
  program: z.enum(["QANTAS", "GYG"]),
  accountNumber: z.string().min(1),
  accountName: z.string().min(1),
});

// Business Payment table - for tracking payments made by businesses to issue points
export const businessPayments = pgTable("business_payments", {
  id: serial("id").primaryKey(),
  businessId: serial("business_id").references(() => businesses.id),
  amount: numeric("amount").notNull(), // Payment amount in currency
  pointsIssued: numeric("points_issued").notNull(), // How many points issued
  paymentDate: timestamp("payment_date").defaultNow().notNull(),
  paymentMethod: text("payment_method").notNull(), // e.g., credit card, bank transfer
  transactionId: text("transaction_id"), // External payment transaction ID
  status: text("status").default("pending").notNull(), // pending, completed, failed
});

// Business Point Issuance table - for tracking point issuance to users
export const businessPointIssuance = pgTable("business_point_issuance", {
  id: serial("id").primaryKey(),
  businessProgramId: serial("business_program_id").references(() => businessPrograms.id),
  userId: serial("user_id").references(() => users.id),
  points: numeric("points").notNull(),
  issuanceDate: timestamp("issuance_date").defaultNow().notNull(),
  reason: text("reason"), // e.g., purchase, loyalty reward, signup bonus
  reference: text("reference"), // e.g., order ID, promotion code
  expirationDate: timestamp("expiration_date"), // When these points expire, if applicable
  status: text("status").default("active").notNull(), // active, used, expired
});

// Business Analytics table - for business dashboard statistics
export const businessAnalytics = pgTable("business_analytics", {
  id: serial("id").primaryKey(),
  businessId: serial("business_id").references(() => businesses.id),
  totalUsers: serial("total_users").default(0).notNull(), // Total users who have received points
  activeUsers: serial("active_users").default(0).notNull(), // Users who have received points in last 30 days
  totalPointsIssued: numeric("total_points_issued").default("0").notNull(), // Total points issued
  totalPointsRedeemed: numeric("total_points_redeemed").default("0").notNull(), // Points redeemed/used 
  averagePointsPerUser: numeric("average_points_per_user").default("0").notNull(), // Average points per user
  lastUpdated: timestamp("last_updated").defaultNow().notNull(), // Last time these stats were updated
});

// P2P Trade Offers - for user-to-user direct point trading
export const tradeOffers = pgTable("trade_offers", {
  id: serial("id").primaryKey(),
  createdBy: serial("created_by").references(() => users.id),
  fromProgram: loyaltyProgramEnum("from_program").notNull(),
  toProgram: loyaltyProgramEnum("to_program").notNull(),
  amountOffered: real("amount_offered").notNull(),
  amountRequested: real("amount_requested").notNull(),
  customRate: numeric("custom_rate").notNull(), // Calculated rate for this trade
  marketRate: numeric("market_rate").notNull(), // Current market rate when offer created
  savings: numeric("savings").notNull(), // % difference between market and custom rate
  createdAt: timestamp("created_at").defaultNow().notNull(),
  expiresAt: timestamp("expires_at").notNull(),
  status: text("status").default("open").notNull(), // open, completed, cancelled, expired
  description: text("description"), // Optional note from the creator
});

// P2P Trade Transactions - for completed trades between users
export const tradeTransactions = pgTable("trade_transactions", {
  id: serial("id").primaryKey(),
  tradeOfferId: serial("trade_offer_id").references(() => tradeOffers.id),
  sellerId: serial("seller_id").references(() => users.id),
  buyerId: serial("buyer_id").references(() => users.id),
  completedAt: timestamp("completed_at").defaultNow().notNull(),
  sellerWalletId: serial("seller_wallet_id").references(() => wallets.id),
  buyerWalletId: serial("buyer_wallet_id").references(() => wallets.id),
  amountSold: real("amount_sold").notNull(),
  amountBought: real("amount_bought").notNull(),
  rate: numeric("rate").notNull(),
  sellerFee: real("seller_fee").default(0).notNull(),
  buyerFee: real("buyer_fee").default(0).notNull(),
  status: text("status").default("completed").notNull(), // completed, disputed, refunded
});

// Create schemas for the new tables
export const insertBusinessSchema = createInsertSchema(businesses).pick({
  userId: true,
  name: true,
  description: true,
  website: true,
  logo: true,
});

export const insertBusinessProgramSchema = createInsertSchema(businessPrograms).pick({
  businessId: true,
  programName: true,
  programCode: true,
  description: true,
  conversionRate: true,
});

export const insertBusinessPaymentSchema = createInsertSchema(businessPayments).pick({
  businessId: true,
  amount: true,
  pointsIssued: true,
  paymentMethod: true,
  transactionId: true,
});

export const businessIssuePointsSchema = z.object({
  businessProgramId: z.number().positive(),
  userId: z.number().positive(),
  points: z.number().positive(),
  reason: z.string().optional(),
  reference: z.string().optional(),
  expirationDate: z.string().optional().transform(str => str ? new Date(str) : undefined),
});

// Schema for creating new trade offers
export const createTradeOfferSchema = z.object({
  fromProgram: z.enum(["QANTAS", "GYG", "XPOINTS"]),
  toProgram: z.enum(["QANTAS", "GYG", "XPOINTS"]),
  amountOffered: z.number().positive(),
  amountRequested: z.number().positive(),
  expiresIn: z.number().int().min(1).max(30).default(7), // Days until expiration (default 7 days)
  description: z.string().max(500).optional(),
});

// Schema for accepting trade offers
export const acceptTradeOfferSchema = z.object({
  tradeOfferId: z.number().positive(),
});

// Create schemas for tier benefits
export const insertTierBenefitsSchema = createInsertSchema(tierBenefits).pick({
  tier: true,
  monthlyPointsThreshold: true,
  freeConversionLimit: true,
  conversionFeeRate: true,
  p2pMinimumFee: true,
  p2pMaximumFee: true,
  monthlyExpiryDays: true,
});

// Create schema for business analytics
export const insertBusinessAnalyticsSchema = createInsertSchema(businessAnalytics).pick({
  businessId: true,
  totalUsers: true,
  activeUsers: true,
  totalPointsIssued: true,
  totalPointsRedeemed: true,
  averagePointsPerUser: true,
});

// Schema for bulk point issuance
export const bulkPointIssuanceSchema = z.object({
  businessProgramId: z.number().positive(),
  userIds: z.array(z.number().positive()),
  pointsPerUser: z.number().positive(),
  reason: z.string().optional(),
  reference: z.string().optional(),
  expirationDate: z.string().optional().transform(str => str ? new Date(str) : undefined),
});

export type LoyaltyProgram = "QANTAS" | "GYG" | "XPOINTS";
export type MembershipTier = "STANDARD" | "SILVER" | "GOLD" | "PLATINUM";
export type InsertUser = z.infer<typeof insertUserSchema>;
export type InsertBusiness = z.infer<typeof insertBusinessSchema>;
export type InsertBusinessProgram = z.infer<typeof insertBusinessProgramSchema>;
export type InsertBusinessPayment = z.infer<typeof insertBusinessPaymentSchema>;
export type InsertTierBenefits = z.infer<typeof insertTierBenefitsSchema>;
export type InsertBusinessAnalytics = z.infer<typeof insertBusinessAnalyticsSchema>;
export type BusinessIssuePointsData = z.infer<typeof businessIssuePointsSchema>;
export type BulkPointIssuanceData = z.infer<typeof bulkPointIssuanceSchema>;
export type CreateTradeOfferData = z.infer<typeof createTradeOfferSchema>;
export type AcceptTradeOfferData = z.infer<typeof acceptTradeOfferSchema>;
export type User = typeof users.$inferSelect;
export type Business = typeof businesses.$inferSelect;
export type BusinessProgram = typeof businessPrograms.$inferSelect;
export type BusinessPayment = typeof businessPayments.$inferSelect;
export type BusinessPointIssuance = typeof businessPointIssuance.$inferSelect;
export type BusinessAnalytics = typeof businessAnalytics.$inferSelect;
export type TierBenefit = typeof tierBenefits.$inferSelect;
export type TradeOffer = typeof tradeOffers.$inferSelect;
export type TradeTransaction = typeof tradeTransactions.$inferSelect;
export type Wallet = typeof wallets.$inferSelect;
export type Transaction = typeof transactions.$inferSelect;
export type ExchangeRate = typeof exchangeRates.$inferSelect;
export type ConvertPointsData = z.infer<typeof convertPointsSchema>;
export type LinkAccountData = z.infer<typeof linkAccountSchema>;
