"use client";

import { useEffect, useRef } from "react";

interface RiskGaugeProps {
    score: number; // 0-100
    decision: "auto_approve" | "hold_for_review" | "auto_deny" | null;
    signals?: { name: string; weight: number; score: number; reason: string }[];
    size?: number;
}

const COLORS = {
    auto_approve:    "#00ff88",
    hold_for_review: "#f59e0b",
    auto_deny:       "#ef4444",
};

const LABELS = {
    auto_approve:    "AUTO APPROVED",
    hold_for_review: "HELD FOR REVIEW",
    auto_deny:       "AUTO DENIED",
};

export function RiskGauge({ score, decision, signals = [], size = 180 }: RiskGaugeProps) {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const animRef = useRef<number>();
    const currentScore = useRef(0);

    const color = decision ? COLORS[decision] : score < 30 ? COLORS.auto_approve : score < 70 ? COLORS.hold_for_review : COLORS.auto_deny;

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        const dpr = window.devicePixelRatio || 1;
        canvas.width = size * dpr;
        canvas.height = size * dpr;
        canvas.style.width = `${size}px`;
        canvas.style.height = `${size}px`;
        ctx.scale(dpr, dpr);

        const cx = size / 2;
        const cy = size / 2;
        const r = size / 2 - 14;
        const startAngle = Math.PI * 0.75;
        const totalAngle = Math.PI * 1.5;

        const draw = (s: number) => {
            ctx.clearRect(0, 0, size, size);

            // Track (background arc)
            ctx.beginPath();
            ctx.arc(cx, cy, r, startAngle, startAngle + totalAngle);
            ctx.strokeStyle = "rgba(255,255,255,0.06)";
            ctx.lineWidth = 10;
            ctx.lineCap = "round";
            ctx.stroke();

            // Filled arc
            const filled = (s / 100) * totalAngle;
            if (filled > 0) {
                ctx.beginPath();
                ctx.arc(cx, cy, r, startAngle, startAngle + filled);
                ctx.strokeStyle = color;
                ctx.lineWidth = 10;
                ctx.lineCap = "round";
                ctx.shadowColor = color;
                ctx.shadowBlur = 12;
                ctx.stroke();
                ctx.shadowBlur = 0;
            }

            // Zone ticks
            [25, 70].forEach(zone => {
                const angle = startAngle + (zone / 100) * totalAngle;
                const x1 = cx + (r - 10) * Math.cos(angle);
                const y1 = cy + (r - 10) * Math.sin(angle);
                const x2 = cx + (r + 4) * Math.cos(angle);
                const y2 = cy + (r + 4) * Math.sin(angle);
                ctx.beginPath();
                ctx.moveTo(x1, y1);
                ctx.lineTo(x2, y2);
                ctx.strokeStyle = "rgba(255,255,255,0.2)";
                ctx.lineWidth = 1.5;
                ctx.stroke();
            });

            // Center score text
            ctx.font = `bold ${Math.round(size * 0.22)}px 'Inter', sans-serif`;
            ctx.textAlign = "center";
            ctx.textBaseline = "middle";
            ctx.fillStyle = color;
            ctx.fillText(Math.round(s).toString(), cx, cy - 6);

            ctx.font = `500 ${Math.round(size * 0.08)}px 'Inter', sans-serif`;
            ctx.fillStyle = "rgba(255,255,255,0.4)";
            ctx.fillText("RISK SCORE", cx, cy + size * 0.13);
        };

        // Animate from current to target
        const animate = () => {
            const target = score;
            const diff = target - currentScore.current;
            if (Math.abs(diff) < 0.3) {
                currentScore.current = target;
                draw(target);
                return;
            }
            currentScore.current += diff * 0.08;
            draw(currentScore.current);
            animRef.current = requestAnimationFrame(animate);
        };

        if (animRef.current) cancelAnimationFrame(animRef.current);
        animRef.current = requestAnimationFrame(animate);
        return () => { if (animRef.current) cancelAnimationFrame(animRef.current); };
    }, [score, color, size]);

    return (
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "12px" }}>
            <canvas ref={canvasRef} style={{ display: "block" }} />
            {decision && (
                <div className={`badge badge-${decision === "auto_approve" ? "success" : decision === "auto_deny" ? "danger" : "warn"}`}
                    style={{ fontSize: "0.72rem" }}>
                    {LABELS[decision]}
                </div>
            )}
            {signals.length > 0 && (
                <div style={{ width: "100%", display: "flex", flexDirection: "column", gap: "6px" }}>
                    {signals.map(sig => (
                        <div key={sig.name} style={{ display: "flex", flexDirection: "column", gap: "3px" }}>
                            <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.72rem" }}>
                                <span style={{ color: "var(--text-secondary)", textTransform: "capitalize" }}>
                                    {sig.name.replace(/_/g, " ")}
                                </span>
                                <span style={{ color: sig.score > 60 ? "var(--accent-red)" : sig.score > 30 ? "var(--accent-amber)" : "var(--accent-green)", fontWeight: 600 }}>
                                    {sig.score}/100
                                </span>
                            </div>
                            <div className="progress-bar-track">
                                <div className="progress-bar-fill" style={{
                                    width: `${sig.score}%`,
                                    background: sig.score > 60 ? "var(--accent-red)" : sig.score > 30 ? "var(--accent-amber)" : "var(--accent-green)",
                                }} />
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
