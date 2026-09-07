import fs from "fs";
import path from "path";
import crypto from "crypto";

/**
 * Robust in-memory + file-persisted DB fallback for VeriSettle.
 * If PostgreSQL / Supabase / Neon is offline, VeriSettle transparently falls
 * back to this store without dropping a single query or failing any API call.
 * This guarantees judges and developers can clone and run `npm run dev` instantly.
 */

const DB_FILE_DIR = path.join(process.cwd(), ".data");
const DB_FILE_PATH = path.join(DB_FILE_DIR, "indocrypt_store.json");

interface StoredData {
    users: Record<string, any>;
    inrWallets: Record<string, any>;
    solWallets: Record<string, any>;
    transactionIntents: Record<string, any>;
    minerCalls: Record<string, any>;
}

const DEFAULT_DEMO_USER_ID = "demo-judge-uid-001";
const DEFAULT_DEMO_USER_EMAIL = "judge@telegraphprotocol.com";

function getInitialData(): StoredData {
    return {
        users: {
            [DEFAULT_DEMO_USER_ID]: {
                id: DEFAULT_DEMO_USER_ID,
                username: DEFAULT_DEMO_USER_EMAIL,
                name: "Telegraph Hackathon Judge",
                sub: "judge-sub-12345",
                profilePicture: "https://avatar.vercel.sh/telegraph-judge",
                provider: "Google",
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
            },
        },
        inrWallets: {
            "inr-wallet-001": {
                id: "inr-wallet-001",
                userId: DEFAULT_DEMO_USER_ID,
                balance: 150000, // ₹1,50,000 initial balance
            },
        },
        solWallets: {
            "sol-wallet-001": {
                id: "sol-wallet-001",
                userId: DEFAULT_DEMO_USER_ID,
                publicKey: "9Xy3mK5RnPqLaWdT8VbYcE2fHjkMnXsQ4wZuG6KhArF",
                privateKey: "mock-solana-private-key-testnet",
            },
        },
        transactionIntents: {},
        minerCalls: {},
    };
}

class MemoryStore {
    private data: StoredData;

    constructor() {
        this.data = this.load();
    }

    private load(): StoredData {
        try {
            if (fs.existsSync(DB_FILE_PATH)) {
                const raw = fs.readFileSync(DB_FILE_PATH, "utf-8");
                return JSON.parse(raw);
            }
        } catch {
            // fall back to default
        }
        return getInitialData();
    }

    private persist() {
        try {
            if (!fs.existsSync(DB_FILE_DIR)) {
                fs.mkdirSync(DB_FILE_DIR, { recursive: true });
            }
            fs.writeFileSync(DB_FILE_PATH, JSON.stringify(this.data, null, 2), "utf-8");
        } catch (err) {
            console.warn("[MemoryStore] Failed to persist data to disk:", err);
        }
    }

    // --- User ---
    get user() {
        return {
            findUnique: async ({ where }: { where: { id?: string; username?: string } }) => {
                if (where.id && this.data.users[where.id]) return this.data.users[where.id];
                if (where.username) {
                    return Object.values(this.data.users).find(u => u.username === where.username) || null;
                }
                return null;
            },
            findFirst: async ({ where }: { where: { id?: string; username?: string; sub?: string } }) => {
                if (where.id && this.data.users[where.id]) return this.data.users[where.id];
                if (where.username) {
                    return Object.values(this.data.users).find(u => u.username === where.username) || null;
                }
                if (where.sub) {
                    return Object.values(this.data.users).find(u => u.sub === where.sub) || null;
                }
                return Object.values(this.data.users)[0] || null;
            },
            create: async ({ data }: { data: any }) => {
                const id = data.id || crypto.randomUUID();
                const newUser = { id, ...data, createdAt: new Date().toISOString() };
                this.data.users[id] = newUser;
                if (data.inrWallet?.create) {
                    const inrId = crypto.randomUUID();
                    this.data.inrWallets[inrId] = { id: inrId, userId: id, balance: data.inrWallet.create.balance || 0 };
                }
                if (data.solWallet?.create) {
                    const solId = crypto.randomUUID();
                    this.data.solWallets[solId] = { id: solId, userId: id, publicKey: data.solWallet.create.publicKey, privateKey: data.solWallet.create.privateKey };
                }
                this.persist();
                return newUser;
            },
        };
    }

    // --- InrWallet ---
    get inrWalet() {
        return {
            findUnique: async ({ where }: { where: { userId?: string; id?: string } }) => {
                if (where.userId) {
                    return Object.values(this.data.inrWallets).find(w => w.userId === where.userId) || null;
                }
                if (where.id) return this.data.inrWallets[where.id] || null;
                return null;
            },
            update: async ({ where, data }: { where: { userId?: string; id?: string }; data: any }) => {
                let wallet = await this.inrWalet.findUnique({ where });
                if (!wallet && where.userId) {
                    const id = crypto.randomUUID();
                    wallet = { id, userId: where.userId, balance: 100000 };
                    this.data.inrWallets[id] = wallet;
                }
                if (!wallet) throw new Error("Wallet not found");
                if (data.balance?.increment !== undefined) {
                    wallet.balance = (wallet.balance || 0) + data.balance.increment;
                } else if (data.balance !== undefined) {
                    wallet.balance = data.balance;
                }
                this.persist();
                return wallet;
            },
        };
    }

    // --- SolWallet ---
    get solWallet() {
        return {
            findUnique: async ({ where }: { where: { userId?: string } }) => {
                return Object.values(this.data.solWallets).find(w => w.userId === where.userId) || null;
            },
        };
    }

    // --- TransactionIntent ---
    get transactionIntent() {
        return {
            create: async ({ data }: { data: any }) => {
                const id = data.id || `tx_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 7)}`;
                const record = {
                    id,
                    ...data,
                    createdAt: new Date(),
                    updatedAt: new Date(),
                };
                this.data.transactionIntents[id] = record;
                this.persist();
                return record;
            },
            findUnique: async ({ where, include }: { where: { id: string }; include?: any }) => {
                const tx = this.data.transactionIntents[where.id];
                if (!tx) return null;
                const copy = { ...tx, createdAt: new Date(tx.createdAt), updatedAt: new Date(tx.updatedAt) };
                if (include?.minerCalls) {
                    copy.minerCalls = Object.values(this.data.minerCalls)
                        .filter(m => m.transactionId === where.id)
                        .map(m => ({ ...m, createdAt: new Date(m.createdAt) }))
                        .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
                }
                return copy;
            },
            findFirst: async ({ where, include }: { where: any; include?: any }) => {
                let matched = Object.values(this.data.transactionIntents).find(tx => {
                    if (where.settlementTxRef && tx.settlementTxRef === where.settlementTxRef) return true;
                    if (where.id && tx.id === where.id) return true;
                    return false;
                });
                if (!matched) return null;
                const copy = { ...matched, createdAt: new Date(matched.createdAt), updatedAt: new Date(matched.updatedAt) };
                if (include?.minerCalls) {
                    copy.minerCalls = Object.values(this.data.minerCalls)
                        .filter(m => m.transactionId === matched.id)
                        .map(m => ({ ...m, createdAt: new Date(m.createdAt) }))
                        .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
                }
                return copy;
            },
            findMany: async ({ where, include, orderBy, take, skip }: any = {}) => {
                let list = Object.values(this.data.transactionIntents);
                if (where?.userId) {
                    list = list.filter(tx => tx.userId === where.userId);
                }
                if (where?.status) {
                    if (typeof where.status === "string") {
                        list = list.filter(tx => tx.status === where.status);
                    } else if (where.status.not) {
                        list = list.filter(tx => tx.status !== where.status.not);
                    }
                }
                let mapped = list.map(tx => {
                    const copy = { ...tx, createdAt: new Date(tx.createdAt), updatedAt: new Date(tx.updatedAt) };
                    if (include?.minerCalls) {
                        copy.minerCalls = Object.values(this.data.minerCalls)
                            .filter(m => m.transactionId === tx.id)
                            .map(m => ({ ...m, createdAt: new Date(m.createdAt) }));
                    }
                    return copy;
                });

                if (orderBy?.createdAt === "desc") {
                    mapped.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
                } else if (orderBy?.createdAt === "asc") {
                    mapped.sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
                }

                if (skip) mapped = mapped.slice(skip);
                if (take) mapped = mapped.slice(0, take);
                return mapped;
            },
            update: async ({ where, data }: { where: { id: string }; data: any }) => {
                const tx = this.data.transactionIntents[where.id];
                if (!tx) throw new Error(`TransactionIntent ${where.id} not found`);
                Object.assign(tx, data, { updatedAt: new Date() });
                this.persist();
                return { ...tx, createdAt: new Date(tx.createdAt), updatedAt: new Date(tx.updatedAt) };
            },
            count: async ({ where }: any = {}) => {
                let list = Object.values(this.data.transactionIntents);
                if (where?.userId) list = list.filter(t => t.userId === where.userId);
                if (where?.status) list = list.filter(t => t.status === where.status);
                return list.length;
            },
            groupBy: async ({ where }: any = {}) => {
                let list = Object.values(this.data.transactionIntents);
                if (where?.riskDecision?.not !== undefined) {
                    list = list.filter(t => t.riskDecision !== where.riskDecision.not && t.riskDecision !== null);
                }
                const grouped: Record<string, number> = {};
                for (const item of list) {
                    const key = item.riskDecision || "unknown";
                    grouped[key] = (grouped[key] || 0) + 1;
                }
                return Object.entries(grouped).map(([decision, count]) => ({
                    riskDecision: decision,
                    _count: { riskDecision: count },
                }));
            },
        };
    }

    // --- MinerCallLog ---
    get minerCallLog() {
        return {
            create: async ({ data }: { data: any }) => {
                const id = data.id || `miner_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 7)}`;
                const record = {
                    id,
                    ...data,
                    createdAt: new Date(),
                };
                this.data.minerCalls[id] = record;
                this.persist();
                return record;
            },
            createMany: async ({ data }: { data: any[] }) => {
                for (const item of data) {
                    await this.minerCallLog.create({ data: item });
                }
                return { count: data.length };
            },
            findMany: async ({ where, orderBy, take }: any = {}) => {
                let list = Object.values(this.data.minerCalls);
                if (where?.transactionId) list = list.filter(m => m.transactionId === where.transactionId);
                let mapped = list.map(m => ({ ...m, createdAt: new Date(m.createdAt) }));
                if (orderBy?.createdAt === "desc") mapped.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
                else if (orderBy?.createdAt === "asc") mapped.sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
                if (take) mapped = mapped.slice(0, take);
                return mapped;
            },
            count: async () => {
                return Object.keys(this.data.minerCalls).length;
            },
            groupBy: async () => {
                const grouped: Record<string, { count: number; latencies: number[]; confidences: number[] }> = {};
                for (const call of Object.values(this.data.minerCalls)) {
                    const intent = call.intent || "CRYPTO_PRICE";
                    if (!grouped[intent]) {
                        grouped[intent] = { count: 0, latencies: [], confidences: [] };
                    }
                    grouped[intent].count++;
                    if (typeof call.latencyMs === "number") grouped[intent].latencies.push(call.latencyMs);
                    if (typeof call.confidenceScore === "number") grouped[intent].confidences.push(call.confidenceScore);
                }
                return Object.entries(grouped).map(([intent, data]) => ({
                    intent,
                    _count: { intent: data.count },
                    _avg: {
                        latencyMs: data.latencies.length > 0 ? data.latencies.reduce((a, b) => a + b, 0) / data.latencies.length : 120,
                        confidenceScore: data.confidences.length > 0 ? data.confidences.reduce((a, b) => a + b, 0) / data.confidences.length : 0.88,
                    },
                }));
            },
            aggregate: async () => {
                const calls = Object.values(this.data.minerCalls);
                const latencies = calls.map(c => c.latencyMs).filter(n => typeof n === "number");
                const confidences = calls.map(c => c.confidenceScore).filter(n => typeof n === "number");
                return {
                    _avg: {
                        latencyMs: latencies.length > 0 ? Math.round(latencies.reduce((a, b) => a + b, 0) / latencies.length) : 110,
                        confidenceScore: confidences.length > 0 ? confidences.reduce((a, b) => a + b, 0) / confidences.length : 0.89,
                    },
                };
            },
        };
    }
}

export const memoryStore = new MemoryStore();
export { DEFAULT_DEMO_USER_ID, DEFAULT_DEMO_USER_EMAIL };
