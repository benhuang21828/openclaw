import { google } from 'googleapis';
import { GoogleAuth } from 'google-auth-library';

const docId = process.argv[2];
const text = process.argv[3];

if (!docId || !text) {
    console.error('Usage: node append.js <docId> "Text to append"');
    process.exit(1);
}

async function appendText() {
    try {
        const auth = new GoogleAuth({
            scopes: ['https://www.googleapis.com/auth/documents'],
        });

        const client = await auth.getClient();
        const docs = google.docs({ version: 'v1', auth: client });

        // 1. Get document to find the end index
        const doc = await docs.documents.get({ documentId: docId });
        const content = doc.data.body.content;
        const endIndex = content[content.length - 1].endIndex - 1;

        // 2. Insert text at the end
        await docs.documents.batchUpdate({
            documentId: docId,
            requestBody: {
                requests: [
                    {
                        insertText: {
                            text: text + '\n',
                            location: {
                                index: endIndex,
                            },
                        },
                    },
                ],
            },
        });

        console.log(`Appended text to document: ${docId}`);
    } catch (error) {
        console.error('Error appending text:', error.message);
        if (error.message.includes('default credentials')) {
            console.error('Hint: Set GOOGLE_APPLICATION_CREDENTIALS to your service account key file.');
        }
        process.exit(1);
    }
}

appendText();
