import { Storage } from "@google-cloud/storage";
import fs from "fs";
import path from "path";

function parseEnv(filePath) {
  const content = fs.readFileSync(filePath, "utf-8");
  const env = {};
  content.split("\n").forEach(line => {
    const match = line.match(/^([^=]+)=(.*)$/);
    if (match) {
      let val = match[2];
      // strip surrounding quotes if present
      if (val.startsWith('"') && val.endsWith('"')) {
          val = val.slice(1, -1);
      }
      env[match[1]] = val;
    }
  });
  return env;
}

async function run() {
    const env = parseEnv(path.resolve(".env.local"));
    console.log("Testing GCS Upload...");
    console.log("Bucket:", env.GCS_BUCKET_NAME);
    console.log("Project:", env.GCS_PROJECT_ID);

    try {
        const storage = new Storage({
            projectId: env.GCS_PROJECT_ID,
            credentials: {
                client_email: env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
                private_key: env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
            }
        });
        
        const bucket = storage.bucket(env.GCS_BUCKET_NAME);
        const mdFile = bucket.file(`runs/test-connection/coordinator.md`);
        
        console.log("Attempting to write file...");
        await mdFile.save(`# Test Connection\n\nIf you can read this, GCS is working!`);
        
        console.log("Upload Success!");
        console.log(`URL: https://storage.googleapis.com/${env.GCS_BUCKET_NAME}/runs/test-connection/coordinator.md`);
        
    } catch (e) {
        console.error("GCS Upload Error:", e.message);
    }
}
run();
