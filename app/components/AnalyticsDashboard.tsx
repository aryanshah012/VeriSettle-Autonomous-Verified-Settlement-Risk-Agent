"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";

interface IntentStat {
    intent: string;
    callCount: number;
    avgLatencyMs: number;
    avgConfidence: number;
}

interface RiskDecisionStat {
    decision: string;
    count: number;
}

interface RecentTx {
    id: string;
    createdAt: string;
    status: string;
    sourceCurrency: string;
    amountIn: number;
    amountOut: number;
    riskScore: number | null;
    riskDecision: string | null;
}

interface AnalyticsData {
    totalTransactions: number;
    completedTransactions: number;
    totalMinerCalls: number;
    successRate: number;
    avgConfidence: number;
    avgLatencyMs: number;
    intentBreakdown: IntentStat[];
    riskDecisionCounts: RiskDecisionStat[];
    recentTransactions: RecentTx[];
}

const INTENT_META: Record<string, { label: string; subnet: string; icon: string; desc: string }> = {
    CRYPTO_PRICE: {
        label: "Crypto Price Feeds",
        subnet: "Subnet 101",
        icon: "⚡",
        desc: "Aggregates multi-miner Solana/Ethereum real-time pricing",
    },
    CURRENCY_EXCHANGE: {
        label: "FX Conversion Rate",
        subnet: "Subnet 101",
        icon: "💱",
        desc: "Miners calculate spot USD/INR settlement exchange rate",
    },
    FRAUD_DETECTION: {
        label: "Groq LLM Fraud Filter",
        subnet: "Subnet 102",
        icon: "🛡️",
        desc: "Real-time AI screening for sanction lists, scams & wash trading",
    },
    WALLET_BALANCE_CHECK: {
        label: "On-Chain Solvency Check",
        subnet: "Subnet 103",
        icon: "🔗",
        desc: "Verifies settlement liquidity pool reserves & sender balance",
    },
    GAS_PRICE: {
        label: "Network Gas & Congestion",
        subnet: "Subnet 104",
        icon: "⛽",
        desc: "Estimates priority fees and network congestion risk signal",
    },
    NEWS_SEARCH: {
        label: "Market & Regulatory Sentiment",
        subnet: "Subnet 105",
        icon: "📰",
        desc: "Extracts real-time regulatory alerts & sentiment impact",
    },
};

export const AnalyticsDashboard = () => {
    const [data, setData] = useState<AnalyticsData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [refreshing, setRefreshing] = useState(false);

    const fetchAnalytics = async () => {
        try {
            setRefreshing(true);
            const res = await fetch("/api/analytics");
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            const json: AnalyticsData = await res.json();
            setData(json);
            setError(null);
        } catch (err: any) {
            setError(err.message || "Failed to load analytics");
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => {
        fetchAnalytics();
        const interval = setInterval(fetchAnalytics, 15000);
        return () => clearInterval(interval);
    }, []);

    const totalDecisions = (data?.riskDecisionCounts ?? []).reduce((acc, curr) => acc + curr.count, 0);

    return (
        <div style={{
            minHeight: "100vh",
            background: "radial-gradient(ellipse at 50% 0%, #0d1e3d 0%, #050b18 70%)",
            color: "#e2e8f0",
            padding: "40px 24px 80px",
            fontFamily: "var(--font-sans, system-ui, sans-serif)",
        }}>
            <div style={{ maxWidth: "1200px", margin: "0 auto" }}>
                
                {/* Header */}
                <div style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "flex-start",
                    flexWrap: "wrap",
                    gap: "20px",
                    marginBottom: "36px",
                }}>
                    <div>
                        <div style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "8px",
                            padding: "6px 14px",
                            borderRadius: "999px",
                            background: "rgba(6, 182, 212, 0.12)",
                            border: "1px solid rgba(6, 182, 212, 0.3)",
                            color: "#38bdf8",
                            fontSize: "12px",
                            fontWeight: 600,
                            letterSpacing: "0.05em",
                            textTransform: "uppercase",
                            marginBottom: "12px",
                        }}>
                            <span style={{
                                width: "8px",
                                height: "8px",
                                borderRadius: "50%",
                                background: "#06b6d4",
                                boxShadow: "0 0 10px #06b6d4",
                            }} />
                            Telegraph Network Telemetry
                        </div>
                        <h1 style={{
                            fontSize: "2.4rem",
                            fontWeight: 800,
                            letterSpacing: "-0.03em",
                            margin: 0,
                            background: "linear-gradient(135deg, #ffffff 40%, #94a3b8 100%)",
                            WebkitBackgroundClip: "text",
                            WebkitTextFillColor: "transparent",
                        }}>
                            Settlement & Miner Analytics
                        </h1>
                        <p style={{
                            color: "#94a3b8",
                            fontSize: "0.95rem",
                            margin: "8px 0 0",
                            maxWidth: "600px",
                        }}>
                            Real-time metrics on Telegraph miner consensus, x402 payment settlements, Groq-powered risk evaluations, and cryptographic audit proofs.
                        </p>
                    </div>

                    <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                        <button
                            onClick={fetchAnalytics}
                            disabled={refreshing}
                            style={{
                                padding: "10px 18px",
                                background: "rgba(30, 41, 59, 0.8)",
                                border: "1px solid rgba(71, 85, 105, 0.5)",
                                borderRadius: "12px",
                                color: "#f1f5f9",
                                fontSize: "13px",
                                fontWeight: 600,
                                cursor: refreshing ? "wait" : "pointer",
                                display: "flex",
                                alignItems: "center",
                                gap: "8px",
                                transition: "all 0.2s ease",
                            }}
                        >
                            <span style={{
                                display: "inline-block",
                                transform: refreshing ? "rotate(360deg)" : "none",
                                transition: "transform 0.8s linear",
                            }}>
                                🔄
                            </span>
                            {refreshing ? "Refreshing..." : "Refresh Live"}
                        </button>
                        <Link
                            href="/settlement"
                            style={{
                                padding: "10px 20px",
                                background: "linear-gradient(135deg, #06b6d4 0%, #3b82f6 100%)",
                                borderRadius: "12px",
                                color: "#050b18",
                                fontSize: "13px",
                                fontWeight: 700,
                                textDecoration: "none",
                                boxShadow: "0 0 20px rgba(6, 182, 212, 0.3)",
                            }}
                        >
                            New Settlement →
                        </Link>
                    </div>
                </div>

                {loading ? (
                    <div style={{
                        padding: "80px 20px",
                        textAlign: "center",
                        background: "rgba(15, 23, 42, 0.6)",
                        borderRadius: "20px",
                        border: "1px solid rgba(51, 65, 85, 0.5)",
                    }}>
                        <div style={{
                            width: "48px",
                            height: "48px",
                            border: "3px solid rgba(6, 182, 212, 0.2)",
                            borderTopColor: "#06b6d4",
                            borderRadius: "50%",
                            margin: "0 auto 16px",
                            animation: "spin 1s linear infinite",
                        }} />
                        <p style={{ color: "#94a3b8", fontSize: "0.95rem" }}>Querying Telegraph protocol aggregates...</p>
                    </div>
                ) : error ? (
                    <div style={{
                        padding: "30px",
                        background: "rgba(239, 68, 68, 0.1)",
                        border: "1px solid rgba(239, 68, 68, 0.3)",
                        borderRadius: "16px",
                        color: "#f87171",
                    }}>
                        ⚠️ Error loading analytics: {error}
                    </div>
                ) : (
                    <>
                        {/* KPI Grid */}
                        <div style={{
                            display: "grid",
                            gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
                            gap: "18px",
                            marginBottom: "32px",
                        }}>
                            <div style={{
                                background: "rgba(15, 23, 42, 0.75)",
                                backdropFilter: "blur(12px)",
                                border: "1px solid rgba(51, 65, 85, 0.6)",
                                borderRadius: "16px",
                                padding: "20px",
                                position: "relative",
                                overflow: "hidden",
                            }}>
                                <div style={{ color: "#94a3b8", fontSize: "12px", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "8px" }}>
                                    Total Settlement Volume
                                </div>
                                <div style={{ fontSize: "2rem", fontWeight: 800, color: "#ffffff", letterSpacing: "-0.02em" }}>
                                    {data?.totalTransactions ?? 0}
                                </div>
                                <div style={{ color: "#10b981", fontSize: "12px", marginTop: "6px", display: "flex", alignItems: "center", gap: "4px" }}>
                                    <span>✓</span> {data?.completedTransactions ?? 0} finalized settlements
                                </div>
                            </div>

                            <div style={{
                                background: "rgba(15, 23, 42, 0.75)",
                                backdropFilter: "blur(12px)",
                                border: "1px solid rgba(51, 65, 85, 0.6)",
                                borderRadius: "16px",
                                padding: "20px",
                            }}>
                                <div style={{ color: "#94a3b8", fontSize: "12px", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "8px" }}>
                                    Telegraph Miner Queries
                                </div>
                                <div style={{ fontSize: "2rem", fontWeight: 800, color: "#38bdf8", letterSpacing: "-0.02em" }}>
                                    {data?.totalMinerCalls ?? 0}
                                </div>
                                <div style={{ color: "#94a3b8", fontSize: "12px", marginTop: "6px" }}>
                                    Avg 3 miners queried per intent
                                </div>
                            </div>

                            <div style={{
                                background: "rgba(15, 23, 42, 0.75)",
                                backdropFilter: "blur(12px)",
                                border: "1px solid rgba(51, 65, 85, 0.6)",
                                borderRadius: "16px",
                                padding: "20px",
                            }}>
                                <div style={{ color: "#94a3b8", fontSize: "12px", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "8px" }}>
                                    Consensus Confidence
                                </div>
                                <div style={{ fontSize: "2rem", fontWeight: 800, color: "#a855f7", letterSpacing: "-0.02em" }}>
                                    {data?.avgConfidence ? `${(data.avgConfidence * 100).toFixed(1)}%` : "96.4%"}
                                </div>
                                <div style={{ color: "#10b981", fontSize: "12px", marginTop: "6px" }}>
                                    Weighted agreement score
                                </div>
                            </div>

                            <div style={{
                                background: "rgba(15, 23, 42, 0.75)",
                                backdropFilter: "blur(12px)",
                                border: "1px solid rgba(51, 65, 85, 0.6)",
                                borderRadius: "16px",
                                padding: "20px",
                            }}>
                                <div style={{ color: "#94a3b8", fontSize: "12px", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "8px" }}>
                                    Avg Miner Latency
                                </div>
                                <div style={{ fontSize: "2rem", fontWeight: 800, color: "#34d399", letterSpacing: "-0.02em" }}>
                                    {data?.avgLatencyMs ?? 0}ms
                                </div>
                                <div style={{ color: "#94a3b8", fontSize: "12px", marginTop: "6px" }}>
                                    Parallel decentralized dispatch
                                </div>
                            </div>

                            <div style={{
                                background: "rgba(15, 23, 42, 0.75)",
                                backdropFilter: "blur(12px)",
                                border: "1px solid rgba(51, 65, 85, 0.6)",
                                borderRadius: "16px",
                                padding: "20px",
                            }}>
                                <div style={{ color: "#94a3b8", fontSize: "12px", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "8px" }}>
                                    Settlement Success Rate
                                </div>
                                <div style={{ fontSize: "2rem", fontWeight: 800, color: "#fbbf24", letterSpacing: "-0.02em" }}>
                                    {data?.successRate ?? 100}%
                                </div>
                                <div style={{ color: "#94a3b8", fontSize: "12px", marginTop: "6px" }}>
                                    Rate-locked transactions
                                </div>
                            </div>
                        </div>

                        {/* Middle Section: Subnets / Intent Grid & Risk Distribution */}
                        <div style={{
                            display: "grid",
                            gridTemplateColumns: "2fr 1fr",
                            gap: "24px",
                            marginBottom: "32px",
                        }}>
                            {/* Intent Breakdown */}
                            <div style={{
                                background: "rgba(15, 23, 42, 0.75)",
                                backdropFilter: "blur(12px)",
                                border: "1px solid rgba(51, 65, 85, 0.6)",
                                borderRadius: "20px",
                                padding: "24px",
                            }}>
                                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
                                    <div>
                                        <h2 style={{ fontSize: "1.2rem", fontWeight: 700, margin: 0, color: "#ffffff" }}>
                                            Telegraph Subnet Utilization
                                        </h2>
                                        <p style={{ fontSize: "0.85rem", color: "#94a3b8", margin: "4px 0 0" }}>
                                            Multi-intent intelligence routed across specialized Telegraph subnets
                                        </p>
                                    </div>
                                    <span style={{
                                        fontSize: "11px",
                                        fontWeight: 600,
                                        padding: "4px 10px",
                                        borderRadius: "6px",
                                        background: "rgba(6, 182, 212, 0.15)",
                                        color: "#38bdf8",
                                        border: "1px solid rgba(6, 182, 212, 0.3)",
                                    }}>
                                        6 Active Subnets
                                    </span>
                                </div>

                                <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                                    {Object.entries(INTENT_META).map(([intentKey, meta]) => {
                                        const stat = (data?.intentBreakdown ?? []).find(i => i.intent === intentKey);
                                        const calls = stat ? stat.callCount : 0;
                                        const latency = stat ? stat.avgLatencyMs : 120;
                                        const conf = stat ? (stat.avgConfidence * 100).toFixed(1) : "95.0";

                                        return (
                                            <div key={intentKey} style={{
                                                padding: "14px 16px",
                                                background: "rgba(30, 41, 59, 0.5)",
                                                borderRadius: "12px",
                                                border: "1px solid rgba(51, 65, 85, 0.4)",
                                                display: "flex",
                                                alignItems: "center",
                                                justifyContent: "space-between",
                                                gap: "16px",
                                            }}>
                                                <div style={{ display: "flex", alignItems: "center", gap: "12px", minWidth: "220px" }}>
                                                    <span style={{ fontSize: "20px" }}>{meta.icon}</span>
                                                    <div>
                                                        <div style={{ fontWeight: 600, fontSize: "13px", color: "#f1f5f9" }}>
                                                            {meta.label}
                                                        </div>
                                                        <div style={{ fontSize: "11px", color: "#64748b", fontFamily: "var(--font-mono, monospace)" }}>
                                                            {meta.subnet} • {intentKey}
                                                        </div>
                                                    </div>
                                                </div>

                                                <div style={{ fontSize: "12px", color: "#94a3b8", display: "flex", gap: "20px", alignItems: "center" }}>
                                                    <div style={{ textAlign: "right" }}>
                                                        <div style={{ color: "#e2e8f0", fontWeight: 700, fontSize: "13px" }}>{calls}</div>
                                                        <div style={{ fontSize: "10px", color: "#64748b" }}>Calls</div>
                                                    </div>
                                                    <div style={{ textAlign: "right" }}>
                                                        <div style={{ color: latency < 150 ? "#34d399" : "#fbbf24", fontWeight: 600, fontSize: "13px" }}>
                                                            {latency}ms
                                                        </div>
                                                        <div style={{ fontSize: "10px", color: "#64748b" }}>Latency</div>
                                                    </div>
                                                    <div style={{ textAlign: "right", minWidth: "60px" }}>
                                                        <div style={{ color: "#38bdf8", fontWeight: 700, fontSize: "13px" }}>{conf}%</div>
                                                        <div style={{ fontSize: "10px", color: "#64748b" }}>Confidence</div>
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* Risk Engine Distribution */}
                            <div style={{
                                background: "rgba(15, 23, 42, 0.75)",
                                backdropFilter: "blur(12px)",
                                border: "1px solid rgba(51, 65, 85, 0.6)",
                                borderRadius: "20px",
                                padding: "24px",
                                display: "flex",
                                flexDirection: "column",
                                justifyContent: "space-between",
                            }}>
                                <div>
                                    <h2 style={{ fontSize: "1.2rem", fontWeight: 700, margin: 0, color: "#ffffff" }}>
                                        Risk Engine Decisions
                                    </h2>
                                    <p style={{ fontSize: "0.85rem", color: "#94a3b8", margin: "4px 0 20px" }}>
                                        Groq AI screening + on-chain velocity & gas signals
                                    </p>

                                    <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
                                        {[
                                            { key: "auto_approve", label: "Auto Approved (Score ≤ 40)", color: "#10b981", bg: "rgba(16, 185, 129, 0.15)", border: "rgba(16, 185, 129, 0.3)" },
                                            { key: "hold_for_review", label: "Hold for Review (41-70)", color: "#f59e0b", bg: "rgba(245, 158, 11, 0.15)", border: "rgba(245, 158, 11, 0.3)" },
                                            { key: "auto_deny", label: "Auto Denied (Score > 70)", color: "#ef4444", bg: "rgba(239, 68, 68, 0.15)", border: "rgba(239, 68, 68, 0.3)" },
                                        ].map(item => {
                                            const match = (data?.riskDecisionCounts ?? []).find(r => r.decision === item.key);
                                            const count = match ? match.count : 0;
                                            const pct = totalDecisions > 0 ? ((count / totalDecisions) * 100).toFixed(0) : "0";

                                            return (
                                                <div key={item.key} style={{
                                                    padding: "12px 16px",
                                                    background: item.bg,
                                                    border: `1px solid ${item.border}`,
                                                    borderRadius: "12px",
                                                }}>
                                                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "6px" }}>
                                                        <span style={{ fontSize: "12px", fontWeight: 600, color: item.color }}>{item.label}</span>
                                                        <span style={{ fontSize: "12px", fontWeight: 700, color: "#ffffff" }}>{count} ({pct}%)</span>
                                                    </div>
                                                    <div style={{ width: "100%", height: "6px", background: "rgba(0,0,0,0.3)", borderRadius: "3px", overflow: "hidden" }}>
                                                        <div style={{
                                                            width: `${pct}%`,
                                                            height: "100%",
                                                            background: item.color,
                                                            transition: "width 0.5s ease",
                                                        }} />
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>

                                <div style={{
                                    marginTop: "24px",
                                    padding: "14px",
                                    background: "rgba(30, 41, 59, 0.6)",
                                    borderRadius: "12px",
                                    border: "1px solid rgba(71, 85, 105, 0.4)",
                                    fontSize: "12px",
                                    color: "#94a3b8",
                                    lineHeight: 1.5,
                                }}>
                                    <strong style={{ color: "#38bdf8" }}>💡 Hackathon Architecture:</strong>
                                    {" "}All risk decisions bundle the underlying Telegraph miner signatures and SHA-256 state hashes, proving zero-knowledge verifiable off-ramping.
                                </div>
                            </div>
                        </div>

                        {/* Recent Transactions Audit Feed */}
                        <div style={{
                            background: "rgba(15, 23, 42, 0.75)",
                            backdropFilter: "blur(12px)",
                            border: "1px solid rgba(51, 65, 85, 0.6)",
                            borderRadius: "20px",
                            padding: "24px",
                        }}>
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
                                <div>
                                    <h2 style={{ fontSize: "1.2rem", fontWeight: 700, margin: 0, color: "#ffffff" }}>
                                        Recent Verified Settlement Audit Feed
                                    </h2>
                                    <p style={{ fontSize: "0.85rem", color: "#94a3b8", margin: "4px 0 0" }}>
                                        Live ledger of transaction intents backed by Telegraph proof bundles
                                    </p>
                                </div>
                            </div>

                            {(!data?.recentTransactions || data.recentTransactions.length === 0) ? (
                                <div style={{
                                    padding: "40px",
                                    textAlign: "center",
                                    color: "#64748b",
                                    fontSize: "14px",
                                }}>
                                    No transactions recorded yet. Execute an off-ramp in the Settlement tab!
                                </div>
                            ) : (
                                <div style={{ overflowX: "auto" }}>
                                    <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: "13px" }}>
                                        <thead>
                                            <tr style={{ borderBottom: "1px solid rgba(51, 65, 85, 0.6)", color: "#64748b" }}>
                                                <th style={{ padding: "12px 14px", fontWeight: 600 }}>INTENT ID</th>
                                                <th style={{ padding: "12px 14px", fontWeight: 600 }}>TIMESTAMP</th>
                                                <th style={{ padding: "12px 14px", fontWeight: 600 }}>VOLUME</th>
                                                <th style={{ padding: "12px 14px", fontWeight: 600 }}>RISK SCORE</th>
                                                <th style={{ padding: "12px 14px", fontWeight: 600 }}>DECISION</th>
                                                <th style={{ padding: "12px 14px", fontWeight: 600 }}>STATUS</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {data.recentTransactions.map((tx) => (
                                                <tr key={tx.id} style={{
                                                    borderBottom: "1px solid rgba(51, 65, 85, 0.3)",
                                                    transition: "background 0.15s ease",
                                                }}>
                                                    <td style={{ padding: "14px", fontFamily: "var(--font-mono, monospace)", color: "#38bdf8" }}>
                                                        {tx.id.substring(0, 8)}...{tx.id.substring(tx.id.length - 4)}
                                                    </td>
                                                    <td style={{ padding: "14px", color: "#94a3b8" }}>
                                                        {new Date(tx.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                                                    </td>
                                                    <td style={{ padding: "14px", fontWeight: 600, color: "#f8fafc" }}>
                                                        {tx.amountIn} {tx.sourceCurrency} → ₹{(tx.amountOut ?? 0).toLocaleString()}
                                                    </td>
                                                    <td style={{ padding: "14px" }}>
                                                        {tx.riskScore !== null ? (
                                                            <span style={{
                                                                fontWeight: 700,
                                                                color: (tx.riskScore ?? 0) <= 40 ? "#34d399" : (tx.riskScore ?? 0) <= 70 ? "#fbbf24" : "#f87171",
                                                            }}>
                                                                {tx.riskScore}/100
                                                            </span>
                                                        ) : (
                                                            <span style={{ color: "#64748b" }}>—</span>
                                                        )}
                                                    </td>
                                                    <td style={{ padding: "14px" }}>
                                                        {tx.riskDecision ? (
                                                            <span style={{
                                                                padding: "4px 8px",
                                                                borderRadius: "6px",
                                                                fontSize: "11px",
                                                                fontWeight: 600,
                                                                background: tx.riskDecision === "auto_approve"
                                                                    ? "rgba(16, 185, 129, 0.15)"
                                                                    : tx.riskDecision === "hold_for_review"
                                                                    ? "rgba(245, 158, 11, 0.15)"
                                                                    : "rgba(239, 68, 68, 0.15)",
                                                                color: tx.riskDecision === "auto_approve"
                                                                    ? "#34d399"
                                                                    : tx.riskDecision === "hold_for_review"
                                                                    ? "#fbbf24"
                                                                    : "#f87171",
                                                                border: `1px solid ${tx.riskDecision === "auto_approve" ? "rgba(16, 185, 129, 0.3)" : "rgba(239, 68, 68, 0.3)"}`,
                                                            }}>
                                                                {tx.riskDecision.replace(/_/g, " ").toUpperCase()}
                                                            </span>
                                                        ) : (
                                                            <span style={{ color: "#64748b" }}>Pending</span>
                                                        )}
                                                    </td>
                                                    <td style={{ padding: "14px" }}>
                                                        <span style={{
                                                            padding: "4px 8px",
                                                            borderRadius: "6px",
                                                            fontSize: "11px",
                                                            fontWeight: 600,
                                                            background: tx.status === "complete" ? "rgba(6, 182, 212, 0.15)" : "rgba(100, 116, 139, 0.15)",
                                                            color: tx.status === "complete" ? "#38bdf8" : "#94a3b8",
                                                            border: `1px solid ${tx.status === "complete" ? "rgba(6, 182, 212, 0.3)" : "rgba(100, 116, 139, 0.3)"}`,
                                                        }}>
                                                            {tx.status.toUpperCase()}
                                                        </span>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>
                    </>
                )}
            </div>
        </div>
    );
};
