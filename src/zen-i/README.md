# zen-i — PandaPay Consumer App

React 19 + Vite frontend for the PandaPay Interledger platform. Includes the consumer wallet dashboard, BNPL checkout, and merchant QR portal.

In development, `server.ts` runs an Express wrapper that proxies `/api/*` to the consolidated backend (`src/server/`). In production the Vite build is served statically and all `/api/*` calls are forwarded to the deployed backend URL.

---

## Prerequisites

The **API server must be running first** on port 4000 before starting zen-i.

```bash
# Terminal 1 — start the backend
cd src/server
npm install
npm run dev

# Terminal 2 — start zen-i
cd src/zen-i
npm install
npm run dev
```

App opens at **[http://localhost:5173](http://localhost:5173)** (Vite default).

---

## Environment variables

Create `src/zen-i/.env` (optional — only needed to override the API target):

```env
# URL of the PandaPay API server.
# Defaults to http://localhost:4000 in dev if not set.
API_URL=http://localhost:4000

# Port for the Express wrapper (server.ts).
# Defaults to 3000 if not set.
PORT=5173
```

No Interledger or Gemini keys are needed here — those live entirely in the backend.

---

## Scripts

| Command | What it does |
|---|---|
| `npm run dev` | `tsx server.ts` — starts Express wrapper + Vite dev server |
| `npm run build` | `vite build` + bundles `server.ts` → `dist/server.cjs` |
| `npm run start` | Runs the compiled production bundle |

---

## Deep-link routing (`/pay/PAY-XXXXXX`)

Vite serves `index.html` for all unknown paths in dev (SPA fallback). In production, `vercel.json` rewrites every path to `/` so React handles the route.

When the app loads on `/pay/PAY-177663`, it:
1. Calls `GET /api/pay/PAY-177663` to fetch the merchant's payment request
2. Switches to the **BNPL** tab with the form pre-filled
3. Cleans the URL back to `/`

To generate a `PAY-XXXXXX` link, open **Merchant Portal** in the sidebar and fill in the checkout form.

---

## Features

| Tab | Description |
|---|---|
| Dashboard | Balance, confidence score, quick stats, upcoming BNPL payments |
| Deposit | Create an incoming ILP payment to top up your wallet |
| Send | Full Open Payments send flow — ILP payment to any `$pointer` |
| BNPL Splits | Buy now pay later — interest-free installment plans with optional real ILP payment to merchant |
| Merchant Portal | Generate `PAY-XXXXXX` QR codes for merchant checkout |
| Subscriptions | Recurring payment automation |
| Locked Reserves | Savings bucket with withdrawal controls |
| AI Coach | Zen the Panda — Gemini-powered financial assistant |
| Transactions | Full audit log with search and filters |

---

## Deployment (Vercel)

1. Connect the `src/zen-i` directory as the Vercel project root
2. Set **Build Command**: `npm run build`
3. Set **Output Directory**: `dist`
4. Add environment variable: `API_URL=https://your-backend.railway.app` (or wherever the server is deployed)
5. The included `vercel.json` handles SPA routing automatically

```json
{ "rewrites": [{ "source": "/(.*)", "destination": "/" }] }
```

---

## Architecture

```
Browser
  │
  │  HTTP / JSON
  ▼
Express wrapper — server.ts  (port 5173 dev / 3000 prod)
  │  /api/* proxy
  ▼
PandaPay API Server (port 4000)   ←── src/server/
  ├── Interledger Open Payments SDK
  └── Gemini AI
```
