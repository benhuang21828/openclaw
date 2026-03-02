import { S3Client, PutObjectCommand, GetObjectCommand } from "@aws-sdk/client-s3";

// Ensure we are using Node.js runtime for AWS SDK compatibility in Next.js
export const runtime = "nodejs";

const R2_ACCOUNT_ID = process.env.R2_ACCOUNT_ID;
const R2_ACCESS_KEY_ID = process.env.R2_ACCESS_KEY_ID;
const R2_SECRET_ACCESS_KEY = process.env.R2_SECRET_ACCESS_KEY;
const R2_BUCKET_NAME = "molt-holdings";

const s3 = new S3Client({
    region: "auto",
    endpoint: `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
    credentials: {
        accessKeyId: R2_ACCESS_KEY_ID || "",
        secretAccessKey: R2_SECRET_ACCESS_KEY || "",
    },
});

export const AGENT_SEQUENCE = [
    "translator",
    "researcher",
    "monitor",
    "equity-researcher",
    "risk-world",       // We'll run them sequentially for simplicity in this V1 map
    "risk-portfolio",
    "scorer"
];

const WORKER_BASE_URL = "https://moltbot-{agent}.benhuang21828.workers.dev";

export interface OrchestratorState {
    contextId: string;
    thesis: string;
    currentAgent: string;
    status: "running" | "completed" | "error" | "paused";
    results: Record<string, string>; // Store what each agent returns
}

export async function writeState(contextId: string, state: OrchestratorState) {
    const command = new PutObjectCommand({
        Bucket: R2_BUCKET_NAME,
        Key: `orchestrator/${contextId}.json`,
        Body: JSON.stringify(state, null, 2),
        ContentType: "application/json",
    });
    await s3.send(command);
}

export async function readState(contextId: string): Promise<OrchestratorState | null> {
    try {
        const command = new GetObjectCommand({
            Bucket: R2_BUCKET_NAME,
            Key: `orchestrator/${contextId}.json`,
        });
        const response = await s3.send(command);
        const str = await response.Body?.transformToString();
        if (str) {
            return JSON.parse(str) as OrchestratorState;
        }
    } catch (e: any) {
        if (e.name === "NoSuchKey") return null;
        console.error("Error reading state:", e);
    }
    return null;
}

export async function checkScratchpadFinished(contextId: string, agent: string): Promise<string | null> {
    try {
        const command = new GetObjectCommand({
            Bucket: R2_BUCKET_NAME,
            Key: `scratchpads/${contextId}/${agent}.json`,
        });
        const response = await s3.send(command);
        const str = await response.Body?.transformToString();
        if (str) {
            const logs: any[] = JSON.parse(str);
            // Look for a log event of type 'final_response'
            for (let i = logs.length - 1; i >= 0; i--) {
                if (logs[i].type === "final_response") {
                    return logs[i].data?.text || "Finished without text";
                }
            }
        }
    } catch (e: any) {
        // If file doesn't exist, agent hasn't even started or written yet
    }
    return null;
}

export function fireAgentAsync(agent: string, contextId: string, task: string) {
    // Fire and forget fetch request
    const url = WORKER_BASE_URL.replace("{agent}", agent);
    console.log(`Firing async request to ${url} for task: [${contextId}]`);

    fetch(`${url}/invoke`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ task, context_id: contextId })
    }).catch(err => {
        console.error(`Failed to invoke agent ${agent}:`, err);
    });
}
