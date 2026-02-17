---
name: google-docs-writer
description: Tools for writing to Google Docs.
---

# Google Docs Writer

Use this tool to append text or update sections in a Google Doc.

## Setup
Requires `GOOGLE_APPLICATION_CREDENTIALS` pointing to a service account JSON key, or an OAuth setup.
Alternatively, configure `gog` and we might try to reuse its token (advanced).
For now, standard Google Auth.

## Scripts

### Append Text
Append text to the end of a document.
```bash
node openclaw/skills/google-docs-writer/scripts/append.js <docId> "Text to append"
```
