import { NextResponse } from "next/server";
import db from "@/app/db";
import { authConfig } from "@/app/lib/auth";
import { getServerSession } from "next-auth";

import { DEFAULT_DEMO_USER_ID } from "@/app/db/memoryStore";

export const dynamic = "force-dynamic";

/**
 * GET /api/settlement/history
 * Returns the authenticated user's last 20 transactions with their miner call logs.
 */
export async function GET() {
    const session = await getServerSession(authConfig);
    const userId = session?.user?.uid ?? DEFAULT_DEMO_USER_ID;

    const transactions = await db.transactionIntent.findMany({
        where: { userId },
        orderBy: { createdAt: "desc" },
        take: 20,
        include: {
            minerCalls: {
                orderBy: { createdAt: "asc" },
                select: {
                    id: true,
                    intent: true,
                    minerId: true,
                    confidenceScore: true,
                    txProofHash: true,
                    latencyMs: true,
                    isConsensusPick: true,
                },
            },
        },
    });

    return NextResponse.json({ transactions });
}
