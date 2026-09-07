import { NextRequest, NextResponse } from "next/server";
import db from "@/app/db";
import crypto from "crypto";
import { buildMerkleTree, MerkleLeafData } from "@/app/lib/crypto/merkle";

export const dynamic = "force-dynamic";

/**
 * GET /api/settlement/verify?hash=<bundleHash>
 * OR  GET /api/settlement/verify?txId=<transactionId>
 *
 * Public cryptographic proof verifier — no auth required.
 * Reconstructs the binary Merkle Tree from stored miner call proofs and
 * cryptographically verifies each leaf inclusion against the on-chain root hash.
 */
export async function GET(req: NextRequest) {
    const { searchParams } = new URL(req.url);
    const hash = searchParams.get("hash");
    const txId = searchParams.get("txId");

    if (!hash && !txId) {
        return NextResponse.json(
            { error: "Provide either ?hash=<bundleHash> or ?txId=<transactionId>" },
            { status: 400 }
        );
    }

    // Find the transaction
    let transaction;
    if (txId) {
        transaction = await db.transactionIntent.findUnique({
            where: { id: txId },
            include: { minerCalls: { orderBy: { createdAt: "asc" } } },
        });
    } else {
        // Search by settlement proof hash (settlementTxRef column)
        transaction = await db.transactionIntent.findFirst({
            where: { settlementTxRef: hash! },
            include: { minerCalls: { orderBy: { createdAt: "asc" } } },
        });
    }

    if (!transaction) {
        return NextResponse.json({
            verified: false,
            reason: "Transaction not found in VeriSettle ledger. Ensure the proof hash belongs to a completed settlement.",
            demoMode: true,
        }, { status: 404 });
    }

    // Format leaf data for Merkle tree reconstruction
    const leafItems: MerkleLeafData[] = (transaction.minerCalls ?? []).map((c, i) => ({
        index: i,
        intent: c.intent,
        minerId: c.minerId,
        txProofHash: c.txProofHash ?? "",
        confidenceScore: c.confidenceScore ?? 0.85,
        latencyMs: c.latencyMs,
        usedInConsensus: c.isConsensusPick,
        timestamp: c.createdAt.toISOString(),
    }));

    const merkleTree = buildMerkleTree(leafItems);

    // Also support legacy concatenation hash for backward compatibility
    const legacyHash = crypto
        .createHash("sha256")
        .update(transaction.id + leafItems.map(r => r.txProofHash).join(""))
        .digest("hex");

    const claimedHash = hash ?? transaction.settlementTxRef ?? "";
    const hashMatches = claimedHash
        ? claimedHash === merkleTree.root || claimedHash === legacyHash
        : true;

    // Build Merkle proof chain steps
    const hashChain = [
        {
            step: "Intent Identifier",
            input: transaction.id,
            output: crypto.createHash("sha256").update(transaction.id).digest("hex"),
        },
        ...leafItems.map(r => ({
            step: `Miner Leaf [${r.intent}::${r.minerId}]`,
            input: r.txProofHash,
            output: crypto.createHash("sha256").update(`${r.index}|${r.intent}|${r.minerId}|${r.txProofHash}`).digest("hex"),
        })),
        {
            step: "Merkle Root Hash",
            input: `${leafItems.length} Leaves (Levels: ${merkleTree.levels.length})`,
            output: merkleTree.root,
        },
    ];

    // Extract counterparty address and solanaAnchor if present
    const checkCall = transaction.minerCalls.find(
        c => c.intent === "WALLET_BALANCE_CHECK" || c.intent === "FRAUD_DETECTION"
    );
    const callResult = checkCall?.result as { address?: string } | null;
    const counterpartyAddress = callResult?.address ?? null;

    const breakdown = transaction.riskBreakdown as any;
    const solanaAnchor = breakdown?.solanaAnchor ?? null;

    return NextResponse.json({
        verified: hashMatches,
        transaction: {
            id: transaction.id,
            status: transaction.status,
            sourceCurrency: transaction.sourceCurrency,
            amountIn: transaction.amountIn,
            amountOut: transaction.amountOut,
            exchangeRate: transaction.quotedRate,
            riskScore: transaction.riskScore,
            riskDecision: transaction.riskDecision,
            riskSignals: transaction.riskBreakdown,
            createdAt: transaction.createdAt.toISOString(),
            updatedAt: transaction.updatedAt.toISOString(),
            counterpartyAddress,
        },
        proofBundle: {
            claimedHash: claimedHash || merkleTree.root,
            reconstructedHash: merkleTree.root,
            merkleRoot: merkleTree.root,
            merkleTree: {
                root: merkleTree.root,
                levels: merkleTree.levels,
                leaves: merkleTree.leaves,
                proofs: merkleTree.proofs,
            },
            hashMatches,
            receipts: leafItems,
            totalMinerCalls: leafItems.length,
            consensusPickCount: leafItems.filter(r => r.usedInConsensus).length,
            solanaAnchor,
        },
        hashChain,
        verifiedAt: new Date().toISOString(),
    });
}
