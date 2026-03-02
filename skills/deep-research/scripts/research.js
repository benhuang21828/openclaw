const topic = process.argv[2];

if (!topic) {
    console.error("Please provide a topic (e.g., 'Latest advancements in solid state batteries')");
    process.exit(1);
}

const API_KEY = process.env.BRAVE_API_KEY;

if (!API_KEY) {
    console.error("Error: Missing BRAVE_API_KEY environment variable.");
    process.exit(1);
}

async function research() {
    try {
        console.log(`Researching: ${topic}...`);

        const url = `https://api.search.brave.com/res/v1/web/search?q=${encodeURIComponent(topic)}`;
        const response = await fetch(url, {
            headers: {
                "Accept": "application/json",
                "X-Subscription-Token": API_KEY
            }
        });

        if (!response.ok) {
            const errorText = await response.text().catch(() => '');
            throw new Error(`Brave Search API failed: ${response.status} ${response.statusText}. ${errorText}`);
        }

        const data = await response.json();

        if (!data.web || !data.web.results || data.web.results.length === 0) {
            console.log("No results found.");
            return;
        }

        console.log("\n## Search Results");

        data.web.results.slice(0, 5).forEach(item => {
            console.log(`- [${item.title}](${item.url})`);
            console.log(`  ${(item.description || '').replace(/\n/g, ' ')}`);
            console.log("");
        });

    } catch (error) {
        console.error(`Error researching ${topic}:`, error.message);
        process.exit(1);
    }
}

research();
