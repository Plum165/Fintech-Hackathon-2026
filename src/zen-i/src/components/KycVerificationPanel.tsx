import React, { useState, useRef } from 'react';
import { motion } from 'motion/react';
import { ShieldCheck, Upload, AlertCircle, RefreshCw, FileText, Globe, UserCheck, ShieldAlert } from 'lucide-react';
import { User, Wallet } from '../types';

interface KycVerificationPanelProps {
  user: User | null;
  wallet: Wallet | null;
  token: string | null;
  onKycComplete: () => void;
}

export default function KycVerificationPanel({ user, wallet, token, onKycComplete }: KycVerificationPanelProps) {
  const [fullName, setFullName] = useState(user?.kycDetails?.fullName || '');
  const [idNumber, setIdNumber] = useState(user?.kycDetails?.idNumber || '');
  const [country, setCountry] = useState(user?.kycDetails?.country || 'South Africa');
  const [documentType, setDocumentType] = useState(user?.kycDetails?.documentType || 'National ID');
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setUploadedFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setUploadedFile(e.target.files[0]);
    }
  };

  const triggerFileSelect = () => {
    fileInputRef.current?.click();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!fullName.trim() || !idNumber.trim() || !country || !documentType) {
      setError('Please fill in all personal details.');
      return;
    }

    if (!uploadedFile && user?.kycStatus !== 'verified') {
      setError('Please upload a proof of identity document (ID or passport).');
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch('/api/auth/kyc', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ fullName, idNumber, country, documentType })
      });

      const data = await response.json();
      if (response.ok) {
        setSuccess('Identity Verified Successfully! R 1,500 backup credit activated.');
        onKycComplete();
      } else {
        setError(data.error || 'KYC submission failed.');
      }
    } catch (e) {
      setError('Connection failure.');
    } finally {
      setIsLoading(false);
    }
  };

  const isVerified = user?.kycStatus === 'verified';

  return (
    <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-6" id="kyc-panel">
      {/* Header */}
      <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
        <div className={`p-3 rounded-2xl ${isVerified ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'}`}>
          {isVerified ? <ShieldCheck className="w-6 h-6" /> : <ShieldAlert className="w-6 h-6 animate-bounce" />}
        </div>
        <div>
          <h3 className="text-base font-bold text-slate-800">KYC Identity Compliance</h3>
          <p className="text-xs text-slate-500 font-sans">Verify your legal identity on the Interledger network to unlock premium ledger functions.</p>
        </div>
      </div>

      {isVerified ? (
        /* VERIFIED STATE SCREEN */
        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          className="space-y-6"
        >
          <div className="p-5 bg-emerald-50/50 border border-emerald-100 rounded-2xl flex items-center gap-4">
            <div className="p-3 bg-emerald-500 text-white rounded-full">
              <UserCheck className="w-6 h-6" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-emerald-950">Verification Complete</h4>
              <p className="text-[11px] text-emerald-700 font-medium font-sans mt-0.5">Your Zen-i payment node has passed AML & CTF verification checks.</p>
            </div>
          </div>

          <div className="border border-slate-150 rounded-2xl p-5 space-y-3 bg-slate-50/50">
            <h5 className="text-[10px] uppercase font-mono tracking-widest text-slate-400 font-bold border-b border-slate-100 pb-1.5">Verified Personal Profile</h5>
            
            <div className="grid grid-cols-2 gap-4 text-xs">
              <div>
                <p className="text-slate-400 font-semibold uppercase text-[9px] font-mono">Full Legal Name</p>
                <p className="text-slate-800 font-bold mt-0.5">{user?.kycDetails?.fullName || 'Mikaeel Naidoo'}</p>
              </div>
              <div>
                <p className="text-slate-400 font-semibold uppercase text-[9px] font-mono">Document Type</p>
                <p className="text-slate-800 font-bold mt-0.5">{user?.kycDetails?.documentType || 'National ID'}</p>
              </div>
              <div>
                <p className="text-slate-400 font-semibold uppercase text-[9px] font-mono">ID / Passport Reference</p>
                <p className="text-slate-800 font-bold mt-0.5">{user?.kycDetails?.idNumber || '9805125123081'}</p>
              </div>
              <div>
                <p className="text-slate-400 font-semibold uppercase text-[9px] font-mono">Issuing Jurisdiction</p>
                <p className="text-slate-800 font-bold mt-0.5">{user?.kycDetails?.country || 'South Africa'}</p>
              </div>
            </div>
          </div>

          <div className="text-center p-4 bg-slate-50 border border-slate-100 rounded-2xl text-[11px] text-slate-500 leading-relaxed font-sans">
            ✓ Complete compliance registration allows your wallet to use interest-backed backup credit cover ceilings up to <strong>{wallet ? new Intl.NumberFormat('en-ZA', { style: 'currency', currency: wallet.currency }).format(wallet.creditLimit) : 'R 1,500.00'}</strong>.
          </div>
        </motion.div>
      ) : (
        /* UNVERIFIED STATE FORM (Supports interactive click and drag-and-drop file upload) */
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Full Name */}
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1">
                <FileText className="w-3.5 h-3.5" /> Full Legal Name
              </label>
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full bg-slate-55 border border-slate-200 rounded-xl px-4 py-2.5 text-xs text-slate-850 focus:outline-none focus:border-peach-500 font-medium"
                placeholder="As it appears on ID card"
                required
              />
            </div>

            {/* Document Type */}
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1">
                <FileText className="w-3.5 h-3.5" /> Document Type
              </label>
              <select
                value={documentType}
                onChange={(e) => setDocumentType(e.target.value)}
                className="w-full bg-slate-55 border border-slate-200 rounded-xl px-4 py-2.5 text-xs text-slate-850 focus:outline-none focus:border-peach-500 font-medium cursor-pointer"
              >
                <option value="National ID">National Identity Document</option>
                <option value="Passport">Passport booklet</option>
                <option value="Drivers License">Drivers License Card</option>
              </select>
            </div>

            {/* ID Number */}
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1">
                <FileText className="w-3.5 h-3.5" /> Identity Number
              </label>
              <input
                type="text"
                value={idNumber}
                onChange={(e) => setIdNumber(e.target.value)}
                className="w-full bg-slate-55 border border-slate-200 rounded-xl px-4 py-2.5 text-xs text-slate-850 focus:outline-none focus:border-peach-500 font-medium"
                placeholder="ID Number (e.g. 9504235123081)"
                required
              />
            </div>

            {/* Country */}
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1">
                <Globe className="w-3.5 h-3.5" /> Issuing Country
              </label>
              <input
                type="text"
                value={country}
                onChange={(e) => setCountry(e.target.value)}
                className="w-full bg-slate-55 border border-slate-200 rounded-xl px-4 py-2.5 text-xs text-slate-850 focus:outline-none focus:border-peach-500 font-medium"
                placeholder="e.g. South Africa"
                required
              />
            </div>
          </div>

          {/* Drag & Drop File Upload Frame */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1">
              <Upload className="w-3.5 h-3.5" /> Proof of Identity Scan
            </label>
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={triggerFileSelect}
              className={`border-2 border-dashed rounded-2xl p-6 text-center transition cursor-pointer flex flex-col items-center justify-center space-y-2 ${
                isDragging
                  ? 'border-peach-500 bg-peach-50/30'
                  : uploadedFile
                  ? 'border-emerald-500 bg-emerald-50/10'
                  : 'border-slate-250 bg-slate-50/50 hover:bg-slate-100/50'
              }`}
            >
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                accept="image/*,application/pdf"
                className="hidden"
              />
              <div className={`p-2.5 rounded-xl ${uploadedFile ? 'bg-emerald-50 text-emerald-600' : 'bg-peach-50 text-peach-600'}`}>
                <Upload className="w-5 h-5" />
              </div>
              <div className="space-y-1">
                <p className="text-xs font-bold text-slate-700">
                  {uploadedFile ? `Selected: ${uploadedFile.name}` : 'Drag and drop your document file here'}
                </p>
                <p className="text-[10px] text-slate-450 leading-normal font-sans">
                  {uploadedFile ? `(${(uploadedFile.size / 1024).toFixed(1)} KB) - Click to change` : 'or browse files from your computer (PNG, JPG, PDF up to 5MB)'}
                </p>
              </div>
            </div>
          </div>

          {error && <div className="text-xs text-rose-600 bg-rose-50 border border-rose-100 p-3 rounded-xl font-semibold flex items-center gap-1.5"><AlertCircle className="w-4 h-4 shrink-0" />{error}</div>}
          {success && <div className="text-xs text-emerald-600 bg-emerald-55 border border-emerald-100 p-3 rounded-xl font-semibold flex items-center gap-1.5"><ShieldCheck className="w-4 h-4 shrink-0" />{success}</div>}

          <button
            type="submit"
            disabled={isLoading}
            className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-peach-600 hover:bg-peach-700 disabled:bg-slate-100 disabled:text-slate-400 text-white font-bold text-xs rounded-xl transition cursor-pointer shadow-sm uppercase tracking-wider"
          >
            {isLoading ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" /> Performing Compliance Checks...
              </>
            ) : (
              'Verify Identity and Activate Wallet'
            )}
          </button>
        </form>
      )}
    </div>
  );
}
