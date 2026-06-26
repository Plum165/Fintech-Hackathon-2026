import { getOPClient, isOPConfigured } from './client.js';
import { GrantService } from './GrantService.js';
import { WalletService } from './WalletService.js';

const INCOMING_ACCESS = [
  { type: 'incoming-payment' as const, actions: ['create' as const, 'read' as const, 'complete' as const] }
];

export interface CreatedIncomingPayment {
  id: string;
  paymentUrl: string;
  expiresAt?: string;
}

export class IncomingPaymentService {
  /**
   * Create an incoming payment on a wallet with a fixed receive amount.
   *
   * @param walletPointerOrUrl - The target wallet ($ pointer or https URL)
   * @param amount             - Human-readable amount (e.g. 10.00 for R10)
   * @param assetCode          - e.g. "ZAR"
   * @param assetScale         - Decimal places (2 for ZAR/USD)
   */
  static async create(
    walletPointerOrUrl: string,
    amount: number,
    assetCode: string,
    assetScale: number
  ): Promise<CreatedIncomingPayment> {
    const walletUrl = walletPointerOrUrl.startsWith('$')
      ? WalletService.toUrl(walletPointerOrUrl)
      : walletPointerOrUrl;

    if (!isOPConfigured()) {
      const id = `https://ilp.interledger-test.dev/incoming-payments/sim_${Math.random().toString(36).substr(2, 9)}`;
      return { id, paymentUrl: id };
    }

    const walletInfo = await WalletService.discover(walletUrl);
    const token = await GrantService.requestNonInteractive(walletInfo.authServer, INCOMING_ACCESS);
    const client = await getOPClient();

    const valueString = Math.round(amount * Math.pow(10, assetScale)).toString();

    const payment = await client.incomingPayment.create(
      { url: walletInfo.resourceServer, accessToken: token },
      {
        walletAddress: walletInfo.id,
        incomingAmount: { value: valueString, assetCode, assetScale }
      }
    );

    return { id: payment.id, paymentUrl: payment.id, expiresAt: payment.expiresAt };
  }

  /**
   * Create an open-ended incoming payment (no fixed amount).
   * Used when the sender controls how much to send (fixed-send / quote flow).
   */
  static async createOpen(walletPointerOrUrl: string): Promise<CreatedIncomingPayment> {
    const walletUrl = walletPointerOrUrl.startsWith('$')
      ? WalletService.toUrl(walletPointerOrUrl)
      : walletPointerOrUrl;

    if (!isOPConfigured()) {
      const id = `https://ilp.interledger-test.dev/incoming-payments/sim_open_${Math.random().toString(36).substr(2, 9)}`;
      return { id, paymentUrl: id };
    }

    const walletInfo = await WalletService.discover(walletUrl);
    const token = await GrantService.requestNonInteractive(walletInfo.authServer, INCOMING_ACCESS);
    const client = await getOPClient();

    const payment = await client.incomingPayment.create(
      { url: walletInfo.resourceServer, accessToken: token },
      { walletAddress: walletInfo.id }
    );

    return { id: payment.id, paymentUrl: payment.id, expiresAt: payment.expiresAt };
  }
}
