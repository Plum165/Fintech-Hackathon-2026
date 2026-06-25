import fs from 'fs';
import path from 'path';
import { 
  User, Wallet, Grant, IncomingPayment, OutgoingPayment, 
  Quote, Transaction, BudgetCategory, BudgetAllocation, 
  AIConversation, AuditLog 
} from '../../src/types';

const DB_FILE = path.join(process.cwd(), 'data', 'db.json');

export interface DatabaseSchema {
  users: User[];
  wallets: Wallet[];
  grants: Grant[];
  incomingPayments: IncomingPayment[];
  outgoingPayments: OutgoingPayment[];
  quotes: Quote[];
  transactions: Transaction[];
  budgetCategories: BudgetCategory[];
  budgetAllocations: BudgetAllocation[];
  aiConversations: AIConversation[];
  auditLogs: AuditLog[];
}

const defaultDb: DatabaseSchema = {
  users: [
    {
      id: 'usr_corazon',
      email: 'mikaeelnaidoo2@gmail.com',
      name: 'Corazon',
      createdAt: new Date().toISOString()
    }
  ],
  wallets: [
    {
      id: 'wal_corazon',
      userId: 'usr_corazon',
      username: 'corazon',
      pointer: '$ilp.interledger-test.dev/corazon',
      balance: 4820.50,
      currency: 'ZAR',
      active: true,
      createdAt: new Date().toISOString()
    }
  ],
  grants: [],
  incomingPayments: [],
  outgoingPayments: [],
  quotes: [],
  transactions: [
    {
      id: 'tx_1',
      walletId: 'wal_corazon',
      type: 'deposit',
      direction: 'in',
      amount: 500.00,
      currency: 'ZAR',
      counterparty: 'Deposit via ILP',
      reference: 'ref_dep_9837a',
      status: 'completed',
      category: 'General',
      createdAt: new Date(Date.now() - 3600000 * 2).toISOString() // 2 hrs ago
    },
    {
      id: 'tx_2',
      walletId: 'wal_corazon',
      type: 'send',
      direction: 'out',
      amount: 220.00,
      currency: 'ZAR',
      counterparty: '$ilp.interledger-test.dev/liam',
      reference: 'ref_snd_3321b',
      status: 'completed',
      category: 'Food',
      createdAt: new Date(Date.now() - 3600000 * 24).toISOString() // 24 hrs ago
    },
    {
      id: 'tx_3',
      walletId: 'wal_corazon',
      type: 'receive',
      direction: 'in',
      amount: 350.00,
      currency: 'ZAR',
      counterparty: '$ilp.interledger-test.dev/nia',
      reference: 'ref_rcv_7612c',
      status: 'completed',
      category: 'General',
      createdAt: new Date(Date.now() - 3600000 * 72).toISOString() // 3 days ago
    },
    {
      id: 'tx_4',
      walletId: 'wal_corazon',
      type: 'send',
      direction: 'out',
      amount: 80.00,
      currency: 'ZAR',
      counterparty: '$ilp.interledger-test.dev/marco',
      reference: 'ref_snd_4419d',
      status: 'pending',
      category: 'Transport',
      createdAt: new Date(Date.now() - 3600000 * 96).toISOString() // 4 days ago
    },
    {
      id: 'tx_5',
      walletId: 'wal_corazon',
      type: 'deposit',
      direction: 'in',
      amount: 1300.00,
      currency: 'ZAR',
      counterparty: 'Deposit via ILP',
      reference: 'ref_dep_1123e',
      status: 'completed',
      category: 'Savings',
      createdAt: new Date(Date.now() - 3600000 * 120).toISOString() // 5 days ago
    }
  ],
  budgetCategories: [
    {
      id: 'bc_food',
      walletId: 'wal_corazon',
      name: 'Food & groceries',
      icon: 'shopping-cart',
      limit: 900.00,
      allocated: 680.00,
      color: '#1D9E75' // green
    },
    {
      id: 'bc_trans',
      walletId: 'wal_corazon',
      name: 'Transport',
      icon: 'bus',
      limit: 400.00,
      allocated: 210.00,
      color: '#378ADD' // blue
    },
    {
      id: 'bc_tech',
      walletId: 'wal_corazon',
      name: 'Tech & subscriptions',
      icon: 'device-laptop',
      limit: 500.00,
      allocated: 490.00,
      color: '#A32D2D' // red
    },
    {
      id: 'bc_save',
      walletId: 'wal_corazon',
      name: 'Savings',
      icon: 'piggy-bank',
      limit: 1400.00,
      allocated: 1000.00,
      color: '#EF9F27' // orange
    }
  ],
  budgetAllocations: [],
  aiConversations: [],
  auditLogs: [
    {
      id: 'log_1',
      action: 'SYSTEM_STARTUP',
      details: 'ZenPay core accounting ledger activated.',
      timestamp: new Date().toISOString()
    }
  ]
};

// Ensure database file and parent directories exist
function initDb() {
  const dir = path.dirname(DB_FILE);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  if (!fs.existsSync(DB_FILE)) {
    fs.writeFileSync(DB_FILE, JSON.stringify(defaultDb, null, 2), 'utf-8');
  }
}

initDb();

export class Database {
  static read(): DatabaseSchema {
    try {
      if (!fs.existsSync(DB_FILE)) {
        initDb();
      }
      const data = fs.readFileSync(DB_FILE, 'utf-8');
      return JSON.parse(data);
    } catch (e) {
      console.error("Database read error, falling back to in-memory:", e);
      return defaultDb;
    }
  }

  static write(data: DatabaseSchema): void {
    try {
      fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), 'utf-8');
    } catch (e) {
      console.error("Database write error:", e);
    }
  }

  // Logs transaction updates to audit
  static log(action: string, details: string): void {
    const db = this.read();
    const newLog: AuditLog = {
      id: 'log_' + Math.random().toString(36).substr(2, 9),
      action,
      details,
      timestamp: new Date().toISOString()
    };
    db.auditLogs.unshift(newLog);
    this.write(db);
  }
}
