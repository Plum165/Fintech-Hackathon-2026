import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Plus, Trash2, Edit2, AlertTriangle, PiggyBank, Sparkles, Loader2, X } from 'lucide-react';
import { BudgetCategory } from '../types';
import Mascot from './Mascot';

interface BudgetManagerProps {
  token: string;
  refreshKey: number;
  onBudgetUpdated: () => void;
  walletBalance: number;
}

export default function BudgetManager({ token, refreshKey, onBudgetUpdated, walletBalance }: BudgetManagerProps) {
  const [categories, setCategories] = useState<BudgetCategory[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  const [error, setError] = useState('');

  // Form states
  const [name, setName] = useState('');
  const [limit, setLimit] = useState('');
  const [icon, setIcon] = useState('shopping-bag');
  const [color, setColor] = useState('#1D9E75');

  const fetchBudgets = async () => {
    try {
      const response = await fetch('/api/budget', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      if (response.ok) {
        setCategories(data.categories || []);
      }
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchBudgets();
  }, [refreshKey]);

  const handleAddCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    const numLimit = parseFloat(limit);
    if (!name || isNaN(numLimit) || numLimit <= 0) {
      setError('Please provide a valid name and limit.');
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch('/api/budget/category', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ name, limit, icon, color })
      });
      const data = await response.json();
      if (response.ok) {
        setIsAdding(false);
        setName('');
        setLimit('');
        fetchBudgets();
        onBudgetUpdated();
      } else {
        setError(data.error || 'Failed to add budget.');
      }
    } catch (err) {
      setError('Connection failure.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteCategory = async (id: string) => {
    if (!confirm('Are you sure you want to delete this budget category?')) return;
    try {
      const response = await fetch(`/api/budget/category/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        fetchBudgets();
        onBudgetUpdated();
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Calculations
  const totalLimit = categories.reduce((sum, c) => sum + c.limit, 0);
  const totalAllocated = categories.reduce((sum, c) => sum + c.allocated, 0);
  const usedRatio = totalLimit > 0 ? Math.round((totalAllocated / totalLimit) * 100) : 0;

  // Determine if any category is over critical threshold (80% or more)
  const dangerCategories = categories.filter(c => (c.allocated / c.limit) >= 0.8);
  const hasDanger = dangerCategories.length > 0;

  return (
    <div className="space-y-6">
      {/* Overview Block */}
      <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-4">
        <div className="flex justify-between items-center">
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">Allocated of wallet</h4>
            <div className="text-xl font-bold font-mono text-slate-800 flex items-baseline gap-1">
              R {totalAllocated.toFixed(2)}{' '}
              <span className="text-xs text-slate-450 font-sans font-normal">/ R {totalLimit.toFixed(2)}</span>
            </div>
          </div>
          <span className={`text-xs font-bold px-3 py-1 rounded-full border ${
            usedRatio >= 90 ? 'bg-rose-50 text-rose-600 border-rose-200' : 'bg-emerald-50 text-emerald-600 border-emerald-200'
          }`}>
            {usedRatio}% used
          </span>
        </div>

        {/* Categories Bar listing */}
        <div className="space-y-4">
          {categories.map((c) => {
            const ratio = c.limit > 0 ? (c.allocated / c.limit) * 100 : 0;
            const isDanger = ratio >= 80;

            return (
              <div key={c.id} className="space-y-1.5 group">
                <div className="flex justify-between items-center text-xs">
                  <div className="flex items-center gap-2">
                    <span style={{ color: c.color }} className="font-bold">
                      {c.name}
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-slate-500 font-mono font-medium">
                      R {c.allocated.toFixed(0)} / R {c.limit.toFixed(0)}
                    </span>
                    <button
                      onClick={() => handleDeleteCategory(c.id)}
                      className="p-1 rounded-md text-slate-400 hover:text-rose-600 hover:bg-rose-50 opacity-0 group-hover:opacity-100 transition-all duration-150 cursor-pointer"
                      title="Delete Category"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Progress track */}
                <div className="h-2.5 bg-slate-50 border border-slate-200 rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${Math.min(100, ratio)}%` }}
                    className="h-full rounded-full"
                    style={{ backgroundColor: c.color }}
                  ></motion.div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Warning Indicator */}
        {hasDanger && (
          <div className="p-3 bg-rose-50 border border-rose-100 rounded-xl flex items-center gap-2.5 text-xs text-rose-600">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>
              <strong>{dangerCategories[0].name}</strong> is almost over budget limit. Review your subscription settings.
            </span>
          </div>
        )}

        <button
          onClick={() => setIsAdding(true)}
          className="w-full flex items-center justify-center gap-1.5 py-2.5 px-4 bg-slate-50 hover:bg-slate-100 border border-slate-200 transition text-slate-755 text-xs font-semibold rounded-xl cursor-pointer"
        >
          <Plus className="w-4 h-4" /> Add Category
        </button>
      </div>

      {/* State-based Mascot Reacting inside Budgets panel */}
      <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-sm">
        <Mascot 
          state={usedRatio >= 85 ? 'warning' : 'idle'} 
          message={
            usedRatio >= 85 
              ? "Oops! We are consuming too much budget fast. Let's tighten our subscriptions!" 
              : "Excellent job Corazon! Our spending ratios look healthy this month."
          } 
          size="lg"
        />
      </div>

      {/* Add Category Modal Dialog */}
      <AnimatePresence>
        {isAdding && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsAdding(false)}
              className="absolute inset-0 bg-slate-900/40 backdrop-blur-xs"
            ></motion.div>

            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="relative w-full max-w-sm bg-white border border-slate-200 rounded-2xl p-5 shadow-xl z-10 space-y-4"
            >
              <button
                onClick={() => setIsAdding(false)}
                className="absolute top-4 right-4 p-1 rounded-md text-slate-400 hover:text-slate-800 hover:bg-slate-50 transition"
              >
                <X className="w-4 h-4" />
              </button>

              <h3 className="text-sm font-bold text-slate-800">Add Budget Category</h3>

              {error && (
                <div className="p-2 bg-rose-50 border border-rose-200 text-rose-600 text-xs rounded-lg">
                  {error}
                </div>
              )}

              <form onSubmit={handleAddCategory} className="space-y-4">
                <div className="space-y-1">
                  <label className="text-[10px] uppercase text-slate-500 font-bold tracking-wider">Category Name</label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 text-xs text-slate-800 px-3.5 py-2.5 rounded-xl focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 font-medium"
                    placeholder="e.g. Transport, Food, Entertaining"
                    required
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] uppercase text-slate-500 font-bold tracking-wider">Spend Limit (R)</label>
                  <input
                    type="number"
                    value={limit}
                    onChange={(e) => setLimit(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 text-xs text-slate-800 px-3.5 py-2.5 rounded-xl focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 font-mono font-bold"
                    placeholder="500.00"
                    required
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] uppercase text-slate-500 font-bold tracking-wider">Color Indicator</label>
                  <div className="grid grid-cols-5 gap-2">
                    {['#1D9E75', '#378ADD', '#A32D2D', '#EF9F27', '#854F0B'].map((col) => (
                      <button
                        type="button"
                        key={col}
                        onClick={() => setColor(col)}
                        style={{ backgroundColor: col }}
                        className={`h-7 rounded-lg transition-all ${
                          color === col ? 'ring-2 ring-indigo-500 scale-105 shadow-md' : 'opacity-80 hover:opacity-100'
                        }`}
                      ></button>
                    ))}
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full flex items-center justify-center gap-1.5 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-100 text-white font-bold text-xs rounded-xl cursor-pointer shadow-sm"
                >
                  {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Create Category'}
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
