import axios from "axios";
import { useEffect, useState } from "react";
import { TokenDetails } from "@/app/lib/tokens";

export interface TokenWithbalance extends TokenDetails {
    balance: string;
    usdBalance: string;
}

interface TokenBalances {
    totalBalance: number;
    tokens: TokenWithbalance[];
}

export function useTokens(address: string) {
    const [tokenBalances, setTokenBalances] = useState<TokenBalances | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        axios
            .get(`/api/tokens?address=${address}`)
            .then(res => {
                setTokenBalances(res.data);
                setLoading(false);
            })
            .catch(err => {
                setError(err.message);
                setLoading(false);
            });
    }, [address]);

    return { loading, tokenBalances, error };
}