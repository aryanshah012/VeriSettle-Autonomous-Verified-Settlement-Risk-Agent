import { Connection } from "@solana/web3.js";
import axios from "axios";
import { SUPPORTED_TOKENS } from "./tokens";

let LAST_UPDATED: number | null = null;
const DEFAULT_PRICES: { [key: string]: { price: string } } = {
    SOL: { price: "135.00" },
    USDC: { price: "1.00" },
    USDT: { price: "1.00" },
};

let prices: { [key: string]: { price: string } } = { ...DEFAULT_PRICES };

const TOKEN_PRICE_REFRESH_INTERVAL = 60 * 1000; // every 60s

export const connection = new Connection(
    process.env.SOLANA_RPC_URL || "https://api.devnet.solana.com"
);

export async function getSupportedTokens() {
    if (!LAST_UPDATED || new Date().getTime() - LAST_UPDATED > TOKEN_PRICE_REFRESH_INTERVAL) {
        try {
            const response = await axios.get("https://price.jup.ag/v6/price?ids=SOL,USDC,USDT", { timeout: 3000 });
            if (response.data?.data) {
                prices = { ...DEFAULT_PRICES, ...response.data.data };
                LAST_UPDATED = new Date().getTime();
            }
        } catch (e) {
            // Graceful fallback to default prices if offline or API unavailable
        }
    }

    return SUPPORTED_TOKENS.map(s => ({
        ...s,
        price: prices[s.name]?.price ?? DEFAULT_PRICES[s.name]?.price ?? "1.00",
    }));
}