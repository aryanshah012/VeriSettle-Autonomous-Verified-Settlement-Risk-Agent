"use client";

import { useEffect, useRef } from "react";

export interface LogEntry {
    id: string;
    ts: number;
    type: "info" | "ok" | "warn" | "err" | "dim";
    text: string;
    mono?: boolean;
}

interface MinerCallLogProps {
    entries: LogEntry[];
    title?: string;
}

const TYPE_STYLE: Record<LogEntry["type"], { color: string; prefix: string }> = {
    ok:   { color: "var(--accent-green)", prefix: "✓" },
    info: { color: "var(--accent-cyan)",  prefix: "›" },
    warn: { color: "var(--accent-amber)", prefix: "!" },
    err:  { color: "var(--accent-red)",   prefix: "✗" },
    dim:  { color: "var(--text-muted)",   prefix: "·" },
};

export function MinerCallLog({ entries = [], title = "Miner Activity Log" }: MinerCallLogProps) {
    const bodyRef = useRef<HTMLDivElement>(null);
    const safeEntries = Array.isArray(entries) ? entries.filter(Boolean) : [];

    // Auto-scroll to bottom as new entries arrive
    useEffect(() => {
        if (bodyRef.current) {
            bodyRef.current.scrollTop = bodyRef.current.scrollHeight;
        }
    }, [safeEntries.length]);

    return (
        <div className="terminal">
            <div className="terminal-header">
                <div className="terminal-dot" style={{ background: "#ff5f57" }} />
                <div className="terminal-dot" style={{ background: "#ffbd2e" }} />
                <div className="terminal-dot" style={{ background: "#28c840" }} />
                <span style={{ color: "var(--text-muted)", fontSize: "0.72rem", marginLeft: "8px", fontFamily: "'JetBrains Mono', monospace" }}>
                    {title}
                </span>
            </div>
            <div ref={bodyRef} className="terminal-body">
                {safeEntries.length === 0 && (
                    <div className="log-line">
                        <span className="log-dim">Waiting for miner activity</span>
                        <span className="animate-blink" style={{ color: "var(--accent-cyan)" }}>█</span>
                    </div>
                )}
                {safeEntries.map((entry, idx) => {
                    const style = (entry.type && TYPE_STYLE[entry.type]) || { color: "var(--text-muted, #94a3b8)", prefix: "·" };
                    const color = style.color;
                    const prefix = style.prefix;
                    let time = "00:00:00";
                    try {
                        time = new Date(entry.ts || Date.now()).toISOString().slice(11, 19);
                    } catch {
                        time = "00:00:00";
                    }
                    const text = typeof entry.text === "string"
                        ? entry.text
                        : (typeof entry.text === "object" ? JSON.stringify(entry.text) : String(entry.text ?? ""));

                    return (
                        <div key={entry.id || `log-entry-${idx}`} className="log-line animate-slide-right">
                            <span className="log-time">{time}</span>
                            <span style={{ color, minWidth: "14px" }}>{prefix}</span>
                            <span
                                style={{
                                    color: entry.type === "dim" ? "var(--text-muted)" : "var(--text-primary)",
                                    fontFamily: entry.mono ? "'JetBrains Mono', monospace" : undefined,
                                    wordBreak: "break-all",
                                }}
                            >
                                {text}
                            </span>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
