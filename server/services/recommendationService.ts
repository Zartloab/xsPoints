import OpenAI from "openai";
import { storage } from "../storage";
import { Transaction, User, Wallet } from "@shared/schema";

// Initialize OpenAI client
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

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

      // Make API call to OpenAI
      const response = await openai.chat.completions.create({
        model: "gpt-4o", // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: JSON.stringify(userData) }
        ],
        response_format: { type: "json_object" },
        temperature: 0.3 // Lower temperature for more focused recommendations
      });

      const content = response.choices[0].message.content;
      if (!content) {
        throw new Error('No response from AI');
      }

      // Parse the AI response
      const aiRecommendation = JSON.parse(content);
      
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
      
      // Fallback recommendation if AI analysis fails
      return {
        userId: user.id,
        timestamp: new Date(),
        recommendationType: 'general',
        title: 'Point Optimization Opportunities',
        description: 'Based on your current balances, here are some general recommendations to maximize your loyalty points value.',
        programRecommendations: [
          {
            program: wallets[0]?.program || 'XPOINTS',
            reason: 'This is your highest balance program, consider using these points for your next redemption.',
            potentialValue: 'Variable based on redemption choice'
          }
        ]
      };
    }
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