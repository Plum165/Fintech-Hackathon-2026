import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ArrowLeft, ArrowRight, Loader2, Sparkles, Send, CheckCircle2 } from 'lucide-react';
import Mascot from './Mascot';

interface SendFormProps {
  onSendComplete: (amount: number) => void;
  token: string;
}

export default function SendForm({ onSendComplete, token }: SendFormProps) {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [destination, setDestination] = useState('liam');
  const [amount, setAmount] = useState('150');
  const [description, setDescription] = useState('Weekend dinner share');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [successTx, setSuccessTx] = useState<any>(null);

  const handleCreateQuote = async (e: React.FormEvent) => {
    e.preventDefault();
    const num = parseFloat(amount);
    if (!destination || isNaN(num) || num <= 0) {
      setError('Please provide a destination pointer and positive amount.');
      return;
    }
    setError('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/payments/quote', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ destination, amount })
      });
      const data = await response.json();
      if (response.ok) {
        setStep(2);
      } else {
        setError(data.error || 'Failed to request Open Payments conversion quote.');
      }
    } catch (err) {
      setError('Connection failure.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendPayment = async () => {
    setIsLoading(true);
    setError('');
    try {
      const response = await fetch('/api/payments/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ destination, amount, description })
      });
      const data = await response.json();
      if (response.ok) {
        setSuccessTx(data.transaction);
        setStep(3);
        onSendComplete(parseFloat(amount));
      } else {
        setError(data.error || 'Outbound payment transfer failed.');
      }
    } catch (e) {
      setError('Connection error.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm relative overflow-hidden">
      <div className="flex items-center gap-2 mb-6">
        {step > 1 && step < 3 && (
          <button
            onClick={() => setStep(1)}
            className="p-1 text-slate-500 hover:text-slate-800 transition rounded-md hover:bg-slate-100"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
        )}
        <h3 className="text-lg font-bold text-slate-800">
          {step === 1 && 'Initialize Outgoing Payment'}
          {step === 2 && 'Approve Quote & Sign'}
          {step === 3 && 'Transfer Settled Successfully'}
        </h3>
      </div>

      <AnimatePresence mode="wait">
        {step === 1 && (
          <motion.form
            key="send-step1"
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 10 }}
            onSubmit={handleCreateQuote}
            className="space-y-4"
          >
            {error && (
              <div className="p-3 bg-rose-50 border border-rose-200 text-rose-600 text-xs rounded-xl">
                {error}
              </div>
            )}

            <div className="space-y-1.5">
              <label className="text-xs text-slate-500 font-medium">Recipient Pointer</label>
              <div className="flex rounded-xl bg-slate-50 border border-slate-200 focus-within:border-indigo-500 focus-within:ring-1 focus-within:ring-indigo-500 transition overflow-hidden">
                <span className="bg-slate-100 text-slate-500 px-3 py-3 text-xs font-mono border-r border-slate-200 flex items-center">
                  $ilp.interledger-test.dev/
                </span>
                <input
                  type="text"
                  value={destination}
                  onChange={(e) => setDestination(e.target.value.toLowerCase().replace(/[^a-z0-9]/g, ''))}
                  className="bg-transparent text-slate-800 px-4 py-3 text-sm focus:outline-none flex-1 font-mono font-medium"
                  placeholder="e.g. liam, nia, marco"
                  required
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs text-slate-500 font-medium">Send Amount (R)</label>
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
                  required
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs text-slate-500 font-medium">Memo / Reference</label>
              <input
                type="text"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 text-slate-800 px-4 py-3 text-sm rounded-xl focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 font-medium"
                placeholder="e.g. share of lunch, rent share"
              />
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full flex items-center justify-center gap-1.5 py-3 px-4 bg-indigo-600 hover:bg-indigo-700 active:scale-98 text-white font-semibold rounded-xl text-xs transition mt-4 cursor-pointer shadow-sm"
            >
              {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <>Request Quote <ArrowRight className="w-4 h-4" /></>}
            </button>
          </motion.form>
        )}

        {step === 2 && (
          <motion.div
            key="send-step2"
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 10 }}
            className="space-y-5"
          >
            {error && (
              <div className="p-3 bg-rose-50 border border-rose-200 text-rose-600 text-xs rounded-xl">
                {error}
              </div>
            )}

            <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-3 font-mono text-xs text-slate-600">
              <div className="flex justify-between border-b border-slate-200 pb-2">
                <span className="text-slate-500">Target Receiver</span>
                <span className="text-slate-800 text-right font-bold truncate max-w-[180px]">
                  $ilp.interledger-test.dev/{destination}
                </span>
              </div>
              <div className="flex justify-between border-b border-slate-200 pb-2">
                <span className="text-slate-500">Conversion Rate</span>
                <span className="text-slate-800 font-bold">1.00 ZAR = 1.00 ZAR</span>
              </div>
              <div className="flex justify-between border-b border-slate-200 pb-2">
                <span className="text-slate-500">Amount to send</span>
                <span className="text-slate-800 font-bold">R {parseFloat(amount).toFixed(2)}</span>
              </div>
              <div className="flex justify-between pb-1">
                <span className="text-slate-500">Open Quote Expiry</span>
                <span className="text-amber-600 font-bold">10 minutes</span>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setStep(1)}
                className="flex-1 py-3 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl transition"
              >
                Cancel
              </button>
              <button
                onClick={handleSendPayment}
                disabled={isLoading}
                className="flex-1 py-3 px-4 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-100 disabled:text-slate-400 text-white text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 transition shadow-sm"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" /> Transferring...
                  </>
                ) : (
                  <>
                    Sign & Transfer <Send className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>
          </motion.div>
        )}

        {step === 3 && (
          <motion.div
            key="send-step3"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex flex-col items-center space-y-4"
          >
            <Mascot 
              state="happy" 
              message={`Success! Sent R ${parseFloat(amount).toFixed(2)} to $ilp.../${destination}!`} 
              size="lg" 
            />

            <div className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl flex flex-col items-center text-center space-y-3">
              <div className="p-3 bg-emerald-50 text-emerald-600 rounded-full">
                <CheckCircle2 className="w-10 h-10" />
              </div>
              <div>
                <p className="text-xs text-slate-500 font-mono select-all truncate max-w-xs mb-1 font-medium">
                  Ref: {successTx?.reference || 'N/A'}
                </p>
                <span className="text-[10px] uppercase font-mono tracking-widest text-emerald-700 font-bold bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
                  Transfer Settled
                </span>
              </div>
            </div>

            <button
              onClick={() => {
                setStep(1);
                setAmount('100');
              }}
              className="w-full py-3 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition"
            >
              Make Another Transfer
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
