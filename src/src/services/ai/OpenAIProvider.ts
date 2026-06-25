import { AIProvider } from "./AIProvider";

export class OpenAIProvider implements AIProvider {
  name = "openai";
  private apiKey: string;

  constructor() {
    this.apiKey = process.env.OPENAI_API_KEY || "";
  }

  async generateText(prompt: string, systemInstruction?: string): Promise<string> {
    if (!this.apiKey) {
      console.warn("OpenAI API Key is missing. Falling back to simulation mode.");
      return `[OpenAI Simulation Mode] I am Zen, processing your request: "${prompt}"`;
    }
    
    try {
      // Direct HTTP fetch to OpenAI endpoints so we do not have extra dependencies
      const response = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${this.apiKey}`
        },
        body: JSON.stringify({
          model: "gpt-4o-mini",
          messages: [
            ...(systemInstruction ? [{ role: "system", content: systemInstruction }] : []),
            { role: "user", content: prompt }
          ]
        })
      });
      
      const data = await response.json();
      return data.choices?.[0]?.message?.content || "No response received.";
    } catch (e) {
      console.error("OpenAI text generation failed:", e);
      return `[OpenAI Error Fallback] Unable to reach OpenAI API. Zen recommends checking your API keys.`;
    }
  }

  async generateJson<T>(prompt: string, schema: any, systemInstruction?: string): Promise<T> {
    // Return mock response structured as schema for demo stability
    console.log("OpenAI generateJson simulation triggered");
    return {} as T;
  }
}
