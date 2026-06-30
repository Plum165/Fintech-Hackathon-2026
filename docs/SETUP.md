# PandaPay — Setup Instructions

---

## Requirements

| Tool | Version | Install |
|---|---|---|
| Node.js | v18 or later | [nodejs.org](https://nodejs.org) |
| npm | v9 or later | bundled with Node |
| Git | any recent | [git-scm.com](https://git-scm.com) |

> **Interledger credentials (optional):** Without them the server runs in simulation mode — all ILP calls return mock data and the full UI still works. See the _Interledger credentials_ section below if you want real payments.

---

## Installation

```bash
# 1. Clone the repository
git clone <repo-url>
cd <repo-name>

# 2. Install backend dependencies
cd src/server
npm install

# 3. Install frontend dependencies
cd ../zen-i
npm install
```

---

## Environment variables

### Backend — `src/server/.env`

Create this file before starting the server:

```env
# ── Interledger Open Payments (leave blank to use simulation mode) ───────────
SERVER_WALLET_ADDRESS=
KEY_ID=
PRIVATE_KEY_PATH=          # defaults to src/server/private.key if not set

# ── AI (Gemini) ──────────────────────────────────────────────────────────────
GEMINI_API_KEY=

# ── Server ───────────────────────────────────────────────────────────────────
PORT=4000
```

### Frontend — `src/zen-i/.env` (optional)

```env
# Only needed if the backend is NOT on localhost:4000
API_URL=http://localhost:4000
PORT=5173
```

---

## Interledger credentials (optional)

1. Go to [wallet.interledger-test.dev](https://wallet.interledger-test.dev) and register a wallet (e.g. `pandapay`)
2. Open **Settings → Developer Keys → Add public key**
3. Click **Generate key pair** — download the private key file
4. Save the private key as `src/server/private.key`
5. Copy the **Key ID** into `src/server/.env` → `KEY_ID`
6. Set `SERVER_WALLET_ADDRESS` to `$ilp.interledger-test.dev/yourname`

---

## Running the project

Start the backend first, then the frontend — each in its own terminal:

```bash
# Terminal 1 — backend (port 4000)
cd src/server
npm run dev

# Terminal 2 — frontend (port 5173)
cd src/zen-i
npm run dev
```

Open **[http://localhost:5173](http://localhost:5173)** in your browser.

---

## Scripts reference

### Backend (`src/server/`)

| Command | What it does |
|---|---|
| `npm run dev` | Live-reload dev server via `tsx --watch` |
| `npm run build` | Bundle to `dist/index.cjs` via esbuild |
| `npm run start` | Run the compiled production bundle |

### Frontend (`src/zen-i/`)

| Command | What it does |
|---|---|
| `npm run dev` | Express wrapper + Vite dev server |
| `npm run build` | Vite production build + bundle server |
| `npm run start` | Run the compiled production bundle |

---

## Resetting data

All app state is stored in `src/server/data/db.json`. Delete that file and restart the server to reset to a clean state (the file is re-created automatically with default accounts on startup).
