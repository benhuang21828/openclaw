import { google } from "googleapis";
import * as dotenv from "dotenv";
dotenv.config();

async function test() {
    console.log("Starting test...");
    const auth = new google.auth.GoogleAuth({
        keyFile: "./service-account.json",
        scopes: ["https://www.googleapis.com/auth/documents", "https://www.googleapis.com/auth/drive"],
    });

    const drive = google.drive({ version: "v3", auth });
    const folderId = process.env.GOOGLE_DRIVE_FOLDER_ID;

    console.log("Using folder ID:", folderId);

    try {
        const file = await drive.files.create({
            requestBody: {
                name: "Test Doc from Script",
                mimeType: "application/vnd.google-apps.document",
                parents: folderId ? [folderId] : undefined,
            },
            fields: "id, url",
            supportsAllDrives: true
        });
        console.log("Success! ID:", file.data.id);
    } catch (e: any) {
        console.error("Error creating doc:", e.message);
        if (e.response && e.response.data) {
            console.error("Details:", JSON.stringify(e.response.data.error, null, 2));
        }
    }
}

test();
