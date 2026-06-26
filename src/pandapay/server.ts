/**
 * PandaPay frontend server.
 *
 * Dev:  Vite standalone server with /api proxy → http://localhost:4000
 * Prod: Express static + raw-body proxy to the central API server.
 *
 * Start the central API server first:
 *   cd src/server && npm run dev
 */

import dotenv from 'dotenv';
dotenv.config();

const PORT = parseInt(process.env.PORT ?? '3000', 10);
const API_TARGET = process.env.API_URL ?? 'http://localhost:4000';

async function start() {
  if (process.env.NODE_ENV === 'production') {
    const { default: express } = await import('express');
    const { default: path } = await import('path');
    const { fileURLToPath } = await import('url');

    const __dirname = path.dirname(fileURLToPath(import.meta.url));
    const app = express();
    const distPath = path.join(__dirname, 'dist');

    app.use(express.static(distPath));

    // Proxy /api/* → central server
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
      console.log(`[PandaPay] Production → http://localhost:${PORT}  API: ${API_TARGET}`)
    );
  } else {
    // Dev: Vite standalone server — proxy works natively here
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
    console.log(`[PandaPay] Dev → http://localhost:${PORT}  API: ${API_TARGET}`);
    server.printUrls();
  }
}

start();
