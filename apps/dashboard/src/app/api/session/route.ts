import { NextResponse } from "next/server";
import { createDocument } from "../../../lib/boardroom";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";

// Force Node.js runtime for googleapis
export const runtime = "nodejs";

const R2_ACCOUNT_ID = process.env.R2_ACCOUNT_ID;
const R2_ACCESS_KEY_ID = process.env.R2_ACCESS_KEY_ID;
const R2_SECRET_ACCESS_KEY = process.env.R2_SECRET_ACCESS_KEY;
const R2_BUCKET_NAME = "molt-holdings";

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const newDocId = body.docId;

        if (!newDocId) {
            return NextResponse.json({ error: "No docId provided" }, { status: 400 });
        }

        const s3 = new S3Client({
            region: "auto",
            endpoint: `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
            credentials: {
                accessKeyId: R2_ACCESS_KEY_ID || "",
                secretAccessKey: R2_SECRET_ACCESS_KEY || "",
            },
        });

        // Fetch existing config.json to preserve monitor_active state
        let config: any = { monitor_active: true };
        try {
            const { GetObjectCommand } = await import("@aws-sdk/client-s3");
            const getCommand = new GetObjectCommand({
                Bucket: R2_BUCKET_NAME,
                Key: "config.json",
            });
            const response = await s3.send(getCommand);
            const str = await response.Body?.transformToString();
            if (str) {
                config = JSON.parse(str);
            }
        } catch (e) {
            console.log("No existing config.json found or failed to parse. Creating new one.");
        }

        // Update active_doc_id
        config.active_doc_id = newDocId;

        const putCommand = new PutObjectCommand({
            Bucket: R2_BUCKET_NAME,
            Key: "config.json",
            Body: JSON.stringify(config, null, 2),
            ContentType: "application/json",
        });

        await s3.send(putCommand);

        return NextResponse.json({ success: true, docId: newDocId });
    } catch (error: any) {
        console.error("Session Update Error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
