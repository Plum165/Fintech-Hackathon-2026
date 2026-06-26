import { MascotProps } from '../types';
import { motion, AnimatePresence } from 'motion/react';

export default function Mascot({ state, message, size = 'md' }: MascotProps) {
  // Map mascot states to visual emojis, descriptive styles, and particles
  const config = {
    idle: { 
      emoji: '🐼', 
      color: 'bg-peach-50 text-peach-700 border-peach-300', 
      label: 'Healthy & Safe',
      particles: ['✨', '🌸', '✨']
    },
    happy: { 
      emoji: '🐼', 
      color: 'bg-amber-50 text-amber-800 border-amber-300', 
      label: 'Payment Settled!',
      particles: ['🎉', '🎈', '✨', '⭐']
    },
    warning: { 
      emoji: '🐼', 
      color: 'bg-rose-50 text-rose-800 border-rose-300', 
      label: 'Budget Alert',
      particles: ['❗', '⚡', '⚠️']
    },
    sad: { 
      emoji: '🐼', 
      color: 'bg-stone-50 text-stone-700 border-stone-300', 
      label: 'Low Funds',
      particles: ['💧', '🌧️', '💭']
    },
    thinking: { 
      emoji: '🐼', 
      color: 'bg-peach-100 text-peach-850 border-peach-400', 
      label: 'Zen is thinking...',
      particles: ['❓', '💡', '💭']
    }
  }[state] || { 
    emoji: '🐼', 
    color: 'bg-peach-50 text-peach-700 border-peach-300', 
    label: 'Idle',
    particles: []
  };

  const sizeClasses = {
    sm: 'w-10 h-10 text-xl border',
    md: 'w-16 h-16 text-3xl border-2',
    lg: 'w-24 h-24 text-5xl border-3'
  }[size];

  // Map state to a rich Framer Motion animation configuration
  const mascotAnimations = {
    idle: {
      y: [0, -4, 0],
      rotate: [0, 1.5, -1.5, 0],
      scale: [1, 1.02, 1],
      transition: {
        duration: 3,
        repeat: Infinity,
        ease: "easeInOut"
      }
    },
    happy: {
      y: [0, -20, 0, -10, 0],
      scale: [1, 1.15, 0.95, 1.05, 1],
      rotate: [0, 15, -15, 10, 0],
      transition: {
        duration: 1.2,
        repeat: Infinity,
        ease: "easeInOut"
      }
    },
    warning: {
      x: [0, -4, 4, -4, 4, -2, 2, 0],
      y: [0, -2, 2, -2, 0],
      transition: {
        duration: 0.4,
        repeat: Infinity,
        ease: "linear"
      }
    },
    sad: {
      y: [0, 2, 0],
      scaleY: [1, 0.93, 1],
      rotate: [-2, 2, -2],
      transition: {
        duration: 4,
        repeat: Infinity,
        ease: "easeInOut"
      }
    },
    thinking: {
      scale: [1, 1.06, 1],
      rotate: [0, 10, -10, 0],
      y: [0, -6, 0],
      transition: {
        duration: 1.8,
        repeat: Infinity,
        ease: "easeInOut"
      }
    }
  };

  return (
    <div className="flex flex-col items-center justify-center p-4 text-center rounded-xl transition-all duration-300 relative overflow-hidden">
      {/* Decorative pulse ring for premium aesthetic */}
      {state === 'thinking' && (
        <motion.div
          animate={{ scale: [1, 1.5, 1], opacity: [0.15, 0, 0.15] }}
          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
          className="absolute w-28 h-28 bg-peach-300 rounded-full blur-xl pointer-events-none"
        />
      )}
      {state === 'warning' && (
        <motion.div
          animate={{ scale: [1, 1.4, 1], opacity: [0.2, 0, 0.2] }}
          transition={{ duration: 1, repeat: Infinity, ease: "easeOut" }}
          className="absolute w-28 h-28 bg-rose-200 rounded-full blur-xl pointer-events-none"
        />
      )}

      {/* Floating particles container */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <AnimatePresence>
          {config.particles.map((char, index) => (
            <motion.span
              key={`${state}-${index}`}
              initial={{ 
                opacity: 0, 
                scale: 0.5, 
                x: (index - 1.5) * 25 + (Math.random() - 0.5) * 10, 
                y: 20 
              }}
              animate={{ 
                opacity: [0, 1, 1, 0], 
                scale: [0.6, 1.1, 1, 0.7], 
                y: -60,
                rotate: (index % 2 === 0 ? 45 : -45) + (Math.random() - 0.5) * 30
              }}
              transition={{ 
                duration: 2.2 + index * 0.4, 
                repeat: Infinity, 
                delay: index * 0.5,
                ease: "easeOut" 
              }}
              className="absolute left-1/2 bottom-1/2 text-sm select-none"
            >
              {char}
            </motion.span>
          ))}
        </AnimatePresence>
      </div>

      {/* Animated Mascot Circle */}
      <motion.div
        animate={mascotAnimations[state] || mascotAnimations.idle}
        className={`flex items-center justify-center rounded-full shadow-md ${sizeClasses} ${config.color} border-dashed z-10`}
      >
        <span className="select-none tracking-normal flex items-center justify-center">
          {state === 'happy' ? (
            <div className="relative">
              <span>{config.emoji}</span>
              <motion.span 
                animate={{ scale: [1, 1.3, 1], y: [-2, -6, -2] }}
                transition={{ duration: 1, repeat: Infinity }}
                className="absolute -top-3 -right-3 text-xs"
              >
                🎉
              </motion.span>
            </div>
          ) : state === 'warning' ? (
            <div className="relative">
              <span>{config.emoji}</span>
              <motion.span 
                animate={{ rotate: [0, 15, -15, 0], scale: [1, 1.2, 1] }}
                transition={{ duration: 0.5, repeat: Infinity }}
                className="absolute -top-3 -right-2 text-xs"
              >
                ⚠️
              </motion.span>
            </div>
          ) : state === 'sad' ? (
            <div className="relative">
              <span>{config.emoji}</span>
              <motion.span 
                animate={{ y: [0, 4, 0], opacity: [0.3, 1, 0.3] }}
                transition={{ duration: 2, repeat: Infinity }}
                className="absolute -bottom-2 -right-1 text-xs"
              >
                💧
              </motion.span>
            </div>
          ) : state === 'thinking' ? (
            <div className="relative">
              <span>{config.emoji}</span>
              <motion.span 
                animate={{ scale: [1, 1.2, 0.9, 1], rotate: [0, 10, -10, 0] }}
                transition={{ duration: 1.5, repeat: Infinity }}
                className="absolute -top-3 -right-2 text-xs"
              >
                💭
              </motion.span>
            </div>
          ) : (
            <span>{config.emoji}</span>
          )}
        </span>
      </motion.div>

      {/* Speech bubble */}
      {message && (
        <motion.div 
          initial={{ opacity: 0, scale: 0.9, y: 5 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          className="relative mt-3 px-4 py-3 bg-white text-slate-700 border border-peach-200 rounded-2xl max-w-xs shadow-sm text-xs leading-relaxed z-10"
        >
          {/* Bubble Arrow */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-full border-8 border-transparent border-b-white"></div>
          
          <p className="font-bold text-[10px] text-peach-700 uppercase tracking-wider mb-1">
            {config.label}
          </p>
          <p className="font-medium text-slate-700">{message}</p>
        </motion.div>
      )}
    </div>
  );
}
