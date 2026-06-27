# 💳 PandaPay Interledger

PandaPay is an elegant, full-stack, production-ready fintech dashboard powered by the **Interledger Protocol (ILP)**, offering automated smart budget tracking, advanced transaction auditing, and real-time AI-powered financial coaching. 

Guided by **Zen the Panda** 🐼, our embedded financial assistant, PandaPay brings the future of open-payments, micro-transactions, and cognitive budget planning together in a beautifully crafted user interface.

---

## ✨ Core Features

### 📡 Interledger Protocol (ILP) Open Payments
* *Simulated Ledger Routing*: Full simulated end-to-end sandbox implementation of ILP payment pointers (e.g., `$ilp.interledger-test.dev/username`).
* *Secure Payment Grants*: Automatic secure backend negotiation of incoming and outgoing payment grants based on Interledger Specifications.
* *Instant Deposits*: Real-time incoming payment resolution, ledger balance updates, and interactive QR Code generation for deposit authorization.
* *Intelligent Quotes*: Interactive peer-to-peer quoting engine that negotiates currency routing and transfer parameters prior to final ledger consensus.

### 📊 Smart Budget Tracker (CRUD)
* *Custom Budget Allocations*: Create, update, and remove personalized budget categories with responsive color controls and specific spending ceilings.
* *Automated AI Transaction Categorization*: Direct natural language description parser that automatically routes every outbound payment to its corresponding budget category.
* *Real-time Spending Meters*: Interactive gauge indicators that visualize the remaining runway for your monthly limits.

### 💬 "Consult Zen" AI Financial Mascot (Gemini 3.5)
* *Contextual Conversation*: Zen 🐼 has complete awareness of your current wallet balance, ledger transactions, and spending targets to provide hyper-personalized saving suggestions.
* **Proactive Runway Insights**: Automated smart summaries parsing your current spending behaviors to alert you of potential budget overshoots.

### 🔍 Advanced Ledger History & Filtering
* **Dynamic Auditing**: Full-featured payment logs containing search operators, transaction type classification (deposit/outbound), and execution status tags.
* **Interval Filters**: Granular date-range selectors allowing you to drill down into historical financial activity.

---

## 🛠️ Tech Stack

PandaPay is built on a high-performance **Full-Stack (Client + Server) Architecture** leveraging modern tools for modularity and speed:

### 💻 Frontend (Client-Side)
* **React 19**: Powered by functional components, custom state management hooks, and structured context providers.
* **Vite 6**: High-speed, modern bundler optimized for instantaneous local execution and lightning-fast client building.
* **Tailwind CSS 4**: Modern utility-first CSS engine for modular component designs, high-contrast layouts, and responsive fluid grids.
* **Motion**: Fluid route/tab transitions and micro-interactions for polished interactive states.
* **Lucide React**: Clean and recognizable standard vector icon sets.

### ⚙️ Backend (Server-Side)
* **Node.js Express**: Robust backend router handling all API endpoints, session tokens, security validation, and Interledger services safely.
* **TypeScript & tsx**: Fully type-safe backend development executing direct TypeScript transpilation in dev mode.
* **esbuild**: Enterprise-grade build compiler compiling server-side TypeScript into a singular, highly efficient CommonJS bundle (`dist/server.cjs`) for production.

### 🤖 Artificial Intelligence
* **@google/genai SDK**: Modern, server-side Google GenAI client leveraging the high-speed **Gemini** models to perform classification, financial summarization, and chat interactions securely.

### 💾 Persistence & Storage
* **Local File DB**: A robust JSON database with instant read/write transactions and centralized event/audit logger tracking all interledger events.

---

## 🏗️ Architecture

PandaPay strictly decouples private API operations from the client browser:

```
                  ┌──────────────────────────────────────────┐
                  │                 Browser                  │
                  │   [React 19 / Motion / Tailwind CSS]     │
                  └────────────────────┬─────────────────────┘
                                       │ Secure HTTP / JSON
                                       ▼
                  ┌──────────────────────────────────────────┐
                  │          Express Backend Router          │
                  │       [Port 3000 / Node.js ESM]          │
                  └────┬───────────────────────────────┬─────┘
                       │                               │
                       ▼                               ▼
       ┌───────────────────────────────┐       ┌───────────────────────────────┐
       │     Google Gemini API (AI)    │       │   Interledger Open Payments   │
       │    [Budget Insights & Zen]    │       │   [Grants, Quotes, Pointers]  │
       └───────────────────────────────┘       └───────────────────────────────┘
```

---

## 📦 Installation & Local Development

### 1. Prerequisite Environment
Create a `.env` file based on `.env.example`:
```env
GEMINI_API_KEY=your_gemini_api_key_here
```

### 2. Dependency Setup
Install dependencies from `package.json`:
```bash
npm install
```

### 3. Start Development Server
Boot both the Express server and Vite middleware simultaneously:
```bash
npm run dev
```
The application will be accessible locally on [http://localhost:3000](http://localhost:3000).

### 4. Build for Production
Bundle the client SPA and compile the TypeScript backend:
```bash
npm run build
```

### 5. Run in Production Mode
Launch the compiled self-contained bundle:
```bash
npm run start
```

---

## 🔒 Security Practices
* **Zero Client Secrets**: All external integrations, including the **Gemini API Key**, are handled strictly on the server-side (`server.ts`).
* **Lazy SDK Initialization**: The Google GenAI SDK client is instantiated strictly on-demand, preventing server startup crashes if credentials are temporarily absent.
* **Sandboxed Open Payments Simulation**: The Interledger layer fully abstracts live wallet networks to offer a risk-free development workspace.
