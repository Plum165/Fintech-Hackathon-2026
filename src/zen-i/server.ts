/**
 * Zen-i frontend server.
 *
 * Dev:  Vite standalone server with /api proxy → http://localhost:4000
 * Prod: Express static + raw-body proxy to the central API server.
 *
 * The consolidated backend (src/server/) runs on port 4000 and handles
 * ALL api routes. This file is ONLY a thin frontend dev/prod server.
 *
 * Start the central API server first:
 *   cd src/server && npm run dev
 */

import dotenv from 'dotenv';
dotenv.config();

const PORT = parseInt(process.env.PORT ?? '5174', 10);
const API_TARGET = process.env.API_URL ?? 'http://localhost:4000';

async function start() {
  if (process.env.NODE_ENV === 'production') {
    const { default: express } = await import('express');
    const { default: path } = await import('path');

    const app = express();
    const distPath = path.join(process.cwd(), 'dist');

    app.use(express.static(distPath));

    // Proxy /api/* → central API server
    app.use('/api', async (req: any, res: any) => {
      const chunks: Buffer[] = [];
      req.on('data', (c: Buffer) => chunks.push(c));
      await new Promise(r => req.on('end', r));
      const body = Buffer.concat(chunks);

      try {
        const headers: Record<string, string> = { 'content-type': 'application/json' };
        if (req.headers.authorization) headers['authorization'] = req.headers.authorization;

        const resp = await fetch(`${API_TARGET}/api${req.url}`, {
          method: req.method,
          headers,
          body: body.length && req.method !== 'GET' && req.method !== 'HEAD' ? body : undefined
        });
        res.status(resp.status).json(await resp.json());
      } catch {
        res.status(502).json({ error: 'API server unreachable.' });
      }
    });

    app.get('*', (_req: any, res: any) => res.sendFile(path.join(distPath, 'index.html')));
    app.listen(PORT, '0.0.0.0', () =>
      console.log(`[Zen-i] Production → http://localhost:${PORT}  API: ${API_TARGET}`)
    );
  } else {
    // Dev: Vite standalone server — proxy config is honoured here (unlike middlewareMode)
    const { createServer } = await import('vite');
    const server = await createServer({
      server: {
        port: PORT,
        proxy: {
          '/api': { target: API_TARGET, changeOrigin: true }
        }
      }
    });
    await server.listen();
    console.log(`[Zen-i] Dev → http://localhost:${PORT}  API: ${API_TARGET}`);
    server.printUrls();
  }
}

start();
