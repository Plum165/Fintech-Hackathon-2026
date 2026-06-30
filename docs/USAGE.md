# Zeni — Usage Guide

---

## Running the application

```bash
# Terminal 1 — backend (must start first)
cd src/server && npm run dev

# Terminal 2 — frontend
cd src/zen-i && npm run dev
```

Open **[http://localhost:5173](http://localhost:5173)**

---

## Creating an account

1. Click **Register** on the login screen
2. Enter your name, email, and a wallet pointer (e.g. `$ilp.interledger-test.dev/yourname`)
3. Accept the terms to complete setup — you land on your dashboard with a starting balance

---

## Core features

### Dashboard
Shows your current balance, financial confidence score, upcoming BNPL installments, and a quick transaction summary.

### Deposit
Creates an incoming Interledger payment to top up your wallet. Enter an amount and currency — the server runs the full Open Payments incoming payment grant flow.

### Send (Interledger payment)
Send money to any `$wallet-pointer`:
1. Enter the recipient's wallet pointer and amount
2. The server fetches the wallet, creates an incoming payment on their side, gets a quote, and requests an outgoing payment grant
3. Approve the grant in your Interledger wallet (link provided)
4. Return and click **Execute** — payment settles via ILP

### BNPL Splits (Buy Now Pay Later)
Interest-free installment plans:
1. Go to **BNPL Splits → New Checkout**
2. Enter merchant name, item description, total amount, and number of splits
3. Optionally paste the merchant's `$wallet-pointer` for a real ILP payment
4. Sign the installment contract electronically
5. If a wallet pointer was provided, approve the first-installment grant in your ILP wallet then return and click **Execute Payment**
6. View your active plan under **My Split Plans**

### Merchant Portal — QR checkout
Merchants generate a scannable QR code that pre-fills a customer's BNPL checkout:
1. Go to **Merchant Portal**
2. Fill in your business name, ILP wallet pointer, item, price, and number of splits
3. Click **Generate QR Code** — a `PAY-XXXXXX` link is created
4. Customer scans the QR → zen-i opens with the checkout form pre-filled
5. Customer completes the BNPL flow as above

### AI Coach (Zen the Panda)
Gemini-powered financial assistant. Ask questions about your spending, get savings tips, or request budget advice. Requires `GEMINI_API_KEY` in `src/server/.env`.

### Subscriptions
Set up recurring payment schedules tracked in the dashboard.

### Locked Reserves
Create savings buckets with withdrawal controls to ringfence money for a specific goal.

### Transactions
Full audit log with search and date filters.

---

## Demo flow (judges)

| Step | Who | Action |
|---|---|---|
| 1 | Merchant (Zahra) | Open Merchant Portal, fill in item + price, generate QR |
| 2 | Customer (Misha) | Scan QR or paste the link — BNPL form opens pre-filled |
| 3 | Misha | Review splits, advance to Sign step |
| 4 | Misha | Type name as electronic signature, check consent, click Sign & Initiate |
| 5 | Misha | Click the approval link → approve grant in ILP wallet |
| 6 | Misha | Return to app, click I've Approved — Execute Payment |
| 7 | Both | Confirmation ticket appears; Zanele's wallet receives first installment |

---

## Demo video and presentation

- [Demo video](../demo/demo.mp4)
- [Demo presentation](../demo/demo.pptx)
- [Demo transcript](../demo/bnpl-demo-transcript.md)

---

## Notes

- **Simulation mode:** If no Interledger credentials are configured, all ILP steps run as simulated mock calls. The UI behaves identically — real payments just skip the wallet-approval step.
- **Data reset:** Delete `src/server/data/db.json` and restart the server to reset all accounts and balances.
- **SPA deep links:** The URL `/pay/PAY-XXXXXX` is handled by the React app — no server-side route is needed in dev. On Vercel, `src/zen-i/vercel.json` rewrites all paths to `/` automatically.
