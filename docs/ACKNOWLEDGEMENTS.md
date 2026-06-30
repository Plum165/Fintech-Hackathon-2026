# Acknowledgements

This document lists all **third-party repositories, modules, libraries, frameworks, APIs, and datasets** used in PandaPay.

---

## Backend — `src/server/`

| Name | Link / Repo | Author(s) | Usage |
|---|---|---|---|
| `@interledger/open-payments` | [github.com/interledger/open-payments](https://github.com/interledger/open-payments) | Interledger Foundation | Full Open Payments SDK — wallet discovery, incoming payments, quotes, outgoing payments, HTTP Message Signatures (RFC 9421 / GNAP) |
| `@google/genai` | [ai.google.dev](https://ai.google.dev) | Google | Gemini API client — AI financial coach (Zen the Panda), transaction categorisation |
| `express` | [expressjs.com](https://expressjs.com) | OpenJS Foundation | HTTP server framework — all REST API routes |
| `cors` | [github.com/expressjs/cors](https://github.com/expressjs/cors) | Troy Goode | Cross-origin request middleware |
| `dotenv` | [github.com/motdotla/dotenv](https://github.com/motdotla/dotenv) | Scott Motte | Environment variable loading |
| `tsx` | [github.com/privatenumber/tsx](https://github.com/privatenumber/tsx) | Hiroki Osame | TypeScript execution for Node.js (dev runner) |
| `esbuild` | [esbuild.github.io](https://esbuild.github.io) | Evan Wallace | Production bundler |
| `typescript` | [typescriptlang.org](https://www.typescriptlang.org) | Microsoft | Static typing |

---

## Frontend — `src/zen-i/`

| Name | Link / Repo | Author(s) | Usage |
|---|---|---|---|
| `react` / `react-dom` | [react.dev](https://react.dev) | Meta | UI component framework (v19) |
| `vite` | [vitejs.dev](https://vitejs.dev) | Evan You & contributors | Dev server and production bundler |
| `@vitejs/plugin-react` | [github.com/vitejs/vite-plugin-react](https://github.com/vitejs/vite-plugin-react) | Vite team | React Fast Refresh for Vite |
| `tailwindcss` | [tailwindcss.com](https://tailwindcss.com) | Tailwind Labs | Utility-first CSS framework |
| `@tailwindcss/vite` | [tailwindcss.com](https://tailwindcss.com) | Tailwind Labs | Vite integration for Tailwind v4 |
| `lucide-react` | [lucide.dev](https://lucide.dev) | Lucide contributors | Icon library |
| `motion` | [motion.dev](https://motion.dev) | Matt Perry | Animation library (Framer Motion successor) |
| `express` | [expressjs.com](https://expressjs.com) | OpenJS Foundation | Dev proxy server (`server.ts`) forwarding `/api/*` to backend |
| `dotenv` | [github.com/motdotla/dotenv](https://github.com/motdotla/dotenv) | Scott Motte | Environment variable loading |
| `@google/genai` | [ai.google.dev](https://ai.google.dev) | Google | Gemini client (shared with backend) |
| `esbuild` / `tsx` / `typescript` | (see backend table) | — | Same build toolchain |

---

## APIs & External Services

| Name | Link / Docs | Usage |
|---|---|---|
| Interledger Test Wallet | [wallet.interledger-test.dev](https://wallet.interledger-test.dev) | Hosted ILP test wallet — server wallet credentials, incoming/outgoing payment endpoints |
| Gemini API | [ai.google.dev/gemini-api](https://ai.google.dev/gemini-api/docs) | AI financial coach responses and transaction categorisation |
| QR Server | [goqr.me / api.qrserver.com](https://goqr.me/api/) | Free public QR code image generation for merchant payment links |

---

## Protocols & Standards

| Name | Link | Usage |
|---|---|---|
| Open Payments (Interledger) | [openpayments.dev](https://openpayments.dev) | Payment discovery, grant negotiation, incoming/outgoing payment creation |
| HTTP Message Signatures (RFC 9421) | [datatracker.ietf.org/doc/rfc9421](https://datatracker.ietf.org/doc/rfc9421/) | Request signing for all ILP resource server calls |
| GNAP (Grant Negotiation and Authorization Protocol) | [openpayments.dev/introduction/grants](https://openpayments.dev/introduction/grants/) | Interactive grant flow for outgoing payment approval |
