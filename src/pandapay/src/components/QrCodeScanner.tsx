import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'motion/react';
import { Camera, RefreshCw, AlertCircle, Sparkle, Scan, CheckCircle, HelpCircle } from 'lucide-react';

interface QrCodeScannerProps {
  onScan: (scannedValue: string) => void;
  title?: string;
}

export default function QrCodeScanner({ onScan, title = 'Scan QR Payment Pointer' }: QrCodeScannerProps) {
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [cameraError, setCameraError] = useState('');
  const [isCameraLoading, setIsCameraLoading] = useState(false);
  const [scannedResult, setScannedResult] = useState('');
  
  const videoRef = useRef<HTMLVideoElement>(null);

  // Quick fallback scan targets for standard testing
  const fallbackTargets = [
    { label: 'Scan Deposit Voucher Pointer ($voucher-250)', value: '$voucher-250' },
    { label: "Scan Peer Pointer ($nia)", value: '$nia' },
    { label: "Scan Merchant Pointer ($netflix)", value: '$netflix' }
  ];

  const startCamera = async () => {
    setCameraError('');
    setIsCameraLoading(true);
    try {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }

      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' }
      });
      
      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
    } catch (err: any) {
      console.warn('Camera blocked or unavailable:', err.message);
      setCameraError('Webcam blocked or unavailable. Using simulated QR scanning viewport fallback below!');
    } finally {
      setIsCameraLoading(false);
    }
  };

  useEffect(() => {
    startCamera();
    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  const handleSimulatedScan = (value: string) => {
    setScannedResult(value);
    // Simulate audio beep
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.frequency.setValueAtTime(880, audioCtx.currentTime); // high beep
      gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
      osc.start();
      osc.stop(audioCtx.currentTime + 0.15);
    } catch (e) {
      console.log('Audio feedback bypass');
    }
    
    setTimeout(() => {
      onScan(value);
      setScannedResult('');
    }, 1200);
  };

  return (
    <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 space-y-4" id="qr-scanner">
      <div className="flex items-center justify-between">
        <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5 uppercase font-sans">
          <Camera className="w-4 h-4 text-peach-700" /> {title}
        </span>
        {stream && (
          <button
            onClick={startCamera}
            className="p-1 hover:bg-slate-100 rounded text-slate-400 hover:text-slate-600 transition cursor-pointer"
            title="Refresh Camera Stream"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* Main Scanner viewport box */}
      <div className="relative w-full aspect-video bg-black rounded-xl overflow-hidden border border-slate-300 flex items-center justify-center">
        {scannedResult ? (
          /* Scanned alert animation */
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="absolute inset-0 bg-emerald-950/90 flex flex-col items-center justify-center text-white z-20 space-y-2 p-4 text-center"
          >
            <CheckCircle className="w-10 h-10 text-emerald-400 animate-bounce" />
            <p className="text-xs font-bold">QR Pointer Scanned!</p>
            <p className="text-[10px] font-mono bg-emerald-900/50 px-2 py-1 rounded text-emerald-300 select-all max-w-full truncate">{scannedResult}</p>
          </motion.div>
        ) : stream ? (
          /* Real stream output */
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className="w-full h-full object-cover transform scale-x-[-1]"
          />
        ) : (
          /* Fallback viewport screen if camera not available */
          <div className="flex flex-col items-center justify-center text-center p-6 space-y-2 text-slate-400">
            <Scan className="w-12 h-12 text-slate-600 animate-pulse" />
            {isCameraLoading ? (
              <p className="text-xs font-medium">Requesting camera permissions...</p>
            ) : (
              <>
                <p className="text-xs font-medium text-slate-300">Camera Feed Simulated</p>
                <p className="text-[10px] text-slate-500 max-w-xs leading-normal">Frame sandboxing might prevent live webcam access. Please use the fallback scan targets below to scan payment pointers instantly!</p>
              </>
            )}
          </div>
        )}

        {/* Decorative scanning sweep line */}
        {!scannedResult && (
          <div className="absolute inset-x-0 top-0 h-0.5 bg-gradient-to-r from-transparent via-emerald-400 to-transparent shadow-[0_0_8px_#34d399] animate-infinite duration-2000 pointer-events-none z-10" style={{
            animation: 'scanSweep 2.5s linear infinite'
          }}></div>
        )}

        {/* Viewfinder Corners */}
        <div className="absolute top-4 left-4 w-4 h-4 border-t-2 border-l-2 border-emerald-400 pointer-events-none"></div>
        <div className="absolute top-4 right-4 w-4 h-4 border-t-2 border-r-2 border-emerald-400 pointer-events-none"></div>
        <div className="absolute bottom-4 left-4 w-4 h-4 border-b-2 border-l-2 border-emerald-400 pointer-events-none"></div>
        <div className="absolute bottom-4 right-4 w-4 h-4 border-b-2 border-r-2 border-emerald-400 pointer-events-none"></div>
      </div>

      {cameraError && (
        <div className="text-[10px] text-slate-500 bg-slate-100 border border-slate-200 p-2.5 rounded-lg flex gap-1.5 leading-normal">
          <AlertCircle className="w-4 h-4 shrink-0 text-amber-600" />
          <span>{cameraError}</span>
        </div>
      )}

      {/* Fallback Simulator Selectors */}
      <div className="space-y-1.5">
        <span className="text-[10px] uppercase font-mono tracking-widest text-slate-400 font-bold flex items-center gap-1">
          <Sparkle className="w-3 h-3 text-peach-700 animate-spin" /> Simulated Scan Targets
        </span>
        <div className="grid grid-cols-1 gap-2">
          {fallbackTargets.map((tgt, i) => (
            <button
              key={i}
              type="button"
              onClick={() => handleSimulatedScan(tgt.value)}
              className="w-full text-left py-2 px-3 bg-white hover:bg-slate-100 border border-slate-200 rounded-xl text-[11px] font-semibold text-slate-700 hover:text-slate-900 transition flex items-center justify-between cursor-pointer"
            >
              <span>{tgt.label}</span>
              <span className="font-mono text-[9px] text-peach-700 bg-peach-50 px-1.5 py-0.5 rounded border border-peach-100">{tgt.value}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Custom keyframe styles inside component */}
      <style>{`
        @keyframes scanSweep {
          0% { top: 0%; }
          50% { top: 100%; }
          100% { top: 0%; }
        }
      `}</style>
    </div>
  );
}
