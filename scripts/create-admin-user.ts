/**
 * This script creates an admin user if it doesn't already exist
 */

import { db } from "../server/db";
import { users } from "../shared/schema";
import { eq } from "drizzle-orm";
import { scrypt, randomBytes } from "crypto";
import { promisify } from "util";

const scryptAsync = promisify(scrypt);

/**
 * Helper function to hash a password in the same way the auth system does
 */
async function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const buf = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${buf.toString("hex")}.${salt}`;
}

async function createAdminUser() {
  console.log("Checking for admin user...");
  
  // Check if admin user already exists
  const adminUser = await db.select().from(users).where(eq(users.username, "admin")).execute();
  
  if (adminUser.length > 0) {
    console.log("Admin user already exists.");
    return;
  }
  
  // Create admin user
  console.log("Creating admin user...");
  
  const password = process.env.ADMIN_PASSWORD || "admin123";
  const hashedPassword = await hashPassword(password);
  
  await db.insert(users).values({
    username: "admin",
    password: hashedPassword,
    email: "admin@xpoints-exchange.com",
    firstName: "Admin",
    lastName: "User",
    createdAt: new Date(),
    kycVerified: "verified",
    membershipTier: "PLATINUM",
    pointsConverted: 0,
    monthlyPointsConverted: 0,
    totalFeesPaid: 0,
    walletAddress: null,
    walletPrivateKey: null,
    tokenBalance: 0,
    tokenLedgerSynced: null,
    notifications: [],
  }).execute();
  
  console.log("Admin user created successfully!");
  console.log(`Username: admin`);
  console.log(`Password: ${password}`);
  console.log("Note: You can change the admin password by setting the ADMIN_PASSWORD environment variable.");
}

createAdminUser()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("Error creating admin user:", error);
    process.exit(1);
  });