import { getServerSession } from "next-auth";
import { ProfileCard } from "../components/ProfileCard";
import db from "@/app/db";
import { authConfig } from "../lib/auth";
import { DEFAULT_DEMO_USER_ID, DEFAULT_DEMO_USER_EMAIL } from "../db/memoryStore";

async function getUserDashboardData() {
    const session = await getServerSession(authConfig);
    const userId = session?.user?.uid ?? DEFAULT_DEMO_USER_ID;

    let wallet = await db.solWallet.findFirst({
        where: { userId },
        select: { publicKey: true },
    });

    let inrWallet = await db.inrWalet.findFirst({
        where: { userId },
        select: { balance: true },
    });

    const publicKey = wallet?.publicKey || "9Xy3mK5RnPqLaWdT8VbYcE2fHjkMnXsQ4wZuG6KhArF";
    const inrBalance = inrWallet?.balance ?? 150000;

    const user = session?.user ?? {
        name: "Telegraph Hackathon Judge",
        email: DEFAULT_DEMO_USER_EMAIL,
        image: "https://avatar.vercel.sh/judge",
        isJudge: true,
    };

    return { publicKey, inrBalance, user };
}

export default async function Dashboard() {
    const data = await getUserDashboardData();
    return (
        <ProfileCard
            publicKey={data.publicKey}
            initialInrBalance={data.inrBalance}
            userData={data.user}
        />
    );
}