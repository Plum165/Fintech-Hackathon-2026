import { Wallet } from '../types';
import { motion } from 'motion/react';
import { 
  Wallet as WalletIcon, ArrowDownRight, ArrowUpRight, Copy, Check, 
  ShieldCheck, ShieldAlert, PiggyBank, Target, HelpCircle, AlertTriangle 
} from 'lucide-react';
import { useState } from 'react';
import ConfidenceScoreBreakdown from './ConfidenceScoreBreakdown';

interface WalletCardProps {
  wallet: Wallet | null;
  kycStatus?: 'unverified' | 'pending' | 'verified';
  moneyIn: number;
  moneyOut: number;
  onNavigateToTab?: (tab: string) => void;
}

export default function WalletCard({ wallet, kycStatus = 'unverified', moneyIn, moneyOut, onNavigateToTab }: WalletCardProps) {
  const [copied, setCopied] = useState(false);
  const [isScoreOpen, setIsScoreOpen] = useState(false);

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

  const formattedReserve = wallet
    ? new Intl.NumberFormat('en-ZA', { style: 'currency', currency: wallet.currency }).format(wallet.reserveBalance || 0)
    : 'R 0.00';

  const formattedCredit = wallet
    ? new Intl.NumberFormat('en-ZA', { style: 'currency', currency: wallet.currency }).format(wallet.creditOwed || 0)
    : 'R 0.00';

  const formattedIn = new Intl.NumberFormat('en-ZA', { style: 'currency', currency: 'ZAR' }).format(moneyIn);
  const formattedOut = new Intl.NumberFormat('en-ZA', { style: 'currency', currency: 'ZAR' }).format(moneyOut);

  // Confidence rating logic
  const getScoreRating = (score: number) => {
    if (score >= 850) return { label: 'Excellent', color: 'text-emerald-600 bg-emerald-50 border-emerald-200' };
    if (score >= 700) return { label: 'Good', color: 'text-teal-600 bg-teal-50 border-teal-200' };
    if (score >= 500) return { label: 'Moderate', color: 'text-amber-600 bg-amber-50 border-amber-200' };
    return { label: 'High Risk', color: 'text-rose-600 bg-rose-50 border-rose-200' };
  };

  const scoreRating = getScoreRating(wallet?.confidenceScore || 600);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Primary ILP Wallet Pointer Card */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        className="lg:col-span-2 relative overflow-hidden bg-peach-700 border border-peach-600/20 rounded-3xl p-6 text-white shadow-lg hover:shadow-xl transition-all duration-300 bg-gradient-to-br from-peach-600 via-peach-700 to-peach-800 flex flex-col justify-between"
      >
        {/* Ambient background glows */}
        <div className="absolute top-0 right-0 w-48 h-48 bg-white/10 rounded-full blur-3xl -translate-y-12 translate-x-12"></div>
        <div className="absolute bottom-0 left-0 w-36 h-36 bg-white/5 rounded-full blur-2xl translate-y-12 -translate-x-12"></div>

        <div>
          {/* Card Header Tag */}
          <div className="flex items-center justify-between mb-6">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-white/10 hover:bg-white/15 transition rounded-full text-xs font-mono text-peach-100">
              <WalletIcon className="w-3.5 h-3.5" />
              ILP Open Payment Node
            </span>
            
            {/* KYC badge */}
            {kycStatus === 'verified' ? (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-emerald-500/20 text-emerald-100 border border-emerald-400/30 rounded-full text-[10px] font-bold uppercase tracking-wider">
                <ShieldCheck className="w-3.5 h-3.5" /> KYC Verified
              </span>
            ) : (
              <button 
                onClick={() => onNavigateToTab?.('kyc')}
                className="inline-flex items-center gap-1 px-2.5 py-1 bg-amber-500/20 hover:bg-amber-500/30 text-amber-100 border border-amber-400/30 rounded-full text-[10px] font-bold uppercase tracking-wider cursor-pointer"
              >
                <ShieldAlert className="w-3.5 h-3.5" /> KYC Missing (Verify Now)
              </button>
            )}
          </div>

          {/* Balance Row */}
          <div className="flex flex-wrap justify-between items-end gap-4">
            <div>
              <p className="text-xs text-white/70 mb-1">Available spending balance</p>
              <h3 className="text-4xl font-bold tracking-tight font-sans text-white">
                {formattedBalance}
              </h3>
            </div>
            
            {/* Secondary Reserve pocket */}
            <div className="bg-white/10 border border-white/10 rounded-2xl p-3 backdrop-blur-md">
              <div className="flex items-center gap-1 text-[10px] text-white/70 font-bold uppercase tracking-wider">
                <PiggyBank className="w-3.5 h-3.5" /> Reserve Bucket
              </div>
              <p className="text-lg font-bold text-white mt-0.5">{formattedReserve}</p>
              <button 
                onClick={() => onNavigateToTab?.('reserve')}
                className="text-[10px] text-peach-200 hover:text-white font-semibold flex items-center gap-0.5 mt-1 cursor-pointer"
              >
                Manage bucket →
              </button>
            </div>
          </div>
        </div>

        <div className="mt-6">
          {/* Address & Clipboard Copy */}
          <div className="flex items-center justify-between bg-peach-900/35 rounded-xl px-4 py-2.5 border border-peach-600/30 backdrop-blur-md">
            <span className="font-mono text-xs text-peach-100 select-all truncate">
              {wallet?.pointer || '$ilp.interledger-test.dev/resolving...'}
            </span>
            <button
              onClick={handleCopy}
              className="text-white/60 hover:text-white transition p-1 hover:bg-white/5 rounded-md cursor-pointer"
              title="Copy Pointer Address"
            >
              {copied ? <Check className="w-4 h-4 text-peach-300" /> : <Copy className="w-4 h-4" />}
            </button>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between text-[10px] text-white/45 mt-4 pt-3 border-t border-peach-600/10 uppercase tracking-widest font-mono">
            <span>Interledger Sandboxed Ledgers</span>
            <span>Ref: {wallet?.id?.toUpperCase()}</span>
          </div>
        </div>
      </motion.div>

      {/* Aggregate Balance & Metrics Mini-Widgets */}
      <div className="grid grid-cols-2 lg:grid-cols-1 gap-4">
        {/* Money In & Out Group */}
        <div className="grid grid-cols-2 gap-4 col-span-2 lg:col-span-1">
          <div className="bg-white border border-slate-200 rounded-2xl p-4.5 shadow-xs flex flex-col justify-between">
            <div className="flex items-center gap-1.5 text-[10px] text-slate-500 font-bold uppercase tracking-wider">
              <ArrowDownRight className="w-4 h-4 text-emerald-600 bg-emerald-50 p-0.5 rounded" />
              Incoming
            </div>
            <p className="text-lg font-bold text-slate-800 mt-2">{formattedIn}</p>
          </div>

          <div className="bg-white border border-slate-200 rounded-2xl p-4.5 shadow-xs flex flex-col justify-between">
            <div className="flex items-center gap-1.5 text-[10px] text-slate-500 font-bold uppercase tracking-wider">
              <ArrowUpRight className="w-4 h-4 text-rose-600 bg-rose-50 p-0.5 rounded" />
              Outgoing
            </div>
            <p className="text-lg font-bold text-slate-800 mt-2">{formattedOut}</p>
          </div>
        </div>

        {/* AI Confidence Score Card */}
        <div 
          onClick={() => setIsScoreOpen(true)}
          className="bg-white border border-slate-200 rounded-2xl p-4.5 shadow-xs flex items-center justify-between cursor-pointer hover:border-peach-300 hover:shadow-md hover:bg-slate-50/50 transition duration-300 group"
          title="Click to view detailed AI scoring scorecard"
        >
          <div>
            <div className="flex items-center gap-1.5 text-[10px] text-slate-500 font-bold uppercase tracking-wider">
              <Target className="w-4 h-4 text-peach-600" />
              Confidence Score
            </div>
            <p className="text-2xl font-black text-slate-800 mt-1">
              {wallet?.confidenceScore || 600} <span className="text-xs text-slate-400 font-normal">/ 1000</span>
            </p>
            <div className="flex items-center gap-2 mt-1.5 flex-wrap">
              <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold border ${scoreRating.color}`}>
                {scoreRating.label} Risk
              </span>
              <span className="text-[10px] text-peach-700 font-semibold group-hover:underline">
                View AI Report →
              </span>
            </div>
          </div>
          <div className="hidden sm:block text-slate-200 text-3xl group-hover:scale-110 transition duration-300">🎯</div>
        </div>

        {/* Outstanding Fintech covered debt */}
        <div className="bg-white border border-slate-200 rounded-2xl p-4.5 shadow-xs flex items-center justify-between col-span-2 lg:col-span-1">
          <div>
            <div className="flex items-center gap-1.5 text-[10px] text-slate-500 font-bold uppercase tracking-wider">
              <HelpCircle className="w-4 h-4 text-amber-600" />
              Syndicate Backed Debt
            </div>
            <p className="text-xl font-bold text-slate-800 mt-1">{formattedCredit}</p>
            {wallet && wallet.creditOwed > 0 ? (
              <div className="flex items-center gap-1 text-[10px] text-rose-600 font-medium mt-1">
                <AlertTriangle className="w-3 h-3" /> Overdue (10% penalty active)
              </div>
            ) : (
              <p className="text-[10px] text-emerald-600 font-semibold mt-1">✓ No outstanding credit debt</p>
            )}
            {wallet && wallet.creditOwed > 0 && (
              <button
                onClick={() => onNavigateToTab?.('subscriptions')}
                className="text-[10px] text-peach-700 hover:text-peach-800 font-bold mt-1 bg-peach-50 px-2 py-0.5 rounded border border-peach-200 hover:bg-peach-100 transition cursor-pointer"
              >
                Repay Credit Now
              </button>
            )}
          </div>
          <div className="hidden sm:block text-slate-200 text-3xl">🐼</div>
        </div>
      </div>

      {/* Credit scoring breakdown modal */}
      <ConfidenceScoreBreakdown 
        wallet={wallet} 
        isOpen={isScoreOpen} 
        onClose={() => setIsScoreOpen(false)} 
      />
    </div>
  );
}
