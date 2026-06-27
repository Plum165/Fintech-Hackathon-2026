import React from "react";
import { Sparkles, Smile, MessageSquare } from "lucide-react";

interface MascotProps {
  state: "happy" | "neutral" | "sad";
  message: string;
  size?: "sm" | "md" | "lg";
}

export default function Mascot({ state, message, size = "md" }: MascotProps) {
  const getScale = () => {
    switch (size) {
      case "sm":
        return "scale-90";
      case "lg":
        return "scale-110";
      default:
        return "scale-100";
    }
  };

  return (
    <div className={`flex flex-col items-center justify-center p-4 space-y-3 ${getScale()} transition-all duration-500`}>
      {/* Animated Character */}
      <div className="relative">
        {/* Glow effect */}
        <div className="absolute -inset-1 rounded-full bg-indigo-500/20 blur-md animate-pulse"></div>
        
        {/* Actual Character SVG/UI */}
        <div className="relative w-16 h-16 bg-gradient-to-tr from-indigo-600 to-violet-500 rounded-2xl flex items-center justify-center shadow-lg border border-indigo-400/30 transform hover:scale-105 transition-transform duration-300">
          {state === "happy" ? (
            <div className="flex flex-col items-center space-y-0.5">
              <Smile className="w-8 h-8 text-white animate-bounce" />
              <div className="flex gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-300 animate-ping"></span>
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-300"></span>
              </div>
            </div>
          ) : state === "sad" ? (
            <div className="flex flex-col items-center space-y-1">
              <span className="text-xl">😢</span>
              <div className="w-6 h-1 bg-red-400 rounded-full"></div>
            </div>
          ) : (
            <div className="flex flex-col items-center space-y-1">
              <span className="text-xl">😐</span>
              <div className="w-6 h-1 bg-indigo-300 rounded-full"></div>
            </div>
          )}
          
          {/* Sparkles decoration for happy state */}
          {state === "happy" && (
            <>
              <Sparkles className="absolute -top-1 -right-1 w-4 h-4 text-amber-400 animate-pulse" />
              <Sparkles className="absolute -bottom-1 -left-1 w-3.5 h-3.5 text-amber-300 animate-pulse delay-75" />
            </>
          )}
        </div>
      </div>

      {/* Mascot Speech Bubble */}
      <div className="relative bg-indigo-50/80 border border-indigo-100 rounded-2xl px-4 py-3 max-w-xs shadow-sm">
        {/* speech arrow */}
        <div className="absolute -top-2 left-1/2 -translate-x-1/2 w-0 h-0 border-l-[8px] border-l-transparent border-r-[8px] border-r-transparent border-b-[8px] border-b-indigo-50/80"></div>
        
        <p className="text-xs text-indigo-950 font-medium leading-relaxed text-center">
          {message}
        </p>
      </div>
    </div>
  );
}
