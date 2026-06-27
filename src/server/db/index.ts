import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import type {
  User, Wallet, Grant, IncomingPayment, OutgoingPayment,
  Quote, Transaction, BudgetCategory, BudgetAllocation,
  AIConversation, AuditLog, Subscription, BnplContract
} from '../types.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DB_FILE = path.join(__dirname, '..', 'data', 'db.json');

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
  sessions: Record<string, { email: string; userId: string }>;
}

const defaultDb: DatabaseSchema = {
  users: [],
  wallets: [],
  grants: [],
  incomingPayments: [],
  outgoingPayments: [],
  quotes: [],
  transactions: [],
  budgetCategories: [],
  budgetAllocations: [],
  aiConversations: [],
  auditLogs: [
    {
      id: 'log_init',
      action: 'SYSTEM_STARTUP',
      details: 'PandaPay consolidated API server initialised.',
      timestamp: new Date().toISOString()
    }
  ],
  subscriptions: [],
  bnplContracts: [],
  sessions: {}
};

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
      if (!fs.existsSync(DB_FILE)) initDb();
      const data = fs.readFileSync(DB_FILE, 'utf-8');
      const parsed = JSON.parse(data) as DatabaseSchema;
      // Ensure new collections exist on older DB files
      parsed.subscriptions ??= [];
      parsed.bnplContracts ??= [];
      parsed.sessions ??= {};
      return parsed;
    } catch {
      return { ...defaultDb };
    }
  }

  static write(data: DatabaseSchema): void {
    try {
      fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), 'utf-8');
    } catch (e) {
      console.error('Database write error:', e);
    }
  }

  static log(action: string, details: string): void {
    const db = this.read();
    db.auditLogs.unshift({
      id: 'log_' + Math.random().toString(36).substr(2, 9),
      action,
      details,
      timestamp: new Date().toISOString()
    });
    this.write(db);
  }
}
