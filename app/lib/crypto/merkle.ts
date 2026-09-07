import crypto from "crypto";

export interface MerkleLeafData {
    index: number;
    intent: string;
    minerId: string;
    txProofHash: string;
    confidenceScore: number;
    latencyMs: number;
    usedInConsensus: boolean;
    timestamp?: string;
}

export interface MerkleProofStep {
    position: "left" | "right";
    hash: string;
}

export interface MerkleNodeInfo {
    id: string;
    level: number;
    hash: string;
    isLeaf: boolean;
    leafData?: MerkleLeafData;
}

export interface MerkleTreeResult {
    root: string;
    leaves: string[];
    leafData: MerkleLeafData[];
    levels: string[][];
    nodes: MerkleNodeInfo[];
    proofs: Record<number, MerkleProofStep[]>;
}

export function sha256(data: string): string {
    return crypto.createHash("sha256").update(data).digest("hex");
}

/**
 * Calculates a deterministic cryptographic leaf hash for a miner execution proof.
 */
export function hashMinerLeaf(data: MerkleLeafData): string {
    const raw = `${data.index}|${data.intent}|${data.minerId}|${data.txProofHash}|${data.confidenceScore.toFixed(4)}|${data.latencyMs}|${data.usedInConsensus}`;
    return sha256(raw);
}

/**
 * Builds a binary Merkle Tree from an array of miner receipt data.
 */
export function buildMerkleTree(items: MerkleLeafData[]): MerkleTreeResult {
    if (items.length === 0) {
        const emptyRoot = sha256("EMPTY_TREE");
        return {
            root: emptyRoot,
            leaves: [emptyRoot],
            leafData: [],
            levels: [[emptyRoot]],
            nodes: [{ id: "root", level: 0, hash: emptyRoot, isLeaf: true }],
            proofs: {},
        };
    }

    const leaves = items.map((item, idx) => hashMinerLeaf({ ...item, index: idx }));
    const levels: string[][] = [leaves];
    const nodes: MerkleNodeInfo[] = [];

    // Add leaf nodes
    leaves.forEach((hash, idx) => {
        nodes.push({
            id: `leaf-${idx}`,
            level: 0,
            hash,
            isLeaf: true,
            leafData: items[idx],
        });
    });

    let currentLevel = leaves;
    let levelIndex = 0;

    while (currentLevel.length > 1) {
        const nextLevel: string[] = [];
        levelIndex++;

        for (let i = 0; i < currentLevel.length; i += 2) {
            const left = currentLevel[i];
            const right = i + 1 < currentLevel.length ? currentLevel[i + 1] : left; // RFC 6962 duplicate odd
            const parentHash = sha256(left + right);
            nextLevel.push(parentHash);

            nodes.push({
                id: `node-${levelIndex}-${nextLevel.length - 1}`,
                level: levelIndex,
                hash: parentHash,
                isLeaf: false,
            });
        }
        levels.push(nextLevel);
        currentLevel = nextLevel;
    }

    const root = currentLevel[0];

    // Generate Merkle inclusion proofs for every leaf
    const proofs: Record<number, MerkleProofStep[]> = {};
    for (let leafIdx = 0; leafIdx < leaves.length; leafIdx++) {
        const proof: MerkleProofStep[] = [];
        let indexInLevel = leafIdx;

        for (let lvl = 0; lvl < levels.length - 1; lvl++) {
            const levelNodes = levels[lvl];
            const isRightChild = indexInLevel % 2 === 1;
            const siblingIdx = isRightChild ? indexInLevel - 1 : indexInLevel + 1;

            if (siblingIdx < levelNodes.length) {
                proof.push({
                    position: isRightChild ? "left" : "right",
                    hash: levelNodes[siblingIdx],
                });
            } else {
                // Odd element paired with itself
                proof.push({
                    position: "right",
                    hash: levelNodes[indexInLevel],
                });
            }

            indexInLevel = Math.floor(indexInLevel / 2);
        }
        proofs[leafIdx] = proof;
    }

    return {
        root,
        leaves,
        leafData: items,
        levels,
        nodes,
        proofs,
    };
}

/**
 * Verifies a Merkle inclusion proof: recomputes parent hashes from leaf to root.
 */
export function verifyMerkleProof(leafHash: string, proof: MerkleProofStep[], expectedRoot: string): boolean {
    let current = leafHash;
    for (const step of proof) {
        if (step.position === "left") {
            current = sha256(step.hash + current);
        } else {
            current = sha256(current + step.hash);
        }
    }
    return current === expectedRoot;
}
