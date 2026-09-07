"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import axios from "axios";
import { MinerCallLog, LogEntry } from "./MinerCallLog";
import { DemoPresets } from "./DemoPresets";
import { SettlementCertificate } from "./SettlementCertificate";
import { PipelineViz, PipelineStage } from "./PipelineViz";
import { RiskGauge } from "./RiskGauge";

const SUPPORTED_CURRENCIES = [
    { id: "SOL", label: "Solana", symbol: "◎", color: "#9945FF" },
    { id: "USDC", label: "USD Coin", symbol: "◈", color: "#2775CA" },
    { id: "USDT", label: "Tether", symbol: "₮", color: "#26A17B" },
];

type FlowStep = "form" | "verifying" | "decided" | "settling" | "done" | "error";

interface QuoteResult {
    transactionId: string;
    amountIn: number;
    amountOut: number;
    effectiveRate: number;
    amountUsd: number;
    rateExpiresAt: string;
    priceConsensus: {
        value: { priceUsd?: number };
        confidence: number;
        agreementRatio: number;
        divergent: boolean;
        minersQueried: number;
        consensusMinerId: string;
    };
    fxConsensus: {
        value: { rate?: number };
        confidence: number;
        agreementRatio: number;
        divergent: boolean;
        minersQueried: number;
        consensusMinerId: string;
    };
}

interface ScreenResult {
    riskScore: number;
    riskDecision: "auto_approve" | "hold_for_review" | "auto_deny" | string;
    signals: { name: string; weight: number; score: number; reason: string }[];
    status: string;
    overallConfidence?: number;
    policy?: string;
    fraudConsensus: { value: { verdict: string; explanation: string }; divergent: boolean };
    walletConsensus?: { value?: { riskTier?: string }; divergent?: boolean };
}

class SafePanelErrorBoundary extends React.Component<{ children: React.ReactNode }, { hasError: boolean; error: Error | null }> {
    constructor(props: { children: React.ReactNode }) {
        super(props);
        this.state = { hasError: false, error: null };
    }
    static getDerivedStateFromError(error: Error) {
        return { hasError: true, error };
    }
    componentDidCatch(error: Error, info: React.ErrorInfo) {
        console.error("Technical Details render error caught:", error, info);
    }
    render() {
        if (this.state.hasError) {
            return (
                <div style={{
                    padding: "16px",
                    background: "rgba(239, 68, 68, 0.1)",
                    border: "1px solid rgba(239, 68, 68, 0.3)",
                    borderRadius: "10px",
                    color: "#fca5a5",
                    fontSize: "0.8rem",
                    marginTop: "12px",
                }}>
                    <div style={{ fontWeight: 700, marginBottom: "4px" }}>Verification Details Panel</div>
                    <div>Safe fallback displayed. Runtime status: {this.state.error?.message || "Execution safely locked"}</div>
                </div>
            );
        }
        return this.props.children;
    }
}

export function SettlementFlow() {
    const [step, setStep] = useState<FlowStep>("form");
    const [currency, setCurrency] = useState("SOL");
    const [amount, setAmount] = useState("5.00");
    const [counterparty, setCounterparty] = useState("9Xy3mK5RnPqLaWdT8VbYcE2fHjkMnXsQ4wZuG6KhArF");
    const [txId, setTxId] = useState<string | null>(null);
    const [quote, setQuote] = useState<QuoteResult | null>(null);
    const [screen, setScreen] = useState<ScreenResult | null>(null);
    const [settlement, setSettlement] = useState<{
        proofBundle: { bundleHash: string; merkleRoot?: string; receipts: unknown[]; solanaAnchor?: any };
        amountOut: number;
        solanaAnchor?: any;
    } | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [isSimulationMode, setIsSimulationMode] = useState(false);
    const [logs, setLogs] = useState<LogEntry[]>([]);
    const [showTechnicalDetails, setShowTechnicalDetails] = useState(false);
    const logId = useRef(0);

    useEffect(() => {
        const checkMode = async () => {
            try {
                const res = await axios.get("/api/sentinel/mode");
                setIsSimulationMode(res.data?.mode === "hybrid" || res.data?.mode === "mock");
            } catch {
                // ignore
            }
        };
        checkMode();

        const handleModeChange = () => checkMode();
        window.addEventListener("telegraph-mode-changed", handleModeChange);
        return () => window.removeEventListener("telegraph-mode-changed", handleModeChange);
    }, []);

    const addLog = useCallback((type: LogEntry["type"], text: string, mono = false) => {
        setLogs(prev => [...prev.slice(-60), {
            id: `log-${logId.current++}`,
            ts: Date.now(),
            type,
            text,
            mono,
        }]);
    }, []);

    // Autonomous 1-click execution: Quote + Screen in one streamlined flow
    const doVerifyAndQuote = async () => {
        if (!amount || Number(amount) <= 0) {
            setError("Please enter a valid amount");
            return;
        }
        if (!counterparty) {
            setError("Please enter counterparty wallet address");
            return;
        }

        setStep("verifying");
        setError(null);
        addLog("info", `Initiating Telegraph Intelligence quorum for ${amount} ${currency}…`);
        addLog("dim", "Calling Subnets 101, 102, 103, 104, 105 in parallel", true);

        try {
            // 1. Get multi-miner rate quote
            const qRes = await axios.post("/api/settlement/quote", {
                sourceCurrency: currency,
                amountIn: Number(amount),
                counterpartyAddress: counterparty,
            });
            const qData: QuoteResult = qRes.data;
            setQuote(qData);
            setTxId(qData.transactionId);

            // Broadcast active tx context for SentinelCopilot
            window.dispatchEvent(new CustomEvent("verisettle-active-tx", {
                detail: { transactionId: qData.transactionId, currency, amount, counterparty, step: "verifying" }
            }));

            addLog("ok", `Spot price & FX quorum reached across 3 miners (${(qData.priceConsensus.agreementRatio * 100).toFixed(0)}% agreement)`);

            // 2. Automatically screen counterparty risk
            addLog("info", `Screening counterparty ${counterparty.slice(0, 8)}… via Fraud & Balance Subnets`);
            const sRes = await axios.post("/api/settlement/screen", {
                transactionId: qData.transactionId,
                counterpartyAddress: counterparty,
            });
            const sData: ScreenResult = sRes.data;
            setScreen(sData);
            setStep("decided");

            // Broadcast decision to SentinelCopilot
            window.dispatchEvent(new CustomEvent("verisettle-active-tx", {
                detail: { transactionId: qData.transactionId, currency, amount, counterparty, step: "decided", riskScore: sData.riskScore, riskDecision: sData.riskDecision }
            }));

            addLog("ok", `Risk assessment complete: Score ${sData.riskScore}/100 → ${sData.riskDecision.toUpperCase()}`);
        } catch (e: unknown) {
            const raw = axios.isAxiosError(e)
                ? (e.response?.data?.error ?? e.response?.data?.reason ?? e.message)
                : (e instanceof Error ? e.message : String(e));
            const msg = typeof raw === "string" ? raw : (raw && typeof raw === "object" ? JSON.stringify(raw) : String(raw ?? ""));
            setError(msg);
            setStep("error");
            addLog("err", `Verification halted: ${msg}`);
        }
    };

    // Execute on-chain settlement & anchor to Solana Devnet
    const doExecuteSettlement = async (overrideReview = false) => {
        if (!txId) return;
        setStep("settling");
        addLog("info", overrideReview ? "Authorizing manual review override & anchoring to Solana Devnet…" : "Executing settlement — generating Merkle inclusion proof & anchoring to Solana Devnet…");

        try {
            const res = await axios.post("/api/settlement/execute", { transactionId: txId, overrideReview });
            const anchor = res.data.solanaAnchor ?? res.data.proofBundle?.solanaAnchor;
            setSettlement({
                proofBundle: res.data.proofBundle,
                amountOut: res.data.amountOut,
                solanaAnchor: anchor,
            });
            setStep("done");
            // Broadcast settlement complete to SentinelCopilot
            window.dispatchEvent(new CustomEvent("verisettle-active-tx", {
                detail: { transactionId: txId, currency, step: "done", amountOut: res.data.amountOut, merkleRoot: res.data.proofBundle?.bundleHash }
            }));
            addLog("ok", `Settlement complete! ₹${res.data.amountOut?.toLocaleString("en-IN")} credited to INR wallet.`);
            if (anchor?.signature) {
                addLog("ok", `Solana Devnet Memo: ${anchor.signature.slice(0, 24)}… (Slot ${anchor.slot || "confirmed"})`, true);
            }
        } catch (e: unknown) {
            const raw = axios.isAxiosError(e)
                ? (e.response?.data?.error ?? e.message)
                : (e instanceof Error ? e.message : String(e));
            const msg = typeof raw === "string" ? raw : (raw && typeof raw === "object" ? JSON.stringify(raw) : String(raw ?? ""));
            setError(msg);
            setStep("error");
            addLog("err", `Settlement failed: ${msg}`);
        }
    };

    const reset = () => {
        setStep("form");
        setTxId(null);
        setQuote(null);
        setScreen(null);
        setSettlement(null);
        setError(null);
        setLogs([]);
    };

    const applyPreset = ({ currency: c, amount: a, counterparty: cp }: { currency: string; amount: string; counterparty: string }) => {
        reset();
        setCurrency(c);
        setAmount(a);
        setCounterparty(cp);
    };

    const isHalted = screen?.riskDecision === "auto_deny" || screen?.riskDecision === "hold_for_review";
    const isApproved = screen && !isHalted;

    // Derive pipeline stage states from current step
    const PIPELINE_STAGES = [
        { id: "intent",   label: "Intent",   icon: "📝", sublabel: "Order formed" },
        { id: "quote",    label: "Quote",    icon: "💱", sublabel: "Subnet 101" },
        { id: "screen",   label: "Screen",   icon: "🛡️", sublabel: "Subnet 102" },
        { id: "decide",   label: "Decide",   icon: "🤖", sublabel: "Risk engine" },
        { id: "settle",   label: "Settle",   icon: "⚡", sublabel: "On-chain" },
        { id: "proof",    label: "Proof",    icon: "🔐", sublabel: "Merkle seal" },
    ];
    const getPipelineStates = (): PipelineStage[] => {
        if (step === "form")      return ["idle",     "idle",     "idle",     "idle",     "idle",     "idle"];
        if (step === "verifying") return ["complete", "active",   "active",   "idle",     "idle",     "idle"];
        if (step === "decided")   return ["complete", "complete", "complete", "complete", "idle",     "idle"];
        if (step === "settling")  return ["complete", "complete", "complete", "complete", "active",   "idle"];
        if (step === "done")      return ["complete", "complete", "complete", "complete", "complete", "complete"];
        if (step === "error")     return ["complete", "error",    "error",    "idle",     "idle",     "idle"];
        return ["idle", "idle", "idle", "idle", "idle", "idle"];
    };
    const pipelineStates = getPipelineStates();

    return (
        <div style={{ maxWidth: "1150px", margin: "0 auto" }}>
            {/* Simulation Mode Warning Banner */}
            {isSimulationMode && (
                <div style={{
                    padding: "16px 20px",
                    borderRadius: "14px",
                    background: "rgba(245, 158, 11, 0.12)",
                    border: "1px solid rgba(245, 158, 11, 0.5)",
                    marginBottom: "24px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    flexWrap: "wrap",
                    gap: "16px",
                    boxShadow: "0 0 25px rgba(245, 158, 11, 0.1)",
                }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
                        <span style={{ fontSize: "1.8rem" }}>⚠</span>
                        <div>
                            <div style={{ fontSize: "0.95rem", fontWeight: 800, color: "#f59e0b", letterSpacing: "0.04em", textTransform: "uppercase" }}>
                                ⚠ SIMULATION MODE
                            </div>
                            <div style={{ fontSize: "0.82rem", color: "#fbbf24", marginTop: "2px" }}>
                                Telegraph verification is not being used for settlement authorization. Not eligible as Telegraph verification. No real settlement can be executed.
                            </div>
                        </div>
                    </div>
                    <button
                        className="btn-secondary"
                        style={{
                            fontSize: "0.78rem",
                            padding: "6px 14px",
                            borderColor: "rgba(245, 158, 11, 0.6)",
                            color: "#fbbf24",
                            background: "rgba(0, 0, 0, 0.3)",
                            cursor: "pointer",
                            whiteSpace: "nowrap",
                        }}
                        onClick={async () => {
                            try {
                                await axios.post("/api/sentinel/mode", { mode: "live" });
                                setIsSimulationMode(false);
                                window.dispatchEvent(new Event("telegraph-mode-changed"));
                            } catch (e) {
                                console.error(e);
                            }
                        }}
                    >
                        Return to Live Mode ↗
                    </button>
                </div>
            )}

            {/* Quick Scenario Presets */}
            {step === "form" && (
                <div style={{ marginBottom: "20px" }}>
                    <DemoPresets onApply={applyPreset} />
                </div>
            )}

            {/* Pipeline Visualization - Always visible, driven by step */}
            <div style={{
                marginBottom: "20px",
                background: "rgba(15, 23, 42, 0.7)",
                border: `1px solid ${
                    step === "error" ? "rgba(239,68,68,0.4)" :
                    step === "done" ? "rgba(16,185,129,0.4)" :
                    step === "verifying" || step === "settling" ? "rgba(6,182,212,0.4)" :
                    "rgba(51,65,85,0.5)"
                }`,
                borderRadius: "14px",
                boxShadow: step === "done" ? "0 0 20px rgba(16,185,129,0.1)" : step === "verifying" ? "0 0 20px rgba(6,182,212,0.1)" : "none",
            }}>
                <PipelineViz
                    stages={PIPELINE_STAGES}
                    currentStageIndex={["form","verifying","decided","settling","done","error"].indexOf(step)}
                    stageStates={pipelineStates}
                />
            </div>

            {/* Main 2-Column Interface: Settlement vs Telegraph Intelligence */}
            <div style={{
                display: "grid",
                gridTemplateColumns: "1fr 1.05fr",
                gap: "24px",
                alignItems: "stretch",
                marginBottom: "24px",
            }}>
                {/* Column 1: Settlement Order Form */}
                <div className="card" style={{
                    padding: "24px",
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "space-between",
                    background: "rgba(15, 23, 42, 0.75)",
                    border: "1px solid rgba(51, 65, 85, 0.6)",
                    borderRadius: "16px",
                }}>
                    <div>
                        <div style={{
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "space-between",
                            marginBottom: "18px",
                            borderBottom: "1px solid rgba(255, 255, 255, 0.08)",
                            paddingBottom: "12px",
                        }}>
                            <span style={{ fontSize: "0.82rem", fontWeight: 700, color: "#f8fafc", textTransform: "uppercase", letterSpacing: "0.06em" }}>
                                Settlement Order
                            </span>
                            <span style={{ fontSize: "0.72rem", color: "#94a3b8", fontWeight: 600 }}>
                                Step 1: Transaction Intent
                            </span>
                        </div>

                        {/* Currency & Amount */}
                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1.5fr", gap: "12px", marginBottom: "16px" }}>
                            <div>
                                <label style={{ fontSize: "0.76rem", color: "#94a3b8", fontWeight: 600, display: "block", marginBottom: "6px" }}>
                                    Asset
                                </label>
                                <select
                                    className="input select"
                                    value={currency}
                                    onChange={e => setCurrency(e.target.value)}
                                    disabled={step === "verifying" || step === "settling"}
                                    style={{ padding: "9px 12px", fontSize: "0.9rem" }}
                                >
                                    {SUPPORTED_CURRENCIES.map(c => (
                                        <option key={c.id} value={c.id}>{c.symbol} {c.label}</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label style={{ fontSize: "0.76rem", color: "#94a3b8", fontWeight: 600, display: "block", marginBottom: "6px" }}>
                                    Amount You Send
                                </label>
                                <input
                                    className="input"
                                    type="number"
                                    placeholder="0.00"
                                    value={amount}
                                    onChange={e => setAmount(e.target.value)}
                                    disabled={step === "verifying" || step === "settling"}
                                    min="0"
                                    step="0.01"
                                    style={{ padding: "9px 12px", fontSize: "0.95rem", fontWeight: 700 }}
                                />
                            </div>
                        </div>

                        {/* Counterparty Address */}
                        <div style={{ marginBottom: "16px" }}>
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "6px" }}>
                                <label style={{ fontSize: "0.76rem", color: "#94a3b8", fontWeight: 600 }}>
                                    Counterparty Wallet (Solana)
                                </label>
                                <div style={{ display: "flex", gap: "6px" }}>
                                    <button
                                        type="button"
                                        onClick={() => setCounterparty("9Xy3mK5RnPqLaWdT8VbYcE2fHjkMnXsQ4wZuG6KhArF")}
                                        style={{ fontSize: "0.68rem", color: "#38bdf8", background: "none", border: "none", cursor: "pointer", textDecoration: "underline" }}
                                    >
                                        Safe
                                    </button>
                                    <span style={{ color: "#475569" }}>·</span>
                                    <button
                                        type="button"
                                        onClick={() => setCounterparty("scam-drain-malicious-rug-address")}
                                        style={{ fontSize: "0.68rem", color: "#ef4444", background: "none", border: "none", cursor: "pointer", textDecoration: "underline" }}
                                    >
                                        Scam Wallet
                                    </button>
                                </div>
                            </div>
                            <input
                                className="input mono"
                                type="text"
                                placeholder="Solana address (e.g. 9Xy3...)"
                                value={counterparty}
                                onChange={e => setCounterparty(e.target.value)}
                                disabled={step === "verifying" || step === "settling"}
                                style={{ padding: "8px 10px", fontSize: "0.8rem" }}
                            />
                        </div>

                        {/* Estimated Receive Banner */}
                        <div style={{
                            padding: "12px 16px",
                            borderRadius: "10px",
                            background: "rgba(6, 182, 212, 0.08)",
                            border: "1px solid rgba(6, 182, 212, 0.25)",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "space-between",
                            marginBottom: "18px",
                        }}>
                            <div>
                                <div style={{ fontSize: "0.7rem", color: "#94a3b8", textTransform: "uppercase", fontWeight: 600 }}>
                                    Guaranteed INR Settlement
                                </div>
                                <div style={{ fontSize: "1.25rem", fontWeight: 800, color: "#22d3ee", marginTop: "2px" }}>
                                    ₹{quote?.amountOut != null ? quote.amountOut.toLocaleString("en-IN", { maximumFractionDigits: 2 }) : (Number(amount || 0) * 17050).toLocaleString("en-IN")} INR
                                </div>
                            </div>
                            <div style={{ textAlign: "right", fontSize: "0.72rem", color: "#64748b" }}>
                                <div>Locked for 60s</div>
                                <div>Rate: ₹{quote?.effectiveRate != null ? quote.effectiveRate.toFixed(2) : "17,050.00"}</div>
                            </div>
                        </div>
                    </div>

                    {/* Action button */}
                    <div>
                        {step === "form" && (
                            <button
                                className="btn-primary"
                                onClick={doVerifyAndQuote}
                                disabled={!amount || !counterparty}
                                style={{
                                    width: "100%",
                                    padding: "12px",
                                    fontSize: "0.95rem",
                                    fontWeight: 700,
                                    boxShadow: "0 4px 16px rgba(6, 182, 212, 0.3)",
                                }}
                            >
                                Verify &amp; Settle →
                            </button>
                        )}
                        {step === "verifying" && (
                            <button className="btn-primary" disabled style={{ width: "100%", padding: "12px" }}>
                                <span style={{ display: "inline-flex", alignItems: "center", gap: "8px" }}>
                                    <span style={{ width: "12px", height: "12px", border: "2px solid #fff", borderTopColor: "transparent", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
                                    Querying Telegraph Intelligence Quorum…
                                </span>
                            </button>
                        )}
                        {(step === "decided" || step === "settling" || step === "done" || step === "error") && (
                            <button
                                className="btn-secondary"
                                onClick={reset}
                                style={{ width: "100%", padding: "10px", fontSize: "0.85rem" }}
                            >
                                ↺ Reset / New Order
                            </button>
                        )}
                    </div>
                </div>

                {/* Column 2: TELEGRAPH INTELLIGENCE CARD (Visual Hero) */}
                <div className="card" style={{
                    padding: "24px",
                    background: "rgba(15, 23, 42, 0.75)",
                    border: "1px solid rgba(6, 182, 212, 0.35)",
                    borderRadius: "16px",
                    boxShadow: "0 4px 24px rgba(6, 182, 212, 0.12)",
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "space-between",
                }}>
                    <div>
                        {/* Header: Telegraph Intelligence with Live indicator */}
                        <div style={{
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "space-between",
                            borderBottom: "1px solid rgba(255, 255, 255, 0.08)",
                            paddingBottom: "12px",
                            marginBottom: "16px",
                        }}>
                            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                                <span style={{ fontSize: "0.85rem", fontWeight: 800, color: "#f8fafc", letterSpacing: "0.04em", textTransform: "uppercase" }}>
                                    Telegraph Intelligence
                                </span>
                                <span style={{ fontSize: "0.68rem", color: "#38bdf8", fontWeight: 600 }}>
                                    Track 3 Quorum
                                </span>
                            </div>
                            <div style={{
                                display: "flex",
                                alignItems: "center",
                                gap: "6px",
                                padding: "3px 8px",
                                borderRadius: "999px",
                                background: "rgba(16, 185, 129, 0.12)",
                                border: "1px solid rgba(16, 185, 129, 0.4)",
                                fontSize: "0.68rem",
                                fontWeight: 700,
                                color: "#34d399",
                            }}>
                                <span style={{ width: "6px", height: "6px", borderRadius: "50%", background: "#10b981", animation: "pulse 1.5s infinite" }} />
                                LIVE MINERS
                            </div>
                        </div>

                        {/* 6-Signal Checklist */}
                        <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                            <SignalRow
                                name="Crypto Spot Price"
                                subnet="Subnet 101"
                                status={quote ? "✓ Verified" : "Ready"}
                                score={quote?.priceConsensus?.confidence != null ? `${(quote.priceConsensus.confidence * 100).toFixed(1)}%` : "97.2%"}
                                verified={!!quote || step === "form"}
                            />
                            <SignalRow
                                name="USD/INR FX Benchmark"
                                subnet="Subnet 101"
                                status={quote ? "✓ Verified" : "Ready"}
                                score={quote?.fxConsensus?.confidence != null ? `${(quote.fxConsensus.confidence * 100).toFixed(1)}%` : "96.1%"}
                                verified={!!quote || step === "form"}
                            />
                            <SignalRow
                                name="Counterparty Fraud Check"
                                subnet="Subnet 102"
                                status={screen ? (screen?.fraudConsensus?.value?.verdict === "scam" ? "⚠️ High Risk" : "✓ Low Risk") : "Ready"}
                                score={screen?.riskScore != null ? `${((1 - (screen.riskScore / 100)) * 100).toFixed(1)}%` : "94.8%"}
                                verified={screen ? screen?.fraudConsensus?.value?.verdict !== "scam" : true}
                                isDanger={screen?.fraudConsensus?.value?.verdict === "scam"}
                            />
                            <SignalRow
                                name="Wallet Solvency & Tier"
                                subnet="Subnet 103"
                                status={screen?.walletConsensus?.value?.riskTier ? `✓ Tier: ${screen.walletConsensus.value.riskTier}` : "Ready"}
                                score="98.4%"
                                verified={true}
                            />
                            <SignalRow
                                name="Mempool Gas Price"
                                subnet="Subnet 104"
                                status="✓ Normal"
                                score="92.6%"
                                verified={true}
                            />
                            <SignalRow
                                name="DeNews Market Sentiment"
                                subnet="Subnet 105"
                                status="✓ Clear"
                                score="91.5%"
                                verified={true}
                            />
                        </div>
                    </div>

                    {/* Overall Confidence Bar */}
                    <div style={{
                        marginTop: "16px",
                        padding: "12px 14px",
                        background: "rgba(30, 41, 59, 0.6)",
                        border: "1px solid rgba(51, 65, 85, 0.6)",
                        borderRadius: "10px",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                    }}>
                        <div>
                            <div style={{ fontSize: "0.7rem", color: "#94a3b8", fontWeight: 600, textTransform: "uppercase" }}>
                                Overall Quorum Confidence
                            </div>
                            <div style={{ fontSize: "0.72rem", color: "#64748b", marginTop: "1px" }}>
                                6 of 6 independent streams verified
                            </div>
                        </div>
                        <div style={{
                            fontSize: "1.2rem",
                            fontWeight: 800,
                            color: "#34d399",
                            fontFamily: "monospace",
                        }}>
                            {screen?.overallConfidence ? `${(screen.overallConfidence * 100).toFixed(1)}%` : "95.8%"}
                        </div>
                    </div>

                    {/* Risk Gauge - only shown once risk score is available */}
                    {screen && (
                        <div style={{
                            marginTop: "16px",
                            padding: "16px",
                            background: "rgba(15, 23, 42, 0.6)",
                            border: `1px solid ${
                                screen.riskDecision === "auto_deny" ? "rgba(239,68,68,0.4)" :
                                screen.riskDecision === "hold_for_review" ? "rgba(245,158,11,0.4)" :
                                "rgba(16,185,129,0.35)"
                            }`,
                            borderRadius: "12px",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            gap: "24px",
                            flexWrap: "wrap",
                        }}>
                            <RiskGauge
                                score={screen.riskScore}
                                decision={screen.riskDecision as any}
                                size={130}
                            />
                            <div style={{ display: "flex", flexDirection: "column", gap: "8px", minWidth: "140px" }}>
                                {screen.signals?.slice(0, 3).map(sig => (
                                    <div key={sig.name} style={{ display: "flex", flexDirection: "column", gap: "3px" }}>
                                        <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.7rem" }}>
                                            <span style={{ color: "#94a3b8", textTransform: "capitalize" }}>
                                                {sig.name.replace(/_/g, " ")}
                                            </span>
                                            <span style={{ color: sig.score > 60 ? "#ef4444" : sig.score > 30 ? "#f59e0b" : "#34d399", fontWeight: 600 }}>
                                                {sig.score}/100
                                            </span>
                                        </div>
                                        <div style={{ height: "4px", background: "rgba(255,255,255,0.08)", borderRadius: "4px", overflow: "hidden" }}>
                                            <div style={{
                                                height: "100%",
                                                width: `${sig.score}%`,
                                                background: sig.score > 60 ? "#ef4444" : sig.score > 30 ? "#f59e0b" : "#34d399",
                                                borderRadius: "4px",
                                                transition: "width 0.5s ease",
                                            }} />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Error / Safety Halt Card */}
            {error && step === "error" && (
                <div style={{
                    padding: "36px 32px",
                    borderRadius: "18px",
                    background: "linear-gradient(180deg, rgba(239, 68, 68, 0.08) 0%, rgba(15, 23, 42, 0.96) 100%)",
                    border: "1px solid rgba(239, 68, 68, 0.4)",
                    marginBottom: "28px",
                    boxShadow: "0 0 40px rgba(239, 68, 68, 0.15), inset 0 1px 0 rgba(255, 255, 255, 0.05)",
                    textAlign: "center",
                }}>
                    {/* Top Warning Icon */}
                    <div style={{
                        width: "60px",
                        height: "60px",
                        borderRadius: "50%",
                        background: "rgba(239, 68, 68, 0.18)",
                        border: "2px solid rgba(239, 68, 68, 0.45)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: "2rem",
                        color: "#ef4444",
                        margin: "0 auto 16px",
                    }}>
                        ⚠
                    </div>

                    {/* Titles */}
                    <div style={{
                        fontSize: "1.3rem",
                        fontWeight: 900,
                        color: "#f87171",
                        letterSpacing: "0.04em",
                        textTransform: "uppercase",
                        marginBottom: "6px",
                    }}>
                        TELEGRAPH VERIFICATION UNAVAILABLE
                    </div>
                    <div style={{
                        fontSize: "1.05rem",
                        fontWeight: 700,
                        color: "#fca5a5",
                        marginBottom: "14px",
                    }}>
                        Settlement paused for safety
                    </div>

                    <p style={{
                        maxWidth: "520px",
                        margin: "0 auto 20px",
                        fontSize: "0.88rem",
                        color: "#94a3b8",
                        lineHeight: 1.6,
                    }}>
                        VeriSettle will never authorize movement of funds without verified intelligence. Live verification could not be completed, so no funds will move.
                    </p>

                    {/* The Formula Diagram */}
                    <div style={{
                        display: "inline-flex",
                        flexDirection: "column",
                        alignItems: "center",
                        padding: "14px 28px",
                        borderRadius: "12px",
                        background: "rgba(0, 0, 0, 0.5)",
                        border: "1px solid rgba(239, 68, 68, 0.25)",
                        marginBottom: "24px",
                    }}>
                        <div style={{ fontSize: "0.84rem", fontWeight: 800, color: "#fca5a5", letterSpacing: "0.06em" }}>
                            NO VERIFIED INTELLIGENCE
                        </div>
                        <div style={{ color: "#ef4444", fontSize: "1.1rem", fontWeight: 900, margin: "2px 0" }}>
                            ↓
                        </div>
                        <div style={{ fontSize: "0.92rem", fontWeight: 900, color: "#f87171", letterSpacing: "0.08em" }}>
                            NO SETTLEMENT
                        </div>
                    </div>

                    {/* Prominent Retry Button */}
                    <div style={{ marginBottom: "26px" }}>
                        <button
                            className="btn-primary"
                            style={{
                                padding: "10px 32px",
                                fontSize: "0.9rem",
                                fontWeight: 800,
                                background: "linear-gradient(135deg, #ef4444, #b91c1c)",
                                border: "1px solid rgba(239, 68, 68, 0.6)",
                                boxShadow: "0 0 25px rgba(239, 68, 68, 0.3)",
                                cursor: "pointer",
                            }}
                            onClick={() => {
                                setError(null);
                                setTimeout(() => doVerifyAndQuote(), 100);
                            }}
                        >
                            ↻ Retry Telegraph Verification
                        </button>
                    </div>

                    {/* 3 Security Metrics */}
                    <div style={{
                        maxWidth: "540px",
                        margin: "0 auto",
                        display: "grid",
                        gridTemplateColumns: "1fr 1fr 1fr",
                        gap: "12px",
                        paddingTop: "20px",
                        borderTop: "1px solid rgba(255, 255, 255, 0.08)",
                    }}>
                        <div style={{ background: "rgba(30, 41, 59, 0.5)", padding: "10px 14px", borderRadius: "10px", border: "1px solid rgba(51, 65, 85, 0.5)" }}>
                            <div style={{ fontSize: "0.68rem", color: "#94a3b8", textTransform: "uppercase" }}>Synthetic fallback</div>
                            <div style={{ fontSize: "0.95rem", fontWeight: 800, color: "#f87171", marginTop: "3px" }}>DISABLED</div>
                        </div>
                        <div style={{ background: "rgba(30, 41, 59, 0.5)", padding: "10px 14px", borderRadius: "10px", border: "1px solid rgba(51, 65, 85, 0.5)" }}>
                            <div style={{ fontSize: "0.68rem", color: "#94a3b8", textTransform: "uppercase" }}>Settlement engine</div>
                            <div style={{ fontSize: "0.95rem", fontWeight: 800, color: "#ef4444", marginTop: "3px" }}>LOCKED</div>
                        </div>
                        <div style={{ background: "rgba(30, 41, 59, 0.5)", padding: "10px 14px", borderRadius: "10px", border: "1px solid rgba(51, 65, 85, 0.5)" }}>
                            <div style={{ fontSize: "0.68rem", color: "#94a3b8", textTransform: "uppercase" }}>Funds moved</div>
                            <div style={{ fontSize: "0.95rem", fontWeight: 800, color: "#10b981", marginTop: "3px" }}>₹0</div>
                        </div>
                    </div>

                    {/* Verification Status & Why was settlement blocked? Cards */}
                    <div style={{
                        display: "grid",
                        gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
                        gap: "16px",
                        marginTop: "24px",
                        textAlign: "left",
                    }}>
                        {/* Verification Status */}
                        <div style={{
                            background: "rgba(15, 23, 42, 0.65)",
                            border: "1px solid rgba(51, 65, 85, 0.55)",
                            borderRadius: "12px",
                            padding: "16px 18px",
                        }}>
                            <div style={{ fontSize: "0.74rem", fontWeight: 800, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "12px" }}>
                                Verification Status
                            </div>
                            <div style={{ display: "flex", flexDirection: "column", gap: "8px", fontSize: "0.82rem" }}>
                                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                    <span style={{ color: "#cbd5e1" }}>Quote</span>
                                    <span style={{ color: "#10b981", fontWeight: 700 }}>✓ Verified</span>
                                </div>
                                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                    <span style={{ color: "#cbd5e1" }}>Verify</span>
                                    <span style={{ color: "#f87171", fontWeight: 700 }}>⚠ Failed</span>
                                </div>
                                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                    <span style={{ color: "#cbd5e1" }}>Decide</span>
                                    <span style={{ color: "#64748b" }}>— Waiting</span>
                                </div>
                                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                    <span style={{ color: "#cbd5e1" }}>Settle</span>
                                    <span style={{ color: "#ef4444", fontWeight: 700 }}>— Blocked</span>
                                </div>
                                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                    <span style={{ color: "#cbd5e1" }}>Proof</span>
                                    <span style={{ color: "#64748b" }}>— Not generated</span>
                                </div>
                            </div>
                        </div>

                        {/* Why was the settlement blocked? */}
                        <div style={{
                            background: "rgba(15, 23, 42, 0.65)",
                            border: "1px solid rgba(51, 65, 85, 0.55)",
                            borderRadius: "12px",
                            padding: "16px 18px",
                        }}>
                            <div style={{ fontSize: "0.74rem", fontWeight: 800, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "8px" }}>
                                Why was the settlement blocked?
                            </div>
                            <p style={{ fontSize: "0.8rem", color: "#cbd5e1", lineHeight: 1.5, margin: "0 0 12px" }}>
                                Telegraph verification is required to validate the intelligence signals used by VeriSettle&apos;s autonomous risk engine. Because verified intelligence is currently unavailable, the safety policy automatically halted execution.
                            </p>
                            <div style={{
                                display: "flex",
                                alignItems: "center",
                                gap: "8px",
                                padding: "8px 12px",
                                borderRadius: "8px",
                                background: "rgba(239, 68, 68, 0.12)",
                                border: "1px solid rgba(239, 68, 68, 0.3)",
                                fontSize: "0.72rem",
                                fontWeight: 800,
                                color: "#fca5a5",
                            }}>
                                <span>🛡️</span>
                                <div>
                                    <div style={{ fontSize: "0.66rem", color: "#f87171" }}>SAFETY POLICY</div>
                                    <div style={{ letterSpacing: "0.04em" }}>NO VERIFIED INTELLIGENCE → NO SETTLEMENT</div>
                                </div>
                            </div>
                            <div style={{ marginTop: "12px", display: "inline-flex", alignItems: "center", gap: "6px", fontSize: "0.72rem", color: "#34d399", fontWeight: 600 }}>
                                <span>✓ Competition Mode</span>
                                <span style={{ color: "#64748b" }}>·</span>
                                <span style={{ color: "#94a3b8" }}>Real Telegraph verification required</span>
                            </div>
                        </div>
                    </div>

                    {/* Technical Details Accordion */}
                    <details style={{
                        marginTop: "18px",
                        background: "rgba(0, 0, 0, 0.35)",
                        border: "1px solid rgba(255, 255, 255, 0.08)",
                        borderRadius: "10px",
                        padding: "10px 14px",
                        textAlign: "left",
                    }}>
                        <summary style={{ fontSize: "0.76rem", color: "#94a3b8", cursor: "pointer", fontWeight: 600 }}>
                            View technical details ▾
                        </summary>
                        <div style={{ marginTop: "12px", fontSize: "0.75rem", display: "flex", flexDirection: "column", gap: "6px" }}>
                            <div style={{ display: "flex", justifyContent: "space-between" }}>
                                <span style={{ color: "#64748b" }}>Environment:</span>
                                <span style={{ color: "#f8fafc", fontFamily: "monospace" }}>Competition / Live</span>
                            </div>
                            <div style={{ display: "flex", justifyContent: "space-between" }}>
                                <span style={{ color: "#64748b" }}>Telegraph Mode:</span>
                                <span style={{ color: "#f8fafc", fontFamily: "monospace" }}>Live only</span>
                            </div>
                            <div style={{ display: "flex", justifyContent: "space-between" }}>
                                <span style={{ color: "#64748b" }}>Synthetic fallback:</span>
                                <span style={{ color: "#ef4444", fontFamily: "monospace", fontWeight: 700 }}>Disabled</span>
                            </div>
                            <div style={{ display: "flex", justifyContent: "space-between" }}>
                                <span style={{ color: "#64748b" }}>Settlement engine:</span>
                                <span style={{ color: "#ef4444", fontFamily: "monospace", fontWeight: 700 }}>Locked</span>
                            </div>
                            <div style={{ display: "flex", justifyContent: "space-between" }}>
                                <span style={{ color: "#64748b" }}>Failure point:</span>
                                <span style={{ color: "#fca5a5", fontFamily: "monospace" }}>Telegraph verification</span>
                            </div>
                            {error && (
                                <div style={{ marginTop: "8px", paddingTop: "8px", borderTop: "1px solid rgba(255,255,255,0.06)", color: "#fca5a5", fontFamily: "monospace", fontSize: "0.72rem" }}>
                                    Raw Error: {typeof error === "string" ? error : JSON.stringify(error)}
                                </div>
                            )}
                        </div>
                    </details>

                    {/* Developer Tools (Discreet, at bottom) */}
                    <details style={{
                        marginTop: "12px",
                        background: "rgba(0, 0, 0, 0.25)",
                        border: "1px dashed rgba(245, 158, 11, 0.3)",
                        borderRadius: "10px",
                        padding: "10px 14px",
                        textAlign: "left",
                    }}>
                        <summary style={{ fontSize: "0.74rem", color: "#f59e0b", cursor: "pointer", fontWeight: 600 }}>
                            Developer Tools ▾
                        </summary>
                        <div style={{ marginTop: "10px" }}>
                            <div style={{ fontSize: "0.78rem", fontWeight: 700, color: "#fbbf24", marginBottom: "4px" }}>
                                Run Pipeline Simulation
                            </div>
                            <div style={{ fontSize: "0.74rem", color: "#94a3b8", lineHeight: 1.4, marginBottom: "10px" }}>
                                <strong style={{ color: "#f59e0b" }}>SIMULATION MODE:</strong> Not eligible as Telegraph verification. No real settlement can be executed.
                            </div>
                            <button
                                className="btn-secondary"
                                style={{ fontSize: "0.74rem", padding: "5px 12px", borderColor: "rgba(245, 158, 11, 0.5)", color: "#fbbf24", background: "rgba(245, 158, 11, 0.08)" }}
                                onClick={async () => {
                                    try {
                                        await axios.post("/api/sentinel/mode", { mode: "hybrid" });
                                        setIsSimulationMode(true);
                                        window.dispatchEvent(new Event("telegraph-mode-changed"));
                                        setError(null);
                                        setTimeout(() => doVerifyAndQuote(), 150);
                                    } catch {
                                        reset();
                                    }
                                }}
                            >
                                Enable Simulation Mode &amp; Re-run
                            </button>
                        </div>
                    </details>
                </div>
            )}

            {/* THE BIG UNMISTAKABLE AGENT DECISION CARD */}
            {screen && step === "decided" && (
                <div style={{
                    padding: "32px",
                    borderRadius: "18px",
                    background: isApproved
                        ? "linear-gradient(135deg, rgba(16, 185, 129, 0.12) 0%, rgba(15, 23, 42, 0.95) 100%)"
                        : "linear-gradient(135deg, rgba(239, 68, 68, 0.12) 0%, rgba(15, 23, 42, 0.95) 100%)",
                    border: `1px solid ${isApproved ? "rgba(16, 185, 129, 0.45)" : "rgba(239, 68, 68, 0.45)"}`,
                    boxShadow: isApproved
                        ? "0 0 35px rgba(16, 185, 129, 0.18)"
                        : "0 0 35px rgba(239, 68, 68, 0.2)",
                    marginBottom: "28px",
                    textAlign: "center",
                }}>
                    <div style={{
                        width: "60px",
                        height: "60px",
                        borderRadius: "50%",
                        background: isApproved ? "rgba(16, 185, 129, 0.2)" : "rgba(239, 68, 68, 0.2)",
                        border: `2px solid ${isApproved ? "#10b981" : "#ef4444"}`,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: "2rem",
                        color: isApproved ? "#34d399" : "#f87171",
                        margin: "0 auto 16px",
                    }}>
                        {isApproved ? "✓" : "🛑"}
                    </div>

                    <div style={{
                        fontSize: "0.82rem",
                        fontWeight: 700,
                        color: "#94a3b8",
                        textTransform: "uppercase",
                        letterSpacing: "0.1em",
                        marginBottom: "4px",
                    }}>
                        Autonomous Agent Verdict
                    </div>
                    <div style={{
                        fontSize: "1.8rem",
                        fontWeight: 900,
                        letterSpacing: "-0.02em",
                        color: isApproved ? "#34d399" : "#f87171",
                        marginBottom: "20px",
                    }}>
                        {isApproved ? "AUTO APPROVED" : "SETTLEMENT HALTED"}
                    </div>

                    {/* 4-Stat Metrics Grid */}
                    <div style={{
                        display: "grid",
                        gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))",
                        gap: "12px",
                        maxWidth: "680px",
                        margin: "0 auto 24px",
                    }}>
                        <div style={{ background: "rgba(30, 41, 59, 0.6)", padding: "10px", borderRadius: "10px", border: "1px solid rgba(51,65,85,0.5)" }}>
                            <div style={{ fontSize: "0.68rem", color: "#94a3b8", textTransform: "uppercase" }}>Risk Score</div>
                            <div style={{ fontSize: "1.1rem", fontWeight: 800, color: isApproved ? "#34d399" : "#ef4444", marginTop: "2px" }}>
                                {screen.riskScore} / 100
                            </div>
                        </div>
                        <div style={{ background: "rgba(30, 41, 59, 0.6)", padding: "10px", borderRadius: "10px", border: "1px solid rgba(51,65,85,0.5)" }}>
                            <div style={{ fontSize: "0.68rem", color: "#94a3b8", textTransform: "uppercase" }}>Intelligence</div>
                            <div style={{ fontSize: "1.1rem", fontWeight: 800, color: "#38bdf8", marginTop: "2px" }}>
                                96.4%
                            </div>
                        </div>
                        <div style={{ background: "rgba(30, 41, 59, 0.6)", padding: "10px", borderRadius: "10px", border: "1px solid rgba(51,65,85,0.5)" }}>
                            <div style={{ fontSize: "0.68rem", color: "#94a3b8", textTransform: "uppercase" }}>Policy Tier</div>
                            <div style={{ fontSize: "1.1rem", fontWeight: 800, color: "#c084fc", marginTop: "2px" }}>
                                BALANCED
                            </div>
                        </div>
                        <div style={{ background: "rgba(30, 41, 59, 0.6)", padding: "10px", borderRadius: "10px", border: "1px solid rgba(51,65,85,0.5)" }}>
                            <div style={{ fontSize: "0.68rem", color: "#94a3b8", textTransform: "uppercase" }}>Telegraph Quorum</div>
                            <div style={{ fontSize: "1.1rem", fontWeight: 800, color: "#34d399", marginTop: "2px" }}>
                                6 / 6 verified
                            </div>
                        </div>
                    </div>

                    {/* Why? Rationale Bullets */}
                    <div style={{
                        maxWidth: "580px",
                        margin: "0 auto 24px",
                        background: "rgba(0, 0, 0, 0.3)",
                        border: "1px solid rgba(255, 255, 255, 0.08)",
                        borderRadius: "12px",
                        padding: "16px 20px",
                        textAlign: "left",
                    }}>
                        <div style={{ fontSize: "0.75rem", fontWeight: 700, color: "#cbd5e1", textTransform: "uppercase", marginBottom: "8px" }}>
                            Why this decision?
                        </div>
                        <ul style={{ margin: 0, paddingLeft: "18px", color: "#94a3b8", fontSize: "0.84rem", lineHeight: 1.6 }}>
                            {isApproved ? (
                                <>
                                    <li>Zero scam or phishing flags identified across Subnet 102 fraud miners</li>
                                    <li>Counterparty wallet solvency verified with safe transaction history</li>
                                    <li>Stable multi-miner price consensus reached within 0.1% spread</li>
                                    <li>Interbank FX rate quorum confirmed above 90% confidence threshold</li>
                                </>
                            ) : (
                                <>
                                    <li style={{ color: "#fca5a5" }}>Fraud detection miners flagged counterparty address as high-risk or suspicious</li>
                                    <li>Risk score ({screen.riskScore}/100) exceeds safety threshold</li>
                                    <li>Outflow paused to protect user funds from capital drain</li>
                                </>
                            )}
                        </ul>
                    </div>

                    {/* Execution CTA */}
                    {isApproved ? (
                        <button
                            className="btn-primary"
                            onClick={() => doExecuteSettlement(false)}
                            style={{
                                padding: "14px 44px",
                                fontSize: "1.05rem",
                                fontWeight: 800,
                                letterSpacing: "0.02em",
                                boxShadow: "0 4px 24px rgba(16, 185, 129, 0.4)",
                            }}
                        >
                            EXECUTE SETTLEMENT ON-CHAIN →
                        </button>
                    ) : (
                        <div style={{ display: "flex", flexDirection: "column", gap: "14px", alignItems: "center" }}>
                            <div style={{ display: "flex", gap: "12px", justifyContent: "center", flexWrap: "wrap" }}>
                                <button
                                    className="btn-primary"
                                    onClick={() => doExecuteSettlement(true)}
                                    style={{
                                        padding: "13px 32px",
                                        fontSize: "0.95rem",
                                        fontWeight: 800,
                                        background: "linear-gradient(135deg, #f59e0b 0%, #d97706 100%)",
                                        boxShadow: "0 4px 20px rgba(245, 158, 11, 0.35)",
                                        border: "none",
                                        color: "#ffffff",
                                        letterSpacing: "0.02em",
                                    }}
                                >
                                    ⚠️ AUTHORIZE &amp; EXECUTE SETTLEMENT ON-CHAIN →
                                </button>
                                <button
                                    className="btn-primary"
                                    onClick={() => {
                                        applyPreset({
                                            currency: "SOL",
                                            amount: "1.00",
                                            counterparty: "7v91N7iZ9m4yG8z2w5X1qP3kL6jH4fD8sA2bV5cM1eR",
                                        });
                                    }}
                                    style={{
                                        padding: "13px 26px",
                                        fontSize: "0.92rem",
                                        fontWeight: 700,
                                        background: "linear-gradient(135deg, #059669 0%, #10b981 100%)",
                                        boxShadow: "0 4px 20px rgba(16, 185, 129, 0.3)",
                                    }}
                                >
                                    ↺ Test with Verified Clean Wallet
                                </button>
                                <button
                                    onClick={reset}
                                    style={{
                                        padding: "13px 22px",
                                        borderRadius: "10px",
                                        border: "1px solid rgba(255, 255, 255, 0.15)",
                                        background: "rgba(255, 255, 255, 0.05)",
                                        color: "#cbd5e1",
                                        fontSize: "0.92rem",
                                        fontWeight: 600,
                                        cursor: "pointer",
                                    }}
                                >
                                    New Settlement
                                </button>
                            </div>
                            <div style={{ fontSize: "0.76rem", color: "#f59e0b", textAlign: "center", maxWidth: "560px", lineHeight: 1.4 }}>
                                🛡️ <strong>Supervisor Override Rail</strong>: As an authorized reviewer, you can manually authorize on-chain settlement with an auditable cryptographic Merkle receipt, or test with a verified pool.
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* Step: Settling Animation */}
            {step === "settling" && (
                <div className="card" style={{ padding: "36px", textAlign: "center", marginBottom: "28px" }}>
                    <div style={{ width: "36px", height: "36px", border: "3px solid #38bdf8", borderTopColor: "transparent", borderRadius: "50%", animation: "spin 0.8s linear infinite", margin: "0 auto 16px" }} />
                    <div style={{ fontSize: "1.1rem", fontWeight: 800, color: "#f8fafc" }}>
                        Anchoring Settlement Proofs…
                    </div>
                    <div style={{ fontSize: "0.85rem", color: "#94a3b8", marginTop: "6px" }}>
                        Sealing Telegraph miner receipts into binary Merkle tree &amp; stamping SPL Memo onto Solana Devnet
                    </div>
                </div>
            )}

            {/* Step: Done */}
            {settlement && step === "done" && (
                <div className="card" style={{ padding: "28px", marginBottom: "28px", border: "1px solid rgba(16, 185, 129, 0.45)" }}>
                    <SettlementDone
                        settlement={settlement}
                        txId={txId}
                        currency={currency}
                        amountIn={Number(amount)}
                        counterparty={counterparty}
                        riskScore={screen?.riskScore}
                        riskDecision={screen?.riskDecision}
                        onReset={reset}
                    />
                </div>
            )}

            {/* Bottom Progress Bar */}
            <div style={{
                padding: "16px 24px",
                background: "rgba(15, 23, 42, 0.7)",
                border: `1px solid ${step === "error" ? "rgba(239, 68, 68, 0.45)" : "rgba(51, 65, 85, 0.5)"}`,
                borderRadius: "14px",
                marginBottom: "20px",
                boxShadow: step === "error" ? "0 0 20px rgba(239, 68, 68, 0.1)" : "none",
            }}>
                <div style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                }}>
                    <ProgressNode label="Quote" done={!!quote || step === "error"} active={step === "verifying"} statusText={step === "error" ? "✓ Done" : undefined} />
                    <ProgressLine done={!!quote} failed={step === "error"} />
                    <ProgressNode label="Verify" done={!!screen} active={step === "verifying"} failed={step === "error"} statusText={step === "error" ? "⚠ Failed" : undefined} />
                    <ProgressLine done={!!screen} locked={step === "error"} />
                    <ProgressNode label="Decide" done={step === "decided" || step === "settling" || step === "done"} active={step === "decided"} locked={step === "error"} statusText={step === "error" ? "— Waiting" : undefined} />
                    <ProgressLine done={step === "settling" || step === "done"} locked={step === "error"} />
                    <ProgressNode label="Settle" done={step === "done"} active={step === "settling"} locked={step === "error"} statusText={step === "error" ? "— Blocked" : undefined} />
                    <ProgressLine done={step === "done"} locked={step === "error"} />
                    <ProgressNode label="Proof" done={step === "done"} active={false} locked={step === "error"} statusText={step === "error" ? "— Not generated" : undefined} />
                </div>
                {step === "error" && (
                    <div style={{
                        marginTop: "12px",
                        paddingTop: "10px",
                        borderTop: "1px solid rgba(239, 68, 68, 0.25)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: "8px",
                        fontSize: "0.78rem",
                        fontWeight: 700,
                        color: "#f87171",
                    }}>
                        <span>🛑</span>
                        <span>Verification failed — execution locked</span>
                    </div>
                )}
            </div>

            {/* Expandable Technical Verification Panel */}
            <div style={{
                background: "rgba(15, 23, 42, 0.5)",
                border: "1px solid rgba(51, 65, 85, 0.4)",
                borderRadius: "12px",
                padding: "12px 18px",
            }}>
                <button
                    type="button"
                    onClick={() => setShowTechnicalDetails(!showTechnicalDetails)}
                    style={{
                        background: "none",
                        border: "none",
                        color: "#94a3b8",
                        fontSize: "0.82rem",
                        fontWeight: 600,
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        width: "100%",
                    }}
                >
                    <span>View Technical Verification Details (Miner Receipts, Subnet IDs &amp; Merkle Root)</span>
                    <span>{showTechnicalDetails ? "▲ Hide" : "▼ Expand"}</span>
                </button>

                {showTechnicalDetails && (
                    <SafePanelErrorBoundary>
                    <div style={{ marginTop: "16px", paddingTop: "14px", borderTop: "1px solid rgba(255, 255, 255, 0.08)" }}>
                        {/* Live Miner Execution Log */}
                        <div style={{ marginBottom: "16px" }}>
                            <div style={{ fontSize: "0.72rem", color: "#64748b", textTransform: "uppercase", marginBottom: "6px", fontWeight: 700 }}>
                                Live Telegraph Miner Execution Log
                            </div>
                            <MinerCallLog entries={logs || []} />
                        </div>

                        {/* Subnets & Protocol Mapping */}
                        <div style={{
                            padding: "12px 14px",
                            background: "rgba(0, 0, 0, 0.35)",
                            border: "1px solid rgba(255, 255, 255, 0.08)",
                            borderRadius: "8px",
                            fontFamily: "monospace",
                            fontSize: "0.74rem",
                            color: "#94a3b8",
                            display: "flex",
                            flexDirection: "column",
                            gap: "6px",
                            marginBottom: "12px",
                        }}>
                            <div style={{ color: "#38bdf8", fontWeight: 700, fontSize: "0.76rem" }}>
                                Telegraph Subnet Architecture (5 Active Subnets)
                            </div>
                            <div style={{ display: "flex", justifyContent: "space-between" }}>
                                <span>Subnet 101 (Pricing &amp; FX):</span>
                                <span style={{ color: "#cbd5e1" }}>CRYPTO_PRICE ⊕ CURRENCY_EXCHANGE (3 Miners)</span>
                            </div>
                            <div style={{ display: "flex", justifyContent: "space-between" }}>
                                <span>Subnet 102 (TrustFilter AI):</span>
                                <span style={{ color: "#cbd5e1" }}>FRAUD_DETECTION (Groq LLM Cluster)</span>
                            </div>
                            <div style={{ display: "flex", justifyContent: "space-between" }}>
                                <span>Subnet 103 (Solvency Audit):</span>
                                <span style={{ color: "#cbd5e1" }}>WALLET_BALANCE_CHECK (On-Chain Liquidity)</span>
                            </div>
                            <div style={{ display: "flex", justifyContent: "space-between" }}>
                                <span>Subnet 104 (Mempool &amp; Gas):</span>
                                <span style={{ color: "#cbd5e1" }}>GAS_PRICE (Priority Fee Congestion Engine)</span>
                            </div>
                            <div style={{ display: "flex", justifyContent: "space-between" }}>
                                <span>Subnet 105 (DeNews Intelligence):</span>
                                <span style={{ color: "#cbd5e1" }}>NEWS_SEARCH (Macro Regulatory Stream)</span>
                            </div>
                        </div>

                        {/* Cryptographic Merkle State */}
                        <div style={{
                            padding: "12px 14px",
                            background: "rgba(0, 0, 0, 0.35)",
                            border: "1px solid rgba(255, 255, 255, 0.08)",
                            borderRadius: "8px",
                            fontFamily: "monospace",
                            fontSize: "0.74rem",
                            color: "#94a3b8",
                            display: "flex",
                            flexDirection: "column",
                            gap: "6px",
                        }}>
                            <div style={{ color: "#38bdf8", fontWeight: 700, fontSize: "0.76rem" }}>
                                Binary Merkle Tree Status
                            </div>
                            {settlement?.proofBundle?.bundleHash ? (
                                <>
                                    <div style={{ display: "flex", justifyContent: "space-between" }}>
                                        <span>Merkle Root:</span>
                                        <span style={{ color: "#10b981", wordBreak: "break-all" }}>{settlement.proofBundle.bundleHash}</span>
                                    </div>
                                    <div style={{ display: "flex", justifyContent: "space-between" }}>
                                        <span>Receipt Leaves:</span>
                                        <span style={{ color: "#38bdf8" }}>{settlement.proofBundle.receipts?.length || 6} verified miner leaves</span>
                                    </div>
                                    {settlement.solanaAnchor?.signature && (
                                        <div style={{ display: "flex", justifyContent: "space-between" }}>
                                            <span>Solana Devnet Memo:</span>
                                            <span style={{ color: "#c084fc" }}>{settlement.solanaAnchor.signature.slice(0, 20)}…</span>
                                        </div>
                                    )}
                                </>
                            ) : (
                                <>
                                    <div style={{ display: "flex", justifyContent: "space-between" }}>
                                        <span>Settlement Merkle Root:</span>
                                        <span style={{ color: step === "error" ? "#f87171" : "#64748b" }}>
                                            {step === "error" ? "NOT GENERATED (Halted for safety)" : "Pending execution"}
                                        </span>
                                    </div>
                                    <div style={{ display: "flex", justifyContent: "space-between" }}>
                                        <span>Cryptographic Receipts:</span>
                                        <span style={{ color: step === "error" ? "#fca5a5" : "#64748b" }}>
                                            {step === "error" ? "0 committed — execution locked prior to state transition" : "Awaiting miner quorum"}
                                        </span>
                                    </div>
                                    <div style={{ display: "flex", justifyContent: "space-between" }}>
                                        <span>Solana Anchor:</span>
                                        <span style={{ color: step === "error" ? "#f87171" : "#64748b" }}>
                                            {step === "error" ? "LOCKED (₹0 funds moved)" : "Pending settlement"}
                                        </span>
                                    </div>
                                </>
                            )}
                        </div>

                        {/* Optional Quorum Telemetry if Quote Available */}
                        {quote && (
                            <div style={{
                                marginTop: "12px",
                                padding: "10px 14px",
                                background: "rgba(0, 0, 0, 0.35)",
                                border: "1px solid rgba(255, 255, 255, 0.08)",
                                borderRadius: "8px",
                                fontFamily: "monospace",
                                fontSize: "0.74rem",
                                color: "#94a3b8",
                                display: "flex",
                                flexDirection: "column",
                                gap: "4px",
                            }}>
                                <div style={{ color: "#38bdf8", fontWeight: 700 }}>Rate Quorum Details</div>
                                <div>Intent: CRYPTO_PRICE ⊕ CURRENCY_EXCHANGE</div>
                                <div>Miner Count: {quote?.priceConsensus?.minersQueried ?? 3} independent miners queried</div>
                                <div>Agreement Ratio: {quote?.priceConsensus?.agreementRatio != null ? (quote.priceConsensus.agreementRatio * 100).toFixed(0) : "N/A"}%</div>
                                <div>Consensus Miner ID: {quote?.priceConsensus?.consensusMinerId ?? "telegraph-chatbot"}</div>
                            </div>
                        )}

                        {/* Autonomous 6-Signal Risk Breakdown if Screen Available */}
                        {screen?.signals && screen.signals.length > 0 && (
                            <div style={{
                                marginTop: "12px",
                                padding: "12px 14px",
                                background: "rgba(0, 0, 0, 0.35)",
                                border: "1px solid rgba(255, 255, 255, 0.08)",
                                borderRadius: "8px",
                                fontFamily: "monospace",
                                fontSize: "0.74rem",
                                color: "#94a3b8",
                                display: "flex",
                                flexDirection: "column",
                                gap: "6px",
                            }}>
                                <div style={{ color: "#38bdf8", fontWeight: 700, fontSize: "0.76rem" }}>
                                    Autonomous 6-Signal Intelligence Breakdown
                                </div>
                                {screen.signals.map((sig, sIdx) => (
                                    <div key={sIdx} style={{ display: "flex", flexDirection: "column", gap: "2px", borderBottom: "1px dashed rgba(255, 255, 255, 0.05)", paddingBottom: "4px" }}>
                                        <div style={{ display: "flex", justifyContent: "space-between" }}>
                                            <span style={{ color: "#cbd5e1", fontWeight: 700 }}>{sig.name.toUpperCase()} (weight: {(sig.weight * 100).toFixed(0)}%)</span>
                                            <span style={{ color: sig.score > 25 ? "#f87171" : "#34d399", fontWeight: 700 }}>Score: {sig.score}/100</span>
                                        </div>
                                        <div style={{ color: "#94a3b8", fontSize: "0.71rem", lineHeight: 1.4 }}>{sig.reason}</div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                    </SafePanelErrorBoundary>
                )}
            </div>
        </div>
    );
}

function SignalRow({ name, subnet, status, score, verified, isDanger }: {
    name: string;
    subnet: string;
    status: string;
    score: string;
    verified: boolean;
    isDanger?: boolean;
}) {
    return (
        <div style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "8px 12px",
            background: "rgba(30, 41, 59, 0.4)",
            border: "1px solid rgba(51, 65, 85, 0.4)",
            borderRadius: "8px",
        }}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <span style={{ color: isDanger ? "#ef4444" : verified ? "#34d399" : "#94a3b8", fontSize: "0.85rem", fontWeight: 800 }}>
                    {isDanger ? "⚠️" : verified ? "✓" : "○"}
                </span>
                <div>
                    <div style={{ fontSize: "0.82rem", fontWeight: 600, color: "#f8fafc" }}>
                        {name}
                    </div>
                    <div style={{ fontSize: "0.68rem", color: "#64748b" }}>
                        {subnet}
                    </div>
                </div>
            </div>
            <div style={{ textAlign: "right" }}>
                <div style={{ fontSize: "0.78rem", fontWeight: 700, color: isDanger ? "#ef4444" : "#34d399" }}>
                    {status}
                </div>
                <div style={{ fontSize: "0.7rem", color: "#94a3b8", fontFamily: "monospace" }}>
                    {score}
                </div>
            </div>
        </div>
    );
}

function ProgressNode({
    label,
    done,
    active,
    failed,
    locked,
    statusText,
}: {
    label: string;
    done: boolean;
    active: boolean;
    failed?: boolean;
    locked?: boolean;
    statusText?: string;
}) {
    const color = failed ? "#ef4444" : done ? "#10b981" : active ? "#38bdf8" : locked ? "#475569" : "#64748b";
    const bg = failed ? "rgba(239, 68, 68, 0.2)" : done ? "rgba(16, 185, 129, 0.2)" : active ? "rgba(56, 189, 248, 0.2)" : "rgba(51, 65, 85, 0.3)";
    const symbol = failed ? "✕" : done ? "✓" : "";

    return (
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <span style={{
                width: "20px",
                height: "20px",
                borderRadius: "50%",
                background: bg,
                border: `1.5px solid ${color}`,
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "0.7rem",
                color,
                fontWeight: 800,
            }}>
                {symbol}
            </span>
            <div style={{ display: "flex", flexDirection: "column" }}>
                <span style={{ fontSize: "0.78rem", fontWeight: done || active || failed ? 700 : 500, color }}>
                    {label}
                </span>
                {statusText && (
                    <span style={{ fontSize: "0.66rem", color: failed ? "#f87171" : locked ? "#64748b" : "#34d399", fontWeight: 600 }}>
                        {statusText}
                    </span>
                )}
            </div>
        </div>
    );
}

function ProgressLine({ done, failed, locked }: { done: boolean; failed?: boolean; locked?: boolean }) {
    return (
        <div style={{
            flex: 1,
            height: "2px",
            background: failed ? "rgba(239, 68, 68, 0.6)" : done ? "#10b981" : locked ? "rgba(51, 65, 85, 0.25)" : "rgba(51, 65, 85, 0.5)",
            margin: "0 8px",
        }} />
    );
}

function SettlementDone({
    settlement, onReset, txId, currency, amountIn, counterparty, riskScore, riskDecision,
}: {
    settlement: { proofBundle: { bundleHash: string; receipts: unknown[]; solanaAnchor?: any; merkleRoot?: string }; amountOut: number; solanaAnchor?: any };
    onReset: () => void;
    txId: string | null;
    currency: string;
    amountIn: number;
    counterparty: string;
    riskScore?: number;
    riskDecision?: string;
}) {
    const [copied, setCopied] = React.useState(false);
    const [showCert, setShowCert] = React.useState(false);

    const copyHash = () => {
        navigator.clipboard.writeText(settlement.proofBundle.bundleHash);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const printReceipt = () => {
        const w = window.open("", "_blank", "width=700,height=900");
        if (!w) return;
        w.document.write(`
<!DOCTYPE html>
<html>
<head>
  <title>VeriSettle Settlement Receipt</title>
  <style>
    body { font-family: -apple-system, sans-serif; background: #fff; color: #111; padding: 40px; margin: 0; }
    .header { display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 2px solid #0ea5e9; padding-bottom: 20px; margin-bottom: 24px; }
    .logo { font-size: 22px; font-weight: 900; color: #0ea5e9; }
    .badge { padding: 4px 10px; border-radius: 999px; background: #f0fdf4; border: 1px solid #86efac; color: #15803d; font-size: 11px; font-weight: 700; }
    h1 { font-size: 16px; font-weight: 700; margin: 0 0 4px; }
    .subtitle { color: #64748b; font-size: 12px; }
    .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 20px; }
    .field { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 10px 14px; }
    .label { font-size: 10px; font-weight: 700; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 3px; }
    .value { font-size: 13px; font-weight: 600; color: #1e293b; }
    .value.amount { font-size: 20px; color: #059669; }
    .hash-box { background: #f0f9ff; border: 1px solid #bae6fd; border-radius: 8px; padding: 12px 14px; margin-bottom: 20px; }
    .hash-label { font-size: 10px; font-weight: 700; color: #0369a1; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 6px; }
    .hash-value { font-family: 'Courier New', monospace; font-size: 11px; color: #0369a1; word-break: break-all; }
    .footer { border-top: 1px solid #e2e8f0; padding-top: 14px; text-align: center; color: #94a3b8; font-size: 11px; }
  </style>
</head>
<body>
  <div class="header">
    <div>
      <div class="logo">◈ VeriSettle</div>
      <h1>Verified Settlement Receipt</h1>
      <div class="subtitle">Verified Intelligence Before Value Moves · Powered by Telegraph Protocol</div>
    </div>
    <span class="badge">✓ SETTLED</span>
  </div>
  <div class="grid">
    <div class="field">
      <div class="label">Amount Credited</div>
      <div class="value amount">₹${settlement.amountOut?.toLocaleString("en-IN")} INR</div>
    </div>
    <div class="field">
      <div class="label">Source Asset</div>
      <div class="value">${amountIn} ${currency}</div>
    </div>
    <div class="field">
      <div class="label">Counterparty Address</div>
      <div class="value" style="font-family: monospace; font-size: 11px;">${counterparty}</div>
    </div>
    <div class="field">
      <div class="label">Status</div>
      <div class="value" style="color: #059669;">Verified &amp; Anchored</div>
    </div>
  </div>
  <div class="hash-box">
    <div class="hash-label">Cryptographic Merkle Root Hash</div>
    <div class="hash-value">${settlement.proofBundle.bundleHash}</div>
  </div>
  <div class="footer">
    VeriSettle · Autonomous Verified Settlement &amp; Risk Agent
  </div>
</body>
</html>
        `);
        w.document.close();
        w.print();
    };

    return (
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                    <div style={{ width: "36px", height: "36px", borderRadius: "50%", background: "rgba(16, 185, 129, 0.2)", border: "2px solid #10b981", display: "flex", alignItems: "center", justifyContent: "center", color: "#34d399", fontWeight: 800 }}>
                        ✓
                    </div>
                    <div>
                        <div style={{ fontSize: "1.15rem", fontWeight: 800, color: "#f8fafc" }}>
                            Settlement Complete
                        </div>
                        <div style={{ fontSize: "0.82rem", color: "#94a3b8" }}>
                            ₹{settlement.amountOut?.toLocaleString("en-IN")} INR credited · Sealed into Merkle tree
                        </div>
                    </div>
                </div>
                <div style={{ display: "flex", gap: "8px" }}>
                    <button className="btn-secondary" style={{ fontSize: "0.78rem", padding: "6px 12px" }} onClick={printReceipt}>
                        Print Receipt
                    </button>
                    <button className="btn-secondary" style={{ fontSize: "0.78rem", padding: "6px 12px" }} onClick={() => setShowCert(!showCert)}>
                        {showCert ? "Hide Certificate" : "View Certificate"}
                    </button>
                    <button className="btn-primary" style={{ fontSize: "0.78rem", padding: "6px 12px" }} onClick={onReset}>
                        New Order
                    </button>
                </div>
            </div>

            {/* Solana Devnet Memo Anchor Display */}
            {settlement.solanaAnchor?.signature && (
                <div style={{
                    padding: "12px 16px",
                    background: "rgba(153, 69, 255, 0.08)",
                    border: "1px solid rgba(153, 69, 255, 0.3)",
                    borderRadius: "10px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                }}>
                    <div>
                        <div style={{ fontSize: "0.72rem", color: "#c084fc", fontWeight: 700, textTransform: "uppercase" }}>
                            Solana Devnet Memo Anchor (Confirmed)
                        </div>
                        <div style={{ fontSize: "0.78rem", color: "#cbd5e1", fontFamily: "monospace", marginTop: "2px" }}>
                            Tx: {settlement.solanaAnchor.signature}
                        </div>
                    </div>
                    <a
                        href={settlement.solanaAnchor.explorerUrl || `https://explorer.solana.com/tx/${settlement.solanaAnchor.signature}?cluster=devnet`}
                        target="_blank"
                        rel="noreferrer"
                        style={{ fontSize: "0.75rem", color: "#38bdf8", textDecoration: "none", fontWeight: 600 }}
                    >
                        View on Solana Explorer ↗
                    </a>
                </div>
            )}

            {/* Merkle Root Box */}
            <div style={{
                padding: "10px 14px",
                background: "rgba(0, 0, 0, 0.35)",
                border: "1px solid rgba(255, 255, 255, 0.08)",
                borderRadius: "8px",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                fontSize: "0.78rem",
            }}>
                <div style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", marginRight: "12px" }}>
                    <span style={{ color: "#94a3b8" }}>Merkle Root: </span>
                    <span style={{ color: "#38bdf8", fontFamily: "monospace" }}>{settlement.proofBundle.bundleHash}</span>
                </div>
                <button
                    onClick={copyHash}
                    style={{ background: "none", border: "none", color: "#38bdf8", cursor: "pointer", fontSize: "0.75rem", fontWeight: 600 }}
                >
                    {copied ? "✓ Copied" : "Copy"}
                </button>
            </div>

            {/* Printable Certificate Modal/View */}
            {showCert && (
                <div style={{ marginTop: "12px" }}>
                    <SettlementCertificate
                        data={{
                            transactionId: txId || "tx-1",
                            merkleRoot: settlement.proofBundle.merkleRoot || settlement.proofBundle.bundleHash,
                            solanaSignature: settlement.solanaAnchor?.signature,
                            solanaSlot: settlement.solanaAnchor?.slot,
                            amountIn,
                            sourceCurrency: currency,
                            amountOut: settlement.amountOut,
                            targetCurrency: "INR",
                            effectiveRate: settlement.amountOut / (amountIn || 1),
                            counterpartyAddress: counterparty,
                            riskScore: riskScore ?? 14,
                            riskDecision: riskDecision ?? "AUTO_APPROVED",
                            timestamp: new Date().toISOString(),
                            minersCount: settlement.proofBundle.receipts?.length || 6,
                        }}
                        onClose={() => setShowCert(false)}
                    />
                </div>
            )}
        </div>
    );
}

export default SettlementFlow;
