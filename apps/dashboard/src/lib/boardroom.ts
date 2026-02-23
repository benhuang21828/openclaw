import { google } from "googleapis";
import path from "path";

// Scopes required for Google Docs
const SCOPES = ["https://www.googleapis.com/auth/documents", "https://www.googleapis.com/auth/drive"];

// Use the JSON file for auth
const KEY_FILE = path.join(process.cwd(), "service-account.json");

const auth = new google.auth.GoogleAuth({
    keyFile: KEY_FILE,
    scopes: SCOPES,
});

const docs = google.docs({ version: "v1", auth });

export async function getBoardroomMessages(docId: string) {
    const res = await docs.documents.get({ documentId: docId });
    const content = res.data.body?.content || [];
    const fullText = content
        .map((c) => c.paragraph?.elements?.map((e) => e.textRun?.content).join("") || "")
        .join("");

    // Parse messages in format [TIMESTAMP] [SENDER]: CONTENT
    const messageRegex = /\[(.*?)\] \[(.*?)\]: ([\s\S]*?)(?=\n\[|$)/g;
    const messages = [];
    let match;

    while ((match = messageRegex.exec(fullText)) !== null) {
        messages.push({
            timestamp: match[1],
            sender: match[2],
            content: match[3].trim(),
        });
    }

    return messages;
}

export async function appendBoardroomMessage(docId: string, sender: string, text: string) {
    const timestamp = new Date().toISOString();
    const entry = `\n[${timestamp}] [${sender}]: ${text}\n`;

    await docs.documents.batchUpdate({
        documentId: docId,
        requestBody: {
            requests: [
                {
                    insertText: {
                        text: entry,
                        endOfSegmentLocation: { segmentId: "" }, // End of body
                    },
                },
            ],
        },
    });
}

export async function createDocument(title: string, folderId?: string) {
    const drive = google.drive({ version: "v3", auth });

    try {
        const fileMetadata: any = {
            name: title,
            mimeType: "application/vnd.google-apps.document",
        };

        if (folderId) {
            fileMetadata.parents = [folderId];
        }

        const file = await drive.files.create({
            requestBody: fileMetadata,
            fields: "id, url",
        });

        return {
            id: file.data.id,
            url: `https://docs.google.com/document/d/${file.data.id}/edit`
        };
    } catch (error: any) {
        console.error("Error creating document:", error);
        throw new Error(`Failed to create document: ${error.message}`);
    }
}

export async function listDocuments(folderId: string) {
    if (!folderId) return [];

    const drive = google.drive({ version: "v3", auth });

    try {
        const query = `'${folderId}' in parents and mimeType = 'application/vnd.google-apps.document' and trashed = false`;
        const res = await drive.files.list({
            q: query,
            fields: "files(id, name, createdTime)",
            orderBy: "createdTime desc",
            pageSize: 20
        });

        return (res.data.files || []).map(f => ({
            id: f.id,
            name: f.name,
            url: `https://docs.google.com/document/d/${f.id}/edit`,
            createdTime: f.createdTime
        }));
    } catch (error) {
        console.error("Error listing docs:", error);
        return [];
    }
}
