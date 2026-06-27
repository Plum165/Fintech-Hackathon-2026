import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import PaymentInterface from './paymentInterface.tsx';
import './frontend/css/style.css';

// When deployed to Vercel, set VITE_API_URL to the Cloudflare tunnel URL.
// In dev this is empty → relative /api/* → Vite proxy → localhost:4000.
const API_BASE = import.meta.env.VITE_API_URL ?? '';
if (API_BASE) {
  const _fetch = globalThis.fetch.bind(globalThis);
  globalThis.fetch = (input, init) => {
    if (typeof input === 'string' && input.startsWith('/api/')) {
      input = API_BASE + input;
    }
    return _fetch(input, init);
  };
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <PaymentInterface />
  </StrictMode>,
);
