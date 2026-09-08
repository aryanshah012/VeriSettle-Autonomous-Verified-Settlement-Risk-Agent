import { authConfig } from "@/app/lib/auth";
import { getServerSession } from "next-auth";
import { NextRequest, NextResponse } from "next/server";
import db from "@/app/db";
import { queryFraudDetection, queryWalletBalanceCheck, queryGasPrice, queryNewsSearch } from "@/app/lib/telegraph/adapters";
import { resolveConsensus } from "@/app/lib/telegraph/orchestrator";
import { assessRisk } from "@/app/lib/risk/engine";
import { assertValidTransition, isRateLockExpired } from "@/app/lib/settlement/stateMachine";

/**
 * POST /api/settlement/screen
 * body: { transactionId: string, counterpartyAddress: string }
 *
 * Step 2 of the pipeline: run FRAUD_DETECTION + WALLET_BALANCE_CHECK + GAS_PRICE + NEWS_SEARCH
 * across multiple Miners, track velocity, feed the consensus results into the 5-signal risk engine,
 * and transition the transaction to settling / held_for_review / failed based on an explainable
 * composite score.
 */
import { DEFAULT_DEMO_USER_ID } from "@/app/db/memoryStore";

import { TelegraphUnavailableError } from "@/app/lib/telegraph/types";

export async function POST(req: NextRequest) {
    try {
        const session = await getServerSession(authConfig);
        const userId = session?.user?.uid ?? DEFAULT_DEMO_USER_ID;

        const { transactionId, counterpartyAddress } = await req.json();
        if (!transactionId || !counterpartyAddress) {
            return NextResponse.json(
                { error: "transactionId and counterpartyAddress are required" },
                { status: 400 }
            );
        }

        const transaction = await db.transactionIntent.findUnique({ where: { id: transactionId } });
        if (!transaction || (transaction.userId !== userId && userId !== DEFAULT_DEMO_USER_ID && transaction.userId !== DEFAULT_DEMO_USER_ID)) {
            return NextResponse.json({ error: "Transaction not found" }, { status: 404 });
        }

        if (isRateLockExpired(transaction.rateExpiresAt)) {
            await db.transactionIntent.update({
                where: { id: transactionId },
                data: { status: "expired" },
            });
            return NextResponse.json(
                { error: "Rate lock expired, request a new quote", status: "expired" },
                { status: 409 }
            );
        }

        assertValidTransition(transaction.status, "screening");
        await db.transactionIntent.update({
            where: { id: transactionId },
            data: { status: "screening" },
        });

        const [fraudCalls, walletCalls, gasCalls, newsCalls] = await Promise.all([
            queryFraudDetection({ address: counterpartyAddress }),
            queryWalletBalanceCheck({ address: counterpartyAddress }),
            queryGasPrice({ network: "solana", address: counterpartyAddress }),
            queryNewsSearch({ query: "solana offramp settlement" }),
        ]);

        const [fraudConsensus, walletConsensus, gasConsensus, newsConsensus] = await Promise.all([
            resolveConsensus(transactionId, fraudCalls, { categoricalField: "verdict" }),
            resolveConsensus(transactionId, walletCalls, { categoricalField: "riskTier" }),
            resolveConsensus(transactionId, gasCalls, { categoricalField: "congestionLevel" }),
            resolveConsensus(transactionId, newsCalls, { categoricalField: "overallSentiment" }),
        ]);

        // Track on-chain velocity in the last 5 minutes (relaxed for demo)
        let velocityLevel: "normal" | "elevated" | "high" = "normal";
        try {
            const recentTxs = await db.transactionIntent.findMany({
                where: { userId: transaction.userId },
                orderBy: { createdAt: "desc" },
                take: 20,
            });
            const fiveMinutesAgo = Date.now() - 5 * 60 * 1000;
            const countInWindow = (recentTxs || []).filter(
                (t: any) => new Date(t.createdAt).getTime() > fiveMinutesAgo
            ).length;
            if (countInWindow >= 10) velocityLevel = "high";
            else if (countInWindow >= 6) velocityLevel = "elevated";
        } catch {
            // Fallback to normal velocity
        }

        const amountUsd =
            transaction.amountIn * (transaction.quotedRate ? transaction.quotedRate / 87.4 : 1);

        const risk = assessRisk({
            fraud: fraudConsensus,
            wallet: walletConsensus,
            gas: gasConsensus,
            news: newsConsensus,
            velocityLevel,
            amountUsd,
        });

        const nextStatus =
            risk.decision === "auto_deny"
                ? "failed"
                : risk.decision === "hold_for_review"
                ? "held_for_review"
                : "settling";

        assertValidTransition("screening", nextStatus);

        const updated = await db.transactionIntent.update({
            where: { id: transactionId },
            data: {
                status: nextStatus,
                riskScore: risk.compositeScore,
                riskDecision: risk.decision,
                riskBreakdown: risk.signals as unknown as object,
                failureReason: risk.decision === "auto_deny" ? "Auto-denied by risk engine" : undefined,
            },
        });

        return NextResponse.json({
            transactionId,
            status: updated.status,
            riskScore: risk.compositeScore,
            riskDecision: risk.decision,
            signals: risk.signals,
            explanation: risk.explanation,
            overallConfidence: risk.overallConfidence,
            policy: risk.policy,
            policyThreshold: risk.policyThreshold,
            fraudConsensus: { value: fraudConsensus.value, divergent: fraudConsensus.divergent },
            walletConsensus: { value: walletConsensus.value, divergent: walletConsensus.divergent },
            gasConsensus: { value: gasConsensus.value, divergent: gasConsensus.divergent },
            newsConsensus: { value: newsConsensus.value, divergent: newsConsensus.divergent },
        });
    } catch (e: any) {
        console.error("[api/settlement/screen] Error:", e?.message || e);
        const isUnavailable =
            e instanceof TelegraphUnavailableError ||
            e?.name === "TelegraphUnavailableError" ||
            e?.message?.includes("Telegraph verification unavailable") ||
            e?.reason?.includes("Telegraph verification unavailable") ||
            e?.message?.includes("paused due to circuit safety");

        if (isUnavailable) {
            return NextResponse.json(
                {
                    error: "Telegraph verification unavailable — Settlement paused for safety",
                    reason: e?.reason || e?.message || "Risk screening miners unreachable in live mode.",
                    pausedForSafety: true,
                },
                { status: 503 }
            );
        }

        return NextResponse.json(
            { error: e?.message || "Screening failed" },
            { status: 500 }
        );
    }
}
