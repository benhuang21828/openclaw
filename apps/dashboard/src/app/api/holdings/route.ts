
import { S3Client, GetObjectCommand, PutObjectCommand } from "@aws-sdk/client-s3";
import { NextResponse } from "next/server";

// We use the S3 API to access Cloudflare R2
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
            Key: "holdings.csv",
        });

        const response = await s3.send(command);
        const str = await response.Body?.transformToString();

        if (!str) {
            return NextResponse.json({ holdings: [] });
        }

        // Parse CSV to JSON
        const lines = str.trim().split("\n");
        const headers = lines[0].split(",");
        const holdings = lines.slice(1).map(line => {
            const values = line.split(",");
            return headers.reduce((obj, header, index) => {
                obj[header.trim()] = values[index]?.trim();
                return obj;
            }, {} as any);
        });

        return NextResponse.json({ holdings });
    } catch (e: any) {
        console.error("Error fetching holdings:", e);
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}

export async function POST(req: Request) {
    try {
        const { holdings } = await req.json();

        // Convert JSON to CSV
        if (!holdings || !Array.isArray(holdings) || holdings.length === 0) {
            // Handle empty case
            return NextResponse.json({ success: true });
        }

        const headers = Object.keys(holdings[0]).join(",");
        const rows = holdings.map((h: any) => Object.values(h).join(",")).join("\n");
        const csv = `${headers}\n${rows}`;

        const command = new PutObjectCommand({
            Bucket: R2_BUCKET_NAME,
            Key: "holdings.csv",
            Body: csv,
            ContentType: "text/csv",
        });

        await s3.send(command);

        return NextResponse.json({ success: true });
    } catch (e: any) {
        console.error("Error saving holdings:", e);
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}
