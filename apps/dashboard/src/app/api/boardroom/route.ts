import { NextResponse } from "next/server";
import { getBoardroomMessages, appendBoardroomMessage } from "../../../lib/boardroom";
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

async function getActiveDocId() {
    try {
        const command = new GetObjectCommand({
            Bucket: R2_BUCKET_NAME,
            Key: "config.json",
        });
        const response = await s3.send(command);
        const str = await response.Body?.transformToString();
        if (str) {
            const config = JSON.parse(str);
            if (config.active_doc_id) return config.active_doc_id;
        }
    } catch (e) {
        // Fallback to env var if config.json doesn't exist or doesn't have it
    }
    return process.env.GOOGLE_DOC_ID;
}

// Force Node.js runtime for googleapis
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
    try {
        const docId = await getActiveDocId();
        if (!docId) return NextResponse.json({ error: "Missing GOOGLE_DOC_ID" }, { status: 500 });

        const messages = await getBoardroomMessages(docId);

        // Fetch docs if folder ID is present
        let documents: any[] = [];
        const folderId = process.env.GOOGLE_DRIVE_FOLDER_ID;
        if (folderId) {
            const { listDocuments } = await import("../../../lib/boardroom");
            documents = await listDocuments(folderId);
        }

        return NextResponse.json({ messages, documents });
    } catch (error: any) {
        console.error("Boardroom GET Error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function POST(req: Request) {
    try {
        const docId = await getActiveDocId();
        if (!docId) return NextResponse.json({ error: "Missing GOOGLE_DOC_ID" }, { status: 500 });

        const { text, sender } = await req.json();
        await appendBoardroomMessage(docId, sender || "User", text);

        return NextResponse.json({ success: true });
    } catch (error: any) {
        console.error("Boardroom POST Error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
