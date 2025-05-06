import { pgTable, text, serial, pgEnum, timestamp, numeric, real } from "drizzle-orm/pg-core";
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

export type LoyaltyProgram = "QANTAS" | "GYG" | "XPOINTS";
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type Wallet = typeof wallets.$inferSelect;
export type Transaction = typeof transactions.$inferSelect;
export type ExchangeRate = typeof exchangeRates.$inferSelect;
export type ConvertPointsData = z.infer<typeof convertPointsSchema>;
export type LinkAccountData = z.infer<typeof linkAccountSchema>;
