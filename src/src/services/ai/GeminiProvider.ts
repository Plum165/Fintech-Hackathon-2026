import { GoogleGenAI, Type } from "@google/genai";
import { AIProvider } from "./AIProvider";

export class GeminiProvider implements AIProvider {
  name = "gemini";
  private ai: GoogleGenAI;
  private modelName = "gemini-3.5-flash";

  constructor() {
    const apiKey = process.env.GEMINI_API_KEY || "";
    this.ai = new GoogleGenAI({
      apiKey: apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        }
      }
    });
  }

  async generateText(prompt: string, systemInstruction?: string): Promise<string> {
    try {
      const response = await this.ai.models.generateContent({
        model: this.modelName,
        contents: prompt,
        config: systemInstruction ? { systemInstruction } : undefined,
      });

      return response.text || "No response received.";
    } catch (e) {
      console.error("Gemini text generation failed:", e);
      throw e;
    }
  }

  async generateJson<T>(prompt: string, schema: any, systemInstruction?: string): Promise<T> {
    try {
      // Map simple schema structures into Gemini Type structures if needed
      // To keep it simple, we use Type.OBJECT and set responseMimeType
      const response = await this.ai.models.generateContent({
        model: this.modelName,
        contents: prompt,
        config: {
          systemInstruction,
          responseMimeType: "application/json",
          responseSchema: schema
        }
      });

      const text = response.text || "{}";
      return JSON.parse(text) as T;
    } catch (e) {
      console.error("Gemini JSON generation failed:", e);
      throw e;
    }
  }
}
