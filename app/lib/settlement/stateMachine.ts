/**
 * Mirrors the `SettlementStatus` enum in prisma/schema.prisma. Defined
 * locally (rather than imported from "@prisma/client") so this module has
 * no dependency on `prisma generate` having run — it's structurally
 * identical to the generated enum, so values flow both ways without a cast.
 */
export type SettlementStatus =
    | "quoted"
    | "rate_locked"
    | "screening"
    | "held_for_review"
    | "settling"
    | "complete"
    | "failed"
    | "expired";

/**
 * Valid transitions. Anything not listed here is rejected — this is what
 * stops, e.g., a held-for-review transaction from being settled directly,
 * or a settled transaction from being re-screened.
 */
const TRANSITIONS: Record<SettlementStatus, SettlementStatus[]> = {
    quoted: ["rate_locked", "expired", "failed"],
    rate_locked: ["screening", "expired", "failed"],
    screening: ["settling", "held_for_review", "failed"],
    held_for_review: ["settling", "failed"],
    settling: ["complete", "failed"],
    complete: [],
    failed: [],
    expired: ["quoted"], // allow re-quoting after expiry
};

export class InvalidTransitionError extends Error {
    constructor(from: SettlementStatus, to: SettlementStatus) {
        super(`Cannot transition settlement from "${from}" to "${to}"`);
        this.name = "InvalidTransitionError";
    }
}

export function assertValidTransition(from: SettlementStatus, to: SettlementStatus) {
    if (!TRANSITIONS[from]?.includes(to)) {
        throw new InvalidTransitionError(from, to);
    }
}

/** Standard rate-lock window — long enough to complete screening, short
 * enough to bound FX/price slippage exposure. */
export const RATE_LOCK_WINDOW_MS = 90 * 1000; // 90 seconds

export function isRateLockExpired(rateExpiresAt: Date | string | null | undefined): boolean {
    if (!rateExpiresAt) return false;
    const time = rateExpiresAt instanceof Date ? rateExpiresAt.getTime() : new Date(rateExpiresAt).getTime();
    return !isNaN(time) && Date.now() > time;
}
