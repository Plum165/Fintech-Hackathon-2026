import { getOPClient, isOPConfigured } from './client.js';
import { GrantService } from './GrantService.js';
import { WalletService } from './WalletService.js';

const QUOTE_ACCESS = [
  { type: 'quote' as const, actions: ['create' as const, 'read' as const] }
];

export interface OPQuote {
  id: string;
  debitAmount: { value: string; assetCode: string; assetScale: number };
  receiveAmount: { value: string; assetCode: string; assetScale: number };
  expiresAt?: string;
}

export class QuoteService {
  /**
   * Create a quote on the server's wallet to price a payment.
   */
  static async create(
    incomingPaymentId: string,
    debitAmountHuman: number,
    assetCode: string,
    assetScale: number
  ): Promise<OPQuote> {
    if (!isOPConfigured()) {
      const scale = assetScale;
      const rate = assetCode === 'USD' ? 18.5 : 1.0;
      return {
        id: `https://ilp.interledger-test.dev/quotes/sim_${Math.random().toString(36).substr(2, 9)}`,
        debitAmount: {
          value: Math.round(debitAmountHuman * Math.pow(10, scale)).toString(),
          assetCode,
          assetScale: scale
        },
        receiveAmount: {
          value: Math.round(debitAmountHuman * rate * Math.pow(10, scale)).toString(),
          assetCode,
          assetScale: scale
        },
        expiresAt: new Date(Date.now() + 10 * 60 * 1000).toISOString()
      };
    }

    const serverWallet = await WalletService.getServerWallet();
    const token = await GrantService.requestNonInteractive(serverWallet.authServer, QUOTE_ACCESS);
    const valueString = Math.round(debitAmountHuman * Math.pow(10, assetScale)).toString();

    const client = await getOPClient();
    const quote = await client.quote.create(
      { url: serverWallet.resourceServer, accessToken: token },
      {
        walletAddress: serverWallet.id,
        receiver: incomingPaymentId,
        method: 'ilp',
        debitAmount: { value: valueString, assetCode, assetScale }
      }
    );
    console.log('[QuoteService] Quote created:', quote.id);
    return {
      id: quote.id,
      debitAmount: quote.debitAmount,
      receiveAmount: quote.receiveAmount,
      expiresAt: quote.expiresAt
    };
  }
}
