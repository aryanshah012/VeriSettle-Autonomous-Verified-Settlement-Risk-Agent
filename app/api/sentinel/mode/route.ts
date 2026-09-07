import { NextRequest, NextResponse } from "next/server";
import { getTelegraphMode, setTelegraphMode } from "@/app/lib/telegraph/client";

export async function GET() {
    return NextResponse.json({ mode: getTelegraphMode() });
}

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { mode } = body;
        if (mode === "live" || mode === "hybrid" || mode === "mock") {
            setTelegraphMode(mode);
            return NextResponse.json({ success: true, mode: getTelegraphMode() });
        }
        return NextResponse.json({ error: "Invalid mode. Allowed: live, hybrid, mock" }, { status: 400 });
    } catch (e: any) {
        return NextResponse.json({ error: e?.message || "Failed to update mode" }, { status: 500 });
    }
}
