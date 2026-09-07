import { callMiner, getMinersForIntent } from "./client";
import { MinerCallResult } from "./types";

// Each adapter: (1) fetches ranked miners for its intent, (2) calls all of
// them in parallel via the shared client, (3) supplies a mock-value
// generator used only when TELEGRAPH_MODE=mock or in hybrid fallback.
// The orchestrator consumes the returned array and does consensus scoring
// generically — adapters never decide "the" answer themselves.

// ---------------------------------------------------------------------------
// CRYPTO_PRICE
// ---------------------------------------------------------------------------
export interface CryptoPricePayload {
    symbol: string;
    counterpartyAddress?: string;
    scenario?: string;
}
export interface CryptoPriceValue { symbol: string; priceUsd: number }

const MOCK_PRICES: Record<string, number> = { SOL: 182.4, USDC: 1.0, USDT: 1.0, BTC: 58420, ETH: 2380 };

export async function queryCryptoPrice(
    payload: CryptoPricePayload
): Promise<MinerCallResult<CryptoPriceValue>[]> {
    const miners = await getMinersForIntent("CRYPTO_PRICE");
    const base = MOCK_PRICES[payload.symbol] ?? 100;
    const isSybilAttack =
        payload.scenario === "sybil_attack" ||
        payload.counterpartyAddress?.includes("FkR9m") ||
        payload.counterpartyAddress?.toLowerCase().includes("sybil");

    return Promise.all(
        miners.map(m =>
            callMiner("CRYPTO_PRICE", m, payload, () => {
                // In Byzantine attack scenario, rogue miner 3 injects +35% price deviation ($246 vs $182)
                let priceMultiplier = 1 + (m.rank - 2) * 0.004 + (Math.random() - 0.5) * 0.002;
                if (isSybilAttack && m.rank === 3) {
                    priceMultiplier = 1.348; // +35% distorted rogue miner quote
                }
                return {
                    symbol: payload.symbol,
                    priceUsd: Number((base * priceMultiplier).toFixed(4)),
                };
            })
        )
    );
}

// ---------------------------------------------------------------------------
// CURRENCY_EXCHANGE
// ---------------------------------------------------------------------------
export interface CurrencyExchangePayload { from: string; to: string }
export interface CurrencyExchangeValue { from: string; to: string; rate: number }

const MOCK_FX_RATES: Record<string, number> = {
    "USD-INR": 83.87, "USD-EUR": 0.924, "USD-GBP": 0.792, "USD-JPY": 146.5,
};

export async function queryCurrencyExchange(
    payload: CurrencyExchangePayload
): Promise<MinerCallResult<CurrencyExchangeValue>[]> {
    const miners = await getMinersForIntent("CURRENCY_EXCHANGE");
    const key = `${payload.from}-${payload.to}`;
    const baseRate = MOCK_FX_RATES[key] ?? MOCK_FX_RATES["USD-INR"] ?? 83.87;

    return Promise.all(
        miners.map(m =>
            callMiner("CURRENCY_EXCHANGE", m, payload, () => ({
                from: payload.from,
                to: payload.to,
                rate: Number((baseRate * (1 + (m.rank - 2) * 0.001 + (Math.random() - 0.5) * 0.0005)).toFixed(3)),
            }))
        )
    );
}

// ---------------------------------------------------------------------------
// FRAUD_DETECTION — maps to Groq LLM subnet (102) in live mode,
// same pattern as the TrustFilter use case in telegraph-usecases.
// ---------------------------------------------------------------------------
export interface FraudDetectionPayload { address: string; context?: string }
export interface FraudDetectionValue {
    verdict: "likely_safe" | "suspicious" | "scam";
    explanation: string;
    confidence: number;
    redFlags: string[];
}

export async function queryFraudDetection(
    payload: FraudDetectionPayload
): Promise<MinerCallResult<FraudDetectionValue>[]> {
    const miners = await getMinersForIntent("FRAUD_DETECTION");

    // For live mode the payload is structured as a Groq LLM prompt
    // matching the TrustFilter pattern (subnet 102).
    const enrichedPayload = {
        ...payload,
        // In live mode Telegraph's LLM subnet interprets this as the prompt
        prompt: `Analyze this crypto wallet address for fraud/scam indicators: "${payload.address}". 
Return JSON: { verdict: "scam"|"suspicious"|"likely_safe", explanation: string, confidence: 0-1, redFlags: string[] }`,
    };

    const flagged = /scam|rug|fake|phish|drain|malicious/i.test(payload.address);
    const suspicious = /unknown|anon|test|dump/i.test(payload.address);

    return Promise.all(
        miners.map(m =>
            callMiner("FRAUD_DETECTION", m, enrichedPayload, (): FraudDetectionValue => {
                if (flagged) {
                    return {
                        verdict: "scam",
                        explanation: "Address matches known scam-pattern heuristics — flagged across multiple fraud databases.",
                        confidence: 0.94,
                        redFlags: ["Matches known scam address pattern", "High-risk keyword in address identifier"],
                    };
                }
                if (suspicious) {
                    return {
                        verdict: "suspicious",
                        explanation: "Address shows ambiguous signals — no confirmed fraud but cannot be fully verified.",
                        confidence: 0.62,
                        redFlags: ["Unverified address", "Low transaction history"],
                    };
                }
                return {
                    verdict: "likely_safe",
                    explanation: "No fraud indicators found against current ground truth. Address is clean.",
                    confidence: 0.91 - m.rank * 0.02,
                    redFlags: [],
                };
            })
        )
    );
}

// ---------------------------------------------------------------------------
// WALLET_BALANCE_CHECK
// ---------------------------------------------------------------------------
export interface WalletBalanceCheckPayload { address: string }
export interface WalletBalanceCheckValue {
    address: string;
    riskTier: "low" | "medium" | "high";
    isWhale: boolean;
    estimatedBalanceUsd: number;
    transactionCount: number;
}

export async function queryWalletBalanceCheck(
    payload: WalletBalanceCheckPayload
): Promise<MinerCallResult<WalletBalanceCheckValue>[]> {
    const miners = await getMinersForIntent("WALLET_BALANCE_CHECK");

    return Promise.all(
        miners.map(m =>
            callMiner("WALLET_BALANCE_CHECK", m, payload, (): WalletBalanceCheckValue => {
                // Deterministic mock from address hash for reproducibility
                const hash = payload.address.split("").reduce((acc, c) => acc + c.charCodeAt(0), 0);
                const estimatedBalanceUsd = (hash % 10000) + 100;
                const isWhale = estimatedBalanceUsd > 5000;
                const riskTier: "low" | "medium" | "high" = isWhale ? "high" : estimatedBalanceUsd > 1000 ? "medium" : "low";
                return {
                    address: payload.address,
                    riskTier,
                    isWhale,
                    estimatedBalanceUsd,
                    transactionCount: hash % 500,
                };
            })
        )
    );
}

// ---------------------------------------------------------------------------
// GAS_PRICE — new intent for cost estimation and congestion signaling
// ---------------------------------------------------------------------------
export interface GasPricePayload {
    network: "solana" | "ethereum" | "polygon";
    address?: string;
    scenario?: string;
}
export interface GasPriceValue { network: string; gasPriceGwei?: number; priorityFeeGwei?: number; lamportsPerSignature?: number; congestionLevel: "low" | "normal" | "high" }

export async function queryGasPrice(
    payload: GasPricePayload
): Promise<MinerCallResult<GasPriceValue>[]> {
    const miners = await getMinersForIntent("GAS_PRICE");
    const isGasSpike =
        payload.scenario === "gas_spike" ||
        payload.address?.includes("3jB5y") ||
        payload.address?.toLowerCase().includes("congestion");

    return Promise.all(
        miners.map(m =>
            callMiner("GAS_PRICE", m, payload, (): GasPriceValue => {
                const jitter = 1 + (Math.random() - 0.5) * 0.1;
                if (payload.network === "solana") {
                    const lamports = isGasSpike ? Math.round(8800 * jitter) : Math.round(5000 * jitter);
                    const congestionLevel: "low" | "normal" | "high" = lamports > 7000 ? "high" : lamports > 4000 ? "normal" : "low";
                    return { network: "solana", lamportsPerSignature: lamports, congestionLevel };
                }
                const gwei = (isGasSpike ? 85 : 25) * jitter;
                const congestionLevel: "low" | "normal" | "high" = gwei > 40 ? "high" : gwei > 20 ? "normal" : "low";
                return { network: payload.network, gasPriceGwei: Number(gwei.toFixed(2)), priorityFeeGwei: 1.5, congestionLevel };
            })
        )
    );
}

// ---------------------------------------------------------------------------
// NEWS_SEARCH — maps to DeSearch subnet (101) in live mode
// Provides market context alongside settlement decisions.
// ---------------------------------------------------------------------------
export interface NewsSearchPayload { query: string; maxResults?: number }
export interface NewsSearchValue {
    query: string;
    articles: { title: string; summary: string; sentiment: "positive" | "neutral" | "negative"; url?: string }[];
    overallSentiment: "positive" | "neutral" | "negative";
    sentimentScore: number; // -1 to +1
}

const MOCK_NEWS: Record<string, NewsSearchValue> = {
    default: {
        query: "crypto",
        articles: [
            { title: "Solana Network Hits New ATH in Daily Transactions", summary: "Solana processed over 100M transactions in a single day, with fees remaining near-zero.", sentiment: "positive" },
            { title: "RBI Signals Openness to Crypto Regulation Framework", summary: "India's Reserve Bank is exploring a regulatory sandbox for crypto businesses.", sentiment: "positive" },
            { title: "Market Consolidates After Recent Rally", summary: "BTC and SOL pulling back 3-5% after 30% gains last month.", sentiment: "neutral" },
        ],
        overallSentiment: "positive",
        sentimentScore: 0.62,
    },
};

export async function queryNewsSearch(
    payload: NewsSearchPayload
): Promise<MinerCallResult<NewsSearchValue>[]> {
    const miners = await getMinersForIntent("NEWS_SEARCH");

    return Promise.all(
        miners.map(m =>
            callMiner("NEWS_SEARCH", m, payload, () => ({
                ...(MOCK_NEWS.default),
                query: payload.query,
            }))
        )
    );
}
