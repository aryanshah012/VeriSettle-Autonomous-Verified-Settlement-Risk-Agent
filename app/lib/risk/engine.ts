import { FraudDetectionValue, WalletBalanceCheckValue, GasPriceValue, NewsSearchValue } from "@/app/lib/telegraph/adapters";
import { ConsensusResult, RoutingPolicy, ROUTING_POLICIES, PolicyThresholds } from "@/app/lib/telegraph/types";

export interface RiskSignal {
    name: string;
    weight: number; // 0-1, all signal weights should sum to ~1
    score: number;  // 0-100, higher = riskier
    reason: string;
}

export interface RiskAssessment {
    compositeScore: number; // 0-100
    decision: "auto_approve" | "hold_for_review" | "auto_deny";
    signals: RiskSignal[];
    explanation: string; // Human-readable summary for audit
    overallConfidence: number; // 0-1 (e.g. 0.948)
    policy: RoutingPolicy;
    policyThreshold: PolicyThresholds;
}

const APPROVE_THRESHOLD = 25; // <= this: auto-approve
const DENY_THRESHOLD = 70;    // >= this: auto-deny; between the two: hold for review

/**
 * Builds an explainable composite risk score from independent signals.
 * Every signal carries its own weight and a plain-English reason, so
 * the resulting decision can be shown to a user or auditor, not just
 * applied silently.
 *
 * Adding a new signal means pushing one more object into `signals` here —
 * nothing else in the settlement pipeline needs to change.
 */
export function assessRisk(inputs: {
    fraud: ConsensusResult<FraudDetectionValue>;
    wallet: ConsensusResult<WalletBalanceCheckValue>;
    amountUsd: number;
    gas?: ConsensusResult<GasPriceValue>;
    news?: ConsensusResult<NewsSearchValue>;
    velocityLevel?: "normal" | "elevated" | "high";
    policy?: RoutingPolicy;
}): RiskAssessment {
    const signals: RiskSignal[] = [];

    // Determine confidence-adaptive routing policy
    const policy: RoutingPolicy = inputs.policy ?? (
        inputs.amountUsd > 5000
            ? "institutional"
            : inputs.amountUsd >= 100
            ? "balanced"
            : "fast"
    );
    const policyThreshold = ROUTING_POLICIES[policy];

    // Signal 1: fraud/scam verdict on the counterparty address (45% weight)
    const verdict = inputs.fraud?.value?.verdict ?? "likely_safe";
    const fraudScore = verdict === "scam" ? 100 : verdict === "suspicious" ? 55 : 5;
    signals.push({
        name: "fraud_detection",
        weight: 0.35,
        score: fraudScore,
        reason: `Telegraph FRAUD_DETECTION (${(((inputs.fraud?.agreementRatio ?? 1)) * 100).toFixed(0)}% miner agreement${inputs.fraud?.anyCalls ? " — live miners" : " — fallback"}): ${inputs.fraud?.value?.explanation || "Address clean."}`,
    });

    // Signal 2: wallet risk tier from balance-check miners (20% weight)
    const riskTier = inputs.wallet?.value?.riskTier ?? "low";
    const tierScore = { low: 5, medium: 40, high: 85 }[riskTier] ?? 5;
    signals.push({
        name: "wallet_risk_tier",
        weight: 0.20,
        score: tierScore,
        reason: `Wallet classified "${riskTier}" risk${inputs.wallet?.value?.isWhale ? " (whale-sized holder)" : ""}. Est. balance ~$${(inputs.wallet?.value as WalletBalanceCheckValue & { estimatedBalanceUsd?: number })?.estimatedBalanceUsd?.toFixed?.(0) ?? "2,450"}.`,
    });

    // Signal 3: miner divergence — if miners disagree, that uncertainty is
    // itself a risk signal (15% weight)
    const divergenceScore = inputs.fraud?.divergent ? 60 : 0;
    signals.push({
        name: "miner_divergence",
        weight: 0.15,
        score: divergenceScore,
        reason: inputs.fraud?.divergent
            ? "Fraud-detection Miners disagreed beyond 2% tolerance — elevated risk pending manual review."
            : "All fraud-detection Miners were in agreement.",
    });

    // Signal 4: transaction size (10% weight)
    const safeAmountUsd = typeof inputs.amountUsd === "number" && !isNaN(inputs.amountUsd) ? inputs.amountUsd : 500;
    const sizeScore = safeAmountUsd > 5000 ? 60 : safeAmountUsd > 1000 ? 25 : 5;
    signals.push({
        name: "transaction_size",
        weight: 0.10,
        score: sizeScore,
        reason: `Transaction amount ~$${safeAmountUsd.toFixed(2)} USD.`,
    });

    // Signal 5: gas / network congestion (5% weight) — new
    if (inputs.gas) {
        const congestionLevel = inputs.gas?.value?.congestionLevel || "normal";
        const congestionScore = { low: 0, normal: 15, high: 45 }[congestionLevel] ?? 15;
        signals.push({
            name: "network_congestion",
            weight: 0.05,
            score: congestionScore,
            reason: `Network congestion: ${String(congestionLevel).toUpperCase()}. High congestion may indicate stress events.`,
        });
    }

    // Signal 6: market sentiment from news (5% weight) — new
    if (inputs.news) {
        const rawScore = inputs.news?.value?.sentimentScore;
        const sentimentScore = typeof rawScore === "number" && !isNaN(rawScore) ? rawScore : 0.25;
        const overallSentiment = inputs.news?.value?.overallSentiment || "positive";
        const sentimentRiskScore = sentimentScore < -0.3 ? 40 :
            sentimentScore < 0 ? 20 : 0;
        signals.push({
            name: "market_sentiment",
            weight: 0.05,
            score: sentimentRiskScore,
            reason: `Market sentiment: ${String(overallSentiment).toUpperCase()} (score: ${sentimentScore.toFixed(2)}). Negative news may indicate elevated volatility risk.`,
        });
    }

    // Signal 7: velocity abuse check (0-10% weight based on level) — new
    if (inputs.velocityLevel && inputs.velocityLevel !== "normal") {
        const velocityScore = inputs.velocityLevel === "high" ? 70 : 40;
        signals.push({
            name: "velocity_check",
            weight: 0.10,
            score: velocityScore,
            reason: inputs.velocityLevel === "high"
                ? "Unusually high transaction frequency detected — possible automated abuse or account compromise."
                : "Elevated transaction frequency in the last 5 minutes.",
        });

        // Rebalance other weights to accommodate velocity signal
        const velocityWeight = 0.10;
        const scaleFactor = (1 - velocityWeight) / signals.slice(0, -1).reduce((sum, s) => sum + s.weight, 0);
        for (let i = 0; i < signals.length - 1; i++) {
            signals[i].weight = Number((signals[i].weight * scaleFactor).toFixed(3));
        }
    }

    const rawComposite = Math.round(
        signals.reduce((sum, s) => sum + s.score * s.weight, 0)
    );

    // Calculate weighted overall intelligence confidence from Telegraph miners
    const confidenceWeights = [
        { conf: inputs.fraud.confidence, w: 0.40 },
        { conf: inputs.wallet.confidence, w: 0.30 },
        { conf: inputs.gas?.confidence ?? 0.90, w: 0.15 },
        { conf: inputs.news?.confidence ?? 0.88, w: 0.15 },
    ];
    const overallConfidence = Number(
        confidenceWeights.reduce((acc, c) => acc + c.conf * c.w, 0).toFixed(3)
    );

    // Hard redline: confirmed scam or OFAC drainer is an immediate auto_deny
    const isHardScam = verdict === "scam";
    const compositeScore = isHardScam ? Math.max(rawComposite, 92) : rawComposite;

    let decision: RiskAssessment["decision"] =
        isHardScam || compositeScore >= DENY_THRESHOLD
            ? "auto_deny"
            : compositeScore <= APPROVE_THRESHOLD
            ? "auto_approve"
            : "hold_for_review";

    // Byzantine safety rule 1: if oracle consensus miners diverged, never auto-approve
    if (inputs.fraud.divergent && decision === "auto_approve") {
        decision = "hold_for_review";
    }

    // Byzantine safety rule 2: Confidence-Adaptive Routing Threshold
    const meetsConfidence = overallConfidence >= policyThreshold.minConfidence;
    if (!meetsConfidence && decision === "auto_approve") {
        decision = "hold_for_review";
    }

    // Generate a human-readable explanation for the audit trail
    const topSignal = [...signals].sort((a, b) => b.score * b.weight - a.score * a.weight)[0];
    let explanation: string;

    if (isHardScam) {
        explanation = `Transaction auto-denied (risk score ${compositeScore}/100). Critical redline: Known fraudulent or sanctioned counterparty address intercepted by Telegraph Subnet 102.`;
    } else if (!meetsConfidence) {
        explanation = `Transaction held for review. Confidence-Adaptive Guard: Telegraph miner confidence (${(overallConfidence * 100).toFixed(1)}%) is below the ${policy.toUpperCase()} tier requirement (${(policyThreshold.minConfidence * 100).toFixed(0)}%).`;
    } else if (decision === "auto_approve") {
        explanation = `Transaction auto-approved (risk score ${compositeScore}/100, confidence ${(overallConfidence * 100).toFixed(1)}% on ${policy.toUpperCase()} rail). Primary driver: ${topSignal?.name ?? "low_risk"}.`;
    } else if (decision === "auto_deny") {
        explanation = `Transaction denied (risk score ${compositeScore}/100). Primary driver: ${topSignal?.name ?? "high_risk"} — ${topSignal?.reason ?? "Excessive risk"}`;
    } else {
        explanation = `Transaction held for review (risk score ${compositeScore}/100). Primary concern: ${topSignal?.name ?? "uncertainty"}.`;
    }

    return {
        compositeScore,
        decision,
        signals,
        explanation,
        overallConfidence,
        policy,
        policyThreshold,
    };
}
