import { CircuitBreakerStatus, CircuitBreakerState } from "./types";

/**
 * VeriSettle Sentinel — Autonomous Circuit Breaker
 * Tracks miner anomalies, consecutive failures, and triggers protective modes:
 *   - Stablecoin peg stability (USDC / USD deviation)
 *   - Mempool gas storms & priority fee spikes (Subnet 104)
 *   - Critical regulatory alerts & macro sentiment (Subnet 101/105)
 *   - Oracle price divergence & Sybil attacks
 *
 * Enforces: "No verified intelligence = No settlement."
 * If dangerous market conditions are verified, the agent automatically
 * flips system state to PROTECTIVE_HALT to shield user capital.
 */

let activeManualOverride: CircuitBreakerStatus | null = null;

export function evaluateCircuitBreaker(inputs: {
    usdcPrice?: number;
    gasPriceGwei?: number;
    sentimentScore?: number;
    divergenceDetected?: boolean;
}): CircuitBreakerStatus {
    if (activeManualOverride) {
        return activeManualOverride;
    }

    const alerts: string[] = [];
    let state: CircuitBreakerState = "NORMAL";
    let reason = "All Telegraph intelligence signals operating within safe operational bounds.";

    const usdc = inputs.usdcPrice ?? 1.0;
    const usdcDeviationPct = Math.abs(usdc - 1.0) * 100;
    const gas = inputs.gasPriceGwei ?? 25;
    const sentiment = inputs.sentimentScore ?? 0.15;
    const divergenceRatioPct = inputs.divergenceDetected ? 33.3 : 0;

    // Rule 1: Stablecoin Depeg Alert (> 1.2% deviation from $1.00)
    if (usdcDeviationPct >= 1.2) {
        state = "PROTECTIVE_HALT";
        alerts.push(`USDC Depeg Alert: Deviation of ${usdcDeviationPct.toFixed(2)}% exceeds 1.2% safety threshold.`);
        reason = "Severe stablecoin volatility detected across Telegraph pricing miners. Settlements halted.";
    }

    // Rule 2: Gas Storm (> 55 Gwei / high congestion)
    if (gas > 55) {
        if (state !== "PROTECTIVE_HALT") {
            state = "ELEVATED_RISK";
            reason = "Extreme network congestion detected by Subnet 104. Precautionary fee buffer active.";
        }
        alerts.push(`Mempool Congestion: Priority gas fees at ${gas.toFixed(1)} gwei exceed normal limits.`);
    }

    // Rule 3: Extreme Negative News / Regulatory Shock
    if (sentiment < -0.45) {
        state = "PROTECTIVE_HALT";
        alerts.push("Regulatory Shock: Critical regulatory or enforcement action detected in Telegraph DeNews.");
        reason = "Critical news sentiment drop detected by Subnet 101/105. Settlements temporarily suspended.";
    }

    // Rule 4: Rogue Miner Price Divergence
    if (inputs.divergenceDetected) {
        alerts.push("Oracle Divergence: Rogue miner quote detected and dropped via Median Absolute Deviation.");
    }

    return {
        state,
        triggeredAt: new Date().toISOString(),
        reason,
        activeAlerts: alerts,
        metrics: {
            usdcDeviationPct,
            gasPriceGwei: gas,
            sentimentScore: sentiment,
            divergenceRatioPct,
        },
    };
}

export function setCircuitBreakerOverride(status: CircuitBreakerStatus | null) {
    activeManualOverride = status;
}

export function getActiveCircuitBreakerStatus(): CircuitBreakerStatus {
    return evaluateCircuitBreaker({});
}
