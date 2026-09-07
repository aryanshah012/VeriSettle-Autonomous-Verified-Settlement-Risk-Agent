"use client";

import React from "react";
import { signIn, signOut, useSession } from "next-auth/react";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { VeriSettleLogo } from "./VeriSettleLogo";


export const Appbar = () => {
    const session = useSession();
    const isLoggedIn = !!session.data?.user;
    const pathname = usePathname();
    const searchParams = useSearchParams();
    const tabParam = searchParams?.get("tab") ?? null;
    const [isSimulation, setIsSimulation] = React.useState(false);

    React.useEffect(() => {
        const checkMode = async () => {
            try {
                const res = await fetch("/api/sentinel/mode");
                const data = await res.json();
                setIsSimulation(data?.mode === "hybrid" || data?.mode === "mock");
            } catch {
                // ignore
            }
        };
        checkMode();

        const handleModeChange = () => checkMode();
        window.addEventListener("telegraph-mode-changed", handleModeChange);
        return () => window.removeEventListener("telegraph-mode-changed", handleModeChange);
    }, []);

    return (
        <header style={{
            position: "sticky",
            top: 0,
            zIndex: 100,
            height: "64px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "0 28px",
            background: "rgba(5, 11, 24, 0.88)",
            backdropFilter: "blur(20px)",
            WebkitBackdropFilter: "blur(20px)",
            borderBottom: "1px solid rgba(255, 255, 255, 0.08)",
        }}>
            {/* Logo + Clean Nav */}
            <div style={{ display: "flex", alignItems: "center", gap: "36px" }}>
                <Link href="/" style={{ textDecoration: "none" }}>
                    <VeriSettleLogo size={32} />
                </Link>

                <nav style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                    <NavLink href="/settlement" active={pathname === "/settlement" && !tabParam}>
                        Settle
                    </NavLink>
                    <NavLink href="/settlement?tab=intelligence" active={pathname === "/settlement" && tabParam === "intelligence"}>
                        Intelligence
                    </NavLink>
                    <NavLink href="/settlement?tab=attack_lab" active={pathname === "/settlement" && tabParam === "attack_lab"}>
                        Attack Lab
                    </NavLink>
                    <NavLink href="/verify" active={pathname === "/verify"}>
                        Proofs
                    </NavLink>
                    {isLoggedIn && (
                        <NavLink href="/analytics" active={pathname === "/analytics"}>
                            Telemetry
                        </NavLink>
                    )}
                    {isLoggedIn && (
                        <NavLink href="/dashboard" active={pathname === "/dashboard"}>
                            Activity
                        </NavLink>
                    )}
                </nav>
            </div>

            {/* Right side telemetry & clean Demo environment badge */}
            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                {/* Solana Anchor Badge */}
                <div style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "6px",
                    padding: "4px 10px",
                    borderRadius: "999px",
                    background: "rgba(153, 69, 255, 0.08)",
                    border: "1px solid rgba(153, 69, 255, 0.25)",
                    fontSize: "0.7rem",
                    fontWeight: 600,
                    color: "#c084fc",
                }}>
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor">
                        <circle cx="12" cy="12" r="10" fill="none" stroke="currentColor" strokeWidth="3" />
                        <circle cx="12" cy="12" r="4" fill="currentColor" />
                    </svg>
                    <span>Solana Devnet</span>
                </div>

                {/* Telegraph Live vs Simulation badge */}
                {isSimulation ? (
                    <div style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "7px",
                        padding: "5px 12px",
                        borderRadius: "999px",
                        background: "rgba(245, 158, 11, 0.15)",
                        border: "1px solid rgba(245, 158, 11, 0.45)",
                        fontSize: "0.72rem",
                        fontWeight: 700,
                        letterSpacing: "0.04em",
                        textTransform: "uppercase",
                    }}>
                        <span style={{
                            width: "7px",
                            height: "7px",
                            borderRadius: "50%",
                            background: "#f59e0b",
                            boxShadow: "0 0 8px #f59e0b",
                        }} />
                        <span style={{ color: "#fbbf24" }}>
                            ⚠ Simulation
                        </span>
                    </div>
                ) : (
                    <div style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "7px",
                        padding: "5px 12px",
                        borderRadius: "999px",
                        background: "rgba(16, 185, 129, 0.12)",
                        border: "1px solid rgba(16, 185, 129, 0.35)",
                        fontSize: "0.72rem",
                        fontWeight: 700,
                        letterSpacing: "0.04em",
                        textTransform: "uppercase",
                    }}>
                        <span style={{
                            width: "7px",
                            height: "7px",
                            borderRadius: "50%",
                            background: "#10b981",
                            boxShadow: "0 0 10px #10b981",
                            animation: "pulse 1.8s infinite",
                        }} />
                        <span style={{ color: "#34d399" }}>
                            Telegraph Live
                        </span>
                    </div>
                )}

                {/* Frictionless Demo Account Environment */}
                {isLoggedIn ? (
                    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                        <div style={{
                            padding: "4px 10px",
                            borderRadius: "8px",
                            background: "rgba(30, 41, 59, 0.7)",
                            border: "1px solid rgba(51, 65, 85, 0.6)",
                            fontSize: "0.75rem",
                            color: "#38bdf8",
                            fontWeight: 600,
                        }}>
                            Demo Environment (Pre-funded)
                        </div>
                        <button
                            onClick={() => signOut({ callbackUrl: "/" })}
                            className="btn-secondary"
                            style={{ fontSize: "0.75rem", padding: "0.35rem 0.75rem" }}
                        >
                            Reset
                        </button>
                    </div>
                ) : (
                    <button
                        onClick={() => signIn("judge-demo", { callbackUrl: "/settlement" })}
                        style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "6px",
                            fontSize: "0.78rem",
                            padding: "0.45rem 0.95rem",
                            background: "linear-gradient(135deg, rgba(6, 182, 212, 0.25), rgba(59, 130, 246, 0.25))",
                            border: "1px solid rgba(6, 182, 212, 0.5)",
                            borderRadius: "8px",
                            color: "#38bdf8",
                            fontWeight: 700,
                            cursor: "pointer",
                            transition: "all 0.2s",
                        }}
                        onMouseEnter={e => {
                            e.currentTarget.style.background = "linear-gradient(135deg, rgba(6, 182, 212, 0.4), rgba(59, 130, 246, 0.4))";
                            e.currentTarget.style.borderColor = "rgba(6, 182, 212, 0.8)";
                        }}
                        onMouseLeave={e => {
                            e.currentTarget.style.background = "linear-gradient(135deg, rgba(6, 182, 212, 0.25), rgba(59, 130, 246, 0.25))";
                            e.currentTarget.style.borderColor = "rgba(6, 182, 212, 0.5)";
                        }}
                    >
                        <span style={{ fontSize: "0.9rem" }}>⚡</span>
                        <span>Enter Demo</span>
                        <span style={{ fontSize: "0.7rem", opacity: 0.7 }}>→</span>
                    </button>
                )}
            </div>
        </header>
    );
};

function NavLink({ href, active, children }: { href: string; active?: boolean; children: React.ReactNode }) {
    return (
        <Link
            href={href}
            style={{
                color: active ? "#38bdf8" : "#94a3b8",
                textDecoration: "none",
                fontSize: "0.86rem",
                fontWeight: active ? 700 : 500,
                padding: "6px 14px",
                borderRadius: "8px",
                background: active ? "rgba(6, 182, 212, 0.12)" : "transparent",
                border: active ? "1px solid rgba(6, 182, 212, 0.3)" : "1px solid transparent",
                transition: "all 0.15s ease",
            }}
        >
            {children}
        </Link>
    );
}

export default Appbar;