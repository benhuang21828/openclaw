
import { S3Client, GetObjectCommand, PutObjectCommand } from "@aws-sdk/client-s3";
import { NextResponse } from "next/server";

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

export async function GET() {
    try {
        const command = new GetObjectCommand({
            Bucket: R2_BUCKET_NAME,
            Key: "config.json",
        });

        const response = await s3.send(command);
        const str = await response.Body?.transformToString();

        if (!str) {
            // Default
            return NextResponse.json({ monitor_active: true });
        }

        const config = JSON.parse(str);
        return NextResponse.json(config);
    } catch (e: any) {
        console.error("Error fetching config:", e);
        // Default check fail
        return NextResponse.json({ monitor_active: false, error: e.message });
    }
}

export async function POST(req: Request) {
    try {
        const body = await req.json();

        const command = new PutObjectCommand({
            Bucket: R2_BUCKET_NAME,
            Key: "config.json",
            Body: JSON.stringify(body, null, 2),
            ContentType: "application/json",
        });

        await s3.send(command);

        return NextResponse.json({ success: true });
    } catch (e: any) {
        console.error("Error saving config:", e);
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}
