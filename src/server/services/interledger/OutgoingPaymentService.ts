import { getOPClient, isOPConfigured } from './client.js';
import { GrantService, type PendingInteractiveGrant } from './GrantService.js';
import { WalletService } from './WalletService.js';

export interface OutgoingPaymentResult {
  id: string;
  failed: boolean;
  debitAmount: { value: string; assetCode: string; assetScale: number };
  receiveAmount: { value: string; assetCode: string; assetScale: number };
}

export class OutgoingPaymentService {
  /**
   * Step 1 of the send flow: request the interactive outgoing-payment grant.
   */
  static async initiateGrant(
    debitAmountHuman: number,
    assetCode: string,
    assetScale: number
  ): Promise<PendingInteractiveGrant> {
    const serverWallet = await WalletService.getServerWallet();

    const valueString = Math.round(
      debitAmountHuman * Math.pow(10, assetScale)
    ).toString();

    return GrantService.requestInteractive(
      serverWallet.authServer,
      [
        {
          type: 'outgoing-payment' as const,
          actions: ['create' as const, 'read' as const],
          identifier: serverWallet.id,
          limits: {
            debitAmount: { value: valueString, assetCode, assetScale }
          }
        }
      ]
    );
  }

  /**
   * Step 2 of the send flow: finalise the grant and execute the outgoing payment.
   */
  static async execute(
    continueUri: string,
    continueToken: string,
    quoteId: string,
    description?: string
  ): Promise<OutgoingPaymentResult> {
    if (!isOPConfigured() || continueUri.startsWith('sim://')) {
      return {
        id: `https://ilp.interledger-test.dev/outgoing-payments/sim_${Math.random().toString(36).substr(2, 9)}`,
        failed: false,
        debitAmount: { value: '0', assetCode: 'ZAR', assetScale: 2 },
        receiveAmount: { value: '0', assetCode: 'ZAR', assetScale: 2 }
      };
    }

    console.log('[OutgoingPaymentService.execute] Continuing grant:', continueUri);
    const accessToken = await GrantService.continueGrant(continueUri, continueToken);
    console.log('[OutgoingPaymentService.execute] Grant continued, creating outgoing payment');

    const serverWallet = await WalletService.getServerWallet();

    const client = await getOPClient();
    const paymentInput: Record<string, unknown> = { walletAddress: serverWallet.id, quoteId };
    if (description) paymentInput.metadata = { description };

    const payment = await client.outgoingPayment.create(
      { url: serverWallet.resourceServer, accessToken },
      paymentInput as Parameters<typeof client.outgoingPayment.create>[1]
    );
    console.log('[OutgoingPaymentService.execute] Payment created:', payment.id, 'failed:', payment.failed);
    return {
      id: payment.id,
      failed: payment.failed ?? false,
      debitAmount: payment.debitAmount,
      receiveAmount: payment.receiveAmount
    };
  }
}
