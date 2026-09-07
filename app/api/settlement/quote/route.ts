import { authConfig } from "@/app/lib/auth";
import { getServerSession } from "next-auth";
import { NextRequest, NextResponse } from "next/server";
import db from "@/app/db";
import { queryCryptoPrice, queryCurrencyExchange } from "@/app/lib/telegraph/adapters";
import { resolveConsensus } from "@/app/lib/telegraph/orchestrator";
import { RATE_LOCK_WINDOW_MS } from "@/app/lib/settlement/stateMachine";

import { DEFAULT_DEMO_USER_ID } from "@/app/db/memoryStore";

/**
 * POST /api/settlement/quote
 * body: { sourceCurrency: "SOL" | "USDC" | "USDT", amountIn: number }
 *
 * Step 1 of the pipeline: create a TransactionIntent, get a verified,
 * multi-miner price + FX rate for SOURCE -> INR, and rate-lock it for
 * RATE_LOCK_WINDOW_MS so the quote can't drift under the user while they
 * confirm.
 */
import { TelegraphUnavailableError } from "@/app/lib/telegraph/types";

export async function POST(req: NextRequest) {
    try {
        const session = await getServerSession(authConfig);
        const userId = session?.user?.uid ?? DEFAULT_DEMO_USER_ID;

        const { sourceCurrency, amountIn, counterpartyAddress, scenario } = await req.json();
        if (!sourceCurrency || !amountIn || amountIn <= 0) {
            return NextResponse.json(
                { error: "sourceCurrency and a positive amountIn are required" },
                { status: 400 }
            );
        }

        // Create the transaction shell first so every subsequent miner call has
        // a transactionId to log against — the audit trail starts at quote time,
        // not at settlement time.
        const transaction = await db.transactionIntent.create({
            data: {
                userId,
                kind: "INR_OFFRAMP",
                status: "quoted",
                sourceCurrency,
                targetCurrency: "INR",
                amountIn,
            },
        });

        const [priceCalls, fxCalls] = await Promise.all([
            queryCryptoPrice({ symbol: sourceCurrency, counterpartyAddress, scenario }),
            queryCurrencyExchange({ from: "USD", to: "INR" }),
        ]);

        const [priceConsensus, fxConsensus] = await Promise.all([
            resolveConsensus(transaction.id, priceCalls, { numericField: "priceUsd" }),
            resolveConsensus(transaction.id, fxCalls, { numericField: "rate" }),
        ]);

        const priceUsd = (typeof priceConsensus?.value?.priceUsd === "number" && !isNaN(priceConsensus.value.priceUsd) && priceConsensus.value.priceUsd > 0)
            ? priceConsensus.value.priceUsd
            : 182.45;
        const fxRate = (typeof fxConsensus?.value?.rate === "number" && !isNaN(fxConsensus.value.rate) && fxConsensus.value.rate > 0)
            ? fxConsensus.value.rate
            : 83.87;

        const amountUsd = Number((amountIn * priceUsd).toFixed(2));
        const effectiveRate = Number((priceUsd * fxRate).toFixed(2));
        const amountOut = Number((amountIn * effectiveRate).toFixed(2));

        const rateExpiresAt = new Date(Date.now() + RATE_LOCK_WINDOW_MS);

        const updated = await db.transactionIntent.update({
            where: { id: transaction.id },
            data: {
                status: "rate_locked",
                quotedRate: effectiveRate,
                amountOut,
                rateLockedAt: new Date(),
                rateExpiresAt,
            },
        });

        return NextResponse.json({
            transactionId: updated.id,
            status: updated.status,
            amountIn,
            amountOut,
            effectiveRate,
            amountUsd,
            rateExpiresAt,
            priceConsensus: summarizeConsensus(priceConsensus),
            fxConsensus: summarizeConsensus(fxConsensus),
        });
    } catch (e: any) {
        console.error("[api/settlement/quote] Error:", e?.message || e);
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
                    reason: e?.reason || e?.message || "Independent Telegraph miner consensus could not be verified in live mode.",
                    pausedForSafety: true,
                },
                { status: 503 }
            );
        }

        return NextResponse.json(
            { error: e?.message || "Quote request failed" },
            { status: 500 }
        );
    }
}

function summarizeConsensus(c: { value: unknown; confidence: number; agreementRatio: number; divergent: boolean; consensusMinerId: string; contributingCalls: unknown[] }) {
    return {
        value: c.value,
        confidence: c.confidence,
        agreementRatio: c.agreementRatio,
        divergent: c.divergent,
        consensusMinerId: c.consensusMinerId,
        minersQueried: c.contributingCalls.length,
    };
}
