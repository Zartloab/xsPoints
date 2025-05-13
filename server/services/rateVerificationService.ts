import { LoyaltyProgram } from '@shared/schema';
import axios from 'axios';
import { db } from '../db';
import { exchangeRates } from '@shared/schema';
import { eq, and } from 'drizzle-orm';
import { log } from '../vite';

// Interface for rate source configurations
interface RateSourceConfig {
  name: string;
  apiEndpoint: string | null;
  apiKeyEnvVar: string | null;
  parseResponse: (response: any) => { pointValue: number; lastUpdated: Date } | null;
  fallbackValue: number;
  termsUrl: string;
  requiresAuth: boolean;
}

// Default dollar value per point if API fetching fails
// IMPORTANT: These are fallback values only and should be updated
// based on official program documentation when available
const DEFAULT_VALUES: Record<LoyaltyProgram, number> = {
  XPOINTS: 0.01, // $0.01 per xPoint (our standard)
  QANTAS: 0.007, // $0.007 per Qantas point based on avg redemption value
  GYG: 0.005, // $0.005 per GYG point based on avg redemption value
  VELOCITY: 0.006, // $0.006 per Velocity point based on avg redemption value
  AMEX: 0.0085, // $0.0085 per AMEX point based on avg redemption value
  FLYBUYS: 0.0045, // $0.0045 per Flybuys point based on avg redemption value
  HILTON: 0.004, // $0.004 per Hilton point based on avg redemption value
  MARRIOTT: 0.0075, // $0.0075 per Marriott point based on avg redemption value
  AIRBNB: 0.0058, // $0.0058 per Airbnb point based on avg redemption value
  DELTA: 0.0081, // $0.0081 per Delta point based on avg redemption value
};

// Configuration for each rate source including API endpoints and parsing methods
const rateSourceConfigs: Record<LoyaltyProgram, RateSourceConfig> = {
  XPOINTS: {
    name: 'xPoints',
    apiEndpoint: null, // Internal standard
    apiKeyEnvVar: null,
    parseResponse: () => ({ pointValue: 0.01, lastUpdated: new Date() }),
    fallbackValue: 0.01,
    termsUrl: 'https://xpoints.com/terms',
    requiresAuth: false
  },
  QANTAS: {
    name: 'Qantas Frequent Flyer',
    apiEndpoint: 'https://api.qantas.com/loyalty/v1/pointsValue',
    apiKeyEnvVar: 'QANTAS_API_KEY',
    parseResponse: (response) => {
      if (response && response.pointDollarValue) {
        return {
          pointValue: response.pointDollarValue,
          lastUpdated: new Date(response.lastUpdated || Date.now())
        };
      }
      return null;
    },
    fallbackValue: DEFAULT_VALUES.QANTAS,
    termsUrl: 'https://www.qantas.com/au/en/frequent-flyer/terms-and-conditions.html',
    requiresAuth: true
  },
  GYG: {
    name: 'GetYourGuide Rewards',
    apiEndpoint: 'https://api.getyourguide.com/rewards/v1/pointValue',
    apiKeyEnvVar: 'GYG_API_KEY',
    parseResponse: (response) => {
      if (response && response.rewardPointValue) {
        return {
          pointValue: response.rewardPointValue,
          lastUpdated: new Date(response.asOf || Date.now())
        };
      }
      return null;
    },
    fallbackValue: DEFAULT_VALUES.GYG,
    termsUrl: 'https://www.getyourguide.com/rewards-terms',
    requiresAuth: true
  },
  VELOCITY: {
    name: 'Velocity Frequent Flyer',
    apiEndpoint: 'https://api.velocityfrequentflyer.com/api/v1/points/value',
    apiKeyEnvVar: 'VELOCITY_API_KEY',
    parseResponse: (response) => {
      if (response && response.data && response.data.value) {
        return {
          pointValue: response.data.value,
          lastUpdated: new Date(response.data.updatedAt || Date.now())
        };
      }
      return null;
    },
    fallbackValue: DEFAULT_VALUES.VELOCITY,
    termsUrl: 'https://experience.velocityfrequentflyer.com/terms-and-conditions',
    requiresAuth: true
  },
  AMEX: {
    name: 'American Express Membership Rewards',
    apiEndpoint: 'https://api.americanexpress.com/rewards/v2/points/value',
    apiKeyEnvVar: 'AMEX_API_KEY',
    parseResponse: (response) => {
      if (response && response.value) {
        return {
          pointValue: response.value,
          lastUpdated: new Date(response.timestamp || Date.now())
        };
      }
      return null;
    },
    fallbackValue: DEFAULT_VALUES.AMEX,
    termsUrl: 'https://www.americanexpress.com/us/rewards/membership-rewards/terms',
    requiresAuth: true
  },
  FLYBUYS: {
    name: 'Flybuys',
    apiEndpoint: 'https://api.flybuys.com.au/api/v1/points/value',
    apiKeyEnvVar: 'FLYBUYS_API_KEY',
    parseResponse: (response) => {
      if (response && response.dollarValuePerPoint) {
        return {
          pointValue: response.dollarValuePerPoint,
          lastUpdated: new Date(response.lastUpdated || Date.now())
        };
      }
      return null;
    },
    fallbackValue: DEFAULT_VALUES.FLYBUYS,
    termsUrl: 'https://www.flybuys.com.au/terms-and-conditions',
    requiresAuth: true
  },
  HILTON: {
    name: 'Hilton Honors',
    apiEndpoint: 'https://api.hilton.com/v1/honors/points/value',
    apiKeyEnvVar: 'HILTON_API_KEY',
    parseResponse: (response) => {
      if (response && response.pointsValue) {
        return {
          pointValue: response.pointsValue,
          lastUpdated: new Date(response.asOf || Date.now())
        };
      }
      return null;
    },
    fallbackValue: DEFAULT_VALUES.HILTON,
    termsUrl: 'https://www.hilton.com/en/hilton-honors/terms/',
    requiresAuth: true
  },
  MARRIOTT: {
    name: 'Marriott Bonvoy',
    apiEndpoint: 'https://api.marriott.com/v1/bonvoy/points/value',
    apiKeyEnvVar: 'MARRIOTT_API_KEY',
    parseResponse: (response) => {
      if (response && response.pointValue) {
        return {
          pointValue: response.pointValue,
          lastUpdated: new Date(response.valuation_date || Date.now())
        };
      }
      return null;
    },
    fallbackValue: DEFAULT_VALUES.MARRIOTT,
    termsUrl: 'https://www.marriott.com/loyalty/terms/default.mi',
    requiresAuth: true
  },
  AIRBNB: {
    name: 'Airbnb Rewards',
    apiEndpoint: 'https://api.airbnb.com/v2/rewards/points-value',
    apiKeyEnvVar: 'AIRBNB_API_KEY',
    parseResponse: (response) => {
      if (response && response.data && response.data.dollar_value) {
        return {
          pointValue: response.data.dollar_value,
          lastUpdated: new Date(response.data.last_updated || Date.now())
        };
      }
      return null;
    },
    fallbackValue: DEFAULT_VALUES.AIRBNB,
    termsUrl: 'https://www.airbnb.com/help/article/3110',
    requiresAuth: true
  },
  DELTA: {
    name: 'Delta SkyMiles',
    apiEndpoint: 'https://api.delta.com/skymiles/v1/valuation',
    apiKeyEnvVar: 'DELTA_API_KEY',
    parseResponse: (response) => {
      if (response && response.point_value) {
        return {
          pointValue: response.point_value,
          lastUpdated: new Date(response.effective_date || Date.now())
        };
      }
      return null;
    },
    fallbackValue: DEFAULT_VALUES.DELTA,
    termsUrl: 'https://www.delta.com/us/en/skymiles/program-rules-conditions/program-rules',
    requiresAuth: true
  }
};

// Rate verification interface
export interface RateVerification {
  isVerified: boolean;
  source: string;
  pointValue: number;
  lastVerified: Date;
  termsUrl: string;
  notes: string;
}

// Interface for exchange rate with additional verification info
export interface VerifiedExchangeRate {
  id: number;
  fromProgram: LoyaltyProgram;
  toProgram: LoyaltyProgram;
  rate: string;
  updatedAt: Date;
  verificationData?: string;
  verification: RateVerification;
}

/**
 * Attempts to fetch the dollar value of a loyalty point from the program's API
 * Falls back to stored or default values if API fetch fails
 */
export async function fetchProgramPointValue(program: LoyaltyProgram): Promise<RateVerification> {
  const config = rateSourceConfigs[program];
  
  // For xPoints, the value is standardized internally
  if (program === 'XPOINTS') {
    return {
      isVerified: true,
      source: 'internal',
      pointValue: 0.01, // xPoints standard value: 1 cent per point
      lastVerified: new Date(),
      termsUrl: config.termsUrl,
      notes: 'xPoints standard value is always $0.01 per point'
    };
  }
  
  // For external APIs, attempt to fetch the current value
  if (config.apiEndpoint && config.apiKeyEnvVar) {
    try {
      const apiKey = process.env[config.apiKeyEnvVar];
      
      // If the API key is missing and required, use fallback with a note
      if (!apiKey && config.requiresAuth) {
        return {
          isVerified: false,
          source: 'fallback',
          pointValue: config.fallbackValue,
          lastVerified: new Date(),
          termsUrl: config.termsUrl,
          notes: `Missing API key for ${config.name}. Using fallback value.`
        };
      }
      
      // Make the API request with appropriate authentication
      const response = await axios.get(config.apiEndpoint, {
        headers: apiKey ? { 'Authorization': `Bearer ${apiKey}` } : {}
      });
      
      // Parse the response using the program-specific method
      const parsedValue = config.parseResponse(response.data);
      
      if (parsedValue) {
        return {
          isVerified: true,
          source: 'api',
          pointValue: parsedValue.pointValue,
          lastVerified: parsedValue.lastUpdated,
          termsUrl: config.termsUrl,
          notes: `Successfully fetched from ${config.name} API`
        };
      }
      
      // If parsing failed, fall back to stored values
      return {
        isVerified: false,
        source: 'fallback',
        pointValue: config.fallbackValue,
        lastVerified: new Date(),
        termsUrl: config.termsUrl,
        notes: `Failed to parse response from ${config.name} API. Using fallback value.`
      };
    } 
    catch (error) {
      // If API request failed, log and use fallback
      console.error(`Failed to fetch point value for ${program}:`, error);
      return {
        isVerified: false,
        source: 'fallback',
        pointValue: config.fallbackValue,
        lastVerified: new Date(),
        termsUrl: config.termsUrl,
        notes: `API request failed for ${config.name}. Using fallback value.`
      };
    }
  }
  
  // If no API endpoint is configured, use fallback with a note
  return {
    isVerified: false,
    source: 'fallback',
    pointValue: config.fallbackValue,
    lastVerified: new Date(),
    termsUrl: config.termsUrl,
    notes: `No API endpoint configured for ${config.name}. Using fallback value.`
  };
}

/**
 * Calculate the exchange rate between two loyalty programs based on their dollar values
 */
export async function calculateExchangeRate(
  fromProgram: LoyaltyProgram, 
  toProgram: LoyaltyProgram
): Promise<{ rate: string, verification: RateVerification }> {
  // Get the dollar values for both programs
  const fromVerification = await fetchProgramPointValue(fromProgram);
  const toVerification = await fetchProgramPointValue(toProgram);
  
  // Calculate the exchange rate based on the dollar values
  // (how many toProgram points you get for 1 fromProgram point)
  const fromValue = fromVerification.pointValue;
  const toValue = toVerification.pointValue;
  
  // If either value is zero, avoid division by zero
  if (fromValue <= 0 || toValue <= 0) {
    return {
      rate: "0",
      verification: {
        isVerified: false,
        source: 'error',
        pointValue: 0,
        lastVerified: new Date(),
        termsUrl: '',
        notes: `Invalid point value: ${fromProgram}=${fromValue}, ${toProgram}=${toValue}`
      }
    };
  }
  
  // Calculate how many toProgram points you get for 1 fromProgram point
  const rate = fromValue / toValue;
  
  // Create verification info for the exchange rate
  const verified = fromVerification.isVerified && toVerification.isVerified;
  const verification: RateVerification = {
    isVerified: verified,
    source: verified ? 'calculated' : 'calculated_from_fallback',
    pointValue: rate,
    lastVerified: new Date(),
    termsUrl: `${fromVerification.termsUrl}, ${toVerification.termsUrl}`,
    notes: `Calculated from ${fromProgram} ($${fromValue}) to ${toProgram} ($${toValue}). ` +
           `${fromVerification.notes}. ${toVerification.notes}`
  };
  
  return {
    rate: rate.toFixed(6),
    verification
  };
}

/**
 * Updates all exchange rates in the database with the latest values
 * This should be run on a schedule (e.g., daily)
 */
export async function updateAllExchangeRates(): Promise<void> {
  try {
    log('Starting exchange rate update job', 'rateService');
    
    // Define all loyalty programs
    const programs: LoyaltyProgram[] = [
      'XPOINTS', 'QANTAS', 'GYG', 'VELOCITY', 'AMEX', 
      'FLYBUYS', 'HILTON', 'MARRIOTT', 'AIRBNB', 'DELTA'
    ];
    
    // For each pair of programs, update the exchange rate
    for (const fromProgram of programs) {
      for (const toProgram of programs) {
        // Skip self-to-self rates (always 1.0)
        if (fromProgram === toProgram) {
          // Update or insert 1:1 rate for same program
          await db.insert(exchangeRates)
            .values({
              fromProgram,
              toProgram,
              rate: "1.000000",
              updatedAt: new Date(),
              verificationData: JSON.stringify({
                isVerified: true,
                source: 'internal',
                pointValue: 1.0,
                lastVerified: new Date(),
                termsUrl: rateSourceConfigs[fromProgram].termsUrl,
                notes: 'Same currency conversion is always 1:1'
              })
            })
            .onConflictDoUpdate({
              target: [exchangeRates.fromProgram, exchangeRates.toProgram],
              set: {
                rate: "1.000000",
                updatedAt: new Date(),
                verificationData: JSON.stringify({
                  isVerified: true,
                  source: 'internal',
                  pointValue: 1.0,
                  lastVerified: new Date(),
                  termsUrl: rateSourceConfigs[fromProgram].termsUrl,
                  notes: 'Same currency conversion is always 1:1'
                })
              }
            });
          continue;
        }
        
        // Calculate the exchange rate
        const { rate, verification } = await calculateExchangeRate(fromProgram, toProgram);
        
        // Update or insert the exchange rate in the database
        await db.insert(exchangeRates)
          .values({
            fromProgram,
            toProgram,
            rate,
            updatedAt: new Date(),
            verificationData: JSON.stringify(verification)
          })
          .onConflictDoUpdate({
            target: [exchangeRates.fromProgram, exchangeRates.toProgram],
            set: {
              rate,
              updatedAt: new Date(),
              verificationData: JSON.stringify(verification)
            }
          });
        
        log(`Updated rate: ${fromProgram} -> ${toProgram} = ${rate}`, 'rateService');
      }
    }
    
    log('Completed exchange rate update job', 'rateService');
  } catch (error) {
    console.error('Error updating exchange rates:', error);
    throw error;
  }
}

/**
 * Gets a single exchange rate with verification information
 */
export async function getVerifiedExchangeRate(
  fromProgram: LoyaltyProgram, 
  toProgram: LoyaltyProgram
): Promise<VerifiedExchangeRate | null> {
  try {
    // Check if the rate exists in the database
    const [existingRate] = await db.select()
      .from(exchangeRates)
      .where(
        and(
          eq(exchangeRates.fromProgram, fromProgram),
          eq(exchangeRates.toProgram, toProgram)
        )
      );
    
    if (existingRate) {
      // Parse the verification data
      const verification: RateVerification = existingRate.verificationData 
        ? JSON.parse(existingRate.verificationData) 
        : {
            isVerified: false,
            source: 'unknown',
            pointValue: parseFloat(existingRate.rate),
            lastVerified: existingRate.updatedAt,
            termsUrl: '',
            notes: 'No verification data available'
          };
      
      return {
        ...existingRate,
        verification
      };
    }
    
    // If the rate doesn't exist, calculate it now
    const { rate, verification } = await calculateExchangeRate(fromProgram, toProgram);
    
    // Insert the new rate into the database
    const [newRate] = await db.insert(exchangeRates)
      .values({
        fromProgram,
        toProgram,
        rate,
        updatedAt: new Date(),
        verificationData: JSON.stringify(verification)
      })
      .returning();
    
    return {
      ...newRate,
      verification
    };
  } catch (error) {
    console.error(`Error fetching exchange rate ${fromProgram} -> ${toProgram}:`, error);
    return null;
  }
}

/**
 * Gets all exchange rates with verification information
 */
export async function getAllVerifiedExchangeRates(): Promise<VerifiedExchangeRate[]> {
  try {
    const rates = await db.select().from(exchangeRates);
    
    return rates.map(rate => {
      // Parse the verification data
      const verification: RateVerification = rate.verificationData 
        ? JSON.parse(rate.verificationData) 
        : {
            isVerified: false,
            source: 'unknown',
            pointValue: parseFloat(rate.rate),
            lastVerified: rate.updatedAt,
            termsUrl: '',
            notes: 'No verification data available'
          };
      
      return {
        ...rate,
        verification
      };
    });
  } catch (error) {
    console.error('Error fetching all exchange rates:', error);
    return [];
  }
}

/**
 * Gets the most recent verification status for a loyalty program's point value
 */
export async function getProgramValueVerification(program: LoyaltyProgram): Promise<RateVerification> {
  return await fetchProgramPointValue(program);
}

/**
 * Gets summary information about all loyalty programs
 */
export async function getLoyaltyProgramsInfo(): Promise<{
  program: LoyaltyProgram;
  name: string;
  dollarValue: number;
  isVerified: boolean;
  termsUrl: string;
  lastUpdated: Date;
}[]> {
  const programs: LoyaltyProgram[] = [
    'XPOINTS', 'QANTAS', 'GYG', 'VELOCITY', 'AMEX', 
    'FLYBUYS', 'HILTON', 'MARRIOTT', 'AIRBNB', 'DELTA'
  ];
  
  const results = [];
  
  for (const program of programs) {
    const verification = await fetchProgramPointValue(program);
    results.push({
      program,
      name: rateSourceConfigs[program].name,
      dollarValue: verification.pointValue,
      isVerified: verification.isVerified,
      termsUrl: verification.termsUrl,
      lastUpdated: verification.lastVerified
    });
  }
  
  return results;
}

// Initialize standard exchange rates if needed
export async function initializeExchangeRates(): Promise<void> {
  try {
    // Check if any exchange rates exist
    const [existingRate] = await db.select().from(exchangeRates).limit(1);
    
    // If no rates exist, create them
    if (!existingRate) {
      log('No exchange rates found, initializing default rates', 'rateService');
      await updateAllExchangeRates();
    }
  } catch (error) {
    console.error('Error initializing exchange rates:', error);
  }
}