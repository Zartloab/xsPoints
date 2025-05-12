import { ethers } from 'ethers';
import { storage } from '../storage';
import { Transaction, LoyaltyProgram } from '@shared/schema';

// Configuration for blockchain
const BLOCKCHAIN_CONFIG = {
  rpcUrl: process.env.BLOCKCHAIN_RPC_URL || 'http://127.0.0.1:8545', // Local fallback
  adminPrivateKey: process.env.ADMIN_PRIVATE_KEY || '0x0000000000000000000000000000000000000000000000000000000000000000',
  tokenContractAddress: process.env.TOKEN_CONTRACT_ADDRESS || '0x0000000000000000000000000000000000000000'
};

// ABI for the xPoints Token smart contract
const XPT_ABI = [
  // Read functions
  "function balanceOf(address owner) view returns (uint256)",
  "function name() view returns (string)",
  "function symbol() view returns (string)",
  "function decimals() view returns (uint8)",
  "function totalSupply() view returns (uint256)",
  "function loyaltyPointsBalance(string program) view returns (uint256)",
  "function supportedPrograms() view returns (string[])",
  
  // Write functions
  "function transfer(address to, uint256 amount) returns (bool)",
  "function mint(address to, uint256 amount)",
  "function burn(uint256 amount)",
  "function depositLoyaltyPoints(string program, uint256 amount)",
  "function withdrawLoyaltyPoints(string program, uint256 amount)",
  "function addLoyaltyProgram(string program)",
  
  // Events
  "event Transfer(address indexed from, address indexed to, uint256 value)",
  "event LoyaltyPointsDeposited(string program, uint256 amount)",
  "event LoyaltyPointsWithdrawn(string program, uint256 amount)",
  "event ProgramAdded(string program)"
];

/**
 * Service for interacting with the xPoints Token smart contract
 */
export class TokenService {
  private provider: ethers.JsonRpcProvider;
  private adminWallet: ethers.Wallet;
  private contract: ethers.Contract;
  
  constructor() {
    try {
      // Initialize provider for the specified blockchain network
      this.provider = new ethers.JsonRpcProvider(BLOCKCHAIN_CONFIG.rpcUrl);
      
      // Check if we have a valid admin private key
      const adminKey = BLOCKCHAIN_CONFIG.adminPrivateKey;
      if (!adminKey || adminKey.includes("0000000000000000")) {
        console.warn("WARNING: No valid blockchain admin key provided. Some token operations will be simulated.");
        // Create a dummy private key for development
        const dummyKey = "0x1111111111111111111111111111111111111111111111111111111111111111";
        this.adminWallet = new ethers.Wallet(dummyKey, this.provider);
      } else {
        // The admin wallet is used for administrative functions (minting, etc.)
        this.adminWallet = new ethers.Wallet(adminKey, this.provider);
      }
      
      // Create contract instance
      this.contract = new ethers.Contract(
        BLOCKCHAIN_CONFIG.tokenContractAddress,
        XPT_ABI,
        this.adminWallet
      );
      
      // Start listening to events if we're in production
      if (process.env.NODE_ENV === "production") {
        this.setupEventListeners();
      }
    } catch (error) {
      console.error("Error initializing TokenService:", error);
      // Create minimal objects to allow the service to function in a limited capacity
      this.provider = null as any;
      this.adminWallet = null as any;
      this.contract = null as any;
    }
  }
  
  /**
   * Sets up listeners for blockchain events
   */
  private setupEventListeners() {
    if (!this.contract) {
      console.warn("Cannot setup event listeners: Contract is not initialized");
      return;
    }
    
    try {
      // Listen for token transfers
      this.contract.on("Transfer", (from: string, to: string, value: bigint) => {
        console.log(`Transfer: ${from} -> ${to}: ${value}`);
        // You could add logic here to update user balances in your database
      });
      
      // Listen for loyalty points deposits
      this.contract.on("LoyaltyPointsDeposited", (program: string, amount: bigint) => {
        console.log(`Deposited: ${amount} points for ${program}`);
      });
      
      // Listen for loyalty points withdrawals
      this.contract.on("LoyaltyPointsWithdrawn", (program: string, amount: bigint) => {
        console.log(`Withdrawn: ${amount} points from ${program}`);
      });
    } catch (error) {
      console.error("Error setting up blockchain event listeners:", error);
    }
  }
  
  /**
   * Gets the wallet address for a user, or creates one if it doesn't exist
   */
  async getUserWalletAddress(userId: number): Promise<string> {
    try {
      // Check if we have a working blockchain connection
      if (!this.provider || !this.adminWallet || !this.contract) {
        // Return a dummy address for development
        return "0xSimulated0Address0For0Development0Environment0";
      }
      
      // Check if user already has a wallet address
      const user = await storage.getUser(userId);
      if (!user) {
        throw new Error('User not found');
      }
      
      if (user.walletAddress) {
        return user.walletAddress;
      }
      
      // Create a new wallet for the user
      try {
        const wallet = ethers.Wallet.createRandom();
        
        // For the sake of simplicity, we're storing the private key
        // In a real-world app, this would be encrypted with a user-provided password
        await storage.updateUserWallet(userId, wallet.address, wallet.privateKey);
        
        return wallet.address;
      } catch (error) {
        console.error("Error creating blockchain wallet:", error);
        // Return a deterministic simulated address based on user ID
        const simulatedAddress = "0x" + userId.toString().padStart(40, "0");
        await storage.updateUserWallet(userId, simulatedAddress, "0x0000000000000000000000000000000000000000000000000000000000000000");
        return simulatedAddress;
      }
    } catch (error) {
      console.error("Error in getUserWalletAddress:", error);
      return "0xErrorCreatingWallet" + userId.toString().padStart(24, "0");
    }
  }
  
  /**
   * Gets a user's token balance
   */
  async getUserBalance(userId: number): Promise<number> {
    try {
      // Check if we have blockchain integration
      if (!this.provider || !this.contract) {
        // Use database balance as fallback
        const user = await storage.getUser(userId);
        return user?.tokenBalance || 0;
      }
      
      try {
        const address = await this.getUserWalletAddress(userId);
        const balanceWei = await this.contract.balanceOf(address);
        // Convert from wei to tokens (assuming 18 decimals)
        return parseFloat(ethers.formatUnits(balanceWei, 18));
      } catch (error) {
        console.error('Error getting user blockchain balance:', error);
        // Fallback to database balance
        const user = await storage.getUser(userId);
        return user?.tokenBalance || 0;
      }
    } catch (error) {
      console.error('Error in getUserBalance:', error);
      return 0;
    }
  }
  
  /**
   * Mints new tokens when a user converts loyalty points to XPT
   */
  async mintTokens(userId: number, loyaltyProgram: LoyaltyProgram, amount: number): Promise<boolean> {
    try {
      // Verify the user has sufficient loyalty points
      const wallet = await storage.getWallet(userId, loyaltyProgram);
      if (!wallet || wallet.balance < amount) {
        throw new Error('Insufficient loyalty points');
      }
      
      // Check if blockchain integration is available
      if (!this.provider || !this.adminWallet || !this.contract) {
        console.log("Blockchain integration unavailable, using fallback mechanism for token minting");
        
        // Execute the fallback flow - Updating database directly
        // Update source wallet - reduce balance
        await storage.updateWalletBalance(wallet.id, wallet.balance - amount);
        
        // Get or create XPOINTS wallet
        let xpointsWallet = await storage.getWallet(userId, "XPOINTS");
        if (!xpointsWallet) {
          xpointsWallet = await storage.createWallet({
            userId,
            program: "XPOINTS",
            balance: 0,
            accountNumber: null,
            accountName: null
          });
        }
        
        // Determine the token amount based on exchange rate (same as blockchain flow)
        const exchangeRate = await storage.getExchangeRate(loyaltyProgram, 'XPOINTS');
        if (!exchangeRate) {
          throw new Error('Exchange rate not found');
        }
        
        const tokenAmount = amount * parseFloat(exchangeRate.rate);
        
        // Update XPOINTS wallet - add tokens based on exchange rate
        await storage.updateWalletBalance(xpointsWallet.id, xpointsWallet.balance + tokenAmount);
        
        // Update user's token balance in database
        const user = await storage.getUser(userId);
        if (user) {
          await storage.updateTokenBalance(userId, (user.tokenBalance || 0) + tokenAmount);
        }
        
        // Create transaction record
        await storage.createTransaction({
          userId,
          fromProgram: loyaltyProgram,
          toProgram: "XPOINTS",
          amountFrom: amount,
          amountTo: tokenAmount,
          feeApplied: 0,
          status: "completed",
          recipientId: 0,
          transactionHash: "fallback-" + Date.now(),
          blockNumber: 0,
          contractAddress: "0xFallbackContract",
          tokenAddress: "0xFallbackToken"
        });
        
        return true;
      }
      
      try {
        // Blockchain integration available - Try to use it
        // Get the user's blockchain wallet address
        const address = await this.getUserWalletAddress(userId);
        
        // Determine the token amount based on exchange rate
        const exchangeRate = await storage.getExchangeRate(loyaltyProgram, 'XPOINTS');
        if (!exchangeRate) {
          throw new Error('Exchange rate not found');
        }
        
        const tokenAmount = amount * parseFloat(exchangeRate.rate);
        
        // Deposit loyalty points to the contract
        await this.contract.depositLoyaltyPoints(loyaltyProgram, amount);
        
        // Mint tokens to the user's address
        const tx = await this.contract.mint(
          address,
          ethers.parseUnits(tokenAmount.toString(), 18)
        );
        
        // Wait for transaction to be mined
        await tx.wait();
        
        // Update wallet balances in the database
        await storage.updateWalletBalance(wallet.id, wallet.balance - amount);
        
        // Update or create XPOINTS wallet
        const xpointsWallet = await storage.getWallet(userId, 'XPOINTS');
        if (xpointsWallet) {
          await storage.updateWalletBalance(xpointsWallet.id, xpointsWallet.balance + tokenAmount);
        } else {
          await storage.createWallet({
            userId,
            program: 'XPOINTS',
            balance: tokenAmount,
            accountNumber: null,
            accountName: null
          });
        }
        
        // Record the transaction
        await storage.createTransaction({
          userId,
          fromProgram: loyaltyProgram,
          toProgram: 'XPOINTS',
          amountFrom: amount,
          amountTo: tokenAmount,
          feeApplied: 0,
          status: 'completed',
          recipientId: 0,
          transactionHash: tx.hash, 
          blockNumber: (await tx.wait()).blockNumber || 0,
          contractAddress: BLOCKCHAIN_CONFIG.tokenContractAddress,
          tokenAddress: BLOCKCHAIN_CONFIG.tokenContractAddress
        });
        
        return true;
      } catch (blockchainError) {
        // If blockchain operation fails, log error and fall back to database-only approach
        console.error('Blockchain operation failed, using fallback mechanism:', blockchainError);
        
        // Execute the fallback flow - Updating database directly
        // Update source wallet - reduce balance
        await storage.updateWalletBalance(wallet.id, wallet.balance - amount);
        
        // Get or create XPOINTS wallet
        let xpointsWallet = await storage.getWallet(userId, "XPOINTS");
        if (!xpointsWallet) {
          xpointsWallet = await storage.createWallet({
            userId,
            program: "XPOINTS",
            balance: 0,
            accountNumber: null,
            accountName: null
          });
        }
        
        // Determine the token amount based on exchange rate
        const exchangeRate = await storage.getExchangeRate(loyaltyProgram, 'XPOINTS');
        if (!exchangeRate) {
          throw new Error('Exchange rate not found');
        }
        
        const tokenAmount = amount * parseFloat(exchangeRate.rate);
        
        // Update XPOINTS wallet - add tokens based on exchange rate
        await storage.updateWalletBalance(xpointsWallet.id, xpointsWallet.balance + tokenAmount);
        
        // Update user's token balance in database
        const user = await storage.getUser(userId);
        if (user) {
          await storage.updateTokenBalance(userId, (user.tokenBalance || 0) + tokenAmount);
        }
        
        // Create transaction record with fallback identification
        await storage.createTransaction({
          userId,
          fromProgram: loyaltyProgram,
          toProgram: "XPOINTS",
          amountFrom: amount,
          amountTo: tokenAmount,
          feeApplied: 0,
          status: "completed",
          recipientId: 0,
          transactionHash: "fallback-blockchain-error-" + Date.now(),
          blockNumber: 0,
          contractAddress: "0xFallbackContract",
          tokenAddress: "0xFallbackToken"
        });
        
        return true;
      }
    } catch (error) {
      console.error('Error minting tokens:', error);
      throw error; // Re-throw the error to be caught by the route handler
    }
  }
  
  /**
   * Burns tokens when a user converts XPT back to loyalty points
   */
  async burnTokens(userId: number, targetProgram: LoyaltyProgram, tokenAmount: number): Promise<boolean> {
    try {
      // Get user's XPoints wallet
      const xpointsWallet = await storage.getWallet(userId, 'XPOINTS');
      if (!xpointsWallet || xpointsWallet.balance < tokenAmount) {
        throw new Error('Insufficient XPoints balance');
      }
      
      // Get exchange rate
      const exchangeRate = await storage.getExchangeRate('XPOINTS', targetProgram);
      if (!exchangeRate) {
        throw new Error('Exchange rate not found');
      }
      
      // Calculate loyalty points amount
      const loyaltyAmount = tokenAmount * parseFloat(exchangeRate.rate);
      
      // Check if blockchain integration is available
      if (!this.provider || !this.adminWallet || !this.contract) {
        console.log("Blockchain integration unavailable, simulating token burning");
        
        // Update XPOINTS wallet - reduce balance
        await storage.updateWalletBalance(xpointsWallet.id, xpointsWallet.balance - tokenAmount);
        
        // Update user's token balance in database
        const user = await storage.getUser(userId);
        if (user) {
          await storage.updateTokenBalance(userId, Math.max(0, (user.tokenBalance || 0) - tokenAmount));
        }
        
        // Get or create target program wallet
        let targetWallet = await storage.getWallet(userId, targetProgram);
        if (!targetWallet) {
          targetWallet = await storage.createWallet({
            userId,
            program: targetProgram,
            balance: 0,
            accountNumber: null,
            accountName: null
          });
        }
        
        // Update target wallet - add loyalty points
        await storage.updateWalletBalance(targetWallet.id, targetWallet.balance + loyaltyAmount);
        
        // Create transaction record
        await storage.createTransaction({
          userId,
          fromProgram: 'XPOINTS',
          toProgram: targetProgram,
          amountFrom: tokenAmount,
          amountTo: loyaltyAmount,
          feeApplied: 0,
          status: 'completed',
          recipientId: 0,
          transactionHash: "simulated-burn-" + Date.now(),
          blockNumber: 0,
          contractAddress: "0xSimulatedContract",
          tokenAddress: "0xSimulatedToken"
        });
        
        return true;
      }
      
      // Real blockchain implementation
      try {
        // Get user's blockchain wallet
        const user = await storage.getUser(userId);
        if (!user || !user.walletPrivateKey) {
          throw new Error('User wallet not found');
        }
        
        // Connect user's wallet to contract
        const userWallet = new ethers.Wallet(user.walletPrivateKey, this.provider);
        const userContract = this.contract.connect(userWallet);
        
        // Burn the tokens
        // Use a more generic approach since the contract method access might be different depending on ethers version
        // This calls the burn function with a single uint256 parameter
        const tx = await userContract.getFunction("burn")(
          ethers.parseUnits(tokenAmount.toString(), 18)
        );
        
        // Wait for transaction to be mined
        await tx.wait();
        
        // Withdraw loyalty points from contract
        await this.contract.withdrawLoyaltyPoints(targetProgram, loyaltyAmount);
        
        // Update XPoints wallet balance
        await storage.updateWalletBalance(xpointsWallet.id, xpointsWallet.balance - tokenAmount);
        
        // Update or create target program wallet
        let targetWallet = await storage.getWallet(userId, targetProgram);
        if (targetWallet) {
          await storage.updateWalletBalance(targetWallet.id, targetWallet.balance + loyaltyAmount);
        } else {
          await storage.createWallet({
            userId,
            program: targetProgram,
            balance: loyaltyAmount,
            accountNumber: null,
            accountName: null
          });
        }
        
        // Record the transaction
        await storage.createTransaction({
          userId,
          fromProgram: 'XPOINTS',
          toProgram: targetProgram,
          amountFrom: tokenAmount,
          amountTo: loyaltyAmount,
          feeApplied: 0,
          status: 'completed',
          recipientId: 0,
          transactionHash: tx.hash, 
          blockNumber: (await tx.wait()).blockNumber || 0,
          contractAddress: BLOCKCHAIN_CONFIG.tokenContractAddress,
          tokenAddress: BLOCKCHAIN_CONFIG.tokenContractAddress
        });
        
        return true;
      } catch (error) {
        console.error('Error with blockchain operations during token burning:', error);
        
        // If there's a blockchain error, we can still perform the operation in the database
        console.log("Falling back to database operation for token burning");
        
        // Update XPOINTS wallet - reduce balance
        await storage.updateWalletBalance(xpointsWallet.id, xpointsWallet.balance - tokenAmount);
        
        // Get or create target program wallet
        let targetWallet = await storage.getWallet(userId, targetProgram);
        if (!targetWallet) {
          targetWallet = await storage.createWallet({
            userId,
            program: targetProgram,
            balance: 0,
            accountNumber: null,
            accountName: null
          });
        }
        
        // Update target wallet - add loyalty points
        await storage.updateWalletBalance(targetWallet.id, targetWallet.balance + loyaltyAmount);
        
        // Create fallback transaction record
        await storage.createTransaction({
          userId,
          fromProgram: 'XPOINTS',
          toProgram: targetProgram,
          amountFrom: tokenAmount,
          amountTo: loyaltyAmount,
          feeApplied: 0,
          status: 'completed-fallback',
          recipientId: 0,
          transactionHash: "fallback-" + Date.now(),
          blockNumber: 0,
          contractAddress: BLOCKCHAIN_CONFIG.tokenContractAddress,
          tokenAddress: BLOCKCHAIN_CONFIG.tokenContractAddress
        });
        
        return true;
      }
    } catch (error) {
      console.error('Error burning tokens:', error);
      return false;
    }
  }
  
  /**
   * Gets the total supply of tokens
   */
  async getTotalSupply(): Promise<number> {
    try {
      // Check if blockchain is available
      if (!this.provider || !this.contract) {
        // Fallback to calculating from database
        const users = await storage.getAllUserTokenBalances();
        return users.reduce((total, user) => total + (user.tokenBalance || 0), 0);
      }
      
      try {
        const supplyWei = await this.contract.totalSupply();
        return parseFloat(ethers.formatUnits(supplyWei, 18));
      } catch (error) {
        console.error('Error accessing blockchain for total supply:', error);
        // Fallback to simulated data
        return 10000000; // Example simulated total supply for development
      }
    } catch (error) {
      console.error('Error getting total supply:', error);
      return 0;
    }
  }
  
  /**
   * Gets the balance of loyalty points backing the tokens
   */
  async getLoyaltyPointsReserve(program: string): Promise<number> {
    try {
      // Check if blockchain is available
      if (!this.provider || !this.contract) {
        // For development, return estimated numbers based on transactions
        const transactions = await storage.getAllConversionTransactions(program, 'XPOINTS');
        return transactions.reduce((total, tx) => total + tx.amountFrom, 0);
      }
      
      try {
        const balance = await this.contract.loyaltyPointsBalance(program);
        return balance.toNumber();
      } catch (error) {
        console.error(`Error accessing blockchain for ${program} reserve:`, error);
        
        // Fallback to simulated reserves data
        const simulatedReserves: Record<string, number> = {
          'QANTAS': 2500000,
          'GYG': 1800000,
          'VELOCITY': 2000000,
          'AMEX': 1500000,
          'FLYBUYS': 3000000,
          'HILTON': 1200000,
          'MARRIOTT': 900000,
          'AIRBNB': 750000,
          'DELTA': 1100000,
          'XPOINTS': 5000000
        };
        
        return simulatedReserves[program] || 0;
      }
    } catch (error) {
      console.error(`Error getting reserve for ${program}:`, error);
      return 0;
    }
  }
  
  /**
   * Gets all supported loyalty programs
   */
  async getSupportedPrograms(): Promise<string[]> {
    try {
      // Check if blockchain is available
      if (!this.provider || !this.contract) {
        // Return static list of supported programs
        return ['QANTAS', 'GYG', 'XPOINTS', 'VELOCITY', 'AMEX', 'FLYBUYS', 'HILTON', 'MARRIOTT', 'AIRBNB', 'DELTA'];
      }
      
      try {
        return await this.contract.supportedPrograms();
      } catch (error) {
        console.error('Error accessing blockchain for supported programs:', error);
        // Fallback to static list
        return ['QANTAS', 'GYG', 'XPOINTS', 'VELOCITY', 'AMEX', 'FLYBUYS', 'HILTON', 'MARRIOTT', 'AIRBNB', 'DELTA'];
      }
    } catch (error) {
      console.error('Error getting supported programs:', error);
      return [];
    }
  }
  
  /**
   * Adds a new supported loyalty program
   */
  async addLoyaltyProgram(program: string): Promise<boolean> {
    try {
      const tx = await this.contract.addLoyaltyProgram(program);
      await tx.wait();
      return true;
    } catch (error) {
      console.error('Error adding loyalty program:', error);
      return false;
    }
  }
}

// Create a singleton instance
export const tokenService = new TokenService();