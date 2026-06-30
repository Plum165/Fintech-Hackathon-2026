# PandaPay — Open Payments Hackathon 2026

Interest-free split payments for the unbanked, powered by the **Interledger Protocol**.

---

## Repository Structure

```
├── assets/
│   ├── Logo.png
│   └── Payment Options.png
│
├── demo/
│   ├── Demo.mp4                              ← full product walkthrough
│   ├── Zeni.mp4                              ← zen-i consumer app demo
│   ├── REMMZ_Presentation_UCT hackathon 2026.pptx
│   ├── bnpl-demo-transcript.md              ← presenter script for BNPL QR demo
│   ├── OVERVIEW.md
│   └── README.md
│
├── docs/
│   ├── ACKNOWLEDGEMENTS.md                  ← all third-party libraries and APIs
│   ├── SETUP.md                             ← installation and run instructions
│   ├── USAGE.md                             ← feature guide and demo flow
│   ├── TEAM.md                              ← team members and roles
│   └── Flowchart.png                        ← system architecture diagram
│
├── scripts/
│   └── README.md
│
├── src/
│   ├── server/                              ← Express + TypeScript API (port 4000)
│   │   ├── data/db.json                     ← JSON file-based database
│   │   ├── services/interledger/            ← Open Payments SDK wrappers
│   │   ├── index.ts                         ← all API routes
│   │   ├── types.ts
│   │   ├── private.key                      ← ILP signing key (not committed)
│   │   └── .env                             ← env vars (not committed)
│   │
│   ├── zen-i/                               ← React 19 + Vite consumer app (port 5173)
│   │   ├── src/
│   │   │   ├── components/                  ← all UI panels (BNPL, Merchant, Wallet…)
│   │   │   ├── App.tsx
│   │   │   └── types.ts
│   │   ├── server.ts                        ← Express dev proxy → port 4000
│   │   └── vercel.json                      ← SPA rewrite rules for Vercel
│   │
│   └── merchant/                            ← standalone merchant portal (AI Studio scaffold)
│
├── vendor/
│   └── README.md
│
├── .editorconfig
├── .gitattributes
├── .gitignore
├── LICENSE
└── README.md                                ← this file
```

---

## Quick start

```bash
# Terminal 1 — backend
cd src/server && npm install && npm run dev

# Terminal 2 — frontend
cd src/zen-i && npm install && npm run dev
```

Open **http://localhost:5173**. See [docs/SETUP.md](docs/SETUP.md) for full setup including Interledger credentials.

---

## Documentation

| File | Contents |
|---|---|
| [docs/SETUP.md](docs/SETUP.md) | Prerequisites, `.env` templates, run commands |
| [docs/USAGE.md](docs/USAGE.md) | Feature guide and step-by-step demo flow |
| [docs/ACKNOWLEDGEMENTS.md](docs/ACKNOWLEDGEMENTS.md) | All third-party libraries, APIs, and protocols |
| [docs/TEAM.md](docs/TEAM.md) | Team members and roles |
| [demo/bnpl-demo-transcript.md](demo/bnpl-demo-transcript.md) | 2-min presenter script |

---

- [LinkedIn](https://www.linkedin.com/in/moegamatsamsodien/)
- [Portfolio](https://moegamat-samsodien-portfolio.vercel.app/)
