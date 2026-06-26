import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ArrowLeft, ArrowRight, Loader2, Send, CheckCircle2, Camera, ExternalLink, ShieldCheck } from 'lucide-react';
import Mascot from './Mascot';
import QrCodeScanner from './QrCodeScanner';

interface SendFormProps {
  onSendComplete: (amount: number) => void;
  token: string;
}

// Pending grant data returned from /api/payments/send/initiate
interface PendingPayment {
  approvalUrl: string;
  continueUri: string;
  continueToken: string;
  quote: {
    id: string;
    debitAmount: { value: string; assetCode: string; assetScale: number };
    receiveAmount: { value: string; assetCode: string; assetScale: number };
    expiresAt?: string;
  };
  destination: string;
  description: string;
}

type Step = 1 | 2 | 3 | 4;

export default function SendForm({ onSendComplete, token }: SendFormProps) {
  const [step, setStep] = useState<Step>(1);
  const [destination, setDestination] = useState('liam');
  const [amount, setAmount] = useState('150');
  const [description, setDescription] = useState('Weekend dinner share');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [pending, setPending] = useState<PendingPayment | null>(null);
  const [successTx, setSuccessTx] = useState<any>(null);
  const [showScanner, setShowScanner] = useState(false);

  const handleScanSuccess = (scanned: string) => {
    let v = scanned;
    if (v.includes('/')) v = v.split('/').pop() ?? v;
    setDestination(v.replace('$', '').trim().toLowerCase());
    setShowScanner(false);
  };

  // Step 1 → 2: initiate the Open Payments flow (creates incoming payment, quote, and interactive grant)
  const handleInitiate = async (e: React.FormEvent) => {
    e.preventDefault();
    const num = parseFloat(amount);
    if (!destination || isNaN(num) || num <= 0) {
      setError('Provide a destination pointer and a positive amount.');
      return;
    }
    setError('');
    setIsLoading(true);

    try {
      const res = await fetch('/api/payments/send/initiate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ destination, amount, description })
      });
      const data = await res.json();
      if (res.ok) {
        setPending(data);
        setStep(2);
      } else {
        setError(data.error ?? 'Failed to initiate payment.');
      }
    } catch {
      setError('Connection failure. Is the API server running?');
    } finally {
      setIsLoading(false);
    }
  };

  // Opens the approval URL in a new tab
  const handleOpenApproval = () => {
    if (pending?.approvalUrl) {
      window.open(pending.approvalUrl, '_blank', 'noopener,noreferrer');
      setStep(3);
    }
  };

  // Step 3 → 4: execute after the user has approved in their wallet
  const handleExecute = async () => {
    if (!pending) return;
    setIsLoading(true);
    setError('');

    try {
      const res = await fetch('/api/payments/send/execute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          continueUri: pending.continueUri,
          continueToken: pending.continueToken,
          quoteId: pending.quote.id,
          amount,
          destination: pending.destination,
          description: pending.description
        })
      });
      const data = await res.json();
      if (res.ok) {
        setSuccessTx(data.transaction);
        setStep(4);
        onSendComplete(parseFloat(amount));
      } else {
        setError(data.error ?? 'Payment execution failed.');
      }
    } catch {
      setError('Connection error.');
    } finally {
      setIsLoading(false);
    }
  };

  const reset = () => {
    setStep(1);
    setAmount('150');
    setPending(null);
    setSuccessTx(null);
    setError('');
  };

  const debitHuman = pending
    ? (parseInt(pending.quote.debitAmount.value) / Math.pow(10, pending.quote.debitAmount.assetScale)).toFixed(2)
    : parseFloat(amount).toFixed(2);

  const receiveHuman = pending
    ? (parseInt(pending.quote.receiveAmount.value) / Math.pow(10, pending.quote.receiveAmount.assetScale)).toFixed(2)
    : parseFloat(amount).toFixed(2);

  return (
    <div className="bg-white border border-slate-200 rounded-3xl p-4 sm:p-6 shadow-sm relative overflow-hidden" id="send-form-card">
      <div className="flex items-center gap-2 mb-6">
        {(step === 2 || step === 3) && (
          <button 
            onClick={reset} 
            aria-label="Go back to step 1"
            className="p-2 -ml-2 text-slate-500 hover:text-slate-800 transition rounded-xl hover:bg-slate-100 cursor-pointer min-w-[44px] min-h-[44px] flex items-center justify-center focus:outline-none focus:ring-2 focus:ring-emerald-500"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
        )}
        <h3 className="text-base sm:text-lg font-bold text-slate-850">
          {step === 1 && 'Initialize Outgoing Payment'}
          {step === 2 && 'Approve Payment'}
          {step === 3 && 'Confirm Approval'}
          {step === 4 && 'Transfer Settled Successfully'}
        </h3>
      </div>

      <AnimatePresence mode="wait">

        {/* ── STEP 1: enter details ─────────────────────────────────── */}
        {step === 1 && (
          <motion.form
            key="step1"
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 10 }}
            onSubmit={handleInitiate}
            className="space-y-4"
          >
            {error && (
              <div role="alert" className="p-3 bg-rose-50 border border-rose-200 text-rose-600 text-xs rounded-xl font-medium">
                {error}
              </div>
            )}

            <div className="space-y-1.5">
              <div className="flex justify-between items-center">
                <label htmlFor="recipient-pointer-input" className="text-xs text-slate-500 font-medium">
                  Recipient Pointer
                </label>
                <button 
                  type="button" 
                  onClick={() => setShowScanner(!showScanner)}
                  aria-expanded={showScanner}
                  className="flex items-center gap-1.5 py-1 px-2 text-[10px] uppercase tracking-wider font-bold text-emerald-700 hover:text-emerald-800 transition cursor-pointer min-h-[32px] rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  <Camera className="w-4 h-4" /> {showScanner ? 'Close' : 'Scan QR'}
                </button>
              </div>
              {showScanner && (
                <div className="border border-slate-200 rounded-2xl overflow-hidden mb-3">
                  <QrCodeScanner onScan={handleScanSuccess} title="Scan Recipient Payment Pointer" />
                </div>
              )}
              <div className="flex rounded-xl bg-slate-50 border border-slate-200 focus-within:border-emerald-500 focus-within:ring-2 focus-within:ring-emerald-500/20 transition overflow-hidden">
                <span className="bg-slate-100 text-slate-500 px-3 py-3 text-xs font-mono border-r border-slate-200 flex items-center select-none">
                  $ilp.interledger-test.dev/
                </span>
                <input 
                  id="recipient-pointer-input"
                  type="text" 
                  value={destination}
                  onChange={e => setDestination(e.target.value.toLowerCase().replace(/[^a-z0-9]/g, ''))}
                  className="bg-transparent text-slate-800 px-4 py-3 text-sm focus:outline-none flex-1 font-mono font-semibold"
                  placeholder="e.g. liam, nia, marco" 
                  aria-required="true"
                  required 
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label htmlFor="send-amount-input" className="text-xs text-slate-500 font-medium">
                Send Amount (R)
              </label>
              <div className="flex rounded-xl bg-slate-50 border border-slate-200 focus-within:border-emerald-500 focus-within:ring-2 focus-within:ring-emerald-500/20 transition overflow-hidden">
                <span className="bg-slate-100 text-slate-500 px-4 py-3 text-xs font-mono border-r border-slate-200 flex items-center font-semibold select-none">R</span>
                <input 
                  id="send-amount-input"
                  type="number" 
                  value={amount} 
                  onChange={e => setAmount(e.target.value)}
                  className="bg-transparent text-slate-800 px-4 py-3 text-sm focus:outline-none flex-1 font-mono font-bold"
                  placeholder="0.00" 
                  aria-required="true"
                  required 
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label htmlFor="memo-input" className="text-xs text-slate-500 font-medium">
                Memo / Reference
              </label>
              <input 
                id="memo-input"
                type="text" 
                value={description} 
                onChange={e => setDescription(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 text-slate-800 px-4 py-3 text-sm rounded-xl focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 font-medium transition"
                placeholder="e.g. share of lunch, rent" 
              />
            </div>

            <button 
              type="submit" 
              disabled={isLoading}
              className="w-full flex items-center justify-center gap-1.5 py-3.5 px-4 bg-emerald-600 hover:bg-emerald-700 active:scale-98 disabled:opacity-50 disabled:pointer-events-none text-white font-bold rounded-xl text-xs transition mt-4 cursor-pointer shadow-sm min-h-[44px] focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              {isLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <>Get Quote & Continue <ArrowRight className="w-4 h-4" /></>
              )}
            </button>
          </motion.form>
        )}

        {/* ── STEP 2: show quote + approval button ─────────────────── */}
        {step === 2 && pending && (
          <motion.div 
            key="step2" 
            initial={{ opacity: 0, x: -10 }} 
            animate={{ opacity: 1, x: 0 }} 
            exit={{ opacity: 0, x: 10 }} 
            className="space-y-5"
          >
            {error && (
              <div role="alert" className="p-3 bg-rose-50 border border-rose-200 text-rose-600 text-xs rounded-xl font-medium">
                {error}
              </div>
            )}

            <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-3 font-mono text-xs text-slate-600">
              <div className="flex justify-between border-b border-slate-200 pb-2">
                <span className="text-slate-500">Sending to</span>
                <span className="text-slate-800 font-bold truncate max-w-[180px]">$ilp.../{pending.destination}</span>
              </div>
              <div className="flex justify-between border-b border-slate-200 pb-2">
                <span className="text-slate-500">You send</span>
                <span className="text-slate-800 font-bold">R {debitHuman}</span>
              </div>
              <div className="flex justify-between border-b border-slate-200 pb-2">
                <span className="text-slate-500">They receive</span>
                <span className="text-emerald-700 font-bold">R {receiveHuman}</span>
              </div>
              {pending.quote.expiresAt && (
                <div className="flex justify-between pb-1">
                  <span className="text-slate-500">Quote expires</span>
                  <span className="text-amber-600 font-bold">10 min</span>
                </div>
              )}
            </div>

            {/* The approval button — opens the ILP wallet consent page in a new tab */}
            <div className="p-4 bg-emerald-50/50 border border-emerald-100 rounded-2xl space-y-3">
              <p className="text-xs text-emerald-800 font-semibold leading-relaxed">
                This payment requires your wallet's approval. Click the button below to authorize it in your Interledger wallet, then return here to complete.
              </p>
              <button 
                onClick={handleOpenApproval}
                className="w-full flex items-center justify-center gap-2 py-3.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl transition shadow-sm cursor-pointer min-h-[44px] focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                <ExternalLink className="w-4 h-4" /> Approve in Your Wallet
              </button>
            </div>

            <button 
              onClick={reset} 
              className="w-full py-3 text-slate-500 hover:text-slate-800 text-xs font-semibold rounded-xl transition cursor-pointer min-h-[44px] focus:outline-none focus:ring-2 focus:ring-slate-300"
            >
              Cancel
            </button>
          </motion.div>
        )}

        {/* ── STEP 3: user approved — complete the transfer ─────────── */}
        {step === 3 && pending && (
          <motion.div 
            key="step3" 
            initial={{ opacity: 0, x: -10 }} 
            animate={{ opacity: 1, x: 0 }} 
            exit={{ opacity: 0, x: 10 }} 
            className="space-y-5"
          >
            {error && (
              <div role="alert" className="p-3 bg-rose-50 border border-rose-200 text-rose-600 text-xs rounded-xl font-medium">
                {error}
              </div>
            )}

            <div className="p-5 bg-emerald-50 border border-emerald-200 rounded-2xl text-center space-y-2">
              <ShieldCheck className="w-8 h-8 text-emerald-600 mx-auto animate-pulse" />
              <p className="text-sm font-bold text-emerald-800">Approved in your wallet?</p>
              <p className="text-xs text-emerald-700 leading-relaxed">
                Once you've approved the payment in the Interledger wallet tab, click below to finalize the transfer.
              </p>
            </div>

            <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-2 font-mono text-xs text-slate-600">
              <div className="flex justify-between">
                <span>Sending</span>
                <span className="font-bold text-slate-800">R {debitHuman} → $ilp.../{pending.destination}</span>
              </div>
            </div>

            <button 
              onClick={handleExecute} 
              disabled={isLoading}
              className="w-full flex items-center justify-center gap-1.5 py-3.5 px-4 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 disabled:pointer-events-none text-white font-bold text-xs rounded-xl transition shadow-sm cursor-pointer min-h-[44px] focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              {isLoading ? (
                <><Loader2 className="w-4 h-4 animate-spin" /> Processing...</>
              ) : (
                <><Send className="w-4 h-4" /> Complete Transfer</>
              )}
            </button>

            <button 
              onClick={() => setStep(2)} 
              className="w-full py-3 text-slate-500 hover:text-slate-850 text-xs font-semibold rounded-xl transition cursor-pointer min-h-[44px] focus:outline-none focus:ring-2 focus:ring-slate-300"
            >
              Go Back
            </button>
          </motion.div>
        )}

        {/* ── STEP 4: success ──────────────────────────────────────── */}
        {step === 4 && (
          <motion.div 
            key="step4" 
            initial={{ opacity: 0, scale: 0.95 }} 
            animate={{ opacity: 1, scale: 1 }} 
            className="flex flex-col items-center space-y-4"
          >
            <Mascot state="happy" message={`Sent R ${debitHuman} to $ilp.../${destination}!`} size="lg" />
            <div className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl flex flex-col items-center text-center space-y-3">
              <div className="p-3 bg-emerald-50 text-emerald-600 rounded-full">
                <CheckCircle2 className="w-10 h-10" />
              </div>
              <div>
                <p className="text-xs text-slate-500 font-mono select-all truncate max-w-xs mb-1 font-medium">
                  Ref: {successTx?.reference ?? 'N/A'}
                </p>
                <span className="text-[10px] uppercase font-mono tracking-widest text-emerald-700 font-bold bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
                  Transfer Settled
                </span>
              </div>
            </div>
            <button 
              onClick={reset} 
              className="w-full py-3.5 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition cursor-pointer min-h-[44px] focus:outline-none focus:ring-2 focus:ring-slate-300"
            >
              Make Another Transfer
            </button>
          </motion.div>
        )}

      </AnimatePresence>
    </div>
  );
}

