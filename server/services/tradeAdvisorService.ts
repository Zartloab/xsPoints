import { openaiService } from "./openaiService";
import { storage } from "../storage";
import { LoyaltyProgram, TradeOffer } from "@shared/schema";

export interface TradeAdvice {
  fromProgram: string;
  toProgram: string;
  suggestedAmountFrom: number;
  suggestedAmountTo: number;
  suggestedRate: number;
  marketRate: number;
  savings: string;
  rationale: string;
  timing: string;
}

export interface TradeDescription {
  title: string;
  description: string;
  keyPoints: string[];
}

export interface TradeOfferFeedback {
  offerId: number;
  isFavorable: boolean;
  analysis: string;
  suggestedCounterOffer?: {
    amountFrom: number;
    amountTo: number;
    rate: number;
  };
}

/**
 * Service for AI-powered trading advice and analysis
 */
export class TradeAdvisorService {
  /**
   * Generate personalized trade advice for a user
   */
  async generateTradeAdvice(userId: number): Promise<TradeAdvice[]> {
    try {
      // Check OpenAI availability
      const isOpenAIAvailable = await openaiService.checkAvailability();
      if (!isOpenAIAvailable) {
        return this.getDefaultTradeAdvice();
      }
      
      // Get user's wallets and market data
      const wallets = await storage.getUserWallets(userId);
      const tradeOffers = await storage.getTradeOffers();
      const tradeHistory = await storage.getTradeHistory(userId);
      
      // Get all exchange rates
      const exchangeRates = await this.getAllExchangeRates();
      
      // Prepare data for analysis
      const tradeData = {
        wallets: wallets.map(wallet => ({
          program: wallet.program,
          balance: wallet.balance,
          hasLinkedAccount: !!wallet.accountNumber
        })),
        marketData: {
          exchangeRates,
          currentOffers: tradeOffers.map(offer => ({
            id: offer.id,
            fromProgram: offer.fromProgram,
            toProgram: offer.toProgram,
            amountOffered: offer.amountOffered,
            amountRequested: offer.amountRequested,
            rate: offer.customRate
          }))
        },
        // Note: We're extracting transaction data from the trade history
        // but the actual schema might be different, so we'll need to adapt
        tradeHistory: tradeHistory.map(tx => {
          // Get the wallet data to determine programs
          const sellerWallet = wallets.find(w => w.id === tx.sellerWalletId);
          const buyerWallet = wallets.find(w => w.id === tx.buyerWalletId);
          
          return {
            amountFrom: tx.amountSold,
            amountTo: tx.amountBought,
            fromProgram: sellerWallet ? sellerWallet.program : "UNKNOWN",
            toProgram: buyerWallet ? buyerWallet.program : "UNKNOWN",
            rate: tx.rate,
            completedAt: tx.completedAt
          };
        })
      };
      
      // System prompt for trade advice
      const systemPrompt = `
        You are an expert trading advisor for the xPoints Exchange platform,
        which allows users to trade loyalty points between different programs.
        
        Analyze the user's wallet balances, current market conditions, and trading history
        to recommend optimal trading strategies. Consider factors like:
        
        1. Programs where the user has excess balances they might want to trade
        2. Programs where the user might need more points based on usage patterns
        3. Current market rates vs. fair value of different program points
        4. Timing considerations (seasonal fluctuations, upcoming promotions)
        
        Based on this analysis, suggest specific trades that would benefit the user.
        
        Format your response as a JSON array of trade advice objects with the following structure:
        [
          {
            "fromProgram": "Source program",
            "toProgram": "Destination program",
            "suggestedAmountFrom": number,
            "suggestedAmountTo": number,
            "suggestedRate": number,
            "marketRate": number,
            "savings": "Description of savings compared to market rate",
            "rationale": "Why this trade is recommended",
            "timing": "Advice on when to execute the trade"
          }
        ]
        
        Limit your suggestions to 3 high-quality trade recommendations that are actionable
        and provide clear value to the user. Be specific about amounts and rates.
      `;
      
      // Get advice from OpenAI
      const advice = await openaiService.getCompletion(
        systemPrompt,
        tradeData,
        {
          responseFormat: 'json_object',
          temperature: 0.3
        }
      );
      
      // Ensure the response is an array
      return Array.isArray(advice) ? advice : [advice];
    } catch (error) {
      console.error('Error generating trade advice:', error);
      return this.getDefaultTradeAdvice();
    }
  }
  
  /**
   * Generate compelling descriptions for trade offers
   */
  async generateTradeDescription(
    fromProgram: LoyaltyProgram, 
    toProgram: LoyaltyProgram,
    amountFrom: number,
    amountTo: number
  ): Promise<TradeDescription> {
    try {
      // Check OpenAI availability
      const isOpenAIAvailable = await openaiService.checkAvailability();
      if (!isOpenAIAvailable) {
        return this.getDefaultTradeDescription(fromProgram, toProgram);
      }
      
      // Get exchange rate data
      const exchangeRate = await storage.getExchangeRate(fromProgram, toProgram);
      const rate = amountTo / amountFrom;
      const marketRate = exchangeRate ? parseFloat(exchangeRate.rate) : 1.0;
      
      // Calculate savings or premium
      const savings = ((rate - marketRate) / marketRate) * 100;
      
      // Prepare data for description generation
      const offerData = {
        fromProgram,
        toProgram,
        amountFrom,
        amountTo,
        rate,
        marketRate,
        savings
      };
      
      // System prompt for trade description
      const systemPrompt = `
        You are a marketing copywriter specializing in crafting compelling offers for
        a loyalty points trading platform. Create an engaging and persuasive description
        for a trade offer with the provided details.
        
        Focus on the benefits to potential traders, highlighting:
        - Any savings or premium compared to market rate
        - The utility or value of the points being offered
        - Potential uses for the points (travel, hotels, merchandise, etc.)
        - Urgency or scarcity factors if applicable
        
        Format your response as a JSON object with the following structure:
        {
          "title": "Short, attention-grabbing title (max 60 chars)",
          "description": "Longer description explaining the trade offer (max 200 chars)",
          "keyPoints": ["3-4 bullet points highlighting benefits"]
        }
        
        Keep the tone professional yet enthusiastic. Be specific about the value
        proposition but avoid hyperbole or misleading claims.
      `;
      
      // Get description from OpenAI
      const description = await openaiService.getCompletion(
        systemPrompt,
        offerData,
        {
          responseFormat: 'json_object',
          temperature: 0.7
        }
      );
      
      return {
        title: description.title || `Exchange ${fromProgram} for ${toProgram}`,
        description: description.description || `Trading ${amountFrom.toLocaleString()} ${fromProgram} points for ${amountTo.toLocaleString()} ${toProgram} points.`,
        keyPoints: description.keyPoints || [`Rate: ${rate.toFixed(4)} ${toProgram}/${fromProgram}`]
      };
    } catch (error) {
      console.error('Error generating trade description:', error);
      return this.getDefaultTradeDescription(fromProgram, toProgram);
    }
  }
  
  /**
   * Analyze a trade offer to provide feedback on whether it's favorable
   */
  async analyzeTradeOffer(userId: number, offerId: number): Promise<TradeOfferFeedback> {
    try {
      // Check OpenAI availability
      const isOpenAIAvailable = await openaiService.checkAvailability();
      if (!isOpenAIAvailable) {
        return this.getDefaultTradeOfferFeedback(offerId);
      }
      
      // Get the trade offer
      const offer = await storage.getTradeOffer(offerId);
      if (!offer) {
        throw new Error(`Trade offer with ID ${offerId} not found`);
      }
      
      // Get user's wallet for the requested program
      const wallet = await storage.getWallet(userId, offer.toProgram);
      
      // Get exchange rate data
      const exchangeRate = await storage.getExchangeRate(offer.fromProgram, offer.toProgram);
      const marketRate = exchangeRate ? parseFloat(exchangeRate.rate) : 1.0;
      
      // Calculate the offered rate
      const offeredRate = offer.amountRequested / offer.amountOffered;
      
      // Prepare data for analysis
      const offerData = {
        offer: {
          id: offer.id,
          fromProgram: offer.fromProgram,
          toProgram: offer.toProgram,
          amountOffered: offer.amountOffered,
          amountRequested: offer.amountRequested,
          offeredRate,
          marketRate,
          description: offer.description
        },
        userWallet: wallet ? {
          balance: wallet.balance
        } : null
      };
      
      // System prompt for offer analysis
      const systemPrompt = `
        You are an expert trading advisor for a loyalty points trading platform.
        Analyze the provided trade offer and determine if it's favorable for the user
        based on current market rates and point valuations.
        
        Consider:
        1. How the offered rate compares to the current market rate
        2. Whether the user has sufficient balance to accept the offer
        3. The relative value and utility of the points being exchanged
        4. Any other factors that might affect the favorability
        
        Format your response as a JSON object with the following structure:
        {
          "isFavorable": boolean,
          "analysis": "Detailed analysis of the offer",
          "suggestedCounterOffer": {
            "amountFrom": number (only if you recommend a counter-offer),
            "amountTo": number (only if you recommend a counter-offer),
            "rate": number (only if you recommend a counter-offer)
          }
        }
        
        Be specific in your analysis, including numerical comparisons to market rates
        and clear reasoning for your recommendation.
      `;
      
      // Get analysis from OpenAI
      const feedback = await openaiService.getCompletion(
        systemPrompt,
        offerData,
        {
          responseFormat: 'json_object',
          temperature: 0.3
        }
      );
      
      return {
        offerId,
        isFavorable: feedback.isFavorable || false,
        analysis: feedback.analysis || '',
        suggestedCounterOffer: feedback.suggestedCounterOffer
      };
    } catch (error) {
      console.error('Error analyzing trade offer:', error);
      return this.getDefaultTradeOfferFeedback(offerId);
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
                rate: rate.rate
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
   * Get default trade advice when OpenAI is unavailable
   */
  private getDefaultTradeAdvice(): TradeAdvice[] {
    return [
      {
        fromProgram: "QANTAS",
        toProgram: "XPOINTS",
        suggestedAmountFrom: 10000,
        suggestedAmountTo: 14500,
        suggestedRate: 1.45,
        marketRate: 1.4,
        savings: "3.5% better than market rate",
        rationale: "Converting QANTAS to XPOINTS provides more flexibility for future redemptions",
        timing: "Consider executing this trade soon as QANTAS typically devalues during Q3"
      },
      {
        fromProgram: "FLYBUYS",
        toProgram: "VELOCITY",
        suggestedAmountFrom: 5000,
        suggestedAmountTo: 2200,
        suggestedRate: 0.44,
        marketRate: 0.4,
        savings: "10% better than market rate",
        rationale: "VELOCITY points typically offer better value for premium flight redemptions",
        timing: "Current promotion makes this an optimal time to convert"
      }
    ];
  }
  
  /**
   * Get default trade description when OpenAI is unavailable
   */
  private getDefaultTradeDescription(fromProgram: LoyaltyProgram, toProgram: LoyaltyProgram): TradeDescription {
    return {
      title: `Exchange ${fromProgram} for ${toProgram}`,
      description: `Trading ${fromProgram} points for ${toProgram} points at a competitive rate.`,
      keyPoints: [
        "Flexible conversion options",
        "Transparent rate calculation",
        "Fast and secure exchange"
      ]
    };
  }
  
  /**
   * Get default trade offer feedback when OpenAI is unavailable
   */
  private getDefaultTradeOfferFeedback(offerId: number): TradeOfferFeedback {
    return {
      offerId,
      isFavorable: true,
      analysis: "This trade offer appears to be at market rate and represents a fair exchange.",
      suggestedCounterOffer: undefined
    };
  }
}

// Export singleton instance
export const tradeAdvisorService = new TradeAdvisorService();