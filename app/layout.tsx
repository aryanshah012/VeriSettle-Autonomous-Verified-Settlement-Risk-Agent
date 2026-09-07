import type { Metadata } from "next";
import "./globals.css";
import { Appbar } from "./components/Appbar";
import { Providers } from "./providers";

export const metadata: Metadata = {
    title: "VeriSettle — Verified Intelligence Before Value Moves · Telegraph Protocol",
    description:
        "Autonomous settlement and risk agent powered by Telegraph Protocol. Refuses to move value without verified miner intelligence.",
    keywords: ["Telegraph Protocol", "VeriSettle", "crypto settlement", "autonomous settlement", "verified settlement", "multi-miner consensus", "x402"],
    icons: {
        icon: [
            { url: "/favicon.svg", type: "image/svg+xml" },
        ],
        shortcut: ["/favicon.svg"],
        apple: [
            { url: "/favicon.svg", type: "image/svg+xml" },
        ],
    },
    openGraph: {
        title: "VeriSettle — Verified Intelligence Before Value Moves",
        description: "Autonomous settlement and risk agent powered by Telegraph Protocol",
        type: "website",
    },
};

import { SentinelCopilot } from "./components/SentinelCopilot";

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="en" className="dark">
            <head>
                <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
                <link rel="preconnect" href="https://fonts.googleapis.com" />
                <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
            </head>
            <body style={{ fontFamily: "'Inter', system-ui, -apple-system, sans-serif" }}>
                <Providers>
                    <Appbar />
                    <main style={{ minHeight: "calc(100vh - 64px)", position: "relative", zIndex: 1 }}>
                        {children}
                    </main>
                    <SentinelCopilot />
                </Providers>
            </body>
        </html>
    );
}
