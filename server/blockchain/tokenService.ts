import { ethers } from 'ethers';
import { storage } from '../storage';
import { Transaction, LoyaltyProgram } from '@shared/schema';

// Configuration for blockchain
const BLOCKCHAIN_CONFIG = {
  rpcUrl: process.env.BLOCKCHAIN_RPC_URL || 'https://polygon-mumbai.infura.io/v3/your-infura-key',
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
    // Initialize provider and wallet for the specified blockchain network
    this.provider = new ethers.JsonRpcProvider(BLOCKCHAIN_CONFIG.rpcUrl);
    
    // The admin wallet is used for administrative functions (minting, etc.)
    this.adminWallet = new ethers.Wallet(BLOCKCHAIN_CONFIG.adminPrivateKey, this.provider);
    
    // Create contract instance
    this.contract = new ethers.Contract(
      BLOCKCHAIN_CONFIG.tokenContractAddress,
      XPT_ABI,
      this.adminWallet
    );
    
    // Start listening to events
    this.setupEventListeners();
  }
  
  /**
   * Sets up listeners for blockchain events
   */
  private setupEventListeners() {
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
  }
  
  /**
   * Gets the wallet address for a user, or creates one if it doesn't exist
   */
  async getUserWalletAddress(userId: number): Promise<string> {
    // Check if user already has a wallet address
    const user = await storage.getUser(userId);
    if (!user) {
      throw new Error('User not found');
    }
    
    if (user.walletAddress) {
      return user.walletAddress;
    }
    
    // Create a new wallet for the user
    const wallet = ethers.Wallet.createRandom();
    
    // For the sake of simplicity, we're storing the private key
    // In a real-world app, this would be encrypted with a user-provided password
    await storage.updateUserWallet(userId, wallet.address, wallet.privateKey);
    
    return wallet.address;
  }
  
  /**
   * Gets a user's token balance
   */
  async getUserBalance(userId: number): Promise<number> {
    try {
      const address = await this.getUserWalletAddress(userId);
      const balanceWei = await this.contract.balanceOf(address);
      // Convert from wei to tokens (assuming 18 decimals)
      return parseFloat(ethers.formatUnits(balanceWei, 18));
    } catch (error) {
      console.error('Error getting user balance:', error);
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
        recipientId: null,
        transactionHash: tx.hash, 
        blockNumber: (await tx.wait()).blockNumber || 0,
        contractAddress: BLOCKCHAIN_CONFIG.tokenContractAddress,
        tokenAddress: BLOCKCHAIN_CONFIG.tokenContractAddress
      });
      
      return true;
    } catch (error) {
      console.error('Error minting tokens:', error);
      return false;
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
      
      // Get user's blockchain wallet
      const user = await storage.getUser(userId);
      if (!user || !user.walletPrivateKey) {
        throw new Error('User wallet not found');
      }
      
      // Connect user's wallet to contract
      const userWallet = new ethers.Wallet(user.walletPrivateKey, this.provider);
      const userContract = this.contract.connect(userWallet);
      
      // Burn the tokens
      const tx = await userContract.burn(
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
        recipientId: null,
        transactionHash: tx.hash, 
        blockNumber: (await tx.wait()).blockNumber || 0,
        contractAddress: BLOCKCHAIN_CONFIG.tokenContractAddress,
        tokenAddress: BLOCKCHAIN_CONFIG.tokenContractAddress
      });
      
      return true;
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
      const supplyWei = await this.contract.totalSupply();
      return parseFloat(ethers.formatUnits(supplyWei, 18));
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
      const balance = await this.contract.loyaltyPointsBalance(program);
      return balance.toNumber();
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
      return await this.contract.supportedPrograms();
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