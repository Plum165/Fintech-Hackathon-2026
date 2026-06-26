/**
 * Merchant frontend dev server.
 *
 * API calls are proxied to the consolidated backend at http://localhost:4000.
 * Run the central server first: cd src/server && npm run dev
 */

import express from 'express';
import dotenv from 'dotenv';
import { createServer as createViteServer } from 'vite';
import path from 'path';

dotenv.config();

const PORT = 5689;
const API_TARGET = process.env.API_URL ?? 'http://localhost:4000';

async function start() {
  const app = express();

  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        proxy: {
          '/api': {
            target: API_TARGET,
            changeOrigin: true
          }
        }
      },
      appType: 'spa'
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.use('/api', async (req, res) => {
      const url = `${API_TARGET}${req.url}`;
      try {
        const resp = await fetch(url, {
          method: req.method,
          headers: {
            'content-type': 'application/json',
            ...(req.headers.authorization ? { authorization: req.headers.authorization } : {})
          },
          body: ['GET', 'HEAD'].includes(req.method) ? undefined : JSON.stringify(req.body)
        });
        const data = await resp.json();
        res.status(resp.status).json(data);
      } catch {
        res.status(502).json({ error: 'API server unreachable.' });
      }
    });
    app.get('*', (_req, res) => res.sendFile(path.join(distPath, 'index.html')));
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[Merchant Frontend] http://localhost:${PORT}  →  API: ${API_TARGET}`);
  });
}

start();
