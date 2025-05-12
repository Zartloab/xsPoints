import { storage } from "../storage";
import { openaiService } from "./openaiService";
import { LoyaltyProgram, ExchangeRate } from "@shared/schema";

export interface MarketTrend {
  program: string;
  changePercent: number;
  analysis: string;
}

export interface MarketInsight {
  timestamp: Date;
  summary: string;
  trends: MarketTrend[];
  recommendations: string[];
  seasonalTrends?: string;
  marketOutlook?: string;
}

export interface PortfolioAnalysis {
  userId: number;
  timestamp: Date;
  overallValue: string;
  diversification: string;
  primaryProgram: string;
  risks: string[];
  opportunities: string[];
  suggestedActions: string[];
}

/**
 * Service for AI-powered market insights on loyalty points
 */
export class MarketInsightsService {
  /**
   * Generate market insights and trends
   */
  async getMarketInsights(): Promise<MarketInsight> {
    try {
      // Check if OpenAI is available
      const isOpenAIAvailable = await openaiService.checkAvailability();
      if (!isOpenAIAvailable) {
        return this.getDefaultMarketInsights();
      }
      
      // Get exchange rates
      const exchangeRates = await this.getAllExchangeRates();
      if (!exchangeRates || exchangeRates.length === 0) {
        return this.getDefaultMarketInsights();
      }
      
      // Prepare data for analysis
      const data = {
        currentRates: exchangeRates,
        date: new Date().toISOString(),
      };
      
      // System prompt for market insights
      const systemPrompt = `
        You are an expert financial analyst specializing in loyalty program valuations and trends.
        Analyze the current exchange rates between different loyalty programs and provide insights
        on market trends, program valuations, and recommended actions for users.
        
        Based on the provided exchange rate data, generate a market insights report that includes:
        
        1. A brief market summary describing the overall state of loyalty program values
        2. Specific trends for each program (identifying those with increasing or decreasing value)
        3. General recommendations for users based on current market conditions
        4. Seasonal trends that might be relevant (e.g., travel points increasing before holiday seasons)
        5. Short-term market outlook
        
        Format your response as a JSON object with the following structure:
        {
          "summary": "Brief overview of the current market state",
          "trends": [
            {
              "program": "Program name",
              "changePercent": number (positive for increase, negative for decrease),
              "analysis": "Brief analysis of the program's current market position"
            }
          ],
          "recommendations": ["Action 1", "Action 2", ...],
          "seasonalTrends": "Analysis of any seasonal factors",
          "marketOutlook": "Short-term outlook prediction"
        }
        
        Keep all analyses concise and actionable. Focus on identifying opportunities for users
        to maximize their point values through strategic conversions or holdings.
      `;
      
      // Get analysis from OpenAI
      const insights = await openaiService.getCompletion(
        systemPrompt,
        data,
        {
          responseFormat: 'json_object',
          temperature: 0.4
        }
      );
      
      return {
        timestamp: new Date(),
        summary: insights.summary,
        trends: insights.trends || [],
        recommendations: insights.recommendations || [],
        seasonalTrends: insights.seasonalTrends,
        marketOutlook: insights.marketOutlook
      };
    } catch (error) {
      console.error('Error generating market insights:', error);
      return this.getDefaultMarketInsights();
    }
  }
  
  /**
   * Analyze a specific user's loyalty point portfolio
   */
  async analyzeUserPortfolio(userId: number): Promise<PortfolioAnalysis> {
    try {
      // Check if OpenAI is available
      const isOpenAIAvailable = await openaiService.checkAvailability();
      if (!isOpenAIAvailable) {
        return this.getDefaultPortfolioAnalysis(userId);
      }
      
      // Get user data
      const user = await storage.getUser(userId);
      if (!user) {
        throw new Error('User not found');
      }
      
      // Get user's wallets and market data
      const wallets = await storage.getUserWallets(userId);
      const exchangeRates = await this.getAllExchangeRates();
      
      // Prepare data for analysis
      const portfolioData = {
        userProfile: {
          membershipTier: user.membershipTier,
          pointsConverted: user.pointsConverted || 0
        },
        wallets: wallets.map(wallet => ({
          program: wallet.program,
          balance: wallet.balance,
          hasLinkedAccount: !!wallet.accountNumber
        })),
        marketData: {
          exchangeRates
        }
      };
      
      // System prompt for portfolio analysis
      const systemPrompt = `
        You are an expert financial advisor specializing in loyalty program optimization.
        Analyze the provided user's loyalty points portfolio and current market conditions
        to provide a personalized portfolio analysis.
        
        Based on the user's wallet balances and current exchange rates, provide:
        
        1. An assessment of the overall value of their portfolio
        2. Analysis of their portfolio diversification (too concentrated or well-balanced)
        3. Identification of the primary program that represents their greatest value
        4. Any risks in their current portfolio (e.g., programs with declining value)
        5. Opportunities they could take advantage of based on their specific holdings
        6. Specific actions they should consider taking
        
        Format your response as a JSON object with the following structure:
        {
          "overallValue": "Assessment of total portfolio value",
          "diversification": "Analysis of portfolio balance",
          "primaryProgram": "The program with highest value or strategic importance",
          "risks": ["Risk 1", "Risk 2", ...],
          "opportunities": ["Opportunity 1", "Opportunity 2", ...],
          "suggestedActions": ["Action 1", "Action 2", ...]
        }
        
        Keep your analysis concise, specific, and actionable. Focus on practical steps
        the user can take to optimize their loyalty point portfolio.
      `;
      
      // Get analysis from OpenAI
      const analysis = await openaiService.getCompletion(
        systemPrompt,
        portfolioData,
        {
          responseFormat: 'json_object',
          temperature: 0.3
        }
      );
      
      return {
        userId,
        timestamp: new Date(),
        overallValue: analysis.overallValue,
        diversification: analysis.diversification,
        primaryProgram: analysis.primaryProgram,
        risks: analysis.risks || [],
        opportunities: analysis.opportunities || [],
        suggestedActions: analysis.suggestedActions || []
      };
    } catch (error) {
      console.error('Error analyzing user portfolio:', error);
      return this.getDefaultPortfolioAnalysis(userId);
    }
  }
  
  /**
   * Get all exchange rates between programs
   */
  private async getAllExchangeRates(): Promise<any[]> {
    try {
      const programs: LoyaltyProgram[] = [
        "QANTAS", "GYG", "XPOINTS", "VELOCITY", "AMEX", 
        "FLYBUYS", "HILTON", "MARRIOTT", "AIRBNB", "DELTA"
      ];
      
      const rates = [];
      
      for (const fromProgram of programs) {
        for (const toProgram of programs) {
          if (fromProgram !== toProgram) {
            const rate = await storage.getExchangeRate(fromProgram, toProgram);
            if (rate) {
              rates.push({
                fromProgram,
                toProgram,
                rate: rate.rate,
                lastUpdated: rate.lastUpdated || new Date()
              });
            }
          }
        }
      }
      
      return rates;
    } catch (error) {
      console.error('Error fetching exchange rates:', error);
      return [];
    }
  }
  
  /**
   * Generate default market insights when OpenAI is unavailable
   */
  private getDefaultMarketInsights(): MarketInsight {
    return {
      timestamp: new Date(),
      summary: "The loyalty points market is currently stable with moderate fluctuations across major programs.",
      trends: [
        {
          program: "QANTAS",
          changePercent: 1.2,
          analysis: "Slight increase in value due to seasonal travel demand."
        },
        {
          program: "XPOINTS",
          changePercent: 0.5,
          analysis: "Stable with minor growth as platform adoption increases."
        },
        {
          program: "VELOCITY",
          changePercent: -0.8,
          analysis: "Minor decrease following recent program changes."
        }
      ],
      recommendations: [
        "Consider converting hotel points to airline miles before the summer travel season",
        "Hold xPoints as they maintain stable value across market fluctuations",
        "Watch for upcoming QANTAS promotions that may increase conversion bonuses"
      ]
    };
  }
  
  /**
   * Generate default portfolio analysis when OpenAI is unavailable
   */
  private getDefaultPortfolioAnalysis(userId: number): PortfolioAnalysis {
    return {
      userId,
      timestamp: new Date(),
      overallValue: "Your portfolio has a balanced mix of airline and retail loyalty programs.",
      diversification: "Your portfolio shows moderate diversification across different program types.",
      primaryProgram: "XPOINTS",
      risks: [
        "Some of your hotel points may be at risk of devaluation",
        "Low balance in airline programs limits travel redemption options"
      ],
      opportunities: [
        "Converting retail points to airline miles could provide better redemption value",
        "Consolidating smaller balances into xPoints offers more flexibility"
      ],
      suggestedActions: [
        "Consider moving points from retail programs to airline programs",
        "Focus on building your xPoints balance for maximum flexibility"
      ]
    };
  }
}

// Export singleton instance
export const marketInsightsService = new MarketInsightsService();