import { AnalyticsDashboard } from "../components/AnalyticsDashboard";
import { Metadata } from "next";

export const metadata: Metadata = {
    title: "Telegraph Analytics | VeriSettle",
    description: "Real-time telemetry, multi-miner consensus, and cryptographic audit proofs on Telegraph Protocol.",
};

export default function AnalyticsPage() {
    return <AnalyticsDashboard />;
}
