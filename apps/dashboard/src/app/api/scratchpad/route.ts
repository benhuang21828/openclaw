import { NextResponse } from "next/server";
import { S3Client, GetObjectCommand } from "@aws-sdk/client-s3";

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

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: Request) {
    try {
        const url = new URL(req.url);
        const contextId = url.searchParams.get("context_id");
        const agent = url.searchParams.get("agent");

        if (!contextId || !agent) {
            return NextResponse.json({ error: "context_id and agent are required" }, { status: 400 });
        }

        const command = new GetObjectCommand({
            Bucket: R2_BUCKET_NAME,
            Key: `scratchpads/${contextId}/${agent}.json`,
        });

        const response = await s3.send(command);
        const str = await response.Body?.transformToString();

        if (str) {
            return NextResponse.json(JSON.parse(str));
        }

        // If file exists but empty
        return NextResponse.json([]);
    } catch (e: any) {
        // Normal behavior: agent hasn't created the file yet.
        if (e.name === "NoSuchKey") {
            return NextResponse.json([]);
        }
        console.error("Scratchpad GET Error:", e);
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}
