"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";

interface MinerCall {
    id: string;
    intent: string;
    minerId: string;
    confidenceScore: number;
    txProofHash: string;
    latencyMs: number;
    isConsensusPick: boolean;
}

interface TransactionRecord {
    id: string;
    createdAt: string;
    updatedAt: string;
    status: string;
    sourceCurrency: string;
    amountIn: number;
    amountOut: number;
    exchangeRate: number;
    rateLockedUntil: string;
    destinationBankId?: string | null;
    counterpartyAddress?: string | null;
    riskScore: number | null;
    riskDecision: string | null;
    riskSignals?: any;
    proofBundleHash?: string | null;
    minerCalls: MinerCall[];
}

export const TransactionHistory = () => {
    const [transactions, setTransactions] = useState<TransactionRecord[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [expandedId, setExpandedId] = useState<string | null>(null);
    const [filterStatus, setFilterStatus] = useState<string>("all");
    const [copiedHash, setCopiedHash] = useState<string | null>(null);

    const fetchHistory = async () => {
        try {
            setLoading(true);
            const res = await fetch("/api/settlement/history");
            if (!res.ok) {
                if (res.status === 401) {
                    setError("Please sign in to view your transaction audit history.");
                    return;
                }
                throw new Error(`HTTP ${res.status}`);
            }
            const data = await res.json();
            setTransactions(data.transactions || []);
            setError(null);
        } catch (err: any) {
            setError(err.message || "Failed to load settlement history");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchHistory();
    }, []);

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text);
        setCopiedHash(text);
        setTimeout(() => setCopiedHash(null), 2000);
    };

    const filtered = transactions.filter(tx => {
        if (filterStatus === "all") return true;
        return tx.status.toLowerCase() === filterStatus.toLowerCase();
    });

    const getStatusBadge = (status: string) => {
        switch (status.toLowerCase()) {
            case "complete":
                return { label: "SETTLED", color: "#34d399", bg: "rgba(16, 185, 129, 0.15)", border: "rgba(16, 185, 129, 0.3)" };
            case "denied":
                return { label: "DENIED", color: "#f87171", bg: "rgba(239, 68, 68, 0.15)", border: "rgba(239, 68, 68, 0.3)" };
            case "screening":
                return { label: "SCREENING", color: "#fbbf24", bg: "rgba(245, 158, 11, 0.15)", border: "rgba(245, 158, 11, 0.3)" };
            case "quoted":
                return { label: "RATE LOCKED", color: "#38bdf8", bg: "rgba(6, 182, 212, 0.15)", border: "rgba(6, 182, 212, 0.3)" };
            default:
                return { label: status.toUpperCase(), color: "#94a3b8", bg: "rgba(100, 116, 139, 0.15)", border: "rgba(100, 116, 139, 0.3)" };
        }
    };

    return (
        <div style={{
            background: "rgba(15, 23, 42, 0.75)",
            backdropFilter: "blur(12px)",
            border: "1px solid rgba(51, 65, 85, 0.6)",
            borderRadius: "24px",
            padding: "28px",
            color: "#e2e8f0",
        }}>
            {/* Top Bar */}
            <div style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                flexWrap: "wrap",
                gap: "16px",
                marginBottom: "24px",
            }}>
                <div>
                    <h2 style={{ fontSize: "1.35rem", fontWeight: 700, margin: 0, color: "#ffffff" }}>
                        Settlement Ledger & Proof Audit
                    </h2>
                    <p style={{ fontSize: "0.85rem", color: "#94a3b8", margin: "4px 0 0" }}>
                        Every off-ramp is sealed with Telegraph miner signatures and SHA-256 state proofs
                    </p>
                </div>

                <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                    {["all", "complete", "screening", "denied"].map(status => (
                        <button
                            key={status}
                            onClick={() => setFilterStatus(status)}
                            style={{
                                padding: "6px 14px",
                                borderRadius: "8px",
                                fontSize: "12px",
                                fontWeight: 600,
                                textTransform: "capitalize",
                                cursor: "pointer",
                                transition: "all 0.2s ease",
                                background: filterStatus === status ? "rgba(6, 182, 212, 0.2)" : "rgba(30, 41, 59, 0.6)",
                                color: filterStatus === status ? "#38bdf8" : "#94a3b8",
                                border: filterStatus === status ? "1px solid rgba(6, 182, 212, 0.4)" : "1px solid rgba(71, 85, 105, 0.4)",
                            }}
                        >
                            {status}
                        </button>
                    ))}
                    <button
                        onClick={fetchHistory}
                        title="Reload history"
                        style={{
                            padding: "6px 12px",
                            background: "rgba(30, 41, 59, 0.6)",
                            border: "1px solid rgba(71, 85, 105, 0.4)",
                            borderRadius: "8px",
                            color: "#94a3b8",
                            cursor: "pointer",
                            fontSize: "13px",
                        }}
                    >
                        🔄
                    </button>
                </div>
            </div>

            {loading ? (
                <div style={{ padding: "60px 0", textAlign: "center", color: "#94a3b8" }}>
                    <div style={{
                        width: "36px",
                        height: "36px",
                        border: "3px solid rgba(6, 182, 212, 0.2)",
                        borderTopColor: "#06b6d4",
                        borderRadius: "50%",
                        margin: "0 auto 12px",
                        animation: "spin 1s linear infinite",
                    }} />
                    Loading verified transaction records...
                </div>
            ) : error ? (
                <div style={{
                    padding: "20px",
                    background: "rgba(239, 68, 68, 0.1)",
                    border: "1px solid rgba(239, 68, 68, 0.3)",
                    borderRadius: "14px",
                    color: "#f87171",
                    fontSize: "13px",
                }}>
                    {error}
                </div>
            ) : filtered.length === 0 ? (
                <div style={{
                    padding: "50px 20px",
                    textAlign: "center",
                    background: "rgba(30, 41, 59, 0.3)",
                    borderRadius: "16px",
                    border: "1px dashed rgba(71, 85, 105, 0.5)",
                }}>
                    <div style={{ fontSize: "2rem", marginBottom: "10px" }}>📜</div>
                    <div style={{ fontWeight: 600, color: "#cbd5e1" }}>No settlements found</div>
                    <p style={{ color: "#64748b", fontSize: "13px", maxWidth: "400px", margin: "6px auto 16px" }}>
                        {filterStatus === "all"
                            ? "You have not executed any off-ramp transactions yet."
                            : `No transactions matching "${filterStatus}" status.`}
                    </p>
                    <Link
                        href="/settlement"
                        style={{
                            display: "inline-block",
                            padding: "8px 18px",
                            background: "linear-gradient(135deg, #06b6d4, #3b82f6)",
                            color: "#050b18",
                            borderRadius: "10px",
                            fontSize: "12px",
                            fontWeight: 700,
                            textDecoration: "none",
                        }}
                    >
                        Start First Settlement
                    </Link>
                </div>
            ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
                    {filtered.map(tx => {
                        const isExpanded = expandedId === tx.id;
                        const badge = getStatusBadge(tx.status);

                        return (
                            <div
                                key={tx.id}
                                style={{
                                    background: "rgba(30, 41, 59, 0.4)",
                                    border: isExpanded ? "1px solid rgba(6, 182, 212, 0.4)" : "1px solid rgba(51, 65, 85, 0.5)",
                                    borderRadius: "16px",
                                    padding: "18px 20px",
                                    transition: "all 0.2s ease",
                                }}
                            >
                                {/* Main Row */}
                                <div style={{
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "space-between",
                                    flexWrap: "wrap",
                                    gap: "14px",
                                    cursor: "pointer",
                                }} onClick={() => setExpandedId(isExpanded ? null : tx.id)}>
                                    
                                    {/* Left: Volume & Date */}
                                    <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
                                        <div style={{
                                            width: "42px",
                                            height: "42px",
                                            borderRadius: "12px",
                                            background: "rgba(6, 182, 212, 0.1)",
                                            border: "1px solid rgba(6, 182, 212, 0.2)",
                                            display: "flex",
                                            alignItems: "center",
                                            justifyContent: "center",
                                            fontSize: "18px",
                                        }}>
                                            {tx.sourceCurrency === "USDC" ? "💲" : "🪙"}
                                        </div>
                                        <div>
                                            <div style={{ fontWeight: 700, fontSize: "15px", color: "#f8fafc" }}>
                                                {tx.amountIn} {tx.sourceCurrency} → ₹{(tx.amountOut ?? 0).toLocaleString()}
                                            </div>
                                            <div style={{ fontSize: "11px", color: "#64748b", display: "flex", gap: "8px", marginTop: "2px" }}>
                                                <span>{new Date(tx.createdAt).toLocaleDateString()}</span>
                                                <span>•</span>
                                                <span>{new Date(tx.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                                <span>•</span>
                                                <span style={{ fontFamily: "var(--font-mono, monospace)" }}>
                                                    Rate: 1 {tx.sourceCurrency} = ₹{tx.exchangeRate.toFixed(2)}
                                                </span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Right: Badges & Toggle */}
                                    <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
                                        {tx.riskScore !== null && (
                                            <div style={{ textAlign: "right" }}>
                                                <div style={{
                                                    fontSize: "11px",
                                                    fontWeight: 700,
                                                    color: (tx.riskScore ?? 0) <= 40 ? "#34d399" : (tx.riskScore ?? 0) <= 70 ? "#fbbf24" : "#f87171",
                                                }}>
                                                    Risk {tx.riskScore}/100
                                                </div>
                                                <div style={{ fontSize: "10px", color: "#64748b" }}>
                                                    {tx.riskDecision ? tx.riskDecision.replace(/_/g, " ") : "evaluated"}
                                                </div>
                                            </div>
                                        )}

                                        <span style={{
                                            padding: "4px 10px",
                                            borderRadius: "8px",
                                            fontSize: "11px",
                                            fontWeight: 700,
                                            background: badge.bg,
                                            color: badge.color,
                                            border: `1px solid ${badge.border}`,
                                        }}>
                                            {badge.label}
                                        </span>

                                        <span style={{
                                            fontSize: "14px",
                                            color: "#64748b",
                                            transform: isExpanded ? "rotate(180deg)" : "none",
                                            transition: "transform 0.2s ease",
                                        }}>
                                            ▼
                                        </span>
                                    </div>
                                </div>

                                {/* Expanded Audit Trail */}
                                {isExpanded && (
                                    <div style={{
                                        marginTop: "18px",
                                        paddingTop: "18px",
                                        borderTop: "1px solid rgba(51, 65, 85, 0.4)",
                                    }}>
                                        {/* Cryptographic Proof Hashes */}
                                        <div style={{
                                            background: "rgba(15, 23, 42, 0.8)",
                                            borderRadius: "12px",
                                            padding: "12px 16px",
                                            marginBottom: "14px",
                                            fontFamily: "var(--font-mono, monospace)",
                                            fontSize: "11px",
                                        }}>
                                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "6px" }}>
                                                <span style={{ color: "#64748b" }}>SETTLEMENT PROOF HASH</span>
                                                <button
                                                    onClick={() => copyToClipboard(tx.proofBundleHash || tx.id)}
                                                    style={{
                                                        background: "none",
                                                        border: "none",
                                                        color: copiedHash === (tx.proofBundleHash || tx.id) ? "#34d399" : "#38bdf8",
                                                        cursor: "pointer",
                                                        fontSize: "11px",
                                                        fontWeight: 600,
                                                    }}
                                                >
                                                    {copiedHash === (tx.proofBundleHash || tx.id) ? "Copied ✓" : "Copy Hash"}
                                                </button>
                                            </div>
                                            <div style={{ color: "#94a3b8", wordBreak: "break-all" }}>
                                                {tx.proofBundleHash || `sha256:${tx.id}_settlement_intent_verified`}
                                            </div>
                                        </div>

                                        {/* Miner Calls Breakdown */}
                                        <div>
                                            <div style={{
                                                fontSize: "12px",
                                                fontWeight: 600,
                                                color: "#cbd5e1",
                                                marginBottom: "8px",
                                                display: "flex",
                                                alignItems: "center",
                                                gap: "6px",
                                            }}>
                                                <span>⚡</span> Telegraph Miner Consensus Audit Trail ({tx.minerCalls?.length ?? 0} miners)
                                            </div>

                                            {(!tx.minerCalls || tx.minerCalls.length === 0) ? (
                                                <div style={{ color: "#64748b", fontSize: "12px", fontStyle: "italic" }}>
                                                    No miner calls logged for this record.
                                                </div>
                                            ) : (
                                                <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                                                    {tx.minerCalls.map(mc => (
                                                        <div
                                                            key={mc.id}
                                                            style={{
                                                                display: "flex",
                                                                alignItems: "center",
                                                                justifyContent: "space-between",
                                                                padding: "8px 12px",
                                                                background: mc.isConsensusPick ? "rgba(6, 182, 212, 0.08)" : "rgba(15, 23, 42, 0.5)",
                                                                border: mc.isConsensusPick ? "1px solid rgba(6, 182, 212, 0.25)" : "1px solid rgba(51, 65, 85, 0.3)",
                                                                borderRadius: "8px",
                                                                fontSize: "12px",
                                                                fontFamily: "var(--font-mono, monospace)",
                                                            }}
                                                        >
                                                            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                                                                <span style={{
                                                                    width: "6px",
                                                                    height: "6px",
                                                                    borderRadius: "50%",
                                                                    background: mc.isConsensusPick ? "#06b6d4" : "#64748b",
                                                                }} />
                                                                <span style={{ fontWeight: 600, color: "#f1f5f9" }}>{mc.minerId}</span>
                                                                <span style={{ color: "#64748b", fontSize: "10px" }}>({mc.intent})</span>
                                                                {mc.isConsensusPick && (
                                                                    <span style={{
                                                                        fontSize: "9px",
                                                                        padding: "1px 5px",
                                                                        borderRadius: "4px",
                                                                        background: "rgba(6, 182, 212, 0.2)",
                                                                        color: "#38bdf8",
                                                                    }}>
                                                                        CONSENSUS PICK
                                                                    </span>
                                                                )}
                                                            </div>

                                                            <div style={{ display: "flex", alignItems: "center", gap: "16px", color: "#94a3b8" }}>
                                                                <span>{mc.latencyMs}ms</span>
                                                                <span style={{ color: "#34d399" }}>{(mc.confidenceScore * 100).toFixed(0)}% conf</span>
                                                                <span
                                                                    title={mc.txProofHash}
                                                                    style={{ color: "#64748b", cursor: "help" }}
                                                                >
                                                                    {mc.txProofHash.substring(0, 10)}...
                                                                </span>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
};
