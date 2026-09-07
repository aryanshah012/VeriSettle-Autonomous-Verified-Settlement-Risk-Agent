"use client";

import React, { useState } from "react";

interface MinerFlywheelItem {
    id: string;
    name: string;
    rank: number;
    qualityScore: number; // 0-100
    baselineShare: number; // %
    currentShare: number; // %
    totalQueries: number;
    avgLatencyMs: number;
}

const INITIAL_MINERS: MinerFlywheelItem[] = [
    {
        id: "miner-alpha",
        name: "Miner Alpha (Tier-1 Dedicated)",
        rank: 1,
        qualityScore: 96.4,
        baselineShare: 47,
        currentShare: 61,
        totalQueries: 1420,
        avgLatencyMs: 414,
    },
    {
        id: "miner-beta",
        name: "Miner Beta (Standard Node)",
        rank: 2,
        qualityScore: 89.1,
        baselineShare: 31,
        currentShare: 27,
        totalQueries: 830,
        avgLatencyMs: 560,
    },
    {
        id: "miner-gamma",
        name: "Miner Gamma (Volatile Node)",
        rank: 3,
        qualityScore: 76.5,
        baselineShare: 22,
        currentShare: 12,
        totalQueries: 310,
        avgLatencyMs: 820,
    },
];

export function QualityFlywheelViz({ className = "" }: { className?: string }) {
    const [miners, setMiners] = useState<MinerFlywheelItem[]>(INITIAL_MINERS);
    const [simulatedBatch, setSimulatedBatch] = useState(1);
    const [simulating, setSimulating] = useState(false);

    const handleRunBatch = () => {
        setSimulating(true);
        setTimeout(() => {
            setMiners(prev => {
                const alphaGain = Math.min(78, prev[0].currentShare + 3);
                const gammaLoss = Math.max(5, prev[2].currentShare - 2);
                const betaAdjust = 100 - alphaGain - gammaLoss;

                return [
                    {
                        ...prev[0],
                        currentShare: alphaGain,
                        totalQueries: prev[0].totalQueries + 65,
                        qualityScore: Math.min(99.2, prev[0].qualityScore + 0.3),
                    },
                    {
                        ...prev[1],
                        currentShare: betaAdjust,
                        totalQueries: prev[1].totalQueries + 25,
                        qualityScore: prev[1].qualityScore,
                    },
                    {
                        ...prev[2],
                        currentShare: gammaLoss,
                        totalQueries: prev[2].totalQueries + 10,
                        qualityScore: Math.max(70.0, prev[2].qualityScore - 0.5),
                    },
                ];
            });
            setSimulatedBatch(b => b + 1);
            setSimulating(false);
        }, 300);
    };

    return (
        <div
            className={className}
            style={{
                background: "linear-gradient(135deg, rgba(15, 23, 42, 0.95), rgba(5, 11, 24, 0.98))",
                backdropFilter: "blur(20px)",
                border: "1.5px solid rgba(6, 182, 212, 0.4)",
                borderRadius: "20px",
                padding: "24px",
                boxShadow: "0 16px 40px rgba(0, 0, 0, 0.5), 0 0 30px rgba(6, 182, 212, 0.1)",
                color: "#f8fafc",
            }}
        >
            {/* Header */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px", flexWrap: "wrap", gap: "10px" }}>
                <div>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "1.1rem", fontWeight: 800, color: "#38bdf8" }}>
                        <span>🔄</span>
                        <span>Telegraph Quality Flywheel Visualization</span>
                    </div>
                    <p style={{ fontSize: "12px", color: "#94a3b8", margin: "4px 0 0 0" }}>
                        Evidence of Telegraph's core premise: Higher quality scores $\rightarrow$ Higher leaderboard rank $\rightarrow$ Dynamic routing preference.
                    </p>
                </div>

                <button
                    type="button"
                    onClick={handleRunBatch}
                    disabled={simulating}
                    style={{
                        padding: "8px 16px",
                        borderRadius: "12px",
                        background: "linear-gradient(135deg, rgba(6, 182, 212, 0.25), rgba(59, 130, 246, 0.25))",
                        border: "1px solid rgba(6, 182, 212, 0.5)",
                        color: "#38bdf8",
                        fontWeight: 700,
                        fontSize: "12px",
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        gap: "6px",
                        transition: "all 0.15s ease",
                    }}
                >
                    <span>⚡</span>
                    <span>{simulating ? "Re-weighting…" : `Simulate 100 Settlement Queries (Batch #${simulatedBatch})`}</span>
                </button>
            </div>

            {/* Flywheel Logic Diagram */}
            <div
                style={{
                    background: "rgba(10, 15, 30, 0.7)",
                    border: "1px solid rgba(71, 85, 105, 0.3)",
                    borderRadius: "14px",
                    padding: "12px 16px",
                    marginBottom: "18px",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    flexWrap: "wrap",
                    gap: "8px",
                    fontSize: "11px",
                    color: "#94a3b8",
                }}
            >
                <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                    <strong style={{ color: "#38bdf8" }}>1. Accurate Verification</strong>
                    <span>➔</span>
                    <strong style={{ color: "#c084fc" }}>2. Quality Score Rises</strong>
                    <span>➔</span>
                    <strong style={{ color: "#34d399" }}>3. Probabilistic Routing Boost</strong>
                    <span>➔</span>
                    <strong style={{ color: "#fbbf24" }}>4. Stronger Network Quality</strong>
                </div>
            </div>

            {/* Miner Cards */}
            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                {miners.map((m) => {
                    const isRankOne = m.rank === 1;
                    return (
                        <div
                            key={m.id}
                            style={{
                                background: isRankOne ? "rgba(6, 182, 212, 0.08)" : "rgba(30, 41, 59, 0.4)",
                                border: `1px solid ${isRankOne ? "rgba(6, 182, 212, 0.5)" : "rgba(71, 85, 105, 0.4)"}`,
                                borderRadius: "14px",
                                padding: "16px",
                            }}
                        >
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px", flexWrap: "wrap", gap: "8px" }}>
                                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                                    <div
                                        style={{
                                            width: "26px",
                                            height: "26px",
                                            borderRadius: "8px",
                                            background: isRankOne ? "linear-gradient(135deg, #06b6d4, #3b82f6)" : "rgba(71, 85, 105, 0.5)",
                                            color: isRankOne ? "#050b18" : "#94a3b8",
                                            display: "flex",
                                            alignItems: "center",
                                            justifyContent: "center",
                                            fontWeight: 800,
                                            fontSize: "12px",
                                        }}
                                    >
                                        #{m.rank}
                                    </div>
                                    <strong style={{ fontSize: "13px", color: isRankOne ? "#38bdf8" : "#f1f5f9" }}>
                                        {m.name}
                                    </strong>
                                </div>

                                <div style={{ display: "flex", alignItems: "center", gap: "14px", fontSize: "11px" }}>
                                    <div>
                                        <span style={{ color: "#64748b" }}>Quality Score: </span>
                                        <strong style={{ color: isRankOne ? "#34d399" : "#f8fafc" }}>{m.qualityScore.toFixed(1)}/100</strong>
                                    </div>
                                    <div>
                                        <span style={{ color: "#64748b" }}>Latency: </span>
                                        <strong style={{ color: "#94a3b8" }}>{m.avgLatencyMs}ms</strong>
                                    </div>
                                    <div>
                                        <span style={{ color: "#64748b" }}>Served: </span>
                                        <strong style={{ color: "#cbd5e1" }}>{m.totalQueries} reqs</strong>
                                    </div>
                                </div>
                            </div>

                            {/* Traffic Share Bar */}
                            <div>
                                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "11px", marginBottom: "4px" }}>
                                    <span style={{ color: "#94a3b8" }}>
                                        Routing Share: <strong>{m.currentShare}%</strong> of settlement queries
                                        {m.currentShare > m.baselineShare && (
                                            <span style={{ color: "#34d399", marginLeft: "6px", fontWeight: 700 }}>
                                                (+{m.currentShare - m.baselineShare}% flywheel gain)
                                            </span>
                                        )}
                                        {m.currentShare < m.baselineShare && (
                                            <span style={{ color: "#f87171", marginLeft: "6px", fontWeight: 700 }}>
                                                ({m.currentShare - m.baselineShare}% traffic decay)
                                            </span>
                                        )}
                                    </span>
                                    <span style={{ color: "#64748b" }}>Baseline: {m.baselineShare}%</span>
                                </div>

                                <div style={{ width: "100%", height: "8px", background: "rgba(15, 23, 42, 0.8)", borderRadius: "999px", overflow: "hidden", border: "1px solid rgba(71, 85, 105, 0.4)" }}>
                                    <div
                                        style={{
                                            width: `${m.currentShare}%`,
                                            height: "100%",
                                            background: isRankOne
                                                ? "linear-gradient(90deg, #06b6d4, #34d399)"
                                                : "linear-gradient(90deg, #3b82f6, #8b5cf6)",
                                            borderRadius: "999px",
                                            transition: "width 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)",
                                        }}
                                    />
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

export default QualityFlywheelViz;
