import express from "express";
import path from "path";
import dotenv from "dotenv";
import { createServer as createViteServer } from "vite";

// Load environment variables
dotenv.config();

import { Database } from "./backend/db";
import { WalletService } from "./backend/services/interledger/WalletService";
import { GrantService } from "./backend/services/interledger/GrantService";
import { IncomingPaymentService } from "./backend/services/interledger/IncomingPaymentService";
import { OutgoingPaymentService } from "./backend/services/interledger/OutgoingPaymentService";
import { QuoteService } from "./backend/services/interledger/QuoteService";
import { AIService } from "./src/services/ai/AIService";
import { Transaction, BudgetCategory, Message } from "./src/types";

async function startServer() {
  const app = express();
  const PORT = 5689;

  // Middleware for parsing JSON
  app.use(express.json());

  // Simple session tracker (In-Memory Auth token map)
  const authTokens = new Map<string, { email: string; userId: string }>();

  // Helper middleware to authenticate API calls
  const authenticate = (req: express.Request, res: express.Response, next: express.NextFunction) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Unauthorized. Please login first.' });
    }
    const token = authHeader.split(' ')[1];
    const session = authTokens.get(token);
    if (!session) {
      return res.status(401).json({ error: 'Session expired. Please re-authenticate.' });
    }
    (req as any).user = session;
    next();
  };

  // ==========================================
  // AUTHENTICATION API
  // ==========================================
  app.post("/api/auth/login", async (req, res) => {
    try {
      const { email } = req.body;
      if (!email || !email.includes('@')) {
        return res.status(400).json({ error: 'Please enter a valid email address.' });
      }

      const db = Database.read();
      let user = db.users.find(u => u.email.toLowerCase() === email.toLowerCase());
      
      if (!user) {
        user = {
          id: 'usr_' + Math.random().toString(36).substr(2, 9),
          email: email.toLowerCase(),
          name: email.split('@')[0],
          createdAt: new Date().toISOString()
        };
        db.users.push(user);
        Database.write(db);
        Database.log('USER_CREATED', `New user registered with email: ${email}`);
      }

      // Ensure wallet is created/dispatched
      const username = user.name.toLowerCase().replace(/[^a-z0-9]/g, '');
      const wallet = await WalletService.getOrCreateWallet(user.id, username);

      // Generate simulation token
      const token = 'token_' + Math.random().toString(36).substr(2, 16);
      authTokens.set(token, { email: user.email, userId: user.id });

      res.json({ token, user, wallet });
    } catch (e: any) {
      res.status(500).json({ error: e.message || 'Authentication error.' });
    }
  });

  app.get("/api/auth/me", authenticate, async (req, res) => {
    try {
      const session = (req as any).user;
      const db = Database.read();
      const user = db.users.find(u => u.id === session.userId);
      const wallet = db.wallets.find(w => w.userId === session.userId);
      
      res.json({ user, wallet });
    } catch (e: any) {
      res.status(500).json({ error: e.message || 'Session recovery error.' });
    }
  });

  // ==========================================
  // INTERLEDGER OPEN PAYMENTS: DEPOSIT FLOW
  // ==========================================
  app.post("/api/payments/deposit", authenticate, async (req, res) => {
    try {
      const { amount, username } = req.body;
      const numAmount = parseFloat(amount);
      if (isNaN(numAmount) || numAmount <= 0) {
        return res.status(400).json({ error: 'Please enter a positive numeric amount.' });
      }

      const session = (req as any).user;
      const db = Database.read();
      const wallet = db.wallets.find(w => w.userId === session.userId);
      if (!wallet) return res.status(404).json({ error: 'Wallet not found.' });

      // Build target payment pointer
      const targetPointer = WalletService.generatePointer(username || wallet.username);

      // 1. Negotiation of Grants (Backend Secure Execution)
      const grant = await GrantService.requestGrant(wallet.id, 'incoming', 'incoming-payment-create');

      // 2. Open Payments Incoming Payment creation
      const paymentDetails = await IncomingPaymentService.createIncomingPayment(
        targetPointer,
        numAmount,
        wallet.currency,
        `Deposit of ${wallet.currency} ${numAmount} via ZenPay Interledger`
      );

      // 3. Increment ledger funds instantly inside the simulation
      await WalletService.updateBalance(wallet.id, numAmount, 'add');

      // 4. Update budget categories if auto-categorized or General
      const category = "General"; // Deposits generally don't hit budget limits
      
      // 5. Append transaction record
      const reference = 'ref_dep_' + Math.random().toString(36).substr(2, 7);
      const transaction: Transaction = {
        id: 'tx_' + Math.random().toString(36).substr(2, 9),
        walletId: wallet.id,
        type: 'deposit',
        direction: 'in',
        amount: numAmount,
        currency: wallet.currency,
        counterparty: 'Deposit via ILP',
        reference,
        status: 'completed',
        category,
        createdAt: new Date().toISOString()
      };

      db.transactions.unshift(transaction);
      Database.write(db);
      Database.log('DEPOSIT_SUCCESS', `Deposited ${wallet.currency} ${numAmount} into ${wallet.pointer}`);

      res.json({
        transaction,
        paymentPointer: targetPointer,
        qrCode: paymentDetails.qrCode,
        grantId: grant.id
      });
    } catch (e: any) {
      res.status(500).json({ error: e.message || 'Deposit negotiation failed.' });
    }
  });

  // ==========================================
  // INTERLEDGER OPEN PAYMENTS: SEND FLOW
  // ==========================================
  app.post("/api/payments/quote", authenticate, async (req, res) => {
    try {
      const { destination, amount } = req.body;
      const numAmount = parseFloat(amount);
      if (!destination || isNaN(numAmount) || numAmount <= 0) {
        return res.status(400).json({ error: 'Destination pointer and positive amount required.' });
      }

      const session = (req as any).user;
      const db = Database.read();
      const wallet = db.wallets.find(w => w.userId === session.userId);
      if (!wallet) return res.status(404).json({ error: 'Wallet not found.' });

      // Generate conversion/quote
      const destPointer = WalletService.generatePointer(destination);
      const quote = await QuoteService.createQuote(wallet.pointer, destPointer, numAmount, wallet.currency);

      res.json({ quote });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.post("/api/payments/send", authenticate, async (req, res) => {
    try {
      const { quoteId, destination, amount, description } = req.body;
      const numAmount = parseFloat(amount);
      if (isNaN(numAmount) || numAmount <= 0) {
        return res.status(400).json({ error: 'Positive numeric amount required.' });
      }

      const session = (req as any).user;
      const db = Database.read();
      const wallet = db.wallets.find(w => w.userId === session.userId);
      if (!wallet) return res.status(404).json({ error: 'Wallet not found.' });

      if (wallet.balance < numAmount) {
        return res.status(400).json({ error: 'Insufficient wallet balance.' });
      }

      const destPointer = WalletService.generatePointer(destination);

      // Secure Backend Open Payments outbound execution
      await GrantService.requestGrant(wallet.id, 'outgoing', 'outgoing-payment-create');
      await OutgoingPaymentService.createOutgoingPayment(destPointer, numAmount, wallet.currency, description || 'Transfer');

      // Deduct balance
      await WalletService.updateBalance(wallet.id, numAmount, 'subtract');

      // AI auto-categorization of outgoing transaction
      const category = await AIService.autoCategorizeTransaction(description || destination, numAmount);

      // If budget category exists, increment its current allocated spending
      const budgets = db.budgetCategories.filter(b => b.walletId === wallet.id);
      const targetBudget = budgets.find(b => b.name.toLowerCase().includes(category.toLowerCase()) || category.toLowerCase().includes(b.name.toLowerCase()));
      if (targetBudget) {
        targetBudget.allocated = Math.min(targetBudget.limit, targetBudget.allocated + numAmount);
      }

      // Add to transaction log
      const reference = 'ref_snd_' + Math.random().toString(36).substr(2, 7);
      const transaction: Transaction = {
        id: 'tx_' + Math.random().toString(36).substr(2, 9),
        walletId: wallet.id,
        type: 'send',
        direction: 'out',
        amount: numAmount,
        currency: wallet.currency,
        counterparty: destPointer,
        reference,
        status: 'completed',
        category,
        createdAt: new Date().toISOString()
      };

      db.transactions.unshift(transaction);
      Database.write(db);
      Database.log('SEND_SUCCESS', `Sent ${wallet.currency} ${numAmount} to ${destPointer}`);

      res.json({ transaction });
    } catch (e: any) {
      res.status(500).json({ error: e.message || 'Payment transfer failed.' });
    }
  });

  // ==========================================
  // TRANSACTION LOGS WITH ADVANCED FILTERS
  // ==========================================
  app.get("/api/transactions", authenticate, async (req, res) => {
    try {
      const session = (req as any).user;
      const { type, status, startDate, endDate, search, page = '1', limit = '10' } = req.query;

      const db = Database.read();
      const wallet = db.wallets.find(w => w.userId === session.userId);
      if (!wallet) return res.status(404).json({ error: 'Wallet not found.' });

      let list = db.transactions.filter(t => t.walletId === wallet.id);

      // Filters
      if (type) list = list.filter(t => t.type === type);
      if (status) list = list.filter(t => t.status === status);
      if (startDate) list = list.filter(t => new Date(t.createdAt) >= new Date(startDate as string));
      if (endDate) list = list.filter(t => new Date(t.createdAt) <= new Date(endDate as string));
      
      if (search) {
        const query = (search as string).toLowerCase();
        list = list.filter(t => 
          t.reference.toLowerCase().includes(query) || 
          t.counterparty.toLowerCase().includes(query) ||
          t.category.toLowerCase().includes(query)
        );
      }

      // Calculate totals
      let totalIn = 0;
      let totalOut = 0;
      list.forEach(t => {
        if (t.status === 'completed') {
          if (t.direction === 'in') totalIn += t.amount;
          else totalOut += t.amount;
        }
      });

      // Pagination
      const pageNum = parseInt(page as string);
      const limitNum = parseInt(limit as string);
      const totalItems = list.length;
      const totalPages = Math.ceil(totalItems / limitNum);
      const paginatedList = list.slice((pageNum - 1) * limitNum, pageNum * limitNum);

      res.json({
        transactions: paginatedList,
        summary: {
          totalIn,
          totalOut,
          net: totalIn - totalOut
        },
        pagination: {
          page: pageNum,
          limit: limitNum,
          totalItems,
          totalPages
        }
      });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  // ==========================================
  // BUDGET CONTROLLER (CRUD)
  // ==========================================
  app.get("/api/budget", authenticate, async (req, res) => {
    try {
      const session = (req as any).user;
      const db = Database.read();
      const wallet = db.wallets.find(w => w.userId === session.userId);
      if (!wallet) return res.status(404).json({ error: 'Wallet not found.' });

      const categories = db.budgetCategories.filter(b => b.walletId === wallet.id);
      res.json({ categories });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.post("/api/budget/category", authenticate, async (req, res) => {
    try {
      const { name, limit, icon, color } = req.body;
      const numLimit = parseFloat(limit);
      if (!name || isNaN(numLimit) || numLimit <= 0) {
        return res.status(400).json({ error: 'Valid category name and positive limit required.' });
      }

      const session = (req as any).user;
      const db = Database.read();
      const wallet = db.wallets.find(w => w.userId === session.userId);
      if (!wallet) return res.status(404).json({ error: 'Wallet not found.' });

      const newCategory: BudgetCategory = {
        id: 'bc_' + Math.random().toString(36).substr(2, 9),
        walletId: wallet.id,
        name,
        icon: icon || 'shopping-bag',
        limit: numLimit,
        allocated: 0,
        color: color || '#EF9F27'
      };

      db.budgetCategories.push(newCategory);
      Database.write(db);
      Database.log('BUDGET_CREATED', `Budget category "${name}" added with limit of R ${numLimit}`);

      res.json({ category: newCategory });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.put("/api/budget/category/:id", authenticate, async (req, res) => {
    try {
      const { name, limit, allocated, icon, color } = req.body;
      const { id } = req.params;

      const db = Database.read();
      const category = db.budgetCategories.find(c => c.id === id);
      if (!category) return res.status(404).json({ error: 'Budget category not found.' });

      if (name) category.name = name;
      if (limit !== undefined) category.limit = parseFloat(limit);
      if (allocated !== undefined) category.allocated = parseFloat(allocated);
      if (icon) category.icon = icon;
      if (color) category.color = color;

      Database.write(db);
      Database.log('BUDGET_UPDATED', `Budget category "${category.name}" details updated.`);

      res.json({ category });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.delete("/api/budget/category/:id", authenticate, async (req, res) => {
    try {
      const { id } = req.params;
      const db = Database.read();
      const index = db.budgetCategories.findIndex(c => c.id === id);
      
      if (index === -1) return res.status(404).json({ error: 'Budget category not found.' });
      
      const removed = db.budgetCategories.splice(index, 1)[0];
      Database.write(db);
      Database.log('BUDGET_DELETED', `Budget category "${removed.name}" removed.`);

      res.json({ success: true });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  // ==========================================
  // AI INTEGRATION: CHAT & RECOMMENDATIONS
  // ==========================================
  app.post("/api/ai/chat", authenticate, async (req, res) => {
    try {
      const { message } = req.body;
      if (!message) return res.status(400).json({ error: 'Message required.' });

      const session = (req as any).user;
      const db = Database.read();
      const wallet = db.wallets.find(w => w.userId === session.userId);
      if (!wallet) return res.status(404).json({ error: 'Wallet not found.' });

      // Fetch conversation or create new
      let conversation = db.aiConversations.find(c => c.userId === session.userId);
      if (!conversation) {
        conversation = {
          id: 'con_' + Math.random().toString(36).substr(2, 9),
          userId: session.userId,
          messages: [],
          createdAt: new Date().toISOString()
        };
        db.aiConversations.push(conversation);
      }

      // Add user message
      conversation.messages.push({
        role: 'user',
        content: message,
        timestamp: new Date().toISOString()
      });

      // Prepare context for Gemini model
      const budgets = db.budgetCategories.filter(b => b.walletId === wallet.id);
      const recentTx = db.transactions.filter(t => t.walletId === wallet.id).slice(0, 5);
      
      const systemInstruction = `You are Zenny, the helpful, wise financial fox mascot of ZenPay 🦊. 
      You speak directly to the user in a cheerful, supportive, and clever manner.
      You have access to the user's wallet and budget context:
      - Wallet Balance: R ${wallet.balance.toFixed(2)}
      - Pointer: ${wallet.pointer}
      - Budgets: ${JSON.stringify(budgets)}
      - Recent Payments: ${JSON.stringify(recentTx)}
      Answer the user's financial questions accurately, give encouraging saving tips, and keep responses within 3 sentences. Do not mention file paths or technical variables.`;

      // Trigger Gemini / AI Abstraction
      const provider = AIService.getProvider();
      const responseText = await provider.generateText(message, systemInstruction);

      // Add model response
      conversation.messages.push({
        role: 'model',
        content: responseText,
        timestamp: new Date().toISOString()
      });

      Database.write(db);

      res.json({ response: responseText, messages: conversation.messages });
    } catch (e: any) {
      res.status(500).json({ error: e.message || 'AI assistant had a momentary glitch.' });
    }
  });

  app.get("/api/ai/insights", authenticate, async (req, res) => {
    try {
      const session = (req as any).user;
      const db = Database.read();
      const wallet = db.wallets.find(w => w.userId === session.userId);
      if (!wallet) return res.status(404).json({ error: 'Wallet not found.' });

      const tx = db.transactions.filter(t => t.walletId === wallet.id);
      const budgets = db.budgetCategories.filter(b => b.walletId === wallet.id);

      const advice = await AIService.getBudgetAdvice(tx, budgets);
      res.json({ advice });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  // ==========================================
  // VITE DEVELOPMENT SERVER & PRODUCTION FLOW
  // ==========================================
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`[ZenPay Backend] Live at http://localhost:${PORT}`);
  });
}

startServer();
