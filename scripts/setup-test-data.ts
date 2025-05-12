import { storage } from "../server/storage";
import { LoyaltyProgram } from "../shared/schema";

/**
 * This script sets up test data for the recommendation engine
 */
async function setupTestData() {
  try {
    console.log("Setting up test data for recommendation engine...");
    
    // Create a test user if it doesn't exist
    let user = await storage.getUserByUsername("tester");
    if (!user) {
      console.log("Creating test user 'tester'...");
      user = await storage.createUser({
        username: "tester",
        password: "password",  // This will be hashed by the storage layer
        email: "tester@example.com",
        firstName: "Test",
        lastName: "User",
        kycVerified: "verified",
        membershipTier: "GOLD",
      });
      console.log(`Created test user with ID ${user.id}`);
    }
    
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
      // Check if wallet already exists
      const existingWallet = await storage.getWallet(user.id, walletData.program);
      
      if (!existingWallet) {
        const wallet = await storage.createWallet({
          userId: user.id,
          program: walletData.program,
          balance: walletData.balance,
          accountNumber: walletData.accountNumber || null,
          accountName: walletData.accountName || null,
        });
        console.log(`Created ${walletData.program} wallet with ID ${wallet.id}`);
      } else {
        console.log(`${walletData.program} wallet already exists`);
      }
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
    
    const existingTransactions = await storage.getUserTransactions(user.id);
    
    if (existingTransactions.length < transactions.length) {
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
    } else {
      console.log("Transactions already exist");
    }
    
    console.log("Test data setup complete!");
    console.log("You can log in with username: tester, password: password");
    
  } catch (error) {
    console.error("Error setting up test data:", error);
  }
}

// Execute the function
setupTestData().then(() => process.exit(0)).catch(err => {
  console.error("Failed to set up test data:", err);
  process.exit(1);
});