import { TokenWithbalance } from "../api/hooks/useTokens";

export function TokenList({ tokens }: { tokens: TokenWithbalance[] }) {
    if (!tokens || tokens.length === 0) {
        return (
            <div style={{ padding: "20px", textAlign: "center", color: "#94a3b8", fontSize: "13px" }}>
                No token balances found.
            </div>
        );
    }

    return (
        <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            {tokens.map(token => (
                <div
                    key={token.name}
                    style={{
                        padding: "14px 18px",
                        background: "rgba(30,41,59,0.5)",
                        border: "1px solid rgba(51,65,85,0.5)",
                        borderRadius: "14px",
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        transition: "all 0.15s ease",
                    }}
                >
                    <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                        <div style={{
                            width: "40px",
                            height: "40px",
                            borderRadius: "50%",
                            background: "rgba(6,182,212,0.15)",
                            border: "1px solid rgba(6,182,212,0.3)",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            fontSize: "18px",
                            fontWeight: 700,
                            color: "#38bdf8",
                            overflow: "hidden",
                        }}>
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                                src={token.image}
                                alt={token.name}
                                style={{ width: "100%", height: "100%", objectFit: "cover" }}
                                onError={(e) => {
                                    (e.target as HTMLElement).style.display = "none";
                                }}
                            />
                        </div>
                        <div>
                            <div style={{ fontWeight: 700, fontSize: "14px", color: "#f1f5f9" }}>
                                {token.name}
                            </div>
                            <div style={{ fontSize: "12px", color: "#94a3b8" }}>
                                1 {token.name} = ~${token.price} USD
                            </div>
                        </div>
                    </div>
                    <div style={{ textAlign: "right" }}>
                        <div style={{ fontWeight: 700, fontSize: "15px", color: "#34d399" }}>
                            ${token.usdBalance} USD
                        </div>
                        <div style={{ fontSize: "12px", color: "#94a3b8" }}>
                            {token.balance} {token.name}
                        </div>
                    </div>
                </div>
            ))}
        </div>
    );
}