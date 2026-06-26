import React, { useState } from 'react';
import { motion } from 'motion/react';
import { PiggyBank, ArrowRightLeft, ShieldCheck, HelpCircle, TrendingUp } from 'lucide-react';
import { Wallet } from '../types';

interface ReserveBucketPanelProps {
  wallet: Wallet | null;
  token: string | null;
  onReserveChanged: () => void;
}

export default function ReserveBucketPanel({ wallet, token, onReserveChanged }: ReserveBucketPanelProps) {
  const [amount, setAmount] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const formattedBalance = wallet
    ? new Intl.NumberFormat('en-ZA', { style: 'currency', currency: wallet.currency }).format(wallet.balance)
    : 'R 0.00';

  const formattedReserve = wallet
    ? new Intl.NumberFormat('en-ZA', { style: 'currency', currency: wallet.currency }).format(wallet.reserveBalance || 0)
    : 'R 0.00';

  const handleAction = async (action: 'deposit' | 'withdraw') => {
    setError('');
    setSuccess('');
    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      setError('Please enter a positive numeric amount.');
      return;
    }

    setIsLoading(true);
    try {
      const endpoint = action === 'deposit' ? '/api/reserve/deposit' : '/api/reserve/withdraw';
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ amount: numAmount })
      });

      const data = await response.json();
      if (response.ok) {
        setSuccess(
          action === 'deposit'
            ? `Successfully transferred R ${numAmount.toFixed(2)} to your savings reserve!`
            : `Successfully released R ${numAmount.toFixed(2)} back to your spending balance.`
        );
        setAmount('');
        onReserveChanged();
      } else {
        setError(data.error || 'Operation failed.');
      }
    } catch (e) {
      setError('Connection failure.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-6" id="reserve-bucket-panel">
      {/* Header */}
      <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
        <div className="p-3 bg-peach-50 text-peach-700 rounded-2xl">
          <PiggyBank className="w-6 h-6 animate-pulse" />
        </div>
        <div>
          <h3 className="text-base font-bold text-slate-800">Savings Reserve Pocket</h3>
          <p className="text-xs text-slate-500 font-sans">Lock away savings to protect your budget and boost your confidence score.</p>
        </div>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-slate-50 border border-slate-150 rounded-2xl p-4">
          <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Main Wallet Balance</p>
          <p className="text-xl font-bold text-slate-800 mt-1">{formattedBalance}</p>
        </div>
        <div className="bg-peach-50/40 border border-peach-100 rounded-2xl p-4">
          <p className="text-[10px] text-peach-700 font-bold uppercase tracking-wider">Reserved Savings</p>
          <p className="text-xl font-bold text-peach-900 mt-1">{formattedReserve}</p>
        </div>
      </div>

      {/* Input Transfer Panel */}
      <div className="space-y-4">
        <div className="space-y-1.5">
          <label className="text-xs text-slate-500 font-bold flex items-center gap-1.5">
            <ArrowRightLeft className="w-3.5 h-3.5" /> Transfer Amount (ZAR)
          </label>
          <div className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-sm">R</span>
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="w-full bg-slate-55 border border-slate-200 rounded-xl pl-8 pr-4 py-3 text-sm text-slate-850 placeholder-slate-400 focus:outline-none focus:border-peach-500 focus:ring-1 focus:ring-peach-500 transition font-medium"
              placeholder="0.00"
              min="1"
              step="any"
              disabled={isLoading}
            />
          </div>
        </div>

        {error && <div className="text-xs text-rose-600 bg-rose-50 border border-rose-100 p-3 rounded-xl font-semibold">{error}</div>}
        {success && <div className="text-xs text-emerald-600 bg-emerald-55 border border-emerald-100 p-3 rounded-xl font-semibold">{success}</div>}

        <div className="grid grid-cols-2 gap-4">
          <button
            onClick={() => handleAction('deposit')}
            disabled={isLoading || !amount}
            className="w-full py-3 bg-peach-600 hover:bg-peach-700 disabled:bg-slate-100 disabled:text-slate-400 text-white text-xs font-bold rounded-xl transition cursor-pointer shadow-sm flex items-center justify-center gap-1.5"
          >
            Divert to Savings
          </button>
          <button
            onClick={() => handleAction('withdraw')}
            disabled={isLoading || !amount}
            className="w-full py-3 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 disabled:bg-slate-50 disabled:text-slate-400 text-xs font-bold rounded-xl transition cursor-pointer flex items-center justify-center gap-1.5"
          >
            Release to Spending
          </button>
        </div>
      </div>

      {/* Credit Rating Highlight */}
      <div className="p-4 bg-emerald-50/40 border border-emerald-100 rounded-2xl flex gap-3">
        <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
        <div className="space-y-1">
          <h4 className="text-xs font-bold text-emerald-900 flex items-center gap-1">
            <TrendingUp className="w-3.5 h-3.5" /> Save Money, Boost Credit Rating
          </h4>
          <p className="text-[11px] text-emerald-700 leading-normal font-sans">
            Our AI smart-scoring algorithm awards financial discipline! Every R 50 transferred to your reserve bucket increases your **Financial Confidence Score**, helping you unlock higher backup overdraft ceilings from credit syndicates.
          </p>
        </div>
      </div>
    </div>
  );
}
