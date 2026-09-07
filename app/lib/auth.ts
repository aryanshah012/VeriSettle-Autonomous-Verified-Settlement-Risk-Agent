import GoogleProvider from "next-auth/providers/google";
import CredentialsProvider from "next-auth/providers/credentials";
import db from "@/app/db";
import { Keypair } from "@solana/web3.js";
import { Session } from "next-auth";
import { DEFAULT_DEMO_USER_ID, DEFAULT_DEMO_USER_EMAIL } from "@/app/db/memoryStore";

export interface CustomSession extends Session {
    user: {
        email: string;
        name: string;
        image: string;
        uid: string;
        isJudge?: boolean;
    };
}

export const authConfig = {
    secret: process.env.NEXTAUTH_SECRET || "secret",
    providers: [
        // 1-Click Judge & Hackathon Demo Access
        CredentialsProvider({
            id: "judge-demo",
            name: "Telegraph Judge Access",
            credentials: {
                username: { label: "Username", type: "text", placeholder: "judge" },
            },
            async authorize(credentials) {
                // Return default demo judge account
                let user = await db.user.findFirst({
                    where: { id: DEFAULT_DEMO_USER_ID },
                });

                if (!user) {
                    const keypair = Keypair.generate();
                    user = await db.user.create({
                        data: {
                            id: DEFAULT_DEMO_USER_ID,
                            username: DEFAULT_DEMO_USER_EMAIL,
                            name: "Telegraph Hackathon Judge",
                            profilePicture: "https://avatar.vercel.sh/judge",
                            provider: "Google",
                            sub: "judge-sub-12345",
                            solWallet: {
                                create: {
                                    publicKey: keypair.publicKey.toBase58(),
                                    privateKey: keypair.secretKey.toString(),
                                },
                            },
                            inrWallet: {
                                create: { balance: 250000 },
                            },
                        },
                    });
                }

                return {
                    id: user.id,
                    name: user.name ?? "Telegraph Hackathon Judge",
                    email: user.username,
                    image: user.profilePicture ?? "https://avatar.vercel.sh/judge",
                };
            },
        }),
        // Instant Email Sign-In (Direct access without external OAuth setup)
        CredentialsProvider({
            id: "email-login",
            name: "Email Sign In",
            credentials: {
                email: { label: "Email", type: "email", placeholder: "you@example.com" },
                name: { label: "Name", type: "text", placeholder: "Your Name" },
            },
            async authorize(credentials) {
                const rawEmail = credentials?.email?.trim().toLowerCase();
                if (!rawEmail) return null;

                let user = await db.user.findFirst({
                    where: { username: rawEmail },
                });

                if (!user) {
                    const keypair = Keypair.generate();
                    const userId = `usr_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
                    user = await db.user.create({
                        data: {
                            id: userId,
                            username: rawEmail,
                            name: credentials?.name?.trim() || rawEmail.split("@")[0],
                            profilePicture: `https://avatar.vercel.sh/${encodeURIComponent(rawEmail)}`,
                            provider: "Google",
                            sub: `email-${rawEmail}`,
                            solWallet: {
                                create: {
                                    publicKey: keypair.publicKey.toBase58(),
                                    privateKey: keypair.secretKey.toString(),
                                },
                            },
                            inrWallet: {
                                create: { balance: 250000 },
                            },
                        },
                    });
                }

                return {
                    id: user.id,
                    name: user.name ?? rawEmail.split("@")[0],
                    email: user.username,
                    image: user.profilePicture ?? `https://avatar.vercel.sh/${encodeURIComponent(rawEmail)}`,
                };
            },
        }),
        GoogleProvider({
            clientId: process.env.GOOGLE_CLIENT_ID ?? "",
            clientSecret: process.env.GOOGLE_CLIENT_SECRET ?? "",
        }),
    ],
    callbacks: {
        session: ({ session, token }: any): CustomSession => {
            if (session.user) {
                session.user.uid = token.uid || DEFAULT_DEMO_USER_ID;
                session.user.isJudge = token.uid === DEFAULT_DEMO_USER_ID;
            }
            return session as CustomSession;
        },
        jwt: async ({ token, account, user }: any) => {
            if (user) {
                token.uid = user.id;
                return token;
            }
            if (!account) return token;

            const existing = await db.user.findFirst({
                where: { sub: account.providerAccountId },
            });

            if (existing) {
                token.uid = existing.id;
            }
            return token;
        },
        signIn: async ({ account, profile }: any) => {
            if (account?.provider === "judge-demo" || account?.provider === "email-login") return true;
            if (account?.provider !== "google") return false;

            const email = profile?.email;
            if (!email) return false;

            const existingUser = await db.user.findFirst({
                where: { username: email },
            });

            if (existingUser) return true;

            const keypair = Keypair.generate();
            const publicKey = keypair.publicKey.toBase58();

            await db.user.create({
                data: {
                    username: email,
                    name: profile?.name,
                    profilePicture: profile?.picture,
                    provider: "Google",
                    sub: account.providerAccountId,
                    solWallet: {
                        create: {
                            publicKey,
                            privateKey: keypair.secretKey.toString(),
                        },
                    },
                    inrWallet: {
                        create: { balance: 100000 },
                    },
                },
            });

            return true;
        },
    },
};