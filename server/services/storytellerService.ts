import OpenAI from "openai";
import { LoyaltyProgram } from "@shared/schema";

// The newest OpenAI model is "gpt-4o" which was released May 13, 2024. Do not change this unless explicitly requested by the user
const OPENAI_MODEL = "gpt-4o";

// Initialize OpenAI client
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY || "" });

interface StorytellerResponse {
  stories: ContextualStory[];
  dollarValue: string;
}

interface ContextualStory {
  category: string;
  description: string;
  examples: string[];
}

/**
 * Generate contextual stories about what points are worth in real-world terms
 */
export async function generateContextualStories(
  points: number,
  program: LoyaltyProgram
): Promise<StorytellerResponse> {
  try {
    if (!process.env.OPENAI_API_KEY) {
      console.warn("No OpenAI API key provided. Using fallback response.");
      return generateFallbackResponse(points, program);
    }

    // Calculate approximate dollar value based on the program
    const dollarValue = calculateDollarValue(points, program);

    const prompt = `
      I have ${points} ${program} loyalty points, which is worth approximately $${dollarValue} USD.
      
      Create a response in JSON format that gives me 3-5 contextual examples of what I could purchase or redeem with these points.
      Group them into categories like "Travel", "Dining", "Shopping", "Experiences", or "Subscriptions".
      
      For each category:
      1. Provide a brief description of what these points could get me in this category
      2. List 2-3 specific, realistic examples with details
      
      The examples should be accurate for the ${program} program and the dollar value.
      
      Format the response as a JSON object with the following structure:
      {
        "stories": [
          {
            "category": "Category name",
            "description": "Brief description of what points can get in this category",
            "examples": ["Example 1", "Example 2", "Example 3"]
          }
        ],
        "dollarValue": "$X.XX"
      }
    `;

    const response = await openai.chat.completions.create({
      model: OPENAI_MODEL,
      messages: [
        {
          role: "system",
          content: "You are a loyalty points expert that helps users understand the real-world value of their loyalty points.",
        },
        {
          role: "user",
          content: prompt,
        },
      ],
      response_format: { type: "json_object" },
      temperature: 0.7,
    });

    // Parse and return the response
    if (!response.choices[0].message.content) {
      console.warn("No content in OpenAI response, using fallback");
      return generateFallbackResponse(points, program);
    }
    
    try {
      const result = JSON.parse(response.choices[0].message.content) as StorytellerResponse;
      
      // Validate response structure
      if (!result.stories || !Array.isArray(result.stories) || result.stories.length === 0) {
        console.warn("Invalid response structure from OpenAI, using fallback");
        return generateFallbackResponse(points, program);
      }
      
      // Ensure dollar value is properly formatted
      result.dollarValue = `$${dollarValue.toFixed(2)}`;
      
      return result;
    } catch (parseError) {
      console.error("Error parsing OpenAI response:", parseError);
      return generateFallbackResponse(points, program);
    }
  } catch (error) {
    console.error("Error generating contextual stories:", error);
    return generateFallbackResponse(points, program);
  }
}

/**
 * Calculate the dollar value of points based on the loyalty program
 */
function calculateDollarValue(points: number, program: LoyaltyProgram): number {
  // Standard rates for point values in USD dollars (from our database of exchange rates)
  const rates: Record<LoyaltyProgram, number> = {
    XPOINTS: 0.01, // 1 cent per point (our base rate)
    QANTAS: 0.015,
    GYG: 0.005,
    VELOCITY: 0.02,
    AMEX: 0.015,
    FLYBUYS: 0.005,
    HILTON: 0.005,
    MARRIOTT: 0.007,
    AIRBNB: 0.01,
    DELTA: 0.012
  };

  return points * (rates[program] || 0.01); // Default to 1 cent if program not found
}

/**
 * Generate a fallback response when the API is unavailable
 */
function generateFallbackResponse(points: number, program: LoyaltyProgram): StorytellerResponse {
  const dollarValue = calculateDollarValue(points, program);
  
  // Create a reasonable fallback based on the program
  const response: StorytellerResponse = {
    dollarValue: `$${dollarValue.toFixed(2)}`,
    stories: []
  };

  if (program === 'QANTAS' || program === 'VELOCITY' || program === 'DELTA') {
    // Airline programs
    response.stories = [
      {
        category: "Travel",
        description: `Your ${points} ${program} points have a value of approximately $${dollarValue.toFixed(2)}, which can be used for flights, upgrades, or travel experiences.`,
        examples: [
          "Economy flights for short domestic routes",
          "Partial payment toward a premium cabin upgrade",
          "Airport lounge access passes"
        ]
      },
      {
        category: "Shopping",
        description: `Use your points to shop through the ${program} store for merchandise or gift cards.`,
        examples: [
          "Electronics like headphones or portable chargers",
          "Kitchen appliances",
          "Brand-name gift cards"
        ]
      }
    ];
  } else if (program === 'HILTON' || program === 'MARRIOTT' || program === 'AIRBNB') {
    // Hotel/accommodation programs
    response.stories = [
      {
        category: "Accommodations",
        description: `Your ${points} ${program} points are worth about $${dollarValue.toFixed(2)} and can help cover stays at various properties.`,
        examples: [
          "One night at a standard property",
          "Partial payment toward a premium room",
          "Room upgrades or late check-out perks"
        ]
      },
      {
        category: "Experiences",
        description: `${program} points can also be used for exclusive experiences and services.`,
        examples: [
          "Spa treatments at select properties",
          "Dining credits at hotel restaurants",
          "Local activities and excursions"
        ]
      }
    ];
  } else {
    // Generic fallback for other programs
    response.stories = [
      {
        category: "Shopping",
        description: `Your ${points} ${program} points are worth approximately $${dollarValue.toFixed(2)} in shopping value.`,
        examples: [
          "Gift cards for popular retailers",
          "Electronics and gadgets",
          "Home goods and appliances"
        ]
      },
      {
        category: "Entertainment",
        description: `Redeem your points for entertainment options and experiences.`,
        examples: [
          "Movie tickets or streaming subscriptions",
          "Concert or event tickets",
          "Magazine or digital content subscriptions"
        ]
      }
    ];
  }

  return response;
}