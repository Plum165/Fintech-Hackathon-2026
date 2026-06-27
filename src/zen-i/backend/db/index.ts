import fs from 'fs';
import path from 'path';
import { 
  User, Wallet, Grant, IncomingPayment, OutgoingPayment, 
  Quote, Transaction, BudgetCategory, BudgetAllocation, 
  AIConversation, AuditLog, Subscription, BnplContract 
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
  subscriptions: Subscription[];
  bnplContracts: BnplContract[];
}

const defaultDb: DatabaseSchema = {
  users: [
    {
      id: 'usr_corazon',
      email: 'mikaeelnaidoo2@gmail.com',
      name: 'Mikaeel',
      consentAccepted: true,
      kycStatus: 'verified',
      kycDetails: {
        fullName: 'Mikaeel Naidoo',
        idNumber: '9805125123081',
        country: 'South Africa',
        documentType: 'National ID'
      },
      createdAt: new Date().toISOString()
    }
  ],
  wallets: [
    {
      id: 'wal_corazon',
      userId: 'usr_corazon',
      username: 'mikaeel',
      pointer: '$ilp.interledger-test.dev/mikaeel',
      balance: 4820.50,
      reserveBalance: 500.00,
      creditOwed: 0.00,
      creditLimit: 1500.00,
      accumulatedInterest: 0.00,
      confidenceScore: 780,
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
      details: 'Zen-i core accounting ledger activated.',
      timestamp: new Date().toISOString()
    }
  ],
  subscriptions: [
    {
      id: 'sub_netflix',
      walletId: 'wal_corazon',
      merchantName: 'Netflix Premium',
      pointer: '$ilp.interledger-test.dev/netflix',
      amount: 159.00,
      currency: 'ZAR',
      frequency: 'monthly',
      category: 'Tech & subscriptions',
      status: 'active',
      nextPaymentDate: new Date(Date.now() + 3600000 * 24 * 3).toISOString(), // 3 days from now
      lastPaymentDate: new Date(Date.now() - 3600000 * 24 * 27).toISOString(), // 27 days ago
      interestRate: 0.05,
      createdAt: new Date().toISOString()
    },
    {
      id: 'sub_gym',
      walletId: 'wal_corazon',
      merchantName: 'Planet Fitness Gym',
      pointer: '$ilp.interledger-test.dev/planetfitness',
      amount: 350.00,
      currency: 'ZAR',
      frequency: 'monthly',
      category: 'Food & groceries', // categorized or transport or tech
      status: 'active',
      nextPaymentDate: new Date(Date.now() + 3600000 * 12).toISOString(), // 12 hours from now
      lastPaymentDate: new Date(Date.now() - 3600000 * 24 * 30).toISOString(), // 30 days ago
      interestRate: 0.10,
      createdAt: new Date().toISOString()
    }
  ],
  bnplContracts: [
    {
      id: 'bnpl_superbalist',
      walletId: 'wal_corazon',
      merchantName: 'Superbalist Fashion',
      purchaseAmount: 1200.00,
      remainingAmount: 800.00,
      currency: 'ZAR',
      totalInstallments: 3,
      status: 'active',
      createdAt: new Date(Date.now() - 3600000 * 24 * 10).toISOString(), // 10 days ago
      installments: [
        {
          id: 'inst_sb_1',
          installmentNumber: 1,
          amount: 400.00,
          dueDate: new Date(Date.now() - 3600000 * 24 * 10).toISOString(),
          status: 'paid',
          paidAt: new Date(Date.now() - 3600000 * 24 * 10).toISOString(),
          transactionId: 'tx_sb_init'
        },
        {
          id: 'inst_sb_2',
          installmentNumber: 2,
          amount: 400.00,
          dueDate: new Date(Date.now() + 3600000 * 24 * 20).toISOString(), // 20 days from now
          status: 'pending'
        },
        {
          id: 'inst_sb_3',
          installmentNumber: 3,
          amount: 400.00,
          dueDate: new Date(Date.now() + 3600000 * 24 * 50).toISOString(), // 50 days from now
          status: 'pending'
        }
      ]
    },
    {
      id: 'bnpl_takealot',
      walletId: 'wal_corazon',
      merchantName: 'Takealot Tech',
      purchaseAmount: 3200.00,
      remainingAmount: 2400.00,
      currency: 'ZAR',
      totalInstallments: 4,
      status: 'active',
      createdAt: new Date(Date.now() - 3600000 * 24 * 5).toISOString(), // 5 days ago
      installments: [
        {
          id: 'inst_tk_1',
          installmentNumber: 1,
          amount: 800.00,
          dueDate: new Date(Date.now() - 3600000 * 24 * 5).toISOString(),
          status: 'paid',
          paidAt: new Date(Date.now() - 3600000 * 24 * 5).toISOString(),
          transactionId: 'tx_tk_init'
        },
        {
          id: 'inst_tk_2',
          installmentNumber: 2,
          amount: 800.00,
          dueDate: new Date(Date.now() + 3600000 * 24 * 25).toISOString(), // 25 days from now
          status: 'pending'
        },
        {
          id: 'inst_tk_3',
          installmentNumber: 3,
          amount: 800.00,
          dueDate: new Date(Date.now() + 3600000 * 24 * 55).toISOString(), // 55 days from now
          status: 'pending'
        },
        {
          id: 'inst_tk_4',
          installmentNumber: 4,
          amount: 800.00,
          dueDate: new Date(Date.now() + 3600000 * 24 * 85).toISOString(), // 85 days from now
          status: 'pending'
        }
      ]
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
