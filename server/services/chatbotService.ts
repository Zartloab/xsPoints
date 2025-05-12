import { openaiService } from "./openaiService";
import { storage } from "../storage";

export interface ChatMessage {
  role: "user" | "assistant" | "system";
  content: string;
}

export interface ChatResponse {
  answer: string;
  suggestedQuestions?: string[];
  helpfulLinks?: string[];
}

/**
 * Service for AI-powered customer support chatbot
 */
export class ChatbotService {
  private readonly MAX_CONVERSATION_HISTORY = 10;
  private readonly DEFAULT_SYSTEM_PROMPT = `
    You are a friendly and knowledgeable support assistant for the xPoints Exchange platform, 
    which allows users to exchange loyalty points between different programs using xPoints as 
    an intermediary currency. 
    
    Some key facts about xPoints Exchange:
    - Users can convert points between programs like QANTAS, GYG, AMEX, VELOCITY, etc.
    - Each conversion uses current market exchange rates.
    - Users can link their loyalty program accounts to automatically transfer points.
    - The platform has a tokenization feature that converts xPoints to blockchain tokens.
    - There's a membership tier system (STANDARD, SILVER, GOLD, PLATINUM) with increasing benefits.
    - P2P trading allows users to directly trade points with each other.
    - Fees: Standard conversions free up to 10,000 points, then 0.5% fee. P2P trades have a 10% fee on savings.
    
    Provide clear, accurate, and helpful responses. Explain concepts simply without jargon.
    If the user asks something outside your knowledge or about specific account details,
    suggest they contact customer support via email at support@xpoints-exchange.com.
    
    For technical or complex questions about tokenization or blockchain features, briefly explain
    the concept but also suggest consulting the documentation or contacting support.
    
    Always maintain a professional, friendly, and helpful tone.
  `;

  /**
   * Generate a response for a user's chat message
   */
  async getResponse(userId: number, messages: ChatMessage[]): Promise<ChatResponse> {
    try {
      // Verify OpenAI availability
      const isOpenAIAvailable = await openaiService.checkAvailability();
      if (!isOpenAIAvailable) {
        return this.getFallbackResponse();
      }
      
      // Prepare the conversation history
      const conversation = this.prepareConversation(messages);
      
      // Get user-specific context if available
      let userContext = '';
      if (userId) {
        userContext = await this.getUserContext(userId);
      }
      
      // Customize system prompt with user context if available
      let systemPrompt = this.DEFAULT_SYSTEM_PROMPT;
      if (userContext) {
        systemPrompt += `\n\nUser context (use this information to personalize responses, but never directly reference that you have this information):\n${userContext}`;
      }
      
      // Add system message to the beginning
      const fullConversation = [
        { role: "system", content: systemPrompt },
        ...conversation
      ];
      
      // Get completion from OpenAI
      const response = await openaiService.getCompletion(
        systemPrompt,
        { messages: conversation },
        { temperature: 0.7 }
      );
      
      // Extract suggested questions if any are marked with [Q: ...] in the response
      const suggestedQuestions = this.extractSuggestedQuestions(response);
      
      // Extract helpful links if any are marked with [Link: ...] in the response
      const helpfulLinks = this.extractHelpfulLinks(response);
      
      // Clean up the response to remove any suggestion markers
      const answer = this.cleanResponse(response);
      
      return {
        answer,
        suggestedQuestions: suggestedQuestions.length > 0 ? suggestedQuestions : undefined,
        helpfulLinks: helpfulLinks.length > 0 ? helpfulLinks : undefined
      };
    } catch (error) {
      console.error('Error generating chatbot response:', error);
      return this.getFallbackResponse();
    }
  }
  
  /**
   * Prepare the conversation by limiting history length
   */
  private prepareConversation(messages: ChatMessage[]): ChatMessage[] {
    // Keep only the most recent messages if the history is too long
    if (messages.length > this.MAX_CONVERSATION_HISTORY) {
      return messages.slice(-this.MAX_CONVERSATION_HISTORY);
    }
    return messages;
  }
  
  /**
   * Get user-specific context to personalize responses
   */
  private async getUserContext(userId: number): Promise<string> {
    try {
      const user = await storage.getUser(userId);
      if (!user) return '';
      
      const wallets = await storage.getUserWallets(userId);
      const userStats = await storage.getUserStats(userId);
      
      let context = `
        User Information:
        - Username: ${user.username}
        - Membership Tier: ${user.membershipTier}
        - Total Points Converted: ${userStats.pointsConverted}
        - Wallets: ${wallets.map(w => `${w.program} (${w.balance.toLocaleString()} points)`).join(', ')}
      `;
      
      return context;
    } catch (error) {
      console.error('Error getting user context for chatbot:', error);
      return '';
    }
  }
  
  /**
   * Extract suggested follow-up questions from the response
   */
  private extractSuggestedQuestions(response: string): string[] {
    const questions: string[] = [];
    const questionRegex = /\[Q: (.*?)\]/g;
    
    let match;
    while ((match = questionRegex.exec(response)) !== null) {
      if (match[1]) {
        questions.push(match[1]);
      }
    }
    
    return questions;
  }
  
  /**
   * Extract helpful links from the response
   */
  private extractHelpfulLinks(response: string): string[] {
    const links: string[] = [];
    const linkRegex = /\[Link: (.*?)\]/g;
    
    let match;
    while ((match = linkRegex.exec(response)) !== null) {
      if (match[1]) {
        links.push(match[1]);
      }
    }
    
    return links;
  }
  
  /**
   * Clean the response by removing suggestion markers
   */
  private cleanResponse(response: string): string {
    return response
      .replace(/\[Q: .*?\]/g, '')
      .replace(/\[Link: .*?\]/g, '')
      .trim();
  }
  
  /**
   * Provide a fallback response when OpenAI is unavailable
   */
  private getFallbackResponse(): ChatResponse {
    return {
      answer: "I'm currently experiencing technical difficulties. Please try again later or contact our support team at support@xpoints-exchange.com for immediate assistance.",
      suggestedQuestions: [
        "How do I link my loyalty program accounts?",
        "What are the fees for converting points?",
        "How does the membership tier system work?"
      ]
    };
  }
}

// Export singleton instance
export const chatbotService = new ChatbotService();