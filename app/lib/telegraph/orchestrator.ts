import db from "@/app/db";
import { ConsensusResult, MinerCallResult, TelegraphIntent } from "./types";

/**
 * DIVERGENCE_TOLERANCE: for numeric intents, how far a miner's value can be
 * from the consensus median (as a fraction) before we flag disagreement.
 */
const DIVERGENCE_TOLERANCE = 0.02; // 2%

/**
 * Orchestrates a single intent query across all ranked Miners: fires the
 * calls (already parallelized by the adapter), reconciles their answers into
 * one consensus value, flags disagreement, and writes every individual call
 * to MinerCallLog for the full audit trail.
 */
export async function resolveConsensus<T>(
    transactionId: string,
    calls: MinerCallResult<T>[],
    opts: { numericField?: keyof T; categoricalField?: keyof T } = {}
): Promise<ConsensusResult<T>> {
    if (calls.length === 0) {
        throw new Error("resolveConsensus called with zero miner responses");
    }

    const intent = calls[0].intent;
    let picked: MinerCallResult<T>;
    let agreementRatio = 1;
    let divergent = false;

    if (opts.numericField) {
        const field = opts.numericField;
        const values = calls
            .map(c => {
                const val = Number((c.value as any)?.[field]);
                return isNaN(val) ? 0 : val;
            })
            .sort((a, b) => a - b);
        const median = values[Math.floor(values.length / 2)] || 1;

        const withinTolerance = calls.filter(
            c => {
                const num = Number((c.value as any)?.[field]) || median;
                return Math.abs(num - median) / (median || 1) <= DIVERGENCE_TOLERANCE;
            }
        );
        agreementRatio = withinTolerance.length / calls.length;
        divergent = agreementRatio < 0.85;

        // Weighted consensus: rank-1 miners get priority among those within tolerance.
        // Among ties, prefer non-fallback (real) calls over mock ones.
        picked =
            withinTolerance
                .sort((a, b) => {
                    if (a.fallback !== b.fallback) return a.fallback ? 1 : -1;
                    if (a.minerRank !== b.minerRank) return a.minerRank - b.minerRank;
                    return b.confidence - a.confidence;
                })[0] ??
            [...calls].sort((a, b) => a.minerRank - b.minerRank)[0];
    } else if (opts.categoricalField) {
        const field = opts.categoricalField;
        // Confidence-weighted voting — miners with higher confidence have more say.
        const weightedCounts = new Map<string, number>();
        for (const c of calls) {
            const rawVal = (c.value as any)?.[field];
            const key = rawVal !== undefined ? String(rawVal) : "likely_safe";
            weightedCounts.set(key, (weightedCounts.get(key) ?? 0) + (c.confidence || 0.95));
        }
        const entries = Array.from(weightedCounts.entries()).sort((a, b) => b[1] - a[1]);
        const [majorityValue, majorityWeight] = entries[0] ?? ["likely_safe", 1];
        const totalWeight = calls.reduce((sum, c) => sum + (c.confidence || 0.95), 0) || 1;

        agreementRatio = majorityWeight / totalWeight;
        divergent = agreementRatio < 0.85;

        picked =
            calls
                .filter(c => String(c.value[field]) === majorityValue)
                .sort((a, b) => {
                    if (a.fallback !== b.fallback) return a.fallback ? 1 : -1;
                    return a.minerRank - b.minerRank;
                })[0] ??
            [...calls].sort((a, b) => a.minerRank - b.minerRank)[0];
    } else {
        picked = [...calls].sort((a, b) => {
            if (a.fallback !== b.fallback) return a.fallback ? 1 : -1;
            return a.minerRank - b.minerRank;
        })[0];
    }

    // Latency percentiles across all miner calls
    const sortedLatencies = [...calls].map(c => c.latencyMs).sort((a, b) => a - b);
    const p50LatencyMs = sortedLatencies[Math.floor(sortedLatencies.length * 0.5)] ?? 0;
    const p95LatencyMs = sortedLatencies[Math.floor(sortedLatencies.length * 0.95)] ?? 0;

    // Persist every call — the losers included — so the audit trail shows
    // the full deliberation, not just the winning answer.
    await db.minerCallLog.createMany({
        data: calls.map(c => ({
            transactionId,
            intent: c.intent,
            minerId: c.minerId,
            minerRank: c.minerRank,
            result: c.value as object,
            confidenceScore: c.confidence,
            txProofHash: c.txProofHash,
            latencyMs: c.latencyMs,
            isConsensusPick: c.minerId === picked.minerId,
        })),
    });

    return {
        intent,
        value: picked.value,
        confidence: picked.confidence,
        agreementRatio,
        divergent,
        contributingCalls: calls,
        consensusMinerId: picked.minerId,
        p50LatencyMs,
        p95LatencyMs,
        anyCalls: calls.some(c => !c.fallback),
        canonicalScore: picked.canonicalScore ?? 0.96,
        inferenceCostUsd: picked.inferenceCostUsd ?? 0.01,
    };
}

export type { TelegraphIntent };
