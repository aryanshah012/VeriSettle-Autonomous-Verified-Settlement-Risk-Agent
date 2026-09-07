"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { SettlementFlow } from "../components/SettlementFlow";
import { TransactionHistory } from "../components/TransactionHistory";
import { SubnetMeshViz } from "../components/SubnetMeshViz";
import { SentinelNetworkStatus } from "../components/SentinelNetworkStatus";
import { TelegraphDecisionTrace } from "../components/TelegraphDecisionTrace";
import { AttackLab } from "../components/AttackLab";
import { QualityFlywheelViz } from "../components/QualityFlywheelViz";

export default function SettlementPage() {
    const searchParams = useSearchParams();
    const tabParam = searchParams.get("tab");

    const [activeTab, setActiveTab] = useState<"settle" | "intelligence" | "attack_lab" | "proofs">("settle");
    const [intelSubTab, setIntelSubTab] = useState<"trace" | "flywheel" | "mesh">("trace");

    useEffect(() => {
        if (tabParam === "intelligence") setActiveTab("intelligence");
        else if (tabParam === "attack_lab") setActiveTab("attack_lab");
        else if (tabParam === "proofs") setActiveTab("proofs");
        else if (tabParam === "settle") setActiveTab("settle");
    }, [tabParam]);

    const tabs = [
        {
            id: "settle",
            label: "Settle",
            icon: (
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12"></polyline>
                </svg>
            )
        },
        {
            id: "intelligence",
            label: "Intelligence",
            icon: (
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M22 12h-4l-3 9L9 3l-3 9H2"></path>
                </svg>
            )
        },
        {
            id: "attack_lab",
            label: "Attack Lab",
            icon: (
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
                </svg>
            )
        },
        {
            id: "proofs",
            label: "Proofs",
            icon: (
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                    <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
                </svg>
            )
        },
    ];

    return (
        <div style={{
            minHeight: "100vh",
            background: "radial-gradient(ellipse at 50% 0%, #0d1e3d 0%, #050b18 75%)",
            padding: "24px 20px 80px",
        }}>
            <div style={{ maxWidth: "1200px", margin: "0 auto" }}>
                {/* Sentinel Autonomous Intelligence & Circuit Breaker Status Bar */}
                <SentinelNetworkStatus />

                {/* Primary 4-Section Navigation */}
                <div style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    marginBottom: "28px",
                }}>
                    <div style={{
                        display: "inline-flex",
                        padding: "5px",
                        background: "rgba(15, 23, 42, 0.85)",
                        backdropFilter: "blur(14px)",
                        border: "1px solid rgba(51, 65, 85, 0.6)",
                        borderRadius: "14px",
                        gap: "6px",
                    }}>
                        {tabs.map((tab) => (
                            <button
                                key={tab.id}
                                type="button"
                                onClick={() => setActiveTab(tab.id as any)}
                                style={{
                                    padding: "8px 20px",
                                    borderRadius: "10px",
                                    fontSize: "13.5px",
                                    fontWeight: 700,
                                    cursor: "pointer",
                                    transition: "all 0.2s ease",
                                    background: activeTab === tab.id
                                        ? "linear-gradient(135deg, rgba(6, 182, 212, 0.25), rgba(59, 130, 246, 0.25))"
                                        : "transparent",
                                    color: activeTab === tab.id ? "#38bdf8" : "#94a3b8",
                                    border: activeTab === tab.id
                                        ? "1px solid rgba(6, 182, 212, 0.45)"
                                        : "1px solid transparent",
                                    display: "flex",
                                    alignItems: "center",
                                    gap: "8px",
                                }}
                            >
                                {tab.icon}
                                <span>{tab.label}</span>
                            </button>
                        ))}
                    </div>
                </div>

                {/* Tab 1: Live Settle Flow */}
                {activeTab === "settle" && <SettlementFlow />}

                {/* Tab 2: Intelligence Suite */}
                {activeTab === "intelligence" && (
                    <div>
                        {/* Sub-navigation for Intelligence */}
                        <div style={{
                            display: "flex",
                            justifyContent: "center",
                            gap: "8px",
                            marginBottom: "24px",
                        }}>
                            <button
                                onClick={() => setIntelSubTab("trace")}
                                style={{
                                    padding: "6px 16px",
                                    borderRadius: "8px",
                                    fontSize: "0.82rem",
                                    fontWeight: 600,
                                    background: intelSubTab === "trace" ? "rgba(6, 182, 212, 0.2)" : "rgba(30, 41, 59, 0.5)",
                                    border: `1px solid ${intelSubTab === "trace" ? "rgba(6, 182, 212, 0.4)" : "rgba(51, 65, 85, 0.5)"}`,
                                    color: intelSubTab === "trace" ? "#38bdf8" : "#94a3b8",
                                    cursor: "pointer",
                                }}
                            >
                                Decision Trace
                            </button>
                            <button
                                onClick={() => setIntelSubTab("flywheel")}
                                style={{
                                    padding: "6px 16px",
                                    borderRadius: "8px",
                                    fontSize: "0.82rem",
                                    fontWeight: 600,
                                    background: intelSubTab === "flywheel" ? "rgba(6, 182, 212, 0.2)" : "rgba(30, 41, 59, 0.5)",
                                    border: `1px solid ${intelSubTab === "flywheel" ? "rgba(6, 182, 212, 0.4)" : "rgba(51, 65, 85, 0.5)"}`,
                                    color: intelSubTab === "flywheel" ? "#38bdf8" : "#94a3b8",
                                    cursor: "pointer",
                                }}
                            >
                                Miner Quality
                            </button>
                            <button
                                onClick={() => setIntelSubTab("mesh")}
                                style={{
                                    padding: "6px 16px",
                                    borderRadius: "8px",
                                    fontSize: "0.82rem",
                                    fontWeight: 600,
                                    background: intelSubTab === "mesh" ? "rgba(6, 182, 212, 0.2)" : "rgba(30, 41, 59, 0.5)",
                                    border: `1px solid ${intelSubTab === "mesh" ? "rgba(6, 182, 212, 0.4)" : "rgba(51, 65, 85, 0.5)"}`,
                                    color: intelSubTab === "mesh" ? "#38bdf8" : "#94a3b8",
                                    cursor: "pointer",
                                }}
                            >
                                Network Mesh
                            </button>
                        </div>

                        {intelSubTab === "trace" && (
                            <div style={{ maxWidth: "1000px", margin: "0 auto" }}>
                                <TelegraphDecisionTrace
                                    overallConfidence={0.964}
                                    decision="auto_approve"
                                    policy="balanced"
                                />
                            </div>
                        )}
                        {intelSubTab === "flywheel" && <QualityFlywheelViz />}
                        {intelSubTab === "mesh" && <SubnetMeshViz />}
                    </div>
                )}

                {/* Tab 3: Attack Lab */}
                {activeTab === "attack_lab" && <AttackLab />}

                {/* Tab 4: Proofs */}
                {activeTab === "proofs" && <TransactionHistory />}
            </div>
        </div>
    );
}
