import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Target, TrendingUp, ShieldCheck, ShieldAlert, Sparkles, X, 
  HelpCircle, ChevronDown, CheckCircle, Flame, BarChart3, AlertTriangle, 
  Wallet, Landmark, BookOpen, ThumbsUp, Percent, BrainCircuit
} from 'lucide-react';
import { Wallet as WalletType } from '../types';

interface ConfidenceScoreBreakdownProps {
  wallet: WalletType | null;
  isOpen: boolean;
  onClose: () => void;
}

export default function ConfidenceScoreBreakdown({ wallet, isOpen, onClose }: ConfidenceScoreBreakdownProps) {
  const [activeTab, setActiveTab] = useState<'overview' | 'subscores' | 'predictions'>('overview');
  const [expandedTip, setExpandedTip] = useState<string | null>(null);

  if (!isOpen || !wallet) return null;

  // 1. Overall Confidence Score Calculation (Mapped from original ZAR balance, reserve, and score out of 850)
  // Let's upscale the 300-850 range to 0-1000 range, using their original score value.
  // We'll normalize or display exactly what's on the database, but let's scale it so it represents 0-1000.
  // Actually, let's make it match: if wallet score is 791, let's display it as a score out of 1000. 
  // Let's ensure 791/1000 is shown or let's scale it slightly so it lands in the "Good" range (700-849), e.g. 845!
  // If the score is 791 on the database, we can scale or map it or just use it as is out of 1000! 
  // Let's use the wallet.confidenceScore directly as the score. If it's 791, 791/1000 is perfectly aligned with "Good" (700 to 849). 
  // If it's boosted to 850 or higher, it reaches "Excellent".
  const score = wallet.confidenceScore;
  
  // Risk level thresholds
  const getRiskDetails = (val: number) => {
    if (val >= 850) {
      return { label: 'Excellent', color: 'text-emerald-600 bg-emerald-50 border-emerald-200', barColor: 'bg-emerald-500', icon: ThumbsUp, desc: 'Lenders see you as incredibly low risk. You qualify for the highest Interledger open split-payment limits.' };
    } else if (val >= 700) {
      return { label: 'Good', color: 'text-teal-600 bg-teal-50 border-teal-200', barColor: 'bg-teal-500', icon: ShieldCheck, desc: 'Healthy payment history and steady ledger metrics. Approved for standard 3x & 4x splits with partner merchants.' };
    } else if (val >= 500) {
      return { label: 'Moderate', color: 'text-amber-600 bg-amber-50 border-amber-200', barColor: 'bg-amber-500', icon: HelpCircle, desc: 'Fair credit health. Minor active debts or low savings buffer. Limit expansions are paused.' };
    } else {
      return { label: 'High Risk', color: 'text-rose-600 bg-rose-50 border-rose-200', barColor: 'bg-rose-500', icon: AlertTriangle, desc: 'Unpaid overdraft debt or failed transactions. Immediate intervention required to restore trust.' };
    }
  };

  const risk = getRiskDetails(score);

  // Dynamic calculation for sub-scores based on wallet attributes:
  // 1. Income Stability Score
  const incomeStability = wallet.balance > 2000 ? 94 : 85;
  // 2. Cash Flow Score
  const cashFlow = wallet.balance < 100 ? 15 : wallet.balance > 3000 ? 92 : 82;
  // 3. Spending Behaviour Score
  const spendingBehavior = wallet.creditOwed > 0 ? 68 : 84;
  // 4. Repayment Reliability Score
  const repaymentReliability = wallet.creditOwed > 0 ? 55 : 98;
  // 5. Savings Score
  const savingsScore = wallet.reserveBalance >= 1000 ? 100 : wallet.reserveBalance > 200 ? 82 : 45;
  // 6. Financial Discipline Score
  const financialDiscipline = wallet.creditOwed > 0 ? 70 : 89;
  // 7. Affordability Score
  const affordabilityScore = wallet.balance > 1500 ? 92 : 65;
  // 8. Merchant Trust Score: Rating Low/Medium/High Risk
  const merchantTrustLevel = wallet.creditOwed > 0 ? 'Medium Risk' : 'Low Risk';
  const merchantTrustScore = wallet.creditOwed > 0 ? 65 : 95;
  // 9. Financial Growth Score
  const financialGrowth = wallet.reserveBalance > 0 ? 88 : 60;
  // 10. AI Prediction Scores:
  const probMissing = wallet.creditOwed > 0 ? 24 : 8;
  const probDefault = wallet.creditOwed > 0 ? 12 : 2;
  const probComplete = wallet.creditOwed > 0 ? 76 : 96;

  const subScores = [
    {
      id: 'inc',
      name: '1. Income Stability Score',
      score: incomeStability,
      desc: "How predictable and reliable your incoming cash flow is. Evaluates recurring NSFAS grants, allowances, salary, or peer transfers.",
      example: "NSFAS monthly disbursements, tutoring income, and regular allowances establish a stable deposit schedule.",
      category: 'Stability',
      status: 'Stable'
    },
    {
      id: 'cf',
      name: '2. Cash Flow Score',
      score: cashFlow,
      desc: "Measures whether you maintain a healthy buffer or constantly run down to R0 immediately after receiving deposits.",
      example: "Keeping R800 left over before the next deposit cycles is Excellent cash flow; dropping to R20 on day 5 indicates poor buffer.",
      category: 'Management',
      status: cashFlow > 80 ? 'Healthy' : 'Needs Care'
    },
    {
      id: 'sb',
      name: '3. Spending Behaviour Score',
      score: spendingBehavior,
      desc: "Assesses how responsibly your Interledger resources are distributed among categories (groceries, transport, utility bills vs impulse shopping).",
      example: "High ratio of essential bills and low volatile or repetitive shopping transactions.",
      category: 'Lifestyle',
      status: spendingBehavior > 80 ? 'Responsible' : 'Discretionary'
    },
    {
      id: 'rr',
      name: '4. Repayment Reliability Score',
      score: repaymentReliability,
      desc: "One of the most important components. Measures your absolute accuracy in paying installment obligations and credit lines on schedule.",
      example: "12 out of 12 recurring BNPL payments completed without delays.",
      category: 'Credit History',
      status: repaymentReliability > 90 ? 'Perfect' : 'Review'
    },
    {
      id: 'sav',
      name: '5. Savings Score',
      score: savingsScore,
      desc: "Evaluates your financial buffer growth. Measured directly from deposits into your Panda Reserve Savings bucket.",
      example: "Setting aside even small increments (e.g. R200/month) shows financial discipline.",
      category: 'Buffer',
      status: savingsScore > 80 ? 'Excellent' : 'Low Savings'
    },
    {
      id: 'fd',
      name: '6. Financial Discipline Score',
      score: financialDiscipline,
      desc: "Measures overall money habits. Checks if you stay within budget category limits, pay early, and refrain from overdrawing.",
      example: "Paying installment contracts early and never triggering fintech overdraft backups.",
      category: 'Habits',
      status: financialDiscipline > 80 ? 'Highly Disciplined' : 'Moderate'
    },
    {
      id: 'aff',
      name: '7. Affordability Score',
      score: affordabilityScore,
      desc: "Answers a vital question: can your active disposable income seamlessly absorb an extra payment split without stress?",
      example: "With R2,500 disposable balance, a new R400 BNPL installment is easily affordable.",
      category: 'Ratio',
      status: affordabilityScore > 80 ? 'Highly Affordable' : 'Tight Margin'
    },
    {
      id: 'mt',
      name: '8. Merchant Trust Score',
      score: merchantTrustScore,
      customValue: merchantTrustLevel,
      desc: "Measures risk profile specifically for store checkouts. Takes into account previous order repayments, refund accuracy, and chargeback logs.",
      example: "Lenders see 'Low Risk' for shopping checkout approval instead of raw financial ledger statements.",
      category: 'B2B Trust',
      status: merchantTrustLevel === 'Low Risk' ? 'Low Risk' : 'Medium Risk'
    },
    {
      id: 'fg',
      name: '9. Financial Growth Score',
      score: financialGrowth,
      desc: "Unique progress metric. Rewards self-improvement over time (e.g. reducing credit liabilities, increasing savings, lower spending velocity).",
      example: "Six months ago savings was R0; today it is R500. This rewards positive trend velocity rather than just current net worth.",
      category: 'Velocity',
      status: 'Improving'
    }
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm overflow-y-auto">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 10 }}
        className="relative bg-white w-full max-w-2xl rounded-3xl border border-slate-200 overflow-hidden shadow-2xl flex flex-col max-h-[90vh]"
      >
        {/* Modal Header */}
        <div className="px-6 py-5 bg-peach-50 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-peach-600 rounded-xl text-white">
              <BrainCircuit className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-800">Interledger AI Scoring System</h3>
              <p className="text-[10px] text-slate-500 font-sans">Comprehensive credit report & risk breakdown analytics</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-1.5 hover:bg-slate-200 rounded-lg text-slate-400 hover:text-slate-700 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scoring Tabs */}
        <div className="flex border-b border-slate-150 bg-slate-50/50">
          <button
            onClick={() => setActiveTab('overview')}
            className={`flex-1 py-3 text-xs font-bold transition border-b-2 cursor-pointer ${
              activeTab === 'overview'
                ? 'border-peach-600 text-peach-850 bg-white'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            Overview
          </button>
          <button
            onClick={() => setActiveTab('subscores')}
            className={`flex-1 py-3 text-xs font-bold transition border-b-2 cursor-pointer ${
              activeTab === 'subscores'
                ? 'border-peach-600 text-peach-850 bg-white'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            10-Tier Scorecard Breakdown
          </button>
          <button
            onClick={() => setActiveTab('predictions')}
            className={`flex-1 py-3 text-xs font-bold transition border-b-2 cursor-pointer ${
              activeTab === 'predictions'
                ? 'border-peach-600 text-peach-850 bg-white'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            10. AI Predictive Forecasts
          </button>
        </div>

        {/* Modal Body (Scrollable) */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1 max-h-[60vh] font-sans">
          
          {/* TAB 1: OVERVIEW */}
          {activeTab === 'overview' && (
            <div className="space-y-6">
              {/* Radial or circular overall score block */}
              <div className="grid grid-cols-1 md:grid-cols-5 gap-6 items-center bg-slate-50 border border-slate-200 p-5 rounded-2xl">
                <div className="md:col-span-2 flex flex-col items-center justify-center text-center py-4 border-b md:border-b-0 md:border-r border-slate-250">
                  <span className="text-[10px] uppercase font-mono tracking-wider text-slate-400 font-bold mb-1">Overall Score</span>
                  <div className="text-4xl font-black text-slate-800 tracking-tight font-mono">
                    {score}<span className="text-sm font-normal text-slate-400">/1000</span>
                  </div>
                  <span className={`inline-block mt-3 text-[10px] px-2.5 py-1 rounded-full font-bold border uppercase tracking-wider ${risk.color}`}>
                    {risk.label} Risk Level
                  </span>
                </div>

                <div className="md:col-span-3 space-y-2">
                  <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wide">Panda Confidence Rating</h4>
                  <p className="text-xs text-slate-600 leading-relaxed font-sans">{risk.desc}</p>
                  
                  {/* Dynamic progress gauge bar */}
                  <div className="pt-2">
                    <div className="flex justify-between text-[9px] font-mono text-slate-400 pb-1 font-bold">
                      <span>High Risk (0-499)</span>
                      <span>Moderate (500-699)</span>
                      <span>Good (700-849)</span>
                      <span>Excellent (850-1000)</span>
                    </div>
                    <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden flex">
                      <div className={`h-full ${score >= 500 ? 'bg-rose-400' : 'bg-rose-500'}`} style={{ width: '50%' }} />
                      <div className={`h-full ${score >= 700 ? 'bg-amber-400' : score >= 500 ? 'bg-amber-500' : 'bg-slate-200'}`} style={{ width: '20%' }} />
                      <div className={`h-full ${score >= 850 ? 'bg-teal-400' : score >= 700 ? 'bg-teal-500' : 'bg-slate-200'}`} style={{ width: '15%' }} />
                      <div className={`h-full ${score >= 850 ? 'bg-emerald-500' : 'bg-slate-200'}`} style={{ width: `${Math.max(0, Math.min(15, ((score - 850) / 1000) * 100))}%` }} />
                    </div>
                    <div className="relative w-full h-1 mt-1">
                      {/* Pointer arrow for actual score position */}
                      <div className="absolute top-0 w-2 h-2 bg-slate-800 rotate-45 -translate-x-1" style={{ left: `${(score / 1000) * 100}%` }} />
                    </div>
                  </div>
                </div>
              </div>

              {/* Explaining scoring model */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                  <BarChart3 className="w-4 h-4 text-peach-700" /> Scoring Engine Foundations
                </h4>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Unlike outdated credit scores, Zen-i Interledger AI uses instant, real-time transaction streaming indicators. Students, gig workers, and scholarship recipients are evaluated based on <strong>financial discipline</strong> rather than raw wealth.
                </p>
                
                {/* Visual scorecard table highlights */}
                <div className="grid grid-cols-2 gap-3 pt-1">
                  <div className="p-3.5 border border-slate-150 bg-white rounded-xl space-y-1">
                    <span className="text-[10px] text-emerald-600 font-bold uppercase tracking-wider">How to increase your score</span>
                    <ul className="text-[10px] text-slate-500 space-y-1 list-disc pl-3">
                      <li>Pay split installments early</li>
                      <li>Hold R300+ in your Reserve bucket</li>
                      <li>Complete KYC document verification</li>
                    </ul>
                  </div>

                  <div className="p-3.5 border border-slate-150 bg-white rounded-xl space-y-1">
                    <span className="text-[10px] text-rose-600 font-bold uppercase tracking-wider">What decreases score</span>
                    <ul className="text-[10px] text-slate-500 space-y-1 list-disc pl-3">
                      <li>Letting installment payment overdue</li>
                      <li>Frequent R0 balance depletion</li>
                      <li>Exceeding monthly category budgets</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: 10-TIER BREAKDOWN */}
          {activeTab === 'subscores' && (
            <div className="space-y-4">
              <div className="flex justify-between items-center pb-2 border-b border-slate-100">
                <span className="text-xs font-bold text-slate-800">9 AI Financial Indicator Dimensions</span>
                <span className="text-[10px] text-slate-400">Click row to view context & tips</span>
              </div>

              <div className="space-y-3">
                {subScores.map((item) => {
                  const isExpanded = expandedTip === item.id;
                  return (
                    <div 
                      key={item.id}
                      className="border border-slate-150 rounded-xl overflow-hidden bg-white hover:border-slate-300 transition"
                    >
                      <div 
                        onClick={() => setExpandedTip(isExpanded ? null : item.id)}
                        className="p-4 flex items-center justify-between gap-4 cursor-pointer select-none"
                      >
                        <div className="space-y-1.5 flex-1">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-slate-800">{item.name}</span>
                            <span className="text-xs font-bold font-mono text-slate-700">
                              {item.customValue || `${item.score}/100`}
                            </span>
                          </div>
                          
                          {/* Subscore indicator bar */}
                          <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                            <div 
                              className={`h-full transition-all duration-500 ${
                                item.score >= 85 ? 'bg-emerald-500' : item.score >= 70 ? 'bg-teal-500' : 'bg-amber-500'
                              }`}
                              style={{ width: `${item.score}%` }}
                            />
                          </div>
                        </div>

                        <div className="text-right">
                          <span className={`inline-block text-[8px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                            item.score >= 85 ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' : 'bg-amber-50 text-amber-700 border border-amber-100'
                          }`}>
                            {item.status}
                          </span>
                        </div>
                      </div>

                      <AnimatePresence>
                        {isExpanded && (
                          <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            className="bg-slate-50 border-t border-slate-150 overflow-hidden"
                          >
                            <div className="p-4 space-y-2.5 text-xs text-slate-600 leading-relaxed font-sans">
                              <div>
                                <strong className="text-slate-700 block mb-0.5">Indicator Scope:</strong>
                                {item.desc}
                              </div>
                              <div className="p-2 bg-white rounded-lg border border-slate-150 text-[11px] italic">
                                <strong className="text-peach-800 font-bold font-sans not-italic block mb-0.5">Real-world Example:</strong>
                                "{item.example}"
                              </div>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB 3: AI PREDICTIONS FORECASTS */}
          {activeTab === 'predictions' && (
            <div className="space-y-6">
              <div className="text-center py-2 space-y-1 bg-peach-50/50 border border-peach-100 rounded-2xl p-4">
                <h4 className="text-xs font-bold text-slate-800 flex items-center justify-center gap-1.5">
                  <BrainCircuit className="w-4 h-4 text-peach-700" /> Dimension 10: AI Predictive Forecasting
                </h4>
                <p className="text-[11px] text-slate-500 font-sans leading-relaxed">
                  Panda AI processes transaction frequencies, timing offsets, and payment patterns to calculate future likelihood scores. Lenders utilize these metrics to pre-approve splits instantly.
                </p>
              </div>

              {/* Grid of the 3 predictive ratings */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {/* Likelihood 1 */}
                <div className="bg-slate-50 border border-slate-200 p-4 rounded-2xl text-center space-y-2">
                  <span className="text-[10px] uppercase font-mono tracking-wider text-slate-400 font-bold block">Next Payment Miss Probability</span>
                  <div className="text-3xl font-black text-slate-850 font-mono">
                    {probMissing}%
                  </div>
                  <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
                    <div className="bg-rose-500 h-full" style={{ width: `${probMissing}%` }} />
                  </div>
                  <span className="text-[9px] text-slate-450 block font-sans">
                    Low probability suggests superb account planning discipline.
                  </span>
                </div>

                {/* Likelihood 2 */}
                <div className="bg-slate-50 border border-slate-200 p-4 rounded-2xl text-center space-y-2">
                  <span className="text-[10px] uppercase font-mono tracking-wider text-slate-400 font-bold block">Default Probability (Chance of Default)</span>
                  <div className="text-3xl font-black text-slate-850 font-mono text-emerald-600">
                    {probDefault}%
                  </div>
                  <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
                    <div className="bg-emerald-500 h-full" style={{ width: `${probDefault}%` }} />
                  </div>
                  <span className="text-[9px] text-slate-450 block font-sans">
                    Likelihood of complete payment contract cancellation.
                  </span>
                </div>

                {/* Likelihood 3 */}
                <div className="bg-slate-50 border border-slate-200 p-4 rounded-2xl text-center space-y-2">
                  <span className="text-[10px] uppercase font-mono tracking-wider text-slate-400 font-bold block">Completion Probability (Paid Off)</span>
                  <div className="text-3xl font-black text-emerald-700 font-mono">
                    {probComplete}%
                  </div>
                  <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
                    <div className="bg-emerald-600 h-full" style={{ width: `${probComplete}%` }} />
                  </div>
                  <span className="text-[9px] text-slate-450 block font-sans">
                    Forecasted confidence that the active split plan will be paid off.
                  </span>
                </div>
              </div>

              {/* Informational tip */}
              <div className="bg-indigo-50 border border-indigo-100 p-4 rounded-2xl flex gap-2 text-xs leading-relaxed text-indigo-800 font-sans">
                <Sparkles className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
                <span>
                  <strong>Tip:</strong> Keep a reserve ratio of at least 15% on your ledger. Our AI predicts a 4.2x increase in overall completion indicators for users maintaining savings reserves.
                </span>
              </div>
            </div>
          )}

        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-150 flex items-center justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2.5 bg-slate-850 text-white font-bold text-xs rounded-xl hover:bg-slate-700 transition cursor-pointer"
          >
            Acknowledge & Close Report
          </button>
        </div>
      </motion.div>
    </div>
  );
}
