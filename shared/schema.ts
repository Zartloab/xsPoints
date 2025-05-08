import { pgTable, text, serial, pgEnum, timestamp, numeric, real, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

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

export type LoyaltyProgram = "QANTAS" | "GYG" | "XPOINTS";
export type InsertUser = z.infer<typeof insertUserSchema>;
export type InsertBusiness = z.infer<typeof insertBusinessSchema>;
export type InsertBusinessProgram = z.infer<typeof insertBusinessProgramSchema>;
export type InsertBusinessPayment = z.infer<typeof insertBusinessPaymentSchema>;
export type BusinessIssuePointsData = z.infer<typeof businessIssuePointsSchema>;
export type User = typeof users.$inferSelect;
export type Business = typeof businesses.$inferSelect;
export type BusinessProgram = typeof businessPrograms.$inferSelect;
export type BusinessPayment = typeof businessPayments.$inferSelect;
export type BusinessPointIssuance = typeof businessPointIssuance.$inferSelect;
export type Wallet = typeof wallets.$inferSelect;
export type Transaction = typeof transactions.$inferSelect;
export type ExchangeRate = typeof exchangeRates.$inferSelect;
export type ConvertPointsData = z.infer<typeof convertPointsSchema>;
export type LinkAccountData = z.infer<typeof linkAccountSchema>;
