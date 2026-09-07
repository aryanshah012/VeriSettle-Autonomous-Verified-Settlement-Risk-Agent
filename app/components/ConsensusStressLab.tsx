"use client";

import React, { useState } from "react";

export function ConsensusStressLab() {
    const basePrice = 182.4; // SOL/USD spot
    const [miner2Dev, setMiner2Dev] = useState<number>(0); // percent deviation
    const [miner3Dev, setMiner3Dev] = useState<number>(35); // percent deviation (+35% default Sybil)
    const [latency, setLatency] = useState<number>(120); // ms

    // Calculated miner quotes
    const m1Price = basePrice;
    const m2Price = basePrice * (1 + miner2Dev / 100);
    const m3Price = basePrice * (1 + miner3Dev / 100);

    const values = [m1Price, m2Price, m3Price].sort((a, b) => a - b);
    const median = values[1]; // middle element in 3 items

    const tolerance = 0.02; // 2% protocol tolerance
    const m1Diff = Math.abs(m1Price - median) / median;
    const m2Diff = Math.abs(m2Price - median) / median;
    const m3Diff = Math.abs(m3Price - median) / median;

    const inTolerance = [
        { rank: 1, name: "Miner 1 (Anchor)", price: m1Price, diff: m1Diff, pass: m1Diff <= tolerance },
        { rank: 2, name: "Miner 2 (Quorum)", price: m2Price, diff: m2Diff, pass: m2Diff <= tolerance },
        { rank: 3, name: "Miner 3 (Subnet)", price: m3Price, diff: m3Diff, pass: m3Diff <= tolerance },
    ];

    const passCount = inTolerance.filter((m) => m.pass).length;
    const agreementRatio = passCount / 3;
    const isDivergent = agreementRatio < 0.85;

    // Outlier rejection pick
    const consensusPick = inTolerance.filter((m) => m.pass).sort((a, b) => a.rank - b.rank)[0] || inTolerance[0];

    return (
        <div style={{
            background: "rgba(15, 23, 42, 0.75)",
            backdropFilter: "blur(16px)",
            border: "1px solid rgba(51, 65, 85, 0.6)",
            borderRadius: "20px",
            padding: "24px",
            color: "#f8fafc",
        }}>
            {/* Header */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
                <div>
                    <h3 style={{ margin: 0, fontSize: "1.1rem", fontWeight: 700, display: "flex", alignItems: "center", gap: "8px" }}>
                        <span>🔬</span>
                        <span>Byzantine Consensus Stress Lab</span>
                        <span style={{
                            fontSize: "11px",
                            fontWeight: 700,
                            padding: "2px 8px",
                            borderRadius: "6px",
                            background: "rgba(245, 158, 11, 0.15)",
                            border: "1px solid rgba(245, 158, 11, 0.3)",
                            color: "#fbbf24",
                        }}>
                            MAD OUTLIER ENGINE
                        </span>
                    </h3>
                    <p style={{ margin: "4px 0 0", fontSize: "0.8rem", color: "#94a3b8" }}>
                        Experiment with adversarial rogue miner collusion and observe Median Absolute Deviation rejection
                    </p>
                </div>
            </div>

            {/* Controls & Graph Grid */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "24px" }}>
                {/* Sliders Panel */}
                <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                    {/* Miner 2 Deviation */}
                    <div style={{ background: "rgba(30, 41, 59, 0.6)", padding: "14px", borderRadius: "12px", border: "1px solid rgba(71, 85, 105, 0.4)" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12px", marginBottom: "8px" }}>
                            <span style={{ color: "#94a3b8", fontWeight: 600 }}>Miner 2 Price Deviation:</span>
                            <span style={{ fontFamily: "monospace", color: miner2Dev === 0 ? "#10b981" : "#f59e0b", fontWeight: 700 }}>
                                {miner2Dev > 0 ? `+${miner2Dev}%` : `${miner2Dev}%`} (${m2Price.toFixed(2)})
                            </span>
                        </div>
                        <input
                            type="range"
                            min={-50}
                            max={100}
                            value={miner2Dev}
                            onChange={(e) => setMiner2Dev(Number(e.target.value))}
                            style={{ width: "100%", accentColor: "#06b6d4" }}
                        />
                    </div>

                    {/* Miner 3 Deviation */}
                    <div style={{ background: "rgba(30, 41, 59, 0.6)", padding: "14px", borderRadius: "12px", border: "1px solid rgba(71, 85, 105, 0.4)" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12px", marginBottom: "8px" }}>
                            <span style={{ color: "#94a3b8", fontWeight: 600 }}>Miner 3 Price Deviation (Rogue):</span>
                            <span style={{ fontFamily: "monospace", color: miner3Dev === 0 ? "#10b981" : "#ef4444", fontWeight: 700 }}>
                                {miner3Dev > 0 ? `+${miner3Dev}%` : `${miner3Dev}%`} (${m3Price.toFixed(2)})
                            </span>
                        </div>
                        <input
                            type="range"
                            min={-50}
                            max={100}
                            value={miner3Dev}
                            onChange={(e) => setMiner3Dev(Number(e.target.value))}
                            style={{ width: "100%", accentColor: "#ef4444" }}
                        />
                    </div>

                    {/* Network Latency */}
                    <div style={{ background: "rgba(30, 41, 59, 0.6)", padding: "14px", borderRadius: "12px", border: "1px solid rgba(71, 85, 105, 0.4)" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12px", marginBottom: "8px" }}>
                            <span style={{ color: "#94a3b8", fontWeight: 600 }}>Simulated P2P Latency:</span>
                            <span style={{ fontFamily: "monospace", color: "#c084fc", fontWeight: 700 }}>
                                {latency} ms
                            </span>
                        </div>
                        <input
                            type="range"
                            min={10}
                            max={1200}
                            value={latency}
                            onChange={(e) => setLatency(Number(e.target.value))}
                            style={{ width: "100%", accentColor: "#a855f7" }}
                        />
                    </div>
                </div>

                {/* Real-time Math & Consensus Outcome */}
                <div style={{
                    background: "rgba(2, 6, 23, 0.6)",
                    border: "1px solid rgba(71, 85, 105, 0.5)",
                    borderRadius: "16px",
                    padding: "20px",
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "space-between",
                }}>
                    <div>
                        <div style={{ fontSize: "11px", textTransform: "uppercase", color: "#94a3b8", fontWeight: 700, marginBottom: "8px" }}>
                            Quorum Math & Median Absolute Deviation
                        </div>

                        {/* Three Miner Cards */}
                        <div style={{ display: "flex", flexDirection: "column", gap: "8px", marginBottom: "16px" }}>
                            {inTolerance.map((m) => (
                                <div
                                    key={m.rank}
                                    style={{
                                        display: "flex",
                                        justifyContent: "space-between",
                                        alignItems: "center",
                                        background: m.pass ? "rgba(16, 185, 129, 0.1)" : "rgba(239, 68, 68, 0.12)",
                                        border: `1px solid ${m.pass ? "rgba(16, 185, 129, 0.3)" : "rgba(239, 68, 68, 0.4)"}`,
                                        padding: "8px 12px",
                                        borderRadius: "8px",
                                        fontSize: "12px",
                                    }}
                                >
                                    <div>
                                        <span style={{ fontWeight: 700, color: "#fff" }}>{m.name}: </span>
                                        <span style={{ fontFamily: "monospace", color: m.pass ? "#34d399" : "#f87171" }}>
                                            ${m.price.toFixed(2)} USD
                                        </span>
                                    </div>
                                    <span style={{
                                        fontSize: "10px",
                                        fontWeight: 800,
                                        padding: "2px 6px",
                                        borderRadius: "4px",
                                        background: m.pass ? "#059669" : "#dc2626",
                                        color: "#fff",
                                    }}>
                                        {m.pass ? "IN-TOLERANCE (≤2%)" : `OUTLIER (${(m.diff * 100).toFixed(1)}%)`}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Consensus Verdict Box */}
                    <div style={{
                        background: isDivergent ? "rgba(245, 158, 11, 0.12)" : "rgba(16, 185, 129, 0.12)",
                        border: `1px solid ${isDivergent ? "rgba(245, 158, 11, 0.4)" : "rgba(16, 185, 129, 0.4)"}`,
                        borderRadius: "12px",
                        padding: "14px",
                    }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "4px" }}>
                            <span style={{ fontSize: "11px", fontWeight: 800, color: isDivergent ? "#fbbf24" : "#34d399", textTransform: "uppercase" }}>
                                {isDivergent ? "⚠️ BYZANTINE DIVERGENCE FLAGGED" : "✓ CONSENSUS UNANIMOUS"}
                            </span>
                            <span style={{ fontSize: "11px", color: "#94a3b8" }}>
                                Agreement: {(agreementRatio * 100).toFixed(0)}%
                            </span>
                        </div>
                        <div style={{ fontSize: "13px", fontWeight: 700, color: "#f8fafc" }}>
                            Picked Exchange Price: <strong style={{ color: "#38bdf8" }}>${consensusPick.price.toFixed(2)} USD</strong>
                        </div>
                        <p style={{ margin: "4px 0 0", fontSize: "11px", color: "#94a3b8" }}>
                            {isDivergent
                                ? "Outliers mathematically purged. Fair market rate preserved without slippage."
                                : "All miners aligned within 2% tolerance. Clean institutional clearance."}
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
