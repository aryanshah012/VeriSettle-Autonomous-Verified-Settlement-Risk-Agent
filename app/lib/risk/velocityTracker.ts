import db from "@/app/db";

/**
 * Velocity tracker: counts how many TransactionIntents a user has created
 * in the last `windowMs` milliseconds. Used as a risk signal to detect
 * abuse patterns (rapid repeated settlement attempts).
 */
export async function getUserTransactionVelocity(
    userId: string,
    windowMs = 5 * 60 * 1000 // default: 5-minute window
): Promise<{
    count: number;
    velocityLevel: "normal" | "elevated" | "high";
    windowMs: number;
}> {
    const since = new Date(Date.now() - windowMs);
    const count = await db.transactionIntent.count({
        where: {
            userId,
            createdAt: { gte: since },
        },
    });

    const velocityLevel =
        count >= 10 ? "high" :
        count >= 4  ? "elevated" :
        "normal";

    return { count, velocityLevel, windowMs };
}
