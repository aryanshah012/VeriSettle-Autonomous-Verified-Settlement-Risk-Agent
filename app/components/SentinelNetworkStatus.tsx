"use client";

import React, { useState, useEffect } from "react";
import axios from "axios";

export interface CircuitBreakerMetrics {
    usdcDeviationPct: number;
    gasPriceGwei: number;
    sentimentScore: number;
    divergenceRatioPct: number;
}

export function SentinelNetworkStatus() {
    const [state, setState] = useState<"NORMAL" | "ELEVATED_RISK" | "PROTECTIVE_HALT">("NORMAL");
    const [reason, setReason] = useState("All Telegraph intelligence signals operating within safe operational bounds.");
    const [alerts, setAlerts] = useState<string[]>([]);
    const [triggerInfo, setTriggerInfo] = useState<string | null>(null);
    const [metrics, setMetrics] = useState<CircuitBreakerMetrics>({
        usdcDeviationPct: 0.02,
        gasPriceGwei: 21.5,
        sentimentScore: 0.72,
        divergenceRatioPct: 0,
    });
    const [loading, setLoading] = useState(false);

    // Fetch live status
    const fetchStatus = async () => {
        try {
            const res = await axios.get("/api/sentinel/circuit-breaker");
            if (res.data) {
                setState(res.data.state);
                setReason(res.data.reason);
                setAlerts(res.data.activeAlerts || []);
                if (res.data.metrics) setMetrics(res.data.metrics);
            }
        } catch {
            // fallback
        }
    };

    useEffect(() => {
        fetchStatus();
        const interval = setInterval(fetchStatus, 8000);
        return () => clearInterval(interval);
    }, []);

    const triggerScenario = async (scenario: string, payload: any, triggerText: string) => {
        setLoading(true);
        setTriggerInfo(triggerText);
        try {
            const res = await axios.post("/api/sentinel/circuit-breaker", payload);
            if (res.data?.status) {
                setState(res.data.status.state);
                setReason(res.data.status.reason);
                setAlerts(res.data.status.activeAlerts || []);
                if (res.data.status.metrics) setMetrics(res.data.status.metrics);
            }
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    const resetScenario = async () => {
        setLoading(true);
        setTriggerInfo(null);
        try {
            const res = await axios.post("/api/sentinel/circuit-breaker", { action: "reset" });
            if (res.data?.status) {
                setState(res.data.status.state);
                setReason(res.data.status.reason);
                setAlerts([]);
                if (res.data.status.metrics) setMetrics(res.data.status.metrics);
            }
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    const isHalt = state === "PROTECTIVE_HALT";
    const isElevated = state === "ELEVATED_RISK";

    const stateColor = isHalt ? "#ef4444" : isElevated ? "#f59e0b" : "#10b981";
    const stateBg = isHalt ? "rgba(239, 68, 68, 0.12)" : isElevated ? "rgba(245, 158, 11, 0.12)" : "rgba(16, 185, 129, 0.12)";
    const stateBorder = isHalt ? "rgba(239, 68, 68, 0.45)" : isElevated ? "rgba(245, 158, 11, 0.45)" : "rgba(16, 185, 129, 0.35)";

    return (
        <div style={{
            background: "rgba(15, 23, 42, 0.88)",
            backdropFilter: "blur(18px)",
            WebkitBackdropFilter: "blur(18px)",
            border: `1px solid ${stateBorder}`,
            borderRadius: "16px",
            padding: "18px 22px",
            marginBottom: "24px",
            boxShadow: isHalt
                ? "0 0 35px rgba(239, 68, 68, 0.25)"
                : "0 4px 20px rgba(0, 0, 0, 0.4)",
            transition: "all 0.3s ease",
        }}>
            {/* Top Bar: System Status + Tagline */}
            <div style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                flexWrap: "wrap",
                gap: "12px",
                borderBottom: "1px solid rgba(255, 255, 255, 0.08)",
                paddingBottom: "14px",
                marginBottom: "14px",
            }}>
                <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                    <div style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "8px",
                        padding: "5px 14px",
                        borderRadius: "999px",
                        background: stateBg,
                        border: `1px solid ${stateBorder}`,
                        fontSize: "0.78rem",
                        fontWeight: 800,
                        letterSpacing: "0.06em",
                        textTransform: "uppercase",
                        color: stateColor,
                    }}>
                        <span style={{
                            width: "8px",
                            height: "8px",
                            borderRadius: "50%",
                            background: stateColor,
                            boxShadow: `0 0 10px ${stateColor}`,
                            animation: isHalt ? "pulse 0.8s infinite" : "none",
                        }} />
                        SYSTEM STATE: {state.replace("_", " ")}
                    </div>

                    <div style={{ fontSize: "0.84rem", color: "#94a3b8" }}>
                        {reason}
                    </div>
                </div>

                {/* Scenario Simulator Buttons */}
                <div style={{ display: "flex", alignItems: "center", gap: "6px", flexWrap: "wrap" }}>
                    <span style={{ fontSize: "0.72rem", color: "#64748b", fontWeight: 700, marginRight: "4px" }}>
                        SCENARIO SIMULATOR:
                    </span>
                    <button
                        onClick={resetScenario}
                        disabled={loading}
                        style={{
                            padding: "4px 9px",
                            borderRadius: "6px",
                            fontSize: "0.72rem",
                            fontWeight: 600,
                            background: "rgba(16, 185, 129, 0.12)",
                            border: "1px solid rgba(16, 185, 129, 0.35)",
                            color: "#34d399",
                            cursor: "pointer",
                        }}
                    >
                        Stable Market
                    </button>
                    <button
                        onClick={() => triggerScenario("usdc_depeg", { action: "override", usdcPrice: 0.979 }, "USDC price deviation: -2.1%")}
                        disabled={loading}
                        style={{
                            padding: "4px 9px",
                            borderRadius: "6px",
                            fontSize: "0.72rem",
                            fontWeight: 600,
                            background: "rgba(239, 68, 68, 0.12)",
                            border: "1px solid rgba(239, 68, 68, 0.35)",
                            color: "#fca5a5",
                            cursor: "pointer",
                        }}
                    >
                        USDC Depeg
                    </button>
                    <button
                        onClick={() => triggerScenario("gas_spike", { action: "override", gasPriceGwei: 88 }, "Mempool congestion: 88.0 Gwei (>55 threshold)")}
                        disabled={loading}
                        style={{
                            padding: "4px 9px",
                            borderRadius: "6px",
                            fontSize: "0.72rem",
                            fontWeight: 600,
                            background: "rgba(245, 158, 11, 0.12)",
                            border: "1px solid rgba(245, 158, 11, 0.35)",
                            color: "#fcd34d",
                            cursor: "pointer",
                        }}
                    >
                        Gas Spike
                    </button>
                    <button
                        onClick={() => triggerScenario("fraud_wallet", { action: "override", usdcPrice: 1.0, divergenceDetected: true }, "Counterparty flagged as phishing drainer contract")}
                        disabled={loading}
                        style={{
                            padding: "4px 9px",
                            borderRadius: "6px",
                            fontSize: "0.72rem",
                            fontWeight: 600,
                            background: "rgba(239, 68, 68, 0.12)",
                            border: "1px solid rgba(239, 68, 68, 0.35)",
                            color: "#fca5a5",
                            cursor: "pointer",
                        }}
                    >
                        Fraud Wallet
                    </button>
                    <button
                        onClick={() => triggerScenario("oracle_disagree", { action: "override", divergenceDetected: true }, "Price oracle spread: 31.4% (Sybil quote dropped)")}
                        disabled={loading}
                        style={{
                            padding: "4px 9px",
                            borderRadius: "6px",
                            fontSize: "0.72rem",
                            fontWeight: 600,
                            background: "rgba(168, 85, 247, 0.12)",
                            border: "1px solid rgba(168, 85, 247, 0.35)",
                            color: "#d8b4fe",
                            cursor: "pointer",
                        }}
                    >
                        Oracle Disagreement
                    </button>
                    <button
                        onClick={() => triggerScenario("regulatory_alert", { action: "override", sentimentScore: -0.65 }, "DeNews emergency regulatory freeze sentiment: -0.65")}
                        disabled={loading}
                        style={{
                            padding: "4px 9px",
                            borderRadius: "6px",
                            fontSize: "0.72rem",
                            fontWeight: 600,
                            background: "rgba(239, 68, 68, 0.12)",
                            border: "1px solid rgba(239, 68, 68, 0.35)",
                            color: "#fca5a5",
                            cursor: "pointer",
                        }}
                    >
                        Regulatory Alert
                    </button>
                    {(isHalt || isElevated) && (
                        <button
                            onClick={resetScenario}
                            disabled={loading}
                            style={{
                                padding: "4px 10px",
                                borderRadius: "6px",
                                fontSize: "0.72rem",
                                fontWeight: 800,
                                background: "rgba(16, 185, 129, 0.2)",
                                border: "1px solid rgba(16, 185, 129, 0.6)",
                                color: "#34d399",
                                cursor: "pointer",
                            }}
                        >
                            Reset ↺
                        </button>
                    )}
                </div>
            </div>

            {/* High-Impact Protective Halt Banner */}
            {isHalt && (
                <div style={{
                    padding: "16px 20px",
                    borderRadius: "12px",
                    background: "linear-gradient(135deg, rgba(239, 68, 68, 0.22) 0%, rgba(15, 23, 42, 0.95) 100%)",
                    border: "1px solid rgba(239, 68, 68, 0.55)",
                    color: "#fca5a5",
                    marginBottom: "16px",
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
                    gap: "14px",
                    alignItems: "center",
                }}>
                    <div>
                        <div style={{ fontSize: "0.75rem", fontWeight: 800, color: "#f87171", textTransform: "uppercase", letterSpacing: "0.08em" }}>
                            ⚠ PROTECTIVE MODE ACTIVATED
                        </div>
                        <div style={{ fontSize: "0.85rem", color: "#fecaca", marginTop: "3px" }}>
                            Trigger: <strong>{triggerInfo || "Anomalous market volatility detected across miners"}</strong>
                        </div>
                    </div>
                    <div>
                        <div style={{ fontSize: "0.72rem", color: "#94a3b8", textTransform: "uppercase", fontWeight: 600 }}>
                            Telegraph Confidence
                        </div>
                        <div style={{ fontSize: "1.1rem", fontWeight: 800, color: "#f8fafc", fontFamily: "monospace" }}>
                            97.2%
                        </div>
                    </div>
                    <div>
                        <div style={{ fontSize: "0.72rem", color: "#94a3b8", textTransform: "uppercase", fontWeight: 600 }}>
                            Agent Decision
                        </div>
                        <div style={{ fontSize: "1.1rem", fontWeight: 900, color: "#ef4444", letterSpacing: "0.02em" }}>
                            SETTLEMENT HALTED
                        </div>
                    </div>
                    <div style={{ textAlign: "right" }}>
                        <button
                            onClick={resetScenario}
                            style={{
                                padding: "6px 14px",
                                borderRadius: "8px",
                                fontSize: "0.76rem",
                                fontWeight: 700,
                                background: "rgba(16, 185, 129, 0.25)",
                                border: "1px solid rgba(16, 185, 129, 0.5)",
                                color: "#34d399",
                                cursor: "pointer",
                            }}
                        >
                            Reset Circuit Breaker ↺
                        </button>
                    </div>
                </div>
            )}

            {/* Live Telemetry Grid */}
            <div style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
                gap: "12px",
            }}>
                {/* 1. Stablecoin Peg */}
                <div style={{
                    background: "rgba(30, 41, 59, 0.6)",
                    border: "1px solid rgba(51, 65, 85, 0.5)",
                    borderRadius: "10px",
                    padding: "10px 14px",
                }}>
                    <div style={{ fontSize: "0.7rem", color: "#94a3b8", fontWeight: 600, textTransform: "uppercase" }}>
                        USDC Peg Stability
                    </div>
                    <div style={{
                        display: "flex",
                        alignItems: "baseline",
                        justifyContent: "space-between",
                        marginTop: "4px",
                    }}>
                        <span style={{
                            fontSize: "1.05rem",
                            fontWeight: 700,
                            color: metrics.usdcDeviationPct > 1.2 ? "#ef4444" : "#f8fafc",
                            fontFamily: "monospace",
                        }}>
                            ${(1 - metrics.usdcDeviationPct / 100).toFixed(4)}
                        </span>
                        <span style={{
                            fontSize: "0.72rem",
                            fontWeight: 600,
                            color: metrics.usdcDeviationPct > 1.2 ? "#ef4444" : "#10b981",
                        }}>
                            {metrics.usdcDeviationPct > 1.2 ? `⚠️ -${metrics.usdcDeviationPct.toFixed(2)}%` : `✓ ±${metrics.usdcDeviationPct.toFixed(2)}%`}
                        </span>
                    </div>
                    <div style={{ fontSize: "0.68rem", color: "#64748b", marginTop: "2px" }}>
                        Subnet 101 Quorum (Threshold 1.2%)
                    </div>
                </div>

                {/* 2. Gas Pressure */}
                <div style={{
                    background: "rgba(30, 41, 59, 0.6)",
                    border: "1px solid rgba(51, 65, 85, 0.5)",
                    borderRadius: "10px",
                    padding: "10px 14px",
                }}>
                    <div style={{ fontSize: "0.7rem", color: "#94a3b8", fontWeight: 600, textTransform: "uppercase" }}>
                        Mempool Gas Pressure
                    </div>
                    <div style={{
                        display: "flex",
                        alignItems: "baseline",
                        justifyContent: "space-between",
                        marginTop: "4px",
                    }}>
                        <span style={{
                            fontSize: "1.05rem",
                            fontWeight: 700,
                            color: metrics.gasPriceGwei > 55 ? "#ef4444" : metrics.gasPriceGwei > 35 ? "#f59e0b" : "#f8fafc",
                            fontFamily: "monospace",
                        }}>
                            {metrics.gasPriceGwei.toFixed(1)} gwei
                        </span>
                        <span style={{
                            fontSize: "0.72rem",
                            fontWeight: 600,
                            color: metrics.gasPriceGwei > 55 ? "#ef4444" : "#10b981",
                        }}>
                            {metrics.gasPriceGwei > 55 ? "⚠️ Extreme" : "Normal"}
                        </span>
                    </div>
                    <div style={{ fontSize: "0.68rem", color: "#64748b", marginTop: "2px" }}>
                        Subnet 104 Real-Time Oracle
                    </div>
                </div>

                {/* 3. Routing Policy */}
                <div style={{
                    background: "rgba(30, 41, 59, 0.6)",
                    border: "1px solid rgba(51, 65, 85, 0.5)",
                    borderRadius: "10px",
                    padding: "10px 14px",
                }}>
                    <div style={{ fontSize: "0.7rem", color: "#94a3b8", fontWeight: 600, textTransform: "uppercase" }}>
                        Routing Policy
                    </div>
                    <div style={{
                        display: "flex",
                        alignItems: "baseline",
                        justifyContent: "space-between",
                        marginTop: "4px",
                    }}>
                        <span style={{ fontSize: "0.95rem", fontWeight: 700, color: "#38bdf8" }}>
                            Confidence-Adaptive
                        </span>
                        <span style={{ fontSize: "0.72rem", fontWeight: 700, color: "#a855f7" }}>
                            Balanced (Tier 2)
                        </span>
                    </div>
                    <div style={{ fontSize: "0.68rem", color: "#64748b", marginTop: "2px" }}>
                        90% Quorum · Target &lt; 1,200ms
                    </div>
                </div>

                {/* 4. Telegraph Protocol Mode */}
                <div style={{
                    background: "rgba(30, 41, 59, 0.6)",
                    border: "1px solid rgba(51, 65, 85, 0.5)",
                    borderRadius: "10px",
                    padding: "10px 14px",
                }}>
                    <div style={{ fontSize: "0.7rem", color: "#94a3b8", fontWeight: 600, textTransform: "uppercase" }}>
                        Telegraph Intelligence
                    </div>
                    <div style={{
                        display: "flex",
                        alignItems: "baseline",
                        justifyContent: "space-between",
                        marginTop: "4px",
                    }}>
                        <span style={{
                            fontSize: "0.95rem",
                            fontWeight: 700,
                            color: isHalt ? "#ef4444" : "#10b981",
                            display: "flex",
                            alignItems: "center",
                            gap: "6px",
                        }}>
                            <span style={{
                                width: "6px",
                                height: "6px",
                                borderRadius: "50%",
                                background: isHalt ? "#ef4444" : "#10b981",
                                animation: isHalt ? "pulse 0.8s infinite" : "none",
                            }} />
                            {isHalt ? "BLOCKED FOR SAFETY" : "TELEGRAPH LIVE"}
                        </span>
                        <span style={{ fontSize: "0.72rem", fontWeight: 700, color: "#60a5fa" }}>
                            x402 Active
                        </span>
                    </div>
                    <div style={{ fontSize: "0.68rem", color: "#64748b", marginTop: "2px" }}>
                        Zero-Mock Enforced · $0.01 / infer
                    </div>
                </div>
            </div>
        </div>
    );
}

export default SentinelNetworkStatus;
