"use client";

import React, { useState, useRef, useEffect } from "react";
import axios from "axios";

interface Message {
    role: "user" | "assistant";
    content: string;
}

const DEFAULT_QUESTIONS = [
    "Why was my settlement held or denied?",
    "How does the binary Merkle tree prove miner consensus?",
    "Explain how Telegraph Subnet 102 stops drainers",
    "How does VeriSettle mitigate Byzantine Sybil price attacks?",
];

export function SentinelCopilot({ activeTxId }: { activeTxId?: string }) {
    const [open, setOpen] = useState(false);
    const [messages, setMessages] = useState<Message[]>([
        {
            role: "assistant",
            content: "👋 **Hello! I am VeriSettle Sentinel.**\n\nI can explain Telegraph Subnet consensus, risk engine ratings, binary Merkle proofs, and on-chain Solana Devnet settlement mechanics in plain English. Click a question below or ask me anything!",
        },
    ]);
    const [input, setInput] = useState("");
    const [loading, setLoading] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (open) {
            messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
        }
    }, [messages, open]);

    const sendMessage = async (textToSend?: string) => {
        const query = textToSend || input;
        if (!query.trim() || loading) return;

        const newMessages: Message[] = [...messages, { role: "user", content: query }];
        setMessages(newMessages);
        if (!textToSend) setInput("");
        setLoading(true);

        try {
            const res = await axios.post("/api/agent/chat", {
                messages: newMessages,
                transactionId: activeTxId,
            });

            if (res.data?.content) {
                setMessages([...newMessages, { role: "assistant", content: res.data.content }]);
            }
        } catch {
            setMessages([
                ...newMessages,
                {
                    role: "assistant",
                    content: "⚠️ *Unable to connect to Sentinel network. Please verify dev server status.*",
                },
            ]);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{ position: "fixed", bottom: "24px", right: "24px", zIndex: 9998 }}>
            {/* Floating Trigger Button */}
            {!open && (
                <button
                    type="button"
                    onClick={() => setOpen(true)}
                    style={{
                        background: "linear-gradient(135deg, #06b6d4 0%, #3b82f6 50%, #8b5cf6 100%)",
                        border: "1px solid rgba(255, 255, 255, 0.2)",
                        borderRadius: "50px",
                        padding: "12px 20px",
                        color: "#fff",
                        fontWeight: 800,
                        fontSize: "0.88rem",
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        gap: "10px",
                        boxShadow: "0 8px 28px rgba(6, 182, 212, 0.4)",
                        transition: "all 0.2s ease",
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.transform = "scale(1.05)")}
                    onMouseLeave={(e) => (e.currentTarget.style.transform = "scale(1.0)")}
                >
                    <span style={{ fontSize: "1.1rem" }}>🤖</span>
                    <span>VeriSettle Copilot</span>
                    <span style={{
                        width: "8px",
                        height: "8px",
                        borderRadius: "50%",
                        background: "#10b981",
                        boxShadow: "0 0 8px #10b981",
                    }} />
                </button>
            )}

            {/* Chat Box Modal */}
            {open && (
                <div style={{
                    width: "380px",
                    height: "540px",
                    background: "rgba(10, 15, 30, 0.95)",
                    backdropFilter: "blur(20px)",
                    border: "1px solid rgba(71, 85, 105, 0.6)",
                    borderRadius: "20px",
                    display: "flex",
                    flexDirection: "column",
                    boxShadow: "0 20px 50px rgba(0, 0, 0, 0.7)",
                    overflow: "hidden",
                }}>
                    {/* Header */}
                    <div style={{
                        padding: "14px 18px",
                        background: "rgba(15, 23, 42, 0.9)",
                        borderBottom: "1px solid rgba(51, 65, 85, 0.5)",
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                    }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                            <div style={{
                                width: "30px",
                                height: "30px",
                                borderRadius: "50%",
                                background: "linear-gradient(135deg, #06b6d4, #8b5cf6)",
                                display: "flex",
                                alignItems: "center",
                                justifyItems: "center",
                                justifyContent: "center",
                                fontSize: "14px",
                            }}>
                                🤖
                            </div>
                            <div>
                                <div style={{ fontSize: "0.85rem", fontWeight: 700, color: "#f8fafc" }}>
                                    VeriSettle Sentinel
                                </div>
                                <div style={{ fontSize: "0.7rem", color: "#34d399", display: "flex", alignItems: "center", gap: "4px" }}>
                                    <span>●</span> Subnet 102 LLM Connected
                                </div>
                            </div>
                        </div>
                        <button
                            type="button"
                            onClick={() => setOpen(false)}
                            style={{ background: "none", border: "none", color: "#94a3b8", cursor: "pointer", fontSize: "18px" }}
                        >
                            ✕
                        </button>
                    </div>

                    {/* Messages Container */}
                    <div style={{
                        flex: 1,
                        overflowY: "auto",
                        padding: "16px",
                        display: "flex",
                        flexDirection: "column",
                        gap: "12px",
                        fontSize: "0.8rem",
                        lineHeight: 1.5,
                    }}>
                        {messages.map((m, idx) => (
                            <div
                                key={idx}
                                style={{
                                    alignSelf: m.role === "user" ? "flex-end" : "flex-start",
                                    maxWidth: "88%",
                                    background: m.role === "user" ? "#0284c7" : "rgba(30, 41, 59, 0.8)",
                                    border: m.role === "user" ? "none" : "1px solid rgba(71, 85, 105, 0.4)",
                                    color: "#f8fafc",
                                    borderRadius: m.role === "user" ? "14px 14px 2px 14px" : "14px 14px 14px 2px",
                                    padding: "10px 14px",
                                    wordBreak: "break-word",
                                    whiteSpace: "pre-wrap",
                                }}
                            >
                                {m.content}
                            </div>
                        ))}
                        {loading && (
                            <div style={{
                                alignSelf: "flex-start",
                                background: "rgba(30, 41, 59, 0.8)",
                                border: "1px solid rgba(71, 85, 105, 0.4)",
                                color: "#38bdf8",
                                borderRadius: "14px",
                                padding: "8px 14px",
                                fontSize: "0.75rem",
                            }}>
                                ⏳ Sentinel reasoning over Subnet proofs…
                            </div>
                        )}
                        <div ref={messagesEndRef} />
                    </div>

                    {/* Quick Questions Chips */}
                    <div style={{
                        padding: "8px 12px",
                        borderTop: "1px solid rgba(51, 65, 85, 0.3)",
                        display: "flex",
                        gap: "6px",
                        overflowX: "auto",
                        whiteSpace: "nowrap",
                        background: "rgba(15, 23, 42, 0.5)",
                    }}>
                        {DEFAULT_QUESTIONS.map((q, i) => (
                            <button
                                key={i}
                                type="button"
                                onClick={() => sendMessage(q)}
                                style={{
                                    background: "rgba(51, 65, 85, 0.4)",
                                    border: "1px solid rgba(71, 85, 105, 0.5)",
                                    borderRadius: "8px",
                                    padding: "4px 8px",
                                    fontSize: "0.7rem",
                                    color: "#38bdf8",
                                    cursor: "pointer",
                                    flexShrink: 0,
                                }}
                            >
                                {q}
                            </button>
                        ))}
                    </div>

                    {/* Input Bar */}
                    <form
                        onSubmit={(e) => {
                            e.preventDefault();
                            sendMessage();
                        }}
                        style={{
                            padding: "12px",
                            background: "rgba(15, 23, 42, 0.9)",
                            borderTop: "1px solid rgba(51, 65, 85, 0.5)",
                            display: "flex",
                            gap: "8px",
                        }}
                    >
                        <input
                            type="text"
                            placeholder="Ask Sentinel about consensus, risk, or Solana…"
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            style={{
                                flex: 1,
                                background: "rgba(30, 41, 59, 0.8)",
                                border: "1px solid rgba(71, 85, 105, 0.5)",
                                borderRadius: "10px",
                                padding: "8px 12px",
                                color: "#fff",
                                fontSize: "0.8rem",
                                outline: "none",
                            }}
                        />
                        <button
                            type="submit"
                            disabled={loading || !input.trim()}
                            style={{
                                background: "#06b6d4",
                                border: "none",
                                borderRadius: "10px",
                                padding: "8px 14px",
                                color: "#0f172a",
                                fontWeight: 800,
                                cursor: loading || !input.trim() ? "not-allowed" : "pointer",
                            }}
                        >
                            ↑
                        </button>
                    </form>
                </div>
            )}
        </div>
    );
}
