import { GoogleGenAI } from '@google/genai';
import type { Transaction, BudgetCategory } from '../types.js';

let _genAI: GoogleGenAI | null = null;

function getGenAI(): GoogleGenAI {
  if (!_genAI) {
    const key = process.env.GEMINI_API_KEY;
    if (!key) throw new Error('GEMINI_API_KEY is not set.');
    _genAI = new GoogleGenAI({ apiKey: key });
  }
  return _genAI;
}

export class AIService {
  static async generateText(prompt: string, systemInstruction: string): Promise<string> {
    const ai = getGenAI();
    const response = await ai.models.generateContent({
      model: 'gemini-2.0-flash',
      contents: prompt,
      config: { systemInstruction }
    });
    return response.text ?? '';
  }

  static async autoCategorizeTransaction(
    description: string,
    amount: number
  ): Promise<string> {
    try {
      const prompt = `Categorise this transaction. Description: "${description}", Amount: ${amount}.
Reply with exactly one word from: Food, Transport, Tech, Savings, General.`;
      const instruction = 'You are an automated transaction categorisation agent. Reply with one word only.';
      const result = await this.generateText(prompt, instruction);
      const word = result.trim().split(/\s+/)[0];
      const valid = ['Food', 'Transport', 'Tech', 'Savings', 'General'];
      return valid.includes(word) ? word : 'General';
    } catch {
      return 'General';
    }
  }

  static async getBudgetAdvice(
    transactions: Transaction[],
    budgets: BudgetCategory[]
  ): Promise<string> {
    try {
      const prompt = `Transactions: ${JSON.stringify(transactions.slice(0, 10))}.
Budget categories: ${JSON.stringify(budgets)}.
Give two friendly sentences of budget advice as Zen, the PandaPay panda mascot. Use "R" for currency.`;
      const instruction = 'You are Zen, the friendly PandaPay financial panda. Be brief and encouraging.';
      return await this.generateText(prompt, instruction);
    } catch {
      return 'Zen recommends keeping an eye on your spending limits and building your savings reserve!';
    }
  }

  static async chatResponse(
    message: string,
    walletBalance: number,
    walletPointer: string,
    budgets: BudgetCategory[],
    recentTx: Transaction[]
  ): Promise<string> {
    const instruction = `You are Zen, the helpful financial panda mascot of PandaPay 🐼.
Wallet balance: R ${walletBalance.toFixed(2)}. Pointer: ${walletPointer}.
Budgets: ${JSON.stringify(budgets)}. Recent payments: ${JSON.stringify(recentTx)}.
Answer in 3 sentences max. Be cheerful and supportive. Do not mention file paths or technical internals.`;
    return this.generateText(message, instruction);
  }
}
