import { NextRequest, NextResponse } from "next/server";
import { evaluateCircuitBreaker, setCircuitBreakerOverride, getActiveCircuitBreakerStatus } from "@/app/lib/telegraph/circuitBreaker";

export async function GET() {
    const status = getActiveCircuitBreakerStatus();
    return NextResponse.json(status);
}

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { action, usdcPrice, gasPriceGwei, sentimentScore, divergenceDetected } = body;

        if (action === "reset") {
            setCircuitBreakerOverride(null);
            return NextResponse.json({ success: true, status: getActiveCircuitBreakerStatus() });
        }

        const evaluated = evaluateCircuitBreaker({
            usdcPrice,
            gasPriceGwei,
            sentimentScore,
            divergenceDetected,
        });

        if (action === "override") {
            setCircuitBreakerOverride(evaluated);
        }

        return NextResponse.json({ success: true, status: evaluated });
    } catch (e: any) {
        return NextResponse.json({ error: e?.message || "Failed to evaluate circuit breaker" }, { status: 500 });
    }
}
