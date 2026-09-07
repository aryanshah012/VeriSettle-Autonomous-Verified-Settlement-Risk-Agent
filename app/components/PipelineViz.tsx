"use client";

export type PipelineStage = "idle" | "active" | "complete" | "error";

interface Stage {
    id: string;
    label: string;
    icon: string;
    sublabel?: string;
}

interface PipelineVizProps {
    stages: Stage[];
    currentStageIndex: number;
    stageStates: PipelineStage[];
}

export function PipelineViz({ stages, currentStageIndex, stageStates }: PipelineVizProps) {
    return (
        <div style={{
            display: "flex",
            alignItems: "flex-start",
            justifyContent: "space-between",
            padding: "24px",
            overflow: "hidden",
        }}>
            {stages.map((stage, i) => {
                const state = stageStates[i] ?? "idle";
                const isLast = i === stages.length - 1;

                const nodeColors: Record<PipelineStage, { border: string; bg: string; text: string; shadow: string }> = {
                    idle:     { border: "var(--border-card)",    bg: "var(--bg-card)",              text: "var(--text-muted)",   shadow: "none" },
                    active:   { border: "var(--accent-cyan)",    bg: "rgba(0,229,255,0.1)",         text: "var(--accent-cyan)",  shadow: "0 0 16px rgba(0,229,255,0.3)" },
                    complete: { border: "var(--accent-green)",   bg: "rgba(0,255,136,0.1)",         text: "var(--accent-green)", shadow: "0 0 12px rgba(0,255,136,0.2)" },
                    error:    { border: "var(--accent-red)",     bg: "rgba(239,68,68,0.1)",         text: "var(--accent-red)",   shadow: "0 0 12px rgba(239,68,68,0.2)" },
                };
                const colors = nodeColors[state];

                return (
                    <div key={stage.id} style={{ display: "flex", alignItems: "center", flex: isLast ? "0 0 auto" : 1 }}>
                        {/* Stage node */}
                        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "8px", minWidth: "80px" }}>
                            <div style={{
                                width: "52px",
                                height: "52px",
                                borderRadius: "50%",
                                border: `2px solid ${colors.border}`,
                                background: colors.bg,
                                boxShadow: colors.shadow,
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                fontSize: "1.25rem",
                                transition: "all 0.4s ease",
                                animation: state === "active" ? "pulse-glow 1.5s infinite" : state === "complete" ? "pulse-green 2.5s infinite" : "none",
                                position: "relative",
                            }}>
                                {state === "complete" ? "✓" : stage.icon}
                                {state === "active" && (
                                    <div style={{
                                        position: "absolute",
                                        inset: "-4px",
                                        borderRadius: "50%",
                                        border: "2px solid var(--accent-cyan)",
                                        opacity: 0.3,
                                        animation: "rotate 2s linear infinite",
                                    }} />
                                )}
                            </div>
                            <div style={{ textAlign: "center" }}>
                                <div style={{ fontSize: "0.72rem", fontWeight: 600, color: colors.text, whiteSpace: "nowrap" }}>
                                    {stage.label}
                                </div>
                                {stage.sublabel && (
                                    <div style={{ fontSize: "0.65rem", color: "var(--text-muted)", whiteSpace: "nowrap" }}>
                                        {stage.sublabel}
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Connector line */}
                        {!isLast && (
                            <div style={{
                                flex: 1,
                                height: "2px",
                                background: stageStates[i + 1] !== "idle" ? "var(--accent-cyan)" : "var(--border-card)",
                                margin: "0 4px",
                                marginTop: "-26px",
                                position: "relative",
                                overflow: "hidden",
                                transition: "background 0.4s",
                            }}>
                                {state === "complete" && stageStates[i + 1] === "active" && (
                                    <div style={{
                                        position: "absolute",
                                        inset: 0,
                                        background: "linear-gradient(90deg, transparent, white, transparent)",
                                        animation: "scan-line-h 1.2s ease-in-out infinite",
                                    }} />
                                )}
                            </div>
                        )}
                    </div>
                );
            })}
        </div>
    );
}
