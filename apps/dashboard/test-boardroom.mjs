import { google } from "googleapis";
import { S3Client, GetObjectCommand } from "@aws-sdk/client-s3";
import dotenv from "dotenv";
dotenv.config({ path: "./.env.local" });

const R2_ACCOUNT_ID = process.env.R2_ACCOUNT_ID;
const s3 = new S3Client({
    region: "auto",
    endpoint: `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
    credentials: {
        accessKeyId: process.env.R2_ACCESS_KEY_ID || "",
        secretAccessKey: process.env.R2_SECRET_ACCESS_KEY || "",
    },
});

async function run() {
    let docId = process.env.GOOGLE_DOC_ID;
    try {
        const command = new GetObjectCommand({ Bucket: "molt-holdings", Key: "config.json" });
        const response = await s3.send(command);
        const str = await response.Body?.transformToString();
        if (str) {
            const config = JSON.parse(str);
            if (config.active_doc_id) docId = config.active_doc_id;
        }
    } catch (e) {
        console.error("R2 Error:", e.name);
    }
    console.log("Resolved Doc ID:", docId);

    // Test Google Docs Auth
    const auth = new google.auth.GoogleAuth({
        credentials: {
            client_email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
            private_key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
        },
        scopes: ["https://www.googleapis.com/auth/documents", "https://www.googleapis.com/auth/drive"],
    });

    try {
        const docs = google.docs({ version: "v1", auth });
        const res = await docs.documents.get({ documentId: docId });
        console.log("Docs API Success:", res.data.title);
    } catch (e) {
        console.error("Docs API Error:", e.message);
    }
}
run();
