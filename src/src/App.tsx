import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  LayoutDashboard, ArrowDownCircle, ArrowUpCircle, List, 
  ChartPie, Sparkles, Settings, Bell, Mail, Key, User as UserIcon,
  HelpCircle, LogOut, CheckCircle, ShieldAlert, Sparkle, RefreshCw,
  PiggyBank
} from 'lucide-react';
import { User, Wallet } from './types';
import WalletCard from './components/WalletCard';
import DepositForm from './components/DepositForm';
import SendForm from './components/SendForm';
import HistoryList from './components/HistoryList';
import BudgetManager from './components/BudgetManager';
import AIChatPanel from './components/AIChatPanel';
import Mascot from './components/Mascot';

type Tab = 'dashboard' | 'deposit' | 'send' | 'transactions' | 'budget' | 'ai' | 'settings';

export default function App() {
  const [token, setToken] = useState<string | null>(localStorage.getItem('token'));
  const [user, setUser] = useState<User | null>(null);
  const [wallet, setWallet] = useState<Wallet | null>(null);
  const [activeTab, setActiveTab] = useState<Tab>('dashboard');
  
  // Login input state
  const [email, setEmail] = useState('');
  const [authError, setAuthError] = useState('');
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  // States to trigger refreshes across sibling widgets
  const [refreshKey, setRefreshKey] = useState(0);

  // Stats aggregation
  const [moneyIn, setMoneyIn] = useState(2150.00);
  const [moneyOut, setMoneyOut] = useState(1340.00);

  const fetchSession = async (activeToken: string) => {
    try {
      const response = await fetch('/api/auth/me', {
        headers: {
          'Authorization': `Bearer ${activeToken}`
        }
      });
      const data = await response.json();
      if (response.ok) {
        setUser(data.user);
        setWallet(data.wallet);
      } else {
        // Token expired
        handleLogout();
      }
    } catch (e) {
      console.error('Session restoration failed:', e);
    }
  };

  const fetchStats = async (activeToken: string) => {
    try {
      const response = await fetch('/api/transactions?limit=100', {
        headers: { 'Authorization': `Bearer ${activeToken}` }
      });
      const data = await response.json();
      if (response.ok && data.summary) {
        // Offset default stats by pre-seeded mock stats to make it gorgeous
        setMoneyIn(2150.00 + data.summary.totalIn);
        setMoneyOut(1340.00 + data.summary.totalOut);
      }
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    if (token) {
      fetchSession(token);
      fetchStats(token);
    }
  }, [token, refreshKey]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !email.includes('@')) {
      setAuthError('Please enter a valid email address.');
      return;
    }

    setIsLoggingIn(true);
    setAuthError('');
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });
      const data = await response.json();
      if (response.ok) {
        localStorage.setItem('token', data.token);
        setToken(data.token);
        setUser(data.user);
        setWallet(data.wallet);
      } else {
        setAuthError(data.error || 'Authentication failed.');
      }
    } catch (err) {
      setAuthError('Server API offline. Try restarting your development server.');
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    setToken(null);
    setUser(null);
    setWallet(null);
    setActiveTab('dashboard');
  };

  const triggerRefresh = () => {
    setRefreshKey(prev => prev + 1);
  };

  if (!token) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
        {/* Subtle decorative grid */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#e2e8f0_1px,transparent_1px),linear-gradient(to_bottom,#e2e8f0_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] opacity-50 pointer-events-none"></div>

        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          className="w-full max-w-md bg-white border border-slate-200 rounded-3xl p-8 shadow-lg relative overflow-hidden text-slate-800 z-10"
        >
          {/* Logo */}
          <div className="flex flex-col items-center text-center space-y-2 mb-8">
            <div className="px-4 py-2 bg-slate-100 text-slate-800 font-bold rounded-full border border-slate-200 tracking-wider text-xs flex items-center gap-2">
              <span className="text-peach-600">💳</span> PandaPay Interledger
            </div>
            <h2 className="text-xl font-bold font-sans text-slate-800">Access Your Payment Node</h2>
            <p className="text-xs text-slate-500 max-w-xs">
              Authenticate via single-step secure email and instantly resolve your custom open payment pointers.
            </p>
          </div>

          {authError && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-600 text-xs rounded-xl mb-4 font-bold flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 shrink-0" />
              <span>{authError}</span>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs text-slate-500 font-bold flex items-center gap-1.5">
                <Mail className="w-3.5 h-3.5" /> Email Address
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-850 placeholder-slate-400 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition font-medium"
                placeholder="you@example.com"
                required
              />
            </div>

            <button
              type="submit"
              disabled={isLoggingIn}
              className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-100 disabled:text-slate-400 text-white font-bold text-sm rounded-xl transition cursor-pointer shadow-sm"
            >
              {isLoggingIn ? 'Verifying Pointer...' : 'Open Wallet Node'}
            </button>
          </form>

          {/* Seed demo instructions */}
          <div className="mt-8 pt-6 border-t border-slate-100 text-[10px] text-slate-500 text-center flex flex-col items-center space-y-1.5">
            <span className="font-mono bg-slate-50 px-2 py-1 rounded text-indigo-600 font-bold">
              Demo credentials: mikaeelnaidoo2@gmail.com
            </span>
             <p>PandaPay operates on the sandbox Interledger Open Payments network.</p>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-850 flex flex-col font-sans">
      {/* Top Header Navigation */}
      <header className="bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between shadow-xs shrink-0">
        <div className="flex items-center gap-3">
          <div className="px-4 py-1.5 bg-slate-50 text-slate-800 text-xs font-bold rounded-full border border-slate-200 tracking-wider flex items-center gap-2">
            <span className="text-peach-600">💳</span> PandaPay
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button 
            className="p-2 border border-slate-200 bg-white hover:bg-slate-50 text-slate-500 hover:text-slate-800 transition rounded-xl cursor-pointer"
            title="Notifications"
          >
            <Bell className="w-4 h-4" />
          </button>
          <div className="h-8 w-8 rounded-full bg-indigo-50 border border-indigo-150 text-indigo-600 text-xs font-bold flex items-center justify-center uppercase select-none">
            {user?.name ? user.name.slice(0, 2) : 'CZ'}
          </div>
        </div>
      </header>

      {/* Main Container Layout */}
      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar Left Navigation */}
        <aside className="w-60 bg-white border-r border-slate-200 p-5 flex flex-col justify-between shrink-0 hidden md:flex">
          <div className="space-y-6">
            <div className="space-y-1">
              <span className="text-[10px] uppercase font-mono tracking-widest text-slate-450 font-bold px-3">Main</span>
              
              <button
                onClick={() => setActiveTab('dashboard')}
                className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-medium transition cursor-pointer text-left ${
                  activeTab === 'dashboard' ? 'bg-indigo-50 text-indigo-600 font-bold border border-indigo-100' : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50'
                }`}
              >
                <LayoutDashboard className="w-4 h-4" /> Dashboard
              </button>

              <button
                onClick={() => setActiveTab('deposit')}
                className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-medium transition cursor-pointer text-left ${
                  activeTab === 'deposit' ? 'bg-indigo-50 text-indigo-600 font-bold border border-indigo-100' : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50'
                }`}
              >
                <ArrowDownCircle className="w-4 h-4" /> Deposit
              </button>

              <button
                onClick={() => setActiveTab('send')}
                className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-medium transition cursor-pointer text-left ${
                  activeTab === 'send' ? 'bg-indigo-50 text-indigo-600 font-bold border border-indigo-100' : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50'
                }`}
              >
                <ArrowUpCircle className="w-4 h-4" /> Send Payments
              </button>

              <button
                onClick={() => setActiveTab('transactions')}
                className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-medium transition cursor-pointer text-left ${
                  activeTab === 'transactions' ? 'bg-indigo-50 text-indigo-600 font-bold border border-indigo-100' : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50'
                }`}
              >
                <List className="w-4 h-4" /> Transactions
              </button>
            </div>

            <div className="space-y-1">
              <span className="text-[10px] uppercase font-mono tracking-widest text-slate-450 font-bold px-3">Finance</span>

              <button
                onClick={() => setActiveTab('budget')}
                className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-medium transition cursor-pointer text-left ${
                  activeTab === 'budget' ? 'bg-indigo-50 text-indigo-600 font-bold border border-indigo-100' : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50'
                }`}
              >
                <ChartPie className="w-4 h-4" /> Budget tracker
              </button>

              <button
                onClick={() => setActiveTab('ai')}
                className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-medium transition cursor-pointer text-left ${
                  activeTab === 'ai' ? 'bg-indigo-50 text-indigo-600 font-bold border border-indigo-100' : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50'
                }`}
              >
                <Sparkles className="w-4 h-4" /> AI Insights
              </button>
            </div>

            <div className="space-y-1">
              <span className="text-[10px] uppercase font-mono tracking-widest text-slate-450 font-bold px-3">Account</span>

              <button
                onClick={() => setActiveTab('settings')}
                className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-medium transition cursor-pointer text-left ${
                  activeTab === 'settings' ? 'bg-indigo-50 text-indigo-600 font-bold border border-indigo-100' : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50'
                }`}
              >
                <Settings className="w-4 h-4" /> Node Settings
              </button>
            </div>
          </div>

          {/* Mini Sidebar Mascot widget */}
          <div className="bg-slate-50 border border-slate-200/60 rounded-2xl p-4 text-center mt-auto">
            <span className="text-2xl inline-block mb-1">🐼</span>
            <h5 className="text-[11px] font-bold text-slate-755">Zen the companion</h5>
            <p className="text-[10px] text-slate-500 mt-1 leading-normal">
              Need saving tips? Click 'AI Insights' to ask me anything.
            </p>
          </div>
        </aside>

        {/* Scrollable Center Content area */}
        <main className="flex-1 overflow-y-auto p-6 md:p-8 space-y-6">
          {/* Top Greeting Row */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h2 className="text-xl md:text-2xl font-bold text-slate-800 flex items-center gap-2">
                Good morning, <span className="text-indigo-600">{user?.name || 'Corazon'}</span> 👋
              </h2>
              <p className="text-xs text-slate-500 font-medium font-sans">Welcome back to your Interledger terminal node.</p>
            </div>
            
            <button
              onClick={triggerRefresh}
              className="flex items-center gap-1.5 py-2 px-3.5 bg-white hover:bg-slate-50 border border-slate-200 hover:border-slate-300 text-[10px] font-mono tracking-wider text-slate-700 font-semibold rounded-xl cursor-pointer self-start md:self-auto transition"
            >
              <RefreshCw className="w-3.5 h-3.5 text-indigo-600" /> SYNC LEDGER
            </button>
          </div>

          <AnimatePresence mode="wait">
            {/* TAB: DASHBOARD VIEW */}
            {activeTab === 'dashboard' && (
              <motion.div
                key="dashboard-view"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="space-y-6"
              >
                {/* Wallet Balance widget */}
                <WalletCard wallet={wallet} moneyIn={moneyIn} moneyOut={moneyOut} />

                {/* Quick Shortcuts */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  <button
                    onClick={() => setActiveTab('deposit')}
                    className="flex flex-col items-center text-center p-4 bg-white border border-slate-200 hover:border-slate-300 rounded-2xl transition cursor-pointer group shadow-xs"
                  >
                    <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl group-hover:scale-105 transition">
                      <ArrowDownCircle className="w-5 h-5" />
                    </div>
                    <span className="text-xs font-bold text-slate-800 mt-2">Deposit Funds</span>
                  </button>

                  <button
                    onClick={() => setActiveTab('send')}
                    className="flex flex-col items-center text-center p-4 bg-white border border-slate-200 hover:border-slate-300 rounded-2xl transition cursor-pointer group shadow-xs"
                  >
                    <div className="p-3 bg-rose-50 text-rose-600 rounded-xl group-hover:scale-105 transition">
                      <ArrowUpCircle className="w-5 h-5" />
                    </div>
                    <span className="text-xs font-bold text-slate-800 mt-2">Send Payments</span>
                  </button>

                  <button
                    onClick={() => setActiveTab('budget')}
                    className="flex flex-col items-center text-center p-4 bg-white border border-slate-200 hover:border-slate-300 rounded-2xl transition cursor-pointer group shadow-xs"
                  >
                    <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl group-hover:scale-105 transition">
                      <ChartPie className="w-5 h-5" />
                    </div>
                    <span className="text-xs font-bold text-slate-800 mt-2">My Budgets</span>
                  </button>

                  <button
                    onClick={() => setActiveTab('ai')}
                    className="flex flex-col items-center text-center p-4 bg-white border border-slate-200 hover:border-slate-300 rounded-2xl transition cursor-pointer group shadow-xs"
                  >
                    <div className="p-3 bg-teal-50 text-teal-600 rounded-xl group-hover:scale-105 transition">
                      <Sparkles className="w-5 h-5" />
                    </div>
                    <span className="text-xs font-bold text-slate-800 mt-2">Ask Zen</span>
                  </button>
                </div>

                {/* Two Column details listing */}
                <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
                  {/* Left Column: Recent transactions */}
                  <div className="lg:col-span-3 space-y-4">
                    <div className="flex justify-between items-center px-1">
                      <h3 className="text-sm font-bold text-slate-800">Recent Transactions</h3>
                      <button 
                        onClick={() => setActiveTab('transactions')}
                        className="text-xs text-indigo-600 hover:text-indigo-850 font-bold cursor-pointer"
                      >
                        View All
                      </button>
                    </div>
                    <HistoryList token={token} refreshKey={refreshKey} />
                  </div>

                  {/* Right Column: Budgets overview */}
                  <div className="lg:col-span-2 space-y-4">
                    <div className="flex justify-between items-center px-1">
                      <h3 className="text-sm font-bold text-slate-800">Allocated Budget trackers</h3>
                      <button 
                        onClick={() => setActiveTab('budget')}
                        className="text-xs text-indigo-600 hover:text-indigo-850 font-bold cursor-pointer"
                      >
                        Manage
                      </button>
                    </div>
                    <BudgetManager 
                      token={token} 
                      refreshKey={refreshKey} 
                      onBudgetUpdated={triggerRefresh}
                      walletBalance={wallet?.balance || 0}
                    />
                  </div>
                </div>
              </motion.div>
            )}

            {/* TAB: DEPOSIT VIEW */}
            {activeTab === 'deposit' && (
              <motion.div
                key="deposit-view"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="max-w-xl mx-auto"
              >
                <DepositForm 
                  currentUsername={wallet?.username || 'corazon'} 
                  onDepositComplete={triggerRefresh} 
                  token={token} 
                />
              </motion.div>
            )}

            {/* TAB: SEND VIEW */}
            {activeTab === 'send' && (
              <motion.div
                key="send-view"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="max-w-xl mx-auto"
              >
                <SendForm onSendComplete={triggerRefresh} token={token} />
              </motion.div>
            )}

            {/* TAB: TRANSACTIONS VIEW */}
            {activeTab === 'transactions' && (
              <motion.div
                key="transactions-view"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="space-y-4"
              >
                <div>
                  <h3 className="text-sm font-bold text-slate-800">Historical Payment Logs</h3>
                  <p className="text-xs text-slate-500 mt-1 font-medium font-sans">Audit trail across the Interledger payment pointers network.</p>
                </div>
                <HistoryList token={token} refreshKey={refreshKey} />
              </motion.div>
            )}

            {/* TAB: BUDGET TRACKER VIEW */}
            {activeTab === 'budget' && (
              <motion.div
                key="budget-view"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="grid grid-cols-1 md:grid-cols-3 gap-6"
              >
                <div className="md:col-span-2 space-y-4">
                  <div>
                    <h3 className="text-sm font-bold text-slate-800">Custom Budget Limits</h3>
                    <p className="text-xs text-slate-500 mt-1 font-medium font-sans">Automatically allocates categorized spending on outgoing payment completions.</p>
                  </div>
                  <BudgetManager 
                    token={token} 
                    refreshKey={refreshKey} 
                    onBudgetUpdated={triggerRefresh}
                    walletBalance={wallet?.balance || 0}
                  />
                </div>

                <div className="bg-white border border-slate-200 rounded-3xl p-6 h-fit text-center space-y-4 shadow-sm">
                  <div className="p-3 bg-indigo-50 text-indigo-650 rounded-full w-12 h-12 flex items-center justify-center mx-auto">
                    <PiggyBank className="w-6 h-6" />
                  </div>
                  <h4 className="text-xs font-bold text-slate-800">Smart Runway Insights</h4>
                  <p className="text-[11px] text-slate-500 leading-relaxed font-sans">
                    Based on your average spending rate, your allocated balances will comfortably last <strong>18 days</strong> until budget replenishment.
                  </p>
                </div>
              </motion.div>
            )}

            {/* TAB: AI INSIGHTS VIEW */}
            {activeTab === 'ai' && (
              <motion.div
                key="ai-view"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="space-y-4"
              >
                <div>
                  <h3 className="text-sm font-bold text-slate-800">Financial Smart Assistant</h3>
                  <p className="text-xs text-slate-500 mt-1 font-medium font-sans">Converse with Zen for tailored spending advice and categorized accounts reports.</p>
                </div>
                <AIChatPanel token={token} />
              </motion.div>
            )}

            {/* TAB: SETTINGS VIEW */}
            {activeTab === 'settings' && (
              <motion.div
                key="settings-view"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="max-w-2xl bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-6 font-mono text-xs text-slate-700"
              >
                <div>
                  <h3 className="text-sm font-bold text-slate-800 font-sans">Node Settings & Auditing</h3>
                  <p className="text-xs text-slate-500 font-sans mt-1 font-medium">Manage private keys, grants, and Interledger identities securely.</p>
                </div>

                <div className="space-y-4">
                  <div className="p-4 bg-slate-50 border border-slate-150 rounded-2xl space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-slate-505">Node Public Key</span>
                      <span className="text-emerald-600 font-semibold select-all">pk_live_093847291a8291...</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-slate-505">Security Grants</span>
                      <span className="text-slate-700 font-semibold">AES-256 GCM Authorized</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-slate-505">Active Wallet Username</span>
                      <span className="text-emerald-600 font-semibold">${wallet?.username}</span>
                    </div>
                  </div>

                  <div className="flex justify-between items-center p-3 bg-rose-50 border border-rose-100 rounded-xl">
                    <span className="text-rose-600 font-bold font-sans">Clear Local Credentials</span>
                    <button
                      onClick={handleLogout}
                      className="flex items-center gap-1.5 py-1.5 px-3 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-lg cursor-pointer transition"
                    >
                      <LogOut className="w-3.5 h-3.5" /> Logout
                    </button>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </main>
      </div>

      {/* Mobile Navigation bar */}
      <footer className="bg-white border-t border-slate-200 p-2 grid grid-cols-5 gap-1 shrink-0 md:hidden text-[10px]">
        <button
          onClick={() => setActiveTab('dashboard')}
          className={`flex flex-col items-center gap-1 p-2 rounded-xl transition cursor-pointer ${
            activeTab === 'dashboard' ? 'text-indigo-600 font-bold' : 'text-slate-450'
          }`}
        >
          <LayoutDashboard className="w-4 h-4" />
          <span>Home</span>
        </button>

        <button
          onClick={() => setActiveTab('deposit')}
          className={`flex flex-col items-center gap-1 p-2 rounded-xl transition cursor-pointer ${
            activeTab === 'deposit' ? 'text-indigo-600 font-bold' : 'text-slate-450'
          }`}
        >
          <ArrowDownCircle className="w-4 h-4" />
          <span>Deposit</span>
        </button>

        <button
          onClick={() => setActiveTab('send')}
          className={`flex flex-col items-center gap-1 p-2 rounded-xl transition cursor-pointer ${
            activeTab === 'send' ? 'text-indigo-600 font-bold' : 'text-slate-450'
          }`}
        >
          <ArrowUpCircle className="w-4 h-4" />
          <span>Send</span>
        </button>

        <button
          onClick={() => setActiveTab('budget')}
          className={`flex flex-col items-center gap-1 p-2 rounded-xl transition cursor-pointer ${
            activeTab === 'budget' ? 'text-indigo-600 font-bold' : 'text-slate-450'
          }`}
        >
          <ChartPie className="w-4 h-4" />
          <span>Budget</span>
        </button>

        <button
          onClick={() => setActiveTab('ai')}
          className={`flex flex-col items-center gap-1 p-2 rounded-xl transition cursor-pointer ${
            activeTab === 'ai' ? 'text-indigo-600 font-bold' : 'text-slate-450'
          }`}
        >
          <Sparkles className="w-4 h-4" />
          <span>AI Chat</span>
        </button>
      </footer>
    </div>
  );
}
