import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Radio, BookOpen, Clock, Zap, AlertCircle, Coins, ShieldCheck, Sparkle } from 'lucide-react';
import { Wallet } from '../types';

interface WebMonetizationPanelProps {
  wallet: Wallet | null;
  token: string | null;
  onPaymentStreamed: () => void;
}

export default function WebMonetizationPanel({ wallet, token, onPaymentStreamed }: WebMonetizationPanelProps) {
  const [isActive, setIsActive] = useState(false);
  const [packetsSent, setPacketsSent] = useState(0);
  const [totalStreamed, setTotalStreamed] = useState(0);
  const [streamError, setStreamError] = useState('');
  const [currentArticle, setCurrentArticle] = useState(0);

  const articles = [
    {
      title: "Fintech Revolution: Demystifying Open Payments & Interledger",
      author: "Zen Panda, Chief AI Strategist",
      readTime: "4 min read",
      content: "Traditional payment infrastructure relies on walled gardens and custom silo integrations, causing cross-border and cross-entity friction. The Interledger Protocol (ILP) addresses this by introducing a packet-switched routing layer for currencies—similar to how IP routers handle data packets on the internet. With Open Payments, nodes can programmatically negotiate consent and grant quotes in milliseconds. Under this architecture, publishers can request instant micro-payments directly from consumer wallets, eliminating intrusive advertising networks."
    },
    {
      title: "Sustainable Micropayments: How Web Monetization replaces Paywalls",
      author: "Mikaeel Naidoo, Fintech Lead",
      readTime: "6 min read",
      content: "Paywalls represent a significant barrier to info-sharing, forcing users to buy whole monthly packages for single articles. Web Monetization resolves this. By declaring a standard payment pointer (e.g. $publisher) in HTML metadata, a compatible browser can stream micro-payments directly from the reader's connected wallet. At R0.05 per second, reading an article costs the user pocket change while generating substantial recurring revenue for independent journalism without ads."
    }
  ];

  useEffect(() => {
    let intervalId: any;
    if (isActive) {
      setStreamError('');
      // Trigger a stream packet immediately, then every 1.5 seconds
      const sendPacket = async () => {
        try {
          const response = await fetch('/api/monetization/stream', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`
            }
          });
          const data = await response.json();
          if (response.ok) {
            setPacketsSent(prev => prev + 1);
            setTotalStreamed(prev => prev + 0.05);
            onPaymentStreamed();
          } else {
            setIsActive(false);
            setStreamError(data.error || 'Insufficient funds to monetize content.');
          }
        } catch (e) {
          setIsActive(false);
          setStreamError('Publisher node offline.');
        }
      };

      sendPacket();
      intervalId = setInterval(sendPacket, 1500);
    }

    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [isActive, token]);

  const toggleStream = () => {
    setIsActive(!isActive);
  };

  const formattedStreamed = new Intl.NumberFormat('en-ZA', { style: 'currency', currency: 'ZAR' }).format(totalStreamed);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6" id="monetization-panel">
      {/* Article reading card */}
      <div className="lg:col-span-2 bg-white border border-slate-200 rounded-3xl p-6 shadow-sm flex flex-col justify-between">
        <div className="space-y-4">
          <div className="flex items-center gap-2 text-xs font-mono text-peach-700 font-bold uppercase tracking-wider">
            <BookOpen className="w-4 h-4" /> Premium Fintech Feed
          </div>
          <h3 className="text-lg md:text-xl font-bold text-slate-800">{articles[currentArticle].title}</h3>
          
          <div className="flex items-center gap-3 text-slate-400 text-[11px] font-sans">
            <span>By <strong>{articles[currentArticle].author}</strong></span>
            <span>•</span>
            <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" /> {articles[currentArticle].readTime}</span>
          </div>

          <div className="relative">
            {/* Blurriness overlay if not monetized */}
            {!isActive && (
              <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-white to-transparent pointer-events-none" />
            )}
            <p className={`text-slate-600 leading-relaxed text-xs space-y-3 font-sans ${!isActive ? 'max-h-36 overflow-hidden select-none' : ''}`}>
              {articles[currentArticle].content}
            </p>
          </div>
        </div>

        {/* Article switcher */}
        <div className="flex justify-between items-center pt-6 mt-6 border-t border-slate-100">
          <div className="flex gap-1">
            {articles.map((_, idx) => (
              <button
                key={idx}
                onClick={() => { setCurrentArticle(idx); setIsActive(false); }}
                className={`w-2.5 h-2.5 rounded-full cursor-pointer ${currentArticle === idx ? 'bg-peach-600' : 'bg-slate-200'}`}
              />
            ))}
          </div>
          <span className="text-[10px] uppercase font-mono tracking-widest text-slate-400 font-bold">
            Article {currentArticle + 1} of {articles.length}
          </span>
        </div>
      </div>

      {/* Micropayments controller card */}
      <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm flex flex-col justify-between space-y-6">
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <div className={`p-2 rounded-xl ${isActive ? 'bg-emerald-50 text-emerald-600 animate-pulse' : 'bg-slate-50 text-slate-400'}`}>
              <Radio className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-slate-800">Web Monetization Node</h4>
              <p className="text-[10px] text-slate-400 font-sans">Direct browser-to-merchant pay stream</p>
            </div>
          </div>

          {/* Monetized live display ticker */}
          <div className={`rounded-2xl p-4 border text-center transition ${
            isActive ? 'bg-emerald-50/40 border-emerald-200 text-emerald-950' : 'bg-slate-50 border-slate-150 text-slate-500'
          }`}>
            <p className="text-[10px] font-bold uppercase tracking-widest font-mono text-slate-400">Streamed Payment</p>
            <p className="text-3xl font-black mt-1 font-sans">{formattedStreamed}</p>
            <div className="flex items-center justify-center gap-1.5 text-[10px] mt-2 font-mono font-bold">
              {isActive ? (
                <>
                  <Zap className="w-3.5 h-3.5 text-emerald-600 animate-bounce" /> Streaming: R 0.05 / 1.5s
                </>
              ) : (
                'Micro-billing paused'
              )}
            </div>
          </div>

          {/* Stats details */}
          <div className="grid grid-cols-2 gap-3 text-xs bg-slate-50/50 border border-slate-100 rounded-xl p-3 font-mono">
            <div>
              <p className="text-slate-400 text-[9px] font-bold">Packets Sent</p>
              <p className="text-slate-800 font-bold mt-0.5">{packetsSent} pkts</p>
            </div>
            <div>
              <p className="text-slate-400 text-[9px] font-bold">Active Link</p>
              <p className="text-slate-800 font-bold mt-0.5 truncate">$publisher.node</p>
            </div>
          </div>
        </div>

        {streamError && (
          <div className="text-[10px] text-rose-600 bg-rose-50 border border-rose-100 p-2.5 rounded-lg font-semibold flex items-center gap-1.5 leading-normal">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{streamError}</span>
          </div>
        )}

        {/* Action Toggle Button */}
        <div className="space-y-3">
          <button
            onClick={toggleStream}
            className={`w-full py-3 px-4 font-bold text-xs rounded-xl transition cursor-pointer shadow-sm text-center uppercase tracking-wider flex items-center justify-center gap-2 ${
              isActive 
                ? 'bg-rose-55 hover:bg-rose-100 border border-rose-200 text-rose-700' 
                : 'bg-peach-600 hover:bg-peach-700 text-white'
            }`}
          >
            {isActive ? 'Pause Payment & Lock Content' : 'Monetize Feed & Unlock Content'}
          </button>
          
          <div className="flex gap-2 p-3 bg-teal-50/40 border border-teal-100 rounded-xl text-[10px] text-teal-800 font-sans leading-normal">
            <Sparkle className="w-4 h-4 text-teal-600 shrink-0 mt-0.5 animate-spin" />
            <span>Micro-payments occur directly from wallet to standard Interledger target pointers without paywall account registration!</span>
          </div>
        </div>
      </div>
    </div>
  );
}
