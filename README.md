# 🛡️ VeriSettle — Verifiably Settled Web3 Off-Ramp
### 🏆 Built for Telegraph Protocol Hackathon — Track 3: Applications
> *"Verified Intelligence Before Value Moves."*

[![Telegraph Protocol](https://img.shields.io/badge/Telegraph%20Protocol-Track%203%20Application-06b6d4?style=for-the-badge&logo=satellite)](https://telegraphprotocol.com)
[![License: MIT](https://img.shields.io/badge/License-MIT-34d399.svg?style=for-the-badge)](https://opensource.org/licenses/MIT)
[![Next.js 14](https://img.shields.io/badge/Next.js-14.2-white?style=for-the-badge&logo=nextdotjs)](https://nextjs.org)
[![Solana](https://img.shields.io/badge/Solana-Devnet-9945FF?style=for-the-badge&logo=solana)](https://solana.com)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-3178C6?style=for-the-badge&logo=typescript)](https://www.typescriptlang.org)

> **VeriSettle** is a decentralized, cryptographically verified fiat off-ramp engine that leverages **Telegraph Protocol's decentralized miner network** to solve oracle manipulation, counterparty exploits, and opaque cross-border settlements.

---

## ⚡ The Problem: Why Web3 Off-Ramping is Broken

Cross-border crypto-to-fiat settlements (e.g., SOL/USDC to INR) face critical systemic vulnerabilities:
1. **Centralized Oracle Manipulation**: Single-source price feeds are susceptible to flash loan exploits and stale quotes.
2. **Opaque Counterparty Risk**: Traditional off-ramps rely on slow, centralized AML databases that fail to detect Sybil clusters or fresh drainer wallets.
3. **No Verifiable Proof of Settlement**: If a trade fails or rates slip, neither party has a tamper-proof cryptographic audit trail.
4. **Forex Front-Running**: Traders face predatory slippage and unverified FX spreads.

---

## 🚀 The Solution: VeriSettle + Telegraph Protocol

VeriSettle solves this by routing every settlement step through **Telegraph Protocol's decentralized miner subnets**. Instead of relying on a centralized intermediary, VeriSettle achieves **multi-miner consensus** on prices, forex rates, AI fraud checks, solvency proofs, and market sentiment before executing a guaranteed rate-locked settlement.

```
                           ┌─────────────────────────────────────┐
                           │      VeriSettle Client (Next.js)    │
                           └──────────────────┬──────────────────┘
                                              │
                      ┌───────────────────────┴───────────────────────┐
                      ▼                                               ▼
         [ 1. Multi-Miner Quote ]                           [ 2. Risk Screening ]
         • Subnet 101: Crypto Price                         • Subnet 102: Groq LLM Fraud
         • Subnet 101: USD/INR FX                           • Subnet 103: Wallet Solvency
         • Consensus: Weighted Median                       • Subnet 104: Gas Congestion
         • 60-Second Rate Lock                              • Subnet 105: News Sentiment
                      │                                               │
                      └───────────────────────┬───────────────────────┘
                                              │
                                              ▼
                                 [ 3. Verified Settlement ]
                                 • 5-Signal Composite Risk Score
                                 • SHA-256 Merkle Proof Chain
                                 • Verifiable Audit Bundle
```

---

## 💎 Key Features & Innovations

### 1. 🌐 Multi-Subnet Telegraph Intelligence (6 Intents)
IndoCrypt queries miners across **6 decentralized intelligence domains**:
- **`CRYPTO_PRICE` (Subnet 101)**: Decentralized spot pricing for SOL, USDC, and USDT.
- **`CURRENCY_EXCHANGE` (Subnet 101)**: Real-time USD/INR forex conversion rates.
- **`FRAUD_DETECTION` (Subnet 102)**: Groq-accelerated LLM intelligence screening addresses against sanction lists, known drainers, and sybil patterns.
- **`WALLET_BALANCE_CHECK` (Subnet 103)**: On-chain proof of liquidity pool reserves and counterparty balance.
- **`GAS_PRICE` (Subnet 104)**: Live priority fees to detect front-running and congestion spikes.
- **`NEWS_SEARCH` (Subnet 105)**: Real-time regulatory alerts & sentiment analysis.

### 2. ⚖️ Weighted Multi-Miner Consensus & Divergence Detection
- Queries 3+ independent Telegraph miners per intent simultaneously.
- Ranks miners by historical confidence and latency weights.
- Automatically detects and flags price or fraud divergence (>20% disagreement between miners).

### 3. 🛡️ 5-Signal Composable Risk Engine
A transparent, explainable scoring model (0–100):
- **Groq LLM Risk (35%)** + **Solvency Tier (25%)** + **Transaction Velocity (15%)** + **Network Gas (15%)** + **Market News Sentiment (10%)**.
- **$\le 40$**: `auto_approve` • **$41-70$**: `hold_for_review` • **$> 70$**: `auto_deny`.

### 4. 🔗 Cryptographic Audit Proof Bundle
Every transaction generates an immutable **SHA-256 state proof bundle** sealing:
- Transaction Intent ID
- Individual miner response hashes & signatures
- Rate-lock timestamp and consensus spread
- Groq AI risk rationale

### 5. 🎨 Stunning Cyberpunk / FinTech UI
- **Live Animated Pipeline**: Real-time SVG visualization showing stages pulse cyan, green, and amber.
- **Terminal Miner Activity Log**: Auto-scrolling ticker displaying real-time miner IDs, latencies, and x402 payment hashes.
- **Dynamic Risk Gauge**: Circular canvas gauge with animated score sweeps and signal breakdown cards.
- **Telegraph Analytics Dashboard**: Protocol-wide volume, miner latency histograms, subnet utilization stats, and audit ledgers.

---

## ⚙️ Telegraph Connection Modes

IndoCrypt features a production-ready **Hybrid Client** (`app/lib/telegraph/client.ts`):

- **`live`**: Connects directly to real Telegraph Protocol miners using `TELEGRAPH_API_BASE` and `TELEGRAPH_API_KEY`.
- **`hybrid` (Default)**: Attempts live Telegraph miner calls first; gracefully falls back to synthetic miners with an audit flag if a subnet is unreachable or unconfigured. Ensures zero downtime during demos.
- **`mock`**: Fully deterministic offline mode for local development and CI testing.

---

## 🚀 Quick Start

### 1. Clone & Install Dependencies
```bash
git clone https://github.com/aryanshah012/Car-Price-Predictor.git indocrypt
cd indocrypt
npm install
```

### 2. Configure Environment
```bash
cp .env.example .env
```
Edit `.env`:
```env
DATABASE_URL="postgresql://postgres:password@localhost:5432/indocrypt"
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="secret-key-123456"

# Telegraph Hackathon Mode
TELEGRAPH_MODE="hybrid"
TELEGRAPH_API_BASE="https://api.telegraphprotocol.com"
TELEGRAPH_API_KEY="your-telegraph-api-key"
```

### 3. Initialize Database
```bash
npx prisma generate
npx prisma db push
```

### 4. Run Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) to launch the application.

---

## 🧪 Interactive Hackathon Demos

1. **Successful Off-Ramp Flow**:
   - Navigate to **Verified Off-Ramp** (`/settlement`).
   - Enter `10 SOL` and select an approved destination.
   - Observe live multi-miner quote consensus, 60s rate-lock, Groq risk score (<25), and instant cryptographic settlement.

2. **AI Fraud Detection (Denial Path)**:
   - Enter a counterparty address containing `scam` or `drainer` (e.g. `scam_drainer_4981`).
   - The Groq LLM miner flags the transaction with elevated risk score (>75), automatically aborting the settlement and logging the audit proof.

3. **Rate Lock Expiry Protection**:
   - Request a quote and wait 60 seconds. The countdown expires and the settlement button locks, preventing slippage exploits.

4. **Telemetry & Proofs**:
   - Navigate to `/analytics` to inspect real-time miner latencies, consensus agreement percentages, and recent settlement logs.

---

## 📁 Repository Structure

```
├── app/
│   ├── analytics/                # Real-time telemetry & protocol dashboard
│   ├── api/
│   │   ├── analytics/            # Protocol metrics aggregation API
│   │   ├── settlement/
│   │   │   ├── quote/            # Multi-miner price + FX consensus
│   │   │   ├── screen/           # 5-signal risk evaluation
│   │   │   ├── execute/          # Rate-locked settlement & proof generation
│   │   │   └── history/          # User audit trail API
│   ├── components/
│   │   ├── AnalyticsDashboard.tsx# Subnet metrics & miner stats
│   │   ├── MinerCallLog.tsx      # Terminal-style miner feed
│   │   ├── PipelineViz.tsx       # Animated SVG pipeline
│   │   ├── RiskGauge.tsx         # Circular risk score gauge
│   │   ├── SettlementFlow.tsx    # Hero off-ramp state machine
│   │   └── TransactionHistory.tsx# Verifiable settlement ledger
│   └── lib/
│       ├── risk/                 # 5-signal risk engine & velocity tracker
│       ├── settlement/           # State machine & rate-lock guards
│       └── telegraph/            # Hybrid client, adapters & orchestrator
└── SETTLEMENT_ENGINE.md          # Full technical architecture specification
```

---

## 🏅 Hackathon Track 3 Alignment

| Judging Criteria | How IndoCrypt Delivers |
| :--- | :--- |
| **Real Telegraph Miner Usage** | Integrates 6 distinct intents across Subnets 101–105 with multi-miner parallel polling and x402 payment support. |
| **Creativity & Novelty** | Solves Web3's hardest UX barrier: trustless, verified fiat off-ramping with on-chain consensus. |
| **Technical Depth** | Multi-miner weighted consensus, circuit breakers, 5-signal risk scoring, and SHA-256 Merkle proof chains. |
| **User Experience & UI** | Cyberpunk dark glassmorphism, animated real-time SVG pipelines, live terminal miner streams, and interactive gauges. |
| **Adoption & Completeness** | Full end-to-end off-ramp flow, transaction history ledger, and public analytics dashboard. |

---

## 📄 License
MIT © 2026 IndoCrypt Team. Built with ❤️ for the Telegraph Protocol Hackathon.
