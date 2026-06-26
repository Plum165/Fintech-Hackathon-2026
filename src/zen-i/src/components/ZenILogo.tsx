import React from 'react';

interface ZenILogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showText?: boolean;
}

export default function ZenILogo({ className = '', size = 'md', showText = true }: ZenILogoProps) {
  const sizeMap = {
    sm: { iconSize: 40, textSize: 'text-lg', subSize: 'text-[7px]' },
    md: { iconSize: 64, textSize: 'text-2xl', subSize: 'text-[9px]' },
    lg: { iconSize: 96, textSize: 'text-4xl', subSize: 'text-[11px]' },
    xl: { iconSize: 140, textSize: 'text-5xl', subSize: 'text-[13px]' }
  };

  const currentSize = sizeMap[size];

  return (
    <div className={`flex flex-col items-center justify-center text-center ${className}`}>
      {/* Dynamic, High-Fidelity SVG Logo */}
      <svg
        width={currentSize.iconSize}
        height={currentSize.iconSize}
        viewBox="0 0 200 200"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="transform transition hover:scale-105 duration-300"
      >
        {/* outer green glowing path / background ring */}
        <defs>
          <linearGradient id="greenRingGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#35A127" />
            <stop offset="100%" stopColor="#63C40E" />
          </linearGradient>
          <linearGradient id="pandaGrad" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#FFFFFF" />
            <stop offset="100%" stopColor="#F8FAFC" />
          </linearGradient>
        </defs>

        {/* Outer Circular Ring with Opening on Right (matches image) */}
        <path
          d="M 160 75 A 80 80 0 1 0 160 125"
          stroke="url(#greenRingGrad)"
          strokeWidth="10"
          strokeLinecap="round"
          fill="none"
        />

        {/* Bamboo Leaves on the Right */}
        <g transform="translate(155, 80) rotate(-10)">
          {/* Main stem */}
          <path d="M 0 0 C 15 -15 20 -40 25 -45" stroke="#35A127" strokeWidth="4" strokeLinecap="round" fill="none" />
          {/* Leaf 1 */}
          <path d="M 10 -20 C 25 -30 35 -30 45 -22 C 30 -10 15 -10 10 -20 Z" fill="#35A127" />
          {/* Leaf 2 */}
          <path d="M 18 -32 C 35 -45 45 -42 50 -30 C 35 -20 25 -20 18 -32 Z" fill="#63C40E" />
        </g>

        {/* Panda Ears */}
        <circle cx="65" cy="50" r="22" fill="#1E293B" />
        <circle cx="135" cy="50" r="22" fill="#1E293B" />

        {/* Panda Head Base */}
        <circle cx="100" cy="100" r="55" fill="url(#pandaGrad)" stroke="#1E293B" strokeWidth="6" />

        {/* Inner Ear Highlights (matches image cozy aesthetics) */}
        <circle cx="65" cy="50" r="12" fill="#334155" />
        <circle cx="135" cy="50" r="12" fill="#334155" />

        {/* Panda Eye Patches (slanted, high fidelity) */}
        <g transform="translate(80, 92) rotate(-15)">
          <ellipse cx="0" cy="0" rx="14" ry="19" fill="#1E293B" />
          {/* Smiling Eye Curve */}
          <path d="M -8 2 C -8 -4 4 -4 4 2" stroke="#FFFFFF" strokeWidth="3" strokeLinecap="round" fill="none" />
        </g>
        <g transform="translate(120, 92) rotate(15)">
          <ellipse cx="0" cy="0" rx="14" ry="19" fill="#1E293B" />
          {/* Smiling Eye Curve */}
          <path d="M -4 2 C -4 -4 8 -4 8 2" stroke="#FFFFFF" strokeWidth="3" strokeLinecap="round" fill="none" />
        </g>

        {/* Panda Snout / Nose and Smile */}
        <ellipse cx="100" cy="105" rx="10" ry="7" fill="#E2E8F0" />
        <path d="M 100 103 Q 100 109 100 109" stroke="#1E293B" strokeWidth="3" strokeLinecap="round" />
        <path d="M 94 110 Q 100 115 106 110" stroke="#1E293B" strokeWidth="3" strokeLinecap="round" fill="none" />
        {/* Tiny nose triangle */}
        <polygon points="96,101 104,101 100,105" fill="#1E293B" />

        {/* Panda Arms/Body holding the device */}
        {/* Left Arm */}
        <path d="M 52 115 C 42 130 50 155 70 155" stroke="#1E293B" strokeWidth="18" strokeLinecap="round" fill="none" />
        
        {/* Right Arm wrapping around to hold the device */}
        <path d="M 148 115 C 158 130 150 155 125 155" stroke="#1E293B" strokeWidth="18" strokeLinecap="round" fill="none" />

        {/* Green Wallet/Phone Device with QR Code held by Panda (Matches Logo precisely) */}
        <g transform="translate(80, 130) rotate(-12)">
          {/* Device Base */}
          <rect x="0" y="0" width="55" height="38" rx="8" fill="#1E293B" stroke="#35A127" strokeWidth="3" />
          {/* Accent Line */}
          <rect x="4" y="28" width="47" height="6" rx="2" fill="#63C40E" />
          
          {/* Simplified QR Code Pattern (Matches image) */}
          <g transform="translate(18, 5) scale(0.85)">
            <rect x="0" y="0" width="22" height="22" rx="2" fill="#FFFFFF" />
            {/* QR Corners */}
            <rect x="2" y="2" width="6" height="6" fill="#1E293B" />
            <rect x="3" y="3" width="4" height="4" fill="#FFFFFF" />
            <rect x="4" y="4" width="2" height="2" fill="#1E293B" />

            <rect x="14" y="2" width="6" height="6" fill="#1E293B" />
            <rect x="15" y="3" width="4" height="4" fill="#FFFFFF" />
            <rect x="16" y="4" width="2" height="2" fill="#1E293B" />

            <rect x="2" y="14" width="6" height="6" fill="#1E293B" />
            <rect x="3" y="15" width="4" height="4" fill="#FFFFFF" />
            <rect x="4" y="16" width="2" height="2" fill="#1E293B" />

            {/* Random QR points */}
            <rect x="10" y="4" width="2" height="2" fill="#1E293B" />
            <rect x="10" y="10" width="2" height="2" fill="#1E293B" />
            <rect x="14" y="10" width="2" height="2" fill="#1E293B" />
            <rect x="10" y="14" width="2" height="4" fill="#1E293B" />
            <rect x="14" y="14" width="4" height="2" fill="#1E293B" />
            <rect x="16" y="18" width="2" height="2" fill="#1E293B" />
          </g>
        </g>
      </svg>

      {/* Brand Text below (matches image font style and dots) */}
      {showText && (
        <div className="mt-3">
          <h1 className={`${currentSize.textSize} font-extrabold font-sans tracking-tight text-slate-800 flex items-center justify-center`}>
            Zen-<span className="text-[#35A127]">i</span>
          </h1>
          <p className={`${currentSize.subSize} font-mono uppercase tracking-[0.25em] text-slate-400 font-bold mt-1`}>
            — REMMZ —
          </p>
        </div>
      )}
    </div>
  );
}
