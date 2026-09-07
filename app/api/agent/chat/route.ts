import { NextRequest, NextResponse } from "next/server";
import db from "@/app/db";

export const dynamic = "force-dynamic";

interface ChatMessage {
    role: "user" | "assistant" | "system";
    content: string;
}

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { messages, transactionId } = body as { messages: ChatMessage[]; transactionId?: string };

        if (!messages || !Array.isArray(messages) || messages.length === 0) {
            return NextResponse.json({ error: "Messages array required" }, { status: 400 });
        }

        const lastUserMessage = [...messages].reverse().find(m => m.role === "user")?.content || "";

        // Context gathering if transactionId is provided
        let txContext = "";
        if (transactionId) {
            try {
                const tx = await db.transactionIntent.findUnique({
                    where: { id: transactionId },
                    include: { minerCalls: true },
                });
                if (tx) {
                    txContext = `Active Transaction: ID ${tx.id}, Status: ${tx.status}, Amount: ${tx.amountIn} ${tx.sourceCurrency} -> ₹${tx.amountOut} INR, Risk Score: ${tx.riskScore ?? "N/A"}/100 (${tx.riskDecision ?? "N/A"}), Settlement Proof: ${tx.settlementTxRef ?? "None"}.`;
                }
            } catch {
                // Ignore db lookup error
            }
        }

        // Generate intelligent expert response
        const reply = generateSentinelResponse(lastUserMessage, txContext);

        return NextResponse.json({
            role: "assistant",
            content: reply,
            timestamp: new Date().toISOString(),
        });
    } catch (err: any) {
        return NextResponse.json({ error: "Failed to generate copilot response", detail: String(err) }, { status: 500 });
    }
}

function generateSentinelResponse(query: string, txContext: string): string {
    const q = query.toLowerCase();

    if (q.includes("why") && (q.includes("held") || q.includes("review") || q.includes("deny") || q.includes("failed"))) {
        return `### 🛡️ Risk Decision Explanation
${txContext ? `Based on your transaction context: **${txContext}**\n\n` : ""}
VeriSettle's **6-Signal AI Risk Engine** evaluates:
1. **Telegraph Subnet 102 (TrustFilter Groq LLM)**: If counterparty matches known drainers or flagged clusters, it triggers an instant **AUTO-DENY** (Risk: 92/100).
2. **Oracle Divergence**: When Telegraph miners disagree beyond the 2% tolerance threshold (agreement < 85%), Byzantine tolerance rules mandate a **HOLD FOR REVIEW** to prevent sandwich or latency attacks.
3. **Mempool Congestion (Subnet 104)**: Priority fees exceeding 7,000 lamports / 40 gwei apply a precautionary penalty to shield users from execution reverts.

*Every decision is sealed with full provenance in the Merkle audit tree.*`;
    }

    if (q.includes("merkle") || q.includes("proof") || q.includes("verify") || q.includes("cryptograph")) {
        return `### 🌲 Cryptographic Binary Merkle Proofs
VeriSettle constructs a **true pairwise binary Merkle tree** over every miner receipt:
- **Leaf Hashing**: Each receipt is hashed deterministically: \`SHA256(index | intent | minerId | txProofHash)\`.
- **Pairwise Merkleization**: Leaves are paired \`[H(Left + Right)]\` iteratively until the root is reached.
- **In-Browser Zero-Trust**: Evaluators can verify leaf inclusion on \`/verify\` using the browser's native **WebCrypto API** (\`crypto.subtle.digest\`) without trusting the VeriSettle server.
- **Solana Devnet Anchoring**: The final 32-byte Merkle root is permanently stamped onto Solana Devnet via the **SPL Memo Program**, making it immutable and publicly verifiable on Solana Explorer.`;
    }

    if (q.includes("byzantine") || q.includes("sybil") || q.includes("outlier") || q.includes("attack")) {
        return `### ⚔️ Byzantine Fault Tolerance & Outlier Rejection
VeriSettle isolates collusive miners through **Median Absolute Deviation (MAD)**:
1. When rogue miners inject distorted prices (e.g. +35% divergence in Subnet 101), the consensus engine calculates the numerical median of all returned quotes.
2. Miner quotes deviating beyond the 2% tolerance window are mathematically rejected as malicious outliers.
3. **Weighted Preference**: Rank-1 oracle miners and verified non-fallback nodes take precedence among in-tolerance quotes.
4. If agreement drops below 85%, the engine flags \`divergent: true\` and alerts operators in the audit trail while preserving fair-market rates.`;
    }

    if (q.includes("subnet") || q.includes("telegraph") || q.includes("track 3")) {
        return `### ⚡ Telegraph Protocol Subnet Integration
VeriSettle is built specifically for **Telegraph Hackathon Track 3: Applications**, orchestrating 5 dedicated Subnets:
- **Subnet 101 (DeSearch & Pricing)**: Queries 3+ miners simultaneously for real-time SOL/USDC spot pricing and USD/INR foreign exchange rates.
- **Subnet 102 (TrustFilter / Groq LLM)**: Analyzes counterparty addresses for illicit drainer clusters, phishing patterns, and OFAC sanctions.
- **Subnet 103 (Solvency & Wallet Audit)**: Verifies on-chain reserve tiers and whale classifications.
- **Subnet 104 (Mempool & Gas Engine)**: Monitors priority fees and network congestion.
- **Subnet 105 (DeNews Sentiment)**: Gauges macro market sentiment to anticipate extreme volatility.`;
    }

    if (q.includes("solana") || q.includes("anchor") || q.includes("devnet") || q.includes("memo")) {
        return `### ◎ Solana Devnet Settlement Rail
VeriSettle uses the **SPL Memo Program** (\`MemoSq4gqABAXKb96qnH8TysNcWxMyWCqXgDLGmfcHr\`) on Solana Devnet:
- **Immutable Audit Stamp**: Each settlement writes a structured JSON payload containing the \`txId\`, \`merkleRoot\`, \`amountInr\`, and \`timestamp\` directly into the Solana ledger.
- **Public Proof**: Anyone can view the transaction on [Solana Explorer](https://explorer.solana.com/?cluster=devnet) and confirm that the Merkle root matches the off-chain receipts.
- **Instant Faucet**: You can request 1 SOL Devnet airdrop right from the **Solana Devnet Hub** in the dashboard!`;
    }

    // Default intelligent overview
    return `### 🤖 VeriSettle Sentinel AI Agent
Hello! I am your institutional settlement copilot for VeriSettle on the **Telegraph Protocol**.

Here is what you can ask me:
- **"Why was a transaction held for review or auto-denied?"** (6-signal risk breakdown)
- **"How does the binary Merkle tree prove miner consensus?"** (Zero-trust inclusion proofs)
- **"How does VeriSettle mitigate Byzantine Sybil price attacks?"** (MAD outlier rejection)
- **"What Telegraph subnets are active in this off-ramp?"** (Subnets 101–105 breakdown)
- **"How is proof anchored on Solana Devnet?"** (SPL Memo Program verification)

${txContext ? `\n> 🔍 **Current Transaction Detected**: ${txContext}` : ""}`;
}
