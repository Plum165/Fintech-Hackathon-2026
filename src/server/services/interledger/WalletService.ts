import { getOPClient, isOPConfigured } from './client.js';
import { Database } from '../../db/index.js';
import type { Wallet } from '../../types.js';

export class WalletService {
  /** Convert a $-prefixed payment pointer or username to a full wallet URL. */
  static toUrl(pointerOrUsername: string): string {
    const s = pointerOrUsername.trim();
    if (s.startsWith('https://') || s.startsWith('http://')) return s;
    const clean = s.startsWith('$') ? s.slice(1) : s;
    return `https://ilp.interledger-test.dev/${clean}`;
  }

  /** Generate a $-style pointer for a given username. */
  static generatePointer(username: string): string {
    const clean = username.trim().toLowerCase().replace(/^\$/, '');
    // Already a full domain pointer (e.g. "alice.example.com/wallet")
    if (clean.includes('.')) return clean.startsWith('http') ? clean : `$${clean}`;
    return `$ilp.interledger-test.dev/${clean}`;
  }

  /**
   * Discover a wallet address via Open Payments.
   * Falls back to a minimal object when OP is not configured.
   */
  static async discover(walletUrl: string) {
    if (!isOPConfigured()) {
      const parts = walletUrl.split('/');
      return {
        id: walletUrl,
        assetCode: 'USD',
        assetScale: 2,
        authServer: 'https://auth.interledger-test.dev',
        resourceServer: 'https://ilp.interledger-test.dev',
        publicName: parts[parts.length - 1]
      };
    }
    const client = await getOPClient();
    return client.walletAddress.get({ url: walletUrl });
  }

  /** Retrieve the server's own wallet address details (cached). */
  private static _serverWallet: Awaited<ReturnType<typeof WalletService.discover>> | null = null;

  static async getServerWallet() {
    if (!this._serverWallet) {
      const raw = process.env.SERVER_WALLET_ADDRESS ?? 'https://ilp.interledger-test.dev/pandapay';
      const url = raw.startsWith('$') ? `https://${raw.slice(1)}` : raw;
      this._serverWallet = await this.discover(url);
    }
    return this._serverWallet;
  }

  /** Get or create an internal wallet record for a user. */
  static async getOrCreateWallet(userId: string, username: string): Promise<Wallet> {
    const db = Database.read();
    const pointer = this.generatePointer(username);

    let wallet = db.wallets.find(
      w => w.userId === userId || w.pointer === pointer
    );

    if (!wallet) {
      wallet = {
        id: 'wal_' + Math.random().toString(36).substr(2, 9),
        userId,
        username: username.toLowerCase(),
        pointer,
        balance: 1000.00,
        reserveBalance: 0.00,
        creditOwed: 0.00,
        creditLimit: 1500.00,
        accumulatedInterest: 0.00,
        confidenceScore: 600,
        currency: 'ZAR',
        active: true,
        createdAt: new Date().toISOString()
      };
      db.wallets.push(wallet);
      Database.write(db);
      Database.log('WALLET_CREATED', `Internal wallet for ${pointer} created.`);
    }

    return wallet;
  }

  static async updateBalance(
    walletId: string,
    amount: number,
    operation: 'add' | 'subtract'
  ): Promise<number> {
    const db = Database.read();
    const wallet = db.wallets.find(w => w.id === walletId);
    if (!wallet) throw new Error(`Wallet ${walletId} not found.`);

    if (operation === 'add') {
      wallet.balance += amount;
    } else {
      if (wallet.balance < amount) throw new Error('Insufficient funds.');
      wallet.balance -= amount;
    }

    Database.write(db);
    Database.log('BALANCE_UPDATED', `${wallet.pointer} balance → R ${wallet.balance.toFixed(2)}.`);
    return wallet.balance;
  }
}
