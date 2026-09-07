# IndoCrypt Verified Settlement & Risk Engine
### Technical Specification • Built for Telegraph Protocol Hackathon Track 3

IndoCrypt implements a production-grade, decentralized verified settlement pipeline that uses **Telegraph Protocol's decentralized miner network** to solve the primary failure modes of cross-border Web3 off-ramps: oracle manipulation, front-running, fraudulent counterparty exploits, and opaque settlement audits.

---

## 🏗️ System Architecture

```
                                  [ User / API Client ]
                                            │
                                            ▼
                           ┌─────────────────────────────────┐
                           │   Verified Settlement API       │
                           │   (/api/settlement/*)           │
                           └────────────────┬────────────────┘
                                            │
                ┌───────────────────────────┴───────────────────────────┐
                ▼                                                       ▼
┌───────────────────────────────┐                       ┌───────────────────────────────┐
│     Telegraph Client Core     │                       │     Composable Risk Engine    │
│  (Live / Hybrid / Fallback)   │                       │  (5-Signal Multi-Dimensional) │
├───────────────────────────────┤                       ├───────────────────────────────┤
│ • Circuit Breaker per subnet  │                       │ 1. Groq LLM Fraud Classifier  │
│ • Exponential Backoff & Retry │                       │ 2. On-Chain Solvency Tier     │
│ • x402 Payment Challenge Spec │                       │ 3. Network Gas Congestion     │
│ • Subnet Routing (101-105)    │                       │ 4. Market & Regulatory News   │
└───────────────┬───────────────┘                       │ 5. Account Velocity Abuse     │
                │                                       └───────────────┬───────────────┘
                ▼                                                       │
┌───────────────────────────────┐                                       ▼
│ Multi-Miner Consensus Engine  │                       ┌───────────────────────────────┐
├───────────────────────────────┤                       │ Settlement State Machine &    │
│ • Rank & Confidence Weighting │──────────────────────▶│ Cryptographic Proof Bundle    │
│ • Divergence Flagging (>20%)  │                       ├───────────────────────────────┤
│ • Latency & Percentile Track  │                       │ • SHA-256 Merkle Proof Chain  │
│ • Audit Log per Miner Query   │                       │ • Immutable State Transitions │
└───────────────────────────────┘                       │ • Rate-Lock Expiration Guard  │
                                                        └───────────────────────────────┘
```

---

## ⚡ Telegraph Subnet Intelligence Matrix

IndoCrypt queries miners across **6 distinct decentralized intelligence intents**:

| Intent | Subnet ID | Purpose | Consensus Strategy |
| :--- | :--- | :--- | :--- |
| `CRYPTO_PRICE` | **Subnet 101** | Real-time Solana/Ethereum asset pricing | Median outlier rejection with confidence weight |
| `CURRENCY_EXCHANGE` | **Subnet 101** | Spot USD/INR forex conversion rates | Median pricing to protect against forex spikes |
| `FRAUD_DETECTION` | **Subnet 102** | Groq-accelerated LLM wallet risk screening | Strict safety: flags address if any miner alerts |
| `WALLET_BALANCE_CHECK` | **Subnet 103** | On-chain reserves & sender balance | Proof verification against on-chain liquidity |
| `GAS_PRICE` | **Subnet 104** | Live priority fees & network load | High gas penalty in risk engine |
| `NEWS_SEARCH` | **Subnet 105** | Real-time regulatory alerts & sentiment | Keyword sentiment score in risk engine |

---

## 🛡️ Multi-Signal Composable Risk Engine

Instead of a binary heuristic, IndoCrypt evaluates off-ramp transactions using a weighted composite score (0 - 100):

$$\text{Composite Score} = \sum_{i=1}^{n} (\text{Signal Score}_i \times \text{Weight}_i)$$

1. **Groq LLM Fraud Analysis** (Weight: 0.35): Analyzes counterparty addresses against sanction lists, known drainer heuristics, and transaction patterns.
2. **On-Chain Solvency Tier** (Weight: 0.25): Verifies sender wallet balance, activity age, and liquidity adequacy.
3. **Transaction Velocity** (Weight: 0.15): In-memory and DB-backed tracker preventing flash-loan abuse (>3 settlements within 5 minutes triggers velocity alert).
4. **Network Gas Congestion** (Weight: 0.15): High gas anomalies elevate risk to protect against mempool front-running.
5. **Market & Regulatory Sentiment** (Weight: 0.10): Real-time news synthesis identifying emergency regulatory freezes or de-peg risks.

### Decision Boundaries
- **Score $\le$ 40**: `auto_approve` — Immediate settlement clearance.
- **Score 41 – 70**: `hold_for_review` — Requires secondary multi-sig / compliance verification.
- **Score > 70**: `auto_deny` — Transaction aborted; audit record sealed.

---

## 🔒 Cryptographic Audit Proof Bundle

Every executed settlement compiles a verifiable SHA-256 proof bundle:
```typescript
interface ProofBundle {
    bundleHash: string; // sha256(intentId + quoteHash + screenHash + executionHash)
    timestamp: number;
    transactionId: string;
    minerSignatures: {
        minerId: string;
        intent: string;
        txProofHash: string;
        latencyMs: number;
    }[];
    stateRoot: string;
}
```
This guarantees non-repudiation: any regulatory body or counterparty can verify that prices, fraud checks, and forex rates were not manipulated post-execution.

---

## ⚙️ Environment Configuration

Set mode in `.env`:
```bash
# Options: "live" | "hybrid" | "mock"
TELEGRAPH_MODE="hybrid"
TELEGRAPH_API_BASE="https://api.telegraphprotocol.com"
TELEGRAPH_API_KEY="your-api-key"
```
- **Live Mode**: Calls decentralized Telegraph miners via HTTP REST with x402 payment challenge support.
- **Hybrid Mode**: Attempts live Telegraph miner calls first; gracefully falls back to synthetic miners with an audit flag if credentials are unset or the network is unreachable.
- **Mock Mode**: Deterministic local testing with simulated consensus divergence and latency jitter.

---

## 🚀 API Endpoints

- `POST /api/settlement/quote`: Queries price + FX subnets; locks exchange rate for 60s.
- `POST /api/settlement/screen`: Queries fraud, balance, gas, news subnets; computes composite risk score.
- `POST /api/settlement/execute`: Verifies rate-lock validity; executes settlement; builds proof bundle.
- `GET /api/settlement/history`: Retrieves user transaction history with full miner audit logs.
- `GET /api/analytics`: Aggregates protocol-wide telemetry, latency histograms, and consensus ratios.
