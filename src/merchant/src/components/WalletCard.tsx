import { Wallet } from '../types';
import { motion } from 'motion/react';
import { Wallet as WalletIcon, ArrowDownRight, ArrowUpRight, Copy, Check } from 'lucide-react';
import { useState } from 'react';

interface WalletCardProps {
  wallet: Wallet | null;
  moneyIn: number;
  moneyOut: number;
}

export default function WalletCard({ wallet, moneyIn, moneyOut }: WalletCardProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    if (wallet) {
      navigator.clipboard.writeText(wallet.pointer);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const formattedBalance = wallet
    ? new Intl.NumberFormat('en-ZA', { style: 'currency', currency: wallet.currency }).format(wallet.balance)
    : 'R 0.00';

  const formattedIn = new Intl.NumberFormat('en-ZA', { style: 'currency', currency: 'ZAR' }).format(moneyIn);
  const formattedOut = new Intl.NumberFormat('en-ZA', { style: 'currency', currency: 'ZAR' }).format(moneyOut);

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {/* Primary ILP Wallet Pointer Card */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        className="md:col-span-2 relative overflow-hidden bg-indigo-750 border border-indigo-600/20 rounded-3xl p-6 text-white shadow-lg hover:shadow-xl transition-all duration-300 bg-gradient-to-br from-indigo-700 via-indigo-800 to-indigo-900"
      >
        {/* Ambient background glows */}
        <div className="absolute top-0 right-0 w-48 h-48 bg-white/10 rounded-full blur-3xl -translate-y-12 translate-x-12"></div>
        <div className="absolute bottom-0 left-0 w-36 h-36 bg-white/5 rounded-full blur-2xl translate-y-12 -translate-x-12"></div>

        {/* Card Header Tag */}
        <div className="flex items-center justify-between mb-6">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-white/10 hover:bg-white/15 transition rounded-full text-xs font-mono text-indigo-100">
            <WalletIcon className="w-3.5 h-3.5" />
            ILP Wallet
          </span>
          <span className="text-[10px] text-white/50 tracking-widest font-mono">**** 2291</span>
        </div>

        {/* Balance */}
        <p className="text-xs text-white/70 mb-1">Available balance</p>
        <h3 className="text-4xl font-bold tracking-tight mb-4 font-sans text-white">
          {formattedBalance}
        </h3>

        {/* Address & Clipboard Copy */}
        <div className="flex items-center justify-between bg-indigo-950/35 rounded-xl px-4 py-2.5 border border-indigo-600/30 backdrop-blur-md">
          <span className="font-mono text-xs text-indigo-200 select-all truncate">
            {wallet?.pointer || '$ilp.interledger-test.dev/resolving...'}
          </span>
          <button
            onClick={handleCopy}
            className="text-white/60 hover:text-white transition p-1 hover:bg-white/5 rounded-md"
            title="Copy Pointer Address"
          >
            {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
          </button>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between text-xs text-white/45 mt-6 pt-4 border-t border-indigo-600/20">
          <span>Active & Authorized ✓</span>
          <span>Open Payments</span>
        </div>
      </motion.div>

      {/* Aggregate Balance Mini-Widgets */}
      <div className="flex flex-col gap-4">
        {/* Money In */}
        <motion.div
          initial={{ opacity: 0, x: 15 }}
          animate={{ opacity: 1, x: 0 }}
          className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm"
        >
          <div className="flex items-center gap-2 text-xs text-slate-500 mb-1 font-medium">
            <div className="p-1.5 bg-emerald-50 text-emerald-600 rounded-lg">
              <ArrowDownRight className="w-4 h-4" />
            </div>
            Money in
          </div>
          <p className="text-2xl font-bold text-slate-800">{formattedIn}</p>
          <p className="text-[11px] text-emerald-600 mt-1 font-semibold">↑ 12% this month</p>
        </motion.div>

        {/* Money Out */}
        <motion.div
          initial={{ opacity: 0, x: 15 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm"
        >
          <div className="flex items-center gap-2 text-xs text-slate-500 mb-1 font-medium">
            <div className="p-1.5 bg-rose-50 text-rose-600 rounded-lg">
              <ArrowUpRight className="w-4 h-4" />
            </div>
            Money out
          </div>
          <p className="text-2xl font-bold text-slate-800">{formattedOut}</p>
          <p className="text-[11px] text-rose-600 mt-1 font-semibold">↑ 8% this month</p>
        </motion.div>
      </div>
    </div>
  );
}
