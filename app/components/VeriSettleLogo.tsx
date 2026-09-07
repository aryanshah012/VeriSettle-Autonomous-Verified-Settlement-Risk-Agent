"use client";

import React from "react";

interface VeriSettleLogoProps {
    size?: number;
    showWordmark?: boolean;
    className?: string;
}

export const VeriSettleLogo: React.FC<VeriSettleLogoProps> = ({
    size = 36,
    showWordmark = true,
    className = "",
}) => {
    return (
        <div
            className={className}
            style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "10px",
                userSelect: "none",
            }}
        >
            {/* Minimalist Cryptographic Shield with Telegraph Verification Pulse */}
            <svg
                width={size}
                height={size}
                viewBox="0 0 48 48"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                style={{
                    filter: "drop-shadow(0 0 14px rgba(6, 182, 212, 0.4))",
                    flexShrink: 0,
                    transition: "transform 0.25s ease",
                }}
            >
                <defs>
                    <linearGradient id="vs-grad-primary" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#22d3ee" />
                        <stop offset="60%" stopColor="#06b6d4" />
                        <stop offset="100%" stopColor="#3b82f6" />
                    </linearGradient>
                    <linearGradient id="vs-grad-shield" x1="0%" y1="0%" x2="0%" y2="100%">
                        <stop offset="0%" stopColor="#0d1b33" />
                        <stop offset="100%" stopColor="#050b18" />
                    </linearGradient>
                    <linearGradient id="vs-grad-stroke" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="rgba(34, 211, 238, 0.9)" />
                        <stop offset="100%" stopColor="rgba(16, 185, 129, 0.9)" />
                    </linearGradient>
                </defs>

                {/* Hexagonal Shield */}
                <path
                    d="M24 4L42 12V26C42 35.5 34.3 43.5 24 46C13.7 43.5 6 35.5 6 26V12L24 4Z"
                    fill="url(#vs-grad-shield)"
                    stroke="url(#vs-grad-stroke)"
                    strokeWidth="2.2"
                    strokeLinejoin="round"
                />

                {/* Stylized 'V' for VeriSettle intersecting checkmark */}
                <path
                    d="M16 17L23.5 32L34 16"
                    stroke="url(#vs-grad-primary)"
                    strokeWidth="3.4"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                />

                {/* Telegraph Intelligence Verification Beacon */}
                <circle cx="24" cy="9" r="2" fill="#10b981" />
                <circle cx="24" cy="9" r="4" stroke="#10b981" strokeWidth="0.8" opacity="0.6" />
            </svg>

            {/* Wordmark */}
            {showWordmark && (
                <div style={{ display: "flex", flexDirection: "column", lineHeight: 1 }}>
                    <div
                        style={{
                            fontWeight: 800,
                            fontSize: `${size * 0.54}px`,
                            letterSpacing: "-0.03em",
                            display: "flex",
                            alignItems: "center",
                            color: "#f8fafc",
                        }}
                    >
                        <span>Veri</span>
                        <span
                            style={{
                                background: "linear-gradient(135deg, #22d3ee 0%, #06b6d4 40%, #3b82f6 100%)",
                                WebkitBackgroundClip: "text",
                                WebkitTextFillColor: "transparent",
                                marginLeft: "1px",
                            }}
                        >
                            Settle
                        </span>
                    </div>
                    <span
                        style={{
                            fontSize: `${Math.max(8.5, size * 0.2)}px`,
                            color: "#94a3b8",
                            fontWeight: 600,
                            letterSpacing: "0.08em",
                            textTransform: "uppercase",
                            marginTop: "2px",
                        }}
                    >
                        Verified Intelligence
                    </span>
                </div>
            )}
        </div>
    );
};

export default VeriSettleLogo;
