import { MascotProps } from '../types';
import { motion } from 'motion/react';

export default function Mascot({ state, message, size = 'md' }: MascotProps) {
  // Map mascot states to visual emojis and descriptive styles
  const config = {
    idle: { emoji: '🐼', color: 'bg-emerald-50 text-emerald-700 border-emerald-400', label: 'Healthy & Safe' },
    happy: { emoji: '🎉', color: 'bg-teal-50 text-teal-800 border-teal-500', label: 'Payment Settled!' },
    warning: { emoji: '⚠️', color: 'bg-amber-50 text-amber-800 border-amber-500', label: 'Budget Alert' },
    sad: { emoji: '😢', color: 'bg-rose-50 text-rose-800 border-rose-500', label: 'Low Funds' },
    thinking: { emoji: '🧠', color: 'bg-indigo-50 text-indigo-800 border-indigo-500', label: 'Zenny is thinking...' }
  }[state] || { emoji: '🐼', color: 'bg-emerald-50 text-emerald-700 border-emerald-400', label: 'Idle' };

  const sizeClasses = {
    sm: 'w-10 h-10 text-xl border',
    md: 'w-16 h-16 text-3xl border-2',
    lg: 'w-24 h-24 text-5xl border-3'
  }[size];

  return (
    <div className="flex flex-col items-center justify-center p-4 text-center rounded-xl transition-all duration-300">
      {/* Animated Avatar Circle */}
      <motion.div
        animate={state === 'thinking' ? {
          scale: [1, 1.08, 1],
          rotate: [0, 5, -5, 0],
        } : {
          y: [0, -4, 0],
        }}
        transition={state === 'thinking' ? {
          duration: 1.5,
          repeat: Infinity,
          ease: "easeInOut"
        } : {
          duration: 3,
          repeat: Infinity,
          ease: "easeInOut"
        }}
        className={`flex items-center justify-center rounded-full shadow-md ${sizeClasses} ${config.color} border-dashed`}
      >
        <span>{config.emoji}</span>
      </motion.div>

      {/* Speech bubble */}
      {message && (
        <motion.div 
          initial={{ opacity: 0, scale: 0.9, y: 5 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          className="relative mt-3 px-4 py-3 bg-slate-100 text-slate-700 border border-slate-200 rounded-2xl max-w-xs shadow-sm text-xs leading-relaxed"
        >
          {/* Bubble Arrow */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-full border-8 border-transparent border-b-slate-100"></div>
          
          <p className="font-semibold text-[10px] text-indigo-600 uppercase tracking-wider mb-1">
            {config.label}
          </p>
          <p>{message}</p>
        </motion.div>
      )}
    </div>
  );
}
