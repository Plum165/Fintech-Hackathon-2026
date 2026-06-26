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
import { Transaction, BudgetCategory, Message, Subscription, BnplContract, BnplInstallment } from "./src/types";

async function startServer() {
  const app = express();
  const PORT = 3000;

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
      if (!email) {
        return res.status(400).json({ error: 'Please enter a valid email address or Interledger payment pointer.' });
      }

      const input = email.trim().toLowerCase();
      const isPointer = input.startsWith('$') || input.includes('/');
      
      const db = Database.read();
      let user;
      let wallet;

      if (isPointer) {
        // Resolve payment pointer to find wallet/user
        const cleanPointer = input.startsWith('$') ? input : `$${input}`;
        const existingWallet = db.wallets.find(w => w.pointer.toLowerCase() === cleanPointer.toLowerCase() || w.username.toLowerCase() === input.replace(/^\$/, '').toLowerCase());
        
        if (existingWallet) {
          user = db.users.find(u => u.id === existingWallet.userId);
          wallet = existingWallet;
        } else {
          // Create new user/wallet from pointer
          const username = input.replace(/^\$/, '').split('/')[0] || 'user';
          const mockEmail = `${username}@example.com`;
          user = {
            id: 'usr_' + Math.random().toString(36).substr(2, 9),
            email: mockEmail,
            name: username.charAt(0).toUpperCase() + username.slice(1),
            consentAccepted: false,
            kycStatus: 'unverified',
            createdAt: new Date().toISOString()
          };
          db.users.push(user);
          Database.write(db);
          Database.log('USER_CREATED', `New user registered via pointer: ${input}`);
          
          wallet = await WalletService.getOrCreateWallet(user.id, username);
        }
      } else {
        // Normal email login
        if (!input.includes('@')) {
          return res.status(400).json({ error: 'Please enter a valid email address or Interledger payment pointer (e.g. $corazon).' });
        }

        user = db.users.find(u => u.email.toLowerCase() === input);
        
        if (!user) {
          user = {
            id: 'usr_' + Math.random().toString(36).substr(2, 9),
            email: input,
            name: input.split('@')[0],
            consentAccepted: false,
            kycStatus: 'unverified',
            createdAt: new Date().toISOString()
          };
          db.users.push(user);
          Database.write(db);
          Database.log('USER_CREATED', `New user registered with email: ${input}`);
        }

        // Ensure wallet is created/dispatched
        const username = user.name.toLowerCase().replace(/[^a-z0-9]/g, '');
        wallet = await WalletService.getOrCreateWallet(user.id, username);
      }

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
        `Deposit of ${wallet.currency} ${numAmount} via PandaPay Interledger`
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
      
      const systemInstruction = `You are Zen, the helpful, wise financial panda mascot of PandaPay 🐼. 
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
  // CONSENT & DATA PRIVACY
  // ==========================================
  app.post("/api/auth/consent", authenticate, async (req, res) => {
    try {
      const session = (req as any).user;
      const db = Database.read();
      const user = db.users.find(u => u.id === session.userId);
      if (!user) return res.status(404).json({ error: 'User not found.' });

      user.consentAccepted = true;
      Database.write(db);
      Database.log('CONSENT_ACCEPTED', `User ${user.email} accepted platform data privacy consent terms.`);

      res.json({ success: true, user });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  // ==========================================
  // KYC COMPLIANCE VERIFICATION
  // ==========================================
  app.post("/api/auth/kyc", authenticate, async (req, res) => {
    try {
      const { fullName, idNumber, country, documentType } = req.body;
      if (!fullName || !idNumber || !country || !documentType) {
        return res.status(400).json({ error: 'All KYC fields are required (Full name, ID number, country, document type).' });
      }

      const session = (req as any).user;
      const db = Database.read();
      const user = db.users.find(u => u.id === session.userId);
      if (!user) return res.status(404).json({ error: 'User not found.' });

      user.kycStatus = 'verified';
      user.kycDetails = { fullName, idNumber, country, documentType };

      // Update wallet confidence score now that user is verified!
      const wallet = db.wallets.find(w => w.userId === session.userId);
      if (wallet) {
        wallet.confidenceScore = Math.min(1000, wallet.confidenceScore + 100); // 100 point boost for completing KYC!
      }

      Database.write(db);
      Database.log('KYC_VERIFIED', `User ${user.email} completed KYC. Identity verified successfully.`);

      res.json({ success: true, user, wallet });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  // ==========================================
  // SAVINGS RESERVE BUCKET
  // ==========================================
  app.post("/api/reserve/deposit", authenticate, async (req, res) => {
    try {
      const { amount } = req.body;
      const numAmount = parseFloat(amount);
      if (isNaN(numAmount) || numAmount <= 0) {
        return res.status(400).json({ error: 'Please enter a positive amount to save.' });
      }

      const session = (req as any).user;
      const db = Database.read();
      const wallet = db.wallets.find(w => w.userId === session.userId);
      if (!wallet) return res.status(404).json({ error: 'Wallet not found.' });

      if (wallet.balance < numAmount) {
        return res.status(400).json({ error: 'Insufficient wallet balance to transfer to reserve.' });
      }

      wallet.balance -= numAmount;
      wallet.reserveBalance += numAmount;
      
      // Update confidence score positively for saving!
      wallet.confidenceScore = Math.min(1000, wallet.confidenceScore + Math.floor(numAmount / 50));

      // Append transaction record for reserve movement
      const transaction: Transaction = {
        id: 'tx_' + Math.random().toString(36).substr(2, 9),
        walletId: wallet.id,
        type: 'send',
        direction: 'out',
        amount: numAmount,
        currency: wallet.currency,
        counterparty: 'Savings Reserve Bucket 🐷',
        reference: 'reserve_dep_' + Math.random().toString(36).substr(2, 7),
        status: 'completed',
        category: 'Savings',
        createdAt: new Date().toISOString()
      };

      db.transactions.unshift(transaction);
      Database.write(db);
      Database.log('RESERVE_DEPOSIT', `Allocated R ${numAmount} to locked reserve savings bucket.`);

      res.json({ success: true, wallet, transaction });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.post("/api/reserve/withdraw", authenticate, async (req, res) => {
    try {
      const { amount } = req.body;
      const numAmount = parseFloat(amount);
      if (isNaN(numAmount) || numAmount <= 0) {
        return res.status(400).json({ error: 'Please enter a positive amount to release.' });
      }

      const session = (req as any).user;
      const db = Database.read();
      const wallet = db.wallets.find(w => w.userId === session.userId);
      if (!wallet) return res.status(404).json({ error: 'Wallet not found.' });

      if (wallet.reserveBalance < numAmount) {
        return res.status(400).json({ error: 'Insufficient savings reserve balance.' });
      }

      wallet.reserveBalance -= numAmount;
      wallet.balance += numAmount;

      // Append transaction record for reserve movement
      const transaction: Transaction = {
        id: 'tx_' + Math.random().toString(36).substr(2, 9),
        walletId: wallet.id,
        type: 'receive',
        direction: 'in',
        amount: numAmount,
        currency: wallet.currency,
        counterparty: 'Savings Reserve Release 🐷',
        reference: 'reserve_wd_' + Math.random().toString(36).substr(2, 7),
        status: 'completed',
        category: 'Savings',
        createdAt: new Date().toISOString()
      };

      db.transactions.unshift(transaction);
      Database.write(db);
      Database.log('RESERVE_WITHDRAWAL', `Released R ${numAmount} from locked reserve bucket to main balance.`);

      res.json({ success: true, wallet, transaction });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  // ==========================================
  // RECURRING SUBSCRIPTIONS & DEBIT ORDERS
  // ==========================================
  app.get("/api/subscriptions", authenticate, async (req, res) => {
    try {
      const session = (req as any).user;
      const db = Database.read();
      const wallet = db.wallets.find(w => w.userId === session.userId);
      if (!wallet) return res.status(404).json({ error: 'Wallet not found.' });

      const subs = db.subscriptions ? db.subscriptions.filter(s => s.walletId === wallet.id) : [];
      res.json({ subscriptions: subs });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.post("/api/subscriptions", authenticate, async (req, res) => {
    try {
      const { merchantName, pointer, amount, frequency, category } = req.body;
      if (!merchantName || !pointer || !amount || !frequency || !category) {
        return res.status(400).json({ error: 'All subscription fields are required (Merchant name, pointer, amount, frequency, category).' });
      }

      const numAmount = parseFloat(amount);
      if (isNaN(numAmount) || numAmount <= 0) {
        return res.status(400).json({ error: 'Positive numeric amount required.' });
      }

      const session = (req as any).user;
      const db = Database.read();
      const wallet = db.wallets.find(w => w.userId === session.userId);
      if (!wallet) return res.status(404).json({ error: 'Wallet not found.' });

      const newSub: Subscription = {
        id: 'sub_' + Math.random().toString(36).substr(2, 9),
        walletId: wallet.id,
        merchantName,
        pointer: pointer.startsWith('$') ? pointer : `$${pointer}`,
        amount: numAmount,
        currency: wallet.currency,
        frequency,
        category,
        status: 'active',
        nextPaymentDate: new Date(Date.now() + 3600000 * 24 * (frequency === 'daily' ? 1 : frequency === 'weekly' ? 7 : 30)).toISOString(),
        interestRate: 0.10, // 10% penalty interest rate
        createdAt: new Date().toISOString()
      };

      if (!db.subscriptions) db.subscriptions = [];
      db.subscriptions.push(newSub);
      Database.write(db);
      Database.log('SUBSCRIPTION_CREATED', `Created recurring subscription: ${merchantName} for ${wallet.currency} ${numAmount}`);

      res.json({ success: true, subscription: newSub });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.delete("/api/subscriptions/:id", authenticate, async (req, res) => {
    try {
      const { id } = req.params;
      const session = (req as any).user;
      const db = Database.read();
      const wallet = db.wallets.find(w => w.userId === session.userId);
      if (!wallet) return res.status(404).json({ error: 'Wallet not found.' });

      const subIndex = db.subscriptions ? db.subscriptions.findIndex(s => s.id === id && s.walletId === wallet.id) : -1;
      if (subIndex === -1) return res.status(404).json({ error: 'Subscription not found.' });

      const sub = db.subscriptions[subIndex];
      db.subscriptions.splice(subIndex, 1);
      Database.write(db);
      Database.log('SUBSCRIPTION_DELETED', `Cancelled recurring subscription: ${sub.merchantName}`);

      res.json({ success: true });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.post("/api/subscriptions/process/:id", authenticate, async (req, res) => {
    try {
      const { id } = req.params;
      const session = (req as any).user;
      const db = Database.read();
      const wallet = db.wallets.find(w => w.userId === session.userId);
      if (!wallet) return res.status(404).json({ error: 'Wallet not found.' });

      const sub = db.subscriptions ? db.subscriptions.find(s => s.id === id && s.walletId === wallet.id) : null;
      if (!sub) return res.status(404).json({ error: 'Subscription not found.' });

      const isDebitOrderCoveredByBackup = wallet.balance < sub.amount;
      
      let txStatus: 'completed' | 'failed' = 'completed';
      let infoText = '';

      if (isDebitOrderCoveredByBackup) {
        // Fintech Group covers the payment!
        wallet.creditOwed += sub.amount;
        wallet.confidenceScore = Math.max(300, wallet.confidenceScore - 40); // Drop credit score for failing to pay debit order
        sub.status = 'backed_up';
        infoText = `Merchant paid via Panda Backup Syndicate. R ${sub.amount} added to outstanding credit with 10% interest penalty.`;
        
        Database.log('FINTECH_BACKUP_COVER', `Panda Backup Syndicate covered debit order for ${sub.merchantName} of R ${sub.amount}. User credit owed increased to R ${wallet.creditOwed.toFixed(2)}.`);
      } else {
        // Normal payment
        wallet.balance -= sub.amount;
        sub.status = 'active';
        infoText = `Subscription processed successfully. Paid R ${sub.amount} to ${sub.merchantName}.`;
        
        // Update budget category
        const budgets = db.budgetCategories.filter(b => b.walletId === wallet.id);
        const targetBudget = budgets.find(b => b.name.toLowerCase().includes(sub.category.toLowerCase()) || sub.category.toLowerCase().includes(b.name.toLowerCase()));
        if (targetBudget) {
          targetBudget.allocated = Math.min(targetBudget.limit, targetBudget.allocated + sub.amount);
        }
        
        // Slight confidence score boost
        wallet.confidenceScore = Math.min(1000, wallet.confidenceScore + 5);
        Database.log('SUBSCRIPTION_PROCESSED', `Processed payment of R ${sub.amount} for ${sub.merchantName}`);
      }

      // Record last payment and cycle next payment date
      const frequencyDays = sub.frequency === 'daily' ? 1 : sub.frequency === 'weekly' ? 7 : 30;
      sub.lastPaymentDate = new Date().toISOString();
      sub.nextPaymentDate = new Date(Date.now() + 3600000 * 24 * frequencyDays).toISOString();

      // Transaction log
      const transaction: Transaction = {
        id: 'tx_' + Math.random().toString(36).substr(2, 9),
        walletId: wallet.id,
        type: 'send',
        direction: 'out',
        amount: sub.amount,
        currency: wallet.currency,
        counterparty: sub.pointer,
        reference: 'debit_order_' + Math.random().toString(36).substr(2, 7),
        status: txStatus,
        category: sub.category,
        createdAt: new Date().toISOString()
      };

      db.transactions.unshift(transaction);
      Database.write(db);

      res.json({ success: true, wallet, subscription: sub, transaction, infoText, backedUp: isDebitOrderCoveredByBackup });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  // ==========================================
  // BUY NOW, PAY LATER (BNPL) ROUTES
  // ==========================================
  app.get("/api/bnpl/contracts", authenticate, async (req, res) => {
    try {
      const session = (req as any).user;
      const db = Database.read();
      const wallet = db.wallets.find(w => w.userId === session.userId);
      if (!wallet) return res.status(404).json({ error: 'Wallet not found.' });

      const contracts = db.bnplContracts ? db.bnplContracts.filter(c => c.walletId === wallet.id) : [];
      res.json({ contracts });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.post("/api/bnpl/checkout", authenticate, async (req, res) => {
    try {
      const { merchantName, purchaseAmount, totalInstallments } = req.body;
      if (!merchantName || !purchaseAmount || !totalInstallments) {
        return res.status(400).json({ error: 'Merchant name, purchase amount, and total installments are required.' });
      }

      const numAmount = parseFloat(purchaseAmount);
      const numInstallments = parseInt(totalInstallments);

      if (isNaN(numAmount) || numAmount <= 0) {
        return res.status(400).json({ error: 'Positive numeric purchase amount required.' });
      }
      if (isNaN(numInstallments) || numInstallments < 2 || numInstallments > 6) {
        return res.status(400).json({ error: 'Installments must be between 2 and 6.' });
      }

      const session = (req as any).user;
      const db = Database.read();
      const wallet = db.wallets.find(w => w.userId === session.userId);
      if (!wallet) return res.status(404).json({ error: 'Wallet not found.' });

      // First installment is paid upfront!
      const installmentAmount = Math.round((numAmount / numInstallments) * 100) / 100;
      
      if (wallet.balance < installmentAmount) {
        return res.status(400).json({ 
          error: `Insufficient balance for upfront payment. You need at least ${wallet.currency} ${installmentAmount.toFixed(2)} to complete this split checkout.` 
        });
      }

      // Charge first installment upfront
      wallet.balance -= installmentAmount;

      // Create installments list
      const installmentsList: BnplInstallment[] = [];
      
      // 1. First installment: paid immediately
      const firstTxId = 'tx_bnpl_' + Math.random().toString(36).substr(2, 9);
      installmentsList.push({
        id: 'inst_' + Math.random().toString(36).substr(2, 9),
        installmentNumber: 1,
        amount: installmentAmount,
        dueDate: new Date().toISOString(),
        status: 'paid',
        paidAt: new Date().toISOString(),
        transactionId: firstTxId
      });

      // 2. Subsequent installments (due every 30 days)
      let calculatedRemaining = numAmount - installmentAmount;
      for (let i = 2; i <= numInstallments; i++) {
        const amt = i === numInstallments ? Math.round(calculatedRemaining * 100) / 100 : installmentAmount;
        calculatedRemaining -= amt;
        installmentsList.push({
          id: 'inst_' + Math.random().toString(36).substr(2, 9),
          installmentNumber: i,
          amount: amt,
          dueDate: new Date(Date.now() + 3600000 * 24 * 30 * (i - 1)).toISOString(),
          status: 'pending'
        });
      }

      const contractId = 'bnpl_' + Math.random().toString(36).substr(2, 9);
      const newContract: BnplContract = {
        id: contractId,
        walletId: wallet.id,
        merchantName,
        purchaseAmount: numAmount,
        remainingAmount: Math.round((numAmount - installmentAmount) * 100) / 100,
        currency: wallet.currency,
        totalInstallments: numInstallments,
        status: 'active',
        createdAt: new Date().toISOString(),
        installments: installmentsList
      };

      if (!db.bnplContracts) db.bnplContracts = [];
      db.bnplContracts.push(newContract);

      // Save initial transaction
      const initTransaction: Transaction = {
        id: firstTxId,
        walletId: wallet.id,
        type: 'send',
        direction: 'out',
        amount: installmentAmount,
        currency: wallet.currency,
        counterparty: merchantName,
        reference: `BNPL Split 1/${numInstallments}`,
        status: 'completed',
        category: 'General',
        createdAt: new Date().toISOString()
      };

      db.transactions.unshift(initTransaction);

      // Adjust budget allocation for Shopping / General purchases
      const budgets = db.budgetCategories.filter(b => b.walletId === wallet.id);
      const targetBudget = budgets.find(b => b.name.toLowerCase().includes('shopping') || b.name.toLowerCase().includes('general'));
      if (targetBudget) {
        targetBudget.allocated = Math.min(targetBudget.limit, targetBudget.allocated + installmentAmount);
      }

      // Slightly increase confidence score on successfully opening a contract with upfront payment!
      wallet.confidenceScore = Math.min(1000, wallet.confidenceScore + 10);

      Database.write(db);
      Database.log('BNPL_CONTRACT_CREATED', `BNPL split contract opened with ${merchantName} for ${wallet.currency} ${numAmount}`);

      res.json({ success: true, contract: newContract, wallet });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.post("/api/bnpl/repay/:contractId/:installmentId", authenticate, async (req, res) => {
    try {
      const { contractId, installmentId } = req.params;
      const session = (req as any).user;
      const db = Database.read();
      const wallet = db.wallets.find(w => w.userId === session.userId);
      if (!wallet) return res.status(404).json({ error: 'Wallet not found.' });

      const contract = db.bnplContracts ? db.bnplContracts.find(c => c.id === contractId && c.walletId === wallet.id) : null;
      if (!contract) return res.status(404).json({ error: 'BNPL contract not found.' });

      const installment = contract.installments.find(i => i.id === installmentId);
      if (!installment) return res.status(404).json({ error: 'Installment not found.' });

      if (installment.status === 'paid') {
        return res.status(400).json({ error: 'Installment is already paid.' });
      }

      if (wallet.balance < installment.amount) {
        return res.status(400).json({ 
          error: `Insufficient balance. Repaying this installment requires ${wallet.currency} ${installment.amount.toFixed(2)}.` 
        });
      }

      // Process repayment
      wallet.balance -= installment.amount;
      installment.status = 'paid';
      installment.paidAt = new Date().toISOString();
      
      const repayTxId = 'tx_repay_' + Math.random().toString(36).substr(2, 9);
      installment.transactionId = repayTxId;

      contract.remainingAmount = Math.max(0, Math.round((contract.remainingAmount - installment.amount) * 100) / 100);

      // Check if all installments are now paid
      const allPaid = contract.installments.every(i => i.status === 'paid');
      if (allPaid) {
        contract.status = 'completed';
      }

      // Record transaction
      const repayTransaction: Transaction = {
        id: repayTxId,
        walletId: wallet.id,
        type: 'send',
        direction: 'out',
        amount: installment.amount,
        currency: wallet.currency,
        counterparty: contract.merchantName,
        reference: `BNPL Repay ${installment.installmentNumber}/${contract.totalInstallments}`,
        status: 'completed',
        category: 'General',
        createdAt: new Date().toISOString()
      };

      db.transactions.unshift(repayTransaction);

      // Slight confidence score reward for on-time/early repayment
      wallet.confidenceScore = Math.min(1000, wallet.confidenceScore + 15);

      Database.write(db);
      Database.log('BNPL_REPAYMENT_PROCESSED', `Processed installment repayment of R ${installment.amount} for ${contract.merchantName}`);

      res.json({ success: true, contract, wallet });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  // ==========================================
  // REPAY OUTSTANDING CREDIT / DEBT
  // ==========================================
  app.post("/api/credit/repay", authenticate, async (req, res) => {
    try {
      const { amount } = req.body;
      const numAmount = parseFloat(amount);
      if (isNaN(numAmount) || numAmount <= 0) {
        return res.status(400).json({ error: 'Please enter a positive repayment amount.' });
      }

      const session = (req as any).user;
      const db = Database.read();
      const wallet = db.wallets.find(w => w.userId === session.userId);
      if (!wallet) return res.status(404).json({ error: 'Wallet not found.' });

      if (wallet.creditOwed <= 0) {
        return res.status(400).json({ error: 'No outstanding debt to pay.' });
      }

      if (wallet.balance < numAmount) {
        return res.status(400).json({ error: 'Insufficient balance to make this credit repayment.' });
      }

      const payAmount = Math.min(wallet.creditOwed, numAmount);
      wallet.balance -= payAmount;
      wallet.creditOwed -= payAmount;
      
      // Reduce accumulated interest as well
      wallet.accumulatedInterest = Math.max(0, wallet.accumulatedInterest - payAmount * 0.1);

      // Boost confidence score for paying back on time!
      wallet.confidenceScore = Math.min(1000, wallet.confidenceScore + Math.floor(payAmount / 10));

      // Append transaction record
      const transaction: Transaction = {
        id: 'tx_' + Math.random().toString(36).substr(2, 9),
        walletId: wallet.id,
        type: 'send',
        direction: 'out',
        amount: payAmount,
        currency: wallet.currency,
        counterparty: 'Panda Backup Syndicate Group 🐼',
        reference: 'credit_repay_' + Math.random().toString(36).substr(2, 7),
        status: 'completed',
        category: 'Savings',
        createdAt: new Date().toISOString()
      };

      db.transactions.unshift(transaction);
      Database.write(db);
      Database.log('CREDIT_REPAYMENT', `Repaid R ${payAmount} of outstanding fintech syndicate credit cover.`);

      res.json({ success: true, wallet, transaction });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  // ==========================================
  // TIME TRAVEL BILLING CYCLE SIMULATOR
  // ==========================================
  app.post("/api/simulation/timetravel", authenticate, async (req, res) => {
    try {
      const session = (req as any).user;
      const db = Database.read();
      const wallet = db.wallets.find(w => w.userId === session.userId);
      if (!wallet) return res.status(404).json({ error: 'Wallet not found.' });

      let interestAccrued = 0;
      
      // If user has outstanding debt, interest of 10% is added for payments not made on time
      if (wallet.creditOwed > 0) {
        interestAccrued = wallet.creditOwed * 0.10; // 10% late penalty interest
        wallet.creditOwed += interestAccrued;
        wallet.accumulatedInterest += interestAccrued;
        
        // Lower confidence score for overdue debt
        wallet.confidenceScore = Math.max(300, wallet.confidenceScore - 25);
        
        Database.log('INTEREST_ACCRUED', `Interest penalty of 10% (R ${interestAccrued.toFixed(2)}) applied to outstanding fintech credit cover.`);
      }

      // Reset budgets for a new 30-day cycle!
      const budgets = db.budgetCategories.filter(b => b.walletId === wallet.id);
      for (const b of budgets) {
        b.allocated = 0; // Fresh start for the new month!
      }

      Database.write(db);
      Database.log('TIME_TRAVEL_SIMULATION', `Simulated 30-day time leap. Budgets reset. Active interest penalty calculated.`);

      res.json({ success: true, wallet, interestAccrued });
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
    console.log(`[PandaPay Backend] Live at http://localhost:${PORT}`);
  });
}

startServer();
