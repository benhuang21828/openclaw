const topic = process.argv[2];

if (!topic) {
    console.error("Please provide a topic (e.g., 'Latest advancements in solid state batteries')");
    process.exit(1);
}

const API_KEY = process.env.GOOGLE_API_KEY || process.env.GOOGLE_GENERATIVE_AI_API_KEY; // Fallback if user reuses key
const CX = process.env.GOOGLE_CX;

if (!API_KEY || !CX) {
    console.error("Error: Missing GOOGLE_API_KEY or GOOGLE_CX environment variables.");
    console.error("Please enable 'Custom Search API' in Google Cloud Console and create a search engine.");
    process.exit(1);
}

async function research() {
    try {
        console.log(`Researching: ${topic}...`);

        const url = `https://customsearch.googleapis.com/customsearch/v1?key=${API_KEY}&cx=${CX}&q=${encodeURIComponent(topic)}`;
        const response = await fetch(url);

        if (!response.ok) {
            throw new Error(`Google Search API failed: ${response.status} ${response.statusText}`);
        }

        const data = await response.json();

        if (!data.items || data.items.length === 0) {
            console.log("No results found.");
            return;
        }

        console.log("\n## Search Results");

        data.items.slice(0, 5).forEach(item => {
            console.log(`- [${item.title}](${item.link})`);
            console.log(`  ${item.snippet.replace(/\n/g, ' ')}`);
            console.log("");
        });

    } catch (error) {
        console.error(`Error researching ${topic}:`, error.message);
        process.exit(1);
    }
}

research();
