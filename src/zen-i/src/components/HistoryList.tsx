import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ArrowDownLeft, ArrowUpRight, Search, Filter, Calendar, 
  ChevronLeft, ChevronRight, X, Info, FileText, CheckCircle2, 
  Clock, AlertTriangle 
} from 'lucide-react';
import { Transaction } from '../types';

interface HistoryListProps {
  token: string;
  refreshKey: number;
}

export default function HistoryList({ token, refreshKey }: HistoryListProps) {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [search, setSearch] = useState('');
  const [type, setType] = useState('');
  const [status, setStatus] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedTx, setSelectedTx] = useState<Transaction | null>(null);

  // Summary aggregation states
  const [summary, setSummary] = useState({ totalIn: 0, totalOut: 0, net: 0 });

  const fetchTransactions = async () => {
    setIsLoading(true);
    try {
      const queryParams = new URLSearchParams({
        page: page.toString(),
        limit: '5',
        type,
        status,
        startDate,
        endDate,
        search
      });

      const response = await fetch(`/api/transactions?${queryParams}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await response.json();
      if (response.ok) {
        setTransactions(data.transactions || []);
        setSummary(data.summary || { totalIn: 0, totalOut: 0, net: 0 });
        if (data.pagination) {
          setTotalPages(data.pagination.totalPages || 1);
        }
      }
    } catch (e) {
      console.error('Failed to fetch transactions:', e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchTransactions();
  }, [page, type, status, startDate, endDate, search, refreshKey]);

  return (
    <div className="space-y-4">
      {/* Search & Filter bar */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {/* Search */}
          <div className="sm:col-span-1 relative flex items-center bg-slate-50 border border-slate-200 focus-within:border-peach-500 focus-within:ring-1 focus-within:ring-peach-500 rounded-xl px-3 py-2">
            <Search className="w-4 h-4 text-slate-400 mr-2 shrink-0" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search ref or pointer..."
              className="bg-transparent text-xs text-slate-700 focus:outline-none w-full font-medium"
            />
          </div>

          {/* Type Filter */}
          <div className="flex items-center bg-slate-50 border border-slate-200 focus-within:border-peach-500 focus-within:ring-1 focus-within:ring-peach-500 rounded-xl px-3 py-1">
            <Filter className="w-3.5 h-3.5 text-slate-400 mr-2" />
            <select
              value={type}
              onChange={(e) => { setType(e.target.value); setPage(1); }}
              className="bg-transparent text-xs text-slate-700 focus:outline-none w-full cursor-pointer py-1 font-medium"
            >
              <option value="">All Types</option>
              <option value="deposit">Deposit</option>
              <option value="send">Sent</option>
              <option value="receive">Received</option>
            </select>
          </div>

          {/* Status Filter */}
          <div className="flex items-center bg-slate-50 border border-slate-200 focus-within:border-peach-500 focus-within:ring-1 focus-within:ring-peach-500 rounded-xl px-3 py-1">
            <Clock className="w-3.5 h-3.5 text-slate-400 mr-2" />
            <select
              value={status}
              onChange={(e) => { setStatus(e.target.value); setPage(1); }}
              className="bg-transparent text-xs text-slate-700 focus:outline-none w-full cursor-pointer py-1 font-medium"
            >
              <option value="">All Statuses</option>
              <option value="completed">Completed</option>
              <option value="pending">Pending</option>
              <option value="failed">Failed</option>
            </select>
          </div>
        </div>

        {/* Date Ranges */}
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <span className="text-slate-500 flex items-center gap-1.5 font-sans mr-1 font-medium">
            <Calendar className="w-3.5 h-3.5" /> Range:
          </span>
          <input
            type="date"
            value={startDate}
            onChange={(e) => { setStartDate(e.target.value); setPage(1); }}
            className="bg-slate-50 border border-slate-200 text-[10px] text-slate-600 px-2 py-1 rounded-md focus:outline-none focus:border-peach-500 font-mono font-medium"
          />
          <span className="text-slate-400 font-sans">to</span>
          <input
            type="date"
            value={endDate}
            onChange={(e) => { setEndDate(e.target.value); setPage(1); }}
            className="bg-slate-50 border border-slate-200 text-[10px] text-slate-600 px-2 py-1 rounded-md focus:outline-none focus:border-peach-500 font-mono font-medium"
          />
          {(startDate || endDate || search || type || status) && (
            <button
              onClick={() => {
                setStartDate('');
                setEndDate('');
                setSearch('');
                setType('');
                setStatus('');
                setPage(1);
              }}
              className="text-[10px] text-rose-600 hover:text-rose-700 underline font-semibold cursor-pointer ml-auto"
            >
              Reset Filters
            </button>
          )}
        </div>
      </div>

      {/* Transaction List */}
      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
        <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
          <h4 className="text-xs font-bold text-slate-500 tracking-wider uppercase font-sans">Recent Ledger Updates</h4>
          <span className="text-[10px] bg-slate-100 text-slate-600 font-mono px-2 py-0.5 rounded-full font-bold border border-slate-200">
            {transactions.length} shown
          </span>
        </div>

        {isLoading ? (
          <div className="flex flex-col items-center py-12 text-slate-500 space-y-2">
            <Clock className="w-8 h-8 animate-spin text-peach-600" />
            <span className="text-xs font-mono font-medium">Syncing payment index...</span>
          </div>
        ) : transactions.length === 0 ? (
          <div className="py-12 text-center text-slate-500 text-xs flex flex-col items-center space-y-2">
            <Info className="w-6 h-6 text-slate-400" />
            <p className="font-medium">No transaction history matching your active search filters.</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {transactions.map((tx) => {
              const isDeposit = tx.type === 'deposit';
              const isReceive = tx.type === 'receive';
              const isIn = tx.direction === 'in';
              const formattedAmt = new Intl.NumberFormat('en-ZA', { style: 'currency', currency: tx.currency }).format(tx.amount);

              return (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  key={tx.id}
                  onClick={() => setSelectedTx(tx)}
                  className="flex items-center justify-between p-4 hover:bg-slate-50/70 cursor-pointer transition-all duration-150 group"
                >
                  <div className="flex items-center gap-3">
                    {/* Icon container */}
                    <div className={`p-2 rounded-full ${
                      isIn ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'
                    }`}>
                      {isIn ? <ArrowDownLeft className="w-4 h-4" /> : <ArrowUpRight className="w-4 h-4" />}
                    </div>

                    <div>
                      <p className="text-sm font-semibold text-slate-800 group-hover:text-peach-700 transition-colors">
                        {isDeposit ? 'Deposit via ILP' : isReceive ? `Received from ${tx.counterparty.split('/').pop()}` : `Sent to ${tx.counterparty.split('/').pop()}`}
                      </p>
                      <p className="text-[10px] text-slate-500 flex items-center gap-1.5 font-mono">
                        {new Date(tx.createdAt).toLocaleDateString()} at {new Date(tx.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        <span>·</span>
                        <span className={`capitalize font-sans font-bold px-1.5 py-0.5 rounded text-[9px] ${
                          tx.status === 'completed' ? 'bg-emerald-50 text-emerald-700' : tx.status === 'pending' ? 'bg-amber-50 text-amber-700' : 'bg-rose-50 text-rose-700'
                        }`}>
                          {tx.status}
                        </span>
                      </p>
                    </div>
                  </div>

                  <div className="text-right">
                    <p className={`text-sm font-bold font-mono ${isIn ? 'text-emerald-600' : 'text-rose-600'}`}>
                      {isIn ? '+' : '−'} {formattedAmt}
                    </p>
                    <span className="text-[9px] text-slate-500 font-mono tracking-wider font-medium">
                      {tx.category}
                    </span>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}

        {/* Pagination Footer */}
        {totalPages > 1 && (
          <div className="p-3 bg-slate-50/50 border-t border-slate-100 flex items-center justify-between">
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
              className="p-1.5 rounded-lg bg-white border border-slate-200 disabled:opacity-40 text-slate-500 hover:text-slate-800 hover:bg-slate-50 transition cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="text-xs text-slate-500 font-mono font-medium">
              Page {page} of {totalPages}
            </span>
            <button
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="p-1.5 rounded-lg bg-white border border-slate-200 disabled:opacity-40 text-slate-500 hover:text-slate-800 hover:bg-slate-50 transition cursor-pointer"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>

      {/* Detail Drawer Modal */}
      <AnimatePresence>
        {selectedTx && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedTx(null)}
              className="absolute inset-0 bg-slate-900/40 backdrop-blur-xs"
            ></motion.div>

            {/* Modal Body */}
            <motion.div
              initial={{ scale: 0.95, y: 15, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              exit={{ scale: 0.95, y: 15, opacity: 0 }}
              className="relative w-full max-w-sm bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-xl p-5 text-slate-800 z-10"
            >
              <button
                onClick={() => setSelectedTx(null)}
                className="absolute top-4 right-4 p-1 rounded-md text-slate-400 hover:text-slate-700 hover:bg-slate-50 transition"
              >
                <X className="w-4 h-4" />
              </button>

              <div className="flex flex-col items-center text-center space-y-3 pb-4 border-b border-slate-100">
                <div className={`p-3 rounded-full ${
                  selectedTx.direction === 'in' ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'
                }`}>
                  {selectedTx.direction === 'in' ? <ArrowDownLeft className="w-6 h-6" /> : <ArrowUpRight className="w-6 h-6" />}
                </div>
                <div>
                  <h4 className="text-xs uppercase tracking-wider font-bold text-slate-400 font-sans">Payment Audit Receipt</h4>
                  <p className="text-2xl font-bold font-mono mt-1 text-slate-800">
                    {new Intl.NumberFormat('en-ZA', { style: 'currency', currency: selectedTx.currency }).format(selectedTx.amount)}
                  </p>
                </div>
              </div>

              <div className="py-4 space-y-3 font-mono text-[11px] text-slate-600">
                <div className="flex justify-between">
                  <span className="text-slate-400">Type</span>
                  <span className="capitalize font-bold text-slate-700">{selectedTx.type}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-400">Status</span>
                  <span className="flex items-center gap-1 font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-100">
                    <CheckCircle2 className="w-3.5 h-3.5" /> {selectedTx.status}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Counterparty</span>
                  <span className="text-slate-700 font-bold max-w-[180px] truncate">{selectedTx.counterparty}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Reference ID</span>
                  <span className="text-slate-700 text-xs font-bold">{selectedTx.reference}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Auto Category</span>
                  <span className="text-peach-700 font-bold">{selectedTx.category}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Settled On</span>
                  <span className="text-slate-600 font-medium">{new Date(selectedTx.createdAt).toLocaleString()}</span>
                </div>
              </div>

              <button
                onClick={() => setSelectedTx(null)}
                className="w-full mt-4 py-2 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs transition"
              >
                Close Receipt
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
