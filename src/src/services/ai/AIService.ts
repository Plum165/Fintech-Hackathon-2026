import { AIProvider } from "./AIProvider";
import { GeminiProvider } from "./GeminiProvider";
import { OpenAIProvider } from "./OpenAIProvider";
import { GrokProvider } from "./GrokProvider";
import { Transaction } from "../../types";

export class AIService {
  private static provider: AIProvider | null = null;

  static getProvider(): AIProvider {
    if (this.provider) return this.provider;

    const providerName = (process.env.AI_PROVIDER || 'gemini').toLowerCase();
    console.log(`Initializing AI Provider: ${providerName}`);

    switch (providerName) {
      case 'openai':
        this.provider = new OpenAIProvider();
        break;
      case 'grok':
        this.provider = new GrokProvider();
        break;
      case 'gemini':
      default:
        this.provider = new GeminiProvider();
        break;
    }

    return this.provider;
  }

  /**
   * Automatically categorizes transaction details
   */
  static async autoCategorizeTransaction(description: string, amount: number): Promise<string> {
    try {
      const provider = this.getProvider();
      
      // Define schema using standard types
      const schema = {
        type: "OBJECT",
        properties: {
          category: {
            type: "STRING",
            description: "Choose one exact value: 'Food', 'Transport', 'Tech', 'Savings', or 'General'"
          }
        },
        required: ["category"]
      };

      const systemInstruction = "You are an automated transaction categorization agent.";
      const prompt = `Categorize a transaction with description: "${description}" and amount: ${amount}. Return JSON matching the schema.`;
      
      const result = await provider.generateJson<{ category: string }>(prompt, schema, systemInstruction);
      return result?.category || "General";
    } catch (e) {
      console.warn("AI categorization failed, using fallback 'General':", e);
      return "General";
    }
  }

  /**
   * Generate customized advice from Zenny 🦊
   */
  static async getBudgetAdvice(transactions: Transaction[], currentBudgets: any[]): Promise<string> {
    try {
      const provider = this.getProvider();
      const prompt = `Here are the active transactions: ${JSON.stringify(transactions)}.
Here are the active categories and limits: ${JSON.stringify(currentBudgets)}.
Provide personal budget advice in 2 clear sentences. Keep the tone friendly, encouraging, and write in the persona of Zenny, the wise fox mascot of ZenPay 🦊. Use "R" for currency symbol.`;

      const instruction = "You are Zenny, the fintech companion mascot. You speak directly to the user.";
      const advice = await provider.generateText(prompt, instruction);
      return advice;
    } catch (e) {
      console.error("AI budget advice generation failed:", e);
      return "Zenny recommends saving more and checking your subscription limits!";
    }
  }
}
