import { authConfig } from "@/app/lib/auth";
import { getServerSession } from "next-auth";
import { NextRequest, NextResponse } from "next/server";
import db from "@/app/db";

/**
 * GET /api/settlement/:id
 * Returns full transaction state plus the complete Miner call audit trail —
 * every call made, not just the ones that "won" consensus.
 */
export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
    const session = await getServerSession(authConfig);
    if (!session?.user) {
        return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const transaction = await db.transactionIntent.findUnique({
        where: { id: params.id },
        include: { minerCalls: { orderBy: { createdAt: "asc" } } },
    });

    if (!transaction || transaction.userId !== session.user.uid) {
        return NextResponse.json({ error: "Transaction not found" }, { status: 404 });
    }

    return NextResponse.json(transaction);
}
