/**
 * This script tests all AI-powered services to ensure they're working properly.
 * It's useful for verifying integration with OpenAI and checking service responses.
 */

import { openaiService } from "../server/services/openaiService";
import { recommendationService } from "../server/services/recommendationService";
import { chatbotService } from "../server/services/chatbotService";
import { marketInsightsService } from "../server/services/marketInsightsService";
import { pointsValuationService } from "../server/services/pointsValuationService";
import { tradeAdvisorService } from "../server/services/tradeAdvisorService";
import { storage } from "../server/storage";
import { db } from "../server/db";
import { LoggerService } from "../server/services/loggerService";

const logger = new LoggerService("AI-Services-Test");

/**
 * Test all AI services
 */
async function testAIServices() {
  try {
    // Initialize database connection
    logger.info("Initializing database connection...");
    
    // First, check if OpenAI is available
    logger.info("Testing OpenAI service availability...");
    const isAvailable = await openaiService.checkAvailability();
    
    if (!isAvailable) {
      logger.error("OpenAI service is not available. Please check your API key.");
      process.exit(1);
    }
    
    logger.success("OpenAI service is available!");
    
    // Test each service
    await testRecommendationService();
    await testChatbotService();
    await testMarketInsightsService();
    await testPointsValuationService();
    await testTradeAdvisorService();
    
    logger.success("All AI services tested successfully!");
    process.exit(0);
  } catch (error) {
    logger.error(`Error testing AI services: ${error}`);
    process.exit(1);
  }
}

/**
 * Test the recommendation service
 */
async function testRecommendationService() {
  logger.info("Testing recommendation service...");
  
  try {
    // Get a test user
    const user = await getTestUser();
    
    // Generate recommendations
    const recommendations = await recommendationService.getUserRecommendations(user.id);
    
    logger.info(`Generated ${recommendations.recommendations.length} recommendations.`);
    logger.success("Recommendation service is working!");
    
    return recommendations;
  } catch (error) {
    logger.error(`Error testing recommendation service: ${error}`);
    throw error;
  }
}

/**
 * Test the chatbot service
 */
async function testChatbotService() {
  logger.info("Testing chatbot service...");
  
  try {
    // Get a test user
    const user = await getTestUser();
    
    // Create a sample conversation
    const messages = [
      { role: "system", content: "You are a helpful assistant." },
      { role: "user", content: "What's the best way to maximize my loyalty points?" }
    ];
    
    // Generate response
    const response = await chatbotService.getResponse(user.id, messages);
    
    logger.info(`Generated chatbot response: ${response.answer.substring(0, 100)}...`);
    logger.success("Chatbot service is working!");
    
    return response;
  } catch (error) {
    logger.error(`Error testing chatbot service: ${error}`);
    throw error;
  }
}

/**
 * Test the market insights service
 */
async function testMarketInsightsService() {
  logger.info("Testing market insights service...");
  
  try {
    // Get a test user
    const user = await getTestUser();
    
    // Generate market insights
    const insights = await marketInsightsService.getMarketInsights();
    
    logger.info(`Generated market insights with ${insights.trends.length} trends.`);
    
    // Generate portfolio analysis
    const analysis = await marketInsightsService.analyzeUserPortfolio(user.id);
    
    logger.info(`Generated portfolio analysis for user ${user.id}.`);
    logger.success("Market insights service is working!");
    
    return { insights, analysis };
  } catch (error) {
    logger.error(`Error testing market insights service: ${error}`);
    throw error;
  }
}

/**
 * Test the points valuation service
 */
async function testPointsValuationService() {
  logger.info("Testing points valuation service...");
  
  try {
    // Get program valuation
    const valuation = await pointsValuationService.getProgramValuation("QANTAS");
    
    logger.info(`Generated program valuation with ${valuation.categoryValues.length} categories.`);
    
    // Compare programs
    const comparison = await pointsValuationService.comparePrograms("QANTAS", "XPOINTS");
    
    logger.info(`Generated program comparison: ${comparison.recommendation}`);
    
    // Find best redemptions
    const bestRedemptions = await pointsValuationService.findBestRedemptions("QANTAS", 10000);
    
    logger.info(`Found ${bestRedemptions.length} redemption options.`);
    logger.success("Points valuation service is working!");
    
    return { valuation, comparison, bestRedemptions };
  } catch (error) {
    logger.error(`Error testing points valuation service: ${error}`);
    throw error;
  }
}

/**
 * Test the trade advisor service
 */
async function testTradeAdvisorService() {
  logger.info("Testing trade advisor service...");
  
  try {
    // Get a test user
    const user = await getTestUser();
    
    // Generate trade advice
    const advice = await tradeAdvisorService.generateTradeAdvice(user.id);
    
    logger.info(`Generated ${advice.length} trade recommendations.`);
    
    // Generate trade description
    const description = await tradeAdvisorService.generateTradeDescription(
      "QANTAS",
      "XPOINTS",
      10000,
      15000
    );
    
    logger.info(`Generated trade description: ${description.title}`);
    
    // Try to find a trade offer to analyze
    const offers = await storage.getTradeOffers();
    
    if (offers && offers.length > 0) {
      // Analyze a trade offer
      const analysis = await tradeAdvisorService.analyzeTradeOffer(user.id, offers[0].id);
      
      logger.info(`Generated trade offer analysis: ${analysis.analysis.substring(0, 100)}...`);
    } else {
      logger.warning("No trade offers found to analyze.");
    }
    
    logger.success("Trade advisor service is working!");
    
    return { advice, description };
  } catch (error) {
    logger.error(`Error testing trade advisor service: ${error}`);
    throw error;
  }
}

/**
 * Helper to get a test user
 */
async function getTestUser() {
  const users = await storage.getUsers();
  
  if (!users || users.length === 0) {
    throw new Error("No users found in the database. Please create a test user first.");
  }
  
  return users[0];
}

// Start the test
testAIServices();