"use client";

import React, { useState } from "react";

export type DemoPreset =
    | "clean"
    | "whale"
    | "sybil_attack"
    | "gas_spike"
    | "fraud_drainer"
    | "velocity_breach"
    | "ratelock";

interface Preset {
    id: DemoPreset;
    category: "standard" | "chaos";
    emoji: string;
    label: string;
    badge: string;
    badgeColor: string;
    badgeBg: string;
    desc: string;
    tag: string;
    tagColor: string;
    currency: string;
    amount: string;
    counterparty: string;
    scenario: string[];
}

const PRESETS: Preset[] = [
    // --- Standard Remittance ---
    {
        id: "clean",
        category: "standard",
        emoji: "🟢",
        label: "Clean Remittance",
        badge: "AUTO-APPROVE",
        badgeColor: "#34d399",
        badgeBg: "rgba(16,185,129,0.15)",
        desc: "Institutional USDC payout with 800+ on-chain tx history, low priority gas, positive market sentiment.",
        tag: "Risk ~10/100",
        tagColor: "#34d399",
        currency: "USDC",
        amount: "500",
        counterparty: "9Xy3mK5RnPqLaWdT8VbYcE2fHjkMnXsQ4wZuG6KhArF",
        scenario: [
            "CRYPTO_PRICE miners: $1.00 USD consensus (Subnet 101)",
            "FRAUD_DETECTION → Groq LLM: CLEAR (Subnet 102)",
            "WALLET_BALANCE: riskTier = low, verified liquidity (Subnet 103)",
            "Composite Risk: 10/100 → auto_approve",
            "Proof sealed via Merkle Tree & anchored to Solana Devnet Memo",
        ],
    },
    {
        id: "whale",
        category: "standard",
        emoji: "🐋",
        label: "Whale Settlement",
        badge: "SOLANA ANCHOR",
        badgeColor: "#a855f7",
        badgeBg: "rgba(168,85,247,0.15)",
        desc: "Large 150 SOL off-ramp. Verifies deep on-chain reserves and high solvency tiers across multi-miner consensus.",
        tag: "Solvency Tier 1",
        tagColor: "#c084fc",
        currency: "SOL",
        amount: "150",
        counterparty: "7Hn2dR8mWpKxQjLsA4vYeT6bNcMfUgZ1oIyP3wCsEqV",
        scenario: [
            "Subnet 101: 3-miner price consensus on SOL/USD spot",
            "Subnet 103: Confirms high reserves (>1,000 SOL balance)",
            "Risk Score: 18/100 → auto_approve clearance",
            "Full Merkle Proof generated with SPL Memo anchor on Solana Devnet",
        ],
    },
    {
        id: "ratelock",
        category: "standard",
        emoji: "⏱️",
        label: "Rate-Lock Arbitrage Expiry",
        badge: "RATE EXPIRED",
        badgeColor: "#38bdf8",
        badgeBg: "rgba(6,182,212,0.15)",
        desc: "90-second rate-lock window expires before settlement execution. Demonstrates front-running & slippage protection.",
        tag: "90s Window Guard",
        tagColor: "#38bdf8",
        currency: "USDC",
        amount: "1000",
        counterparty: "9Xy3mK5RnPqLaWdT8VbYcE2fHjkMnXsQ4wZuG6KhArF",
        scenario: [
            "Quotes locked at guaranteed exchange rate for 90s",
            "If transaction is delayed beyond window, state machine locks out",
            "Prevents latency arbitrage and adverse currency swings",
            "Re-quote required to protect settlement liquidity pool",
        ],
    },

    // --- Chaos Engine & Adversarial Attacks ---
    {
        id: "sybil_attack",
        category: "chaos",
        emoji: "⚔️",
        label: "Byzantine Sybil Price Attack",
        badge: "OUTLIER REJECTION",
        badgeColor: "#f59e0b",
        badgeBg: "rgba(245,158,11,0.15)",
        desc: "Colluding rogue miners inject 35% price deviation. Consensus engine rejects outliers via Median Absolute Deviation.",
        tag: "Byzantine Tolerant",
        tagColor: "#fbbf24",
        currency: "SOL",
        amount: "50",
        counterparty: "FkR9mC4xBnLqYdW8HpZ7sVtE3aGjN6QwMuP5eAyCbKn",
        scenario: [
            "Rogue Miner 2 & 3 attempt to report distorted price ($245 vs $181)",
            "Consensus engine detects divergence > 15% threshold",
            "Rank-weighted median drops outlier quotes",
            "Audit log flags divergent miners with proof hash penalty",
            "Fair market exchange rate preserved without slippage",
        ],
    },
    {
        id: "gas_spike",
        category: "chaos",
        emoji: "🔥",
        label: "Mempool Gas Congestion Storm",
        badge: "HOLD FOR REVIEW",
        badgeColor: "#f97316",
        badgeBg: "rgba(249,115,22,0.15)",
        desc: "Subnet 104 reports severe mempool gas spike (650 gwei). Elevated risk score triggers precautionary hold.",
        tag: "Risk ~64/100",
        tagColor: "#fb923c",
        currency: "SOL",
        amount: "25",
        counterparty: "3jB5yK9LnPqMaWdT8VbYcE2fHjkMnXsQ4wZuG6KhArF",
        scenario: [
            "Subnet 104: Priority fees surge past threshold (>5000 lamports)",
            "Gas congestion penalty (+25 pts) applied to composite risk",
            "News sentiment signal indicates high network volatility",
            "Composite Risk: 64/100 → hold_for_review",
            "Guards protocol against sandwich attacks and execution failure",
        ],
    },
    {
        id: "fraud_drainer",
        category: "chaos",
        emoji: "🚨",
        label: "Sanctioned OFAC Drainer Address",
        badge: "AUTO-DENY",
        badgeColor: "#ef4444",
        badgeBg: "rgba(239,68,68,0.15)",
        desc: "Known phishing drainer wallet. Subnet 102 Groq LLM identifies illicit provenance -> 100% miner consensus to deny.",
        tag: "Risk ~92/100",
        tagColor: "#f87171",
        currency: "SOL",
        amount: "10",
        counterparty: "scam-drain-malicious-rug-address-0x402",
        scenario: [
            "Subnet 102: Groq LLM flags Tornado Cash / illicit drainer cluster",
            "All 3 fraud-detection miners return unanimous SUSPICIOUS verdict",
            "Fraud signal adds +60 pts to composite risk engine",
            "Composite Risk: 92/100 → auto_deny clearance rejected",
            "Settlement aborted; immutable audit receipt sealed",
        ],
    },
    {
        id: "velocity_breach",
        category: "chaos",
        emoji: "⚡",
        label: "Flash-Loan Velocity Spike",
        badge: "VELOCITY BREACH",
        badgeColor: "#ec4899",
        badgeBg: "rgba(236,72,153,0.15)",
        desc: "Rapid-fire off-ramp attempts (>3 transactions in under 2 minutes). Triggers automated anti-sybil velocity lockout.",
        tag: "High Velocity Hold",
        tagColor: "#f472b6",
        currency: "USDC",
        amount: "2500",
        counterparty: "9Xy3mK5RnPqLaWdT8VbYcE2fHjkMnXsQ4wZuG6KhArF",
        scenario: [
            "In-memory velocity tracker detects repeated transactions in window",
            "Velocity penalty (+30 pts) added to composite risk",
            "Prevents rapid flash-loan capital drain from off-ramp pool",
            "Transaction routed to compliance queue with audit trail",
        ],
    },
];

interface DemoPresetsProps {
    onApply: (preset: { currency: string; amount: string; counterparty: string }) => void;
}

export function DemoPresets({ onApply }: DemoPresetsProps) {
    const [selectedTab, setSelectedTab] = useState<"standard" | "chaos">("standard");
    const [activePreset, setActivePreset] = useState<DemoPreset | null>(null);
    const [detailsOpen, setDetailsOpen] = useState(false);

    const filteredPresets = PRESETS.filter(p => p.category === selectedTab);
    const current = PRESETS.find(p => p.id === activePreset);

    const handleSelect = (preset: Preset) => {
        setActivePreset(preset.id);
        setDetailsOpen(true);
        onApply({
            currency: preset.currency,
            amount: preset.amount,
            counterparty: preset.counterparty,
        });
    };

    return (
        <div style={{
            marginBottom: "24px",
            background: "linear-gradient(135deg, rgba(15,23,42,0.9), rgba(5,11,24,0.95))",
            border: "1px solid rgba(6,182,212,0.3)",
            borderRadius: "16px",
            padding: "18px 20px",
            boxShadow: "0 8px 32px rgba(0,0,0,0.4)",
        }}>
            {/* Header with Tab Switcher */}
            <div style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                marginBottom: "14px",
                flexWrap: "wrap",
                gap: "10px",
            }}>
                <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                    <div style={{
                        width: "28px",
                        height: "28px",
                        borderRadius: "8px",
                        background: selectedTab === "chaos"
                            ? "linear-gradient(135deg, #ef4444, #f97316)"
                            : "linear-gradient(135deg, var(--accent-cyan), #3b82f6)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: "14px",
                    }}>
                        {selectedTab === "chaos" ? "🔥" : "👨‍⚖️"}
                    </div>
                    <div>
                        <div style={{ fontWeight: 800, fontSize: "0.95rem", color: "var(--text-primary)" }}>
                            Judge Demo Presets & Chaos Testing Lab
                        </div>
                        <div style={{ fontSize: "0.72rem", color: "var(--text-muted)" }}>
                            Instant 1-click test scenarios for Telegraph Protocol Track 3 judges
                        </div>
                    </div>
                </div>

                {/* Tab Switcher */}
                <div style={{
                    display: "inline-flex",
                    padding: "3px",
                    background: "rgba(30,41,59,0.7)",
                    borderRadius: "10px",
                    border: "1px solid rgba(51,65,85,0.7)",
                    gap: "4px",
                }}>
                    <button
                        type="button"
                        onClick={() => setSelectedTab("standard")}
                        style={{
                            padding: "5px 12px",
                            borderRadius: "7px",
                            fontSize: "12px",
                            fontWeight: 600,
                            cursor: "pointer",
                            background: selectedTab === "standard" ? "rgba(6,182,212,0.25)" : "transparent",
                            color: selectedTab === "standard" ? "#38bdf8" : "#94a3b8",
                            border: selectedTab === "standard" ? "1px solid rgba(6,182,212,0.4)" : "1px solid transparent",
                            transition: "all 0.15s",
                        }}
                    >
                        Standard Off-Ramp
                    </button>
                    <button
                        type="button"
                        onClick={() => setSelectedTab("chaos")}
                        style={{
                            padding: "5px 12px",
                            borderRadius: "7px",
                            fontSize: "12px",
                            fontWeight: 600,
                            cursor: "pointer",
                            background: selectedTab === "chaos" ? "rgba(239,68,68,0.25)" : "transparent",
                            color: selectedTab === "chaos" ? "#f87171" : "#94a3b8",
                            border: selectedTab === "chaos" ? "1px solid rgba(239,68,68,0.4)" : "1px solid transparent",
                            transition: "all 0.15s",
                        }}
                    >
                        ⚔️ Chaos & Attacks
                    </button>
                </div>
            </div>

            {/* Preset Cards Grid */}
            <div style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
                gap: "10px",
                marginBottom: detailsOpen && current ? "14px" : "0",
            }}>
                {filteredPresets.map(preset => {
                    const isSelected = activePreset === preset.id;
                    return (
                        <button
                            key={preset.id}
                            type="button"
                            onClick={() => handleSelect(preset)}
                            style={{
                                textAlign: "left",
                                padding: "12px 14px",
                                background: isSelected
                                    ? "linear-gradient(135deg, rgba(6,182,212,0.15), rgba(15,23,42,0.9))"
                                    : "rgba(15,23,42,0.6)",
                                border: isSelected
                                    ? "1.5px solid var(--accent-cyan)"
                                    : "1px solid rgba(51,65,85,0.5)",
                                borderRadius: "12px",
                                cursor: "pointer",
                                transition: "all 0.18s ease",
                                display: "flex",
                                flexDirection: "column",
                                gap: "6px",
                            }}
                        >
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", width: "100%" }}>
                                <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                                    <span style={{ fontSize: "1.1rem" }}>{preset.emoji}</span>
                                    <span style={{ fontWeight: 700, fontSize: "0.85rem", color: "var(--text-primary)" }}>
                                        {preset.label}
                                    </span>
                                </div>
                                <span style={{
                                    fontSize: "0.62rem",
                                    fontWeight: 700,
                                    padding: "2px 6px",
                                    borderRadius: "999px",
                                    background: preset.badgeBg,
                                    color: preset.badgeColor,
                                    border: `1px solid ${preset.badgeColor}40`,
                                }}>
                                    {preset.badge}
                                </span>
                            </div>

                            <div style={{ fontSize: "0.72rem", color: "var(--text-muted)", lineHeight: 1.3 }}>
                                {preset.desc}
                            </div>

                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "4px" }}>
                                <span style={{ fontSize: "0.7rem", color: preset.tagColor, fontWeight: 600 }}>
                                    {preset.tag}
                                </span>
                                <span style={{ fontSize: "0.7rem", color: "var(--accent-cyan)", fontWeight: 700 }}>
                                    {preset.amount} {preset.currency} →
                                </span>
                            </div>
                        </button>
                    );
                })}
            </div>

            {/* Active Preset Deep Dive */}
            {detailsOpen && current && (
                <div style={{
                    marginTop: "12px",
                    padding: "12px 14px",
                    borderRadius: "10px",
                    background: "rgba(6,182,212,0.06)",
                    border: "1px solid rgba(6,182,212,0.25)",
                    fontSize: "0.75rem",
                }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
                        <span style={{ fontWeight: 700, color: "var(--accent-cyan)", textTransform: "uppercase", letterSpacing: "0.06em", fontSize: "0.7rem" }}>
                            Scenario Execution Blueprint · {current.label}
                        </span>
                        <button
                            type="button"
                            onClick={() => setDetailsOpen(false)}
                            style={{ background: "none", border: "none", color: "var(--text-muted)", cursor: "pointer", fontSize: "11px" }}
                        >
                            ✕ Dismiss
                        </button>
                    </div>

                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "6px" }}>
                        {current.scenario.map((step, i) => (
                            <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: "6px", color: "var(--text-secondary)" }}>
                                <span style={{ color: current.badgeColor, fontWeight: 700 }}>{i + 1}.</span>
                                <span>{step}</span>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
