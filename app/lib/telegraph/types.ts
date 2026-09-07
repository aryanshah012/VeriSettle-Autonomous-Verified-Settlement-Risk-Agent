// Shared types for the Telegraph intent-orchestration layer.
// These are deliberately protocol-agnostic: nothing here assumes
// a specific Miner, so new intents/adapters plug in without
// touching the orchestrator, risk engine, or settlement machine.

export type TelegraphIntent =
    | "CRYPTO_PRICE"
    | "CURRENCY_EXCHANGE"
    | "FRAUD_DETECTION"
    | "WALLET_BALANCE_CHECK"
    | "GAS_PRICE"
    | "TOKEN_HOLDER_COUNT"
    | "NEWS_SEARCH"
    | "SENTIMENT_ANALYSIS";

// Subnet IDs for the real Telegraph network (hackathon miner catalog)
export const SUBNET_IDS: Record<TelegraphIntent, number> = {
    CRYPTO_PRICE: 32,        // Financial data subnet
    CURRENCY_EXCHANGE: 32,   // Financial data subnet
    FRAUD_DETECTION: 102,    // Groq LLM subnet (same as TrustFilter)
    WALLET_BALANCE_CHECK: 32, // On-chain analytics subnet
    GAS_PRICE: 32,           // Gas price subnet
    TOKEN_HOLDER_COUNT: 32,  // Token analytics subnet
    NEWS_SEARCH: 101,        // DeSearch subnet
    SENTIMENT_ANALYSIS: 102, // LLM subnet for sentiment
};

export interface MinerInfo {
    minerId: string;
    rank: number; // 1 = top-ranked on Telegraph's leaderboard for this intent
    endpoint: string;
    subnetId: number;
    canonicalScore?: number; // 0-1 quality score tracked by Telegraph flywheel
    routingWeight?: number;  // Probabilistic routing share (e.g. 0.47 -> 0.61)
}

/**
 * The normalized shape every adapter must return, regardless of what the
 * underlying Miner's raw response looks like.
 */
export interface MinerCallResult<T = unknown> {
    minerId: string;
    minerRank: number;
    intent: TelegraphIntent;
    value: T;
    confidence: number; // 0-1
    txProofHash: string; // x402 on-chain settlement proof for this call
    latencyMs: number;
    raw: unknown;
    fallback: boolean; // true when real miner call failed (strictly forbidden in submission mode)
    subnetId?: number;
    canonicalScore?: number;
    inferenceCostUsd?: number;
    x402Signature?: string;
    routingWeight?: number;
}

export type RoutingPolicy = "fast" | "balanced" | "institutional";

export interface PolicyThresholds {
    minConfidence: number;
    maxRiskScore: number;
    maxLatencyMs: number;
    description: string;
}

export const ROUTING_POLICIES: Record<RoutingPolicy, PolicyThresholds> = {
    fast: {
        minConfidence: 0.75,
        maxRiskScore: 35,
        maxLatencyMs: 1500,
        description: "Fast (<$100): Lowest latency eligible miner intelligence",
    },
    balanced: {
        minConfidence: 0.90,
        maxRiskScore: 25,
        maxLatencyMs: 3500,
        description: "Balanced ($100-$5k): Standard multi-intent verification",
    },
    institutional: {
        minConfidence: 0.97,
        maxRiskScore: 15,
        maxLatencyMs: 6000,
        description: "Institutional (>$5k): Highest confidence ranked miners only",
    },
};

export type CircuitBreakerState = "NORMAL" | "PROTECTIVE_HALT" | "ELEVATED_RISK";

export interface CircuitBreakerStatus {
    state: CircuitBreakerState;
    triggeredAt?: string;
    reason?: string;
    activeAlerts: string[];
    metrics: {
        usdcDeviationPct: number;
        gasPriceGwei: number;
        sentimentScore: number;
        divergenceRatioPct: number;
    };
}

export interface ConsensusResult<T = unknown> {
    intent: TelegraphIntent;
    value: T;
    confidence: number;
    agreementRatio: number; // fraction of miners that agreed with the picked value
    divergent: boolean; // true if miners disagreed beyond tolerance
    contributingCalls: MinerCallResult<T>[];
    consensusMinerId: string;
    p50LatencyMs: number; // median latency across miners
    p95LatencyMs: number; // 95th percentile latency
    anyCalls: boolean;   // whether any real (non-fallback) calls were made
    canonicalScore?: number;
    inferenceCostUsd?: number;
}

export class TelegraphMinerError extends Error {
    constructor(
        public readonly intent: TelegraphIntent,
        public readonly minerId: string,
        message: string
    ) {
        super(`[${intent}] Miner ${minerId} failed: ${message}`);
        this.name = "TelegraphMinerError";
    }
}

export class TelegraphUnavailableError extends Error {
    constructor(
        public readonly reason: string = "Telegraph verification unavailable — Settlement paused for safety."
    ) {
        super(reason);
        this.name = "TelegraphUnavailableError";
    }
}
