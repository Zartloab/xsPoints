import { storage } from "../server/storage";
import { LoyaltyProgram } from "../shared/schema";
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

/**
 * This script creates a test user with properly hashed password
 */
async function createTestUser() {
  try {
    console.log("Creating test user...");
    
    // Create a test user with a specific username
    const testUsername = "tester2";
    
    // Check if the user already exists
    let user = await storage.getUserByUsername(testUsername);
    if (user) {
      console.log(`Test user '${testUsername}' already exists with ID ${user.id}`);
      return user;
    }
    
    // Hash the password the same way auth.ts does it
    const password = "password";
    const hashedPassword = await hashPassword(password);
    
    // Create the user with the hashed password
    user = await storage.createUser({
      username: testUsername,
      password: hashedPassword,
      email: `${testUsername}@example.com`,
      firstName: "Test",
      lastName: "User",
      kycVerified: "verified",
      membershipTier: "GOLD",
    });
    
    console.log(`Created test user '${testUsername}' with ID ${user.id}`);
    console.log(`You can log in with username: ${testUsername}, password: ${password}`);
    
    // Create wallets for the test user
    console.log("Setting up wallets for test user...");
    
    const walletPrograms: { program: LoyaltyProgram; balance: number; accountNumber?: string; accountName?: string }[] = [
      { program: "QANTAS", balance: 25000, accountNumber: "QF123456", accountName: "Frequent Flyer" },
      { program: "XPOINTS", balance: 50000, accountNumber: "XP987654", accountName: "xPoints Account" },
      { program: "GYG", balance: 15000, accountNumber: "GYG456789", accountName: "Get Your Guide" },
      { program: "VELOCITY", balance: 30000, accountNumber: "VA789012", accountName: "Velocity Rewards" },
      { program: "AMEX", balance: 40000, accountNumber: "AMEX345678", accountName: "Membership Rewards" },
    ];
    
    for (const walletData of walletPrograms) {
      const wallet = await storage.createWallet({
        userId: user.id,
        program: walletData.program,
        balance: walletData.balance,
        accountNumber: walletData.accountNumber || null,
        accountName: walletData.accountName || null,
      });
      console.log(`Created ${walletData.program} wallet with ID ${wallet.id}`);
    }
    
    // Create sample transactions for the test user
    console.log("Setting up sample transactions...");
    
    const transactions = [
      { fromProgram: "QANTAS", toProgram: "XPOINTS", amountFrom: 5000, amountTo: 7500, fee: 0 },
      { fromProgram: "XPOINTS", toProgram: "GYG", amountFrom: 10000, amountTo: 8000, fee: 0 },
      { fromProgram: "VELOCITY", toProgram: "XPOINTS", amountFrom: 8000, amountTo: 12000, fee: 0 },
      { fromProgram: "AMEX", toProgram: "QANTAS", amountFrom: 15000, amountTo: 12500, fee: 0 },
      { fromProgram: "XPOINTS", toProgram: "VELOCITY", amountFrom: 20000, amountTo: 16000, fee: 0 },
    ];
    
    for (const txData of transactions) {
      await storage.createTransaction({
        userId: user.id,
        fromProgram: txData.fromProgram as LoyaltyProgram,
        toProgram: txData.toProgram as LoyaltyProgram,
        amountFrom: txData.amountFrom,
        amountTo: txData.amountTo,
        feeApplied: txData.fee,
        status: "completed"
      });
    }
    console.log(`Created ${transactions.length} sample transactions`);
    
    return user;
  } catch (error) {
    console.error("Error creating test user:", error);
    throw error;
  }
}

// Execute the function
createTestUser().then(() => {
  console.log("Test user setup complete!");
  process.exit(0);
}).catch(err => {
  console.error("Failed to create test user:", err);
  process.exit(1);
});