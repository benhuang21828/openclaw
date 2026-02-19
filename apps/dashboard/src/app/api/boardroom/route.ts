import { NextResponse } from "next/server";
import { getBoardroomMessages, appendBoardroomMessage } from "../../../lib/boardroom";

// Force Node.js runtime for googleapis
export const runtime = "nodejs";

export async function GET() {
    try {
        const docId = process.env.GOOGLE_DOC_ID;
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
        const docId = process.env.GOOGLE_DOC_ID;
        if (!docId) return NextResponse.json({ error: "Missing GOOGLE_DOC_ID" }, { status: 500 });

        const { text, sender } = await req.json();
        await appendBoardroomMessage(docId, sender || "User", text);

        return NextResponse.json({ success: true });
    } catch (error: any) {
        console.error("Boardroom POST Error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
