import { Database } from '../../db';
import { Wallet } from '../../../src/types';

export class WalletService {
  /**
   * Translates simple user name (e.g. "john") to full ILP payment pointer
   */
  static generatePointer(username: string): string {
    const clean = username.trim().toLowerCase().replace(/^\$/, '');
    if (clean.includes('.')) {
      return clean.startsWith('http') ? clean : `$${clean}`;
    }
    return `$ilp.interledger-test.dev/${clean}`;
  }

  /**
   * Retrieves or registers a wallet pointer
   */
  static async getOrCreateWallet(userId: string, username: string): Promise<Wallet> {
    const db = Database.read();
    const pointer = this.generatePointer(username);
    
    let wallet = db.wallets.find(w => w.pointer === pointer || (w.userId === userId && w.username === username));
    
    if (!wallet) {
      wallet = {
        id: 'wal_' + Math.random().toString(36).substr(2, 9),
        userId,
        username: username.toLowerCase(),
        pointer,
        balance: 1000.00, // Initial sign-up bonus
        reserveBalance: 0.00,
        creditOwed: 0.00,
        creditLimit: 1500.00,
        accumulatedInterest: 0.00,
        confidenceScore: 600, // starts a bit lower until verified
        currency: 'ZAR',
        active: true,
        createdAt: new Date().toISOString()
      };
      db.wallets.push(wallet);
      Database.write(db);
      Database.log('WALLET_CREATED', `Wallet pointer ${pointer} initialized with default balance and credit lines.`);
    }
    
    return wallet;
  }

  /**
   * Resolves payment pointer details
   */
  static async resolvePointer(pointer: string): Promise<{ username: string; currency: string; active: boolean } | null> {
    const db = Database.read();
    const wallet = db.wallets.find(w => w.pointer.toLowerCase() === pointer.toLowerCase());
    if (wallet) {
      return { username: wallet.username, currency: wallet.currency, active: wallet.active };
    }
    
    // Simulate lookup of external payment pointers
    if (pointer.includes('interledger-test.dev')) {
      const parts = pointer.split('/');
      const username = parts[parts.length - 1] || 'external';
      return { username, currency: 'ZAR', active: true };
    }
    
    return null;
  }

  /**
   * Modifies balance on deposit/send/receive
   */
  static async updateBalance(walletId: string, amount: number, operation: 'add' | 'subtract'): Promise<number> {
    const db = Database.read();
    const wallet = db.wallets.find(w => w.id === walletId);
    if (!wallet) throw new Error(`Wallet ${walletId} not found`);
    
    if (operation === 'add') {
      wallet.balance += amount;
    } else {
      if (wallet.balance < amount) {
        throw new Error('Insufficient funds');
      }
      wallet.balance -= amount;
    }
    
    Database.write(db);
    Database.log('BALANCE_UPDATED', `Wallet ${wallet.pointer} balance updated to R ${wallet.balance.toFixed(2)}.`);
    return wallet.balance;
  }
}
