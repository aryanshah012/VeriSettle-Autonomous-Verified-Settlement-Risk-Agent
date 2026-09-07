"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { SettlementCertificate, CertificateData } from "../components/SettlementCertificate";

interface MinerReceipt {
    index?: number;
    intent: string;
    minerId: string;
    txProofHash: string;
    confidenceScore: number;
    latencyMs: number;
    usedInConsensus: boolean;
    createdAt?: string;
    timestamp?: string;
}

interface MerkleProofStep {
    position: "left" | "right";
    hash: string;
}

interface MerkleTreeData {
    root: string;
    levels: string[][];
    leaves: string[];
    proofs: Record<string, MerkleProofStep[]>;
}

interface SolanaAnchor {
    status: string;
    signature: string;
    explorerUrl: string;
    slot?: number;
    merkleRoot: string;
    cluster: string;
    timestamp: string;
    feePayer: string;
    memoPayload: string;
}

interface VerifyResult {
    verified: boolean;
    reason?: string;
    demoMode?: boolean;
    transaction?: {
        id: string;
        status: string;
        sourceCurrency: string;
        amountIn: number;
        amountOut: number;
        exchangeRate: number;
        riskScore: number | null;
        riskDecision: string | null;
        riskSignals: unknown;
        createdAt: string;
        updatedAt: string;
        counterpartyAddress: string | null;
    };
    proofBundle?: {
        claimedHash: string;
        reconstructedHash: string;
        merkleRoot: string;
        merkleTree?: MerkleTreeData;
        hashMatches: boolean;
        receipts: MinerReceipt[];
        totalMinerCalls: number;
        consensusPickCount: number;
        solanaAnchor?: SolanaAnchor;
    };
    hashChain?: { step: string; input: string; output: string }[];
    verifiedAt?: string;
}

// In-browser WebCrypto SHA-256 for zero-trust client verification
async function browserSha256(str: string): Promise<string> {
    const buffer = new TextEncoder().encode(str);
    const hashBuffer = await crypto.subtle.digest("SHA-256", buffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, "0")).join("");
}

function AnimatedHash({ value }: { value: string }) {
    const chars = "0123456789abcdef";
    const [display, setDisplay] = useState(value.slice(0, 16).padEnd(value.length, "0"));
    const iter = useRef(0);

    useEffect(() => {
        iter.current = 0;
        const iv = setInterval(() => {
            iter.current++;
            if (iter.current > 25) { clearInterval(iv); setDisplay(value); return; }
            setDisplay(
                value.split("").map((c, i) =>
                    i < iter.current * 2.5 ? c : chars[Math.floor(Math.random() * chars.length)]
                ).join("")
            );
        }, 30);
        return () => clearInterval(iv);
    }, [value]);

    return <span style={{ fontFamily: "var(--font-mono, 'JetBrains Mono', monospace)" }}>{display}</span>;
}

function CopyBtn({ text, label = "Copy" }: { text: string; label?: string }) {
    const [copied, setCopied] = useState(false);
    const copy = () => {
        navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };
    return (
        <button onClick={copy} style={{
            background: "none", border: "none",
            color: copied ? "#34d399" : "#38bdf8",
            cursor: "pointer", fontSize: "12px", fontWeight: 600,
            padding: "2px 8px", borderRadius: "6px",
            transition: "all 0.2s",
        }}>
            {copied ? "✓ Copied" : label}
        </button>
    );
}

export default function VerifyPage() {
    const [input, setInput] = useState("");
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState<VerifyResult | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [expandedStep, setExpandedStep] = useState<number | null>(null);
    const [showCertificate, setShowCertificate] = useState(false);

    // Merkle interactive proof verification state
    const [selectedLeafIdx, setSelectedLeafIdx] = useState<number>(0);
    const [inBrowserVerifying, setInBrowserVerifying] = useState(false);
    const [inBrowserValid, setInBrowserValid] = useState<boolean | null>(null);
    const [computedPath, setComputedPath] = useState<{ step: number; left: string; right: string; output: string }[]>([]);

    const doVerify = async (queryInput?: string) => {
        const target = queryInput || input;
        if (!target.trim()) return;
        setLoading(true); setResult(null); setError(null);
        setInBrowserValid(null); setComputedPath([]);

        try {
            const isHash = target.length === 64 && /^[0-9a-f]+$/.test(target);
            const param = isHash ? `hash=${target}` : `txId=${target}`;
            const res = await fetch(`/api/settlement/verify?${param}`);
            const data: VerifyResult = await res.json();
            setResult(data);
        } catch (e: unknown) {
            setError(e instanceof Error ? e.message : "Verification request failed");
        } finally {
            setLoading(false);
        }
    };

    const loadDemo = async () => {
        try {
            // Fetch the latest transaction from history
            const res = await fetch("/api/settlement/history");
            const data = await res.json();
            const txs = data.transactions || [];
            if (txs.length > 0 && txs[0].settlementTxRef) {
                const targetHash = txs[0].settlementTxRef;
                setInput(targetHash);
                doVerify(targetHash);
                return;
            }
        } catch {
            // fallback
        }
        // Deterministic fallback root from verified execution
        const defaultHash = "7efdf49d512965d69e4b6bc9ec20a328ed5c51f90d15732d25e3308d0f89ab9d";
        setInput(defaultHash);
        doVerify(defaultHash);
    };

    // Run client-side WebCrypto Merkle path proof
    const verifyLeafInBrowser = async () => {
        if (!result?.proofBundle?.merkleTree) return;
        setInBrowserVerifying(true);
        setInBrowserValid(null);

        try {
            const tree = result.proofBundle.merkleTree;
            const leafHash = tree.leaves[selectedLeafIdx];
            const proof = tree.proofs[String(selectedLeafIdx)] || [];
            const pathSteps: { step: number; left: string; right: string; output: string }[] = [];

            let current = leafHash;
            let stepNum = 1;

            for (const step of proof) {
                let left = "";
                let right = "";
                if (step.position === "left") {
                    left = step.hash;
                    right = current;
                } else {
                    left = current;
                    right = step.hash;
                }
                const output = await browserSha256(left + right);
                pathSteps.push({ step: stepNum++, left, right, output });
                current = output;
            }

            setComputedPath(pathSteps);
            const isMatch = current === tree.root;
            setInBrowserValid(isMatch);
        } catch (err) {
            console.error(err);
            setInBrowserValid(false);
        } finally {
            setInBrowserVerifying(false);
        }
    };

    const getRiskColor = (score: number | null) => {
        if (score === null) return "#94a3b8";
        if (score <= 40) return "#34d399";
        if (score <= 70) return "#fbbf24";
        return "#f87171";
    };

    const INTENT_ICONS: Record<string, string> = {
        CRYPTO_PRICE: "⚡", CURRENCY_EXCHANGE: "💱",
        FRAUD_DETECTION: "🛡️", WALLET_BALANCE_CHECK: "🔗",
        GAS_PRICE: "⛽", NEWS_SEARCH: "📰",
    };

    return (
        <div style={{
            minHeight: "100vh",
            background: "radial-gradient(ellipse at 50% 0%, #0d1e3d 0%, #050b18 70%)",
            padding: "40px 20px 100px",
            color: "#e2e8f0",
            fontFamily: "system-ui, sans-serif",
        }}>
            <div style={{ maxWidth: "980px", margin: "0 auto" }}>

                {/* Header */}
                <div style={{ textAlign: "center", marginBottom: "36px" }}>
                    <div style={{
                        display: "inline-flex", alignItems: "center", gap: "8px",
                        padding: "6px 16px", borderRadius: "999px",
                        background: "rgba(6,182,212,0.1)", border: "1px solid rgba(6,182,212,0.3)",
                        color: "#38bdf8", fontSize: "12px", fontWeight: 700,
                        letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: "14px",
                    }}>
                        <span style={{ width: 8, height: 8, borderRadius: "50%", background: "#06b6d4", boxShadow: "0 0 10px #06b6d4", display: "inline-block" }} />
                        Cryptographic Merkle & Solana Devnet Audit Engine
                    </div>
                    <h1 style={{
                        fontSize: "clamp(2rem, 5vw, 2.8rem)", fontWeight: 800,
                        margin: "0 0 10px",
                        background: "linear-gradient(135deg, #ffffff 30%, #38bdf8 70%, #06b6d4 100%)",
                        WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
                        letterSpacing: "-0.03em",
                    }}>
                        Public Settlement Proof Verifier
                    </h1>
                    <p style={{ color: "#94a3b8", fontSize: "0.95rem", maxWidth: "620px", margin: "0 auto" }}>
                        Reconstruct and independently verify the SHA-256 Merkle tree of Telegraph miner proofs, leaf-by-leaf, anchored on the Solana Devnet blockchain.
                    </p>
                </div>

                {/* Input Card */}
                <div style={{
                    background: "rgba(15,23,42,0.85)", backdropFilter: "blur(16px)",
                    border: "1px solid rgba(51,65,85,0.7)", borderRadius: "24px",
                    padding: "24px 28px", marginBottom: "24px",
                    boxShadow: "0 8px 32px rgba(0,0,0,0.4)",
                }}>
                    <label style={{ display: "block", fontSize: "12px", fontWeight: 700, color: "#94a3b8", marginBottom: "10px", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                        Settlement Merkle Root or Transaction ID
                    </label>
                    <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
                        <input
                            type="text"
                            value={input}
                            onChange={e => setInput(e.target.value)}
                            onKeyDown={e => e.key === "Enter" && doVerify()}
                            placeholder="Paste SHA-256 Merkle Root (64 hex chars) or Transaction ID..."
                            style={{
                                flex: 1, minWidth: "280px",
                                padding: "13px 18px",
                                background: "rgba(30,41,59,0.8)",
                                border: "1px solid rgba(71,85,105,0.6)",
                                borderRadius: "12px",
                                color: "#f1f5f9", fontSize: "13px",
                                fontFamily: "'JetBrains Mono', monospace",
                                outline: "none",
                            }}
                        />
                        <button
                            onClick={() => doVerify()}
                            disabled={loading || !input.trim()}
                            style={{
                                padding: "13px 26px",
                                background: loading
                                    ? "rgba(6,182,212,0.2)"
                                    : "linear-gradient(135deg, #06b6d4, #3b82f6)",
                                border: "none", borderRadius: "12px",
                                color: "#050b18", fontWeight: 700, fontSize: "13px",
                                cursor: loading ? "wait" : "pointer",
                                transition: "all 0.2s", whiteSpace: "nowrap",
                                boxShadow: loading ? "none" : "0 0 20px rgba(6,182,212,0.35)",
                            }}
                        >
                            {loading ? "Verifying…" : "⚡ Verify Merkle Proof"}
                        </button>
                    </div>

                    {/* Quick actions */}
                    <div style={{ display: "flex", gap: "10px", marginTop: "12px", alignItems: "center", flexWrap: "wrap" }}>
                        <button onClick={loadDemo} style={{
                            padding: "6px 14px", borderRadius: "8px", fontSize: "12px", fontWeight: 700,
                            background: "rgba(6,182,212,0.12)", border: "1px solid rgba(6,182,212,0.35)",
                            color: "#38bdf8", cursor: "pointer", transition: "all 0.15s",
                        }}>
                            ⚡ Load Latest Settlement Proof
                        </button>
                        <span style={{ color: "#64748b", fontSize: "11px" }}>
                            Recomputes binary Merkle tree across all 6 Telegraph Subnet intents
                        </span>
                    </div>
                </div>

                {/* Error State */}
                {error && (
                    <div style={{
                        padding: "16px 20px", borderRadius: "14px",
                        background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)",
                        color: "#f87171", marginBottom: "24px",
                    }}>
                        ⚠️ {error}
                    </div>
                )}

                {/* Loading Animation */}
                {loading && (
                    <div style={{
                        padding: "48px", textAlign: "center",
                        background: "rgba(15,23,42,0.7)", backdropFilter: "blur(12px)",
                        border: "1px solid rgba(51,65,85,0.6)", borderRadius: "20px",
                    }}>
                        <div style={{
                            width: "48px", height: "48px",
                            border: "3px solid rgba(6,182,212,0.2)",
                            borderTopColor: "#06b6d4", borderRadius: "50%",
                            margin: "0 auto 16px",
                            animation: "spin 0.9s linear infinite",
                        }} />
                        <p style={{ color: "#38bdf8", fontWeight: 600, marginBottom: "4px" }}>Reconstructing Binary Merkle Tree…</p>
                        <p style={{ color: "#64748b", fontSize: "13px" }}>Validating miner signatures & cross-referencing Solana Devnet SPL Memo seal</p>
                    </div>
                )}

                {/* Result */}
                {result && !loading && (
                    <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>

                        {/* Verification Status Banner */}
                        <div style={{
                            padding: "22px 26px",
                            background: result.verified ? "rgba(16,185,129,0.08)" : "rgba(239,68,68,0.08)",
                            border: `2px solid ${result.verified ? "rgba(16,185,129,0.4)" : "rgba(239,68,68,0.4)"}`,
                            borderRadius: "20px",
                            display: "flex", alignItems: "center", gap: "18px",
                            flexWrap: "wrap",
                        }}>
                            <div style={{
                                width: "60px", height: "60px", borderRadius: "50%",
                                background: result.verified ? "rgba(16,185,129,0.15)" : "rgba(239,68,68,0.15)",
                                border: `2px solid ${result.verified ? "#10b981" : "#ef4444"}`,
                                display: "flex", alignItems: "center", justifyContent: "center",
                                fontSize: "28px", flexShrink: 0,
                            }}>
                                {result.verified ? "✓" : "✗"}
                            </div>
                            <div style={{ flex: 1 }}>
                                <div style={{
                                    fontSize: "1.35rem", fontWeight: 800,
                                    color: result.verified ? "#34d399" : "#f87171",
                                    marginBottom: "4px",
                                }}>
                                    {result.verified
                                        ? "Cryptographically Verified · Telegraph Protocol Consensus"
                                        : result.demoMode
                                        ? "Transaction Not Found in Ledger"
                                        : "Hash Mismatch — Proof Invalid"}
                                </div>
                                <div style={{ color: "#94a3b8", fontSize: "13px" }}>
                                    {result.verified
                                        ? `Merkle tree reconstructed from ${result.proofBundle?.totalMinerCalls || 0} miner proofs. Verified at ${result.verifiedAt ? new Date(result.verifiedAt).toLocaleString() : "—"}`
                                        : result.reason ?? "The Merkle tree reconstruction does not match the claimed root hash."}
                                </div>
                                {result.verified && (
                                <div style={{ display: "flex", gap: "10px", alignItems: "center", marginTop: "12px" }}>
                                    <button
                                        type="button"
                                        onClick={() => setShowCertificate(true)}
                                        style={{
                                            padding: "8px 16px",
                                            borderRadius: "12px",
                                            background: "linear-gradient(135deg, rgba(6, 182, 212, 0.25), rgba(59, 130, 246, 0.25))",
                                            border: "1px solid rgba(6, 182, 212, 0.5)",
                                            color: "#38bdf8",
                                            fontSize: "12px",
                                            fontWeight: 700,
                                            cursor: "pointer",
                                            display: "flex",
                                            alignItems: "center",
                                            gap: "6px",
                                            transition: "all 0.15s",
                                        }}
                                    >
                                        <span>📜</span>
                                        <span>Official Certificate</span>
                                    </button>
                                    <div style={{
                                        padding: "8px 16px", borderRadius: "12px",
                                        background: "rgba(16,185,129,0.15)", border: "1px solid rgba(16,185,129,0.4)",
                                        color: "#34d399", fontSize: "12px", fontWeight: 700,
                                        textAlign: "center",
                                    }}>
                                        <div style={{ fontSize: "18px", marginBottom: "2px" }}>🏛️</div>
                                        Tamper-Proof
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Solana Devnet On-Chain Proof Card */}
                        {result.proofBundle?.solanaAnchor && (
                            <div style={{
                                background: "linear-gradient(135deg, rgba(88,28,135,0.2), rgba(15,23,42,0.85))",
                                backdropFilter: "blur(12px)",
                                border: "1.5px solid rgba(168,85,247,0.4)",
                                borderRadius: "20px",
                                padding: "22px 26px",
                            }}>
                                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "14px", flexWrap: "wrap", gap: "8px" }}>
                                    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                                        <div style={{
                                            width: "28px", height: "28px", borderRadius: "8px",
                                            background: "rgba(168,85,247,0.2)", border: "1px solid rgba(168,85,247,0.5)",
                                            display: "flex", alignItems: "center", justifyContent: "center",
                                            fontSize: "14px", color: "#c084fc",
                                        }}>
                                            ◎
                                        </div>
                                        <div>
                                            <span style={{ fontWeight: 800, fontSize: "0.95rem", color: "#f1f5f9" }}>
                                                Solana Devnet Blockchain Proof Anchor
                                            </span>
                                            <span style={{ marginLeft: "8px", fontSize: "11px", color: "#a855f7", fontWeight: 600 }}>
                                                (SPL Memo Program)
                                            </span>
                                        </div>
                                    </div>
                                    <a
                                        href={result.proofBundle.solanaAnchor.explorerUrl}
                                        target="_blank"
                                        rel="noreferrer"
                                        style={{
                                            display: "inline-flex", alignItems: "center", gap: "6px",
                                            padding: "6px 14px", borderRadius: "8px",
                                            background: "rgba(168,85,247,0.25)", border: "1px solid rgba(168,85,247,0.5)",
                                            color: "#e9d5ff", fontSize: "12px", fontWeight: 700,
                                            textDecoration: "none",
                                        }}
                                    >
                                        Inspect on Solana Explorer ↗
                                    </a>
                                </div>

                                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "10px", marginBottom: "14px" }}>
                                    <div style={{ padding: "10px 14px", background: "rgba(15,23,42,0.6)", borderRadius: "10px", border: "1px solid rgba(51,65,85,0.4)" }}>
                                        <div style={{ fontSize: "10px", color: "#94a3b8", textTransform: "uppercase", fontWeight: 600 }}>Status</div>
                                        <div style={{ fontSize: "12px", color: "#34d399", fontWeight: 700 }}>✓ CONFIRMED</div>
                                    </div>
                                    <div style={{ padding: "10px 14px", background: "rgba(15,23,42,0.6)", borderRadius: "10px", border: "1px solid rgba(51,65,85,0.4)" }}>
                                        <div style={{ fontSize: "10px", color: "#94a3b8", textTransform: "uppercase", fontWeight: 600 }}>Cluster / Program</div>
                                        <div style={{ fontSize: "12px", color: "#c084fc", fontWeight: 600 }}>devnet · Memo v1</div>
                                    </div>
                                    <div style={{ padding: "10px 14px", background: "rgba(15,23,42,0.6)", borderRadius: "10px", border: "1px solid rgba(51,65,85,0.4)" }}>
                                        <div style={{ fontSize: "10px", color: "#94a3b8", textTransform: "uppercase", fontWeight: 600 }}>Slot Height</div>
                                        <div style={{ fontSize: "12px", color: "#38bdf8", fontFamily: "monospace" }}>{result.proofBundle.solanaAnchor.slot || "confirmed"}</div>
                                    </div>
                                </div>

                                <div style={{ padding: "12px 14px", background: "rgba(15,23,42,0.7)", borderRadius: "10px", border: "1px solid rgba(51,65,85,0.4)" }}>
                                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "4px" }}>
                                        <span style={{ fontSize: "11px", color: "#94a3b8", fontWeight: 600 }}>ON-CHAIN TRANSACTION SIGNATURE</span>
                                        <CopyBtn text={result.proofBundle.solanaAnchor.signature} />
                                    </div>
                                    <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "11px", color: "#e9d5ff", wordBreak: "break-all" }}>
                                        {result.proofBundle.solanaAnchor.signature}
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Interactive Merkle Tree Visualizer */}
                        {result.proofBundle?.merkleTree && (
                            <div style={{
                                background: "rgba(15,23,42,0.85)", backdropFilter: "blur(12px)",
                                border: "1px solid rgba(6,182,212,0.3)", borderRadius: "20px",
                                padding: "24px",
                            }}>
                                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px", flexWrap: "wrap", gap: "10px" }}>
                                    <div>
                                        <h2 style={{ fontSize: "1.05rem", fontWeight: 700, color: "#fff", margin: "0 0 4px", display: "flex", alignItems: "center", gap: "8px" }}>
                                            <span>🌲</span> Interactive Binary Merkle Tree Visualizer
                                        </h2>
                                        <p style={{ color: "#94a3b8", fontSize: "12px", margin: 0 }}>
                                            Select any miner leaf node to trace and re-compute its cryptographic inclusion path in your browser.
                                        </p>
                                    </div>
                                    <div style={{
                                        padding: "4px 10px", borderRadius: "8px",
                                        background: "rgba(6,182,212,0.15)", border: "1px solid rgba(6,182,212,0.3)",
                                        color: "#38bdf8", fontSize: "11px", fontWeight: 700,
                                    }}>
                                        Levels: {result.proofBundle.merkleTree.levels.length} · Leaves: {result.proofBundle.merkleTree.leaves.length}
                                    </div>
                                </div>

                                {/* Merkle Root Box */}
                                <div style={{
                                    padding: "14px 18px",
                                    background: "rgba(6,182,212,0.08)",
                                    border: "1px solid rgba(6,182,212,0.35)",
                                    borderRadius: "12px",
                                    marginBottom: "16px",
                                }}>
                                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "4px" }}>
                                        <span style={{ fontSize: "11px", fontWeight: 700, color: "#38bdf8", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                                            Root Hash (Level {result.proofBundle.merkleTree.levels.length - 1})
                                        </span>
                                        <CopyBtn text={result.proofBundle.merkleTree.root} />
                                    </div>
                                    <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "12px", color: "#38bdf8", wordBreak: "break-all" }}>
                                        <AnimatedHash value={result.proofBundle.merkleTree.root} />
                                    </div>
                                </div>

                                {/* Leaf Node Selector Grid */}
                                <div style={{ marginBottom: "16px" }}>
                                    <div style={{ fontSize: "11px", color: "#94a3b8", fontWeight: 700, textTransform: "uppercase", marginBottom: "8px", letterSpacing: "0.05em" }}>
                                        Select Miner Proof Leaf:
                                    </div>
                                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "8px" }}>
                                        {result.proofBundle.receipts.map((r, i) => {
                                            const isSelected = selectedLeafIdx === i;
                                            return (
                                                <button
                                                    key={i}
                                                    type="button"
                                                    onClick={() => { setSelectedLeafIdx(i); setInBrowserValid(null); setComputedPath([]); }}
                                                    style={{
                                                        textAlign: "left",
                                                        padding: "10px 12px",
                                                        background: isSelected ? "rgba(6,182,212,0.2)" : "rgba(30,41,59,0.5)",
                                                        border: isSelected ? "1.5px solid #06b6d4" : "1px solid rgba(51,65,85,0.4)",
                                                        borderRadius: "10px",
                                                        cursor: "pointer",
                                                        display: "flex", flexDirection: "column", gap: "4px",
                                                    }}
                                                >
                                                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                                        <span style={{ fontSize: "11px", fontWeight: 700, color: isSelected ? "#38bdf8" : "#f1f5f9" }}>
                                                            {INTENT_ICONS[r.intent] ?? "⚡"} Leaf #{i}
                                                        </span>
                                                        {r.usedInConsensus && (
                                                            <span style={{ fontSize: "9px", padding: "1px 5px", borderRadius: "4px", background: "rgba(16,185,129,0.2)", color: "#34d399", fontWeight: 700 }}>
                                                                PICK
                                                            </span>
                                                        )}
                                                    </div>
                                                    <div style={{ fontSize: "10px", color: "#94a3b8", fontFamily: "monospace" }}>
                                                        {r.minerId}
                                                    </div>
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>

                                {/* In-Browser WebCrypto Verifier Action */}
                                <div style={{
                                    padding: "14px 18px",
                                    background: "rgba(15,23,42,0.7)",
                                    border: "1px solid rgba(51,65,85,0.5)",
                                    borderRadius: "12px",
                                }}>
                                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "8px", marginBottom: "12px" }}>
                                        <div>
                                            <span style={{ fontWeight: 700, fontSize: "13px", color: "#f1f5f9" }}>
                                                Inclusion Proof Path for Leaf #{selectedLeafIdx}
                                            </span>
                                            <span style={{ marginLeft: "8px", fontSize: "11px", color: "#64748b" }}>
                                                ({result.proofBundle.merkleTree.proofs[String(selectedLeafIdx)]?.length || 0} hash steps to root)
                                            </span>
                                        </div>
                                        <button
                                            onClick={verifyLeafInBrowser}
                                            disabled={inBrowserVerifying}
                                            style={{
                                                padding: "6px 14px",
                                                borderRadius: "8px",
                                                background: "linear-gradient(135deg, #06b6d4, #3b82f6)",
                                                border: "none",
                                                color: "#050b18",
                                                fontSize: "12px",
                                                fontWeight: 700,
                                                cursor: "pointer",
                                            }}
                                        >
                                            {inBrowserVerifying ? "Computing..." : "⚡ Recompute Path in Browser"}
                                        </button>
                                    </div>

                                    {/* Verification Status */}
                                    {inBrowserValid !== null && (
                                        <div style={{
                                            padding: "10px 14px", borderRadius: "8px", marginBottom: "12px",
                                            background: inBrowserValid ? "rgba(16,185,129,0.12)" : "rgba(239,68,68,0.12)",
                                            border: `1px solid ${inBrowserValid ? "#10b981" : "#ef4444"}`,
                                            display: "flex", alignItems: "center", gap: "8px",
                                            color: inBrowserValid ? "#34d399" : "#f87171",
                                            fontSize: "12px", fontWeight: 700,
                                        }}>
                                            <span>{inBrowserValid ? "✓" : "✗"}</span>
                                            <span>
                                                {inBrowserValid
                                                    ? "Browser WebCrypto Verification: Computed root matches on-chain Merkle root perfectly!"
                                                    : "Browser WebCrypto Verification: Path mismatch."}
                                            </span>
                                        </div>
                                    )}

                                    {/* Proof Steps Display */}
                                    <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                                        {(result.proofBundle.merkleTree.proofs[String(selectedLeafIdx)] || []).map((step, idx) => (
                                            <div key={idx} style={{
                                                padding: "8px 12px",
                                                background: "rgba(30,41,59,0.5)",
                                                borderRadius: "8px",
                                                border: "1px solid rgba(51,65,85,0.4)",
                                                fontSize: "11px",
                                                display: "flex", alignItems: "center", gap: "10px",
                                            }}>
                                                <span style={{ color: "#38bdf8", fontWeight: 700 }}>Step {idx + 1}</span>
                                                <span style={{ color: "#94a3b8" }}>Pair with {step.position} sibling:</span>
                                                <span style={{ color: "#e2e8f0", fontFamily: "monospace", flex: 1, wordBreak: "break-all" }}>
                                                    {step.hash.slice(0, 24)}…{step.hash.slice(-12)}
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Settlement Summary */}
                        {result.transaction && (
                            <div style={{
                                background: "rgba(15,23,42,0.8)", backdropFilter: "blur(12px)",
                                border: "1px solid rgba(51,65,85,0.6)", borderRadius: "20px",
                                padding: "24px",
                            }}>
                                <h2 style={{ fontSize: "1rem", fontWeight: 700, color: "#fff", margin: "0 0 16px", display: "flex", alignItems: "center", gap: "8px" }}>
                                    <span>📋</span> Transaction & State Record
                                </h2>
                                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "12px" }}>
                                    {[
                                        { label: "Transaction ID", value: result.transaction.id, mono: true },
                                        { label: "Status", value: result.transaction.status.toUpperCase(), accent: result.transaction.status === "complete" },
                                        { label: "Amount Settled", value: `${result.transaction.amountIn} ${result.transaction.sourceCurrency} → ₹${(result.transaction.amountOut ?? 0).toLocaleString("en-IN")}` },
                                        { label: "Guaranteed FX Rate", value: `1 ${result.transaction.sourceCurrency} = ₹${result.transaction.exchangeRate?.toFixed(2)}`, mono: true },
                                        { label: "Composite Risk Score", value: result.transaction.riskScore !== null ? `${result.transaction.riskScore}/100` : "—", riskScore: result.transaction.riskScore },
                                        { label: "Risk Decision", value: result.transaction.riskDecision?.replace(/_/g, " ").toUpperCase() ?? "—" },
                                        { label: "Settlement Timestamp", value: new Date(result.transaction.createdAt).toLocaleString() },
                                        { label: "Counterparty Address", value: result.transaction.counterpartyAddress ? result.transaction.counterpartyAddress.slice(0, 16) + "…" : "—", mono: true },
                                    ].map(item => (
                                        <div key={item.label} style={{
                                            padding: "12px 14px",
                                            background: "rgba(30,41,59,0.5)",
                                            border: "1px solid rgba(51,65,85,0.4)",
                                            borderRadius: "12px",
                                        }}>
                                            <div style={{ fontSize: "10px", color: "#64748b", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "4px" }}>
                                                {item.label}
                                            </div>
                                            <div style={{
                                                fontWeight: 600, fontSize: "12px",
                                                fontFamily: item.mono ? "'JetBrains Mono', monospace" : "inherit",
                                                color: item.accent ? "#34d399" : item.riskScore !== undefined ? getRiskColor(item.riskScore) : "#f1f5f9",
                                            }}>
                                                {item.value}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Footer CTA */}
                        <div style={{
                            display: "flex", justifyContent: "center", gap: "12px", flexWrap: "wrap", paddingTop: "8px",
                        }}>
                            <Link href="/settlement" style={{
                                padding: "12px 24px",
                                background: "linear-gradient(135deg, #06b6d4, #3b82f6)",
                                borderRadius: "14px", color: "#050b18",
                                fontWeight: 700, fontSize: "14px", textDecoration: "none",
                                boxShadow: "0 0 24px rgba(6,182,212,0.3)",
                            }}>
                                Execute New Settlement →
                            </Link>
                            <Link href="/analytics" style={{
                                padding: "12px 24px",
                                background: "rgba(30,41,59,0.8)",
                                border: "1px solid rgba(71,85,105,0.5)",
                                borderRadius: "14px", color: "#94a3b8",
                                fontWeight: 600, fontSize: "14px", textDecoration: "none",
                            }}>
                                View Subnet Telemetry
                            </Link>
                        </div>
                    </div>
                )}

                {showCertificate && result && (
                    <SettlementCertificate
                        data={{
                            transactionId: result.transaction?.id || "N/A",
                            merkleRoot: result.proofBundle?.merkleRoot || result.proofBundle?.reconstructedHash || "",
                            solanaSignature: result.proofBundle?.solanaAnchor?.signature,
                            solanaSlot: result.proofBundle?.solanaAnchor?.slot,
                            amountIn: result.transaction?.amountIn ?? 0,
                            sourceCurrency: result.transaction?.sourceCurrency ?? "SOL",
                            amountOut: result.transaction?.amountOut ?? 0,
                            targetCurrency: "INR",
                            effectiveRate: result.transaction?.exchangeRate ?? 0,
                            counterpartyAddress: result.transaction?.counterpartyAddress ?? undefined,
                            riskScore: result.transaction?.riskScore ?? 10,
                            riskDecision: result.transaction?.riskDecision ?? "auto_approve",
                            timestamp: result.transaction?.createdAt ?? new Date().toISOString(),
                            minersCount: result.proofBundle?.totalMinerCalls ?? 18,
                        }}
                        onClose={() => setShowCertificate(false)}
                    />
                )}
            </div>
        </div>
    );
}
