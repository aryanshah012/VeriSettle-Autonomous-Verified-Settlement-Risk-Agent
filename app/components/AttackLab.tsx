"use client";

import React, { useState } from "react";

interface ScenarioConfig {
    id: string;
    title: string;
    icon: string;
    description: string;
    intelligence: {
        priceSol: number;
        priceConfidence: number;
        fxUsdInr: number;
        fraudVerdict: "clean" | "suspicious" | "scam";
        fraudRiskScore: number;
        gasPriceGwei: number;
        sentimentHeadline: string;
        sentimentScore: number;
        divergentMiners: boolean;
    };
    decision: "AUTO_SETTLE" | "PROTECTIVE_BLOCK" | "CIRCUIT_BREAKER_HALT";
    decisionLabel: string;
    rationale: string;
}

const SCENARIOS: ScenarioConfig[] = [
    {
        id: "normal",
        title: "Normal Market",
        icon: "🟢",
        description: "Optimal conditions: All Telegraph miners in unanimous quorum, safe wallet, low congestion.",
        intelligence: {
            priceSol: 204.20,
            priceConfidence: 0.97,
            fxUsdInr: 86.85,
            fraudVerdict: "clean",
            fraudRiskScore: 12,
            gasPriceGwei: 22,
            sentimentHeadline: "Solana DeFi TVL hits 12-month high with stable institutional inflows.",
            sentimentScore: 0.42,
            divergentMiners: false,
        },
        decision: "AUTO_SETTLE",
        decisionLabel: "✓ AUTO SETTLE (APPROVED)",
        rationale: "Confidence 96.2% exceeds Institutional policy tier (97% min). Zero redlines detected.",
    },
    {
        id: "oracle_attack",
        title: "Oracle Manipulation",
        icon: "⚔️",
        description: "Byzantine Sybil price attack: A rogue miner injects a +35% deviated quote into Subnet 101.",
        intelligence: {
            priceSol: 275.50,
            priceConfidence: 0.54,
            fxUsdInr: 86.85,
            fraudVerdict: "clean",
            fraudRiskScore: 48,
            gasPriceGwei: 24,
            sentimentHeadline: "Standard market trading volume observed.",
            sentimentScore: 0.05,
            divergentMiners: true,
        },
        decision: "PROTECTIVE_BLOCK",
        decisionLabel: "✕ PROTECTIVE BLOCK (ORACLE DIVERGENCE)",
        rationale: "Miner agreement dropped to 66.7%. Price deviation exceeds 2% tolerance. Autonomous block enforced.",
    },
    {
        id: "fraud_wallet",
        title: "Fraudulent Counterparty",
        icon: "🚨",
        description: "Counterparty address matches an active phishing cluster intercepted by Subnet 102 Groq LLM.",
        intelligence: {
            priceSol: 204.20,
            priceConfidence: 0.96,
            fxUsdInr: 86.85,
            fraudVerdict: "scam",
            fraudRiskScore: 92,
            gasPriceGwei: 21,
            sentimentHeadline: "Market conditions normal.",
            sentimentScore: 0.10,
            divergentMiners: false,
        },
        decision: "PROTECTIVE_BLOCK",
        decisionLabel: "✕ AUTO DENY (FRAUD INTERCEPT)",
        rationale: "Critical redline: Subnet 102 TrustFilter classified address as known drainer. Risk score 92/100.",
    },
    {
        id: "stablecoin_depeg",
        title: "Stablecoin Depeg",
        icon: "⚡",
        description: "Telegraph price oracles detect USDC deviation to $0.974 across centralized & decentralized liquidity pools.",
        intelligence: {
            priceSol: 204.20,
            priceConfidence: 0.91,
            fxUsdInr: 84.10,
            fraudVerdict: "clean",
            fraudRiskScore: 65,
            gasPriceGwei: 38,
            sentimentHeadline: "USDC liquidity reserves under stress; 2.6% price deviation confirmed across major pairs.",
            sentimentScore: -0.68,
            divergentMiners: false,
        },
        decision: "CIRCUIT_BREAKER_HALT",
        decisionLabel: "⚠ AUTONOMOUS CIRCUIT BREAKER: PROTECTIVE HALT",
        rationale: "USDC deviation exceeds 1.2% safety threshold. Autonomous circuit breaker freezes settlement to shield capital.",
    },
    {
        id: "gas_spike",
        title: "Mempool Gas Storm",
        icon: "⛽",
        description: "Subnet 104 detects extreme network congestion with priority fees spiking above 75 gwei.",
        intelligence: {
            priceSol: 204.20,
            priceConfidence: 0.94,
            fxUsdInr: 86.85,
            fraudVerdict: "clean",
            fraudRiskScore: 42,
            gasPriceGwei: 78,
            sentimentHeadline: "High network congestion due to NFT mint spike.",
            sentimentScore: -0.12,
            divergentMiners: false,
        },
        decision: "PROTECTIVE_BLOCK",
        decisionLabel: "✕ SETTLEMENT PAUSED (REVERT RISK)",
        rationale: "Gas fees exceed 55 gwei limit. Precautionary hold applied to prevent transaction execution reverts.",
    },
    {
        id: "regulatory_shock",
        title: "Regulatory Shock",
        icon: "🏛️",
        description: "Telegraph DeNews miners detect breaking OFAC cross-border sanctions bulletin impacting routing corridor.",
        intelligence: {
            priceSol: 198.40,
            priceConfidence: 0.92,
            fxUsdInr: 87.20,
            fraudVerdict: "suspicious",
            fraudRiskScore: 78,
            gasPriceGwei: 28,
            sentimentHeadline: "BREAKING: Global regulatory enforcement updates issued for cross-border crypto remittances.",
            sentimentScore: -0.84,
            divergentMiners: false,
        },
        decision: "PROTECTIVE_BLOCK",
        decisionLabel: "✕ COMPLIANCE HOLD (REGULATORY RISK)",
        rationale: "Negative sentiment shock (-0.84) and compliance flags triggered. Funds held pending policy review.",
    },
];

export function AttackLab({ className = "" }: { className?: string }) {
    const [activeScenario, setActiveScenario] = useState<ScenarioConfig>(SCENARIOS[0]);

    return (
        <div
            className={className}
            style={{
                background: "linear-gradient(135deg, rgba(15, 23, 42, 0.95), rgba(5, 11, 24, 0.98))",
                backdropFilter: "blur(20px)",
                border: "1.5px solid rgba(239, 68, 68, 0.4)",
                borderRadius: "20px",
                padding: "24px",
                boxShadow: "0 16px 40px rgba(0, 0, 0, 0.6), 0 0 30px rgba(239, 68, 68, 0.1)",
                color: "#f8fafc",
            }}
        >
            {/* Header */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px", flexWrap: "wrap", gap: "10px" }}>
                <div>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "1.1rem", fontWeight: 800, color: "#f87171" }}>
                        <span>🔬</span>
                        <span>ATTACK LAB — Adversarial Demonstration</span>
                    </div>
                    <p style={{ fontSize: "12px", color: "#94a3b8", margin: "4px 0 0 0" }}>
                        Test how VeriSettle uses verified Telegraph intelligence to autonomously block malicious or unstable market states.
                    </p>
                </div>
                <div style={{ background: "rgba(239, 68, 68, 0.15)", border: "1px solid rgba(239, 68, 68, 0.4)", padding: "4px 10px", borderRadius: "999px", fontSize: "11px", fontWeight: 700, color: "#fca5a5" }}>
                    Live Simulation Sandbox
                </div>
            </div>

            {/* Scenario Buttons */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: "8px", marginBottom: "20px" }}>
                {SCENARIOS.map((s) => {
                    const isSelected = activeScenario.id === s.id;
                    return (
                        <button
                            key={s.id}
                            type="button"
                            onClick={() => setActiveScenario(s)}
                            style={{
                                padding: "10px 12px",
                                borderRadius: "12px",
                                background: isSelected
                                    ? "linear-gradient(135deg, rgba(239, 68, 68, 0.25), rgba(168, 85, 247, 0.25))"
                                    : "rgba(30, 41, 59, 0.5)",
                                border: `1.5px solid ${isSelected ? "#f87171" : "rgba(71, 85, 105, 0.4)"}`,
                                color: isSelected ? "#fca5a5" : "#94a3b8",
                                fontSize: "12px",
                                fontWeight: 700,
                                cursor: "pointer",
                                display: "flex",
                                alignItems: "center",
                                gap: "6px",
                                transition: "all 0.15s ease",
                                textAlign: "left",
                            }}
                        >
                            <span>{s.icon}</span>
                            <span style={{ whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{s.title}</span>
                        </button>
                    );
                })}
            </div>

            {/* Active Scenario Evaluation Box */}
            <div
                style={{
                    background: "rgba(10, 15, 30, 0.7)",
                    border: "1px solid rgba(71, 85, 105, 0.4)",
                    borderRadius: "16px",
                    padding: "18px",
                }}
            >
                <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "12px" }}>
                    <span style={{ fontSize: "18px" }}>{activeScenario.icon}</span>
                    <strong style={{ fontSize: "14px", color: "#f8fafc" }}>Scenario: {activeScenario.title}</strong>
                    <span style={{ fontSize: "12px", color: "#64748b" }}>— {activeScenario.description}</span>
                </div>

                {/* Intelligence Metrics Grid */}
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(130px, 1fr))", gap: "10px", marginBottom: "16px" }}>
                    <div style={{ background: "rgba(30, 41, 59, 0.5)", padding: "10px", borderRadius: "10px", border: "1px solid rgba(71, 85, 105, 0.3)" }}>
                        <div style={{ fontSize: "10px", color: "#94a3b8", textTransform: "uppercase" }}>SOL Spot Price</div>
                        <div style={{ fontSize: "15px", fontWeight: 800, color: "#38bdf8" }}>${activeScenario.intelligence.priceSol.toFixed(2)}</div>
                        <div style={{ fontSize: "10px", color: activeScenario.intelligence.priceConfidence > 0.8 ? "#34d399" : "#f87171" }}>
                            Conf: {(activeScenario.intelligence.priceConfidence * 100).toFixed(0)}%
                        </div>
                    </div>

                    <div style={{ background: "rgba(30, 41, 59, 0.5)", padding: "10px", borderRadius: "10px", border: "1px solid rgba(71, 85, 105, 0.3)" }}>
                        <div style={{ fontSize: "10px", color: "#94a3b8", textTransform: "uppercase" }}>Fraud Screening</div>
                        <div style={{ fontSize: "14px", fontWeight: 800, color: activeScenario.intelligence.fraudVerdict === "clean" ? "#34d399" : "#f87171" }}>
                            {activeScenario.intelligence.fraudVerdict.toUpperCase()}
                        </div>
                        <div style={{ fontSize: "10px", color: "#94a3b8" }}>
                            Risk: {activeScenario.intelligence.fraudRiskScore}/100
                        </div>
                    </div>

                    <div style={{ background: "rgba(30, 41, 59, 0.5)", padding: "10px", borderRadius: "10px", border: "1px solid rgba(71, 85, 105, 0.3)" }}>
                        <div style={{ fontSize: "10px", color: "#94a3b8", textTransform: "uppercase" }}>Network Gas</div>
                        <div style={{ fontSize: "14px", fontWeight: 800, color: activeScenario.intelligence.gasPriceGwei > 50 ? "#f87171" : "#38bdf8" }}>
                            {activeScenario.intelligence.gasPriceGwei} Gwei
                        </div>
                        <div style={{ fontSize: "10px", color: activeScenario.intelligence.gasPriceGwei > 50 ? "#f87171" : "#34d399" }}>
                            {activeScenario.intelligence.gasPriceGwei > 50 ? "High Congestion" : "Optimal"}
                        </div>
                    </div>

                    <div style={{ background: "rgba(30, 41, 59, 0.5)", padding: "10px", borderRadius: "10px", border: "1px solid rgba(71, 85, 105, 0.3)" }}>
                        <div style={{ fontSize: "10px", color: "#94a3b8", textTransform: "uppercase" }}>Oracle Consensus</div>
                        <div style={{ fontSize: "13px", fontWeight: 800, color: activeScenario.intelligence.divergentMiners ? "#f87171" : "#34d399" }}>
                            {activeScenario.intelligence.divergentMiners ? "Divergent (>2%)" : "Quorum Agreed"}
                        </div>
                        <div style={{ fontSize: "10px", color: "#94a3b8" }}>MAD Filtering Active</div>
                    </div>
                </div>

                {/* News Headline Signal */}
                <div style={{ background: "rgba(15, 23, 42, 0.6)", padding: "10px 14px", borderRadius: "10px", marginBottom: "16px", border: "1px solid rgba(71, 85, 105, 0.3)", fontSize: "11px" }}>
                    <strong style={{ color: "#38bdf8" }}>DeNews Stream (Subnet 101/105): </strong>
                    <span style={{ color: "#cbd5e1" }}>&quot;{activeScenario.intelligence.sentimentHeadline}&quot;</span>
                </div>

                {/* Autonomous Decision Verdict */}
                <div
                    style={{
                        padding: "14px 18px",
                        borderRadius: "12px",
                        background: activeScenario.decision === "AUTO_SETTLE"
                            ? "rgba(16, 185, 129, 0.15)"
                            : "rgba(239, 68, 68, 0.15)",
                        border: `1.5px solid ${activeScenario.decision === "AUTO_SETTLE" ? "#10b981" : "#ef4444"}`,
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        flexWrap: "wrap",
                        gap: "10px",
                    }}
                >
                    <div>
                        <div style={{ fontSize: "10px", textTransform: "uppercase", letterSpacing: "0.08em", color: "#94a3b8", fontWeight: 700 }}>
                            VeriSettle Autonomous Action
                        </div>
                        <div style={{ fontSize: "14px", fontWeight: 900, color: activeScenario.decision === "AUTO_SETTLE" ? "#34d399" : "#f87171" }}>
                            {activeScenario.decisionLabel}
                        </div>
                    </div>
                    <div style={{ fontSize: "11px", color: "#cbd5e1", maxWidth: "420px", textAlign: "right" }}>
                        {activeScenario.rationale}
                    </div>
                </div>
            </div>
        </div>
    );
}

export default AttackLab;
