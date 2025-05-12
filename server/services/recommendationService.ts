import { storage } from "../storage";
import { Transaction, User, Wallet } from "@shared/schema";
import { openaiService } from "./openaiService";

// Types for recommendation responses
export interface ProgramRecommendation {
  program: string;
  reason: string;
  potentialValue: string;
  conversionPath?: string;
}

export interface TransactionRecommendation {
  fromProgram: string;
  toProgram: string;
  amount: number;
  estimatedValue: string;
  reasoning: string;
}

export interface UserRecommendation {
  userId: number;
  timestamp: Date;
  recommendationType: 'program' | 'conversion' | 'general';
  title: string;
  description: string;
  programRecommendations?: ProgramRecommendation[];
  transactionRecommendations?: TransactionRecommendation[];
}

export class RecommendationService {
  /**
   * Generates personalized recommendations for a user
   */
  async generateRecommendations(userId: number): Promise<UserRecommendation> {
    try {
      // Get user data
      const user = await storage.getUser(userId);
      if (!user) {
        throw new Error('User not found');
      }

      // Get user's wallets and balances
      const wallets = await storage.getUserWallets(userId);
      
      // Get user's transaction history
      const transactions = await storage.getUserTransactions(userId);

      // Get current exchange rates between programs
      const exchangeRates: { fromProgram: string; toProgram: string; rate: string }[] = [];
      for (const wallet1 of wallets) {
        for (const wallet2 of wallets) {
          if (wallet1.program !== wallet2.program) {
            const rate = await storage.getExchangeRate(wallet1.program, wallet2.program);
            if (rate) {
              exchangeRates.push({
                fromProgram: wallet1.program,
                toProgram: wallet2.program,
                rate: rate.rate
              });
            }
          }
        }
      }

      // Generate recommendations using AI
      const recommendation = await this.analyzeUserData(user, wallets, transactions, exchangeRates);
      return recommendation;
    } catch (error) {
      console.error('Error generating recommendations:', error);
      return {
        userId,
        timestamp: new Date(),
        recommendationType: 'general',
        title: 'General Recommendation',
        description: 'Consider diversifying your loyalty program portfolio to maximize flexibility.'
      };
    }
  }

  /**
   * Analyzes user data with OpenAI to generate personalized recommendations
   */
  private async analyzeUserData(
    user: User, 
    wallets: Wallet[], 
    transactions: Transaction[],
    exchangeRates: { fromProgram: string; toProgram: string; rate: string }[]
  ): Promise<UserRecommendation> {
    try {
      // Check if OpenAI API is available
      const isOpenAIAvailable = await openaiService.checkAvailability();
      if (!isOpenAIAvailable) {
        console.log('OpenAI service unavailable, using rule-based recommendations');
        return this.generateRuleBasedRecommendations(user, wallets, transactions, exchangeRates);
      }
      
      // Prepare user data for AI analysis
      const userData = {
        userProfile: {
          membershipTier: user.membershipTier,
          pointsConverted: user.pointsConverted || 0,
          monthlyPointsConverted: user.monthlyPointsConverted || 0
        },
        wallets: wallets.map(wallet => ({
          program: wallet.program,
          balance: wallet.balance,
          hasLinkedAccount: !!wallet.accountNumber
        })),
        recentTransactions: transactions
          .slice(0, 10) // Last 10 transactions for analysis
          .map(tx => ({
            fromProgram: tx.fromProgram,
            toProgram: tx.toProgram,
            amountFrom: tx.amountFrom,
            amountTo: tx.amountTo,
            feeApplied: tx.feeApplied,
            date: tx.timestamp
          })),
        exchangeRates
      };

      // System prompt for AI
      const systemPrompt = `
        You are an expert loyalty points advisor for the xPoints Exchange platform. 
        Your task is to analyze a user's loyalty program data and provide personalized 
        recommendations to help them maximize the value of their points.
        
        The user has accounts with various loyalty programs, each with different balances 
        and conversion rates. Your job is to recommend optimal conversion strategies, 
        highlight programs they should focus on, and suggest specific transactions that 
        would be beneficial.
        
        Provide recommendations in JSON format following this structure:
        {
          "recommendationType": "program" or "conversion" or "general",
          "title": "Short recommendation title",
          "description": "Brief summary of your recommendation",
          "programRecommendations": [
            {
              "program": "Program name",
              "reason": "Why this program is recommended",
              "potentialValue": "Estimated value to user",
              "conversionPath": "Optional conversion path (e.g., QANTAS -> XPOINTS -> HILTON)"
            }
          ],
          "transactionRecommendations": [
            {
              "fromProgram": "Source program",
              "toProgram": "Destination program",
              "amount": Amount to convert (number),
              "estimatedValue": "Estimated value after conversion",
              "reasoning": "Why this transaction is recommended"
            }
          ]
        }
        
        Use your expertise to give them specific, actionable advice. If they have high 
        balances in certain programs, suggest using those points before they devalue. 
        If you notice they could get better value by converting through an intermediary 
        program, recommend that approach. Consider their membership tier when calculating 
        fees and recommend strategies that minimize fees.
      `;

      console.log('Making OpenAI request for recommendations...');
      
      // Make API call to OpenAI using centralized service
      const aiRecommendation = await openaiService.getCompletion(
        systemPrompt,
        userData,
        {
          responseFormat: 'json_object',
          temperature: 0.3
        }
      );
      
      console.log('Received OpenAI response');
      
      // Create user recommendation
      const userRecommendation: UserRecommendation = {
        userId: user.id,
        timestamp: new Date(),
        recommendationType: aiRecommendation.recommendationType || 'general',
        title: aiRecommendation.title || 'Points Optimization Recommendation',
        description: aiRecommendation.description || 'Here are some recommendations to optimize your loyalty points.',
        programRecommendations: aiRecommendation.programRecommendations || [],
        transactionRecommendations: aiRecommendation.transactionRecommendations || []
      };

      return userRecommendation;
    } catch (error) {
      console.error('Error analyzing user data with AI:', error);
      
      // Fallback to rule-based recommendations if AI analysis fails
      return this.generateRuleBasedRecommendations(user, wallets, transactions, exchangeRates);
    }
  }
  
  /**
   * Generates rule-based recommendations when OpenAI is not available
   */
  private generateRuleBasedRecommendations(
    user: User,
    wallets: Wallet[],
    transactions: Transaction[],
    exchangeRates: { fromProgram: string; toProgram: string; rate: string }[]
  ): UserRecommendation {
    console.log('Generating rule-based recommendations');
    
    // Sort wallets by balance (highest first)
    const sortedWallets = [...wallets].sort((a, b) => b.balance - a.balance);
    
    // Find the wallet with the highest balance
    const highestBalanceWallet = sortedWallets[0];
    
    // Find the wallet with the second highest balance
    const secondHighestBalanceWallet = sortedWallets[1];
    
    // Find the best exchange rate for the highest balance wallet
    let bestRate = 0;
    let bestDestination = '';
    
    for (const rate of exchangeRates) {
      if (rate.fromProgram === highestBalanceWallet.program) {
        const rateValue = parseFloat(rate.rate);
        if (rateValue > bestRate) {
          bestRate = rateValue;
          bestDestination = rate.toProgram;
        }
      }
    }
    
    // Create program recommendations
    const programRecommendations: ProgramRecommendation[] = [];
    
    // Recommend the highest balance program
    programRecommendations.push({
      program: highestBalanceWallet.program,
      reason: `You have ${highestBalanceWallet.balance.toLocaleString()} points in this program. Consider using these points for your next redemption or converting them to a program with a higher value.`,
      potentialValue: `~$${(highestBalanceWallet.balance * 0.01).toLocaleString()} AUD in typical redemption value`,
    });
    
    // If there's a good conversion opportunity, add a recommendation
    if (bestDestination && bestRate > 1) {
      programRecommendations.push({
        program: bestDestination,
        reason: `Converting your ${highestBalanceWallet.program} points to ${bestDestination} could give you a favorable exchange rate of ${bestRate}.`,
        potentialValue: `~${(highestBalanceWallet.balance * bestRate).toLocaleString()} points after conversion`,
        conversionPath: `${highestBalanceWallet.program} -> ${bestDestination}`
      });
    }
    
    // Create transaction recommendations
    const transactionRecommendations: TransactionRecommendation[] = [];
    
    // Recommend converting a portion of the highest balance program if there's a good rate
    if (bestDestination && bestRate > 1 && highestBalanceWallet.balance > 1000) {
      const recommendedAmount = Math.floor(highestBalanceWallet.balance * 0.3); // Recommend converting 30%
      
      transactionRecommendations.push({
        fromProgram: highestBalanceWallet.program,
        toProgram: bestDestination,
        amount: recommendedAmount,
        estimatedValue: `~${Math.floor(recommendedAmount * bestRate).toLocaleString()} ${bestDestination} points`,
        reasoning: `Converting ${recommendedAmount.toLocaleString()} points from ${highestBalanceWallet.program} to ${bestDestination} gives you a favorable rate and diversifies your portfolio.`
      });
    }
    
    // If the user has multiple programs, recommend consolidating smaller balances
    if (wallets.length > 2 && secondHighestBalanceWallet && secondHighestBalanceWallet.balance < 5000) {
      transactionRecommendations.push({
        fromProgram: secondHighestBalanceWallet.program,
        toProgram: 'XPOINTS',
        amount: secondHighestBalanceWallet.balance,
        estimatedValue: `~${Math.floor(secondHighestBalanceWallet.balance * 0.9).toLocaleString()} xPoints`,
        reasoning: `Consolidating your smaller balance of ${secondHighestBalanceWallet.balance.toLocaleString()} ${secondHighestBalanceWallet.program} points into xPoints gives you more flexibility for future exchanges.`
      });
    }
    
    return {
      userId: user.id,
      timestamp: new Date(),
      recommendationType: transactionRecommendations.length > 0 ? 'conversion' : 'program',
      title: 'Point Optimization Opportunities',
      description: 'Based on analysis of your current balances and available exchange rates, here are some recommendations to maximize the value of your loyalty points.',
      programRecommendations,
      transactionRecommendations
    };
  }

  /**
   * Gets stored recommendations for a user or generates new ones
   */
  async getUserRecommendations(userId: number): Promise<UserRecommendation> {
    // In the future, we could store and retrieve previous recommendations
    // For now, we'll generate new recommendations each time
    return this.generateRecommendations(userId);
  }
}

// Export singleton instance
export const recommendationService = new RecommendationService();