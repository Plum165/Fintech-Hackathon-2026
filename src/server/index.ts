/**
 * PandaPay Consolidated API Server
 *
 * Single backend shared by both the Merchant and PandaPay frontends.
 * Uses the real @interledger/open-payments SDK when OP credentials are
 * configured in .env; falls back to simulation otherwise.
 *
 * Open Payments send flow (button-based consent — no forced browser redirect):
 *  1. POST /api/payments/send/initiate
 *     → discovers receiver, creates incoming payment + quote, requests an
 *       interactive grant, and returns { approvalUrl, continueUri, continueToken, quote }.
 *  2. Frontend renders an "Approve Payment" button that opens approvalUrl in a
 *     new tab. The user approves in their own wallet UI.
 *  3. POST /api/payments/send/execute  (user clicks "I've Approved")
 *     → finalises the grant and creates the outgoing payment on the ILP network.
 */

import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
dotenv.config();

import { Database } from './db/index.js';
import { WalletService } from './services/interledger/WalletService.js';
import { IncomingPaymentService } from './services/interledger/IncomingPaymentService.js';
import { OutgoingPaymentService } from './services/interledger/OutgoingPaymentService.js';
import { QuoteService } from './services/interledger/QuoteService.js';
import { AIService } from './services/AIService.js';
import { isOPConfigured } from './services/interledger/client.js';
import type { Transaction, BudgetCategory, BnplInstallment, BnplContract, Subscription } from './types.js';

const app = express();
const PORT = parseInt(process.env.PORT ?? '4000', 10);

// ── Middleware ──────────────────────────────────────────────────────────────
app.use(cors({
  origin: [
    'http://localhost:3000',   // pandapay frontend
    'http://localhost:5689',   // merchant frontend
    'http://localhost:5173',   // vite default
  ],
  credentials: true
}));
app.use(express.json());

// ── Auth (in-memory session map) ────────────────────────────────────────────
const authTokens = new Map<string, { email: string; userId: string }>();

function authenticate(
  req: express.Request,
  res: express.Response,
  next: express.NextFunction
): void {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Unauthorised. Please login first.' });
    return;
  }
  const token = header.split(' ')[1];
  const session = authTokens.get(token);
  if (!session) {
    res.status(401).json({ error: 'Session expired. Please re-authenticate.' });
    return;
  }
  (req as any).user = session;
  next();
}

// ── Startup log ─────────────────────────────────────────────────────────────
console.log(`[PandaPay Server] Open Payments: ${isOPConfigured() ? 'LIVE (real ILP)' : 'SIMULATION'}`);

// ============================================================================
// AUTH
// ============================================================================

app.post('/api/auth/login', async (req, res) => {
  try {
    const { email } = req.body as { email?: string };
    if (!email) {
      res.status(400).json({ error: 'Email or payment pointer required.' });
      return;
    }

    const input = email.trim().toLowerCase();
    const isPointer = input.startsWith('$') || (input.includes('/') && !input.includes('@'));

    const db = Database.read();
    let user = db.users.find(u =>
      isPointer
        ? false
        : u.email.toLowerCase() === input
    );

    if (!user) {
      const username = isPointer
        ? input.replace(/^\$/, '').split('/').pop() ?? 'user'
        : input.split('@')[0];

      user = {
        id: 'usr_' + Math.random().toString(36).substr(2, 9),
        email: isPointer ? `${username}@ilp.local` : input,
        name: username.charAt(0).toUpperCase() + username.slice(1),
        consentAccepted: false,
        kycStatus: 'unverified',
        createdAt: new Date().toISOString()
      };
      db.users.push(user);
      Database.write(db);
      Database.log('USER_CREATED', `New user: ${user.email}`);
    }

    const username = user.name.toLowerCase().replace(/[^a-z0-9]/g, '');
    const wallet = await WalletService.getOrCreateWallet(user.id, username);

    const token = 'token_' + Math.random().toString(36).substr(2, 16);
    authTokens.set(token, { email: user.email, userId: user.id });

    res.json({ token, user, wallet });
  } catch (e: any) {
    res.status(500).json({ error: e.message ?? 'Authentication error.' });
  }
});

app.get('/api/auth/me', authenticate, async (req, res) => {
  try {
    const { userId } = (req as any).user;
    const db = Database.read();
    res.json({
      user: db.users.find(u => u.id === userId),
      wallet: db.wallets.find(w => w.userId === userId)
    });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

app.post('/api/auth/consent', authenticate, async (req, res) => {
  try {
    const { userId } = (req as any).user;
    const db = Database.read();
    const user = db.users.find(u => u.id === userId);
    if (!user) { res.status(404).json({ error: 'User not found.' }); return; }
    user.consentAccepted = true;
    Database.write(db);
    Database.log('CONSENT_ACCEPTED', `${user.email} accepted data privacy consent.`);
    res.json({ success: true, user });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

app.post('/api/auth/kyc', authenticate, async (req, res) => {
  try {
    const { fullName, idNumber, country, documentType } = req.body;
    if (!fullName || !idNumber || !country || !documentType) {
      res.status(400).json({ error: 'All KYC fields are required.' }); return;
    }
    const { userId } = (req as any).user;
    const db = Database.read();
    const user = db.users.find(u => u.id === userId);
    if (!user) { res.status(404).json({ error: 'User not found.' }); return; }

    user.kycStatus = 'verified';
    user.kycDetails = { fullName, idNumber, country, documentType };

    const wallet = db.wallets.find(w => w.userId === userId);
    if (wallet) {
      wallet.confidenceScore = Math.min(1000, wallet.confidenceScore + 100);
    }

    Database.write(db);
    Database.log('KYC_VERIFIED', `${user.email} completed KYC.`);
    res.json({ success: true, user, wallet });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

// ============================================================================
// OPEN PAYMENTS — DEPOSIT FLOW
// ============================================================================

/**
 * POST /api/payments/deposit
 *
 * Creates an incoming payment on the server's ILP wallet and immediately
 * credits the user's internal balance (the payment acts as a deposit receipt).
 *
 * Returns a paymentUrl / QR data the depositor can use to actually fund it.
 */
app.post('/api/payments/deposit', authenticate, async (req, res) => {
  try {
    const { amount } = req.body as { amount?: number | string };
    const numAmount = parseFloat(String(amount));
    if (isNaN(numAmount) || numAmount <= 0) {
      res.status(400).json({ error: 'Enter a positive numeric amount.' }); return;
    }

    const { userId } = (req as any).user;
    const db = Database.read();
    const wallet = db.wallets.find(w => w.userId === userId);
    if (!wallet) { res.status(404).json({ error: 'Wallet not found.' }); return; }

    // Create an incoming payment on the SERVER wallet (funds arrive here)
    const serverWallet = await WalletService.getServerWallet();
    const incoming = await IncomingPaymentService.create(
      serverWallet.id,
      numAmount,
      wallet.currency,
      2 // ZAR uses scale 2
    );

    // Credit internal balance immediately (simulating receipt)
    await WalletService.updateBalance(wallet.id, numAmount, 'add');

    const transaction: Transaction = {
      id: 'tx_' + Math.random().toString(36).substr(2, 9),
      walletId: wallet.id,
      type: 'deposit',
      direction: 'in',
      amount: numAmount,
      currency: wallet.currency,
      counterparty: 'Deposit via ILP',
      reference: 'ref_dep_' + Math.random().toString(36).substr(2, 7),
      status: 'completed',
      category: 'General',
      createdAt: new Date().toISOString()
    };

    db.transactions.unshift(transaction);
    Database.write(db);
    Database.log('DEPOSIT', `R ${numAmount} deposited to ${wallet.pointer}`);

    // QR-friendly interledger URI
    const qrData = `interledger:${wallet.pointer}?amount=${numAmount}&currency=${wallet.currency}`;

    res.json({
      transaction,
      paymentPointer: wallet.pointer,
      paymentUrl: incoming.paymentUrl,
      qrCode: qrData,
      incomingPaymentId: incoming.id
    });
  } catch (e: any) {
    res.status(500).json({ error: e.message ?? 'Deposit failed.' });
  }
});

// ============================================================================
// OPEN PAYMENTS — SEND FLOW (button-based interactive consent)
// ============================================================================

/**
 * POST /api/payments/send/initiate
 *
 * Steps 1–6 of the Open Payments P2P flow.
 * Discovers the receiver, creates an incoming payment, builds a quote, then
 * requests an INTERACTIVE outgoing-payment grant and returns the approval URL.
 *
 * The frontend should:
 *  1. Show { quote } to the user (how much will be sent vs received).
 *  2. Render an "Approve Payment" button that opens { approvalUrl } in a new tab.
 *  3. After the user approves, call POST /api/payments/send/execute.
 */
app.post('/api/payments/send/initiate', authenticate, async (req, res) => {
  try {
    const { destination, amount, description } = req.body as {
      destination?: string;
      amount?: number | string;
      description?: string;
    };

    const numAmount = parseFloat(String(amount));
    if (!destination || isNaN(numAmount) || numAmount <= 0) {
      res.status(400).json({ error: 'destination and a positive amount are required.' }); return;
    }

    const { userId } = (req as any).user;
    const db = Database.read();
    const wallet = db.wallets.find(w => w.userId === userId);
    if (!wallet) { res.status(404).json({ error: 'Wallet not found.' }); return; }
    if (wallet.balance < numAmount) {
      res.status(400).json({ error: 'Insufficient balance.' }); return;
    }

    const destPointer = WalletService.generatePointer(destination);
    const destUrl = WalletService.toUrl(destPointer);

    // Step 3: incoming payment on receiver's wallet
    const incoming = await IncomingPaymentService.createOpen(destUrl);

    // Step 5: quote on server's wallet
    const quote = await QuoteService.create(
      incoming.id,
      numAmount,
      wallet.currency,
      2
    );

    // Step 6: interactive outgoing-payment grant (button-based consent)
    const pending = await OutgoingPaymentService.initiateGrant(
      numAmount,
      wallet.currency,
      2
    );

    res.json({
      approvalUrl: pending.approvalUrl,
      continueUri: pending.continueUri,
      continueToken: pending.continueToken,
      quote: {
        id: quote.id,
        debitAmount: quote.debitAmount,
        receiveAmount: quote.receiveAmount,
        expiresAt: quote.expiresAt
      },
      destination: destPointer,
      description: description ?? 'Transfer',
      incomingPaymentId: incoming.id
    });
  } catch (e: any) {
    res.status(500).json({ error: e.message ?? 'Payment initiation failed.' });
  }
});

/**
 * POST /api/payments/send/execute
 *
 * Step 8 of the Open Payments flow.
 * Called after the user has approved the payment in their wallet (via the
 * approvalUrl button). Finalises the grant and creates the outgoing payment.
 */
app.post('/api/payments/send/execute', authenticate, async (req, res) => {
  try {
    const { continueUri, continueToken, quoteId, amount, destination, description } = req.body as {
      continueUri?: string;
      continueToken?: string;
      quoteId?: string;
      amount?: number | string;
      destination?: string;
      description?: string;
    };

    if (!continueUri || !continueToken || !quoteId) {
      res.status(400).json({ error: 'continueUri, continueToken and quoteId are required.' }); return;
    }

    const numAmount = parseFloat(String(amount));
    if (isNaN(numAmount) || numAmount <= 0) {
      res.status(400).json({ error: 'Positive amount required.' }); return;
    }

    const { userId } = (req as any).user;
    const db = Database.read();
    const wallet = db.wallets.find(w => w.userId === userId);
    if (!wallet) { res.status(404).json({ error: 'Wallet not found.' }); return; }
    if (wallet.balance < numAmount) {
      res.status(400).json({ error: 'Insufficient balance.' }); return;
    }

    // Step 8: finalise grant + create outgoing payment
    const outgoing = await OutgoingPaymentService.execute(
      continueUri,
      continueToken,
      quoteId,
      description
    );

    // Deduct internal balance
    await WalletService.updateBalance(wallet.id, numAmount, 'subtract');

    const destPointer = destination ? WalletService.generatePointer(destination) : 'external';
    const category = await safeAutoCategorize(description ?? destPointer, numAmount);

    // Update relevant budget if found
    const budgets = db.budgetCategories.filter(b => b.walletId === wallet.id);
    applyBudget(budgets, category, numAmount);

    const transaction: Transaction = {
      id: 'tx_' + Math.random().toString(36).substr(2, 9),
      walletId: wallet.id,
      type: 'send',
      direction: 'out',
      amount: numAmount,
      currency: wallet.currency,
      counterparty: destPointer,
      reference: 'ref_snd_' + Math.random().toString(36).substr(2, 7),
      status: 'completed',
      category,
      createdAt: new Date().toISOString()
    };

    db.transactions.unshift(transaction);
    Database.write(db);
    Database.log('SEND', `Sent R ${numAmount} to ${destPointer} (ILP: ${outgoing.id})`);

    res.json({ transaction, outgoingPaymentId: outgoing.id, failed: outgoing.failed });
  } catch (e: any) {
    res.status(500).json({ error: e.message ?? 'Payment execution failed.' });
  }
});

/**
 * POST /api/payments/quote
 * Quick quote without initiating a full payment (for display purposes).
 */
app.post('/api/payments/quote', authenticate, async (req, res) => {
  try {
    const { destination, amount } = req.body as { destination?: string; amount?: number | string };
    const numAmount = parseFloat(String(amount));
    if (!destination || isNaN(numAmount) || numAmount <= 0) {
      res.status(400).json({ error: 'destination and positive amount required.' }); return;
    }

    const { userId } = (req as any).user;
    const db = Database.read();
    const wallet = db.wallets.find(w => w.userId === userId);
    if (!wallet) { res.status(404).json({ error: 'Wallet not found.' }); return; }

    const destUrl = WalletService.toUrl(WalletService.generatePointer(destination));
    const incoming = await IncomingPaymentService.createOpen(destUrl);
    const quote = await QuoteService.create(incoming.id, numAmount, wallet.currency, 2);

    res.json({ quote });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

// ============================================================================
// TRANSACTIONS
// ============================================================================

app.get('/api/transactions', authenticate, async (req, res) => {
  try {
    const { userId } = (req as any).user;
    const { type, status, startDate, endDate, search, page = '1', limit = '10' } = req.query;

    const db = Database.read();
    const wallet = db.wallets.find(w => w.userId === userId);
    if (!wallet) { res.status(404).json({ error: 'Wallet not found.' }); return; }

    let list = db.transactions.filter(t => t.walletId === wallet.id);

    if (type) list = list.filter(t => t.type === type);
    if (status) list = list.filter(t => t.status === status);
    if (startDate) list = list.filter(t => new Date(t.createdAt) >= new Date(startDate as string));
    if (endDate) list = list.filter(t => new Date(t.createdAt) <= new Date(endDate as string));
    if (search) {
      const q = (search as string).toLowerCase();
      list = list.filter(t =>
        t.reference.toLowerCase().includes(q) ||
        t.counterparty.toLowerCase().includes(q) ||
        t.category.toLowerCase().includes(q)
      );
    }

    let totalIn = 0, totalOut = 0;
    list.forEach(t => {
      if (t.status === 'completed') {
        if (t.direction === 'in') totalIn += t.amount;
        else totalOut += t.amount;
      }
    });

    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const totalItems = list.length;

    res.json({
      transactions: list.slice((pageNum - 1) * limitNum, pageNum * limitNum),
      summary: { totalIn, totalOut, net: totalIn - totalOut },
      pagination: { page: pageNum, limit: limitNum, totalItems, totalPages: Math.ceil(totalItems / limitNum) }
    });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

// ============================================================================
// BUDGET CATEGORIES
// ============================================================================

app.get('/api/budget', authenticate, async (req, res) => {
  try {
    const { userId } = (req as any).user;
    const db = Database.read();
    const wallet = db.wallets.find(w => w.userId === userId);
    if (!wallet) { res.status(404).json({ error: 'Wallet not found.' }); return; }
    res.json({ categories: db.budgetCategories.filter(b => b.walletId === wallet.id) });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

app.post('/api/budget/category', authenticate, async (req, res) => {
  try {
    const { name, limit, icon, color } = req.body;
    const numLimit = parseFloat(limit);
    if (!name || isNaN(numLimit) || numLimit <= 0) {
      res.status(400).json({ error: 'Valid name and positive limit required.' }); return;
    }

    const { userId } = (req as any).user;
    const db = Database.read();
    const wallet = db.wallets.find(w => w.userId === userId);
    if (!wallet) { res.status(404).json({ error: 'Wallet not found.' }); return; }

    const category: BudgetCategory = {
      id: 'bc_' + Math.random().toString(36).substr(2, 9),
      walletId: wallet.id,
      name,
      icon: icon ?? 'shopping-bag',
      limit: numLimit,
      allocated: 0,
      color: color ?? '#EF9F27'
    };

    db.budgetCategories.push(category);
    Database.write(db);
    Database.log('BUDGET_CREATED', `Category "${name}" limit R ${numLimit}`);
    res.json({ category });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

app.put('/api/budget/category/:id', authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    const { name, limit, allocated, icon, color } = req.body;
    const db = Database.read();
    const cat = db.budgetCategories.find(c => c.id === id);
    if (!cat) { res.status(404).json({ error: 'Category not found.' }); return; }

    if (name) cat.name = name;
    if (limit !== undefined) cat.limit = parseFloat(limit);
    if (allocated !== undefined) cat.allocated = parseFloat(allocated);
    if (icon) cat.icon = icon;
    if (color) cat.color = color;

    Database.write(db);
    res.json({ category: cat });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

app.delete('/api/budget/category/:id', authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    const db = Database.read();
    const idx = db.budgetCategories.findIndex(c => c.id === id);
    if (idx === -1) { res.status(404).json({ error: 'Category not found.' }); return; }
    db.budgetCategories.splice(idx, 1);
    Database.write(db);
    res.json({ success: true });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

// ============================================================================
// AI
// ============================================================================

app.post('/api/ai/chat', authenticate, async (req, res) => {
  try {
    const { message } = req.body as { message?: string };
    if (!message) { res.status(400).json({ error: 'Message required.' }); return; }

    const { userId } = (req as any).user;
    const db = Database.read();
    const wallet = db.wallets.find(w => w.userId === userId);
    if (!wallet) { res.status(404).json({ error: 'Wallet not found.' }); return; }

    let conversation = db.aiConversations.find(c => c.userId === userId);
    if (!conversation) {
      conversation = {
        id: 'con_' + Math.random().toString(36).substr(2, 9),
        userId,
        messages: [],
        createdAt: new Date().toISOString()
      };
      db.aiConversations.push(conversation);
    }

    conversation.messages.push({ role: 'user', content: message, timestamp: new Date().toISOString() });

    const budgets = db.budgetCategories.filter(b => b.walletId === wallet.id);
    const recentTx = db.transactions.filter(t => t.walletId === wallet.id).slice(0, 5);

    const responseText = await AIService.chatResponse(
      message,
      wallet.balance,
      wallet.pointer,
      budgets,
      recentTx
    );

    conversation.messages.push({ role: 'model', content: responseText, timestamp: new Date().toISOString() });
    Database.write(db);

    res.json({ response: responseText, messages: conversation.messages });
  } catch (e: any) {
    res.status(500).json({ error: e.message ?? 'AI assistant unavailable.' });
  }
});

app.get('/api/ai/insights', authenticate, async (req, res) => {
  try {
    const { userId } = (req as any).user;
    const db = Database.read();
    const wallet = db.wallets.find(w => w.userId === userId);
    if (!wallet) { res.status(404).json({ error: 'Wallet not found.' }); return; }

    const advice = await AIService.getBudgetAdvice(
      db.transactions.filter(t => t.walletId === wallet.id),
      db.budgetCategories.filter(b => b.walletId === wallet.id)
    );
    res.json({ advice });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

// ============================================================================
// SAVINGS RESERVE
// ============================================================================

app.post('/api/reserve/deposit', authenticate, async (req, res) => {
  try {
    const numAmount = parseFloat(req.body.amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      res.status(400).json({ error: 'Positive amount required.' }); return;
    }

    const { userId } = (req as any).user;
    const db = Database.read();
    const wallet = db.wallets.find(w => w.userId === userId);
    if (!wallet) { res.status(404).json({ error: 'Wallet not found.' }); return; }
    if (wallet.balance < numAmount) {
      res.status(400).json({ error: 'Insufficient balance.' }); return;
    }

    wallet.balance -= numAmount;
    wallet.reserveBalance += numAmount;
    wallet.confidenceScore = Math.min(1000, wallet.confidenceScore + Math.floor(numAmount / 50));

    const transaction: Transaction = {
      id: 'tx_' + Math.random().toString(36).substr(2, 9),
      walletId: wallet.id,
      type: 'send',
      direction: 'out',
      amount: numAmount,
      currency: wallet.currency,
      counterparty: 'Savings Reserve',
      reference: 'reserve_dep_' + Math.random().toString(36).substr(2, 7),
      status: 'completed',
      category: 'Savings',
      createdAt: new Date().toISOString()
    };

    db.transactions.unshift(transaction);
    Database.write(db);
    Database.log('RESERVE_DEPOSIT', `R ${numAmount} moved to reserve.`);
    res.json({ success: true, wallet, transaction });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

app.post('/api/reserve/withdraw', authenticate, async (req, res) => {
  try {
    const numAmount = parseFloat(req.body.amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      res.status(400).json({ error: 'Positive amount required.' }); return;
    }

    const { userId } = (req as any).user;
    const db = Database.read();
    const wallet = db.wallets.find(w => w.userId === userId);
    if (!wallet) { res.status(404).json({ error: 'Wallet not found.' }); return; }
    if (wallet.reserveBalance < numAmount) {
      res.status(400).json({ error: 'Insufficient reserve balance.' }); return;
    }

    wallet.reserveBalance -= numAmount;
    wallet.balance += numAmount;

    const transaction: Transaction = {
      id: 'tx_' + Math.random().toString(36).substr(2, 9),
      walletId: wallet.id,
      type: 'receive',
      direction: 'in',
      amount: numAmount,
      currency: wallet.currency,
      counterparty: 'Savings Reserve Release',
      reference: 'reserve_wd_' + Math.random().toString(36).substr(2, 7),
      status: 'completed',
      category: 'Savings',
      createdAt: new Date().toISOString()
    };

    db.transactions.unshift(transaction);
    Database.write(db);
    res.json({ success: true, wallet, transaction });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

// ============================================================================
// SUBSCRIPTIONS / RECURRING PAYMENTS
// ============================================================================

app.get('/api/subscriptions', authenticate, async (req, res) => {
  try {
    const { userId } = (req as any).user;
    const db = Database.read();
    const wallet = db.wallets.find(w => w.userId === userId);
    if (!wallet) { res.status(404).json({ error: 'Wallet not found.' }); return; }
    res.json({ subscriptions: db.subscriptions.filter(s => s.walletId === wallet.id) });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

app.post('/api/subscriptions', authenticate, async (req, res) => {
  try {
    const { merchantName, pointer, amount, frequency, category } = req.body;
    if (!merchantName || !pointer || !amount || !frequency || !category) {
      res.status(400).json({ error: 'All subscription fields are required.' }); return;
    }
    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      res.status(400).json({ error: 'Positive amount required.' }); return;
    }

    const { userId } = (req as any).user;
    const db = Database.read();
    const wallet = db.wallets.find(w => w.userId === userId);
    if (!wallet) { res.status(404).json({ error: 'Wallet not found.' }); return; }

    const days = frequency === 'daily' ? 1 : frequency === 'weekly' ? 7 : 30;
    const sub: Subscription = {
      id: 'sub_' + Math.random().toString(36).substr(2, 9),
      walletId: wallet.id,
      merchantName,
      pointer: pointer.startsWith('$') ? pointer : `$${pointer}`,
      amount: numAmount,
      currency: wallet.currency,
      frequency,
      category,
      status: 'active',
      nextPaymentDate: new Date(Date.now() + 864e5 * days).toISOString(),
      interestRate: 0.10,
      createdAt: new Date().toISOString()
    };

    db.subscriptions.push(sub);
    Database.write(db);
    Database.log('SUBSCRIPTION_CREATED', `${merchantName} R ${numAmount} ${frequency}`);
    res.json({ success: true, subscription: sub });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

app.delete('/api/subscriptions/:id', authenticate, async (req, res) => {
  try {
    const { userId } = (req as any).user;
    const db = Database.read();
    const wallet = db.wallets.find(w => w.userId === userId);
    if (!wallet) { res.status(404).json({ error: 'Wallet not found.' }); return; }
    const idx = db.subscriptions.findIndex(s => s.id === req.params.id && s.walletId === wallet.id);
    if (idx === -1) { res.status(404).json({ error: 'Subscription not found.' }); return; }
    db.subscriptions.splice(idx, 1);
    Database.write(db);
    res.json({ success: true });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

app.post('/api/subscriptions/process/:id', authenticate, async (req, res) => {
  try {
    const { userId } = (req as any).user;
    const db = Database.read();
    const wallet = db.wallets.find(w => w.userId === userId);
    if (!wallet) { res.status(404).json({ error: 'Wallet not found.' }); return; }

    const sub = db.subscriptions.find(s => s.id === req.params.id && s.walletId === wallet.id);
    if (!sub) { res.status(404).json({ error: 'Subscription not found.' }); return; }

    const backed = wallet.balance < sub.amount;
    let infoText: string;

    if (backed) {
      wallet.creditOwed += sub.amount;
      wallet.confidenceScore = Math.max(300, wallet.confidenceScore - 40);
      sub.status = 'backed_up';
      infoText = `Panda Backup Syndicate covered R ${sub.amount}. Added to credit.`;
    } else {
      wallet.balance -= sub.amount;
      sub.status = 'active';
      wallet.confidenceScore = Math.min(1000, wallet.confidenceScore + 5);
      infoText = `Paid R ${sub.amount} to ${sub.merchantName}.`;
      applyBudget(db.budgetCategories.filter(b => b.walletId === wallet.id), sub.category, sub.amount);
    }

    const days = sub.frequency === 'daily' ? 1 : sub.frequency === 'weekly' ? 7 : 30;
    sub.lastPaymentDate = new Date().toISOString();
    sub.nextPaymentDate = new Date(Date.now() + 864e5 * days).toISOString();

    const transaction: Transaction = {
      id: 'tx_' + Math.random().toString(36).substr(2, 9),
      walletId: wallet.id,
      type: 'send',
      direction: 'out',
      amount: sub.amount,
      currency: wallet.currency,
      counterparty: sub.pointer,
      reference: 'debit_order_' + Math.random().toString(36).substr(2, 7),
      status: backed ? 'failed' : 'completed',
      category: sub.category,
      createdAt: new Date().toISOString()
    };

    db.transactions.unshift(transaction);
    Database.write(db);
    res.json({ success: true, wallet, subscription: sub, transaction, infoText, backedUp: backed });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

// ============================================================================
// BNPL — BUY NOW PAY LATER
// ============================================================================

app.get('/api/bnpl/contracts', authenticate, async (req, res) => {
  try {
    const { userId } = (req as any).user;
    const db = Database.read();
    const wallet = db.wallets.find(w => w.userId === userId);
    if (!wallet) { res.status(404).json({ error: 'Wallet not found.' }); return; }
    res.json({ contracts: db.bnplContracts.filter(c => c.walletId === wallet.id) });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

app.post('/api/bnpl/checkout', authenticate, async (req, res) => {
  try {
    const { merchantName, purchaseAmount, totalInstallments } = req.body;
    if (!merchantName || !purchaseAmount || !totalInstallments) {
      res.status(400).json({ error: 'merchantName, purchaseAmount, and totalInstallments required.' }); return;
    }

    const numAmount = parseFloat(purchaseAmount);
    const numInstallments = parseInt(totalInstallments);

    if (isNaN(numAmount) || numAmount <= 0) {
      res.status(400).json({ error: 'Positive purchase amount required.' }); return;
    }
    if (isNaN(numInstallments) || numInstallments < 2 || numInstallments > 12) {
      res.status(400).json({ error: 'Installments must be between 2 and 12.' }); return;
    }

    const { userId } = (req as any).user;
    const db = Database.read();
    const wallet = db.wallets.find(w => w.userId === userId);
    if (!wallet) { res.status(404).json({ error: 'Wallet not found.' }); return; }

    const installmentAmt = Math.round((numAmount / numInstallments) * 100) / 100;
    if (wallet.balance < installmentAmt) {
      res.status(400).json({
        error: `Need at least R ${installmentAmt.toFixed(2)} for the upfront installment.`
      }); return;
    }

    wallet.balance -= installmentAmt;

    const firstTxId = 'tx_bnpl_' + Math.random().toString(36).substr(2, 9);
    const installments: BnplInstallment[] = [
      {
        id: 'inst_' + Math.random().toString(36).substr(2, 9),
        installmentNumber: 1,
        amount: installmentAmt,
        dueDate: new Date().toISOString(),
        status: 'paid',
        paidAt: new Date().toISOString(),
        transactionId: firstTxId
      }
    ];

    let remaining = numAmount - installmentAmt;
    for (let i = 2; i <= numInstallments; i++) {
      const amt = i === numInstallments
        ? Math.round(remaining * 100) / 100
        : installmentAmt;
      remaining -= amt;
      installments.push({
        id: 'inst_' + Math.random().toString(36).substr(2, 9),
        installmentNumber: i,
        amount: amt,
        dueDate: new Date(Date.now() + 864e5 * 30 * (i - 1)).toISOString(),
        status: 'pending'
      });
    }

    const contract: BnplContract = {
      id: 'bnpl_' + Math.random().toString(36).substr(2, 9),
      walletId: wallet.id,
      merchantName,
      purchaseAmount: numAmount,
      remainingAmount: Math.round((numAmount - installmentAmt) * 100) / 100,
      currency: wallet.currency,
      totalInstallments: numInstallments,
      status: 'active',
      createdAt: new Date().toISOString(),
      installments
    };

    db.bnplContracts.push(contract);
    db.transactions.unshift({
      id: firstTxId,
      walletId: wallet.id,
      type: 'send',
      direction: 'out',
      amount: installmentAmt,
      currency: wallet.currency,
      counterparty: merchantName,
      reference: `BNPL Split 1/${numInstallments}`,
      status: 'completed',
      category: 'General',
      createdAt: new Date().toISOString()
    });

    wallet.confidenceScore = Math.min(1000, wallet.confidenceScore + 10);
    applyBudget(
      db.budgetCategories.filter(b => b.walletId === wallet.id),
      'General',
      installmentAmt
    );

    Database.write(db);
    Database.log('BNPL_CREATED', `${merchantName} R ${numAmount} in ${numInstallments} splits.`);
    res.json({ success: true, contract, wallet });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

app.post('/api/bnpl/repay/:contractId/:installmentId', authenticate, async (req, res) => {
  try {
    const { contractId, installmentId } = req.params;
    const { userId } = (req as any).user;
    const db = Database.read();
    const wallet = db.wallets.find(w => w.userId === userId);
    if (!wallet) { res.status(404).json({ error: 'Wallet not found.' }); return; }

    const contract = db.bnplContracts.find(c => c.id === contractId && c.walletId === wallet.id);
    if (!contract) { res.status(404).json({ error: 'Contract not found.' }); return; }

    const inst = contract.installments.find(i => i.id === installmentId);
    if (!inst) { res.status(404).json({ error: 'Installment not found.' }); return; }
    if (inst.status === 'paid') {
      res.status(400).json({ error: 'Installment already paid.' }); return;
    }
    if (wallet.balance < inst.amount) {
      res.status(400).json({ error: `Need R ${inst.amount.toFixed(2)} to pay this installment.` }); return;
    }

    wallet.balance -= inst.amount;
    inst.status = 'paid';
    inst.paidAt = new Date().toISOString();
    const repayTxId = 'tx_repay_' + Math.random().toString(36).substr(2, 9);
    inst.transactionId = repayTxId;

    contract.remainingAmount = Math.max(0, Math.round((contract.remainingAmount - inst.amount) * 100) / 100);
    if (contract.installments.every(i => i.status === 'paid')) contract.status = 'completed';

    wallet.confidenceScore = Math.min(1000, wallet.confidenceScore + 15);

    db.transactions.unshift({
      id: repayTxId,
      walletId: wallet.id,
      type: 'send',
      direction: 'out',
      amount: inst.amount,
      currency: wallet.currency,
      counterparty: contract.merchantName,
      reference: `BNPL Repay ${inst.installmentNumber}/${contract.totalInstallments}`,
      status: 'completed',
      category: 'General',
      createdAt: new Date().toISOString()
    });

    Database.write(db);
    Database.log('BNPL_REPAY', `R ${inst.amount} for ${contract.merchantName}.`);
    res.json({ success: true, contract, wallet });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

// ============================================================================
// CREDIT REPAYMENT
// ============================================================================

app.post('/api/credit/repay', authenticate, async (req, res) => {
  try {
    const numAmount = parseFloat(req.body.amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      res.status(400).json({ error: 'Positive amount required.' }); return;
    }

    const { userId } = (req as any).user;
    const db = Database.read();
    const wallet = db.wallets.find(w => w.userId === userId);
    if (!wallet) { res.status(404).json({ error: 'Wallet not found.' }); return; }
    if (wallet.creditOwed <= 0) {
      res.status(400).json({ error: 'No outstanding debt.' }); return;
    }
    if (wallet.balance < numAmount) {
      res.status(400).json({ error: 'Insufficient balance.' }); return;
    }

    const pay = Math.min(wallet.creditOwed, numAmount);
    wallet.balance -= pay;
    wallet.creditOwed -= pay;
    wallet.accumulatedInterest = Math.max(0, wallet.accumulatedInterest - pay * 0.1);
    wallet.confidenceScore = Math.min(1000, wallet.confidenceScore + Math.floor(pay / 10));

    const transaction: Transaction = {
      id: 'tx_' + Math.random().toString(36).substr(2, 9),
      walletId: wallet.id,
      type: 'send',
      direction: 'out',
      amount: pay,
      currency: wallet.currency,
      counterparty: 'Panda Backup Syndicate',
      reference: 'credit_repay_' + Math.random().toString(36).substr(2, 7),
      status: 'completed',
      category: 'Savings',
      createdAt: new Date().toISOString()
    };

    db.transactions.unshift(transaction);
    Database.write(db);
    Database.log('CREDIT_REPAY', `Repaid R ${pay} of syndicate credit.`);
    res.json({ success: true, wallet, transaction });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

// ============================================================================
// SIMULATION — TIME TRAVEL
// ============================================================================

app.post('/api/simulation/timetravel', authenticate, async (req, res) => {
  try {
    const { userId } = (req as any).user;
    const db = Database.read();
    const wallet = db.wallets.find(w => w.userId === userId);
    if (!wallet) { res.status(404).json({ error: 'Wallet not found.' }); return; }

    let interestAccrued = 0;
    if (wallet.creditOwed > 0) {
      interestAccrued = wallet.creditOwed * 0.10;
      wallet.creditOwed += interestAccrued;
      wallet.accumulatedInterest += interestAccrued;
      wallet.confidenceScore = Math.max(300, wallet.confidenceScore - 25);
    }

    db.budgetCategories
      .filter(b => b.walletId === wallet.id)
      .forEach(b => { b.allocated = 0; });

    Database.write(db);
    Database.log('TIME_TRAVEL', '30-day leap. Budgets reset. Interest applied.');
    res.json({ success: true, wallet, interestAccrued });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

// ============================================================================
// HELPERS
// ============================================================================

function applyBudget(budgets: BudgetCategory[], category: string, amount: number) {
  const cat = category.toLowerCase();
  const target = budgets.find(b =>
    b.name.toLowerCase().includes(cat) || cat.includes(b.name.toLowerCase())
  );
  if (target) {
    target.allocated = Math.min(target.limit, target.allocated + amount);
  }
}

async function safeAutoCategorize(desc: string, amount: number): Promise<string> {
  try {
    return await AIService.autoCategorizeTransaction(desc, amount);
  } catch {
    return 'General';
  }
}

// ============================================================================
// START
// ============================================================================

app.listen(PORT, '0.0.0.0', () => {
  console.log(`[PandaPay Server] Running on http://localhost:${PORT}`);
  console.log(`[PandaPay Server] Open Payments mode: ${isOPConfigured() ? 'LIVE' : 'SIMULATION'}`);
});
