# PandaPay — API Server

Express + TypeScript backend that powers both the **zen-i** consumer app and the merchant portal. Runs on **port 4000** by default.

---

## Quick start

```bash
cd src/server
npm install
npm run dev          # tsx --watch (live reload)
```

Server is ready at `http://localhost:4000`. The zen-i Vite dev server proxies all `/api/*` requests there automatically.

---

## Environment variables

Create `src/server/.env` (copy the block below):

```env
# ── Interledger Open Payments ───────────────────────────────────────────────
# Your server wallet on https://wallet.interledger-test.dev
# e.g. $ilp.interledger-test.dev/pandapay
SERVER_WALLET_ADDRESS=

# Key ID shown on the wallet's Developer Keys page after you upload your public key
KEY_ID=

# Optional: absolute path to your private key file.
# Defaults to src/server/private.key if not set.
PRIVATE_KEY_PATH=

# ── AI (Gemini) ─────────────────────────────────────────────────────────────
GEMINI_API_KEY=

# ── Server ───────────────────────────────────────────────────────────────────
PORT=4000

# Optional: comma-separated extra origins allowed by CORS
# (localhost:5173 and localhost:5174 are always allowed in dev)
# ALLOWED_ORIGINS=https://zen-i.vercel.app,https://zen-i.co.za
```

### Getting your Interledger credentials

1. Go to [wallet.interledger-test.dev](https://wallet.interledger-test.dev) and create a wallet (e.g. `pandapay`)
2. Open **Settings → Developer Keys → Add public key**
3. Click **Generate key pair** — download the private key file
4. Save it as `src/server/private.key`
5. Copy the Key ID into `.env` as `KEY_ID`
6. Set `SERVER_WALLET_ADDRESS` to `$ilp.interledger-test.dev/yourname`

If `SERVER_WALLET_ADDRESS` or `KEY_ID` are missing/placeholder, or `private.key` does not exist, the server automatically falls back to **simulation mode** — all ILP calls return mock data so the app still works end-to-end.

---

## Scripts

| Command | What it does |
|---|---|
| `npm run dev` | `tsx --watch index.ts` — live-reload dev server |
| `npm run build` | Bundles to `dist/index.cjs` via esbuild |
| `npm run start` | Runs the compiled bundle (production) |

---

## API surface

### Auth
| Method | Path | Description |
|---|---|---|
| POST | `/api/auth/login` | Login by email or `$pointer` |
| POST | `/api/auth/register` | Create account |
| POST | `/api/auth/consent` | Accept terms (stores session) |
| GET | `/api/auth/me` | Current user + wallet |

### Payments
| Method | Path | Description |
|---|---|---|
| POST | `/api/payments/deposit` | Create incoming ILP payment (deposit) |
| POST | `/api/payments/send/initiate` | Steps 3–6: incoming payment → quote → interactive grant |
| POST | `/api/payments/send/execute` | Step 8: finalise grant + create outgoing payment |
| POST | `/api/payments/quote` | Quick price estimate |
| GET | `/api/transactions` | Paginated transaction history |

### BNPL (Buy Now Pay Later)
| Method | Path | Description |
|---|---|---|
| GET | `/api/bnpl/contracts` | List user's split-payment contracts |
| POST | `/api/bnpl/checkout` | Create BNPL contract; runs ILP initiate if `merchantPointer` supplied |
| POST | `/api/bnpl/execute` | Finalise ILP payment + activate contract after wallet approval |
| POST | `/api/bnpl/repay/:contractId/:installmentId` | Pay an individual installment |

### Merchant payment requests
| Method | Path | Description |
|---|---|---|
| POST | `/api/pay/create` | Merchant creates a `PAY-XXXXXX` request (stored in DB) |
| GET | `/api/pay/:id` | Public lookup — returns payment details for QR checkout |

### Other
| Method | Path | Description |
|---|---|---|
| GET | `/api/health` | OP credentials status + wallet reachability |
| GET/POST/PUT/DELETE | `/api/budget/*` | Budget categories + allocations |
| GET/POST/DELETE | `/api/subscriptions/*` | Recurring payment subscriptions |
| GET/POST | `/api/reserve/*` | Locked savings bucket |
| POST | `/api/credit/repay` | Repay credit balance |
| POST | `/api/ai/chat` | Zen AI financial chat (Gemini) |
| GET | `/api/wallet/pointer` | Server wallet pointer info |

---

## Data persistence

All data lives in `src/server/data/db.json` (auto-created on first run). The file is **not** committed to git. To reset state, delete it and restart the server.

---

## Architecture

```
zen-i Vite (port 5174)
        │
        │  /api/* proxy
        ▼
Express server (port 4000)
        ├── Auth + session (db.json)
        ├── @interledger/open-payments SDK
        │       └── ilp.interledger-test.dev
        └── @google/genai
                └── Gemini (AI chat + categorisation)
```
