"use client";

import React, { useState, useEffect } from "react";

interface SubnetNode {
    id: number;
    name: string;
    role: string;
    intent: string;
    color: string;
    miners: number;
    latency: number;
    status: "active" | "consensus" | "divergent";
    desc: string;
}

const SUBNETS: SubnetNode[] = [
    {
        id: 101,
        name: "Subnet 101",
        role: "DeSearch & Pricing",
        intent: "CRYPTO_PRICE ⊕ FX",
        color: "#06b6d4",
        miners: 3,
        latency: 48,
        status: "consensus",
        desc: "Spot SOL/USD and USD/INR price oracle with Median Absolute Deviation outlier rejection.",
    },
    {
        id: 102,
        name: "Subnet 102",
        role: "TrustFilter AI",
        intent: "FRAUD_DETECTION",
        color: "#a855f7",
        miners: 3,
        latency: 125,
        status: "active",
        desc: "Groq LLM cluster analyzing counterparty addresses for drainers, rug patterns & OFAC sanctions.",
    },
    {
        id: 103,
        name: "Subnet 103",
        role: "Solvency Engine",
        intent: "WALLET_BALANCE",
        color: "#10b981",
        miners: 3,
        latency: 52,
        status: "active",
        desc: "On-chain balance auditor establishing reserve liquidity tiers and whale classifications.",
    },
    {
        id: 104,
        name: "Subnet 104",
        role: "Mempool / Gas",
        intent: "GAS_PRICE",
        color: "#f59e0b",
        miners: 3,
        latency: 64,
        status: "active",
        desc: "Real-time priority fee monitor detecting mempool storms and execution volatility.",
    },
    {
        id: 105,
        name: "Subnet 105",
        role: "DeNews Oracle",
        intent: "NEWS_SEARCH",
        color: "#ec4899",
        miners: 3,
        latency: 110,
        status: "active",
        desc: "Sentiment crawler gauging macro market news to insulate settlements from slippage cascades.",
    },
];

export function SubnetMeshViz({ activeIntent }: { activeIntent?: string }) {
    const [selectedSubnet, setSelectedSubnet] = useState<SubnetNode>(SUBNETS[0]);
    const [pulseTick, setPulseTick] = useState(0);

    useEffect(() => {
        const interval = setInterval(() => {
            setPulseTick((t) => (t + 1) % 100);
        }, 50);
        return () => clearInterval(interval);
    }, []);

    // SVG node positions arranged in a clean pentagon around center (200, 200)
    const center = { x: 250, y: 220 };
    const radius = 150;

    const getNodePos = (index: number, total: number) => {
        const angle = (index * 2 * Math.PI) / total - Math.PI / 2;
        return {
            x: center.x + radius * Math.cos(angle),
            y: center.y + radius * Math.sin(angle),
        };
    };

    return (
        <div style={{
            background: "rgba(15, 23, 42, 0.75)",
            backdropFilter: "blur(16px)",
            border: "1px solid rgba(51, 65, 85, 0.6)",
            borderRadius: "20px",
            padding: "24px",
            color: "#f8fafc",
            overflow: "hidden",
        }}>
            {/* Header */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
                <div>
                    <h3 style={{ margin: 0, fontSize: "1.1rem", fontWeight: 700, display: "flex", alignItems: "center", gap: "8px" }}>
                        <span>🕸️</span>
                        <span>Telegraph Subnet Consensus Mesh</span>
                        <span style={{
                            fontSize: "11px",
                            fontWeight: 700,
                            padding: "2px 8px",
                            borderRadius: "6px",
                            background: "rgba(6, 182, 212, 0.15)",
                            border: "1px solid rgba(6, 182, 212, 0.3)",
                            color: "#38bdf8",
                        }}>
                            15 MINERS ONLINE
                        </span>
                    </h3>
                    <p style={{ margin: "4px 0 0", fontSize: "0.8rem", color: "#94a3b8" }}>
                        Live multi-miner decentralized quorum across Subnets 101–105
                    </p>
                </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 280px", gap: "20px", alignItems: "center" }}>
                {/* SVG Network Map */}
                <div style={{ position: "relative", width: "100%", height: "420px", background: "rgba(2, 6, 23, 0.5)", borderRadius: "16px", overflow: "hidden" }}>
                    <svg viewBox="0 0 500 440" style={{ width: "100%", height: "100%" }}>
                        {/* Outer connection ring */}
                        <circle cx={center.x} cy={center.y} r={radius} fill="none" stroke="rgba(51, 65, 85, 0.3)" strokeDasharray="4 4" />

                        {/* Connection lines from center to subnets */}
                        {SUBNETS.map((s, i) => {
                            const pos = getNodePos(i, SUBNETS.length);
                            const isSelected = selectedSubnet.id === s.id;
                            return (
                                <g key={s.id}>
                                    <line
                                        x1={center.x}
                                        y1={center.y}
                                        x2={pos.x}
                                        y2={pos.y}
                                        stroke={isSelected ? s.color : "rgba(71, 85, 105, 0.5)"}
                                        strokeWidth={isSelected ? 2.5 : 1.5}
                                    />
                                    {/* Animated packet along line */}
                                    <circle
                                        cx={center.x + (pos.x - center.x) * ((pulseTick + i * 20) % 100) / 100}
                                        cy={center.y + (pos.y - center.y) * ((pulseTick + i * 20) % 100) / 100}
                                        r={3}
                                        fill={s.color}
                                    />
                                </g>
                            );
                        })}

                        {/* Central VeriSettle Orchestrator Hub */}
                        <g>
                            <circle cx={center.x} cy={center.y} r={34} fill="rgba(15, 23, 42, 0.9)" stroke="#06b6d4" strokeWidth={2} />
                            <circle cx={center.x} cy={center.y} r={40} fill="none" stroke="rgba(6, 182, 212, 0.3)" strokeWidth={1} strokeDasharray="3 3" />
                            <text x={center.x} y={center.y - 4} textAnchor="middle" fill="#fff" fontSize="10.5" fontWeight="800">
                                VERISETTLE
                            </text>
                            <text x={center.x} y={center.y + 10} textAnchor="middle" fill="#06b6d4" fontSize="9" fontWeight="700">
                                ORCHESTRATOR
                            </text>
                        </g>

                        {/* Subnet Nodes */}
                        {SUBNETS.map((s, i) => {
                            const pos = getNodePos(i, SUBNETS.length);
                            const isSelected = selectedSubnet.id === s.id;

                            return (
                                <g
                                    key={s.id}
                                    style={{ cursor: "pointer" }}
                                    onClick={() => setSelectedSubnet(s)}
                                >
                                    {/* Glow circle */}
                                    <circle
                                        cx={pos.x}
                                        cy={pos.y}
                                        r={isSelected ? 30 : 26}
                                        fill="rgba(15, 23, 42, 0.95)"
                                        stroke={s.color}
                                        strokeWidth={isSelected ? 3 : 1.5}
                                    />
                                    <text x={pos.x} y={pos.y - 4} textAnchor="middle" fill="#fff" fontSize="11" fontWeight="700">
                                        #{s.id}
                                    </text>
                                    <text x={pos.x} y={pos.y + 9} textAnchor="middle" fill={s.color} fontSize="8" fontWeight="600">
                                        {s.latency}ms
                                    </text>
                                    <text x={pos.x} y={pos.y + 40} textAnchor="middle" fill="#94a3b8" fontSize="10" fontWeight="600">
                                        {s.role}
                                    </text>
                                </g>
                            );
                        })}
                    </svg>
                </div>

                {/* Subnet Details Panel */}
                <div style={{
                    background: "rgba(30, 41, 59, 0.6)",
                    border: `1px solid ${selectedSubnet.color}40`,
                    borderRadius: "16px",
                    padding: "20px",
                }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
                        <span style={{
                            fontSize: "11px",
                            fontWeight: 800,
                            padding: "3px 8px",
                            borderRadius: "6px",
                            background: `${selectedSubnet.color}25`,
                            color: selectedSubnet.color,
                        }}>
                            {selectedSubnet.name}
                        </span>
                        <span style={{ fontSize: "12px", color: "#34d399", fontWeight: 700 }}>
                            ● {selectedSubnet.status.toUpperCase()}
                        </span>
                    </div>

                    <h4 style={{ margin: "0 0 6px", fontSize: "1.05rem", fontWeight: 700, color: "#fff" }}>
                        {selectedSubnet.role}
                    </h4>

                    <div style={{ fontSize: "11px", fontFamily: "monospace", color: "#94a3b8", marginBottom: "12px" }}>
                        Target Intent: <span style={{ color: "#38bdf8" }}>{selectedSubnet.intent}</span>
                    </div>

                    <p style={{ fontSize: "0.82rem", color: "#cbd5e1", lineHeight: 1.5, margin: "0 0 16px" }}>
                        {selectedSubnet.desc}
                    </p>

                    <div style={{ borderTop: "1px solid rgba(71, 85, 105, 0.4)", paddingTop: "14px", display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
                        <div>
                            <div style={{ fontSize: "10px", color: "#94a3b8", textTransform: "uppercase" }}>Active Miners</div>
                            <div style={{ fontSize: "14px", fontWeight: 800, color: "#f8fafc" }}>
                                {selectedSubnet.miners} Quorum Nodes
                            </div>
                        </div>
                        <div>
                            <div style={{ fontSize: "10px", color: "#94a3b8", textTransform: "uppercase" }}>Median Ping</div>
                            <div style={{ fontSize: "14px", fontWeight: 800, color: selectedSubnet.color, fontFamily: "monospace" }}>
                                {selectedSubnet.latency} ms
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
