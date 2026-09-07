import { PrismaClient } from "@prisma/client";
import { memoryStore } from "./memoryStore";

const prismaClientSingleton = () => {
    return new PrismaClient();
};

type PrismaClientSingleton = ReturnType<typeof prismaClientSingleton>;

const globalForPrisma = globalThis as unknown as {
    prisma: PrismaClientSingleton | undefined;
    dbUsesFallback?: boolean;
};

const rawPrisma = globalForPrisma.prisma ?? prismaClientSingleton();
if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = rawPrisma;

let useFallback = globalForPrisma.dbUsesFallback ?? false;

/**
 * Transparent resilient DB wrapper:
 * Attempts Prisma operations first. If PostgreSQL is not running or connection
 * fails (P1001), it gracefully switches to memoryStore without throwing 500 errors.
 */
function createModelProxy<T extends object, F extends object>(prismaModel: T, fallbackModel: F): T {
    return new Proxy(prismaModel, {
        get(target: any, prop: string) {
            return async (...args: any[]) => {
                if (useFallback) {
                    const fn = (fallbackModel as any)[prop];
                    if (typeof fn === "function") return fn(...args);
                    return null;
                }
                try {
                    const fn = target[prop];
                    if (typeof fn === "function") {
                        return await fn.apply(target, args);
                    }
                    return target[prop];
                } catch (err: any) {
                    // Check for PostgreSQL connection errors (P1001, P1002, etc.)
                    const isConnError =
                        err?.code === "P1001" ||
                        err?.code === "P1002" ||
                        err?.code === "P1003" ||
                        err?.message?.includes("Can't reach database server") ||
                        err?.message?.includes("connection refused");

                    if (isConnError) {
                        if (!useFallback) {
                            console.warn("[VeriSettle DB] PostgreSQL unavailable; seamlessly switching to in-memory/disk store.");
                            useFallback = true;
                            globalForPrisma.dbUsesFallback = true;
                        }
                        const fn = (fallbackModel as any)[prop];
                        if (typeof fn === "function") return fn(...args);
                    }
                    throw err;
                }
            };
        },
    });
}

const db = {
    user: createModelProxy(rawPrisma.user, memoryStore.user),
    inrWalet: createModelProxy(rawPrisma.inrWalet, memoryStore.inrWalet),
    solWallet: createModelProxy(rawPrisma.solWallet, memoryStore.solWallet),
    transactionIntent: createModelProxy(rawPrisma.transactionIntent, memoryStore.transactionIntent),
    minerCallLog: createModelProxy(rawPrisma.minerCallLog, memoryStore.minerCallLog),
    $disconnect: async () => {
        try {
            await rawPrisma.$disconnect();
        } catch {
            // noop
        }
    },
};

export default db;
export { memoryStore };