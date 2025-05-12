import OpenAI from "openai";
import { config } from "../config";

// Initialize OpenAI client
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

/**
 * Central OpenAI service to handle various AI functions across the platform
 */
export class OpenAIService {
  /**
   * Generic method to get a completion from OpenAI
   */
  async getCompletion(
    systemPrompt: string,
    userPrompt: string | object,
    options: {
      model?: string;
      temperature?: number;
      responseFormat?: 'text' | 'json_object';
      maxTokens?: number;
    } = {}
  ) {
    try {
      // Set default options
      const model = options.model || "gpt-4o"; // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
      const temperature = options.temperature !== undefined ? options.temperature : 0.3;
      const maxTokens = options.maxTokens || undefined;
      
      const messages = [
        { role: "system", content: systemPrompt },
        { 
          role: "user", 
          content: typeof userPrompt === 'string' ? userPrompt : JSON.stringify(userPrompt) 
        }
      ];
      
      const requestOptions: any = {
        model,
        messages,
        temperature,
        max_tokens: maxTokens,
      };
      
      // Add response format if specified
      if (options.responseFormat === 'json_object') {
        requestOptions.response_format = { type: "json_object" };
      }
      
      console.log(`Making OpenAI request to model: ${model}`);
      
      const response = await openai.chat.completions.create(requestOptions);
      
      const content = response.choices[0].message.content;
      if (!content) {
        throw new Error('No response content from OpenAI');
      }
      
      // Parse JSON if that's the expected format
      if (options.responseFormat === 'json_object') {
        return JSON.parse(content);
      }
      
      return content;
    } catch (error) {
      console.error('Error calling OpenAI:', error);
      throw error;
    }
  }
  
  /**
   * Process an image with OpenAI's vision capabilities
   */
  async analyzeImage(
    base64Image: string,
    prompt: string,
    options: {
      model?: string;
      maxTokens?: number;
      temperature?: number;
    } = {}
  ) {
    try {
      const model = options.model || "gpt-4o"; // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
      const temperature = options.temperature !== undefined ? options.temperature : 0.3;
      const maxTokens = options.maxTokens || 500;
      
      const response = await openai.chat.completions.create({
        model,
        messages: [
          {
            role: "user",
            content: [
              {
                type: "text",
                text: prompt
              },
              {
                type: "image_url",
                image_url: {
                  url: `data:image/jpeg;base64,${base64Image}`
                }
              }
            ],
          },
        ],
        max_tokens: maxTokens,
        temperature,
      });
      
      return response.choices[0].message.content;
    } catch (error) {
      console.error('Error analyzing image:', error);
      throw error;
    }
  }
  
  /**
   * Generate an image with DALL-E
   */
  async generateImage(
    prompt: string,
    options: {
      size?: "1024x1024" | "1792x1024" | "1024x1792";
      quality?: "standard" | "hd";
      n?: number;
    } = {}
  ) {
    try {
      const size = options.size || "1024x1024";
      const quality = options.quality || "standard";
      const n = options.n || 1;
      
      const response = await openai.images.generate({
        model: "dall-e-3",
        prompt,
        n,
        size,
        quality,
      });
      
      if (!response.data) {
        throw new Error('No image data returned from OpenAI');
      }
      
      return response.data.map(image => ({ url: image.url || '' }));
    } catch (error) {
      console.error('Error generating image:', error);
      throw error;
    }
  }
  
  /**
   * Check if OpenAI API is available and functioning
   */
  async checkAvailability(): Promise<boolean> {
    try {
      if (!process.env.OPENAI_API_KEY) {
        console.log('No OpenAI API key found');
        return false;
      }
      
      // Simple test request
      const response = await this.getCompletion(
        "You are a test system. Respond with 'OK' only.",
        "Test",
        { maxTokens: 10 }
      );
      
      return !!response;
    } catch (error) {
      console.error('OpenAI service unavailable:', error);
      return false;
    }
  }
}

// Export singleton instance
export const openaiService = new OpenAIService();