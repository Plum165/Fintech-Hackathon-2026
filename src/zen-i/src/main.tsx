import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';

// When deployed to Vercel (or any host other than localhost), set VITE_API_URL
// to the Cloudflare tunnel URL so all /api/* calls reach the local backend.
// In dev, VITE_API_URL is empty → relative /api/* → Vite proxy → localhost:4000.
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
    <App />
  </StrictMode>,
);
