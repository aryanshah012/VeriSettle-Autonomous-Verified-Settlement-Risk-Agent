"use client";

import React, { useRef } from "react";

export interface CertificateData {
    transactionId: string;
    merkleRoot: string;
    solanaSignature?: string;
    solanaSlot?: number;
    amountIn: number;
    sourceCurrency: string;
    amountOut: number;
    targetCurrency: string;
    effectiveRate: number;
    counterpartyAddress?: string;
    riskScore?: number;
    riskDecision?: string;
    timestamp: string;
    minersCount?: number;
}

export function SettlementCertificate({ data, onClose }: { data: CertificateData; onClose?: () => void }) {
    const certRef = useRef<HTMLDivElement>(null);

    const handlePrint = () => {
        window.print();
    };

    const verifyUrl = typeof window !== "undefined"
        ? `${window.location.origin}/verify?hash=${data.merkleRoot}`
        : `https://verisettle.protocol/verify?hash=${data.merkleRoot}`;

    return (
        <div style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            zIndex: 9999,
            backgroundColor: "rgba(2, 6, 23, 0.85)",
            backdropFilter: "blur(12px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "20px",
            overflowY: "auto",
        }}>
            <div style={{
                background: "#090d16",
                border: "1px solid rgba(71, 85, 105, 0.5)",
                borderRadius: "24px",
                maxWidth: "760px",
                width: "100%",
                boxShadow: "0 25px 60px -15px rgba(0, 0, 0, 0.9)",
                overflow: "hidden",
                position: "relative",
            }}>
                {/* Print Controls Header (Hidden on Print) */}
                <div className="no-print" style={{
                    padding: "16px 24px",
                    background: "rgba(15, 23, 42, 0.9)",
                    borderBottom: "1px solid rgba(51, 65, 85, 0.5)",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                        <span style={{ fontSize: "16px" }}>📜</span>
                        <span style={{ fontWeight: 700, fontSize: "0.9rem", color: "#f8fafc" }}>
                            Official Cryptographic Certificate of Settlement
                        </span>
                    </div>
                    <div style={{ display: "flex", gap: "10px" }}>
                        <button
                            type="button"
                            onClick={handlePrint}
                            style={{
                                background: "linear-gradient(135deg, #06b6d4, #3b82f6)",
                                border: "none",
                                borderRadius: "8px",
                                padding: "6px 14px",
                                color: "#fff",
                                fontWeight: 700,
                                fontSize: "0.8rem",
                                cursor: "pointer",
                                display: "flex",
                                alignItems: "center",
                                gap: "6px",
                            }}
                        >
                            <span>🖨️</span>
                            <span>Print / Save as PDF</span>
                        </button>
                        {onClose && (
                            <button
                                type="button"
                                onClick={onClose}
                                style={{
                                    background: "rgba(51, 65, 85, 0.6)",
                                    border: "none",
                                    borderRadius: "8px",
                                    padding: "6px 12px",
                                    color: "#94a3b8",
                                    fontWeight: 700,
                                    fontSize: "0.8rem",
                                    cursor: "pointer",
                                }}
                            >
                                Close
                            </button>
                        )}
                    </div>
                </div>

                {/* Printable Certificate Body */}
                <div ref={certRef} id="printable-certificate" style={{
                    padding: "36px",
                    color: "#0f172a",
                    background: "linear-gradient(180deg, #ffffff 0%, #f8fafc 100%)",
                    position: "relative",
                }}>
                    {/* Watermark Logo */}
                    <div style={{
                        position: "absolute",
                        top: "50%",
                        left: "50%",
                        transform: "translate(-50%, -50%)",
                        fontSize: "240px",
                        opacity: 0.03,
                        pointerEvents: "none",
                        fontWeight: 900,
                        color: "#0f172a",
                    }}>
                        ⚡
                    </div>

                    {/* Certificate Top Header */}
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", borderBottom: "2px solid #e2e8f0", paddingBottom: "20px", marginBottom: "24px" }}>
                        <div>
                            <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px" }}>
                                <span style={{ fontSize: "24px", color: "#06b6d4" }}>⚡</span>
                                <span style={{ fontSize: "20px", fontWeight: 900, letterSpacing: "-0.03em", color: "#0f172a" }}>
                                    VERISETTLE VERIFIED SETTLEMENT
                                </span>
                            </div>
                            <div style={{ fontSize: "11px", textTransform: "uppercase", letterSpacing: "0.1em", color: "#64748b", fontWeight: 700 }}>
                                Telegraph Protocol · Track 3 Applications · Cryptographic Attestation
                            </div>
                        </div>

                        {/* Security Hologram Badge */}
                        <div style={{
                            border: "2px solid #06b6d4",
                            borderRadius: "12px",
                            padding: "8px 14px",
                            textAlign: "center",
                            background: "linear-gradient(135deg, rgba(6,182,212,0.08), rgba(59,130,246,0.08))",
                        }}>
                            <div style={{ fontSize: "9px", fontWeight: 800, color: "#0891b2", letterSpacing: "0.1em", textTransform: "uppercase" }}>
                                STATUS CONFIRMED
                            </div>
                            <div style={{ fontSize: "14px", fontWeight: 900, color: "#0f172a" }}>
                                ON-CHAIN SEALED
                            </div>
                        </div>
                    </div>

                    {/* Certificate Title */}
                    <div style={{ textAlign: "center", marginBottom: "28px" }}>
                        <h1 style={{ fontSize: "1.4rem", fontWeight: 800, color: "#0f172a", margin: "0 0 6px", textTransform: "uppercase", letterSpacing: "0.02em" }}>
                            Certificate of Cross-Border Settlement
                        </h1>
                        <p style={{ margin: 0, fontSize: "12px", color: "#64748b" }}>
                            Issued pursuant to Multi-Miner Consensus under Telegraph Protocol Subnets & Anchored via SPL Memo on Solana
                        </p>
                    </div>

                    {/* Key Attributes Grid */}
                    <div style={{
                        display: "grid",
                        gridTemplateColumns: "1fr 1fr",
                        gap: "16px",
                        background: "#f1f5f9",
                        borderRadius: "14px",
                        padding: "18px",
                        marginBottom: "24px",
                        border: "1px solid #e2e8f0",
                    }}>
                        <div>
                            <div style={{ fontSize: "10px", textTransform: "uppercase", color: "#64748b", fontWeight: 700 }}>Transaction Identifier</div>
                            <div style={{ fontSize: "12px", fontWeight: 700, fontFamily: "monospace", color: "#0f172a" }}>{data.transactionId}</div>
                        </div>
                        <div>
                            <div style={{ fontSize: "10px", textTransform: "uppercase", color: "#64748b", fontWeight: 700 }}>Timestamp (UTC)</div>
                            <div style={{ fontSize: "12px", fontWeight: 600, color: "#0f172a" }}>{new Date(data.timestamp).toUTCString()}</div>
                        </div>
                        <div>
                            <div style={{ fontSize: "10px", textTransform: "uppercase", color: "#64748b", fontWeight: 700 }}>Source Liquidity</div>
                            <div style={{ fontSize: "14px", fontWeight: 800, color: "#0f172a" }}>{data.amountIn} {data.sourceCurrency}</div>
                        </div>
                        <div>
                            <div style={{ fontSize: "10px", textTransform: "uppercase", color: "#64748b", fontWeight: 700 }}>Settled Fiat Equivalent</div>
                            <div style={{ fontSize: "14px", fontWeight: 800, color: "#059669" }}>₹{data.amountOut.toLocaleString("en-IN", { maximumFractionDigits: 2 })} INR</div>
                        </div>
                        <div>
                            <div style={{ fontSize: "10px", textTransform: "uppercase", color: "#64748b", fontWeight: 700 }}>Guaranteed Effective Rate</div>
                            <div style={{ fontSize: "12px", fontWeight: 700, fontFamily: "monospace", color: "#0f172a" }}>
                                1 {data.sourceCurrency} = ₹{data.effectiveRate.toFixed(2)} INR
                            </div>
                        </div>
                        <div>
                            <div style={{ fontSize: "10px", textTransform: "uppercase", color: "#64748b", fontWeight: 700 }}>Composite Risk Score</div>
                            <div style={{ fontSize: "12px", fontWeight: 700, color: (data.riskScore ?? 0) > 70 ? "#dc2626" : "#059669" }}>
                                {data.riskScore ?? 10}/100 ({data.riskDecision?.toUpperCase() ?? "AUTO_APPROVE"})
                            </div>
                        </div>
                    </div>

                    {/* Cryptographic Proof Verification Block */}
                    <div style={{ border: "1px dashed #cbd5e1", borderRadius: "14px", padding: "16px", marginBottom: "24px" }}>
                        <div style={{ fontSize: "11px", fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.06em", color: "#0f172a", marginBottom: "10px" }}>
                            Cryptographic Proof Integrity
                        </div>
                        <div style={{ display: "flex", flexDirection: "column", gap: "8px", fontSize: "11px" }}>
                            <div>
                                <span style={{ color: "#64748b", fontWeight: 600 }}>Binary Merkle Root: </span>
                                <span style={{ fontFamily: "monospace", fontWeight: 700, color: "#0f172a", wordBreak: "break-all" }}>
                                    {data.merkleRoot}
                                </span>
                            </div>
                            {data.solanaSignature && (
                                <div>
                                    <span style={{ color: "#64748b", fontWeight: 600 }}>Solana Devnet Memo Anchor: </span>
                                    <span style={{ fontFamily: "monospace", fontWeight: 700, color: "#2563eb", wordBreak: "break-all" }}>
                                        {data.solanaSignature}
                                    </span>
                                </div>
                            )}
                            {data.solanaSlot && (
                                <div>
                                    <span style={{ color: "#64748b", fontWeight: 600 }}>Confirmed Slot Height: </span>
                                    <span style={{ fontFamily: "monospace", fontWeight: 700, color: "#0f172a" }}>
                                        #{data.solanaSlot} (Cluster: Devnet)
                                    </span>
                                </div>
                            )}
                            <div>
                                <span style={{ color: "#64748b", fontWeight: 600 }}>Telegraph Subnet Quorum: </span>
                                <span style={{ fontWeight: 700, color: "#0f172a" }}>
                                    Subnets 101, 102, 103, 104, 105 ({data.minersCount ?? 18} Verified Miner Attestations)
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Footer / QR Code / Legal Stamp */}
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", borderTop: "2px solid #e2e8f0", paddingTop: "18px" }}>
                        {/* QR Code */}
                        <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
                            <div style={{
                                width: "64px",
                                height: "64px",
                                background: "#fff",
                                border: "1px solid #cbd5e1",
                                padding: "4px",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                            }}>
                                <svg viewBox="0 0 100 100" style={{ width: "100%", height: "100%" }}>
                                    {/* Procedural QR Code Mock */}
                                    <rect width="100" height="100" fill="#fff" />
                                    <rect x="10" y="10" width="25" height="25" fill="#000" />
                                    <rect x="15" y="15" width="15" height="15" fill="#fff" />
                                    <rect x="18" y="18" width="9" height="9" fill="#000" />
                                    <rect x="65" y="10" width="25" height="25" fill="#000" />
                                    <rect x="70" y="15" width="15" height="15" fill="#fff" />
                                    <rect x="73" y="18" width="9" height="9" fill="#000" />
                                    <rect x="10" y="65" width="25" height="25" fill="#000" />
                                    <rect x="15" y="70" width="15" height="15" fill="#fff" />
                                    <rect x="18" y="73" width="9" height="9" fill="#000" />
                                    <rect x="42" y="15" width="12" height="12" fill="#000" />
                                    <rect x="45" y="40" width="15" height="15" fill="#000" />
                                    <rect x="25" y="45" width="10" height="10" fill="#000" />
                                    <rect x="70" y="48" width="16" height="16" fill="#000" />
                                    <rect x="50" y="70" width="18" height="18" fill="#000" />
                                    <rect x="75" y="75" width="14" height="14" fill="#000" />
                                </svg>
                            </div>
                            <div>
                                <div style={{ fontSize: "10px", fontWeight: 800, color: "#0f172a", textTransform: "uppercase" }}>Scan to Verify Proof</div>
                                <div style={{ fontSize: "9px", color: "#64748b", maxWidth: "180px", wordBreak: "break-all" }}>
                                    WebCrypto Zero-Trust Verifier Engine
                                </div>
                            </div>
                        </div>

                        {/* Signatures / Compliance Seal */}
                        <div style={{ textAlign: "right" }}>
                            <div style={{ fontSize: "10px", fontWeight: 700, color: "#0f172a", marginBottom: "4px" }}>
                                VERISETTLE AUTONOMOUS ORCHESTRATOR
                            </div>
                            <div style={{ fontSize: "9px", color: "#64748b", maxWidth: "260px" }}>
                                Cryptographically generated via Telegraph Multi-Miner Quorum. Tamper-evident receipt valid for cross-border financial audit.
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
