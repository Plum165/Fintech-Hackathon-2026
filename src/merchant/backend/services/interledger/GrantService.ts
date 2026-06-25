import { Database } from '../../db';
import { Grant } from '../../../src/types';

export class GrantService {
  /**
   * Request an Incoming Payment Grant or Outgoing Payment Grant
   */
  static async requestGrant(
    walletId: string, 
    type: 'incoming' | 'outgoing' | 'quote',
    scope: string
  ): Promise<Grant> {
    const db = Database.read();
    
    // Create new secure grant token
    const newGrant: Grant = {
      id: 'gnt_' + Math.random().toString(36).substr(2, 12),
      walletId,
      type,
            client: '$ilp.interledger-test.dev/pandapay-client',
      scope,
      active: true,
      createdAt: new Date().toISOString()
    };
    
    db.grants.push(newGrant);
    Database.write(db);
    Database.log('GRANT_REQUESTED', `Grant ${newGrant.id} of type ${type} successfully negotiated.`);
    
    return newGrant;
  }

  /**
   * Validates if a grant token is active
   */
  static async validateGrant(grantId: string): Promise<boolean> {
    const db = Database.read();
    const grant = db.grants.find(g => g.id === grantId);
    return !!(grant && grant.active);
  }

  /**
   * Revoke grant token
   */
  static async revokeGrant(grantId: string): Promise<void> {
    const db = Database.read();
    const grant = db.grants.find(g => g.id === grantId);
    if (grant) {
      grant.active = false;
      Database.write(db);
      Database.log('GRANT_REVOKED', `Grant ${grantId} was revoked.`);
    }
  }
}
