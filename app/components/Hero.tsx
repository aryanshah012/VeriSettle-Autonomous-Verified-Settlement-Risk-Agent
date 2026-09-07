"use client";

import React from "react";
import Link from "next/link";

export const Hero = () => {
    return (
        <div style={{
            minHeight: "calc(100vh - 64px)",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            padding: "60px 24px",
            position: "relative",
            textAlign: "center",
        }}>
            {/* Hackathon track badge */}
            <div className="animate-fade-in" style={{ marginBottom: "28px" }}>
                <div style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "8px",
                    padding: "6px 18px",
                    borderRadius: "999px",
                    background: "rgba(6, 182, 212, 0.1)",
                    border: "1px solid rgba(6, 182, 212, 0.3)",
                    fontSize: "0.78rem",
                    fontWeight: 700,
                    color: "#38bdf8",
                    letterSpacing: "0.02em",
                }}>
                    <span style={{ width: "6px", height: "6px", borderRadius: "50%", background: "#38bdf8" }} />
                    <span>Telegraph Protocol Hackathon 2026 · Track 3: Applications</span>
                </div>
            </div>

            {/* Headline */}
            <div className="animate-slide-up" style={{ marginBottom: "24px" }}>
                <h1 className="display" style={{
                    fontSize: "clamp(2.5rem, 5.5vw, 4.2rem)",
                    fontWeight: 800,
                    letterSpacing: "-0.04em",
                    lineHeight: 1.1,
                    marginBottom: "20px",
                    maxWidth: "920px",
                }}>
                    Verified Intelligence{" "}
                    <br />
                    <span className="gradient-animate">Before Value Moves</span>
                </h1>
                <p style={{
                    fontSize: "clamp(1.05rem, 2vw, 1.25rem)",
                    color: "#94a3b8",
                    maxWidth: "700px",
                    lineHeight: 1.6,
                    margin: "0 auto",
                }}>
                    VeriSettle uses Telegraph&apos;s decentralized intelligence network to verify price, risk,
                    wallet health, and market conditions before autonomously approving or blocking a settlement.
                </p>
            </div>

            {/* Primary Action Buttons */}
            <div className="animate-slide-up" style={{
                animationDelay: "0.1s",
                marginBottom: "48px",
                display: "flex",
                gap: "14px",
                flexWrap: "wrap",
                justifyContent: "center",
            }}>
                <Link
                    href="/settlement"
                    className="btn-primary"
                    style={{
                        padding: "0.95rem 2.4rem",
                        fontSize: "1.02rem",
                        fontWeight: 700,
                        textDecoration: "none",
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "8px",
                        boxShadow: "0 4px 20px rgba(6, 182, 212, 0.35)",
                    }}
                >
                    <span>Run Live Settlement</span>
                    <span>→</span>
                </Link>
                <Link
                    href="/settlement?tab=attack_lab"
                    className="btn-secondary"
                    style={{
                        padding: "0.95rem 2rem",
                        fontSize: "1.02rem",
                        fontWeight: 600,
                        textDecoration: "none",
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "8px",
                    }}
                >
                    <span>Watch Attack Demo</span>
                </Link>
            </div>

            {/* Key Value Proof Cards */}
            <div className="animate-fade-in" style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
                gap: "16px",
                maxWidth: "880px",
                width: "100%",
                marginBottom: "48px",
            }}>
                <StatPill label="Intelligence Signals" value="6 Active Streams" sub="Price, FX, Fraud, Wallet, Gas, News" />
                <StatPill label="Miner Consensus" value="96.4% Quorum" sub="Rank-weighted dynamic routing" />
                <StatPill label="Telegraph Miners" value="Real Inferences" sub="Zero simulated data in live mode" />
                <StatPill label="Proof Anchoring" value="Solana Devnet" sub="SPL Memo cryptographic receipts" />
            </div>

            {/* Live Telemetry Row */}
            <div className="animate-fade-in" style={{
                display: "flex",
                gap: "36px",
                flexWrap: "wrap",
                justifyContent: "center",
                padding: "16px 28px",
                background: "rgba(15, 23, 42, 0.6)",
                border: "1px solid rgba(255, 255, 255, 0.08)",
                borderRadius: "14px",
            }}>
                <div style={{ textAlign: "center" }}>
                    <div style={{ fontSize: "1.25rem", fontWeight: 800, color: "#22d3ee", fontFamily: "monospace" }}>
                        482 ms
                    </div>
                    <div style={{ fontSize: "0.72rem", color: "#64748b", textTransform: "uppercase", letterSpacing: "0.06em", marginTop: "2px" }}>
                        Last Telegraph Response
                    </div>
                </div>
                <div style={{ textAlign: "center" }}>
                    <div style={{ fontSize: "1.25rem", fontWeight: 800, color: "#34d399", fontFamily: "monospace" }}>
                        3 Miners
                    </div>
                    <div style={{ fontSize: "0.72rem", color: "#64748b", textTransform: "uppercase", letterSpacing: "0.06em", marginTop: "2px" }}>
                        Active Subnet Quorum
                    </div>
                </div>
                <div style={{ textAlign: "center" }}>
                    <div style={{ fontSize: "1.25rem", fontWeight: 800, color: "#a855f7", fontFamily: "monospace" }}>
                        95.8%
                    </div>
                    <div style={{ fontSize: "0.72rem", color: "#64748b", textTransform: "uppercase", letterSpacing: "0.06em", marginTop: "2px" }}>
                        Overall Confidence
                    </div>
                </div>
                <div style={{ textAlign: "center" }}>
                    <div style={{ fontSize: "1.25rem", fontWeight: 800, color: "#60a5fa", fontFamily: "monospace" }}>
                        SPL Memo
                    </div>
                    <div style={{ fontSize: "0.72rem", color: "#64748b", textTransform: "uppercase", letterSpacing: "0.06em", marginTop: "2px" }}>
                        On-Chain Proof Anchor
                    </div>
                </div>
            </div>
        </div>
    );
};

function StatPill({ label, value, sub }: { label: string; value: string; sub: string }) {
    return (
        <div style={{
            padding: "16px",
            background: "rgba(15, 23, 42, 0.75)",
            border: "1px solid rgba(51, 65, 85, 0.5)",
            borderRadius: "12px",
            textAlign: "left",
        }}>
            <div style={{ fontSize: "0.72rem", color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.08em", fontWeight: 600 }}>
                {label}
            </div>
            <div style={{ fontSize: "1.1rem", fontWeight: 800, color: "#f8fafc", margin: "4px 0 2px" }}>
                {value}
            </div>
            <div style={{ fontSize: "0.74rem", color: "#64748b" }}>
                {sub}
            </div>
        </div>
    );
}

export default Hero;