import { GoogleGenAI, Chat, GenerateContentResponse } from "@google/genai";
import { SYSTEM_INSTRUCTION } from '../constants';

// Initialize the client once. 
// API Key is strictly from process.env.API_KEY per instructions.
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export class GeminiService {
  private chat: Chat | null = null;
  private modelId: string;
  private isGroundingEnabled: boolean = false;

  constructor(modelId: string) {
    this.modelId = modelId;
    this.initChat();
  }

  private initChat() {
    const config: any = {
      systemInstruction: SYSTEM_INSTRUCTION,
    };

    if (this.isGroundingEnabled) {
      config.tools = [{ googleSearch: {} }];
    }

    this.chat = ai.chats.create({
      model: this.modelId,
      config,
    });
  }

  public updateModel(newModelId: string) {
    this.modelId = newModelId;
    // When model changes, we effectively start a new chat session context
    this.initChat();
  }

  public setGrounding(enabled: boolean) {
    this.isGroundingEnabled = enabled;
    // Re-initialize chat to apply tool changes
    this.initChat();
  }

  /**
   * Sends a message to the model and yields chunks of text and metadata as they stream in.
   */
  public async *sendMessageStream(
    text: string, 
    imageParts?: { inlineData: { data: string; mimeType: string } }[]
  ): AsyncGenerator<{ text: string; groundingMetadata?: any }, void, unknown> {
    if (!this.chat) {
      this.initChat();
    }

    try {
      let result;
      
      // If we have images, we can't use simple chat.sendMessageStream with just a string
      if (imageParts && imageParts.length > 0) {
        // Construct the content parts
        const parts: any[] = [...imageParts, { text }];
        
        result = await this.chat!.sendMessageStream({ 
           message: parts
        });
      } else {
        result = await this.chat!.sendMessageStream({
          message: text
        });
      }

      for await (const chunk of result) {
        // Cast to GenerateContentResponse to safely access .text and metadata
        const responseChunk = chunk as GenerateContentResponse;
        yield {
          text: responseChunk.text || '',
          groundingMetadata: responseChunk.candidates?.[0]?.groundingMetadata
        };
      }
    } catch (error) {
      console.error("Gemini API Error:", error);
      throw error;
    }
  }
}