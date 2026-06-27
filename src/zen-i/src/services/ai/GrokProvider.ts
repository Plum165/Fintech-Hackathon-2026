import { AIProvider } from "./AIProvider";

export class GrokProvider implements AIProvider {
  name = "grok";
  private apiKey: string;

  constructor() {
    this.apiKey = process.env.GROK_API_KEY || "";
  }

  async generateText(prompt: string, systemInstruction?: string): Promise<string> {
    if (!this.apiKey) {
      console.warn("Grok API Key is missing. Falling back to simulation mode.");
      return `[Grok Simulation Mode] Hello! I am Zenny the Grok chatbot. You asked: "${prompt}"`;
    }

    try {
      const response = await fetch("https://api.x.ai/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${this.apiKey}`
        },
        body: JSON.stringify({
          model: "grok-2-latest",
          messages: [
            ...(systemInstruction ? [{ role: "system", content: systemInstruction }] : []),
            { role: "user", content: prompt }
          ]
        })
      });

      const data = await response.json();
      return data.choices?.[0]?.message?.content || "No response received.";
    } catch (e) {
      console.error("Grok text generation failed:", e);
      return `[Grok Error Fallback] Unable to reach Grok API. Zenny recommends checking your secrets.`;
    }
  }

  async generateJson<T>(prompt: string, schema: any, systemInstruction?: string): Promise<T> {
    console.log("Grok generateJson simulation triggered");
    return {} as T;
  }
}
