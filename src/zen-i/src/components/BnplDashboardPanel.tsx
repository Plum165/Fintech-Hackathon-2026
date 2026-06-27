import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  CreditCard, Calendar, ShoppingBag, CheckCircle, Clock,
  ChevronDown, ChevronUp, ArrowRight, ArrowLeft, Plus, Minus,
  Percent, ShieldCheck, AlertCircle, Sparkles, Loader2, RefreshCw,
  ExternalLink, Wallet
} from 'lucide-react';
import Mascot from './Mascot';
import { Wallet as WalletType, BnplContract } from '../types';

interface BnplPrefill {
  merchantName?: string;
  merchantPointer?: string;
  itemDescription?: string;
  amount?: string;
  splits?: number;
}

interface BnplDashboardPanelProps {
  wallet: WalletType | null;
  token: string | null;
  onUpdate: () => void;
  prefill?: BnplPrefill | null;
}

interface PendingBnplApproval {
  contractId: string;
  approvalUrl: string;
  continueUri: string;
  continueToken: string;
  quoteId: string;
  installmentAmount: number;
  isSimulation: boolean;
}

export default function BnplDashboardPanel({ wallet, token, onUpdate, prefill }: BnplDashboardPanelProps) {
  const [activeSubTab, setActiveSubTab] = useState<'my-plans' | 'new-checkout'>('my-plans');
  const [contracts, setContracts] = useState<BnplContract[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [expandedContractId, setExpandedContractId] = useState<string | null>(null);

  // New Checkout Form state
  const [step, setStep] = useState(1);
  const [selectedMerchant, setSelectedMerchant] = useState('Takealot Tech');
  const [customMerchant, setCustomMerchant] = useState('');
  const [merchantPointer, setMerchantPointer] = useState('');
  const [itemDescription, setItemDescription] = useState('');
  const [purchaseAmount, setPurchaseAmount] = useState('1200');
  const [totalInstallments, setTotalInstallments] = useState(3);
  const [electronicSignature, setElectronicSignature] = useState('');
  const [consentChecked, setConsentChecked] = useState(false);

  // ILP approval state (after checkout initiates interactive grant)
  const [pendingApproval, setPendingApproval] = useState<PendingBnplApproval | null>(null);

  // Apply prefill from QR scan
  useEffect(() => {
    if (!prefill) return;
    if (prefill.merchantName) {
      setSelectedMerchant('Custom');
      setCustomMerchant(prefill.merchantName);
    }
    if (prefill.merchantPointer) setMerchantPointer(prefill.merchantPointer);
    if (prefill.itemDescription) setItemDescription(prefill.itemDescription);
    if (prefill.amount) setPurchaseAmount(prefill.amount);
    if (prefill.splits) setTotalInstallments(prefill.splits);
    setActiveSubTab('new-checkout');
    setStep(1);
  }, [prefill]);

  // Load contracts
  const loadContracts = async () => {
    if (!token) return;
    setIsLoading(true);
    setError('');
    try {
      const response = await fetch('/api/bnpl/contracts', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      if (response.ok) {
        setContracts(data.contracts || []);
      } else {
        setError(data.error || 'Failed to load split-payment contracts.');
      }
    } catch {
      setError('Connection failure loading plans.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { loadContracts(); }, [token]);

  const toggleExpand = (id: string) => {
    setExpandedContractId(expandedContractId === id ? null : id);
  };

  const handleRepay = async (contractId: string, installmentId: string) => {
    if (!token) return;
    setIsLoading(true);
    setError('');
    setSuccessMsg('');
    try {
      const response = await fetch(`/api/bnpl/repay/${contractId}/${installmentId}`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      if (response.ok) {
        setSuccessMsg('Installment successfully repaid!');
        await loadContracts();
        onUpdate();
      } else {
        setError(data.error || 'Repayment failed.');
      }
    } catch {
      setError('Connection failure during repayment.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateCheckout = async () => {
    if (!token) return;
    if (!consentChecked) {
      setError('Please agree to the Interledger terms and compliance signature.');
      return;
    }
    if (!electronicSignature.trim()) {
      setError('Electronic signature is required to confirm the installment agreement.');
      return;
    }

    const merchant = selectedMerchant === 'Custom' ? customMerchant.trim() : selectedMerchant;
    if (!merchant) {
      setError('Please specify a merchant name.');
      return;
    }

    setIsLoading(true);
    setError('');
    setSuccessMsg('');
    try {
      const response = await fetch('/api/bnpl/checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          merchantName: merchant,
          purchaseAmount: parseFloat(purchaseAmount),
          totalInstallments,
          merchantPointer: merchantPointer.trim() || undefined
        })
      });
      const data = await response.json();
      if (response.ok) {
        if (data.pendingApproval) {
          // ILP interactive grant — need wallet approval
          setPendingApproval({
            contractId: data.contract.id,
            approvalUrl: data.approvalUrl,
            continueUri: data.continueUri,
            continueToken: data.continueToken,
            quoteId: data.quoteId,
            installmentAmount: data.installmentAmount,
            isSimulation: data.isSimulation
          });
          setStep(4); // approval step
        } else {
          // Local payment — immediate success
          setSuccessMsg(`Instant approval! Initial split payment of R ${((parseFloat(purchaseAmount) / totalInstallments)).toFixed(2)} charged upfront.`);
          setStep(5);
          onUpdate();
        }
      } else {
        setError(data.error || 'Split-payment approval failed.');
      }
    } catch {
      setError('Connection failure on checkout.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleExecuteApproval = async () => {
    if (!token || !pendingApproval) return;
    setIsLoading(true);
    setError('');
    try {
      const response = await fetch('/api/bnpl/execute', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          contractId: pendingApproval.contractId,
          continueUri: pendingApproval.continueUri,
          continueToken: pendingApproval.continueToken,
          quoteId: pendingApproval.quoteId,
          installmentAmount: pendingApproval.installmentAmount
        })
      });
      const data = await response.json();
      if (response.ok && data.success) {
        setSuccessMsg(`Payment sent via Interledger! First installment of R ${pendingApproval.installmentAmount.toFixed(2)} delivered to merchant.`);
        setStep(5);
        onUpdate();
      } else {
        setError(data.error || 'Payment execution failed. If you approved in your wallet, try again in a moment.');
      }
    } catch {
      setError('Connection failure during payment execution.');
    } finally {
      setIsLoading(false);
    }
  };

  const nextStep = () => {
    setError('');
    if (step === 1) {
      const amt = parseFloat(purchaseAmount);
      if (isNaN(amt) || amt < 150) {
        setError('Minimum purchase amount for BNPL splits is R 150.00.');
        return;
      }
      if (!itemDescription.trim()) {
        setError('Please enter item details or purchase descriptions.');
        return;
      }
    }
    setStep(step + 1);
  };

  const prevStep = () => { setError(''); setStep(step - 1); };

  const resetCheckoutForm = () => {
    setStep(1);
    setItemDescription('');
    setPurchaseAmount('1200');
    setTotalInstallments(3);
    setElectronicSignature('');
    setConsentChecked(false);
    setSuccessMsg('');
    setError('');
    setPendingApproval(null);
    setMerchantPointer('');
    setActiveSubTab('my-plans');
    loadContracts();
  };

  const parsedAmt = parseFloat(purchaseAmount) || 0;
  const singleSplit = parsedAmt / totalInstallments;

  const activeContracts = contracts.filter(c => c.status === 'active');
  const totalPurchaseValue = contracts.reduce((sum, c) => sum + c.purchaseAmount, 0);
  const totalRemainingDebt = contracts.reduce((sum, c) => sum + c.remainingAmount, 0);

  // Identify next upcoming payment across all contracts
  const getNextUpcomingPayment = () => {
    const unpaid: { installment: BnplInstallment; contract: BnplContract }[] = [];
    contracts.forEach(contract => {
      contract.installments.forEach(inst => {
        if (inst.status === 'pending' || inst.status === 'overdue') {
          unpaid.push({ installment: inst, contract });
        }
      });
    });

    if (unpaid.length === 0) return null;

    // Sort by due date ascending
    unpaid.sort((a, b) => new Date(a.installment.dueDate).getTime() - new Date(b.installment.dueDate).getTime());
    return unpaid[0];
  };

  const getDaysRemainingText = (dueDateString: string) => {
    const due = new Date(dueDateString);
    const now = new Date();
    
    // Strip hours for pure calendar date comparison
    due.setHours(0,0,0,0);
    now.setHours(0,0,0,0);
    
    const diffTime = due.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays < 0) {
      return { text: 'Overdue!', className: 'text-rose-700 bg-rose-50 border-rose-100 font-bold' };
    } else if (diffDays === 0) {
      return { text: 'Due today!', className: 'text-amber-700 bg-amber-50 border-amber-100 font-bold animate-pulse' };
    } else if (diffDays === 1) {
      return { text: 'Due tomorrow', className: 'text-amber-700 bg-amber-50 border-amber-100 font-medium' };
    } else {
      return { text: `Due in ${diffDays} days`, className: 'text-slate-500 bg-slate-50 border-slate-100' };
    }
  };

  const nextUpcoming = getNextUpcomingPayment();

  return (
    <div id="bnpl-dashboard-panel" className="space-y-6">
      {/* Intro Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-200">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 flex items-center justify-center text-emerald-700 shrink-0">
            <Percent className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
              Zen-i BNPL Splits <span className="text-[10px] bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full uppercase tracking-wider font-bold">Interest-Free</span>
            </h2>
            <p className="text-xs text-slate-500 leading-relaxed font-sans">
              Buy now, pay later! Split your purchases into 3 or 4 interest-free installments, settled automatically using secure Interledger Open Payments.
            </p>
          </div>
        </div>
        <Mascot
          state={error ? 'warning' : successMsg ? 'happy' : 'idle'}
          message={error || successMsg || "Zen: Keep your installments on track to raise your financial credit confidence!"}
          size="sm"
        />
      </div>

      {/* Sub Tabs */}
      <div className="flex border-b border-slate-200">
        <button
          onClick={() => { setActiveSubTab('my-plans'); setError(''); setSuccessMsg(''); }}
          className={`px-5 py-3 text-xs font-bold transition flex items-center gap-2 border-b-2 cursor-pointer focus:outline-none ${
            activeSubTab === 'my-plans'
              ? 'border-emerald-600 text-slate-800'
              : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          <CreditCard className="w-4 h-4" /> My Split Plans ({contracts.length})
        </button>
        <button
          onClick={() => { setActiveSubTab('new-checkout'); setStep(1); setError(''); setSuccessMsg(''); }}
          className={`px-5 py-3 text-xs font-bold transition flex items-center gap-2 border-b-2 cursor-pointer focus:outline-none ${
            activeSubTab === 'new-checkout'
              ? 'border-emerald-600 text-slate-800'
              : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          <Plus className="w-4 h-4" /> Split Checkout Flow
        </button>
      </div>

      {/* Alerts */}
      {error && (
        <div role="alert" className="bg-rose-50 border border-rose-100 rounded-2xl p-4 flex items-start gap-2 text-xs text-rose-700 leading-relaxed">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      {successMsg && step !== 4 && (
        <div role="alert" className="bg-emerald-50 border border-emerald-100 rounded-2xl p-4 flex items-start gap-2 text-xs text-emerald-800 leading-relaxed">
          <CheckCircle className="w-4 h-4 shrink-0 mt-0.5" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* MY PLANS TAB */}
      {activeSubTab === 'my-plans' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-white border border-slate-200 rounded-2xl p-4 flex items-center justify-between">
              <div className="space-y-1">
                <span className="text-[10px] uppercase font-mono tracking-wider font-bold text-slate-400 block">Total Splits Value</span>
                <span className="text-xl font-bold text-slate-800 font-mono">{wallet?.currency} {totalPurchaseValue.toFixed(2)}</span>
              </div>
              <div className="bg-slate-50 p-2.5 rounded-xl text-slate-600"><ShoppingBag className="w-5 h-5" /></div>
            </div>
            <div className="bg-white border border-slate-200 rounded-2xl p-4 flex items-center justify-between">
              <div className="space-y-1">
                <span className="text-[10px] uppercase font-mono tracking-wider font-bold text-slate-400 block">Remaining Split Balance</span>
                <span className="text-xl font-bold text-emerald-800 font-mono">
                  {wallet?.currency} {totalRemainingDebt.toFixed(2)}
                </span>
              </div>
              <div className="bg-emerald-50 p-2.5 rounded-xl text-emerald-700">
                <CreditCard className="w-5 h-5" />
              </div>
            </div>

            <div className="bg-white border border-slate-200 rounded-2xl p-4 flex items-center justify-between">
              <div className="space-y-1">
                <span className="text-[10px] uppercase font-mono tracking-wider font-bold text-slate-400 block">Active Split Plans</span>
                <span className="text-xl font-bold text-emerald-700 font-mono">
                  {activeContracts.length} Plan{activeContracts.length === 1 ? '' : 's'}
                </span>
              </div>
              <div className="bg-emerald-50 p-2.5 rounded-xl text-emerald-700">
                <ShieldCheck className="w-5 h-5" />
              </div>
            </div>
          </div>

          {/* NEXT UPCOMING PAYMENT ALERT SECTION */}
          <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-xs relative overflow-hidden">
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
              <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider font-sans flex items-center gap-1.5">
                <Calendar className="w-4 h-4 text-emerald-600" /> Next Upcoming Split Payment
              </h3>
              <span className="text-[9px] font-mono text-slate-400 font-bold uppercase bg-slate-50 border border-slate-200 rounded px-1.5 py-0.5">
                Queue status
              </span>
            </div>

            {nextUpcoming ? (
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-emerald-50/30 border border-emerald-100/50 rounded-2xl p-4">
                <div className="flex items-start gap-3.5">
                  <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold text-xs shrink-0 select-none">
                    {nextUpcoming.contract.merchantName.substring(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="text-sm font-bold text-slate-800">{nextUpcoming.contract.merchantName}</h4>
                      <span className={`text-[10px] px-2 py-0.5 rounded-full border ${getDaysRemainingText(nextUpcoming.installment.dueDate).className}`}>
                        {getDaysRemainingText(nextUpcoming.installment.dueDate).text}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 mt-1">
                      Installment {nextUpcoming.installment.installmentNumber} of {nextUpcoming.contract.totalInstallments} • Due {new Date(nextUpcoming.installment.dueDate).toLocaleDateString()}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3.5 justify-between sm:justify-end border-t sm:border-t-0 pt-3 sm:pt-0 border-slate-100">
                  <div className="text-left sm:text-right font-mono">
                    <span className="text-slate-450 text-[9px] uppercase tracking-wider block">Due Amount</span>
                    <span className="text-sm font-bold text-slate-800">
                      R {nextUpcoming.installment.amount.toFixed(2)}
                    </span>
                  </div>

                  <button
                    onClick={() => handleRepay(nextUpcoming.contract.id, nextUpcoming.installment.id)}
                    disabled={isLoading}
                    className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-200 disabled:text-slate-450 text-white font-bold rounded-xl text-xs transition cursor-pointer flex items-center gap-1.5 shadow-xs min-h-[40px]"
                  >
                    {isLoading ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <>
                        <CreditCard className="w-3.5 h-3.5" /> Repay Now
                      </>
                    )}
                  </button>
                </div>
              </div>
            ) : (
              <div className="text-center py-6 bg-slate-50 border border-dashed border-slate-200 rounded-2xl flex flex-col items-center justify-center gap-1">
                <span className="text-2xl">🌱</span>
                <p className="text-xs font-semibold text-slate-700">All Caught Up!</p>
                <p className="text-[10px] text-slate-400">You have no pending or overdue split installments due next.</p>
              </div>
            )}
          </div>

          {/* List of active/inactive contracts */}
          <div className="bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-xs">
            <div className="px-5 py-4 border-b border-slate-150 flex items-center justify-between">
              <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider font-sans">Active BNPL Installment Contracts</h3>
              <button 
                onClick={loadContracts} 
                disabled={isLoading}
                className="p-1.5 hover:bg-slate-50 rounded-lg text-slate-400 hover:text-slate-700 transition cursor-pointer"
                title="Refresh Plans"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
              </button>
            </div>

            {contracts.length === 0 ? (
              <div className="text-center py-12 px-4 space-y-3">
                <span className="text-4xl">🛍️</span>
                <p className="text-xs text-slate-500 max-w-sm mx-auto leading-relaxed">
                  No active Buy Now, Pay Later plans. Select <strong>Split Checkout Flow</strong> to purchase in interest-free installments!
                </p>
                <button
                  onClick={() => { setActiveSubTab('new-checkout'); setStep(1); }}
                  className="px-4 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl transition cursor-pointer min-h-[44px]"
                >
                  Start First Split Plan
                </button>
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {contracts.map((contract) => {
                  const isExpanded = expandedContractId === contract.id;
                  const paidInstallmentsCount = contract.installments.filter(i => i.status === 'paid').length;
                  return (
                    <div key={contract.id} className="transition hover:bg-slate-50/50">
                      <div onClick={() => toggleExpand(contract.id)} className="p-5 flex items-center justify-between gap-4 cursor-pointer">
                        <div className="flex items-center gap-3.5">
                          <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-600 font-bold font-sans text-xs select-none">
                            {contract.merchantName.substring(0, 2).toUpperCase()}
                          </div>
                          <div>
                            <h4 className="text-xs font-bold text-slate-850">{contract.merchantName}</h4>
                            <div className="flex items-center gap-2 mt-1">
                              <span className="text-[10px] text-slate-450 font-sans">Opened: {new Date(contract.createdAt).toLocaleDateString()}</span>
                              <span className="w-1 h-1 rounded-full bg-slate-300"></span>
                              <span className="text-[10px] font-bold font-mono text-emerald-600">{paidInstallmentsCount} of {contract.totalInstallments} paid</span>
                              {contract.merchantPointer && (
                                <span className="text-[9px] bg-violet-50 text-violet-700 border border-violet-100 px-1.5 py-0.5 rounded font-mono">ILP</span>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                          <div className="text-right">
                            <span className="text-xs font-bold text-slate-800 font-mono block">{contract.currency} {contract.purchaseAmount.toFixed(2)}</span>
                            <span className="text-[10px] text-slate-400 font-sans">
                              {contract.status === 'completed' ? (
                                <span className="text-emerald-600 font-bold uppercase tracking-wider text-[9px] bg-emerald-50 px-1.5 py-0.5 rounded-md">Paid Off</span>
                              ) : contract.status === 'pending' ? (
                                <span className="text-amber-600 font-bold uppercase tracking-wider text-[9px] bg-amber-50 px-1.5 py-0.5 rounded-md">Awaiting Approval</span>
                              ) : (
                                `Owes ${contract.currency} ${contract.remainingAmount.toFixed(2)}`
                              )}
                            </span>
                          </div>
                          <div>{isExpanded ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}</div>
                        </div>
                      </div>

                      <AnimatePresence>
                        {isExpanded && (
                          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="bg-slate-50 border-t border-slate-100 overflow-hidden">
                            <div className="px-5 py-4 space-y-3">
                              <div className="flex items-center justify-between text-[10px] uppercase tracking-wider font-mono font-bold text-slate-400">
                                <span>Installment Schedule</span>
                                <span>Action / Status</span>
                              </div>
                              <div className="space-y-2">
                                {contract.installments.map((inst) => {
                                  return (
                                    <div 
                                      key={inst.id}
                                      className="flex items-center justify-between bg-white border border-slate-150 p-3 rounded-xl shadow-2xs"
                                    >
                                      <div className="flex items-center gap-3">
                                        <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold ${
                                          inst.status === 'paid' 
                                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' 
                                            : 'bg-slate-100 text-slate-600'
                                        }`}>
                                          {inst.installmentNumber}
                                        </div>
                                        <div>
                                          <div className="text-xs font-bold text-slate-800 font-mono">
                                            {contract.currency} {inst.amount.toFixed(2)}
                                          </div>
                                          <div className="text-[9px] text-slate-450 flex items-center gap-1.5 mt-0.5">
                                            <Calendar className="w-3 h-3" />
                                            <span>
                                              Due: {new Date(inst.dueDate).toLocaleDateString()}
                                            </span>
                                            {inst.status === 'paid' && inst.paidAt && (
                                              <span className="text-emerald-600 font-bold">
                                                (Paid: {new Date(inst.paidAt).toLocaleDateString()})
                                              </span>
                                            )}
                                          </div>
                                        </div>
                                      </div>

                                      <div>
                                        {inst.status === 'paid' ? (
                                          <span className="text-[10px] font-bold text-emerald-600 flex items-center gap-1 bg-emerald-50 border border-emerald-100 px-2 py-1 rounded-xl select-none">
                                            <CheckCircle className="w-3.5 h-3.5" /> Settled
                                          </span>
                                        ) : (
                                          <button
                                            onClick={() => handleRepay(contract.id, inst.id)}
                                            disabled={isLoading}
                                            className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-200 disabled:text-slate-450 text-white font-bold rounded-lg text-[10px] uppercase tracking-wide transition cursor-pointer flex items-center gap-1 min-h-[32px] focus:outline-none focus:ring-2 focus:ring-emerald-500"
                                          >
                                            {isLoading ? (
                                              <Loader2 className="w-3 h-3 animate-spin" />
                                            ) : (
                                              'Pay Now'
                                            )}
                                          </button>
                                        )}
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                              {contract.status === 'active' && (
                                <div className="p-3 bg-blue-50/50 border border-blue-100 rounded-xl flex gap-2 text-[10px] leading-relaxed text-blue-800">
                                  <Clock className="w-4 h-4 shrink-0 text-blue-600 mt-0.5" />
                                  <span>Installments will automatically be charged from your main wallet balance of <strong>R {wallet?.balance.toFixed(2)}</strong> on the respective due dates.</span>
                                </div>
                              )}
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* NEW CHECKOUT TAB */}
      {activeSubTab === 'new-checkout' && (
        <div className="max-w-xl mx-auto bg-white border border-slate-200 rounded-3xl p-6 md:p-8 shadow-xs space-y-6">
          {/* Progress timeline — 5 steps now */}
          <div className="flex items-center justify-between pb-4 border-b border-slate-100">
            {[1, 2, 3, 4, 5].map((s) => {
              const isActive = step >= s;
              const isCurrent = step === s;
              const labels = ['Merchant', 'Schedule', 'Sign', 'Approve', 'Done'];
              return (
                <React.Fragment key={s}>
                  <div className="flex flex-col items-center gap-1.5">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold border transition ${
                      isCurrent 
                        ? 'bg-emerald-600 text-white border-emerald-600 shadow-md ring-4 ring-emerald-100'
                        : isActive
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                          : 'bg-slate-50 text-slate-400 border-slate-200'
                    }`}>
                      {s < step ? <CheckCircle className="w-3.5 h-3.5" /> : s}
                    </div>
                    <span className={`text-[10px] font-bold ${
                      isCurrent ? 'text-emerald-800' : isActive ? 'text-emerald-700' : 'text-slate-400'
                    }`}>
                      {s === 1 ? 'Merchant' : s === 2 ? 'Schedule' : s === 3 ? 'Sign Contract' : 'Activated'}
                    </span>
                  </div>
                  {s < 5 && <div className={`h-0.5 flex-1 mx-1 rounded-full transition ${step > s ? 'bg-emerald-200' : 'bg-slate-100'}`} />}
                </React.Fragment>
              );
            })}
          </div>

          {/* STEP 1: MERCHANT + AMOUNT */}
          {step === 1 && (
            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-4">
              <div className="text-center space-y-1">
                <h3 className="text-sm font-bold text-slate-850">Split Checkout: Merchant Selection</h3>
                {prefill?.merchantName && (
                  <div className="inline-flex items-center gap-1.5 text-[10px] bg-violet-50 text-violet-700 border border-violet-100 px-3 py-1.5 rounded-full font-bold">
                    <Wallet className="w-3 h-3" /> Pre-filled from merchant QR code
                  </div>
                )}
              </div>

              <div className="space-y-1.5">
                <label className="text-xs text-slate-500 font-bold font-sans">Select Partner Merchant</label>
                <div className="grid grid-cols-2 gap-2.5">
                  {[
                    { name: 'Takealot Tech', logo: '💻' },
                    { name: 'Superbalist Fashion', logo: '👕' },
                    { name: 'Woolworths Home', logo: '🏡' },
                    { name: 'Custom', logo: '✨' }
                  ].map((m) => (
                    <button
                      key={m.name}
                      type="button"
                      onClick={() => setSelectedMerchant(m.name)}
                      className={`p-3.5 border rounded-2xl text-left flex items-center gap-2.5 transition cursor-pointer focus:outline-none ${
                        selectedMerchant === m.name 
                          ? 'bg-emerald-50 border-emerald-300 text-emerald-900 shadow-xs ring-2 ring-emerald-100/50' 
                          : 'bg-white border-slate-200 text-slate-700 hover:border-slate-300 hover:bg-slate-50'
                      }`}
                    >
                      <span className="text-lg">{m.logo}</span>
                      <span className="text-xs font-bold leading-none">{m.name}</span>
                    </button>
                  ))}
                </div>
              </div>

              {selectedMerchant === 'Custom' && (
                <div className="space-y-1.5">
                  <label className="text-xs text-slate-500 font-bold font-sans">Custom Merchant Name</label>
                  <input
                    type="text"
                    value={customMerchant}
                    onChange={(e) => setCustomMerchant(e.target.value)}
                    placeholder="Enter online store name (e.g. Zando)"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-xs focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition font-mono"
                  />
                </div>
              )}

              {/* Merchant ILP wallet pointer */}
              <div className="space-y-1.5">
                <label className="text-xs text-slate-500 font-bold font-sans">Merchant Wallet Pointer <span className="text-slate-400 font-normal">(optional — enables real ILP payment)</span></label>
                <input type="text" value={merchantPointer} onChange={e => setMerchantPointer(e.target.value)}
                  placeholder="$ilp.interledger-test.dev/merchantname"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-xs focus:outline-none focus:border-peach-500 focus:ring-1 focus:ring-peach-500 transition font-mono"
                />
                {merchantPointer && (
                  <p className="text-[10px] text-violet-600 font-sans">First installment will be sent via Interledger to this wallet.</p>
                )}
              </div>

              <div className="space-y-1.5">
                <label className="text-xs text-slate-500 font-bold font-sans">Items / Description</label>
                <input type="text" value={itemDescription} onChange={e => setItemDescription(e.target.value)}
                  placeholder="e.g. Leather Jacket & Sneakers"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition font-medium font-sans"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs text-slate-500 font-bold font-sans">Total Purchase Amount</label>
                <div className="flex rounded-xl bg-slate-50 border border-slate-200 focus-within:border-emerald-500 focus-within:ring-2 focus-within:ring-emerald-500/20 transition overflow-hidden">
                  <span className="bg-slate-100 text-slate-500 px-4 py-3 text-xs font-mono border-r border-slate-200 flex items-center font-bold">
                    {wallet?.currency}
                  </span>
                  <input
                    type="number"
                    value={purchaseAmount}
                    onChange={(e) => setPurchaseAmount(e.target.value)}
                    placeholder="1200.00"
                    className="w-full px-4 py-3 text-xs text-slate-800 font-mono bg-transparent focus:outline-none"
                  />
                </div>
                <div className="text-[10px] text-slate-450 leading-relaxed font-sans mt-1">
                  Zen-i Splits requires a minimum purchase checkout of R 150.00 up to a maximum of R 5,000.00.
                </div>
              </div>

              <button
                type="button"
                onClick={nextStep}
                className="w-full py-3.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs transition shadow-md flex items-center justify-center gap-1.5 cursor-pointer mt-4 min-h-[44px] focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                Continue to Payment Schedule <ArrowRight className="w-4 h-4" />
              </button>
            </motion.div>
          )}

          {/* STEP 2: SCHEDULE */}
          {step === 2 && (
            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-5">
              <div className="text-center space-y-1">
                <h3 className="text-sm font-bold text-slate-850">Select Splitting Terms</h3>
                <p className="text-xs text-slate-500 font-sans">Choose how many splits you prefer. All 100% interest-free.</p>
              </div>
              <div className="space-y-4">
                <span className="text-[10px] uppercase font-mono tracking-wider font-bold text-slate-450 block font-sans">Quick Term Presets</span>
                <div className="grid grid-cols-3 gap-3">
                  {[3, 4, 6].map((num) => (
                    <button
                      key={num}
                      type="button"
                      onClick={() => setTotalInstallments(num)}
                      className={`p-3 border rounded-xl text-center transition flex flex-col items-center gap-1 cursor-pointer focus:outline-none ${
                        totalInstallments === num
                          ? 'bg-emerald-50 border-emerald-300 text-emerald-900 shadow-xs ring-2 ring-emerald-100/50'
                          : 'bg-white border-slate-200 text-slate-700 hover:border-slate-300 hover:bg-slate-50'
                      }`}
                    >
                      <span className="text-xs font-bold block">{num} Splits</span>
                      <span className="text-[9px] font-mono text-slate-500 block">
                        R {(parsedAmt / num).toFixed(2)}
                      </span>
                    </button>
                  ))}
                </div>
                <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
                  <div>
                    <span className="text-xs font-bold text-slate-800 block">Customize Splits Range</span>
                    <span className="text-[10px] text-slate-450 font-sans">Select 2–12 installments</span>
                  </div>
                  <div className="flex items-center gap-3 bg-white border border-slate-200 rounded-xl p-1.5 shadow-xs">
                    <button type="button" disabled={totalInstallments <= 2} onClick={() => setTotalInstallments(p => Math.max(2, p - 1))} className="p-1.5 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-100 disabled:opacity-40 transition cursor-pointer">
                      <Minus className="w-4 h-4" />
                    </button>
                    <span className="text-sm font-black font-mono px-3 text-slate-800 text-center min-w-[3rem]">{totalInstallments} <span className="text-[10px] font-normal text-slate-400">splits</span></span>
                    <button type="button" disabled={totalInstallments >= 12} onClick={() => setTotalInstallments(p => Math.min(12, p + 1))} className="p-1.5 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-100 disabled:opacity-40 transition cursor-pointer">
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>

              <div className="border border-slate-150 rounded-2xl p-4 bg-slate-50 space-y-3.5 max-h-[220px] overflow-y-auto">
                <span className="text-[10px] uppercase font-mono tracking-wider font-bold text-slate-450 block sticky top-0 bg-slate-50 pb-1">Payment Schedule & Milestones ({totalInstallments} Splits)</span>
                
                <div className="space-y-4 relative pl-3.5 border-l border-emerald-300/60 ml-1.5">
                  {Array.from({ length: totalInstallments }).map((_, idx) => {
                    const splitIndex = idx + 1;
                    const isUpfront = splitIndex === 1;
                    const daysOffset = (splitIndex - 1) * 30;
                    return (
                      <div key={splitIndex} className="relative">
                        <span className={`absolute -left-[19px] top-1 w-2.5 h-2.5 rounded-full ${
                          isUpfront ? 'bg-emerald-600 ring-4 ring-emerald-100' : 'bg-slate-300'
                        }`} />
                        <div>
                          <div className="flex items-center justify-between font-sans">
                            <span className={`text-xs font-bold ${isUpfront ? 'text-slate-800' : 'text-slate-700'}`}>
                              Split {splitIndex} {isUpfront ? '(Upfront Pay Today)' : `(In ${daysOffset} Days)`}
                            </span>
                            <span className="text-xs font-bold text-slate-800 font-mono">R {singleSplit.toFixed(2)}</span>
                          </div>
                          <span className="text-[10px] block mt-0.5">
                            {isUpfront ? (
                              <span className="text-emerald-600 font-semibold font-sans">Charged immediately on approval</span>
                            ) : (
                              <span className="text-slate-400 font-sans">Due: {new Date(Date.now() + 3600000 * 24 * daysOffset).toLocaleDateString()}</span>
                            )}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="flex items-center justify-between gap-3 pt-2">
                <button
                  type="button"
                  onClick={prevStep}
                  className="w-1/3 py-3.5 text-slate-500 hover:text-slate-800 font-bold text-xs border border-slate-200 hover:bg-slate-50 rounded-xl transition cursor-pointer flex items-center justify-center gap-1 min-h-[44px] focus:outline-none focus:ring-2 focus:ring-slate-300"
                >
                  <ArrowLeft className="w-4 h-4" /> Back
                </button>
                <button
                  type="button"
                  onClick={nextStep}
                  className="flex-1 py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs transition shadow-md flex items-center justify-center gap-1.5 cursor-pointer min-h-[44px] focus:outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  Continue to Signature <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </motion.div>
          )}

          {/* STEP 3: SIGN */}
          {step === 3 && (
            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-4">
              <div className="text-center space-y-1">
                <h3 className="text-sm font-bold text-slate-850 flex items-center justify-center gap-1.5 text-emerald-850">
                  <ShieldCheck className="w-5 h-5 text-emerald-600" /> Sign Split Purchase Agreement
                </h3>
                <p className="text-xs text-slate-500 font-sans">Underwritten securely by the South African Interledger Syndicate.</p>
              </div>

              {/* Contract terms card */}
              <div className="p-4 border border-slate-150 bg-slate-50 rounded-2xl space-y-3 font-mono text-[10px] text-slate-600 max-h-[160px] overflow-y-auto leading-relaxed">
                <p className="font-bold text-slate-800 uppercase tracking-wider text-[9px] border-b border-slate-200 pb-1 flex items-center gap-1.5">
                  📄 INTERLEDGER OPEN PAYMENT COMPLIANCE CONTRACT
                </p>
                <p><strong>1. Purchase Splitting:</strong> The operator authorizes Zen-i to split the total checkout balance of R {parsedAmt.toFixed(2)} with {selectedMerchant === 'Custom' ? customMerchant : selectedMerchant}.</p>
                <p><strong>2. Immediate Collateral Debit:</strong> I consent to pay <strong>R {singleSplit.toFixed(2)}</strong> immediately upon final activation to cover Split 1.</p>
                <p><strong>3. Auto-Settle Milestones:</strong> Subsequent installments will be automatically settled from the operator's ledger balance on schedule. If balances are insufficient, outstanding elements will transition to fallback credit reserves with standard overdraft rates.</p>
                <p><strong>4. Credit Confidence:</strong> Timely payments increase financial confidence scores, opening savings pools and higher transaction allowances.</p>
              </div>

              <label className="flex items-start gap-2.5 p-1 cursor-pointer">
                <input
                  type="checkbox"
                  checked={consentChecked}
                  onChange={(e) => setConsentChecked(e.target.checked)}
                  className="mt-0.5 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 transition cursor-pointer focus:outline-none"
                />
                <span className="text-xs text-slate-500 font-sans leading-relaxed select-none">
                  I read, understood, and accept the Interledger compliant terms and payment splitting regulations.
                </span>
              </label>

              <div className="space-y-1.5">
                <label className="text-xs text-slate-500 font-bold font-sans">E-Signature Signature (Type Full Name)</label>
                <input
                  type="text"
                  value={electronicSignature}
                  onChange={(e) => setElectronicSignature(e.target.value)}
                  placeholder="e.g. Mikaeel Naidoo"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-xs text-slate-850 placeholder-slate-400 focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition font-mono"
                />
              </div>

              {/* Summary table */}
              <div className="bg-emerald-50/40 border border-emerald-100 p-3.5 rounded-xl text-xs space-y-1 font-sans">
                <div className="flex justify-between">
                  <span className="text-slate-500">Upfront Pay Today:</span>
                  <span className="font-bold text-slate-800 font-mono">R {singleSplit.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Total remaining splits:</span>
                  <span className="font-bold text-slate-800 font-mono">{totalInstallments - 1} Payments</span>
                </div>
                <div className="flex justify-between border-t border-emerald-200/50 pt-1.5 mt-1 text-emerald-950 font-bold">
                  <span>Future Splits Balance:</span>
                  <span className="font-mono">R {(parsedAmt - singleSplit).toFixed(2)}</span>
                </div>
              </div>

              <div className="flex items-center justify-between gap-3 pt-2">
                <button
                  type="button"
                  onClick={prevStep}
                  className="w-1/3 py-3.5 text-slate-500 hover:text-slate-800 font-bold text-xs border border-slate-200 hover:bg-slate-50 rounded-xl transition cursor-pointer min-h-[44px] focus:outline-none focus:ring-2 focus:ring-slate-300"
                >
                  Back
                </button>
                <button
                  type="button"
                  onClick={handleCreateCheckout}
                  disabled={isLoading}
                  className="flex-1 py-3.5 bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-200 disabled:text-slate-450 text-white font-bold rounded-xl text-xs transition shadow-md flex items-center justify-center gap-1.5 cursor-pointer min-h-[44px] focus:outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  {isLoading ? (
                    <><Loader2 className="w-4 h-4 animate-spin" /> Processing...</>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4 text-emerald-200" /> Sign & Pay Upfront
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          )}

          {/* STEP 4: APPROVE IN WALLET (ILP only) */}
          {step === 4 && pendingApproval && (
            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-5 text-center">
              <div className="space-y-2">
                <span className="text-4xl inline-block">🔐</span>
                <h3 className="text-sm font-bold text-slate-800">Approve Payment in Your Wallet</h3>
                <p className="text-xs text-slate-500 font-sans max-w-sm mx-auto leading-relaxed">
                  Your first installment of <strong className="text-slate-800 font-mono">R {singleSplit.toFixed(2)}</strong> will be sent via Interledger to <strong>{selectedMerchant === 'Custom' ? customMerchant : selectedMerchant}</strong>.
                  Open the link below to approve in your ILP wallet, then come back and click <strong>I've Approved</strong>.
                </p>
                {pendingApproval.isSimulation && (
                  <div className="inline-flex items-center gap-1.5 text-[10px] bg-amber-50 text-amber-700 border border-amber-100 px-3 py-1.5 rounded-full font-bold">
                    Simulation mode — click directly through
                  </div>
                )}
              </div>

              <a
                href={pendingApproval.approvalUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full py-3 bg-violet-600 hover:bg-violet-700 text-white font-bold rounded-xl text-xs transition shadow-md flex items-center justify-center gap-2 cursor-pointer"
              >
                <ExternalLink className="w-4 h-4" />
                {pendingApproval.isSimulation ? 'Open Wallet (Simulation)' : 'Approve in Your Wallet'}
              </a>

              <button
                type="button"
                onClick={handleExecuteApproval}
                disabled={isLoading}
                className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-200 disabled:text-slate-450 text-white font-bold rounded-xl text-xs transition shadow-md flex items-center justify-center gap-1.5 cursor-pointer"
              >
                {isLoading ? <><Loader2 className="w-4 h-4 animate-spin" /> Executing...</> : <><CheckCircle className="w-4 h-4" /> I've Approved — Execute Payment</>}
              </button>

              <p className="text-[10px] text-slate-400 font-sans">
                If you haven't approved yet, click above to open your wallet first.
              </p>
            </motion.div>
          )}

          {/* STEP 5: SUCCESS TICKET */}
          {step === 5 && (
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="text-center space-y-6">
              <div className="space-y-2">
                <span className="text-5xl inline-block animate-bounce">🐼🎉</span>
                <h3 className="text-lg font-bold text-emerald-800">Split Plan Activated Successfully!</h3>
                <p className="text-xs text-slate-500 font-sans max-w-sm mx-auto leading-relaxed">
                  Your purchase with <strong>{selectedMerchant === 'Custom' ? customMerchant : selectedMerchant}</strong> has been split. Initial installment settled!
                </p>
                {successMsg && (
                  <p className="text-xs text-emerald-700 font-bold">{successMsg}</p>
                )}
              </div>

              {/* Elegant Ticket Summary layout */}
              <div className="border border-dashed border-slate-300 bg-slate-50 rounded-3xl p-5 text-left text-xs space-y-3 relative overflow-hidden font-sans">
                <span className="absolute -left-3 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-white border-r border-slate-200" />
                <span className="absolute -right-3 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-white border-l border-slate-200" />
                <div className="flex justify-between text-[10px] uppercase font-mono tracking-widest text-slate-400 font-bold border-b border-slate-150 pb-2">
                  <span>Zen-i Splits Ticket</span>
                  <span className="text-emerald-700 font-bold">Approved</span>
                </div>
                <div className="grid grid-cols-2 gap-y-2.5 pt-1">
                  <div>
                    <span className="text-slate-400 block text-[9px] uppercase font-bold tracking-wider">Merchant Partner</span>
                    <span className="font-bold text-slate-800">{selectedMerchant === 'Custom' ? customMerchant : selectedMerchant}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[9px] uppercase font-bold tracking-wider">Plan Terms</span>
                    <span className="font-bold text-slate-800">{totalInstallments} Interest-Free Splits</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[9px] uppercase font-bold tracking-wider">Description</span>
                    <span className="font-bold text-slate-800">{itemDescription}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[9px] uppercase font-bold tracking-wider">Paid Upfront Today</span>
                    <span className="font-bold text-emerald-700 font-mono">R {singleSplit.toFixed(2)}</span>
                  </div>
                  {merchantPointer && (
                    <div className="col-span-2">
                      <span className="text-slate-400 block text-[9px] uppercase font-bold tracking-wider">Payment Method</span>
                      <span className="font-bold text-violet-700 font-mono text-[10px]">Interledger Open Payments → {merchantPointer}</span>
                    </div>
                  )}
                </div>
                <div className="pt-2 border-t border-dashed border-slate-200 flex justify-between items-center text-xs">
                  <span className="text-slate-500 font-bold">Compliant Electronic Signature:</span>
                  <span className="font-mono text-slate-850 font-bold italic">{electronicSignature}</span>
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="button"
                  onClick={resetCheckoutForm}
                  className="px-6 py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs transition shadow-md cursor-pointer min-h-[44px] focus:outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  Go to Split Dashboard
                </button>
              </div>
            </motion.div>
          )}
        </div>
      )}
    </div>
  );
}
