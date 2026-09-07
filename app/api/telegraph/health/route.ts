import { NextResponse } from "next/server";
import {
    TELEGRAPH_ENGINE_URL,
    TELEGRAPH_NODE_URL,
    TELEGRAPH_API_BASE,
    getTelegraphMode,
    telegraphConfig,
} from "@/app/lib/telegraph/client";

export async function GET() {
    const liveMode = getTelegraphMode() === "live";
    const x402Configured = telegraphConfig.x402Configured;
    const configured = Boolean(TELEGRAPH_API_BASE || TELEGRAPH_ENGINE_URL || TELEGRAPH_NODE_URL);

    let endpointReachable = false;
    let lastStatus: number | null = null;
    let lastError: string | null = null;

    const targets = [
        `${TELEGRAPH_ENGINE_URL}/health`,
        `${TELEGRAPH_API_BASE}/health`,
        `${TELEGRAPH_NODE_URL}/status`,
        TELEGRAPH_API_BASE,
    ];

    for (const url of targets) {
        try {
            const controller = new AbortController();
            const timeout = setTimeout(() => controller.abort(), 3000);
            const res = await fetch(url, {
                method: "GET",
                signal: controller.signal,
                headers: { Accept: "application/json" },
            });
            clearTimeout(timeout);
            lastStatus = res.status;
            if (res.ok || res.status === 402 || res.status === 200) {
                endpointReachable = true;
                lastError = null;
                break;
            }
        } catch (e: any) {
            lastError = e?.message || String(e);
        }
    }

    return NextResponse.json({
        configured,
        endpointReachable,
        x402Configured,
        liveMode,
        lastStatus,
        lastError,
    });
}
