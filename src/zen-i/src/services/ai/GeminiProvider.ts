import { GoogleGenAI, Type } from "@google/genai";
import { AIProvider } from "./AIProvider";

export class GeminiProvider implements AIProvider {
  name = "gemini";
  private ai: GoogleGenAI;
  private modelNames = ["gemini-3.5-flash", "gemini-3.1-flash-lite", "gemini-flash-latest"];

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
    let lastError: any = null;
    for (const model of this.modelNames) {
      try {
        const response = await this.ai.models.generateContent({
          model: model,
          contents: prompt,
          config: systemInstruction ? { systemInstruction } : undefined,
        });

        if (response.text) {
          return response.text;
        }
      } catch (e: any) {
        console.warn(`Gemini text generation failed for model ${model}:`, e);
        lastError = e;
      }
    }

    console.error("All Gemini text generation models failed. Using offline fallback.", lastError);
    if (prompt.toLowerCase().includes("budget") || prompt.toLowerCase().includes("transaction") || prompt.toLowerCase().includes("limits")) {
      return "Zenny is currently meditating in the bamboo grove, but here is a wise tip: Keeping a steady buffer in your Reserve savings bucket and paying off your BNPL splits on time are the fastest ways to elevate your Interledger Confidence Score! 🐼";
    }
    return "Zenny is currently offline meditating! 🐼 Remember to keep your spending within your budget limits and build a small savings buffer. Let me know if you would like me to try recalculating again in a moment!";
  }

  async generateJson<T>(prompt: string, schema: any, systemInstruction?: string): Promise<T> {
    let lastError: any = null;
    for (const model of this.modelNames) {
      try {
        const response = await this.ai.models.generateContent({
          model: model,
          contents: prompt,
          config: {
            systemInstruction,
            responseMimeType: "application/json",
            responseSchema: schema
          }
        });

        const text = response.text || "{}";
        return JSON.parse(text) as T;
      } catch (e: any) {
        console.warn(`Gemini JSON generation failed for model ${model}:`, e);
        lastError = e;
      }
    }

    console.error("All Gemini JSON generation models failed. Using offline fallback.", lastError);
    return { category: "General" } as unknown as T;
  }
}
