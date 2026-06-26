import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { 
  CreditCard, Calendar, RefreshCw, Trash2, Plus, AlertTriangle, 
  CheckCircle2, ShieldCheck, Flame, PlayCircle, HelpCircle, Sparkles, AlertCircle 
} from 'lucide-react';
import { Wallet, Subscription } from '../types';

interface SubscriptionsPanelProps {
  wallet: Wallet | null;
  token: string | null;
  onUpdate: () => void;
}

export default function SubscriptionsPanel({ wallet, token, onUpdate }: SubscriptionsPanelProps) {
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Repay debt form
  const [repayAmount, setRepayAmount] = useState('');
  const [repayError, setRepayError] = useState('');
  const [repaySuccess, setRepaySuccess] = useState('');
  const [isRepaying, setIsRepaying] = useState(false);

  // Time travel trigger
  const [isSimulatingTime, setIsSimulatingTime] = useState(false);

  // New Subscription Form States
  const [showAddForm, setShowAddForm] = useState(false);
  const [merchantName, setMerchantName] = useState('');
  const [pointer, setPointer] = useState('');
  const [amount, setAmount] = useState('');
  const [frequency, setFrequency] = useState<'daily' | 'weekly' | 'monthly'>('monthly');
  const [category, setCategory] = useState('Tech & subscriptions');

  const fetchSubscriptions = async () => {
    try {
      const response = await fetch('/api/subscriptions', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      if (response.ok) {
        setSubscriptions(data.subscriptions || []);
      }
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchSubscriptions();
  }, [token]);

  const handleCreateSubscription = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!merchantName.trim() || !pointer.trim() || !amount) {
      setError('Please fill in all subscription fields.');
      return;
    }

    try {
      const response = await fetch('/api/subscriptions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          merchantName,
          pointer,
          amount: parseFloat(amount),
          frequency,
          category
        })
      });

      const data = await response.json();
      if (response.ok) {
        setSuccess(`Successfully registered recurring payment for ${merchantName}!`);
        setMerchantName('');
        setPointer('');
        setAmount('');
        setShowAddForm(false);
        fetchSubscriptions();
        onUpdate();
      } else {
        setError(data.error || 'Failed to create subscription.');
      }
    } catch (e) {
      setError('Network failure.');
    }
  };

  const handleDeleteSubscription = async (id: string) => {
    setError('');
    setSuccess('');
    try {
      const response = await fetch(`/api/subscriptions/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        setSuccess('Subscription canceled and closed.');
        fetchSubscriptions();
        onUpdate();
      } else {
        setError('Failed to cancel.');
      }
    } catch (e) {
      setError('Network error.');
    }
  };

  const handleProcessSubscription = async (id: string) => {
    setError('');
    setSuccess('');
    setIsLoading(true);
    try {
      const response = await fetch(`/api/subscriptions/process/${id}`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      const data = await response.json();
      if (response.ok) {
        if (data.backedUp) {
          setError(data.infoText); // Use error style to warn about credit debt fallback
        } else {
          setSuccess(data.infoText);
        }
        fetchSubscriptions();
        onUpdate();
      } else {
        setError(data.error || 'Failed to process payment.');
      }
    } catch (e) {
      setError('Network error processing payment pointer.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRepayCredit = async (e: React.FormEvent) => {
    e.preventDefault();
    setRepayError('');
    setRepaySuccess('');
    const numAmount = parseFloat(repayAmount);

    if (isNaN(numAmount) || numAmount <= 0) {
      setRepayError('Enter a positive numeric amount.');
      return;
    }

    setIsRepaying(true);
    try {
      const response = await fetch('/api/credit/repay', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ amount: numAmount })
      });

      const data = await response.json();
      if (response.ok) {
        setRepaySuccess(`Repaid R ${numAmount.toFixed(2)} of outstanding credit. Credit score improved!`);
        setRepayAmount('');
        onUpdate();
      } else {
        setRepayError(data.error || 'Repayment failed.');
      }
    } catch (e) {
      setRepayError('Connection failure.');
    } finally {
      setIsRepaying(false);
    }
  };

  const handleTimeTravelSimulation = async () => {
    setRepayError('');
    setRepaySuccess('');
    setIsSimulatingTime(true);
    try {
      const response = await fetch('/api/simulation/timetravel', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      const data = await response.json();
      if (response.ok) {
        if (data.interestAccrued > 0) {
          setRepayError(`Billing Cycle Jump: R ${data.interestAccrued.toFixed(2)} penalty interest charged to outstanding credit.`);
        } else {
          setRepaySuccess('Time Cycle Simulated: 30 days of billing checks complete. Budgets reset!');
        }
        onUpdate();
      }
    } catch (e) {
      setRepayError('Time travel simulation failed.');
    } finally {
      setIsSimulatingTime(false);
    }
  };

  return (
    <div className="space-y-6" id="subscriptions-panel">
      {/* Time Travel and Interest Overdraft Warning */}
      {wallet && wallet.creditOwed > 0 && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-amber-50 border border-amber-200 rounded-3xl p-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 shadow-sm"
        >
          <div className="flex gap-3">
            <AlertTriangle className="w-6 h-6 text-amber-600 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <h4 className="text-xs font-bold text-amber-950 uppercase tracking-wide">Credit Line Overdraft Detected</h4>
              <p className="text-xs text-amber-700 font-sans leading-relaxed">
                Panda Backup Syndicate covered your missed payments. You owe outstanding credit of <strong>R {wallet.creditOwed.toFixed(2)}</strong>. 
                <span className="block font-semibold mt-0.5">Interest warning: Unpaid credit lines accumulate 10% penalty interest every 30-day billing cycle!</span>
              </p>
            </div>
          </div>
          
          <button
            onClick={handleTimeTravelSimulation}
            disabled={isSimulatingTime}
            className="flex items-center gap-1.5 px-3 py-2 bg-amber-600 hover:bg-amber-700 text-white font-bold text-[10px] rounded-xl transition cursor-pointer shrink-0 uppercase tracking-wider disabled:bg-slate-200"
          >
            <Flame className="w-3.5 h-3.5 animate-bounce" /> Simulate 30-Day Billing
          </button>
        </motion.div>
      )}

      {/* Credit Repayment Module */}
      {wallet && wallet.creditOwed > 0 && (
        <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-4">
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5 font-sans">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" /> Repay Outstanding Backup Debt
          </h4>

          <form onSubmit={handleRepayCredit} className="flex flex-col md:flex-row gap-3">
            <div className="relative flex-1">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-xs">R</span>
              <input
                type="number"
                value={repayAmount}
                onChange={(e) => setRepayAmount(e.target.value)}
                className="w-full bg-slate-55 border border-slate-200 rounded-xl pl-8 pr-4 py-2.5 text-xs text-slate-850 placeholder-slate-400 focus:outline-none focus:border-peach-500 font-medium"
                placeholder="Repayment amount (ZAR)"
                min="1"
                step="any"
                disabled={isRepaying}
              />
            </div>
            <button
              type="submit"
              disabled={isRepaying || !repayAmount}
              className="px-6 py-2.5 bg-peach-600 hover:bg-peach-700 disabled:bg-slate-100 disabled:text-slate-400 text-white font-bold text-xs rounded-xl transition cursor-pointer"
            >
              Repay Debt
            </button>
          </form>

          {repayError && <div className="text-[11px] text-rose-600 bg-rose-50 border border-rose-100 p-2.5 rounded-lg font-semibold flex items-center gap-1.5"><AlertCircle className="w-3.5 h-3.5 shrink-0" />{repayError}</div>}
          {repaySuccess && <div className="text-[11px] text-emerald-600 bg-emerald-55 border border-emerald-100 p-2.5 rounded-lg font-semibold flex items-center gap-1.5"><ShieldCheck className="w-3.5 h-3.5 shrink-0" />{repaySuccess}</div>}
        </div>
      )}

      {/* Main Subscriptions List Card */}
      <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-6">
        <div className="flex justify-between items-center border-b border-slate-100 pb-4">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-peach-50 text-peach-700 rounded-2xl">
              <CreditCard className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-800">Recurring Payments</h3>
              <p className="text-xs text-slate-500 font-sans">Automated recurring billing contracts signed with merchants via Interledger Open Payments.</p>
            </div>
          </div>

          <button
            onClick={() => setShowAddForm(!showAddForm)}
            className="flex items-center gap-1 py-2 px-3 bg-peach-600 hover:bg-peach-700 text-white font-bold text-[10px] uppercase rounded-xl transition cursor-pointer tracking-wider"
          >
            <Plus className="w-3.5 h-3.5" /> New Contract
          </button>
        </div>

        {error && <div className="text-xs text-rose-600 bg-rose-50 border border-rose-100 p-3 rounded-xl font-semibold flex items-center gap-1.5"><AlertCircle className="w-4 h-4 shrink-0" />{error}</div>}
        {success && <div className="text-xs text-emerald-600 bg-emerald-55 border border-emerald-100 p-3 rounded-xl font-semibold flex items-center gap-1.5"><ShieldCheck className="w-4 h-4 shrink-0" />{success}</div>}

        {/* Create subscription form */}
        {showAddForm && (
          <motion.form
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            onSubmit={handleCreateSubscription}
            className="p-5 bg-slate-50 border border-slate-200 rounded-2xl space-y-4"
          >
            <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">Setup Recurring Payment Contract</h4>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-500 uppercase">Merchant Name</label>
                <input
                  type="text"
                  value={merchantName}
                  onChange={(e) => setMerchantName(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-peach-500"
                  placeholder="e.g. Netflix Premium"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-500 uppercase">Merchant Payment Pointer</label>
                <input
                  type="text"
                  value={pointer}
                  onChange={(e) => setPointer(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-peach-500 font-mono"
                  placeholder="e.g. $netflix"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-500 uppercase">Billing Amount (ZAR)</label>
                <input
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-peach-500"
                  placeholder="e.g. 159.00"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-500 uppercase">Billing Frequency</label>
                <select
                  value={frequency}
                  onChange={(e: any) => setFrequency(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-peach-500 cursor-pointer"
                >
                  <option value="daily">Daily</option>
                  <option value="weekly">Weekly</option>
                  <option value="monthly">Monthly</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-500 uppercase">Category</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-peach-500 cursor-pointer"
                >
                  <option value="Tech & subscriptions">Tech & subscriptions</option>
                  <option value="Food & groceries">Food & groceries</option>
                  <option value="Transport">Transport</option>
                  <option value="General">General</option>
                </select>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowAddForm(false)}
                className="px-4 py-2 border border-slate-200 hover:bg-slate-100 text-xs font-bold rounded-xl transition cursor-pointer text-slate-600"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2 bg-peach-600 hover:bg-peach-700 text-white text-xs font-bold rounded-xl transition cursor-pointer"
              >
                Sign Contract
              </button>
            </div>
          </motion.form>
        )}

        {/* Subscriptions List Grid */}
        <div className="space-y-4">
          {subscriptions.length === 0 ? (
            <div className="text-center py-8 text-xs text-slate-400 font-sans">
              No active recurring payments or subscription contracts. Click 'New Contract' to add one.
            </div>
          ) : (
            subscriptions.map((sub) => {
              const formattedAmt = new Intl.NumberFormat('en-ZA', { style: 'currency', currency: sub.currency }).format(sub.amount);
              return (
                <div 
                  key={sub.id} 
                  className={`border rounded-2xl p-5 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 transition hover:shadow-xs ${
                    sub.status === 'backed_up' 
                      ? 'border-amber-200 bg-amber-50/10' 
                      : 'border-slate-150 bg-white hover:border-slate-350'
                  }`}
                >
                  <div className="flex gap-4">
                    <div className={`p-3 rounded-xl shrink-0 ${
                      sub.status === 'backed_up' ? 'bg-amber-100 text-amber-700' : 'bg-slate-50 text-slate-600'
                    }`}>
                      <CreditCard className="w-5 h-5" />
                    </div>
                    <div className="space-y-0.5">
                      <h4 className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                        {sub.merchantName}
                        {sub.status === 'backed_up' && (
                          <span className="inline-block text-[9px] px-1.5 py-0.5 bg-amber-500 text-white rounded-full font-bold uppercase tracking-wider">
                            Backed Up (Overdue)
                          </span>
                        )}
                      </h4>
                      <p className="text-[10px] text-slate-450 font-mono select-all">{sub.pointer}</p>
                      <div className="flex items-center gap-3 text-[10px] text-slate-400 mt-1 font-sans">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3.5 h-3.5" /> Next: {new Date(sub.nextPaymentDate).toLocaleDateString()}
                        </span>
                        <span className="uppercase font-mono bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded text-[8px] font-bold">
                          {sub.frequency}
                        </span>
                        <span className="uppercase font-mono bg-peach-50 text-peach-750 px-1.5 py-0.5 rounded text-[8px] font-bold">
                          {sub.category}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between md:justify-end gap-4 w-full md:w-auto pt-4 md:pt-0 border-t md:border-t-0 border-slate-100">
                    <div className="text-right">
                      <p className="text-base font-black text-slate-800">{formattedAmt}</p>
                      <p className="text-[9px] text-slate-400 uppercase tracking-widest font-mono">Collect Charge</p>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleProcessSubscription(sub.id)}
                        disabled={isLoading}
                        className="p-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-600 rounded-xl transition cursor-pointer flex items-center gap-1.5 font-bold text-[10px] uppercase border border-emerald-100"
                        title="Simulate Payment Collection (Processes the recurring pointer charge)"
                      >
                        <PlayCircle className="w-4 h-4" /> Trigger Payment
                      </button>
                      
                      <button
                        onClick={() => handleDeleteSubscription(sub.id)}
                        className="p-2 hover:bg-rose-50 text-slate-400 hover:text-rose-600 rounded-xl transition cursor-pointer border border-slate-100 hover:border-rose-100"
                        title="Cancel Recurring Contract"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
