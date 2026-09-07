import { NextRequest, NextResponse } from "next/server";
import { getAssociatedTokenAddress, getAccount } from "@solana/spl-token";
import { getSupportedTokens, connection } from "@/app/lib/constants";
import { LAMPORTS_PER_SOL, PublicKey } from "@solana/web3.js";

export async function GET(req: NextRequest) {
    const { searchParams } = new URL(req.url);
    const address = searchParams.get("address") as string;

    if (!address) {
        return NextResponse.json(
            { error: "Address parameter is required" },
            { status: 400 }
        );
    }

    const supportedTokens = await getSupportedTokens();
    const balances = await Promise.all(
        supportedTokens.map(token => getTokenBalance(token, address))
    );

    const tokens = supportedTokens.map((token, index) => ({
        ...token,
        balance: balances[index].toFixed(2),
        usdBalance: (balances[index] * Number(token.price)).toFixed(2),
    }));

    const totalBalance = tokens
        .reduce((sum, token) => sum + Number(token.usdBalance), 0)
        .toFixed(2);

    return NextResponse.json({ tokens, totalBalance });
}

async function getTokenBalance(
    token: { name: string; mint: string; native: boolean; decimals: number },
    address: string
): Promise<number> {
    try {
        if (token.native) {
            const balance = await connection.getBalance(new PublicKey(address));
            return balance / LAMPORTS_PER_SOL;
        }

        const ata = await getAssociatedTokenAddress(
            new PublicKey(token.mint),
            new PublicKey(address)
        );

        const account = await getAccount(connection, ata);
        return Number(account.amount) / 10 ** token.decimals;
    } catch (e) {
        return 0;
    }
}
