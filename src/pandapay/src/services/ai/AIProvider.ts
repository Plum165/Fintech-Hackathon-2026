export interface AIProvider {
  name: string;
  generateText(prompt: string, systemInstruction?: string): Promise<string>;
  generateJson<T>(prompt: string, schema: any, systemInstruction?: string): Promise<T>;
}
