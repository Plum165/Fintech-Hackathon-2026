import { Database } from '../../db';
import { Quote } from '../../../src/types';

export class QuoteService {
  /**
   * Generates transaction ratios and exchange quotes
   */
  static async createQuote(
    sourcePointer: string,
    destinationPointer: string,
    amount: number,
    currency: string
  ): Promise<Quote> {
    const db = Database.read();
    
    // Simple exchange calculation (e.g. if transferring USD -> ZAR or similar)
    // Here we support ZAR primarily. Let's say if it is different, simulate standard rates.
    let rate = 1.0;
    if (currency.toUpperCase() === 'USD') {
      rate = 18.50; // 1 USD = 18.50 ZAR
    }
    
    const destAmount = amount * rate;
    const quoteId = 'qte_' + Math.random().toString(36).substr(2, 9);
    
    const newQuote: Quote = {
      id: quoteId,
      source: sourcePointer,
      destination: destinationPointer,
      sourceAmount: amount,
      destinationAmount: destAmount,
      expiry: new Date(Date.now() + 600000).toISOString() // Valid for 10 minutes
    };
    
    db.quotes.push(newQuote);
    Database.write(db);
    Database.log('QUOTE_GENERATED', `Quote ${quoteId} negotiated. Source: R ${amount} -> Dest: R ${destAmount}.`);
    
    return newQuote;
  }

  /**
   * Fetches quote by ID
   */
  static async getQuote(quoteId: string): Promise<Quote | null> {
    const db = Database.read();
    const quote = db.quotes.find(q => q.id === quoteId);
    return quote || null;
  }
}
