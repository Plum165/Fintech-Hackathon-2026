import React, { useState } from 'react';
import { motion } from 'motion/react';
import {
  QrCode, Copy, Check, Store, DollarSign, Package, CreditCard,
  ExternalLink, RefreshCw, AlertCircle, Loader2
} from 'lucide-react';

export default function MerchantQrPanel() {
  const [merchantName, setMerchantName] = useState('');
  const [walletPointer, setWalletPointer] = useState('');
  const [itemDescription, setItemDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [splits, setSplits] = useState(3);

  const [payId, setPayId] = useState('');
  const [qrUrl, setQrUrl] = useState('');
  const [paymentLink, setPaymentLink] = useState('');
  const [copied, setCopied] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState('');

  const generateLink = async () => {
    setError('');
    if (!merchantName.trim()) { setError('Enter your business name.'); return; }
    if (!walletPointer.trim()) { setError('Enter your wallet pointer (e.g. $ilp.interledger-test.dev/yourname).'); return; }
    const amt = parseFloat(amount);
    if (isNaN(amt) || amt < 1) { setError('Enter a valid amount.'); return; }
    if (!itemDescription.trim()) { setError('Enter an item or service description.'); return; }

    setIsGenerating(true);
    try {
      const response = await fetch('/api/pay/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          merchantName: merchantName.trim(),
          merchantPointer: walletPointer.trim(),
          itemDescription: itemDescription.trim(),
          amount: amt.toFixed(2),
          currency: 'ZAR',
          splits: String(splits),
        })
      });
      const data = await response.json();
      if (!response.ok) { setError(data.error || 'Failed to create payment request.'); return; }

      const id = data.id as string;
      const link = `${window.location.origin}/pay/${id}`;
      const qr = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(link)}`;
      setPayId(id);
      setPaymentLink(link);
      setQrUrl(qr);
    } catch {
      setError('Server connection failed. Make sure the backend is running.');
    } finally {
      setIsGenerating(false);
    }
  };

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(paymentLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white border border-slate-200 rounded-3xl p-6 flex items-start gap-4">
        <div className="w-12 h-12 rounded-2xl bg-violet-50 flex items-center justify-center text-violet-700 shrink-0">
          <Store className="w-6 h-6" />
        </div>
        <div>
          <h2 className="text-lg font-bold text-slate-800">Merchant Payment Portal</h2>
          <p className="text-xs text-slate-500 leading-relaxed font-sans">
            Generate a QR code customers scan to check out via BNPL splits. Payments land directly in your Interledger wallet.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Form */}
        <div className="bg-white border border-slate-200 rounded-3xl p-6 space-y-4">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">Checkout Details</h3>

          {error && (
            <div className="bg-rose-50 border border-rose-100 rounded-xl p-3 flex items-start gap-2 text-xs text-rose-700">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-500 flex items-center gap-1.5">
              <Store className="w-3.5 h-3.5" /> Business Name
            </label>
            <input
              type="text"
              value={merchantName}
              onChange={e => setMerchantName(e.target.value)}
              placeholder="e.g. Kasi Tech Store"
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-xs focus:outline-none focus:border-violet-400 focus:ring-1 focus:ring-violet-400 transition font-medium"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-500 flex items-center gap-1.5">
              <QrCode className="w-3.5 h-3.5" /> Your Wallet Pointer
            </label>
            <input
              type="text"
              value={walletPointer}
              onChange={e => setWalletPointer(e.target.value)}
              placeholder="$ilp.interledger-test.dev/yourname"
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-xs focus:outline-none focus:border-violet-400 focus:ring-1 focus:ring-violet-400 transition font-mono"
            />
            <p className="text-[10px] text-slate-400 font-sans">First installment is sent to this ILP wallet via Interledger.</p>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-500 flex items-center gap-1.5">
              <Package className="w-3.5 h-3.5" /> Item / Service
            </label>
            <input
              type="text"
              value={itemDescription}
              onChange={e => setItemDescription(e.target.value)}
              placeholder="e.g. Smartphone — Samsung Galaxy A55"
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-xs focus:outline-none focus:border-violet-400 focus:ring-1 focus:ring-violet-400 transition font-medium"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-500 flex items-center gap-1.5">
                <DollarSign className="w-3.5 h-3.5" /> Amount (ZAR)
              </label>
              <div className="flex rounded-xl bg-slate-50 border border-slate-200 focus-within:border-violet-400 focus-within:ring-1 focus-within:ring-violet-400 transition overflow-hidden">
                <span className="bg-slate-100 text-slate-500 px-3 py-3 text-xs font-mono border-r border-slate-200 flex items-center font-bold">R</span>
                <input
                  type="number"
                  value={amount}
                  onChange={e => setAmount(e.target.value)}
                  placeholder="1200.00"
                  className="w-full px-3 py-3 text-xs font-mono bg-transparent focus:outline-none"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-500 flex items-center gap-1.5">
                <CreditCard className="w-3.5 h-3.5" /> Default Splits
              </label>
              <select
                value={splits}
                onChange={e => setSplits(Number(e.target.value))}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-3 text-xs font-bold focus:outline-none focus:border-violet-400 focus:ring-1 focus:ring-violet-400 transition cursor-pointer"
              >
                {[2, 3, 4, 6, 8, 12].map(n => (
                  <option key={n} value={n}>{n} splits</option>
                ))}
              </select>
            </div>
          </div>

          <button
            onClick={generateLink}
            disabled={isGenerating}
            className="w-full py-3 bg-violet-600 hover:bg-violet-700 disabled:bg-slate-200 disabled:text-slate-450 text-white font-bold rounded-xl text-xs transition shadow-md flex items-center justify-center gap-2 cursor-pointer mt-2"
          >
            {isGenerating
              ? <><Loader2 className="w-4 h-4 animate-spin" /> Generating...</>
              : <><QrCode className="w-4 h-4" /> Generate QR Code</>
            }
          </button>
        </div>

        {/* QR Output */}
        <div className="bg-white border border-slate-200 rounded-3xl p-6 flex flex-col items-center justify-center space-y-4 min-h-[380px]">
          {qrUrl ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="space-y-4 w-full flex flex-col items-center"
            >
              <div className="p-3 bg-white border-2 border-violet-200 rounded-2xl shadow-md">
                <img
                  src={qrUrl}
                  alt="Payment QR Code"
                  className="w-52 h-52 rounded-lg"
                />
              </div>

              <div className="text-center space-y-1">
                <p className="text-[10px] font-mono font-bold text-violet-600 bg-violet-50 border border-violet-100 px-3 py-1 rounded-full">{payId}</p>
                <p className="text-xs font-bold text-slate-700">{merchantName}</p>
                <p className="text-[10px] text-slate-500">{itemDescription}</p>
                <p className="text-sm font-black font-mono text-violet-700">R {parseFloat(amount || '0').toFixed(2)}</p>
                <p className="text-[10px] text-slate-400">{splits} interest-free splits</p>
              </div>

              <div className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 space-y-2">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Customer Payment Link</p>
                <p className="text-[10px] font-mono text-slate-700 break-all leading-relaxed">{paymentLink}</p>
                <div className="flex gap-2">
                  <button
                    onClick={copyLink}
                    className="flex-1 py-2 bg-white border border-slate-200 hover:border-violet-400 text-slate-600 hover:text-violet-700 font-bold rounded-lg text-[10px] transition flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    {copied ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                    {copied ? 'Copied!' : 'Copy Link'}
                  </button>
                  <button
                    onClick={generateLink}
                    disabled={isGenerating}
                    className="py-2 px-3 bg-white border border-slate-200 hover:border-violet-400 text-slate-500 hover:text-violet-700 font-bold rounded-lg text-[10px] transition flex items-center gap-1 cursor-pointer"
                    title="Regenerate"
                  >
                    <RefreshCw className="w-3 h-3" />
                  </button>
                  <a
                    href={paymentLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="py-2 px-3 bg-violet-600 hover:bg-violet-700 text-white font-bold rounded-lg text-[10px] transition flex items-center gap-1 cursor-pointer"
                    title="Test link"
                  >
                    <ExternalLink className="w-3 h-3" /> Test
                  </a>
                </div>
              </div>
            </motion.div>
          ) : (
            <div className="text-center space-y-3 text-slate-400">
              <QrCode className="w-16 h-16 mx-auto text-slate-200" />
              <p className="text-xs font-medium">Fill in the form and click <strong>Generate QR Code</strong></p>
              <p className="text-[10px] text-slate-400 max-w-xs leading-relaxed">
                A unique <span className="font-mono font-bold text-violet-600">PAY-XXXXXX</span> ID is created and stored. Customers scan the QR, complete BNPL checkout, and the payment arrives in your Interledger wallet.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* How it works */}
      <div className="bg-violet-50 border border-violet-100 rounded-2xl p-5">
        <h3 className="text-xs font-bold text-violet-800 mb-3">How it works</h3>
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
          {[
            { n: '1', t: 'Generate QR', d: 'Server creates a PAY-XXXXXX payment request. QR links to this app with that ID.' },
            { n: '2', t: 'Customer scans', d: 'Customer scans — opens checkout pre-filled with your merchant details and amount.' },
            { n: '3', t: 'BNPL approval', d: 'Customer selects split plan, signs contract, approves via their ILP wallet.' },
            { n: '4', t: 'Paid instantly', d: 'First installment settles via Interledger to your wallet. Remaining on schedule.' },
          ].map(step => (
            <div key={step.n} className="flex gap-2.5">
              <span className="w-6 h-6 rounded-full bg-violet-200 text-violet-800 text-[10px] font-black flex items-center justify-center shrink-0 mt-0.5">{step.n}</span>
              <div>
                <p className="text-xs font-bold text-violet-800">{step.t}</p>
                <p className="text-[10px] text-violet-600 leading-relaxed font-sans">{step.d}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
