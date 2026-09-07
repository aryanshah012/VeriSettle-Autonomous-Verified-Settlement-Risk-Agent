"use client";

import { useSession } from "next-auth/react";
import Link from "next/link";
import { useState } from "react";
import { useTokens } from "../api/hooks/useTokens";
import { TokenList } from "./TokenList";
import { Swap } from "./Swap";
import { SolanaDevnetHub } from "./SolanaDevnetHub";

interface ProfileCardProps {
    publicKey: string;
    initialInrBalance: number;
    userData: {
        name?: string | null;
        email?: string | null;
        image?: string | null;
        isJudge?: boolean;
    };
}

type TabType = "tokens" | "swap" | "solana_hub" | "settlement_shortcuts";

export const ProfileCard = ({ publicKey, initialInrBalance, userData }: ProfileCardProps) => {
    const session = useSession();
    const [selectedTab, setSelectedTab] = useState<TabType>("tokens");
    const [copied, setCopied] = useState(false);
    const { tokenBalances, loading } = useTokens(publicKey);

    const displayName = session.data?.user?.name || userData.name || "Telegraph Judge";
    const displayEmail = session.data?.user?.email || userData.email || "judge@telegraphprotocol.com";
    const isJudge = displayEmail.includes("judge") || (session.data?.user as any)?.isJudge;

    const copyAddress = () => {
        navigator.clipboard.writeText(publicKey);
        setCopied(true);
        setTimeout(() => setCopied(false), 2500);
    };

    return (
        <div style={{
            minHeight: "100vh",
            background: "radial-gradient(ellipse at 50% 0%, #0d1e3d 0%, #050b18 70%)",
            padding: "36px 20px 80px",
            color: "#e2e8f0",
        }}>
            <div style={{ maxWidth: "1000px", margin: "0 auto", display: "flex", flexDirection: "column", gap: "24px" }}>

                {/* Profile Banner */}
                <div style={{
                    background: "rgba(15,23,42,0.8)",
                    backdropFilter: "blur(16px)",
                    border: "1px solid rgba(51,65,85,0.7)",
                    borderRadius: "24px",
                    padding: "28px 32px",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    flexWrap: "wrap",
                    gap: "20px",
                    boxShadow: "0 8px 32px rgba(0,0,0,0.4)",
                }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "18px" }}>
                        <div style={{
                            width: "64px",
                            height: "64px",
                            borderRadius: "50%",
                            background: "linear-gradient(135deg, var(--accent-cyan), #3b82f6)",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            fontSize: "26px",
                            fontWeight: 800,
                            color: "#050b18",
                            boxShadow: "0 0 20px rgba(6,182,212,0.35)",
                        }}>
                            {displayName.charAt(0).toUpperCase()}
                        </div>
                        <div>
                            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                                <h1 style={{ fontSize: "1.4rem", fontWeight: 800, color: "#fff", margin: 0 }}>
                                    {displayName}
                                </h1>
                                {isJudge && (
                                    <span style={{
                                        fontSize: "11px",
                                        fontWeight: 700,
                                        padding: "3px 10px",
                                        borderRadius: "999px",
                                        background: "rgba(6,182,212,0.15)",
                                        border: "1px solid rgba(6,182,212,0.4)",
                                        color: "#38bdf8",
                                    }}>
                                        👨‍⚖️ HACKATHON EVALUATOR
                                    </span>
                                )}
                            </div>
                            <div style={{ color: "#94a3b8", fontSize: "13px", marginTop: "2px" }}>
                                {displayEmail}
                            </div>
                        </div>
                    </div>

                    {/* Quick Stats Pill */}
                    <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
                        <div style={{
                            padding: "12px 18px",
                            background: "rgba(30,41,59,0.6)",
                            border: "1px solid rgba(51,65,85,0.5)",
                            borderRadius: "14px",
                            textAlign: "right",
                        }}>
                            <div style={{ fontSize: "11px", color: "#94a3b8", fontWeight: 600, textTransform: "uppercase" }}>INR Fiat Wallet</div>
                            <div style={{ fontSize: "1.25rem", fontWeight: 800, color: "#34d399" }}>
                                ₹{initialInrBalance.toLocaleString("en-IN")}
                            </div>
                        </div>
                        <div style={{
                            padding: "12px 18px",
                            background: "rgba(30,41,59,0.6)",
                            border: "1px solid rgba(51,65,85,0.5)",
                            borderRadius: "14px",
                            textAlign: "right",
                        }}>
                            <div style={{ fontSize: "11px", color: "#94a3b8", fontWeight: 600, textTransform: "uppercase" }}>Solana Assets</div>
                            <div style={{ fontSize: "1.25rem", fontWeight: 800, color: "#38bdf8" }}>
                                ${tokenBalances?.totalBalance || "135.00"} USD
                            </div>
                        </div>
                    </div>
                </div>

                {/* Solana Public Key & Quick Action Strip */}
                <div style={{
                    background: "rgba(15,23,42,0.7)",
                    border: "1px solid rgba(51,65,85,0.5)",
                    borderRadius: "16px",
                    padding: "16px 20px",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    flexWrap: "wrap",
                    gap: "12px",
                }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "10px", minWidth: "260px" }}>
                        <span style={{ fontSize: "16px", color: "#c084fc" }}>◎</span>
                        <div style={{ fontSize: "12px", color: "#94a3b8", fontWeight: 600 }}>SOLANA DEVNET ADDRESS:</div>
                        <span style={{ fontFamily: "monospace", fontSize: "12px", color: "#f1f5f9" }}>
                            {publicKey.slice(0, 8)}…{publicKey.slice(-6)}
                        </span>
                    </div>

                    <div style={{ display: "flex", gap: "8px" }}>
                        <button
                            onClick={copyAddress}
                            style={{
                                padding: "6px 14px",
                                borderRadius: "8px",
                                background: copied ? "rgba(16,185,129,0.2)" : "rgba(30,41,59,0.8)",
                                border: `1px solid ${copied ? "rgba(16,185,129,0.4)" : "rgba(71,85,105,0.5)"}`,
                                color: copied ? "#34d399" : "#38bdf8",
                                fontSize: "12px",
                                fontWeight: 600,
                                cursor: "pointer",
                            }}
                        >
                            {copied ? "✓ Address Copied" : "Copy Address"}
                        </button>
                        <a
                            href={`https://explorer.solana.com/address/${publicKey}?cluster=devnet`}
                            target="_blank"
                            rel="noreferrer"
                            style={{
                                padding: "6px 14px",
                                borderRadius: "8px",
                                background: "rgba(153,69,255,0.15)",
                                border: "1px solid rgba(153,69,255,0.4)",
                                color: "#c084fc",
                                fontSize: "12px",
                                fontWeight: 600,
                                textDecoration: "none",
                            }}
                        >
                            Explorer ↗
                        </a>
                        <Link
                            href="/settlement"
                            style={{
                                padding: "6px 16px",
                                borderRadius: "8px",
                                background: "linear-gradient(135deg, #06b6d4, #3b82f6)",
                                border: "none",
                                color: "#050b18",
                                fontSize: "12px",
                                fontWeight: 700,
                                textDecoration: "none",
                            }}
                        >
                            ⚡ Off-Ramp to INR
                        </Link>
                    </div>
                </div>

                {/* Tabs & Content */}
                <div style={{
                    background: "rgba(15,23,42,0.85)",
                    backdropFilter: "blur(16px)",
                    border: "1px solid rgba(51,65,85,0.6)",
                    borderRadius: "20px",
                    overflow: "hidden",
                }}>
                    {/* Navigation Tabs */}
                    <div style={{
                        display: "flex",
                        borderBottom: "1px solid rgba(51,65,85,0.5)",
                        padding: "0 20px",
                        gap: "8px",
                    }}>
                        {[
                            { id: "tokens", label: "🪙 Token Assets" },
                            { id: "swap", label: "🔄 Instant Swap" },
                            { id: "solana_hub", label: "◎ Solana Devnet Hub" },
                            { id: "settlement_shortcuts", label: "⚡ Telegraph Pipeline" },
                        ].map(tab => (
                            <button
                                key={tab.id}
                                type="button"
                                onClick={() => setSelectedTab(tab.id as TabType)}
                                style={{
                                    padding: "16px 20px",
                                    background: "transparent",
                                    border: "none",
                                    borderBottom: selectedTab === tab.id ? "2px solid #06b6d4" : "2px solid transparent",
                                    color: selectedTab === tab.id ? "#38bdf8" : "#94a3b8",
                                    fontWeight: selectedTab === tab.id ? 700 : 500,
                                    fontSize: "13px",
                                    cursor: "pointer",
                                    transition: "all 0.15s",
                                }}
                            >
                                {tab.label}
                            </button>
                        ))}
                    </div>

                    {/* Tab Panes */}
                    <div style={{ padding: "24px" }}>
                        {selectedTab === "tokens" && (
                            <div>
                                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "18px" }}>
                                    <h2 style={{ fontSize: "1.1rem", fontWeight: 700, color: "#fff", margin: 0 }}>
                                        Supported Tokens for Verified Off-Ramping
                                    </h2>
                                    <span style={{ fontSize: "12px", color: "#94a3b8" }}>
                                        Live Jupiter + Telegraph Subnet 101 Oracle
                                    </span>
                                </div>
                                <TokenList tokens={tokenBalances?.tokens || []} />
                            </div>
                        )}

                        {selectedTab === "swap" && (
                            <div>
                                <Swap tokenBalances={tokenBalances} publicKey={publicKey} />
                            </div>
                        )}

                        {selectedTab === "solana_hub" && (
                            <div>
                                <SolanaDevnetHub initialPublicKey={publicKey} />
                            </div>
                        )}

                        {selectedTab === "settlement_shortcuts" && (
                            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: "16px" }}>
                                <div style={{
                                    padding: "20px",
                                    background: "rgba(30,41,59,0.5)",
                                    border: "1px solid rgba(51,65,85,0.5)",
                                    borderRadius: "14px",
                                }}>
                                    <div style={{ fontSize: "1.5rem", marginBottom: "8px" }}>⚡</div>
                                    <h3 style={{ fontSize: "1rem", fontWeight: 700, color: "#fff", margin: "0 0 6px" }}>
                                        Verified INR Off-Ramp
                                    </h3>
                                    <p style={{ color: "#94a3b8", fontSize: "12px", lineHeight: 1.5, marginBottom: "14px" }}>
                                        Execute rate-locked settlements with 5-signal AI risk scoring and Merkle proof bundle.
                                    </p>
                                    <Link href="/settlement" className="btn-primary" style={{ display: "inline-block", fontSize: "12px", padding: "8px 16px", textDecoration: "none" }}>
                                        Launch Settlement Flow →
                                    </Link>
                                </div>

                                <div style={{
                                    padding: "20px",
                                    background: "rgba(30,41,59,0.5)",
                                    border: "1px solid rgba(51,65,85,0.5)",
                                    borderRadius: "14px",
                                }}>
                                    <div style={{ fontSize: "1.5rem", marginBottom: "8px" }}>🔐</div>
                                    <h3 style={{ fontSize: "1rem", fontWeight: 700, color: "#fff", margin: "0 0 6px" }}>
                                        Cryptographic Proof Verifier
                                    </h3>
                                    <p style={{ color: "#94a3b8", fontSize: "12px", lineHeight: 1.5, marginBottom: "14px" }}>
                                        Reconstruct Merkle proof trees and verify on-chain SPL Memo seals directly in browser.
                                    </p>
                                    <Link href="/verify" className="btn-secondary" style={{ display: "inline-block", fontSize: "12px", padding: "8px 16px", textDecoration: "none" }}>
                                        Audit Settlements →
                                    </Link>
                                </div>

                                <div style={{
                                    padding: "20px",
                                    background: "rgba(30,41,59,0.5)",
                                    border: "1px solid rgba(51,65,85,0.5)",
                                    borderRadius: "14px",
                                }}>
                                    <div style={{ fontSize: "1.5rem", marginBottom: "8px" }}>📊</div>
                                    <h3 style={{ fontSize: "1rem", fontWeight: 700, color: "#fff", margin: "0 0 6px" }}>
                                        Subnet Telemetry & Analytics
                                    </h3>
                                    <p style={{ color: "#94a3b8", fontSize: "12px", lineHeight: 1.5, marginBottom: "14px" }}>
                                        Live Telegraph miner latency, consensus agreement ratios, and circuit breaker status.
                                    </p>
                                    <Link href="/analytics" className="btn-secondary" style={{ display: "inline-block", fontSize: "12px", padding: "8px 16px", textDecoration: "none" }}>
                                        View Telemetry →
                                    </Link>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

            </div>
        </div>
    );
};