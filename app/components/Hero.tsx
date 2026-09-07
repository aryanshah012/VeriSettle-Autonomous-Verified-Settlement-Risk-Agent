"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";

const SUBNETS = [
    { id: "101", label: "Pricing & FX", desc: "CRYPTO_PRICE ⊕ CURRENCY_EXCHANGE", icon: "💱", color: "#38bdf8" },
    { id: "102", label: "TrustFilter AI", desc: "FRAUD_DETECTION (Groq LLM)", icon: "🛡️", color: "#a855f7" },
    { id: "103", label: "Solvency Audit", desc: "WALLET_BALANCE_CHECK", icon: "🏦", color: "#34d399" },
    { id: "104", label: "Mempool & Gas", desc: "GAS_PRICE (Congestion Engine)", icon: "⛽", color: "#f59e0b" },
    { id: "105", label: "DeNews Intel", desc: "NEWS_SEARCH (Macro Regulatory)", icon: "📡", color: "#f87171" },
];

const STATS = [
    { value: "96.4%", label: "Quorum Confidence", color: "#34d399" },
    { value: "482ms", label: "Telegraph Latency", color: "#38bdf8" },
    { value: "3 Miners", label: "Active Subnet Quorum", color: "#a855f7" },
    { value: "SPL Memo", label: "On-Chain Proof Anchor", color: "#f59e0b" },
];

const PIPELINE = [
    { stage: "Intent",  icon: "📝", color: "#94a3b8" },
    { stage: "Quote",   icon: "💱", color: "#38bdf8" },
    { stage: "Screen",  icon: "🛡️", color: "#a855f7" },
    { stage: "Decide",  icon: "🤖", color: "#f59e0b" },
    { stage: "Settle",  icon: "⚡", color: "#34d399" },
    { stage: "Proof",   icon: "🔐", color: "#10b981" },
];

const ATTACKS = [
    { type: "Oracle Manipulation", icon: "⚔️", result: "BLOCK", desc: "Sybil miner +35% price deviation detected by MAD engine" },
    { type: "Fraudulent Wallet", icon: "🚨", result: "BLOCK", desc: "Subnet 102 Groq LLM intercepts known drainer address" },
    { type: "Stablecoin Depeg", icon: "⚡", result: "HALT", desc: "Circuit breaker freezes settlement during USDC deviation" },
    { type: "Regulatory Shock", icon: "🏛️", result: "HOLD", desc: "OFAC cross-border bulletin triggers compliance hold" },
];

export const Hero = () => {
    const [activeSubnet, setActiveSubnet] = useState(0);

    useEffect(() => {
        const interval = setInterval(() => {
            setActiveSubnet(i => (i + 1) % SUBNETS.length);
        }, 2400);
        return () => clearInterval(interval);
    }, []);

    return (
        <div style={{ minHeight: "calc(100vh - 64px)", color: "#f8fafc" }}>
            {/* ── HERO SECTION ── */}
            <div style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                textAlign: "center",
                padding: "72px 24px 60px",
            }}>
                <div style={{ marginBottom: "28px" }}>
                    <div style={{
                        display: "inline-flex", alignItems: "center", gap: "8px",
                        padding: "6px 18px", borderRadius: "999px",
                        background: "rgba(6, 182, 212, 0.1)", border: "1px solid rgba(6, 182, 212, 0.3)",
                        fontSize: "0.78rem", fontWeight: 700, color: "#38bdf8", letterSpacing: "0.02em",
                    }}>
                        <span style={{ width: "6px", height: "6px", borderRadius: "50%", background: "#38bdf8", animation: "pulse 1.5s infinite" }} />
                        <span>Telegraph Protocol Hackathon 2026 · Track 3: Applications</span>
                    </div>
                </div>

                <h1 className="display" style={{
                    fontSize: "clamp(2.5rem, 5.5vw, 4.4rem)", fontWeight: 900,
                    letterSpacing: "-0.04em", lineHeight: 1.08,
                    marginBottom: "22px", maxWidth: "960px",
                }}>
                    Verified Intelligence{" "}<br />
                    <span className="gradient-animate">Before Value Moves</span>
                </h1>

                <p style={{
                    fontSize: "clamp(1.05rem, 2vw, 1.22rem)", color: "#94a3b8",
                    maxWidth: "680px", lineHeight: 1.65, margin: "0 auto 36px",
                }}>
                    VeriSettle is an autonomous settlement agent that consults 5 Telegraph intelligence subnets —
                    price, fraud, wallet, gas, and news — then either approves, holds, or blocks your settlement
                    and seals the decision with a cryptographic Merkle proof on Solana Devnet.
                </p>

                <div style={{ display: "flex", gap: "14px", flexWrap: "wrap", justifyContent: "center", marginBottom: "56px" }}>
                    <Link href="/settlement" className="btn-primary" style={{
                        padding: "0.95rem 2.6rem", fontSize: "1.05rem", fontWeight: 800,
                        textDecoration: "none", display: "inline-flex", alignItems: "center", gap: "8px",
                        boxShadow: "0 4px 24px rgba(6, 182, 212, 0.4)",
                    }}>
                        <span>⚡</span><span>Run Live Settlement</span><span>→</span>
                    </Link>
                    <Link href="/settlement?tab=attack_lab" className="btn-secondary" style={{
                        padding: "0.95rem 2rem", fontSize: "1.05rem", fontWeight: 600,
                        textDecoration: "none", display: "inline-flex", alignItems: "center", gap: "8px",
                    }}>
                        <span>🔬</span><span>Attack Lab Demo</span>
                    </Link>
                    <Link href="/verify" className="btn-secondary" style={{
                        padding: "0.95rem 2rem", fontSize: "1.05rem", fontWeight: 600,
                        textDecoration: "none", display: "inline-flex", alignItems: "center", gap: "8px",
                    }}>
                        <span>🔐</span><span>Verify a Proof</span>
                    </Link>
                </div>

                {/* Live Stat Bar */}
                <div style={{
                    display: "flex", maxWidth: "800px", width: "100%",
                    background: "rgba(15, 23, 42, 0.7)", border: "1px solid rgba(255,255,255,0.08)",
                    borderRadius: "16px", overflow: "hidden",
                }}>
                    {STATS.map((stat, i) => (
                        <div key={i} style={{
                            flex: 1, padding: "18px 16px", textAlign: "center",
                            borderRight: i < STATS.length - 1 ? "1px solid rgba(255,255,255,0.06)" : "none",
                        }}>
                            <div style={{ fontSize: "1.4rem", fontWeight: 800, color: stat.color, fontFamily: "monospace", marginBottom: "4px" }}>{stat.value}</div>
                            <div style={{ fontSize: "0.68rem", color: "#64748b", textTransform: "uppercase", letterSpacing: "0.06em" }}>{stat.label}</div>
                        </div>
                    ))}
                </div>
            </div>

            {/* ── PIPELINE SECTION ── */}
            <div style={{ padding: "60px 24px", background: "rgba(5, 11, 24, 0.5)" }}>
                <div style={{ maxWidth: "1100px", margin: "0 auto" }}>
                    <div style={{ textAlign: "center", marginBottom: "40px" }}>
                        <div style={{ fontSize: "0.78rem", color: "#38bdf8", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "10px" }}>How It Works</div>
                        <h2 style={{ fontSize: "clamp(1.5rem, 3vw, 2.2rem)", fontWeight: 800, margin: 0, color: "#f8fafc" }}>
                            Autonomous 6-Stage Settlement Pipeline
                        </h2>
                        <p style={{ color: "#64748b", marginTop: "10px", fontSize: "0.95rem" }}>
                            Every settlement flows through verified intelligence at each stage — no shortcuts.
                        </p>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", flexWrap: "wrap", gap: "0" }}>
                        {PIPELINE.map((p, i) => (
                            <React.Fragment key={p.stage}>
                                <div style={{
                                    display: "flex", flexDirection: "column", alignItems: "center", gap: "10px",
                                    padding: "20px 18px", background: "rgba(15,23,42,0.7)",
                                    border: `1px solid ${p.color}40`, borderRadius: "14px", minWidth: "110px",
                                }}>
                                    <div style={{
                                        width: "52px", height: "52px", borderRadius: "50%",
                                        background: `${p.color}18`, border: `2px solid ${p.color}`,
                                        display: "flex", alignItems: "center", justifyContent: "center",
                                        fontSize: "1.3rem", boxShadow: `0 0 16px ${p.color}30`,
                                    }}>{p.icon}</div>
                                    <div style={{ fontSize: "0.8rem", fontWeight: 700, color: p.color }}>{p.stage}</div>
                                </div>
                                {i < PIPELINE.length - 1 && (
                                    <div style={{
                                        width: "28px", height: "2px",
                                        background: `linear-gradient(90deg, ${PIPELINE[i].color}60, ${PIPELINE[i + 1].color}60)`,
                                        flexShrink: 0,
                                    }} />
                                )}
                            </React.Fragment>
                        ))}
                    </div>
                </div>
            </div>

            {/* ── 5-SUBNET SECTION ── */}
            <div style={{ padding: "60px 24px" }}>
                <div style={{ maxWidth: "1100px", margin: "0 auto" }}>
                    <div style={{ textAlign: "center", marginBottom: "36px" }}>
                        <div style={{ fontSize: "0.78rem", color: "#a855f7", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "10px" }}>Telegraph Protocol Intelligence</div>
                        <h2 style={{ fontSize: "clamp(1.5rem, 3vw, 2.2rem)", fontWeight: 800, margin: 0, color: "#f8fafc" }}>
                            5-Subnet Verified Intelligence Network
                        </h2>
                        <p style={{ color: "#64748b", marginTop: "10px", fontSize: "0.95rem" }}>
                            Independent miners across 5 specialized subnets form consensus before any value moves.
                        </p>
                    </div>
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "16px" }}>
                        {SUBNETS.map((subnet, i) => (
                            <div key={subnet.id}
                                onMouseEnter={() => setActiveSubnet(i)}
                                style={{
                                    padding: "20px",
                                    background: activeSubnet === i ? `rgba(30,41,59,0.9)` : "rgba(15,23,42,0.7)",
                                    border: `1px solid ${activeSubnet === i ? subnet.color + "70" : "rgba(51,65,85,0.5)"}`,
                                    borderRadius: "14px",
                                    transition: "all 0.4s ease",
                                    boxShadow: activeSubnet === i ? `0 0 20px ${subnet.color}20` : "none",
                                    cursor: "default",
                                }}>
                                <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "12px" }}>
                                    <div style={{
                                        width: "38px", height: "38px", borderRadius: "10px",
                                        background: `${subnet.color}18`, border: `1px solid ${subnet.color}40`,
                                        display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.1rem",
                                    }}>{subnet.icon}</div>
                                    <div>
                                        <div style={{ fontSize: "0.62rem", color: subnet.color, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em" }}>Subnet {subnet.id}</div>
                                        <div style={{ fontSize: "0.88rem", fontWeight: 700, color: "#f8fafc" }}>{subnet.label}</div>
                                    </div>
                                </div>
                                <div style={{ fontSize: "0.74rem", color: "#64748b", fontFamily: "monospace" }}>{subnet.desc}</div>
                                {activeSubnet === i && (
                                    <div style={{ marginTop: "10px", display: "flex", alignItems: "center", gap: "5px", fontSize: "0.68rem", color: subnet.color, fontWeight: 600 }}>
                                        <span style={{ width: "5px", height: "5px", borderRadius: "50%", background: subnet.color, animation: "pulse 1.2s infinite" }} />
                                        Querying miners…
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* ── ATTACK DEFENSE SECTION ── */}
            <div style={{ padding: "60px 24px", background: "rgba(5,11,24,0.5)" }}>
                <div style={{ maxWidth: "1100px", margin: "0 auto" }}>
                    <div style={{ display: "grid", gridTemplateColumns: "minmax(280px,1fr) 1fr", gap: "60px", alignItems: "center" }}>
                        <div>
                            <div style={{ fontSize: "0.78rem", color: "#f87171", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "10px" }}>Adversarial Defense</div>
                            <h2 style={{ fontSize: "clamp(1.4rem, 2.5vw, 2rem)", fontWeight: 800, margin: "0 0 16px", color: "#f8fafc" }}>
                                Every attack is a block, not a bypass
                            </h2>
                            <p style={{ color: "#94a3b8", lineHeight: 1.7, marginBottom: "24px", fontSize: "0.95rem" }}>
                                VeriSettle evaluates 6 real-time intelligence streams. When any signal crosses a threat threshold,
                                settlement is halted instantly — with a cryptographic audit trail proving why.
                            </p>
                            <Link href="/settlement?tab=attack_lab" style={{
                                display: "inline-flex", alignItems: "center", gap: "6px",
                                padding: "8px 18px", borderRadius: "8px",
                                background: "rgba(239,68,68,0.15)", border: "1px solid rgba(239,68,68,0.4)",
                                color: "#fca5a5", textDecoration: "none", fontSize: "0.84rem", fontWeight: 700,
                            }}>
                                🔬 Open Attack Lab →
                            </Link>
                        </div>
                        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                            {ATTACKS.map(attack => (
                                <div key={attack.type} style={{
                                    display: "flex", alignItems: "center", gap: "14px",
                                    padding: "14px 16px",
                                    background: "rgba(239,68,68,0.07)", border: "1px solid rgba(239,68,68,0.2)",
                                    borderRadius: "12px",
                                }}>
                                    <span style={{ fontSize: "1.3rem", flexShrink: 0 }}>{attack.icon}</span>
                                    <div style={{ flex: 1 }}>
                                        <div style={{ fontSize: "0.84rem", fontWeight: 700, color: "#f8fafc", marginBottom: "2px" }}>{attack.type}</div>
                                        <div style={{ fontSize: "0.72rem", color: "#94a3b8" }}>{attack.desc}</div>
                                    </div>
                                    <div style={{
                                        padding: "3px 10px", borderRadius: "999px",
                                        background: "rgba(239,68,68,0.2)", border: "1px solid rgba(239,68,68,0.5)",
                                        fontSize: "0.66rem", fontWeight: 800, color: "#fca5a5",
                                        flexShrink: 0, letterSpacing: "0.05em",
                                    }}>{attack.result}</div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            {/* ── FINAL CTA ── */}
            <div style={{ padding: "80px 24px", textAlign: "center" }}>
                <div style={{ maxWidth: "640px", margin: "0 auto" }}>
                    <h2 style={{ fontSize: "clamp(1.6rem, 3vw, 2.4rem)", fontWeight: 900, margin: "0 0 16px", color: "#f8fafc" }}>
                        Ready to test the system?
                    </h2>
                    <p style={{ color: "#94a3b8", marginBottom: "32px", fontSize: "1rem", lineHeight: 1.6 }}>
                        Run a live settlement with real Telegraph miners, or try adversarial attack scenarios.
                        No setup required — one-click demo access.
                    </p>
                    <div style={{ display: "flex", gap: "14px", justifyContent: "center", flexWrap: "wrap" }}>
                        <Link href="/settlement" className="btn-primary" style={{
                            padding: "1rem 2.5rem", fontSize: "1rem", fontWeight: 800,
                            textDecoration: "none", display: "inline-flex", alignItems: "center", gap: "8px",
                            boxShadow: "0 4px 24px rgba(6, 182, 212, 0.4)",
                        }}>
                            <span>Start Settlement</span><span>→</span>
                        </Link>
                        <Link href="/verify" className="btn-secondary" style={{
                            padding: "1rem 2rem", fontSize: "1rem", fontWeight: 600,
                            textDecoration: "none", display: "inline-flex", alignItems: "center", gap: "8px",
                        }}>
                            <span>Verify a Proof</span>
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
};


export default Hero;

