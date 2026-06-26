import {
  isPendingGrant,
  isFinalizedGrant,
  type AccessItem,
} from '@interledger/open-payments';
import { getOPClient, isOPConfigured } from './client.js';

export interface PendingInteractiveGrant {
  approvalUrl: string;
  continueUri: string;
  continueToken: string;
}

export class GrantService {
  /**
   * Request a NON-INTERACTIVE grant (incoming payments, quotes).
   * Returns the raw access token string.
   *
   * Falls back to a placeholder token when OP is not configured.
   */
  static async requestNonInteractive(
    authServerUrl: string,
    access: AccessItem[]
  ): Promise<string> {
    if (!isOPConfigured()) {
      return 'sim_token_' + Math.random().toString(36).substr(2, 12);
    }

    const client = await getOPClient();
    const grant = await client.grant.request(
      { url: authServerUrl },
      { access_token: { access } }
    );

    if (isPendingGrant(grant) || !isFinalizedGrant(grant)) {
      throw new Error('Expected a non-interactive grant but got an interactive one.');
    }

    return grant.access_token.value;
  }

  /**
   * Request an INTERACTIVE grant (outgoing payments).
   * Returns the approval URL + continuation details for the button-based consent flow.
   *
   * The frontend opens `approvalUrl` in a new tab. After the user approves,
   * they return to the app and trigger `GrantService.continueGrant`.
   *
   * Falls back to a simulated approval URL when OP is not configured.
   */
  static async requestInteractive(
    authServerUrl: string,
    access: AccessItem[]
  ): Promise<PendingInteractiveGrant> {
    if (!isOPConfigured()) {
      // Simulation: return a fake URL that the frontend can display as a button.
      return {
        approvalUrl: `https://wallet.interledger-test.dev/consent?sim=true&ts=${Date.now()}`,
        continueUri: 'sim://continue',
        continueToken: 'sim_continue_' + Math.random().toString(36).substr(2, 12)
      };
    }

    const client = await getOPClient();
    const grant = await client.grant.request(
      { url: authServerUrl },
      {
        access_token: { access },
        interact: { start: ['redirect'] }
        // No interact.finish → user returns manually and clicks "I've Approved"
      }
    );

    if (!isPendingGrant(grant) || !grant.interact?.redirect) {
      throw new Error('Expected an interactive grant with a redirect URL.');
    }

    return {
      approvalUrl: grant.interact.redirect,
      continueUri: grant.continue.uri,
      continueToken: grant.continue.access_token.value
    };
  }

  /**
   * Finalise an interactive grant after the user has approved it.
   * Returns the access token to create the outgoing payment.
   *
   * In simulation mode any continueToken is accepted immediately.
   */
  static async continueGrant(
    continueUri: string,
    continueToken: string
  ): Promise<string> {
    if (!isOPConfigured() || continueUri.startsWith('sim://')) {
      return 'sim_access_' + Math.random().toString(36).substr(2, 12);
    }

    const client = await getOPClient();
    const finalised = await client.grant.continue({
      url: continueUri,
      accessToken: continueToken
    });

    if (!isFinalizedGrant(finalised)) {
      throw new Error(
        'Payment has not been approved yet, or the grant is still pending.'
      );
    }

    return finalised.access_token.value;
  }
}
