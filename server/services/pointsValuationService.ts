import { openaiService } from "./openaiService";
import { storage } from "../storage";
import { LoyaltyProgram } from "@shared/schema";

export interface CategoryValue {
  category: string;
  valuePerPoint: number;
  description: string;
  examples: string[];
}

export interface ProgramValuation {
  program: string;
  averageValue: number;
  currency: string;
  categoryValues: CategoryValue[];
  specialDeals?: string[];
  expirationPolicy?: string;
  transferability?: string;
}

export interface ComparisonResult {
  fromProgram: string;
  toProgram: string;
  conversionRate: number;
  valueRatio: number;
  recommendation: string;
}

/**
 * Service for AI-powered points valuation and comparison
 */
export class PointsValuationService {
  // Cache valuations to reduce API calls
  private valuationCache: Map<string, ProgramValuation> = new Map();
  private cacheExpiry: Map<string, Date> = new Map();
  private readonly CACHE_DURATION_MS = 24 * 60 * 60 * 1000; // 24 hours
  
  /**
   * Get detailed valuation for a specific loyalty program
   */
  async getProgramValuation(program: LoyaltyProgram): Promise<ProgramValuation> {
    try {
      // Check cache first
      const cacheKey = program;
      const cachedValuation = this.valuationCache.get(cacheKey);
      const cacheExpiry = this.cacheExpiry.get(cacheKey);
      
      if (cachedValuation && cacheExpiry && cacheExpiry > new Date()) {
        return cachedValuation;
      }
      
      // Check if OpenAI is available
      const isOpenAIAvailable = await openaiService.checkAvailability();
      if (!isOpenAIAvailable) {
        return this.getDefaultProgramValuation(program);
      }
      
      // Get exchange rates involving this program
      const rates = await this.getProgramExchangeRates(program);
      
      // Prepare data for analysis
      const programData = {
        program,
        exchangeRates: rates,
        date: new Date().toISOString()
      };
      
      // System prompt for program valuation
      const systemPrompt = `
        You are an expert in loyalty program valuation and analysis.
        Analyze the provided loyalty program and its exchange rates to determine
        the real-world value of its points across different redemption categories.
        
        Based on industry knowledge and the exchange rates provided, estimate:
        
        1. The average monetary value per point in the program's primary currency
        2. Values for different redemption categories (flights, hotels, merchandise, etc.)
        3. Any special high-value redemption opportunities
        4. Important details about expiration and transferability
        
        Format your response as a JSON object with the following structure:
        {
          "program": "Program name",
          "averageValue": number (average value per point in currency),
          "currency": "Currency code (e.g., AUD, USD)",
          "categoryValues": [
            {
              "category": "Category name (e.g., Flights, Hotels)",
              "valuePerPoint": number (value per point in this category),
              "description": "Brief explanation of the valuation",
              "examples": ["Example 1", "Example 2"]
            }
          ],
          "specialDeals": ["Special high-value redemption 1", "Special redemption 2"],
          "expirationPolicy": "Description of point expiration policy",
          "transferability": "Description of point transfer options and restrictions"
        }
        
        Keep your analysis concise but comprehensive. Focus on practical valuations
        that users can use to make informed decisions about their loyalty points.
      `;
      
      // Get valuation from OpenAI
      const valuation = await openaiService.getCompletion(
        systemPrompt,
        programData,
        {
          responseFormat: 'json_object',
          temperature: 0.3
        }
      );
      
      // Cache the result
      this.valuationCache.set(cacheKey, valuation);
      this.cacheExpiry.set(cacheKey, new Date(Date.now() + this.CACHE_DURATION_MS));
      
      return valuation;
    } catch (error) {
      console.error(`Error getting valuation for ${program}:`, error);
      return this.getDefaultProgramValuation(program);
    }
  }
  
  /**
   * Compare the value of points between two programs
   */
  async comparePrograms(fromProgram: LoyaltyProgram, toProgram: LoyaltyProgram): Promise<ComparisonResult> {
    try {
      // Get valuations for both programs
      const fromValuation = await this.getProgramValuation(fromProgram);
      const toValuation = await this.getProgramValuation(toProgram);
      
      // Get the current exchange rate
      const exchangeRate = await storage.getExchangeRate(fromProgram, toProgram);
      if (!exchangeRate) {
        throw new Error(`No exchange rate found between ${fromProgram} and ${toProgram}`);
      }
      
      // Calculate the value ratio (accounting for currency differences)
      const valueRatio = fromValuation.averageValue / toValuation.averageValue;
      
      // Determine if the conversion is favorable
      const conversionRate = parseFloat(exchangeRate.rate);
      const isFavorable = conversionRate > valueRatio;
      
      // Generate recommendation
      let recommendation;
      if (isFavorable) {
        recommendation = `Converting ${fromProgram} to ${toProgram} is favorable (${Math.round((conversionRate/valueRatio - 1) * 100)}% better than market value).`;
      } else {
        recommendation = `Converting ${fromProgram} to ${toProgram} is unfavorable (${Math.round((1 - conversionRate/valueRatio) * 100)}% worse than market value).`;
      }
      
      return {
        fromProgram,
        toProgram,
        conversionRate,
        valueRatio,
        recommendation
      };
    } catch (error) {
      console.error(`Error comparing programs ${fromProgram} and ${toProgram}:`, error);
      
      // Return default comparison
      return {
        fromProgram,
        toProgram,
        conversionRate: 1.0,
        valueRatio: 1.0,
        recommendation: `Unable to accurately compare ${fromProgram} and ${toProgram} at this time.`
      };
    }
  }
  
  /**
   * Find best redemption options for a specific point balance
   */
  async findBestRedemptions(program: LoyaltyProgram, pointBalance: number): Promise<CategoryValue[]> {
    try {
      // Get program valuation
      const valuation = await this.getProgramValuation(program);
      
      // Sort categories by value
      const sortedCategories = [...valuation.categoryValues].sort(
        (a, b) => b.valuePerPoint - a.valuePerPoint
      );
      
      // Return top categories
      return sortedCategories.slice(0, 3);
    } catch (error) {
      console.error(`Error finding best redemptions for ${program}:`, error);
      return [];
    }
  }
  
  /**
   * Get exchange rates involving a specific program
   */
  private async getProgramExchangeRates(program: LoyaltyProgram): Promise<any[]> {
    try {
      const programs: LoyaltyProgram[] = [
        "QANTAS", "GYG", "XPOINTS", "VELOCITY", "AMEX", 
        "FLYBUYS", "HILTON", "MARRIOTT", "AIRBNB", "DELTA"
      ];
      
      const rates = [];
      
      // Get rates where this program is the source
      for (const toProgram of programs) {
        if (program !== toProgram) {
          const rate = await storage.getExchangeRate(program, toProgram);
          if (rate) {
            rates.push({
              fromProgram: program,
              toProgram,
              rate: rate.rate
            });
          }
        }
      }
      
      // Get rates where this program is the destination
      for (const fromProgram of programs) {
        if (program !== fromProgram) {
          const rate = await storage.getExchangeRate(fromProgram, program);
          if (rate) {
            rates.push({
              fromProgram,
              toProgram: program,
              rate: rate.rate
            });
          }
        }
      }
      
      return rates;
    } catch (error) {
      console.error(`Error getting exchange rates for ${program}:`, error);
      return [];
    }
  }
  
  /**
   * Generate default program valuation when OpenAI is unavailable
   */
  private getDefaultProgramValuation(program: LoyaltyProgram): ProgramValuation {
    // Default valuations for common programs
    const defaults: { [key in LoyaltyProgram]?: ProgramValuation } = {
      "QANTAS": {
        program: "QANTAS",
        averageValue: 0.015,
        currency: "AUD",
        categoryValues: [
          {
            category: "Flights",
            valuePerPoint: 0.02,
            description: "Best value when redeeming for flights, especially business and first class",
            examples: ["Sydney to Melbourne: ~8,000 points (~$160 value)"]
          },
          {
            category: "Hotels",
            valuePerPoint: 0.01,
            description: "Moderate value for hotel redemptions",
            examples: ["One night at midrange hotel: ~20,000 points (~$200 value)"]
          },
          {
            category: "Merchandise",
            valuePerPoint: 0.007,
            description: "Generally lower value for merchandise redemptions",
            examples: ["$100 gift card: ~15,000 points"]
          }
        ],
        specialDeals: ["Annual companion certificate", "Status upgrade promotions"],
        expirationPolicy: "Points expire after 18 months of inactivity",
        transferability: "Can transfer to family members at no cost"
      },
      "XPOINTS": {
        program: "XPOINTS",
        averageValue: 0.012,
        currency: "AUD",
        categoryValues: [
          {
            category: "Transfers",
            valuePerPoint: 0.015,
            description: "Best value when transferring to partner programs during bonuses",
            examples: ["Transfer to QANTAS with 20% bonus"]
          },
          {
            category: "Direct Redemptions",
            valuePerPoint: 0.01,
            description: "Standard value for direct redemptions through the platform",
            examples: ["$100 worth of services for 10,000 points"]
          }
        ],
        specialDeals: ["Seasonal transfer bonuses", "Flash deals with partners"],
        expirationPolicy: "Points do not expire",
        transferability: "Fully transferable to any program partner"
      }
    };
    
    // Return program-specific default if available
    if (defaults[program]) {
      return defaults[program]!;
    }
    
    // Generic default for any program
    return {
      program,
      averageValue: 0.01,
      currency: "AUD",
      categoryValues: [
        {
          category: "Travel",
          valuePerPoint: 0.012,
          description: "Best value typically found in travel redemptions",
          examples: ["Round-trip flights", "Hotel stays"]
        },
        {
          category: "Merchandise",
          valuePerPoint: 0.008,
          description: "Lower value for merchandise redemptions",
          examples: ["Gift cards", "Products"]
        }
      ],
      expirationPolicy: "Points typically expire after 12-24 months of inactivity",
      transferability: "Limited transferability to program partners"
    };
  }
}

// Export singleton instance
export const pointsValuationService = new PointsValuationService();