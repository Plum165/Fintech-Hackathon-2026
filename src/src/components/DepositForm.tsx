import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ArrowLeft, ArrowRight, CheckCircle2, QrCode, Sparkles, Loader2 } from 'lucide-react';
import Mascot from './Mascot';

interface DepositFormProps {
  currentUsername: string;
  onDepositComplete: (amount: number) => void;
  token: string;
}

export default function DepositForm({ currentUsername, onDepositComplete, token }: DepositFormProps) {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [amount, setAmount] = useState('100');
  const [currency, setCurrency] = useState('ZAR');
  const [username, setUsername] = useState(currentUsername);
  const [isLoading, setIsLoading] = useState(false);
  const [qrCodeData, setQrCodeData] = useState('');
  const [paymentPointer, setPaymentPointer] = useState('');
  const [error, setError] = useState('');

  const quickAmounts = ['50', '100', '200', '500'];

  const handleStep1Submit = (e: React.FormEvent) => {
    e.preventDefault();
    const num = parseFloat(amount);
    if (isNaN(num) || num <= 0) {
      setError('Please enter a positive deposit amount.');
      return;
    }
    setError('');
    setStep(2);
  };

  const handleCreateIncomingPayment = async () => {
    setIsLoading(true);
    setError('');
    try {
      const response = await fetch('/api/payments/deposit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ amount, username })
      });
      const data = await response.json();
      if (response.ok) {
        setQrCodeData(data.qrCode);
        setPaymentPointer(data.paymentPointer);
        setStep(3);
        onDepositComplete(parseFloat(amount));
      } else {
        setError(data.error || 'Failed to initialize Interledger deposit.');
      }
    } catch (e) {
      setError('Connection error. Is the server running?');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm relative overflow-hidden">
      {/* Dynamic Header */}
      <div className="flex items-center gap-2 mb-6">
        {step > 1 && step < 3 && (
          <button
            onClick={() => setStep((step - 1) as any)}
            className="p-1 text-slate-500 hover:text-slate-800 transition rounded-md hover:bg-slate-100"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
        )}
        <h3 className="text-lg font-bold text-slate-800">
          {step === 1 && 'Initialize ILP Deposit'}
          {step === 2 && 'Confirm Payment details'}
          {step === 3 && 'Payment Settled Successfully'}
        </h3>
      </div>

      <AnimatePresence mode="wait">
        {/* Step 1: Input & Presets */}
        {step === 1 && (
          <motion.form
            key="step1"
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 10 }}
            onSubmit={handleStep1Submit}
            className="space-y-5"
          >
            {error && (
              <div className="p-3 bg-rose-50 border border-rose-200 text-rose-600 text-xs rounded-xl">
                {error}
              </div>
            )}

            {/* Wallet Address / Username */}
            <div className="space-y-1.5">
              <label className="text-xs text-slate-500 font-medium">Wallet Username</label>
              <div className="flex rounded-xl bg-slate-50 border border-slate-200 focus-within:border-indigo-500 focus-within:ring-1 focus-within:ring-indigo-500 transition overflow-hidden">
                <span className="bg-slate-100 text-slate-500 px-3.5 py-3 text-xs select-none border-r border-slate-200 flex items-center font-mono">
                  $ilp.interledger-test.dev/
                </span>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9]/g, ''))}
                  className="bg-transparent text-slate-800 px-4 py-3 text-sm focus:outline-none flex-1 font-mono font-medium"
                  placeholder="username"
                  required
                />
              </div>
            </div>

            {/* Amount input */}
            <div className="space-y-1.5">
              <label className="text-xs text-slate-500 font-medium font-sans">Amount</label>
              <div className="flex rounded-xl bg-slate-50 border border-slate-200 focus-within:border-indigo-500 focus-within:ring-1 focus-within:ring-indigo-500 transition overflow-hidden">
                <span className="bg-slate-100 text-slate-500 px-4 py-3 text-xs font-mono border-r border-slate-200 flex items-center font-medium">
                  R
                </span>
                <input
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="bg-transparent text-slate-800 px-4 py-3 text-sm focus:outline-none flex-1 font-mono font-bold"
                  placeholder="0.00"
                  step="any"
                  required
                />
                <select
                  value={currency}
                  onChange={(e) => setCurrency(e.target.value)}
                  className="bg-slate-100 text-slate-600 px-3 border-l border-slate-200 font-mono text-xs focus:outline-none cursor-pointer font-bold"
                >
                  <option value="ZAR">ZAR</option>
                  <option value="USD">USD</option>
                </select>
              </div>
            </div>

            {/* Preset quick-amounts */}
            <div className="grid grid-cols-4 gap-2">
              {quickAmounts.map((q) => (
                <button
                  type="button"
                  key={q}
                  onClick={() => setAmount(q)}
                  className={`py-2 text-xs font-mono font-bold rounded-xl border transition-all ${
                    amount === q
                      ? 'bg-indigo-50 text-indigo-700 border-indigo-200 shadow-xs'
                      : 'bg-slate-50 text-slate-600 border-slate-200 hover:border-slate-300'
                  }`}
                >
                  R {q}
                </button>
              ))}
            </div>

            <button
              type="submit"
              className="w-full flex items-center justify-center gap-1.5 py-3 px-4 bg-indigo-600 hover:bg-indigo-700 active:scale-98 text-white font-semibold rounded-xl text-xs transition-all duration-150 mt-4 cursor-pointer shadow-sm"
            >
              Continue <ArrowRight className="w-4 h-4" />
            </button>
          </motion.form>
        )}

        {/* Step 2: Confirmation */}
        {step === 2 && (
          <motion.div
            key="step2"
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 10 }}
            className="space-y-5"
          >
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-3 font-mono text-xs text-slate-600">
              <div className="flex justify-between border-b border-slate-200 pb-2">
                <span className="text-slate-500">Target Address</span>
                <span className="text-slate-800 text-right font-bold truncate max-w-[180px]">
                  $ilp.interledger-test.dev/{username}
                </span>
              </div>
              <div className="flex justify-between border-b border-slate-200 pb-2">
                <span className="text-slate-500">Amount</span>
                <span className="text-slate-800 font-bold">R {parseFloat(amount).toFixed(2)}</span>
              </div>
              <div className="flex justify-between pb-1">
                <span className="text-slate-500">Payment Protocol</span>
                <span className="text-indigo-600 font-bold">Open Payments (ILP)</span>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setStep(1)}
                className="flex-1 py-3 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl transition"
              >
                Back
              </button>
              <button
                onClick={handleCreateIncomingPayment}
                disabled={isLoading}
                className="flex-1 py-3 px-4 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-100 disabled:text-slate-400 text-white text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 transition shadow-sm"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" /> Negotiating...
                  </>
                ) : (
                  <>
                    Approve & Deposit <Sparkles className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>
          </motion.div>
        )}

        {/* Step 3: Success Screen with Mascot Reaction */}
        {step === 3 && (
          <motion.div
            key="step3"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex flex-col items-center space-y-4"
          >
            {/* Mascot reaction to successful deposit (happy state) */}
            <Mascot 
              state="happy" 
              message={`Hurray! R ${parseFloat(amount).toFixed(2)} was successfully added to your wallet!`} 
              size="lg" 
            />

            <div className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl flex flex-col items-center text-center space-y-3">
              <div className="p-3 bg-emerald-50 text-emerald-600 rounded-full">
                <CheckCircle2 className="w-10 h-10" />
              </div>
              <div>
                <p className="text-xs text-slate-500 font-mono select-all truncate max-w-xs mb-1 font-medium">
                  {paymentPointer}
                </p>
                <span className="text-[10px] uppercase font-mono tracking-widest text-emerald-700 font-bold bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
                  Settlement Confirmed
                </span>
              </div>
            </div>

            <button
              onClick={() => {
                setStep(1);
                setAmount('');
              }}
              className="w-full py-3 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition"
            >
              Make Another Deposit
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
