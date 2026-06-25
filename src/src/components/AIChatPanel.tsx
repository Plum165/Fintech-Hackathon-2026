import React, { useState, useRef, useEffect } from 'react';
import { motion } from 'motion/react';
import { Send, Sparkles, Loader2, RefreshCw } from 'lucide-react';
import { Message } from '../types';
import Mascot from './Mascot';

interface AIChatPanelProps {
  token: string;
}

export default function AIChatPanel({ token }: AIChatPanelProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'model',
      content: 'Hello Corazon! I am Zen 🐼, your Interledger accounting companion. Ask me anything about your active limits, transactions, or general budget savings advice!',
      timestamp: new Date().toISOString()
    }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [advice, setAdvice] = useState('Zen recommends keeping your Tech & subscriptions category checked this week!');

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const fetchInsights = async () => {
    try {
      const response = await fetch('/api/ai/insights', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      if (response.ok && data.advice) {
        setAdvice(data.advice);
      }
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchInsights();
  }, []);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMsg: Message = {
      role: 'user',
      content: input,
      timestamp: new Date().toISOString()
    };

    setMessages((prev) => [...prev, userMsg]);
    const promptValue = input;
    setInput('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ message: promptValue })
      });
      const data = await response.json();
      if (response.ok) {
        setMessages(data.messages || []);
      } else {
        setMessages((prev) => [
          ...prev,
          {
            role: 'model',
            content: data.error || "Ah, my network pointer hit a small bump. Can you ask me again?",
            timestamp: new Date().toISOString()
          }
        ]);
      }
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        {
          role: 'model',
          content: "Unable to verify. Is your server API live?",
          timestamp: new Date().toISOString()
        }
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Dialogue and Messenger Log */}
      <div className="lg:col-span-2 flex flex-col h-[480px] bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-sm">
        <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <span className="text-lg">🐼</span>
            <div>
              <h4 className="text-xs font-bold text-slate-800">Consult Zen</h4>
              <p className="text-[10px] text-indigo-600 font-mono font-medium">Gemini 3.5 Assistant Active</p>
            </div>
          </div>
          <button
            onClick={fetchInsights}
            className="p-1.5 text-slate-500 hover:text-slate-800 rounded-md hover:bg-slate-100 transition"
            title="Reload insights"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Scrollable messages area */}
        <div className="flex-1 p-4 overflow-y-auto space-y-4 bg-slate-50/40">
          {messages.map((m, idx) => {
            const isModel = m.role === 'model';
            return (
              <div
                key={idx}
                className={`flex ${isModel ? 'justify-start' : 'justify-end'}`}
              >
                <div
                  className={`max-w-[80%] rounded-2xl p-3.5 text-xs leading-relaxed shadow-sm ${
                    isModel
                      ? 'bg-slate-100 text-slate-700 rounded-tl-none border border-slate-200'
                      : 'bg-indigo-600 text-white rounded-tr-none font-medium shadow-xs'
                  }`}
                >
                  <p>{m.content}</p>
                </div>
              </div>
            );
          })}

          {/* Thinking spinner */}
          {isLoading && (
            <div className="flex justify-start">
              <div className="bg-slate-100 border border-slate-200 text-slate-700 rounded-2xl rounded-tl-none p-3.5 text-xs flex items-center gap-2 shadow-sm">
                <Loader2 className="w-4 h-4 animate-spin text-indigo-600" />
                <span>Zen is crafting financial advice...</span>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Form panel */}
        <form onSubmit={handleSend} className="p-3 bg-white border-t border-slate-100 flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask: 'How is my Food budget?' or 'Give me savings tips'"
            className="flex-1 bg-slate-50 border border-slate-200 text-xs text-slate-800 px-4 py-3 rounded-xl focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 font-medium"
            disabled={isLoading}
          />
          <button
            type="submit"
            disabled={!input.trim() || isLoading}
            className="p-3 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-100 disabled:text-slate-400 text-white font-semibold rounded-xl transition flex items-center justify-center cursor-pointer shadow-sm"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>

      {/* Static insights / Advice card with Zen in custom thinking state */}
      <div className="flex flex-col gap-6">
        <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-4">
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5 font-sans">
            <Sparkles className="w-4 h-4 text-peach-600" /> Zen's Active Advice
          </h4>
          <p className="text-xs text-slate-700 leading-relaxed font-sans italic bg-slate-50 p-4 border border-slate-200 rounded-2xl">
            "{advice}"
          </p>
        </div>

        <div className="bg-white border border-slate-200 rounded-3xl p-4 shadow-sm">
          <Mascot state={isLoading ? 'thinking' : 'idle'} />
        </div>
      </div>
    </div>
  );
}
