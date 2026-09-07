"use client";

import React, { useState } from "react";

export interface DecisionTraceItem {
    intent: string;
    label: string;
    verified: boolean;
    confidence: number; // 0-1
    minerId: string;
    minerRank: number;
    latencyMs: number;
    canonicalScore: number; // 0-100
    costUsd: number;
    x402Sig?: string;
    statusText?: string;
}

interface TelegraphDecisionTraceProps {
    items?: DecisionTraceItem[];
    overallConfidence?: number;
    decision?: "auto_approve" | "hold_for_review" | "auto_deny" | string;
    policy?: "fast" | "balanced" | "institutional" | string;
    className?: string;
}

const DEFAULT_TRACE_ITEMS: DecisionTraceItem[] = [
    {
        intent: "CRYPTO_PRICE",
        label: "Crypto Spot Pricing",
        verified: true,
        confidence: 0.972,
        minerId: "telegraph-miner-101-alpha",
        minerRank: 1,
        latencyMs: 414,
        canonicalScore: 96.4,
        costUsd: 0.01,
        x402Sig: "x402_sig_8f3d99e01b2a...7c",
        statusText: "Spot price validated within 0.1% spread",
    },
    {
        intent: "CURRENCY_EXCHANGE",
        label: "Forex USD/INR Quorum",
        verified: true,
        confidence: 0.954,
        minerId: "telegraph-miner-101-beta",
        minerRank: 2,
        latencyMs: 561,
        canonicalScore: 89.1,
        costUsd: 0.01,
        x402Sig: "x402_sig_4e2a1b9f08d1...3a",
        statusText: "Interbank benchmark confirmed",
    },
    {
        intent: "FRAUD_DETECTION",
        label: "TrustFilter Groq LLM",
        verified: true,
        confidence: 0.938,
        minerId: "subnet-102-groq-sentinel",
        minerRank: 1,
        latencyMs: 382,
        canonicalScore: 97.8,
        costUsd: 0.01,
        x402Sig: "x402_sig_99c311fa8b4e...11",
        statusText: "No drainer or sanction flags",
    },
    {
        intent: "WALLET_BALANCE_CHECK",
        label: "On-Chain Solvency Audit",
        verified: true,
        confidence: 0.965,
        minerId: "telegraph-miner-103-alpha",
        minerRank: 1,
        latencyMs: 490,
        canonicalScore: 94.2,
        costUsd: 0.01,
        x402Sig: "x402_sig_17da8b3c4e09...55",
        statusText: "Proof of reserves verified",
    },
    {
        intent: "GAS_PRICE",
        label: "Mempool Congestion Engine",
        verified: true,
        confidence: 0.941,
        minerId: "telegraph-miner-104-beta",
        minerRank: 2,
        latencyMs: 320,
        canonicalScore: 91.5,
        costUsd: 0.01,
        x402Sig: "x402_sig_66d4a0e19f88...bb",
        statusText: "Network gas stable (24 gwei)",
    },
    {
        intent: "NEWS_SEARCH",
        label: "DeNews Macro Sentiment",
        verified: true,
        confidence: 0.915,
        minerId: "telegraph-miner-105-alpha",
        minerRank: 1,
        latencyMs: 640,
        canonicalScore: 92.0,
        costUsd: 0.01,
        x402Sig: "x402_sig_33f81e09c2a7...dd",
        statusText: "No depeg or regulatory shocks",
    },
];

export function TelegraphDecisionTrace({
    items = DEFAULT_TRACE_ITEMS,
    overallConfidence = 0.948,
    decision = "auto_approve",
    policy = "institutional",
    className = "",
}: TelegraphDecisionTraceProps) {
    const [showSignatures, setShowSignatures] = useState(false);

    const isApprove = decision === "auto_approve" || decision === "AUTO_EXECUTE";
    const isDeny = decision === "auto_deny" || decision === "AUTO_BLOCK";

    return (
        <div
            className={className}
            style={{
                background: "linear-gradient(135deg, rgba(15, 23, 42, 0.9), rgba(5, 11, 24, 0.95))",
                backdropFilter: "blur(20px)",
                border: "1.5px solid rgba(6, 182, 212, 0.4)",
                borderRadius: "20px",
                padding: "24px",
                boxShadow: "0 16px 40px rgba(0, 0, 0, 0.5), 0 0 30px rgba(6, 182, 212, 0.1)",
                color: "#f8fafc",
            }}
        >
            {/* Header */}
            <div
                style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    flexWrap: "wrap",
                    gap: "12px",
                    borderBottom: "1px solid rgba(71, 85, 105, 0.4)",
                    paddingBottom: "16px",
                    marginBottom: "18px",
                }}
            >
                <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                    <span style={{ fontSize: "20px" }}>📡</span>
                    <div>
                        <div style={{ fontSize: "0.95rem", fontWeight: 800, letterSpacing: "0.06em", textTransform: "uppercase", color: "#38bdf8" }}>
                            Telegraph Decision Trace
                        </div>
                        <div style={{ fontSize: "11px", color: "#94a3b8" }}>
                            Autonomous multi-intent verification powered by ranked miners
                        </div>
                    </div>
                </div>

                <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                    {/* Policy Tier Badge */}
                    <div
                        style={{
                            padding: "4px 10px",
                            borderRadius: "999px",
                            background: "rgba(168, 85, 247, 0.15)",
                            border: "1px solid rgba(168, 85, 247, 0.4)",
                            fontSize: "11px",
                            fontWeight: 700,
                            color: "#c084fc",
                            textTransform: "uppercase",
                            letterSpacing: "0.05em",
                        }}
                    >
                        Tier: {policy}
                    </div>

                    <button
                        type="button"
                        onClick={() => setShowSignatures(!showSignatures)}
                        style={{
                            padding: "4px 10px",
                            borderRadius: "8px",
                            background: "rgba(30, 41, 59, 0.6)",
                            border: "1px solid rgba(71, 85, 105, 0.5)",
                            color: "#94a3b8",
                            fontSize: "11px",
                            fontWeight: 600,
                            cursor: "pointer",
                        }}
                    >
                        {showSignatures ? "Hide x402 Proofs" : "Show x402 Proofs"}
                    </button>
                </div>
            </div>

            {/* Trace List */}
            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                {items.map((item) => (
                    <div
                        key={item.intent}
                        style={{
                            background: "rgba(30, 41, 59, 0.4)",
                            border: "1px solid rgba(71, 85, 105, 0.3)",
                            borderRadius: "12px",
                            padding: "12px 16px",
                            display: "flex",
                            flexDirection: "column",
                            gap: "6px",
                        }}
                    >
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "8px" }}>
                            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                                <span style={{ color: item.verified ? "#34d399" : "#f87171", fontWeight: 800, fontSize: "14px" }}>
                                    {item.verified ? "✓" : "✗"}
                                </span>
                                <span style={{ fontWeight: 700, fontSize: "13px", color: "#f1f5f9" }}>
                                    {item.intent}
                                </span>
                                <span style={{ fontSize: "11px", color: "#64748b" }}>
                                    ({item.label})
                                </span>
                            </div>

                            <div style={{ display: "flex", alignItems: "center", gap: "14px", fontSize: "11px" }}>
                                <div>
                                    <span style={{ color: "#64748b" }}>Confidence: </span>
                                    <strong style={{ color: item.confidence >= 0.9 ? "#34d399" : "#fbbf24" }}>
                                        {(item.confidence * 100).toFixed(1)}%
                                    </strong>
                                </div>

                                <div style={{ background: "rgba(6, 182, 212, 0.1)", padding: "2px 6px", borderRadius: "6px", border: "1px solid rgba(6, 182, 212, 0.3)", color: "#38bdf8", fontWeight: 700 }}>
                                    Rank #{item.minerRank}
                                </div>

                                <div style={{ color: "#94a3b8" }}>
                                    {item.latencyMs}ms
                                </div>

                                <div style={{ color: "#34d399", fontWeight: 600 }}>
                                    ${item.costUsd.toFixed(2)}
                                </div>
                            </div>
                        </div>

                        {/* Status text & optional x402 signature */}
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "10px", color: "#64748b" }}>
                            <span>{item.statusText || "Verified via Telegraph Protocol inference"}</span>
                            <span>Quality Score: {item.canonicalScore.toFixed(1)}/100</span>
                        </div>

                        {showSignatures && item.x402Sig && (
                            <div style={{
                                marginTop: "4px",
                                background: "rgba(5, 11, 24, 0.8)",
                                padding: "6px 10px",
                                borderRadius: "6px",
                                fontFamily: "monospace",
                                fontSize: "10px",
                                color: "#c084fc",
                                wordBreak: "break-all",
                            }}>
                                🔑 x402 Proof Signature: {item.x402Sig}
                            </div>
                        )}
                    </div>
                ))}
            </div>

            {/* Summary Banner */}
            <div
                style={{
                    marginTop: "18px",
                    padding: "16px 20px",
                    background: isApprove
                        ? "linear-gradient(135deg, rgba(16, 185, 129, 0.12), rgba(6, 182, 212, 0.12))"
                        : isDeny
                        ? "rgba(239, 68, 68, 0.12)"
                        : "rgba(245, 158, 11, 0.12)",
                    border: `1.5px solid ${
                        isApprove ? "rgba(16, 185, 129, 0.5)" : isDeny ? "rgba(239, 68, 68, 0.5)" : "rgba(245, 158, 11, 0.5)"
                    }`,
                    borderRadius: "16px",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    flexWrap: "wrap",
                    gap: "14px",
                }}
            >
                <div>
                    <div style={{ fontSize: "11px", textTransform: "uppercase", letterSpacing: "0.08em", color: "#94a3b8", fontWeight: 700 }}>
                        Overall Intelligence Confidence
                    </div>
                    <div style={{ fontSize: "1.4rem", fontWeight: 900, color: isApprove ? "#34d399" : "#fbbf24" }}>
                        {(overallConfidence * 100).toFixed(1)}%
                    </div>
                </div>

                <div style={{ textAlign: "right" }}>
                    <div style={{ fontSize: "11px", textTransform: "uppercase", letterSpacing: "0.08em", color: "#94a3b8", fontWeight: 700 }}>
                        Autonomous Agent Decision
                    </div>
                    <div
                        style={{
                            fontSize: "1.05rem",
                            fontWeight: 900,
                            letterSpacing: "0.04em",
                            color: isApprove ? "#34d399" : isDeny ? "#f87171" : "#fbbf24",
                            textTransform: "uppercase",
                        }}
                    >
                        {isApprove ? "✓ AUTO SETTLE" : isDeny ? "✕ SETTLEMENT BLOCKED" : "⚠ HOLD FOR REVIEW"}
                    </div>
                </div>
            </div>
        </div>
    );
}

export default TelegraphDecisionTrace;
